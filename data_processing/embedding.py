import logging
import os
import uuid
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer

# === Configure logging ===
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === Initialize Qdrant client and models ===
client = QdrantClient(host = "localhost", port = 6333)
embed_model = SentenceTransformer("intfloat/e5-base-v2")

# === Recreate collection if not exists ===
if not client.collection_exists("KnowMe_chunks"):
    client.create_collection(
        collection_name="KnowMe_chunks",
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)
    
if not client.collection_exists("KnowMe_profiles"):
    client.create_collection(
        collection_name="KnowMe_profiles",
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
    )

# === Core Function to Embed and Store PDF Data ===
def embed_and_store_pdf(chunks: List[dict]) -> List[PointStruct]:
    """
    embeds and stores the given PDF into Qdrant.
    
    Args:
        pdf_path (str): Absolute or relative path to the PDF file.

    Returns:
        List[PointStruct]: Points that were embedded and stored.
    """

    # === Create Embeddings ===
    data = [chunk.get("page_content", "") for chunk in chunks]
    embeddings = embed_model.encode(data).tolist()

    # === Build + Upsert Points to Qdrant ===
    points = []
    for emb, chunk, text in zip(embeddings, chunks, data):
        if text.strip():
            metadata = chunk.get("metadata", {})
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=emb,
                payload={
                    "text": text,
                    "page": metadata.get("page_number", 1),
                    "source": os.path.basename(metadata.get("source", "unknown")),
                    "type": metadata.get("type", "text")
                }
            )
            points.append(point)
            logger.info(f"Embedded chunk: {text[:100]}... with metadata: {point.payload}")

    client.upsert(collection_name='KnowMe_chunks', points=points)
    logger.info(f"📦 Stored {len(points)} chunks into Qdrant.")

    return points  # Useful for testing or future chaining (e.g. rerank preview)

def save_user_profile_qdrant(user_id, profile_data):
    # Convert dict to readable string for embedding
    profile_text = "\n".join([f"{k}: {v}" for k, v in profile_data.items()])
    
    vector = embed_model.encode(profile_text).tolist()
    
    point = PointStruct(
        id=user_id,  # use user_id so you can update it later
        vector=vector,
        payload={
            "user_id": user_id,
            "profile_text": profile_text,
            "type": "user_profile"
        }
    )
    
    client.upsert(collection_name="KnowMe_profiles", points=[point])

def get_user_profile_qdrant(user_id):
    results = client.scroll(
        collection_name="KnowMe_profiles",
        scroll_filter=Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]),
        limit=1
    )
    if results[0]:
        return results[0][0].payload.get("profile_text", "")
    return ""