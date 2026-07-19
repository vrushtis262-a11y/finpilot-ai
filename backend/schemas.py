from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(
        min_length=1,
        max_length=100,
    )
    email: EmailStr
    password: str = Field(
        min_length=6,
        max_length=128,
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TransactionCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=100,
    )
    amount: float = Field(gt=0)
    category: str = Field(
        min_length=1,
        max_length=50,
    )
    transaction_type: Literal[
        "income",
        "expense",
    ]
    transaction_date: date


class TransactionUpdate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=100,
    )
    amount: float = Field(gt=0)
    category: str = Field(
        min_length=1,
        max_length=50,
    )
    transaction_type: Literal[
        "income",
        "expense",
    ]
    transaction_date: date


class TransactionResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    transaction_type: str
    transaction_date: date
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class BudgetCreate(BaseModel):
    month: str = Field(
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
    )
    amount: float = Field(gt=0)


class BudgetUpdate(BaseModel):
    amount: float = Field(gt=0)


class BudgetResponse(BaseModel):
    id: int
    month: str
    amount: float
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class BudgetSummaryResponse(BaseModel):
    month: str
    budget_amount: float
    total_expense: float
    remaining_amount: float
    percentage_used: float
    is_over_budget: bool
