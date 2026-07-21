from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import auth
import models
from database import get_db
from utils.receipt_scanner import scan_receipt


router = APIRouter(
    prefix="/receipts",
    tags=["receipts"],
)

security = HTTPBearer()

MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024

SUPPORTED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = auth.decode_access_token(
        credentials.credentials
    )

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
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from error

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


@router.post("/scan")
async def scan_receipt_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(
        get_current_user
    ),
):
    filename = file.filename or "receipt"

    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Receipt images must be JPEG, PNG, "
                "or WEBP"
            ),
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded receipt image is empty",
        )

    if len(file_content) > MAX_RECEIPT_FILE_SIZE:
        raise HTTPException(
            status_code=(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            ),
            detail=(
                "Receipt images must be 10 MB or smaller"
            ),
        )

    try:
        scan_result = scan_receipt(
            file_content=file_content
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to process the receipt image"
            ),
        ) from error

    return {
        "filename": filename,
        "message": "Receipt scanned successfully",
        "receipt": scan_result,
    }
