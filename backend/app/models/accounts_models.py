from app.config.database import accounts_collection, transactions_collection
from bson.objectid import ObjectId


# Function to post an account to the database
def post_account(account: dict):
    return accounts_collection.insert_one(account)

# Function to get an account from the database
def get_account(account_id: str):
    return accounts_collection.find_one({"_id": ObjectId(account_id)}, {"_id": 0})

# Function to deposit into an account
def put_deposit(account_id: str, amount: float):
    return accounts_collection.update_one({"_id": ObjectId(account_id)}, {"$inc": {"balance": amount}})

# Function to withdraw from an account
def put_withdraw(account_id: str, amount: float):
    return accounts_collection.update_one({"_id": ObjectId(account_id)}, {"$inc": {"balance": -amount}})

# Function to record a transaction
def post_transaction(transaction: dict):
    return transactions_collection.insert_one(transaction)

# Function to fetch transactions for an account
def get_transactions(account_id: str):
    docs = transactions_collection.find({"account_id": ObjectId(account_id)}, {"_id": 0})
    
    # Convert ObjectId to string for each transaction
    result = []
    for doc in docs:
        if "account_id" in doc and isinstance(doc["account_id"], ObjectId):
            doc["account_id"] = str(doc["account_id"])
        result.append(doc)
    return result

