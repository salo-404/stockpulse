from groq import Groq
from app.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

async def analyze_portfolio(portfolio_data: dict, question: str) -> str:
    
    portfolio_summary = "Here is the user's stock portfolio:\n\n"
    
    for holding in portfolio_data["holdings"]:
        portfolio_summary += f"""
Stock: {holding['symbol']}
- Shares owned: {holding['shares']}
- Buy price: ${holding['buy_price']}
- Current price: ${holding['current_price']}
- Amount invested: ${holding['invested']}
- Current value: ${holding['current_value']}
- Profit/Loss: ${holding['profit_loss']} ({holding['profit_loss_pct']}%)
"""
    
    portfolio_summary += f"""
Total Portfolio Summary:
- Total invested: ${portfolio_data['total_invested']}
- Current value: ${portfolio_data['total_current_value']}
- Total profit/loss: ${portfolio_data['total_profit_loss']}
"""

    prompt = f"""You are a professional financial analyst assistant. 
Analyze the following portfolio and answer the user's question.
Be specific, use the actual numbers from the portfolio, and give actionable insights.

{portfolio_summary}

User question: {question}

Answer in a clear, professional but friendly tone."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content