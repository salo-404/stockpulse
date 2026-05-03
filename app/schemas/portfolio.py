from pydantic import BaseModel
from datetime import datetime

class PortfolioCreate(BaseModel):
    symbol: str
    shares: float
    buy_price: float

class PortfolioResponse(BaseModel):
    id: int
    symbol: str
    shares: float
    buy_price: float
    created_at: datetime

    class Config:
        from_attributes = True