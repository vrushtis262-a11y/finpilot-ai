import io
import re
from datetime import date, datetime
from typing import Any

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, UnidentifiedImageError


SUPPORTED_IMAGE_FORMATS = {
    "JPEG",
    "PNG",
    "WEBP",
}

CATEGORY_KEYWORDS = {
    "Food & Dining": {
        "restaurant",
        "cafe",
        "coffee",
        "pizza",
        "burger",
        "bakery",
        "grill",
        "kitchen",
        "diner",
        "food",
        "doordash",
        "ubereats",
        "starbucks",
        "mcdonald",
        "subway",
    },
    "Groceries": {
        "grocery",
        "supermarket",
        "market",
        "walmart",
        "costco",
        "kroger",
        "safeway",
        "whole foods",
        "trader joe",
    },
    "Transportation": {
        "uber",
        "lyft",
        "taxi",
        "fuel",
        "gas",
        "shell",
        "chevron",
        "exxon",
        "parking",
        "transit",
        "metro",
    },
    "Shopping": {
        "amazon",
        "target",
        "best buy",
        "mall",
        "store",
        "shop",
        "retail",
        "clothing",
        "fashion",
    },
    "Entertainment": {
        "cinema",
        "movie",
        "theater",
        "netflix",
        "spotify",
        "concert",
        "ticket",
        "game",
    },
    "Health": {
        "pharmacy",
        "medical",
        "clinic",
        "hospital",
        "doctor",
        "dental",
        "cvs",
        "walgreens",
    },
    "Utilities": {
        "electric",
        "electricity",
        "internet",
        "water",
        "utility",
        "phone",
        "mobile",
        "comcast",
        "verizon",
        "at&t",
    },
}

TOTAL_LABEL_PATTERN = re.compile(
    r"\b("
    r"grand\s+total|"
    r"amount\s+due|"
    r"balance\s+due|"
    r"total\s+due|"
    r"net\s+total|"
    r"total"
    r")\b",
    re.IGNORECASE,
)

MONEY_PATTERN = re.compile(
    r"(?<!\d)"
    r"(?:[$€£₹]\s*)?"
    r"(\d{1,3}(?:,\d{3})*|\d+)"
    r"[.,](\d{2})"
    r"(?!\d)"
)

DATE_PATTERNS = [
    re.compile(
        r"\b("
        r"\d{4}[-/.]\d{1,2}[-/.]\d{1,2}"
        r")\b"
    ),
    re.compile(
        r"\b("
        r"\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}"
        r")\b"
    ),
    re.compile(
        r"\b("
        r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)"
        r"[a-z]*"
        r"\s+\d{1,2},?\s+\d{2,4}"
        r")\b",
        re.IGNORECASE,
    ),
]

DATE_FORMATS = [
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%Y.%m.%d",
    "%m/%d/%Y",
    "%m-%d-%Y",
    "%m.%d.%Y",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d.%m.%Y",
    "%m/%d/%y",
    "%m-%d-%y",
    "%d/%m/%y",
    "%d-%m-%y",
    "%b %d %Y",
    "%b %d, %Y",
    "%B %d %Y",
    "%B %d, %Y",
]


def clean_ocr_text(text: str) -> str:
    cleaned_lines: list[str] = []

    for raw_line in text.splitlines():
        line = " ".join(raw_line.strip().split())

        if line:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines)


def preprocess_receipt_image(image: Image.Image) -> Image.Image:
    processed_image = ImageOps.exif_transpose(image)
    processed_image = processed_image.convert("L")

    max_dimension = 2200

    if max(processed_image.size) > max_dimension:
        processed_image.thumbnail(
            (max_dimension, max_dimension),
            Image.Resampling.LANCZOS,
        )

    processed_image = ImageOps.autocontrast(processed_image)
    processed_image = ImageEnhance.Contrast(
        processed_image
    ).enhance(1.8)
    processed_image = processed_image.filter(
        ImageFilter.SHARPEN
    )

    return processed_image


def extract_text_from_image(file_content: bytes) -> str:
    if not file_content:
        raise ValueError("The uploaded receipt image is empty")

    try:
        image = Image.open(io.BytesIO(file_content))
    except UnidentifiedImageError as error:
        raise ValueError(
            "The uploaded file is not a valid image"
        ) from error
    except OSError as error:
        raise ValueError(
            "The receipt image could not be opened"
        ) from error

    if image.format not in SUPPORTED_IMAGE_FORMATS:
        raise ValueError(
            "Receipt images must be JPEG, PNG, or WEBP"
        )

    processed_image = preprocess_receipt_image(image)

    try:
        extracted_text = pytesseract.image_to_string(
            processed_image,
            config="--oem 3 --psm 6",
        )
    except pytesseract.TesseractNotFoundError as error:
        raise RuntimeError(
            "Tesseract OCR is not installed or is not available"
        ) from error
    except pytesseract.TesseractError as error:
        raise RuntimeError(
            "Tesseract could not process the receipt image"
        ) from error

    cleaned_text = clean_ocr_text(extracted_text)

    if not cleaned_text:
        raise ValueError(
            "No readable text was detected in the receipt"
        )

    return cleaned_text


def parse_money_value(value: str) -> float | None:
    normalized_value = value.replace(",", "")

    try:
        parsed_value = float(normalized_value)
    except ValueError:
        return None

    if parsed_value <= 0:
        return None

    return round(parsed_value, 2)


def extract_amounts_from_line(line: str) -> list[float]:
    amounts: list[float] = []

    for match in MONEY_PATTERN.finditer(line):
        whole_number = match.group(1).replace(",", "")
        decimal_part = match.group(2)
        parsed_amount = parse_money_value(
            f"{whole_number}.{decimal_part}"
        )

        if parsed_amount is not None:
            amounts.append(parsed_amount)

    return amounts


def extract_total(text: str) -> tuple[float | None, float]:
    lines = text.splitlines()
    total_candidates: list[tuple[int, float]] = []

    for index, line in enumerate(lines):
        if not TOTAL_LABEL_PATTERN.search(line):
            continue

        line_lower = line.lower()

        if "subtotal" in line_lower:
            continue

        amounts = extract_amounts_from_line(line)

        for amount in amounts:
            total_candidates.append((index, amount))

    if total_candidates:
        _, selected_amount = total_candidates[-1]

        return selected_amount, 0.95

    all_amounts: list[float] = []

    for line in lines:
        all_amounts.extend(extract_amounts_from_line(line))

    if not all_amounts:
        return None, 0.0

    return max(all_amounts), 0.55


def parse_date_candidate(value: str) -> date | None:
    normalized_value = value.strip()
    normalized_value = re.sub(
        r"\s+",
        " ",
        normalized_value,
    )

    for date_format in DATE_FORMATS:
        try:
            parsed_date = datetime.strptime(
                normalized_value,
                date_format,
            ).date()
        except ValueError:
            continue

        if parsed_date.year < 2000:
            continue

        if parsed_date > date.today():
            continue

        return parsed_date

    return None


def extract_transaction_date(
    text: str,
) -> tuple[date, float]:
    for pattern in DATE_PATTERNS:
        for match in pattern.finditer(text):
            parsed_date = parse_date_candidate(
                match.group(1)
            )

            if parsed_date is not None:
                return parsed_date, 0.9

    return date.today(), 0.35


def is_merchant_candidate(line: str) -> bool:
    normalized_line = line.strip()

    if len(normalized_line) < 2:
        return False

    if len(normalized_line) > 100:
        return False

    if MONEY_PATTERN.search(normalized_line):
        return False

    if TOTAL_LABEL_PATTERN.search(normalized_line):
        return False

    if re.search(
        r"\b("
        r"receipt|invoice|cashier|terminal|"
        r"transaction|order|customer|"
        r"address|phone|tel|tax|subtotal"
        r")\b",
        normalized_line,
        re.IGNORECASE,
    ):
        return False

    letter_count = sum(
        character.isalpha()
        for character in normalized_line
    )

    return letter_count >= 2


def clean_merchant_name(value: str) -> str:
    cleaned_value = re.sub(
        r"[^A-Za-z0-9&'.\- ]+",
        " ",
        value,
    )
    cleaned_value = " ".join(cleaned_value.split())

    return cleaned_value[:100]


def extract_merchant(text: str) -> tuple[str, float]:
    lines = text.splitlines()

    for line in lines[:8]:
        if not is_merchant_candidate(line):
            continue

        merchant = clean_merchant_name(line)

        if merchant:
            return merchant, 0.85

    return "Receipt Purchase", 0.3


def predict_category(
    merchant: str,
    text: str,
) -> tuple[str, float]:
    searchable_text = (
        f"{merchant}\n{text}"
    ).lower()

    category_scores: dict[str, int] = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(
            1
            for keyword in keywords
            if keyword in searchable_text
        )

        if score > 0:
            category_scores[category] = score

    if not category_scores:
        return "Other", 0.3

    selected_category = max(
        category_scores,
        key=category_scores.get,
    )
    selected_score = category_scores[selected_category]

    confidence = min(
        0.55 + (selected_score * 0.1),
        0.9,
    )

    return selected_category, confidence


def calculate_overall_confidence(
    merchant_confidence: float,
    amount_confidence: float,
    date_confidence: float,
    category_confidence: float,
) -> float:
    confidence = (
        merchant_confidence * 0.25
        + amount_confidence * 0.4
        + date_confidence * 0.2
        + category_confidence * 0.15
    )

    return round(confidence, 2)


def scan_receipt(file_content: bytes) -> dict[str, Any]:
    extracted_text = extract_text_from_image(
        file_content=file_content,
    )

    merchant, merchant_confidence = extract_merchant(
        extracted_text
    )
    amount, amount_confidence = extract_total(
        extracted_text
    )
    transaction_date, date_confidence = (
        extract_transaction_date(extracted_text)
    )
    category, category_confidence = predict_category(
        merchant=merchant,
        text=extracted_text,
    )

    overall_confidence = calculate_overall_confidence(
        merchant_confidence=merchant_confidence,
        amount_confidence=amount_confidence,
        date_confidence=date_confidence,
        category_confidence=category_confidence,
    )

    return {
        "title": merchant,
        "amount": amount,
        "category": category,
        "transaction_type": "expense",
        "transaction_date": transaction_date.isoformat(),
        "confidence": overall_confidence,
        "field_confidence": {
            "title": merchant_confidence,
            "amount": amount_confidence,
            "category": category_confidence,
            "transaction_date": date_confidence,
        },
        "raw_text": extracted_text,
    }
