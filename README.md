# FinPilot AI

An AI-powered personal finance management platform that helps users track income, expenses, budgets, and financial insights. The application also includes an OCR-powered receipt scanner to automatically extract transaction details from receipt images.

## Live Demo

**Frontend:** https://finpilot-ai-git-main-vrushtis262-a11ys-projects.vercel.app

**Backend API:** https://finpilot-ai-xqk6.onrender.com

## Features

### Authentication
- User Registration
- Secure JWT Authentication
- Login & Logout
- Protected Routes

### Dashboard
- Financial Overview
- Income vs Expense Summary
- Current Balance
- Recent Transactions
- Interactive Charts
- Sorting & Filtering

### Transaction Management
- Add Transactions
- Edit Transactions
- Delete Transactions
- Category Support
- Transaction Date Selection

### Budget Management
- Create Budgets
- Edit Budgets
- Delete Budgets
- Budget Progress Tracking

### AI Receipt Scanner
- Upload receipt images
- OCR-based text extraction
- Automatic transaction detection
- Editable extracted fields
- Save directly as a transaction

### CSV Support
- Import Transactions
- Preview Before Import
- Export Transactions

### Deployment
- Frontend deployed on Vercel
- Backend deployed on Render
- PostgreSQL Database
- Production Environment Variables
- CORS Configuration


# Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- Vite

### Backend

- FastAPI
- SQLAlchemy
- JWT Authentication
- PostgreSQL
- Pydantic

### AI & OCR

- OCR-based Receipt Scanning

### Deployment

- Vercel
- Render

# Project Structure

```
FinPilot-AI/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── main.py
│
├── README.md
└── .gitignore
```


# Installation

## 1. Clone Repository

```bash
git clone https://github.com/vrushtis262-a11y/finpilot-ai.git
cd finpilot-ai
```


## 2. Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend runs on:

```
http://127.0.0.1:8000
```


## 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:5173
```


# Environment Variables

## Backend (.env)

```env
DATABASE_URL=your_postgresql_database_url
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Frontend (.env)

```env
VITE_API_URL=http://127.0.0.1:8000
```

For production:

```env
VITE_API_URL=https://finpilot-ai-xqk6.onrender.com
```


# Future Improvements

- Multi-currency support
- Recurring transactions
- Financial goals
- AI spending recommendations
- Email notifications
- Dark/Light theme switch

# Author

**Vrushti**

GitHub:
https://github.com/vrushtis262-a11y

# License

This project is developed for educational and portfolio purposes.