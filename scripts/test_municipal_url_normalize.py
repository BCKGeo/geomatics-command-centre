"""Tests for the classify() function in municipal_url_normalize.py."""
import pytest
from municipal_url_normalize import classify, Bucket


@pytest.mark.parametrize("url,expected", [
    # ROOT — clean municipal domains
    ("https://www.surrey.ca", Bucket.ROOT),
    ("https://www.crd.bc.ca", Bucket.ROOT),
    ("https://burnaby.ca", Bucket.ROOT),
    # COUNCIL_PLATFORM — third-party meeting systems
    ("https://pub-burnaby.escribemeetings.com", Bucket.COUNCIL_PLATFORM),
    ("https://edmonton.civicweb.net", Bucket.COUNCIL_PLATFORM),
    ("https://council.vancouver.ca", Bucket.COUNCIL_PLATFORM),
    ("https://agenda.toronto.ca", Bucket.COUNCIL_PLATFORM),
    ("https://somewhere.icompasscanada.com", Bucket.COUNCIL_PLATFORM),
    # DEPARTMENT_SUBDOMAIN — right city, wrong front door
    ("https://opendata.vancouver.ca", Bucket.DEPARTMENT_SUBDOMAIN),
    ("https://parks.edmonton.ca", Bucket.DEPARTMENT_SUBDOMAIN),
    # Empty / None
    ("", Bucket.UNKNOWN),
    (None, Bucket.UNKNOWN),
])
def test_classify(url, expected):
    assert classify(url) == expected


from municipal_url_normalize import infer_root_from_department


@pytest.mark.parametrize("url,expected", [
    ("https://opendata.vancouver.ca",  "https://www.vancouver.ca"),
    ("https://parks.edmonton.ca",      "https://www.edmonton.ca"),
    ("https://data.crd.bc.ca",         "https://www.crd.bc.ca"),
    ("https://city.ca",                None),  # 2 labels — cannot trim safely
])
def test_infer_root_from_department(url, expected):
    assert infer_root_from_department(url) == expected
