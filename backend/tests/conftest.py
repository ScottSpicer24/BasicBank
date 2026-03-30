import random
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Reusable sample payloads (mirrors the MongoDB collection schemas)
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_user_payload():
    email = f"john{random.randint(1, 1000000)}@example.com"
    return {
        "name": "John Test-Case",
        "email": email,
        "password": "SecurePass123!",
    }


@pytest.fixture
def sample_login_payload():
    return {
        "email": "john@example.com",
        "password": "SecurePass123!",
    }


@pytest.fixture
def sample_account_payload():
    return {
        "balance": 0.00,
        "account_type": "Checking",
    }


@pytest.fixture
def sample_transaction_payload():
    return {
        "txn_type": "deposit",
        "amount": 100.50,
    }

@pytest.fixture
def sample_deposit_payload():
    return {
        "amount": 5432.10,
    }

@pytest.fixture
def sample_withdraw_payload():
    return {
        "amount": 10.00,
    }

@pytest.fixture
def sample_insufficient_balance_payload():
    return {
        "amount": 1000000.00,
    }


# ---------------------------------------------------------------------------
# Auth fixtures — register a fresh user and return their token / headers
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def registered_user(client):
    # Login with the sample user and return the token
    login_resp = client.post("/api/auth/login", json={"email": "john@example.com", "password": "SecurePass123!"})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    return login_resp.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(registered_user):
    """Returns Authorization headers for the registered test user."""
    return {"Authorization": f"Bearer {registered_user}"}

