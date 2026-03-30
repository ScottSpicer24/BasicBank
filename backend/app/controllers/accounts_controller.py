from datetime import datetime, UTC
from app.schemas.accounts_schema import Account, Amount
from app.models.accounts_models import post_account, get_account, put_deposit, put_withdraw, post_transaction, get_transactions
from bson.objectid import ObjectId
from fastapi import HTTPException

# Create an account
def create_account(account: Account, user_id: str):
    account_data = account.model_dump()
    account_data["user_id"] = user_id
    account_data["created_at"] = datetime.now(UTC)
    try:
        result = post_account(account_data)
        return {"message": "Account created successfully", "account_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fetch an account based on the ID
def fetch_account(account_id: str):
    try:
        account = get_account(account_id)
        return account
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Deposit into an account
def deposit_into_account(account_id: str, amount: Amount):
    try:
        result = put_deposit(account_id, amount.amount)
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Account not found")
        post_transaction({
            "account_id": ObjectId(account_id),
            "txn_type": "deposit",
            "amount": amount.amount,
            "created_at": datetime.now(UTC),
        })
        return {"message": "Deposit successful"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Withdraw from an account
def withdraw_from_account(account_id: str, amount: Amount):
    try:
        account = get_account(account_id)
        if account["balance"] < amount.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        result = put_withdraw(account_id, amount.amount)
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Account not found")
        post_transaction({
            "account_id": ObjectId(account_id),
            "txn_type": "withdrawal",
            "amount": amount.amount,
            "created_at": datetime.now(UTC),
        })
        return {"message": "Withdrawal successful"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fetch transactions for an account
def fetch_transactions(account_id: str):
    try:
        transactions = get_transactions(account_id)
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))