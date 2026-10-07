from typing import Optional, List
import uuid
from fastapi import APIRouter, Depends, File, Form, UploadFile, Query, status, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.document import Document, DocumentStatus
from app.schemas.document import DocumentRead, DocumentDetailRead
from app.services.document_service import document_service

from app.api.deps import get_current_user_optional
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Enterprise Document",
    description="Upload original enterprise document (PDF, DOCX, TXT) and store file with database record. Restricted to Admin role.",
)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    document_type: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    access_level: Optional[str] = Form("internal"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user is not None:
        user_roles = [r.name for r in current_user.roles]
        if "admin" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only administrators can upload enterprise documents.",
            )

    doc_record = await document_service.upload_document(
        db=db,
        file=file,
        title=title,
        document_type=document_type,
        department=department,
        access_level=access_level,
        uploaded_by=current_user.id if current_user else None,
    )
    return doc_record


@router.post(
    "/{document_id}/process",
    response_model=DocumentRead,
    status_code=status.HTTP_200_OK,
    summary="Process Enterprise Document",
    description="Trigger asynchronous document parsing, chunking, embedding generation, and Qdrant vector indexing. Restricted to Admin role.",
)
def process_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document UUID: {document_id}",
        ) from err

    doc_record = db.query(Document).filter(Document.id == doc_uuid).first()
    if not doc_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )

    if current_user is not None:
        user_roles = [r.name for r in current_user.roles]
        if "admin" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only administrators can process enterprise documents.",
            )

    # Immediately transition document to PROCESSING
    doc_record.status = DocumentStatus.PROCESSING
    db.commit()
    db.refresh(doc_record)

    # Enqueue background task
    background_tasks.add_task(document_service.process_document_background, str(doc_record.id))

    return doc_record


@router.post(
    "/process-all",
    response_model=List[DocumentRead],
    status_code=status.HTTP_200_OK,
    summary="Process All Pending Documents",
    description="Trigger asynchronous parsing, chunking, embedding generation, and vector indexing for all pending or failed documents. Restricted to Admin role.",
)
def process_all_documents(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user is not None:
        user_roles = [r.name for r in current_user.roles]
        if "admin" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only administrators can process enterprise documents.",
            )

    pending_docs = (
        db.query(Document)
        .filter(Document.status.in_([DocumentStatus.UPLOADED, DocumentStatus.FAILED]))
        .all()
    )

    doc_ids = [str(doc.id) for doc in pending_docs]
    for doc in pending_docs:
        doc.status = DocumentStatus.PROCESSING

    db.commit()
    for doc in pending_docs:
        db.refresh(doc)

    # Dispatch to multi-threaded CPU/GPU worker pool
    document_service.process_multiple_documents_parallel(doc_ids)

    return pending_docs



@router.get(
    "",
    response_model=List[DocumentRead],
    status_code=status.HTTP_200_OK,
    summary="List Enterprise Documents",
    description="Retrieve paginated list of documents with optional department, status, and access-level filters enforcing authorization.",
)
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    department: Optional[str] = Query(None),
    status: Optional[DocumentStatus] = Query(None),
    access_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    return document_service.list_documents(
        db=db,
        user=current_user,
        skip=skip,
        limit=limit,
        department=department,
        status=status,
        access_level=access_level,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentDetailRead,
    status_code=status.HTTP_200_OK,
    summary="Get Document Details",
    description="Retrieve document metadata, processing status, and chunk count with authorization check.",
)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    doc, chunk_count = document_service.get_document(
        db=db,
        document_id=document_id,
        user=current_user,
    )
    result = DocumentDetailRead.model_validate(doc)
    result.chunk_count = chunk_count
    return result


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Document",
    description="Delete a document, its persisted chunks, Qdrant vectors, BM25 index entries, and physical file. Restricted to Admin role.",
)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user is not None:
        user_roles = [r.name for r in current_user.roles]
        if "admin" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only administrators can delete enterprise documents.",
            )

    document_service.delete_document(
        db=db,
        document_id=document_id,
        user=current_user,
    )
    return None
