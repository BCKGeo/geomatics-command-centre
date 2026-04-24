#!/usr/bin/env python3
"""Triage flagged COUNCIL_PLATFORM URLs.

Reads diff/municipal_url_normalize/_flagged.tsv (province, name, bucket,
current_url) and for each row tries a deterministic set of candidate
municipality front-door URLs. HEAD-then-GET verifies each candidate; a
candidate is accepted only when the post-redirect final URL returns 2xx,
has a hostname that matches the municipality slug, and is not on a
council-platform domain.

Writes decisions to diff/municipal_url_normalize/_triage_decisions.tsv.
Does NOT modify any research JSON. Dry-run only.
"""
from __future__ import annotations

import csv
import re
import ssl
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FLAGGED = ROOT / "diff" / "municipal_url_normalize" / "_flagged.tsv"
OUT = ROOT / "diff" / "municipal_url_normalize" / "_triage_decisions.tsv"

TIMEOUT = 10
POLITE_DELAY_SEC = 0.15
USER_AGENT = "Mozilla/5.0 (compatible; BCKGeoMuniAudit/1.0)"

PLATFORM_SUFFIXES = (
    ".escribemeetings.com",
    ".civicweb.net",
    ".icompasscanada.com",
    ".civicplus.com",
    ".civicclerk.com",
    ".iqm2.com",
    ".legistar.com",
    ".granicus.com",
    ".municode.com",
    ".civiclive.com",
)

PLATFORM_HOSTS_CONTAINING = (
    "escribemeetings",
    "civicweb",
    "icompasscanada",
    "civicplus",
    "civicclerk",
    "civiclive",
    "granicus",
    "legistar",
    "municode",
)

NAME_STRIP_PREFIXES = (
    "regional municipality of ",
    "corporation of ",
    "township of ",
    "municipality of ",
    "district of ",
    "county of ",
    "village of ",
    "town of ",
    "city of ",
    "the ",
)


def strip_accents(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s)
    return nfkd.encode("ascii", "ignore").decode("ascii")


def slug_from_hostname(hostname: str) -> str | None:
    if not hostname:
        return None
    h = hostname.lower()
    # strip trailing dots
    h = h.rstrip(".")
    # if platform domain, extract the leftmost label and strip pub- prefix
    for suf in PLATFORM_SUFFIXES:
        if h.endswith(suf):
            head = h[: -len(suf)]
            # head may be something like "pub-burnaby"
            head = head.split(".")[-1]
            if head.startswith("pub-"):
                head = head[4:]
            return head or None
    # if ends in .ca, take leftmost non-www label
    labels = h.split(".")
    if len(labels) >= 2 and labels[-1] == "ca":
        # skip www
        idx = 0
        while idx < len(labels) - 2 and labels[idx] in ("www",):
            idx += 1
        cand = labels[idx]
        if cand.startswith("pub-"):
            cand = cand[4:]
        return cand or None
    # fallback: leftmost label
    cand = labels[0]
    if cand.startswith("pub-"):
        cand = cand[4:]
    return cand or None


def slugs_from_name(name: str) -> list[str]:
    s = strip_accents(name).lower().strip()
    # normalise punctuation
    s = s.replace("'", "").replace("\u2019", "")
    # strip known prefixes (longest first, already ordered)
    for pfx in NAME_STRIP_PREFIXES:
        if s.startswith(pfx):
            s = s[len(pfx):]
            break
    # collapse multiple spaces
    s = re.sub(r"\s+", " ", s).strip()
    # keep only letters, digits, spaces, hyphens
    s = re.sub(r"[^a-z0-9\s\-]", "", s)
    if not s:
        return []
    collapsed = s.replace(" ", "").replace("-", "")
    hyphenated = s.replace(" ", "-")
    variants = []
    for v in (collapsed, hyphenated):
        if v and v not in variants:
            variants.append(v)
    return variants


def build_candidates(current_url: str, name: str) -> list[tuple[str, str]]:
    """Return ordered list of (candidate_url, kind) to try.

    kind is "plain" for bare {slug}.ca / www.{slug}.ca, or "admin" for
    admin-prefix variants (cityof{slug}.ca, etc.) which need extra
    verification to avoid squatter/lander domains.
    """
    slugs: list[str] = []
    try:
        host = urllib.parse.urlparse(current_url).hostname or ""
    except Exception:
        host = ""
    hs = slug_from_hostname(host)
    if hs:
        slugs.append(hs)
    for s in slugs_from_name(name):
        if s not in slugs:
            slugs.append(s)
    # dedupe while preserving order
    seen: set[str] = set()
    final_slugs = []
    for s in slugs:
        if s and s not in seen:
            seen.add(s)
            final_slugs.append(s)

    candidates: list[tuple[str, str]] = []
    plain_patterns = ("https://www.{s}.ca", "https://{s}.ca")
    admin_patterns = (
        "https://www.cityof{s}.ca",
        "https://www.townof{s}.ca",
        "https://www.districtof{s}.ca",
        "https://www.townshipof{s}.ca",
        "https://cityof{s}.ca",
        "https://townof{s}.ca",
    )
    # Try ALL plain variants first for every slug, then admin variants.
    for s in final_slugs:
        for p in plain_patterns:
            u = p.format(s=s)
            if (u, "plain") not in candidates:
                candidates.append((u, "plain"))
    for s in final_slugs:
        for p in admin_patterns:
            u = p.format(s=s)
            if (u, "admin") not in candidates:
                candidates.append((u, "admin"))
    return candidates


def host_is_platform(host: str) -> bool:
    h = (host or "").lower()
    for suf in PLATFORM_SUFFIXES:
        if h.endswith(suf):
            return True
    for frag in PLATFORM_HOSTS_CONTAINING:
        if frag in h:
            return True
    if h.startswith("pub-"):
        return True
    return False


def host_matches_slug(host: str, slug: str) -> bool:
    h = (host or "").lower()
    s = slug.lower()
    if not h or not s:
        return False
    labels = h.split(".")
    if len(labels) < 2 or labels[-1] != "ca":
        return False
    # match if any label equals slug, or contains slug as a substring where
    # only admin prefixes/suffixes differ (cityof, townof, districtof, etc.)
    for label in labels[:-1]:  # all labels except the TLD
        if label == s:
            return True
        # admin-prefix variants
        for prefix in ("cityof", "townof", "districtof", "townshipof",
                       "municipalityof", "villageof", "countyof", "regionof"):
            if label == prefix + s:
                return True
        # www or other generic subdomains are handled by iterating labels
    return False


class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Standard redirect handler but capped to avoid loops."""

    max_redirections = 7


def _build_opener() -> urllib.request.OpenerDirector:
    ctx = ssl.create_default_context()
    https = urllib.request.HTTPSHandler(context=ctx)
    return urllib.request.build_opener(https, SafeRedirectHandler())


OPENER = _build_opener()


def probe(url: str, want_body: bool = False) -> tuple[int | None, str | None, str | None, str | None]:
    """Probe url with HEAD then GET.

    Returns (status, final_url, error_code, body_snippet). body_snippet is
    only populated on a 2xx GET and only when want_body=True (up to 8 KiB
    of decoded text).
    """
    for method in ("HEAD", "GET"):
        if want_body and method == "HEAD":
            continue  # skip HEAD; go straight to GET
        try:
            req = urllib.request.Request(
                url,
                method=method,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-CA,en;q=0.9",
                },
            )
            with OPENER.open(req, timeout=TIMEOUT) as resp:
                status = resp.status
                final = resp.geturl()
                body = None
                if method == "GET":
                    try:
                        raw = resp.read(8192)
                        body = raw.decode("utf-8", "replace") if raw else ""
                    except Exception:
                        body = ""
                if 200 <= status < 300:
                    return status, final, None, body
                # non-2xx from HEAD: try GET next
                if method == "HEAD":
                    continue
                return status, final, f"HTTP_{status}", body
        except urllib.error.HTTPError as e:
            if method == "HEAD":
                continue
            return e.code, e.url if hasattr(e, "url") else None, f"HTTP_{e.code}", None
        except urllib.error.URLError as e:
            reason = str(getattr(e, "reason", e))
            lower = reason.lower()
            if "timed out" in lower or "timeout" in lower:
                code = "TIMEOUT"
            elif "name or service" in lower or "nodename nor servname" in lower \
                    or "getaddrinfo" in lower or "no address" in lower \
                    or "name resolution" in lower \
                    or "11001" in lower or "11002" in lower \
                    or "11003" in lower or "11004" in lower:
                code = "DNS_FAIL"
            elif "certificate" in lower or "ssl" in lower:
                code = "SSL_FAIL"
            else:
                code = "URL_ERROR"
            if method == "HEAD":
                continue
            return None, None, code, None
        except TimeoutError:
            if method == "HEAD":
                continue
            return None, None, "TIMEOUT", None
        except Exception as e:
            if method == "HEAD":
                continue
            return None, None, f"EXC_{type(e).__name__}", None
    return None, None, "NO_RESPONSE", None


LANDER_MARKERS = (
    "window.location.href=\"/lander\"",
    "window.location.href='/lander'",
    "/lander",
    "domain is for sale",
    "this domain is parked",
    "parked domain",
    "hugedomains",
    "buy this domain",
    "related searches",
    "godaddy",
    "go daddy",
    "dan.com",
    "sedo.com",
    "afternic",
)


def body_looks_municipal(body: str, slug: str, name: str) -> bool:
    """Heuristic: does the HTML body look like a real municipality site?

    - Must NOT contain obvious parking/lander markers.
    - Should contain the slug OR a word from the municipality name in the
      title or visible content (case-insensitive).
    """
    if not body:
        return False
    low = body.lower()
    for mark in LANDER_MARKERS:
        if mark in low:
            return False
    # require reasonable HTML length (parking pages are tiny)
    if len(body) < 500:
        return False
    # look for slug or name fragment appearing in the body
    s = slug.lower()
    if s and s in low:
        return True
    n = strip_accents(name).lower()
    # take the longest "word" in the name (e.g. "Niagara-on-the-Lake" -> "niagara")
    words = re.findall(r"[a-z]{4,}", n)
    words.sort(key=len, reverse=True)
    for w in words[:3]:
        if w in low:
            return True
    return False


def triage_row(province: str, name: str, current_url: str) -> dict:
    candidates = build_candidates(current_url, name)
    slugs: list[str] = []
    try:
        host = urllib.parse.urlparse(current_url).hostname or ""
    except Exception:
        host = ""
    hs = slug_from_hostname(host)
    if hs:
        slugs.append(hs)
    for s in slugs_from_name(name):
        if s not in slugs:
            slugs.append(s)

    if not candidates:
        return {"decision": "DEFER", "proposed_url": "", "reason": "NO_SLUG"}

    last_reason = "NO_CANDIDATE_VERIFIED"
    # Track whether any plain-slug candidate got *any* HTTP response. If so,
    # the plain host exists (even if it 403-blocked our UA) and we should
    # NOT fall through to admin-prefix squatter variants.
    plain_host_responded = False
    for cand_url, cand_kind in candidates:
        # For admin candidates we need the body to confirm legitimacy.
        # For plain candidates a HEAD/GET 2xx is sufficient.
        need_body = (cand_kind == "admin")
        if cand_kind == "admin" and plain_host_responded:
            last_reason = "PLAIN_HOST_RESPONDED_SKIP_ADMIN"
            continue
        status, final, err, body = probe(cand_url, want_body=need_body)
        time.sleep(POLITE_DELAY_SEC)

        if cand_kind == "plain":
            # Record that this slug's plain host exists in ANY form.
            # DNS_FAIL means domain doesn't exist; anything else means it does.
            if err and err not in ("DNS_FAIL",):
                plain_host_responded = True
            elif status is not None:
                plain_host_responded = True

        if err:
            last_reason = err
            continue
        if status is None or not (200 <= status < 300):
            last_reason = f"HTTP_{status}" if status else "NO_RESPONSE"
            continue
        if not final:
            last_reason = "NO_FINAL_URL"
            continue
        try:
            final_host = urllib.parse.urlparse(final).hostname or ""
        except Exception:
            final_host = ""
        if host_is_platform(final_host):
            last_reason = "LANDED_ON_PLATFORM"
            continue
        matched = any(host_matches_slug(final_host, s) for s in slugs)
        if not matched:
            last_reason = f"HOST_MISMATCH:{final_host}"
            continue
        # For admin-prefix domains, require body verification.
        if cand_kind == "admin":
            primary_slug = slugs[0] if slugs else ""
            if body is None:
                # fetch body via GET
                _, _, _, body = probe(final, want_body=True)
                time.sleep(POLITE_DELAY_SEC)
            if not body_looks_municipal(body or "", primary_slug, name):
                last_reason = "ADMIN_BODY_UNVERIFIED"
                continue
        return {"decision": "REWRITE", "proposed_url": final, "reason": "OK_2XX"}
    return {"decision": "DEFER", "proposed_url": "", "reason": last_reason}


def main(argv: list[str]) -> int:
    if not FLAGGED.exists():
        print(f"ERROR: flagged TSV not found at {FLAGGED}", file=sys.stderr)
        return 2
    OUT.parent.mkdir(parents=True, exist_ok=True)

    with FLAGGED.open(encoding="utf-8", newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader, None)
        rows = [r for r in reader if r and len(r) >= 4]

    if not rows:
        print("No flagged rows found; nothing to triage.", file=sys.stderr)
        return 1

    print(f"Triaging {len(rows)} flagged rows...", file=sys.stderr)
    decisions: list[dict] = []
    per_province: dict[str, dict[str, int]] = {}
    for i, (province, name, bucket, current_url) in enumerate(rows, start=1):
        res = triage_row(province, name, current_url)
        decisions.append({
            "province": province,
            "name": name,
            "current_url": current_url,
            "decision": res["decision"],
            "proposed_url": res["proposed_url"],
            "reason": res["reason"],
        })
        per_province.setdefault(province, {"REWRITE": 0, "DEFER": 0})[res["decision"]] += 1
        if i % 10 == 0 or i == len(rows):
            print(f"  {i}/{len(rows)} processed", file=sys.stderr)

    # write decisions TSV
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(["province", "name", "current_url", "decision",
                    "proposed_url", "reason"])
        for d in decisions:
            w.writerow([d["province"], d["name"], d["current_url"],
                        d["decision"], d["proposed_url"], d["reason"]])

    total_rewrite = sum(1 for d in decisions if d["decision"] == "REWRITE")
    total_defer = sum(1 for d in decisions if d["decision"] == "DEFER")
    print("")
    print(f"Total: {len(decisions)} | REWRITE: {total_rewrite} | DEFER: {total_defer}")
    print("Per-province:")
    for prov in sorted(per_province):
        st = per_province[prov]
        print(f"  {prov}: REWRITE={st.get('REWRITE',0)} DEFER={st.get('DEFER',0)}")
    print("")
    print("Sample REWRITES (up to 5):")
    rw = [d for d in decisions if d["decision"] == "REWRITE"][:5]
    for d in rw:
        print(f"  [{d['province']}] {d['name']}: {d['current_url']} -> {d['proposed_url']}")
    print("")
    print(f"Wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
