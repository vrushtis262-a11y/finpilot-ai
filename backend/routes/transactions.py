import csv
import io
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import get_db

router = APIRouter(tags=["transactions"])

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


def sanitize_csv_text(value: str) -> str:
    cleaned_value = value.strip()

    if cleaned_value.startswith(("=", "+", "-", "@")):
        return f"'{cleaned_value}"

    return cleaned_value


def get_transaction_sort_columns(
    sort_by: Literal["transaction_date", "amount", "title"],
    order: Literal["asc", "desc"],
):
    sort_column_map = {
        "transaction_date": models.Transaction.transaction_date,
        "amount": models.Transaction.amount,
        "title": models.Transaction.title,
    }

    sort_column = sort_column_map[sort_by]

    if order == "asc":
        primary_sort = sort_column.asc()
        secondary_sort = models.Transaction.id.asc()
    else:
        primary_sort = sort_column.desc()
        secondary_sort = models.Transaction.id.desc()

    return primary_sort, secondary_sort


@router.get(
    "/transactions",
    response_model=list[schemas.TransactionResponse],
)
def get_transactions(
    sort_by: Literal[
        "transaction_date",
        "amount",
        "title",
    ] = Query(default="transaction_date"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    primary_sort, secondary_sort = get_transaction_sort_columns(
        sort_by=sort_by,
        order=order,
    )

    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .order_by(primary_sort, secondary_sort)
        .all()
    )

    return transactions


@router.get("/transactions/export/csv")
def export_transactions_csv(
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

    csv_buffer = io.StringIO(newline="")

    writer = csv.writer(csv_buffer)

    writer.writerow(
        [
            "Date",
            "Title",
            "Category",
            "Type",
            "Amount",
        ]
    )

    for transaction in transactions:
        writer.writerow(
            [
                transaction.transaction_date.isoformat(),
                sanitize_csv_text(transaction.title),
                sanitize_csv_text(transaction.category),
                transaction.transaction_type.capitalize(),
                f"{float(transaction.amount):.2f}",
            ]
        )

    csv_bytes = csv_buffer.getvalue().encode("utf-8-sig")

    csv_buffer.close()

    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                'attachment; filename="finpilot-transactions.csv"'
            )
        },
    )


@router.post(
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


@router.put(
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


@router.delete(
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
