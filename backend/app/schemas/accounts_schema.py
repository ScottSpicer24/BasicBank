from pydantic import BaseModel

# Schema for what is expected from requests and responses

class Account(BaseModel):
    balance: float
    account_type: str
    # user_id is injected server-side from the JWT, not supplied by the client
    # no need for created_at, added by the database

class Amount(BaseModel):
    amount: float