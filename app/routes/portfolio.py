from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.portfolio import Portfolio
from app.schemas.portfolio import PortfolioCreate, PortfolioResponse
from app.services.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.post("/add", response_model=PortfolioResponse)
def add_stock(stock: PortfolioCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_stock = Portfolio(
        user_id=current_user.id,
        symbol=stock.symbol.upper(),
        shares=stock.shares,
        buy_price=stock.buy_price
    )
    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)
    return new_stock

@router.get("/", response_model=List[PortfolioResponse])
def get_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stocks = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    return stocks

@router.delete("/{stock_id}")
def delete_stock(
    stock_id: int,
    shares: float | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stock = db.query(Portfolio).filter(Portfolio.id == stock_id, Portfolio.user_id == current_user.id).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )

    if shares is None or shares >= stock.shares:
        db.delete(stock)
        db.commit()
        return {"message": "Stock removed from portfolio"}

    stock.shares = round(stock.shares - shares, 6)
    if stock.shares <= 0:
        db.delete(stock)
        db.commit()
        return {"message": "Stock removed from portfolio"}

    db.add(stock)
    db.commit()
    db.refresh(stock)
    return {"message": "Stock partially sold", "remaining_shares": stock.shares}