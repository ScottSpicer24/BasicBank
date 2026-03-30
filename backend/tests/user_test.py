# TEST FOR AUTH ROUTES

BASE_URL = "/api/auth"

# test registering a user
def test_register_user(client, sample_user_payload):
    response = client.post(f"{BASE_URL}/register", json=sample_user_payload)
    assert response.status_code == 200
    assert response.json()["message"] == "User registered successfully"

# test logging in a user
def test_login_user(client, sample_login_payload):
    response = client.post(f"{BASE_URL}/login", json=sample_login_payload)
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

# test logging out a user
def test_logout_user(client, sample_login_payload):
    login_response = client.post(f"{BASE_URL}/login", json=sample_login_payload)
    token = login_response.json()["access_token"]
    response = client.post(f"{BASE_URL}/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
