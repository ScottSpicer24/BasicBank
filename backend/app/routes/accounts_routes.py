from fastapi import APIRouter, Depends, HTTPException
from app.schemas.accounts_schema import Account, Amount
from app.controllers.accounts_controller import create_account, deposit_into_account, fetch_account, withdraw_from_account, fetch_transactions, fetch_existing_accounts
from app.utils.util import get_current_user, verify_account_ownership


router = APIRouter()

# Create an account
@router.post("/")
def post_account(account: Account, current_user: dict = Depends(get_current_user)):
    try:
        result = create_account(account, current_user["user_id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# get accounts
@router.get("/", dependencies=[Depends(get_current_user)])
def get_existing_accounts(current_user: dict = Depends(get_current_user)):
    try:
        return fetch_existing_accounts(current_user["user_id"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# get account details
@router.get("/{account_id}", dependencies=[Depends(verify_account_ownership)])
def get_account_details(account_id: str):
    try:
        return fetch_account(account_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# deposit into an account
@router.put("/{account_id}/deposit", dependencies=[Depends(verify_account_ownership)])
def put_deposit(account_id: str, amount: Amount):
    try:
        return deposit_into_account(account_id, amount)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# withdraw from an account
@router.put("/{account_id}/withdraw", dependencies=[Depends(verify_account_ownership)])
def put_withdraw(account_id: str, amount: Amount):
    try:
        return withdraw_from_account(account_id, amount)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# get transactions for an account
@router.get("/{account_id}/transactions", dependencies=[Depends(verify_account_ownership)])
def get_transactions(account_id: str):
    try:
        return fetch_transactions(account_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))