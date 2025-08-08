from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os, tempfile
from data_processing.parsing_chunking import extract, chunk_pdfplumber_parsed_data
from data_processing.embedding import embed_model, embed_and_store_pdf, client, get_user_profile_qdrant
from src.llm_config import invoke_with_retry
from sentence_transformers import CrossEncoder
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="KnowMe, your personlaised AI Advisor.",
              description="""API for uploading pdf documents in Qdrant db to provide personalised recommendations.""",
              version="1.0.0")

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2") 
session_lock = threading.Lock()  # Thread-safe session management

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Root ---
@app.post("/")
async def root():
    return 'Welcome to KnowMe, your personlaised AI Advisor.'

# --- 1. Upload PDF and get chunks ---
@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
         # Store the uploaded PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(await file.read())
            temp_path = temp_pdf.name
        
        # Parse and chunk
        pages = extract(temp_path)

        # Adapt to expected dict format
        parsed_pages = []
        for p in pages.pages:
            parsed_pages.append({
                "text": p.text,
                "metadata": {
                    "page_number": p.page_number,
                    "source": file.filename  # Use the original uploaded filename
                },
                "tables": []  # Add table extraction later if needed
            })
            
        chunks = chunk_pdfplumber_parsed_data(parsed_pages)
        stored_points = embed_and_store_pdf(chunks)

        # Remove temp file after processing
        os.remove(temp_path)
        
        return {
            "filename": file.filename,
            "chunks": chunks,
            "message": f"Successfully uploaded and processed {file.filename}",
            "chunks_stored": len(stored_points)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

# --- 2. Chat with LLM (context from PDF + memory) ---
@app.post("/chat/")
async def chat_with_knowMe(user_msg: str, request: Request):
    try:
        if not user_msg.strip():
            raise HTTPException(status_code=400, detail="User message cannot be empty")

        # ✅ Identify user (frontend should send it in headers or auth)
        user_id = request.headers.get("X-User-ID", "anonymous")

        # ✅ Step 0: Get user profile
        profile_context = get_user_profile_qdrant(user_id)

        # Step 1: Embed user query
        query_vector = embed_model.encode(user_msg).tolist()

        # Step 2: Search Qdrant for document chunks
        results = client.search(
            collection_name="KnowMe_chunks",
            query_vector=query_vector,
            limit=20,
            with_payload=True,
            query_filter=Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
            )  # ✅ Only this user's docs
        )

        # Step 3: Rerank
        context = ""
        references = []
        if results:
            pairs = [(user_msg, r.payload["text"]) for r in results]
            scores = reranker.predict(pairs)
            ranked = sorted(zip(results, scores), key=lambda x: x[1], reverse=True)

            top_chunks = []
            for (r, score) in ranked[:5]:
                if score < 0.3:
                    continue
                text = r.payload["text"]
                source = r.payload.get("source", "unknown_pdf")
                page = r.payload.get("page", "unknown_page")
                top_chunks.append(f"{text}\n(Source: {source}, Page: {page})")
                references.append(f"{source} (Page {page})")

            context = "\n---\n".join(top_chunks)

        # Step 4: Build final input
        final_context = f"User Profile:\n{profile_context}\n\nRetrieved Context:\n{context}" if profile_context else context

        prompt_input = {
            "input": f"{user_msg}\n\n{final_context if final_context else ''}"
        }

        # Step 5: Get LLM output
        response = invoke_with_retry(prompt_input)

        return {
            "response": response["text"].strip(),
            "source": references if references else ""
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during chat: {str(e)}")

# --- 3. List PDFs in DB ---
@app.get("/pdfs/")
async def list_pdfs():
    '''Gets the name of Pdf files uploaded and stored in qdrant db.

    Args:  None.

    Return: Dict of list of pdf files.
    '''
    try:
        res = client.scroll(
            collection_name="KnowMe_chunks",
            limit=1000,
            with_payload=True  # This is the key you're missing
        )
        pdfs = set()
        for point in res[0]:
            source = point.payload.get("source")
            if source:
                pdfs.add(source)
        return {"pdfs": list(pdfs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. Delete PDFs in DB ---
@app.delete("/pdfs/{pdf_name}")
async def delete_pdf(pdf_name: str) -> Dict[str, str]:
    """
    Delete a PDF's associated chunks from Qdrant by its original filename.
    """
    try:
        # Normalize pdf_name (remove path prefixes, ensure consistent extension)
        pdf_name = os.path.basename(pdf_name.strip())
        if not pdf_name:
            raise HTTPException(status_code=400, detail="Invalid PDF name")

        # Check if chunks exist in Qdrant
        search_result = client.scroll(
            collection_name="KnowMe_chunks",
            scroll_filter=Filter(must=[FieldCondition(key="source", match=MatchValue(value=pdf_name))]),
            limit=1
        )
        chunks_exist = len(search_result[0]) > 0

        if not chunks_exist:
            raise HTTPException(status_code=404, detail=f"No PDF or chunks found for: {pdf_name}")

        # Delete chunks from Qdrant
        client.delete(
            collection_name="KnowMe_chunks",
            points_selector=Filter(must=[FieldCondition(key="source", match=MatchValue(value=pdf_name))])
        )

        return {
            "message": f"Successfully deleted all chunks for PDF '{pdf_name}' from Qdrant."
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete PDF or chunks: {str(e)}")

# --- 4. Global error handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})