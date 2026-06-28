from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import os
import uuid

from app.database.connection import get_db
from app.schemas.content import ContentCreate, ContentResponse, ContentUpdate, ContentUploadResponse
from app.models.content import Content, ContentType
from app.models.users import User, UserRole
from app.core.security import decode_token
from app.services.pdf_extractor import PDFExtractor

router = APIRouter(prefix="/contents", tags=["Content Management"])

# 1. Define Security Scheme
security = HTTPBearer()

# Upload directory
UPLOAD_DIR = "app/uploads/contents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# 2. Standard Dependency to get Current User
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    token = credentials.credentials  # Extracts the token string
    
    payload = decode_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/upload", response_model=ContentUploadResponse)
async def upload_content(
    file: Optional[UploadFile] = File(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    grade_level: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),  # 3. Use Dependency
    db: AsyncSession = Depends(get_db)
):
    """Upload learning content (PDF or text)"""
    
    file_path = None
    extracted_text = None
    content_type = ContentType.TEXT
    
    # Handle file upload
    if file and file.filename:
        # Check file size - read content if size not provided by FastAPI
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be 10MB or less"
            )

        if not file.filename.lower().endswith(('.pdf', '.txt', '.docx')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF, TXT, and DOCX files are supported"
            )

        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)

            extension = file_extension.lower()
            if extension == "pdf":
                extracted_text = PDFExtractor.extract_text_from_pdf(file_path)
                content_type = ContentType.PDF
            elif extension == "txt":
                extracted_text = open(file_path, "r", encoding="utf-8").read()
                content_type = ContentType.TEXT
            elif extension == "docx":
                from docx import Document
                document = Document(file_path)
                extracted_text = "\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text.strip())
                content_type = ContentType.DOCUMENT
            
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process file: {str(e)}"
            )
    
    final_content = extracted_text or text_content
    
    new_content = Content(
        title=title,
        description=description,
        subject=subject,
        grade_level=grade_level,
        content_type=content_type,
        file_path=file_path,
        text_content=final_content,
        uploaded_by=current_user.id  
    )
    
    db.add(new_content)
    await db.commit()
    await db.refresh(new_content)
    
    return ContentUploadResponse(
        id=new_content.id,
        title=new_content.title,
        file_path=file_path or "",
        content_type=content_type.value,
        message="Content uploaded successfully"
    )


@router.get("/", response_model=List[ContentResponse])
async def get_all_contents(
    skip: int = 0,
    limit: int = 20,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),  # Use Dependency
    db: AsyncSession = Depends(get_db)
):
    """Get all learning contents"""
    
    query = select(Content).where(Content.is_active == True)
    
    if subject:
        query = query.where(Content.subject.ilike(f"%{subject}%"))
    if grade_level:
        query = query.where(Content.grade_level == grade_level)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    contents = result.scalars().all()
    
    return contents


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: int,
    current_user: User = Depends(get_current_user),  # Use Dependency
    db: AsyncSession = Depends(get_db)
):
   """Get specific content by ID"""
   
   result = await db.execute(select(Content).where(Content.id == content_id))
   content = result.scalar_one_or_none()
   
   if not content:
       raise HTTPException(status_code=404, detail="Content not found")
   
   return content


@router.get("/offline-pack", response_model=List[dict])
async def get_offline_pack(
   authorization: str = Header(...),
   db: AsyncSession = Depends(get_db)
):
   """Compact offline-first content pack for learners and sync queues."""
   query = select(Content).where(Content.is_active == True).order_by(Content.created_at.desc()).limit(50)
   result = await db.execute(query)
   contents = result.scalars().all()

   return [
       {
           "id": content.id,
           "title": content.title,
           "subject": content.subject,
           "grade_level": content.grade_level,
           "content_type": content.content_type.value,
           "text_content": content.text_content or "",
           "updated_at": content.updated_at or content.created_at,
       }
       for content in contents
   ]


@router.put("/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: int,
    content_update: ContentUpdate,
    current_user: User = Depends(get_current_user),  # Use Dependency
    db: AsyncSession = Depends(get_db)
):
    """Update content"""
    
    result = await db.execute(select(Content).where(Content.id == content_id))
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.uploaded_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this content"
        )
    
    update_data = content_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(content, field, value)
    
    await db.commit()
    await db.refresh(content)
    
    return content


@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    current_user: User = Depends(get_current_user),  # Use Dependency
    db: AsyncSession = Depends(get_db)
):
    """Delete content (soft delete)"""
    
    result = await db.execute(select(Content).where(Content.id == content_id))
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.uploaded_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this content"
        )
    
    content.is_active = False
    await db.commit()
    
    return {"message": "Content deleted successfully"}