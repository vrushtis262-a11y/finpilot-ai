import re
from datetime import date
from typing import Any

import pandas as pd


COLUMN_ALIASES = {
    "date": [
        "date",
        "transaction date",
        "posted date",
        "posting date",
        "purchase date",
    ],
    "title": [
        "title",
        "description",
        "merchant",
        "name",
        "details",
        "memo",
        "transaction",
    ],
    "amount": [
        "amount",
        "transaction amount",
        "value",
    ],
    "debit": [
        "debit",
        "withdrawal",
        "withdrawals",
        "money out",
        "expense",
    ],
    "credit": [
        "credit",
        "deposit",
        "deposits",
        "money in",
        "income",
    ],
    "type": [
        "type",
        "transaction type",
        "category type",
    ],
    "category": [
        "category",
        "transaction category",
    ],
}


CATEGORY_ALIASES = {
    "transport": "Transportation",
    "transportation": "Transportation",
    "transit": "Transportation",
    "public transport": "Transportation",
    "public transportation": "Transportation",
    "bus": "Transportation",
    "train": "Transportation",
    "taxi": "Transportation",
    "uber": "Transportation",
    "lyft": "Transportation",
    "fuel": "Transportation",
    "gas": "Transportation",
    "gasoline": "Transportation",
    "petrol": "Transportation",
    "groceries": "Food",
    "grocery": "Food",
    "restaurant": "Food",
    "restaurants": "Food",
    "dining": "Food",
    "food": "Food",
    "rent": "Housing",
    "mortgage": "Housing",
    "housing": "Housing",
    "utilities": "Utilities",
    "utility": "Utilities",
    "electricity": "Utilities",
    "water": "Utilities",
    "internet": "Utilities",
    "phone": "Utilities",
    "shopping": "Shopping",
    "retail": "Shopping",
    "clothing": "Shopping",
    "entertainment": "Entertainment",
    "movies": "Entertainment",
    "gaming": "Entertainment",
    "health": "Health",
    "healthcare": "Health",
    "medical": "Health",
    "pharmacy": "Health",
    "salary": "Income",
    "paycheck": "Income",
    "wages": "Income",
    "income": "Income",
    "refund": "Income",
    "uncategorized": "Uncategorized",
    "other": "Uncategorized",
    "misc": "Uncategorized",
    "miscellaneous": "Uncategorized",
}


def normalize_column_name(column_name: str) -> str:
    normalized = str(column_name).strip().lower()
    normalized = re.sub(r"[_\-]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)

    return normalized


def normalize_category(value: Any) -> str:
    category = clean_text(
        value,
        fallback="Uncategorized",
    )

    normalized_category = category.lower()
    normalized_category = re.sub(
        r"[_\-]+",
        " ",
        normalized_category,
    )
    normalized_category = re.sub(
        r"\s+",
        " ",
        normalized_category,
    ).strip()

    if not normalized_category:
        return "Uncategorized"

    if normalized_category in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[normalized_category]

    return normalized_category.title()


def detect_columns(dataframe: pd.DataFrame) -> dict[str, str]:
    normalized_columns = {
        normalize_column_name(column): str(column)
        for column in dataframe.columns
    }

    detected_columns: dict[str, str] = {}

    for field_name, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized_columns:
                detected_columns[field_name] = normalized_columns[alias]
                break

    has_standard_amount = "amount" in detected_columns
    has_debit_credit = (
        "debit" in detected_columns
        or "credit" in detected_columns
    )

    required_fields = ["date", "title"]

    missing_fields = [
        field
        for field in required_fields
        if field not in detected_columns
    ]

    if missing_fields:
        readable_fields = ", ".join(missing_fields)

        raise ValueError(
            f"Could not detect required CSV columns: {readable_fields}"
        )

    if not has_standard_amount and not has_debit_credit:
        raise ValueError(
            "Could not detect an amount, debit, or credit column"
        )

    return detected_columns


def clean_text(value: Any, fallback: str = "") -> str:
    if pd.isna(value):
        return fallback

    cleaned_value = str(value).strip()

    return cleaned_value or fallback


def parse_amount(value: Any) -> float | None:
    if pd.isna(value):
        return None

    amount_text = str(value).strip()

    if not amount_text:
        return None

    is_parenthesized = (
        amount_text.startswith("(")
        and amount_text.endswith(")")
    )

    amount_text = amount_text.replace(",", "")
    amount_text = amount_text.replace("$", "")
    amount_text = amount_text.replace("£", "")
    amount_text = amount_text.replace("€", "")
    amount_text = amount_text.replace("₹", "")
    amount_text = amount_text.replace("(", "")
    amount_text = amount_text.replace(")", "")
    amount_text = amount_text.strip()

    try:
        parsed_amount = float(amount_text)
    except ValueError:
        return None

    if is_parenthesized:
        parsed_amount = -abs(parsed_amount)

    return parsed_amount


def parse_transaction_date(value: Any) -> date | None:
    if pd.isna(value):
        return None

    parsed_date = pd.to_datetime(
        value,
        errors="coerce",
    )

    if pd.isna(parsed_date):
        return None

    return parsed_date.date()


def normalize_transaction_type(value: Any) -> str | None:
    normalized_value = clean_text(value).lower()

    income_values = {
        "income",
        "credit",
        "deposit",
        "refund",
        "payment received",
    }

    expense_values = {
        "expense",
        "debit",
        "withdrawal",
        "purchase",
        "payment",
    }

    if normalized_value in income_values:
        return "income"

    if normalized_value in expense_values:
        return "expense"

    return None


def determine_amount_and_type(
    row: pd.Series,
    detected_columns: dict[str, str],
) -> tuple[float, str] | None:
    debit_column = detected_columns.get("debit")
    credit_column = detected_columns.get("credit")

    if debit_column or credit_column:
        debit_amount = (
            parse_amount(row.get(debit_column))
            if debit_column
            else None
        )
        credit_amount = (
            parse_amount(row.get(credit_column))
            if credit_column
            else None
        )

        if credit_amount is not None and credit_amount != 0:
            return abs(credit_amount), "income"

        if debit_amount is not None and debit_amount != 0:
            return abs(debit_amount), "expense"

    amount_column = detected_columns.get("amount")

    if amount_column is None:
        return None

    parsed_amount = parse_amount(row.get(amount_column))

    if parsed_amount is None or parsed_amount == 0:
        return None

    type_column = detected_columns.get("type")

    if type_column:
        detected_type = normalize_transaction_type(
            row.get(type_column)
        )

        if detected_type:
            return abs(parsed_amount), detected_type

    if parsed_amount < 0:
        return abs(parsed_amount), "expense"

    return parsed_amount, "income"


def parse_csv_transactions(
    file_content: bytes,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    try:
        dataframe = pd.read_csv(
            pd.io.common.BytesIO(file_content),
            dtype=str,
            keep_default_na=False,
        )
    except Exception as error:
        raise ValueError(
            "The uploaded file could not be read as a CSV"
        ) from error

    if dataframe.empty:
        raise ValueError("The uploaded CSV file is empty")

    dataframe.columns = [
        str(column).strip()
        for column in dataframe.columns
    ]

    detected_columns = detect_columns(dataframe)

    valid_transactions: list[dict[str, Any]] = []
    invalid_rows: list[dict[str, Any]] = []

    for row_index, row in dataframe.iterrows():
        csv_row_number = int(row_index) + 2

        title = clean_text(
            row.get(detected_columns["title"]),
            fallback="Imported transaction",
        )

        transaction_date = parse_transaction_date(
            row.get(detected_columns["date"])
        )

        amount_and_type = determine_amount_and_type(
            row=row,
            detected_columns=detected_columns,
        )

        row_errors: list[str] = []

        if transaction_date is None:
            row_errors.append("Invalid or missing date")

        if amount_and_type is None:
            row_errors.append("Invalid or missing amount")

        if row_errors:
            invalid_rows.append(
                {
                    "row_number": csv_row_number,
                    "title": title,
                    "errors": row_errors,
                }
            )
            continue

        amount, transaction_type = amount_and_type

        category_column = detected_columns.get("category")

        raw_category = (
            row.get(category_column)
            if category_column
            else "Uncategorized"
        )

        category = normalize_category(raw_category)

        valid_transactions.append(
            {
                "row_number": csv_row_number,
                "title": title[:100],
                "amount": round(amount, 2),
                "category": category[:50],
                "transaction_type": transaction_type,
                "transaction_date": transaction_date,
            }
        )

    return valid_transactions, invalid_rows
