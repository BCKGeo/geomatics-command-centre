// Career area data (direction record item 3): certification pathways and the
// reading list. Every requirement that changes what someone does (a number of
// months or hours, an exam, a pass mark, an age, a fee) carries the id of the
// certifying body's own page in SOURCES, read on the date shown, or is marked
// unverified: true and the UI says so. Nothing here is a blog or a summary.

export const SOURCES = {
  asttbc_apply: { n: "ASTTBC, AScT and CTech applicants", u: "https://asttbc.org/applicants/applied-science-technologists-certified-technicians/", read: "2026-10-31" },
  asttbc_exams: { n: "ASTTBC, exams", u: "https://asttbc.org/applicants/exams/", read: "2026-10-31" },
  asttbc_cpd: { n: "ASTTBC, continuing professional development", u: "https://asttbc.org/registrants/continuing-professional-development/", read: "2026-10-31" },
  abcls_apply: { n: "ABCLS, how to apply", u: "https://abcls.ca/page/how-to-apply", read: "2026-10-31" },
  cbeps_apply: { n: "CBEPS, candidate applications", u: "https://cbeps-cceag.ca/candidate-applications/", read: "2026-10-31" },
  acls_join: { n: "ACLS, becoming a CLS", u: "https://www.acls-aatc.ca/en/join-acls-1010", read: "2026-10-31" },
  tc_categories: { n: "Transport Canada, operation categories and pilot certificates", u: "https://tc.canada.ca/en/aviation/drone-safety/learn-rules-you-fly-your-drone/drone-operation-categories-pilot-certificates", read: "2026-10-31" },
  tc_exam: { n: "Transport Canada, Advanced exam", u: "https://tc.canada.ca/en/aviation/drone-safety/drone-pilot-licensing/take-drone-pilot-online-exam/advanced", read: "2026-10-31" },
  tc_review: { n: "Transport Canada, flight review", u: "https://tc.canada.ca/en/aviation/drone-safety/drone-pilot-licensing/complete-flight-review-drones", read: "2026-10-31" },
  tc_recency: { n: "Transport Canada, keep your drone pilot skills", u: "https://tc.canada.ca/en/aviation/drone-safety/drone-pilot-licensing/keep-your-drone-pilot-skills", read: "2026-10-31" },
};

// Each pathway: ordered steps. A step cites a SOURCES id (cite) or is
// unverified. "d" is the requirement in the body's own terms.
export const PATHWAYS = [
  {
    id: "asct",
    title: "AScT",
    full: "Applied Science Technologist",
    body: "ASTTBC (BC)",
    home: "https://asttbc.org/",
    k: "asct technologist asttbc ctech technician",
    steps: [
      { t: "Education", d: "A two-year accredited diploma in applied science or engineering technology, or equivalent plus a certification exam. Three pathways: accredited program, accredited program in another discipline, non-accredited education.", cite: "asttbc_apply" },
      { t: "Work experience", d: "24 months (3,600 hours) of progressive, relevant experience, at least 12 months (1,800 hours) at the technologist or technician profile of practice or higher. A competency summary signed by a supervisor who is also listed as a technical reference.", cite: "asttbc_apply" },
      { t: "Apply", d: "Online account, documents, non-refundable application fee. Completeness review, two volunteer reviewers, then the Credentials Committee. English proficiency, legal right to work in Canada and good character are checked.", cite: "asttbc_apply" },
      { t: "Professional Practice and Ethics exam", d: "Online, open book to the bylaws, Code of Ethics and Professional Governance Act. 60 questions, 2 hours, pass mark 80.0%. Taken after the other requirements are met.", cite: "asttbc_exams" },
      { t: "Technical exam, if required", d: "For non-accredited education, a different discipline, or CTech to AScT. 110 multiple choice (10 unscored), 3 hours, closed book, pass mark set per exam. Exam fee $300 plus GST per attempt, three attempts.", cite: "asttbc_exams" },
      { t: "Register and keep CPD", d: "Pay annual fees to go on the public register. CPD: 12 hours per cycle (1 June to 31 May), recorded in the ASTTBC account, with 2 hours of Indigenous awareness in the first year for new registrants.", cite: "asttbc_cpd" },
    ],
  },
  {
    id: "bcls",
    title: "BCLS",
    full: "British Columbia Land Surveyor",
    body: "ABCLS",
    home: "https://abcls.ca/",
    k: "bcls land surveyor abcls articling commission",
    steps: [
      { t: "Degree", d: "A bachelor's degree in geomatics. BCIT, University of Calgary and University of New Brunswick are accredited or have course exemptions with CBEPS. A diploma or another field is possible with gap-filling set by CBEPS.", cite: "abcls_apply" },
      { t: "CBEPS Certificate of Completion", d: "Apply to CBEPS with transcripts sent by the institution, photo ID and the fee ($250 for exempt programs, $500 otherwise). Minimum entry is a two-year or longer geomatics program. Processing 4 to 6 weeks.", cite: "cbeps_apply" },
      { t: "Articles", d: "Register with ABCLS as a land surveyor in training and article under an experienced BCLS for a minimum of 12 months, developing the competencies in Board Policy 6.11.", cite: "abcls_apply" },
      { t: "Professional exam and assessment interview", d: "The ABCLS professional exam and professional assessment interview on applying knowledge and judgment to real land surveying problems.", cite: "abcls_apply" },
      { t: "Oath and continuing education", d: "Take the oath or affirmation and join the continuing education program for the rest of your career.", cite: "abcls_apply" },
      { t: "Fees and exam pass marks", d: "Not stated on the ABCLS page read. Ask the ABCLS registrar.", unverified: true },
    ],
  },
  {
    id: "cls",
    title: "CLS",
    full: "Canada Lands Surveyor",
    body: "ACLS (federal, Canada Lands)",
    home: "https://www.acls-aatc.ca/",
    k: "cls canada lands surveyor acls commission federal",
    steps: [
      { t: "CBEPS Certificate of Completion", d: "Direct entry starts with the CBEPS certificate (see the BCLS pathway for how to apply). Holders of a provincial commission use the labour mobility pathway instead and skip to membership and licence.", cite: "acls_join" },
      { t: "Register as a candidate", d: "Register as a direct entry candidate, pay the fee, and file the Application for Training Period. The mandatory preparation training program is listed as coming soon (pathway effective 1 January 2026).", cite: "acls_join" },
      { t: "Two years of practice and a project report", d: "Two years of practical experience as an ACLS student member, plus a project report to the Candidate Handbook guidelines. No online written exams under direct entry.", cite: "acls_join" },
      { t: "Professional Practice Interview", d: "Two hours before a three-member Board of Examiners panel. The Board then recommends the commission to Council.", cite: "acls_join" },
      { t: "Membership, licence, oath", d: "Apply for regular membership and a licence (training and experience affidavit, proof of insurance), take the oath, and be added to a company or entity permit.", cite: "acls_join" },
      { t: "Onboarding period", d: "6 to 24 months for new licensees from 1 December 2025: the Getting It Right workshop and a mandatory practice review.", cite: "acls_join" },
      { t: "Fees", d: "Referenced on the ACLS page but no amounts are given.", unverified: true },
    ],
  },
  {
    id: "rpas",
    title: "RPAS Advanced",
    full: "Pilot Certificate, Advanced Operations",
    body: "Transport Canada",
    home: "https://tc.canada.ca/en/aviation/drone-safety/drone-pilot-licensing",
    k: "rpas drone pilot certificate advanced transport canada flight review exam",
    steps: [
      { t: "Who needs it", d: "Advanced operations: near or over people, in controlled airspace with ATC permission, and medium drones (over 25 kg to 150 kg), each subject to the drone's safety feature requirements. Minimum age 16.", cite: "tc_categories" },
      { t: "Advanced exam", d: "Online in the Drone Management Portal. 50 multiple choice, 60 minutes, pass mark 80%. Retake after 24 hours, as often as needed, same fee each attempt. Keep the reference number.", cite: "tc_exam" },
      { t: "Exam fee", d: "The Transport Canada exam page read shows no amount. The fee is charged in the Drone Management Portal.", unverified: true },
      { t: "Flight review", d: "With a Transport Canada approved flight reviewer at a self-declared drone flight school. Skills are in TP 15263 Appendix A. The reviewer sets the price and files the result online within 24 hours.", cite: "tc_review" },
      { t: "Apply for the certificate", d: "After passing both, apply in the Drone Management Portal. The certificate is needed to fly any drone from 250 g to 150 kg in advanced operations.", cite: "tc_review" },
      { t: "Recency, every 24 months", d: "Within the previous 24 months: pass the exam again, pass a flight review, or complete one training activity (an endorsed safety seminar, a flight school recurrent program, or an endorsed self-paced study program).", cite: "tc_recency" },
    ],
  },
];

// Primary references only: standards bodies, regulators, the law itself.
export const READING = [
  { n: "Canadian Spatial Reference System (CSRS)", d: "NRCan's definition of the national horizontal, height and gravity reference. Start here for NAD83(CSRS), epochs and CGVD2013.", u: "https://natural-resources.canada.ca/science-data/science-research/geomatics/geodetic-reference-systems/canadian-spatial-reference-system-csrs", by: "NRCan", read: "2026-10-31" },
  { n: "CARs Part IX, Remotely Piloted Aircraft Systems", d: "The regulation itself, sections 900.01 onward. Everything Transport Canada's drone pages summarize is here in full.", u: "https://laws-lois.justice.gc.ca/eng/regulations/sor-96-433/page-112.html", by: "Justice Laws", read: "2026-10-31" },
  { n: "TC AIM, RPA chapter (TP 14371)", d: "Transport Canada's Aeronautical Information Manual, 2026-2 edition, the RPA chapter is the operational companion to Part IX.", u: "https://tc.canada.ca/en/aviation/publications/transport-canada-aeronautical-information-manual-tc-aim-tp-14371", by: "Transport Canada", read: "2026-10-31" },
  { n: "ASPRS Positional Accuracy Standards, Edition 2", d: "The accuracy standard for digital geospatial data (RMSE classes, checkpoint rules) that lidar and photogrammetry deliverables are specified against. ASPRS public documents link, redirects to their PDF.", u: "https://publicdocuments.asprs.org/PositionalAccuracyStd-Ed2-V2", by: "ASPRS", read: "2026-10-31" },
  { n: "Canada Lands Surveys Act", d: "RSC 1985, c. L-6. The statute for surveys on Canada Lands: reserves, territories, national parks, offshore.", u: "https://laws-lois.justice.gc.ca/eng/acts/l-6/", by: "Justice Laws", read: "2026-10-31" },
  { n: "Canada Lands Surveyors Act", d: "SC 1998, c. 14. Establishes ACLS and the CLS commission.", u: "https://laws-lois.justice.gc.ca/eng/acts/l-5.8/", by: "Justice Laws", read: "2026-10-31" },
  { n: "CBEPS syllabus and exams", d: "The academic syllabus every land surveyor outside Quebec is examined against. A new national syllabus is fully in place after the October 2026 session.", u: "https://cbeps-cceag.ca/2023-syllabus/", by: "CBEPS", read: "2026-10-31" },
];

// Land surveyor regulators per jurisdiction, from the jurisdiction data files
// (one copy, shared with the Jurisdictions page and the lookup). A body counts
// if its description names land surveyors (or arpenteurs-geometres in Quebec).
// A body that serves several jurisdictions (ACLS: federal and the three
// territories) appears once, with every abbreviation it covers in abbrs.
export function surveyorBodies(provinces) {
  const out = [];
  for (const p of provinces || []) {
    const c = (p.categories || []).find((x) => x.category === "Professional Bodies");
    for (const l of c?.links || []) {
      if (!/lands? surveyors|arpenteurs/i.test(`${l.n} ${l.d || ""}`)) continue;
      const seen = out.find((b) => b.u === l.u);
      if (seen) { seen.abbrs.push(p.abbr); seen.provinces.push(p.name); continue; }
      out.push({ id: p.id, abbrs: [p.abbr], provinces: [p.name], ...l });
    }
  }
  return out;
}

// Provincial and territorial survey acts, from the Legislation category.
export function surveyActs(provinces) {
  const out = [];
  for (const p of provinces || []) {
    const c = (p.categories || []).find((x) => x.category === "Legislation");
    for (const l of c?.links || []) {
      if (/surveyor|arpenteur|surveys act/i.test(l.n)) out.push({ id: p.id, abbr: p.abbr, province: p.name, ...l });
    }
  }
  return out;
}
