import yfinance as yf

async def get_stock_price(symbol: str) -> float:
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.fast_info
        price = data.last_price
        if price is None:
            return None
        return round(float(price), 2)
    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")
        return None