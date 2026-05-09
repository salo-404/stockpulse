from groq import Groq
from app.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

async def analyze_portfolio(portfolio_data: dict, question: str) -> str:
    
    portfolio_summary = "Portfolio:\n"
    
    for holding in portfolio_data["holdings"]:
        portfolio_summary += f"- {holding['symbol']}: {holding['shares']} shares | bought ${holding['buy_price']} | now ${holding['current_price']} | P&L: ${holding['profit_loss']} ({holding['profit_loss_pct']}%)\n"
    
    portfolio_summary += f"\nTotal Invested: ${portfolio_data['total_invested']} | Current Value: ${portfolio_data['total_current_value']} | Total P&L: ${portfolio_data['total_profit_loss']}"

    prompt = f"""You are a sharp financial analyst. Be direct and concise.

{portfolio_summary}

Question: {question}

Rules:
- Answer in 3-4 sentences maximum
- Use actual numbers from the portfolio
- Give a clear investment recommendation if relevant
- Mention which stock has the highest growth potential based on performance
- No lengthy explanations, no bullet points, straight to the point"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=200,
        temperature=0.7
    )
    
    return response.choices[0].message.content