from app.config.database import users_collection
from bson.objectid import ObjectId


def post_user(user: dict):
    return users_collection.insert_one(user)

def get_user_by_email(email: str):
    return users_collection.find_one({"email": email})

def get_user_by_id(user_id: str):
    return users_collection.find_one({"_id": ObjectId(user_id)}, {"_id": 0})

def push_activity_log(user_id: str, entry: dict):
    return users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"activity_log": entry}}
    )
