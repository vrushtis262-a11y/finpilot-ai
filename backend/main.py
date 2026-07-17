from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import case, func
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinPilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


def get_user_transaction(
    transaction_id: int,
    current_user: models.User,
    db: Session,
):
    transaction = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.id == transaction_id,
            models.Transaction.user_id == current_user.id,
        )
        .first()
    )

    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    return transaction


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
        {"sub": str(user.id), "email": user.email}
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
                            models.Transaction.transaction_type == "income",
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
                            models.Transaction.transaction_type == "expense",
                            models.Transaction.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("total_expense"),
            func.count(models.Transaction.id).label("transaction_count"),
        )
        .filter(models.Transaction.user_id == current_user.id)
        .one()
    )

    total_income = float(summary.total_income)
    total_expense = float(summary.total_expense)

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "transaction_count": int(summary.transaction_count),
    }


@app.get(
    "/transactions",
    response_model=list[schemas.TransactionResponse],
)
def get_transactions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .order_by(
            models.Transaction.transaction_date.desc(),
            models.Transaction.id.desc(),
        )
        .all()
    )

    return transactions


@app.post(
    "/transactions",
    response_model=schemas.TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    transaction_data: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_transaction = models.Transaction(
        title=transaction_data.title.strip(),
        amount=transaction_data.amount,
        category=transaction_data.category.strip(),
        transaction_type=transaction_data.transaction_type,
        transaction_date=transaction_data.transaction_date,
        user_id=current_user.id,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@app.put(
    "/transactions/{transaction_id}",
    response_model=schemas.TransactionResponse,
)
def update_transaction(
    transaction_id: int,
    transaction_data: schemas.TransactionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction = get_user_transaction(
        transaction_id=transaction_id,
        current_user=current_user,
        db=db,
    )

    transaction.title = transaction_data.title.strip()
    transaction.amount = transaction_data.amount
    transaction.category = transaction_data.category.strip()
    transaction.transaction_type = transaction_data.transaction_type
    transaction.transaction_date = transaction_data.transaction_date

    db.commit()
    db.refresh(transaction)

    return transaction


@app.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transaction(
    transaction_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction = get_user_transaction(
        transaction_id=transaction_id,
        current_user=current_user,
        db=db,
    )

    db.delete(transaction)
    db.commit()

    return None
