from datetime import date

from sqlalchemy import (
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    full_name = Column(
        String,
        nullable=False,
    )
    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password = Column(
        String,
        nullable=False,
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    title = Column(
        String,
        nullable=False,
    )
    amount = Column(
        Float,
        nullable=False,
    )
    category = Column(
        String,
        nullable=False,
    )
    transaction_type = Column(
        String,
        nullable=False,
    )
    transaction_date = Column(
        Date,
        nullable=False,
        default=date.today,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )


class Budget(Base):
    __tablename__ = "budgets"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "month",
            name="uq_budget_user_month",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    month = Column(
        String,
        nullable=False,
        index=True,
    )
    amount = Column(
        Float,
        nullable=False,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
