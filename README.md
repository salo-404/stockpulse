# StockPulse — AI-Powered Stock Portfolio Tracker

> A premium, production-ready fintech web application for real-time portfolio tracking, live market data, and AI-powered investment analysis.

---

## Screenshots

### Dashboard — Portfolio Command Center
<img width="1907" height="966" alt="image" src="https://github.com/user-attachments/assets/b241de68-8941-4a93-a58e-e7f3477233b7" />


### Market Overview — Live Quotes & Portfolio Mix
<img width="1905" height="848" alt="image" src="https://github.com/user-attachments/assets/21f41065-023a-48c2-a5e6-4c7b1df9beeb" />

### Revenue Flow — Current vs Invested
<img width="1914" height="893" alt="image" src="https://github.com/user-attachments/assets/b9f63a4f-9298-4dff-93ce-5aaf3ca1646a" />


### AI Analyst — Portfolio-Aware Chat
<img width="1881" height="973" alt="image" src="https://github.com/user-attachments/assets/e1ab5e5d-928a-463f-8750-2f5e70fedcdf" />


### Settings — Control Center

<img width="1916" height="703" alt="image" src="https://github.com/user-attachments/assets/74abccea-4d65-416a-82ee-b5c9f62b4c6c" />

---

## Features

- **Real-Time Stock Prices** — Live market data fetched from Yahoo Finance via the backend. No rate limits, no API key required on the frontend.
- **Portfolio Tracking** — Add, manage, and delete stock holdings. Tracks buy price, shares, current value, and profit/loss per position.
- **Live P&L Calculations** — Calculates gain/loss per stock and total portfolio performance using live prices.
- **AI Portfolio Analyst** — Ask natural language questions about your portfolio. Powered by Llama 3.1 via Groq API. Concise, data-driven answers with investment recommendations.
- **Market Overview** — Live quotes panel showing AAPL, TSLA, GOOGL, AMZN, MSFT, NVDA with price changes.
- **Portfolio Allocation Chart** — Donut chart showing portfolio mix by dollar value per holding.
- **Revenue Flow Chart** — Bar chart comparing current value vs invested amount per stock.
- **Secure Authentication** — JWT-based auth with bcrypt password hashing. Protected routes, token stored in React context.
- **Premium Glassmorphism UI** — Dark fintech aesthetic with sidebar navigation, glassmorphism cards, teal accent, and smooth interactions.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11** | Core language |
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM for database interaction |
| **MySQL** | Relational database |
| **JWT (python-jose)** | Authentication tokens |
| **bcrypt (passlib)** | Password hashing |
| **yfinance** | Real-time stock prices from Yahoo Finance |
| **Groq API (Llama 3.1)** | AI portfolio analysis |
| **Pydantic** | Input validation and schemas |
| **Alembic** | Database migrations |

### Frontend
| Technology | Purpose |
|---|---|
| **React + Vite** | Frontend framework |
| **TailwindCSS** | Utility-first styling |
| **React Router** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **Recharts** | Interactive charts |
| **Lucide React** | Professional SVG icons |

---

## Project Structure

```
stockpulse/
│
├── app/                        # FastAPI backend
│   ├── main.py                 # App entry point, route registration, CORS
│   ├── database.py             # MySQL connection, SQLAlchemy engine & session
│   ├── config.py               # Environment variable loader
│   │
│   ├── models/
│   │   ├── user.py             # Users table definition
│   │   └── portfolio.py        # Portfolio holdings table
│   │
│   ├── routes/
│   │   ├── auth.py             # /auth/register, /auth/login
│   │   ├── portfolio.py        # /portfolio/ CRUD endpoints
│   │   ├── stocks.py           # /stocks/price, /stocks/portfolio/performance
│   │   └── ai.py               # /ai/analyze — AI analyst endpoint
│   │
│   ├── schemas/
│   │   ├── user.py             # UserCreate, UserLogin, UserResponse
│   │   └── portfolio.py        # PortfolioCreate, PortfolioResponse
│   │
│   └── services/
│       ├── auth.py             # Password hashing, JWT creation & verification
│       ├── dependencies.py     # get_current_user security dependency
│       ├── stock.py            # Yahoo Finance price fetching
│       └── ai.py               # Groq API integration, portfolio analysis
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Login & Register page
│   │   │   ├── Dashboard.jsx   # Portfolio dashboard
│   │   │   └── AI.jsx          # AI analyst chat
│   │   │
│   │   ├── components/
│   │   │   └── PortfolioChart.jsx  # Recharts area/bar chart
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx # JWT token state management
│   │   │
│   │   ├── lib/
│   │   │   └── api.js          # Axios instance, all API call functions
│   │   │
│   │   ├── App.jsx             # Route definitions, protected routes
│   │   └── main.jsx            # App entry, BrowserRouter, AuthProvider
│   │
│   ├── tailwind.config.js      # Custom color palette
│   └── vite.config.js
│
├── .env                        # Environment variables (not committed)
├── .gitignore
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login, returns JWT token |

### Portfolio
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/portfolio/` | Get all holdings for current user |
| `POST` | `/portfolio/add` | Add a stock to portfolio |
| `DELETE` | `/portfolio/{id}` | Remove a stock from portfolio |

### Stocks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stocks/price/{symbol}` | Get live price for a symbol |
| `GET` | `/stocks/portfolio/performance` | Get full P&L for all holdings |

### AI
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai/analyze` | Ask AI a question about your portfolio |

All endpoints except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>` header.

---

## Security

- Passwords hashed with **bcrypt** — never stored in plain text
- **JWT tokens** signed with a secret key, expire after 30 minutes
- **Credential enumeration protection** — wrong email and wrong password return the same error
- **User-scoped data** — users can only access their own portfolio data
- **Pydantic validation** — all inputs validated before reaching the database
- **CORS** configured for frontend origin only
- `.env` file excluded from version control

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/salo-404/stockpulse.git
cd stockpulse

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install fastapi uvicorn sqlalchemy pymysql python-jose[cryptography] passlib[bcrypt] python-dotenv httpx alembic yfinance groq email-validator

# Create MySQL database
mysql -u root -p
CREATE DATABASE stockpulse;
exit

# Create .env file
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/stockpulse
SECRET_KEY=your_generated_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALPHA_VANTAGE_API_KEY=your_key
GROQ_API_KEY=your_groq_key

# Start the backend
uvicorn app.main:app --reload --port 8080
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `SECRET_KEY` | JWT signing secret (generate with `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `ALGORITHM` | JWT algorithm (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes |
| `GROQ_API_KEY` | Groq API key for AI analyst |

---

## Author

**Salman** — [@salo-404](https://github.com/salo-404)

Computer Science student at Notre Dame University (NDU), Lebanon.

---

## License

MIT License — free to use and modify.
