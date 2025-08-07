from pydantic import BaseModel

class PageText(BaseModel):
    page_number: int
    text: str
    filename: str

class PdfExtractionResult(BaseModel):
    pages: list[PageText]