import os
import time
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import hashlib
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
UPLOAD_DIR = Path("./uploaded_docs")
UPLOAD_DIR.mkdir(exist_ok=True)

# Metadata cache for tracking processed documents
METADATA_CACHE = UPLOAD_DIR / "metadata_cache.json"

class OptimizedVectorStore:
    def __init__(self):
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.spec = ServerlessSpec(cloud="aws", region=PINECONE_ENV)
        self.embed_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            task_type="RETRIEVAL_DOCUMENT"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,  # Increased for better context
            chunk_overlap=100,  # Increased overlap for continuity
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]
        )
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        self._ensure_index_exists()
        self.index = self.pc.Index(PINECONE_INDEX_NAME)
    
    def _ensure_index_exists(self):
        """Ensure Pinecone index exists with optimal configuration"""
        existing_indexes = [i["name"] for i in self.pc.list_indexes()]
        
        if PINECONE_INDEX_NAME not in existing_indexes:
            logger.info(f"Creating index: {PINECONE_INDEX_NAME}")
            self.pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=768,
                metric="cosine",  # Better for semantic similarity
                spec=self.spec
            )
            
            # Wait for index to be ready
            while not self.pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
                time.sleep(1)
            logger.info(f"Index {PINECONE_INDEX_NAME} is ready")
    
    def _load_metadata_cache(self) -> Dict:
        """Load processed documents metadata"""
        if METADATA_CACHE.exists():
            try:
                with open(METADATA_CACHE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load metadata cache: {e}")
        return {}
    
    def _save_metadata_cache(self, metadata: Dict):
        """Save processed documents metadata"""
        try:
            with open(METADATA_CACHE, 'w') as f:
                json.dump(metadata, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save metadata cache: {e}")
    
    def _get_file_hash(self, file_path: Path) -> str:
        """Generate hash for file content to detect changes"""
        hasher = hashlib.md5()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    
    async def _process_document_chunks(self, chunks: List, doc_id: str, role: str, filename: str) -> List[Dict]:
        """Process document chunks with optimized embedding generation"""
        processed_chunks = []
        
        # Prepare texts for batch embedding
        texts = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{doc_id}-{i}"
            text_content = chunk.page_content.strip()
            
            if len(text_content) < 50:  # Skip very short chunks
                continue
            
            texts.append(text_content)
            metadatas.append({
                "chunk_id": chunk_id,
                "doc_id": doc_id,
                "role": role,
                "source": filename,
                "page": chunk.metadata.get("page", 0),
                "text": text_content,
                "char_count": len(text_content)
            })
        
        if not texts:
            logger.warning(f"No valid chunks found for {filename}")
            return []
        
        # Generate embeddings in batches
        logger.info(f"Generating embeddings for {len(texts)} chunks from {filename}")
        
        try:
            embeddings = await asyncio.to_thread(
                self.embed_model.embed_documents, 
                texts
            )
            
            # Combine embeddings with metadata
            for i, (embedding, metadata) in enumerate(zip(embeddings, metadatas)):
                processed_chunks.append({
                    "id": metadata["chunk_id"],
                    "values": embedding,
                    "metadata": metadata
                })
            
            return processed_chunks
        
        except Exception as e:
            logger.error(f"Failed to generate embeddings for {filename}: {e}")
            return []
    
    async def _upsert_chunks_batch(self, chunks: List[Dict], batch_size: int = 100):
        """Upsert chunks to Pinecone in optimized batches"""
        total_chunks = len(chunks)
        logger.info(f"Upserting {total_chunks} chunks in batches of {batch_size}")
        
        with tqdm(total=total_chunks, desc="Uploading to Pinecone") as pbar:
            for i in range(0, total_chunks, batch_size):
                batch = chunks[i:i + batch_size]
                
                try:
                    await asyncio.to_thread(
                        self.index.upsert,
                        vectors=batch,
                        namespace="default"
                    )
                    pbar.update(len(batch))
                    
                except Exception as e:
                    logger.error(f"Failed to upsert batch {i//batch_size + 1}: {e}")
                    # Retry with smaller batch
                    if batch_size > 10:
                        await self._upsert_chunks_batch(batch, batch_size // 2)
                    else:
                        raise e
    
    async def process_uploaded_files(self, uploaded_files: List, role: str, doc_id: str) -> Dict:
        """
        Main function to process uploaded files with optimizations
        """
        metadata_cache = self._load_metadata_cache()
        results = {"processed": [], "skipped": [], "errors": []}
        
        for file in uploaded_files:
            try:
                # Save uploaded file
                file_path = UPLOAD_DIR / file.filename
                with open(file_path, "wb") as f:
                    content = await asyncio.to_thread(file.read)
                    f.write(content)
                
                # Check if file was already processed
                file_hash = self._get_file_hash(file_path)
                cache_key = f"{file.filename}_{role}"
                
                if cache_key in metadata_cache and metadata_cache[cache_key].get("hash") == file_hash:
                    logger.info(f"Skipping {file.filename} - already processed")
                    results["skipped"].append(file.filename)
                    continue
                
                # Load and split document
                logger.info(f"Processing {file.filename}")
                loader = PyPDFLoader(str(file_path))
                documents = await asyncio.to_thread(loader.load)
                
                if not documents:
                    logger.warning(f"No content extracted from {file.filename}")
                    results["errors"].append(f"{file.filename}: No content extracted")
                    continue
                
                chunks = self.text_splitter.split_documents(documents)
                logger.info(f"Split {file.filename} into {len(chunks)} chunks")
                
                # Process chunks and generate embeddings
                processed_chunks = await self._process_document_chunks(
                    chunks, doc_id, role, file.filename
                )
                
                if not processed_chunks:
                    results["errors"].append(f"{file.filename}: No valid chunks processed")
                    continue
                
                # Upsert to Pinecone
                await self._upsert_chunks_batch(processed_chunks)
                
                # Update metadata cache
                metadata_cache[cache_key] = {
                    "hash": file_hash,
                    "doc_id": doc_id,
                    "role": role,
                    "chunks_count": len(processed_chunks),
                    "processed_at": time.time()
                }
                
                results["processed"].append({
                    "filename": file.filename,
                    "chunks": len(processed_chunks),
                    "doc_id": doc_id
                })
                
                logger.info(f"Successfully processed {file.filename}")
                
            except Exception as e:
                error_msg = f"{file.filename}: {str(e)}"
                logger.error(f"Error processing {file.filename}: {e}")
                results["errors"].append(error_msg)
        
        # Save updated metadata cache
        self._save_metadata_cache(metadata_cache)
        
        return results
    
    async def delete_document(self, doc_id: str) -> bool:
        """Delete all vectors for a specific document"""
        try:
            # Query to find all vectors with this doc_id
            query_response = await asyncio.to_thread(
                self.index.query,
                vector=[0.0] * 768,  # Dummy vector
                filter={"doc_id": doc_id},
                top_k=10000,  # Large number to get all matches
                include_metadata=False
            )
            
            vector_ids = [match["id"] for match in query_response.get("matches", [])]
            
            if vector_ids:
                await asyncio.to_thread(self.index.delete, ids=vector_ids)
                logger.info(f"Deleted {len(vector_ids)} vectors for document {doc_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
            return False
    
    async def get_index_stats(self) -> Dict:
        """Get index statistics"""
        try:
            stats = await asyncio.to_thread(self.index.describe_index_stats)
            return {
                "total_vectors": stats.get("total_vector_count", 0),
                "dimension": stats.get("dimension", 0),
                "index_fullness": stats.get("index_fullness", 0)
            }
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {}
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=True)

# Global instance
vector_store = OptimizedVectorStore()

# Main interface function
async def load_vectorstore(uploaded_files: List, role: str, doc_id: str) -> Dict:
    """Main interface for processing uploaded files"""
    return await vector_store.process_uploaded_files(uploaded_files, role, doc_id)
