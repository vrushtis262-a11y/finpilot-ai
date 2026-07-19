from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/budgets",
    tags=["budgets"],
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


def get_user_budget(
    month: str,
    current_user: models.User,
    db: Session,
):
    budget = (
        db.query(models.Budget)
        .filter(
            models.Budget.month == month,
            models.Budget.user_id == current_user.id,
        )
        .first()
    )

    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    return budget


@router.get(
    "",
    response_model=list[schemas.BudgetResponse],
)
def get_budgets(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budgets = (
        db.query(models.Budget)
        .filter(models.Budget.user_id == current_user.id)
        .order_by(models.Budget.month.desc())
        .all()
    )

    return budgets


@router.get(
    "/summary/{month}",
    response_model=schemas.BudgetSummaryResponse,
)
def get_budget_summary(
    month: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = get_user_budget(
        month=month,
        current_user=current_user,
        db=db,
    )

    transaction_month = func.strftime(
        "%Y-%m",
        models.Transaction.transaction_date,
    )

    total_expense = (
        db.query(
            func.coalesce(
                func.sum(models.Transaction.amount),
                0,
            )
        )
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.transaction_type == "expense",
            transaction_month == month,
        )
        .scalar()
    )

    budget_amount = float(budget.amount)
    total_expense_amount = float(total_expense)
    remaining_amount = budget_amount - total_expense_amount

    percentage_used = (
        total_expense_amount / budget_amount
    ) * 100

    return {
        "month": month,
        "budget_amount": budget_amount,
        "total_expense": total_expense_amount,
        "remaining_amount": remaining_amount,
        "percentage_used": round(percentage_used, 2),
        "is_over_budget": total_expense_amount > budget_amount,
    }


@router.get(
    "/{month}",
    response_model=schemas.BudgetResponse,
)
def get_budget(
    month: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_budget(
        month=month,
        current_user=current_user,
        db=db,
    )


@router.post(
    "",
    response_model=schemas.BudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_budget(
    budget_data: schemas.BudgetCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_budget = (
        db.query(models.Budget)
        .filter(
            models.Budget.month == budget_data.month,
            models.Budget.user_id == current_user.id,
        )
        .first()
    )

    if existing_budget is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget already exists for this month",
        )

    new_budget = models.Budget(
        month=budget_data.month,
        amount=budget_data.amount,
        user_id=current_user.id,
    )

    db.add(new_budget)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget already exists for this month",
        )

    db.refresh(new_budget)

    return new_budget


@router.put(
    "/{month}",
    response_model=schemas.BudgetResponse,
)
def update_budget(
    month: str,
    budget_data: schemas.BudgetUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = get_user_budget(
        month=month,
        current_user=current_user,
        db=db,
    )

    budget.amount = budget_data.amount

    db.commit()
    db.refresh(budget)

    return budget


@router.delete(
    "/{month}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_budget(
    month: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = get_user_budget(
        month=month,
        current_user=current_user,
        db=db,
    )

    db.delete(budget)
    db.commit()

    return None
