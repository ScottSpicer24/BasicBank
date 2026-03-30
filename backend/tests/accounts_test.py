# TESTS FOR ACCOUNTS ROUTES
import pytest

BASE_URL = "/api/accounts"


# ---------------------------------------------------------------------------
# Module-scoped account_id: created once, shared across all tests below
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def account_id(client, auth_headers):
    """Creates an account for the authenticated test user and returns its ID."""
    response = client.post(f"{BASE_URL}/", json={"balance": 0.00, "account_type": "Checking"}, headers=auth_headers)
    assert response.status_code == 200, f"Account creation failed: {response.text}"
    account_id = response.json()["account_id"]
    print(f"Account ID: {account_id}")
    return str(account_id)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_create_account_requires_auth(client, sample_account_payload):
    response = client.post(f"{BASE_URL}/", json=sample_account_payload)
    assert response.status_code == 401

def test_create_account(client, auth_headers, sample_account_payload):
    response = client.post(f"{BASE_URL}/", json=sample_account_payload, headers=auth_headers)
    assert response.status_code == 200

def test_get_existing_accounts(client, auth_headers):
    response = client.get(f"{BASE_URL}/", headers=auth_headers)
    assert response.status_code == 200

def test_get_existing_accounts_requires_auth(client):
    response = client.get(f"{BASE_URL}/")
    assert response.status_code == 401

def test_get_account_details(client, auth_headers, account_id):
    response = client.get(f"{BASE_URL}/{account_id}", headers=auth_headers)
    assert response.status_code == 200

def test_get_account_details_requires_auth(client, account_id):
    response = client.get(f"{BASE_URL}/{account_id}")
    assert response.status_code == 401

def test_deposit_into_account(client, auth_headers, account_id, sample_deposit_payload):
    response = client.put(f"{BASE_URL}/{account_id}/deposit", json=sample_deposit_payload, headers=auth_headers)
    assert response.status_code == 200

def test_deposit_requires_auth(client, account_id, sample_deposit_payload):
    response = client.put(f"{BASE_URL}/{account_id}/deposit", json=sample_deposit_payload)
    assert response.status_code == 401

def test_withdraw_from_account(client, auth_headers, account_id, sample_withdraw_payload):
    response = client.put(f"{BASE_URL}/{account_id}/withdraw", json=sample_withdraw_payload, headers=auth_headers)
    assert response.status_code == 200

def test_withdraw_requires_auth(client, account_id, sample_withdraw_payload):
    response = client.put(f"{BASE_URL}/{account_id}/withdraw", json=sample_withdraw_payload)
    assert response.status_code == 401

def test_withdraw_from_account_with_insufficient_balance(client, auth_headers, account_id, sample_insufficient_balance_payload):
    response = client.put(f"{BASE_URL}/{account_id}/withdraw", json=sample_insufficient_balance_payload, headers=auth_headers)
    assert response.status_code == 400

def test_get_transactions_for_account(client, auth_headers, account_id):
    response = client.get(f"{BASE_URL}/{account_id}/transactions", headers=auth_headers)
    assert response.status_code == 200

def test_get_transactions_requires_auth(client, account_id):
    response = client.get(f"{BASE_URL}/{account_id}/transactions")
    assert response.status_code == 401