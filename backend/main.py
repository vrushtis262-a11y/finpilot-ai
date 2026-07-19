from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import case, func
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import engine, get_db
from routes import budgets, transactions

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinPilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(budgets.router)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = auth.decode_access_token(credentials.credentials)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    try:
        parsed_user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = (
        db.query(models.User)
        .filter(models.User.id == parsed_user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


@app.get("/")
def root():
    return {"message": "Welcome to FinPilot AI"}


@app.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    new_user = models.User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=auth.hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=schemas.Token)
def login_user(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == login_data.email)
        .first()
    )

    if not user or not auth.verify_password(
        login_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = auth.create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.get("/analytics/summary")
def get_analytics_summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    summary = (
        db.query(
            func.coalesce(
                func.sum(
                    case(
                        (
                            models.Transaction.transaction_type
                            == "income",
                            models.Transaction.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("total_income"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            models.Transaction.transaction_type
                            == "expense",
                            models.Transaction.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("total_expense"),
            func.count(
                models.Transaction.id
            ).label("transaction_count"),
        )
        .filter(
            models.Transaction.user_id == current_user.id
        )
        .one()
    )

    total_income = float(summary.total_income)
    total_expense = float(summary.total_expense)

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "transaction_count": int(
            summary.transaction_count
        ),
    }


@app.get("/analytics/monthly")
def get_monthly_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month_expression = func.strftime(
        "%Y-%m",
        models.Transaction.transaction_date,
    )

    monthly_results = (
        db.query(
            month_expression.label("month"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            models.Transaction.transaction_type
                            == "income",
                            models.Transaction.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("total_income"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            models.Transaction.transaction_type
                            == "expense",
                            models.Transaction.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("total_expense"),
        )
        .filter(
            models.Transaction.user_id == current_user.id
        )
        .group_by(month_expression)
        .order_by(month_expression.asc())
        .all()
    )

    return [
        {
            "month": result.month,
            "total_income": float(result.total_income),
            "total_expense": float(result.total_expense),
            "balance": float(
                result.total_income
                - result.total_expense
            ),
        }
        for result in monthly_results
    ]


@app.get("/analytics/category-expenses")
def get_category_expenses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category_expression = func.coalesce(
        func.nullif(
            func.trim(models.Transaction.category),
            "",
        ),
        "Uncategorized",
    )

    category_results = (
        db.query(
            category_expression.label("category"),
            func.coalesce(
                func.sum(models.Transaction.amount),
                0,
            ).label("total"),
        )
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.transaction_type
            == "expense",
        )
        .group_by(category_expression)
        .order_by(
            func.sum(
                models.Transaction.amount
            ).desc()
        )
        .all()
    )

    return [
        {
            "category": result.category,
            "total": float(result.total),
        }
        for result in category_results
    ]
