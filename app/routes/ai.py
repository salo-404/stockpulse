from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.portfolio import Portfolio
from app.services.stock import get_stock_price
from app.services.ai import analyze_portfolio
from app.services.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI Analyst"])

class QuestionRequest(BaseModel):
    question: str

@router.post("/analyze")
async def analyze(question: QuestionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    holdings = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    
    if not holdings:
        raise HTTPException(status_code=404, detail="No stocks in portfolio")
    
    result = []
    total_invested = 0
    total_current_value = 0

    for holding in holdings:
        current_price = await get_stock_price(holding.symbol)
        if current_price is None:
            current_price = holding.buy_price

        invested = holding.shares * holding.buy_price
        current_value = holding.shares * current_price
        profit_loss = current_value - invested
        profit_loss_pct = round((profit_loss / invested) * 100, 2)

        total_invested += invested
        total_current_value += current_value

        result.append({
            "symbol": holding.symbol,
            "shares": holding.shares,
            "buy_price": holding.buy_price,
            "current_price": current_price,
            "invested": round(invested, 2),
            "current_value": round(current_value, 2),
            "profit_loss": round(profit_loss, 2),
            "profit_loss_pct": profit_loss_pct
        })

    portfolio_data = {
        "holdings": result,
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current_value, 2),
        "total_profit_loss": round(total_current_value - total_invested, 2)
    }

    answer = await analyze_portfolio(portfolio_data, question.question)
    return {"answer": answer}