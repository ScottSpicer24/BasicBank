from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import client
from app.routes.accounts_routes import router as accounts_router
from app.routes.user_routes import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        client.admin.command("ping")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise
    
    yield # the dividing line between startup and shutdown (Everything before yield → runs on startup; Everything after yield → runs on shutdown)
    
    client.close() # close the connection
    print("\nDisconnected from MongoDB\n")


app = FastAPI(
    title="BasicBank API",
    description="A basic banking application API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

'''
Test insertion of a user into the database

users_collection.insert_one({
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": datetime.now(UTC),
})
'''

app.include_router(accounts_router, prefix="/api/accounts")
app.include_router(user_router, prefix="/api/auth")


@app.get("/health")
async def health_check():
    return {"status": "ok..."}
