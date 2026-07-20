import csv
import io
from datetime import date
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import get_db
from utils.csv_import import parse_csv_transactions

router = APIRouter(tags=["transactions"])

security = HTTPBearer()

MAX_CSV_FILE_SIZE = 5 * 1024 * 1024


class CsvImportTransaction(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    amount: float = Field(gt=0)
    category: str = Field(min_length=1, max_length=100)
    transaction_type: Literal["income", "expense"]
    transaction_date: date

    @field_validator("title", "category")
    @classmethod
    def validate_non_empty_text(cls, value: str) -> str:
        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError("Value cannot be empty")

        return cleaned_value


class CsvImportRequest(BaseModel):
    transactions: list[CsvImportTransaction] = Field(
        min_length=1,
        max_length=1000,
    )


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


def normalize_duplicate_text(value: str) -> str:
    return " ".join(value.strip().lower().split())


def build_transaction_fingerprint(
    title: str,
    amount: float,
    transaction_type: str,
    transaction_date,
) -> tuple[str, float, str, str]:
    return (
        normalize_duplicate_text(title),
        round(float(amount), 2),
        transaction_type.strip().lower(),
        transaction_date.isoformat(),
    )


def get_existing_transaction_fingerprints(
    current_user: models.User,
    db: Session,
) -> set[tuple[str, float, str, str]]:
    existing_transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .all()
    )

    return {
        build_transaction_fingerprint(
            title=transaction.title,
            amount=transaction.amount,
            transaction_type=transaction.transaction_type,
            transaction_date=transaction.transaction_date,
        )
        for transaction in existing_transactions
    }


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


@router.post("/transactions/import/csv/preview")
async def preview_csv_import(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = file.filename or ""

    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a CSV file",
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty",
        )

    if len(file_content) > MAX_CSV_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="CSV files must be 5 MB or smaller",
        )

    try:
        parsed_transactions, invalid_rows = parse_csv_transactions(
            file_content=file_content,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    existing_fingerprints = get_existing_transaction_fingerprints(
        current_user=current_user,
        db=db,
    )

    csv_fingerprints: set[tuple[str, float, str, str]] = set()
    preview_transactions: list[dict] = []
    duplicate_count = 0

    for index, transaction in enumerate(parsed_transactions):
        fingerprint = build_transaction_fingerprint(
            title=transaction["title"],
            amount=transaction["amount"],
            transaction_type=transaction["transaction_type"],
            transaction_date=transaction["transaction_date"],
        )

        duplicate_reason = None

        if fingerprint in existing_fingerprints:
            duplicate_reason = "Already exists in FinPilot"
        elif fingerprint in csv_fingerprints:
            duplicate_reason = "Repeated within uploaded CSV"

        is_duplicate = duplicate_reason is not None

        if is_duplicate:
            duplicate_count += 1

        csv_fingerprints.add(fingerprint)

        preview_transactions.append(
            {
                "preview_id": index + 1,
                "row_number": transaction["row_number"],
                "title": transaction["title"],
                "amount": transaction["amount"],
                "category": transaction["category"],
                "transaction_type": transaction["transaction_type"],
                "transaction_date": (
                    transaction["transaction_date"].isoformat()
                ),
                "is_duplicate": is_duplicate,
                "duplicate_reason": duplicate_reason,
                "selected": not is_duplicate,
            }
        )

    importable_count = len(preview_transactions) - duplicate_count

    return {
        "filename": filename,
        "total_rows": (
            len(preview_transactions)
            + len(invalid_rows)
        ),
        "valid_count": len(preview_transactions),
        "invalid_count": len(invalid_rows),
        "duplicate_count": duplicate_count,
        "importable_count": importable_count,
        "transactions": preview_transactions,
        "invalid_rows": invalid_rows,
    }


@router.post(
    "/transactions/import/csv",
    status_code=status.HTTP_201_CREATED,
)
def import_csv_transactions(
    import_data: CsvImportRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_fingerprints = get_existing_transaction_fingerprints(
        current_user=current_user,
        db=db,
    )

    request_fingerprints: set[tuple[str, float, str, str]] = set()
    transactions_to_create: list[models.Transaction] = []
    skipped_duplicates: list[dict] = []

    for index, transaction_data in enumerate(import_data.transactions):
        fingerprint = build_transaction_fingerprint(
            title=transaction_data.title,
            amount=transaction_data.amount,
            transaction_type=transaction_data.transaction_type,
            transaction_date=transaction_data.transaction_date,
        )

        duplicate_reason = None

        if fingerprint in existing_fingerprints:
            duplicate_reason = "Already exists in FinPilot"
        elif fingerprint in request_fingerprints:
            duplicate_reason = "Repeated within import request"

        if duplicate_reason is not None:
            skipped_duplicates.append(
                {
                    "index": index,
                    "title": transaction_data.title,
                    "reason": duplicate_reason,
                }
            )
            continue

        request_fingerprints.add(fingerprint)

        transactions_to_create.append(
            models.Transaction(
                title=transaction_data.title,
                amount=transaction_data.amount,
                category=transaction_data.category,
                transaction_type=transaction_data.transaction_type,
                transaction_date=transaction_data.transaction_date,
                user_id=current_user.id,
            )
        )

    if not transactions_to_create:
        return {
            "message": "No new transactions were imported",
            "requested_count": len(import_data.transactions),
            "imported_count": 0,
            "skipped_count": len(skipped_duplicates),
            "skipped_duplicates": skipped_duplicates,
            "transactions": [],
        }

    try:
        db.add_all(transactions_to_create)
        db.commit()

        for transaction in transactions_to_create:
            db.refresh(transaction)
    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to import transactions",
        ) from error

    return {
        "message": (
            f"Successfully imported {len(transactions_to_create)} "
            "transaction(s)"
        ),
        "requested_count": len(import_data.transactions),
        "imported_count": len(transactions_to_create),
        "skipped_count": len(skipped_duplicates),
        "skipped_duplicates": skipped_duplicates,
        "transactions": [
            {
                "id": transaction.id,
                "title": transaction.title,
                "amount": transaction.amount,
                "category": transaction.category,
                "transaction_type": transaction.transaction_type,
                "transaction_date": (
                    transaction.transaction_date.isoformat()
                ),
            }
            for transaction in transactions_to_create
        ],
    }


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
