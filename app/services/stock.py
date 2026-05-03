import httpx
from app.config import ALPHA_VANTAGE_API_KEY

async def get_stock_price(symbol: str) -> float:
    url = f"https://www.alphavantage.co/query"
    params ={
         "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": ALPHA_VANTAGE_API_KEY
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
    
    try:
        price = float(data["Global Quote"]["05. price"])
        return price
    except (KeyError, ValueError):
        return None