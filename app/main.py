from fastapi import FastAPI
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models.user import User
from app.models.portfolio import Portfolio
from app.routes.auth import router as auth_router
from app.routes.portfolio import router as portfolio_router
from app.routes.stocks import router as stocks_router
from app.routes.ai import router as ai_router

Base.metadata.create_all(bind=engine)

security = HTTPBearer()

app = FastAPI(title="StockPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(stocks_router)
app.include_router(ai_router)

@app.get("/")
def root():
    return {"message": "StockPulse API is running!"}