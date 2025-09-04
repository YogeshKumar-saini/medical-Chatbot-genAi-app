import os
import asyncio
import logging
from typing import Dict, List, Optional
from functools import lru_cache
from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
import json
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Environment variables with validation
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# Validate required environment variables
required_vars = [GOOGLE_API_KEY, PINECONE_API_KEY, GROQ_API_KEY, PINECONE_INDEX_NAME]
if not all(required_vars):
    raise ValueError("Missing required environment variables")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# Global instances with connection pooling
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# Optimized embedding model with caching
class CachedEmbeddingModel:
    def __init__(self):
        self.model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.cache = {}
        self.max_cache_size = 1000
    
    def _get_cache_key(self, text: str) -> str:
        return hashlib.md5(text.encode()).hexdigest()
    
    async def embed_query(self, text: str) -> List[float]:
        cache_key = self._get_cache_key(text)
        
        if cache_key in self.cache:
            logger.info(f"Cache hit for query: {text[:50]}...")
            return self.cache[cache_key]
        
        # Clean cache if it's too large
        if len(self.cache) >= self.max_cache_size:
            # Remove oldest 20% of entries
            items_to_remove = list(self.cache.keys())[:int(self.max_cache_size * 0.2)]
            for key in items_to_remove:
                del self.cache[key]
        
        embedding = await asyncio.to_thread(self.model.embed_query, text)
        self.cache[cache_key] = embedding
        logger.info(f"Generated embedding for: {text[:50]}...")
        return embedding

embed_model = CachedEmbeddingModel()

# Optimized LLM with retry logic
class OptimizedLLM:
    def __init__(self):
        self.llm = ChatGroq(
            temperature=0.2,  # Reduced for more consistent responses
            model_name="llama-3.1-8b-instant",
            groq_api_key=GROQ_API_KEY,
            max_retries=3,
            request_timeout=30
        )
    
    async def generate(self, prompt: str, max_tokens: int = 1000) -> str:
        try:
            response = await asyncio.to_thread(self.llm.invoke, prompt)
            return response.content.strip()
        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            raise

llm = OptimizedLLM()

# Optimized prompts
DOCUMENT_PROMPT = PromptTemplate.from_template("""
You are a knowledgeable medical assistant. Answer the question using ONLY the provided context.

Context: {context}
Question: {question}

Guidelines:
- Be precise and factual
- Cite sources when available
- If context is insufficient, state clearly what information is missing
- Use medical terminology appropriately for the user's role

Answer:
""")

GENERAL_PROMPT = PromptTemplate.from_template("""
You are a medical AI assistant. Provide accurate general medical information for this question.

Question: {question}
User Role: {role}

Guidelines:
- Tailor complexity to user's role (patient vs healthcare professional)
- Always emphasize consulting healthcare professionals
- For emergencies, advise immediate medical attention
- Be helpful but not diagnostic
- Include disclaimer about general information

Answer:
""")

# Cache for suggested queries
@lru_cache(maxsize=1)
def get_suggested_queries() -> List[str]:
    """Cached suggested queries organized by medical specialties"""
    return [
        "What are the early warning signs of diabetes?",
        "How to manage hypertension without medication?",
        "What are the different types of chest pain and when to worry?",
        "Signs of stroke - what to look for and when to act?",
        "Common medication interactions to avoid",
        "When is a fever dangerous and requires immediate care?",
        "Understanding different types of headaches",
        "Heart attack symptoms in women vs men",
        "Managing chronic pain without opioids",
        "Mental health: recognizing depression and anxiety symptoms"
    ]

# Optimized vector search with better filtering
async def search_documents(query: str, user_role: str, top_k: int = 5) -> tuple:
    """Optimized document search with role-based filtering"""
    try:
        # Get embedding for query
        embedding = await embed_model.embed_query(query)
        
        # Search with metadata filtering - try role-specific first, then fallback to all
        results = await asyncio.to_thread(
            index.query,
            vector=embedding,
            top_k=top_k * 3,  # Get more results to filter
            include_metadata=True,
            filter={"role": user_role}  # Use Pinecone's native filtering
        )

        filtered_contexts = []
        sources = set()

        # If no results with role filter, try without filter
        if not results.get("matches"):
            logger.info(f"No results found for role {user_role}, trying without role filter")
            results = await asyncio.to_thread(
                index.query,
                vector=embedding,
                top_k=top_k * 3,
                include_metadata=True
            )

        # Process results with adjusted score threshold
        logger.info(f"Found {len(results.get('matches', []))} matches for query: {query[:50]}...")
        for match in results.get("matches", []):
            score = match.get("score", 0)
            logger.info(f"Match score: {score}")
            if score > 0.6:  # Lower threshold for better recall
                metadata = match.get("metadata", {})
                text = metadata.get("text", "")
                source = metadata.get("source", "Unknown")

                if text:
                    filtered_contexts.append({
                        "text": text,
                        "score": score,
                        "source": source
                    })
                    sources.add(source)
                    logger.info(f"Added context from {source} with score {score}")
        
        # Sort by relevance score
        filtered_contexts.sort(key=lambda x: x["score"], reverse=True)
        
        return filtered_contexts[:top_k], list(sources)
    
    except Exception as e:
        logger.error(f"Document search failed: {str(e)}")
        return [], []

# Main optimized query function
async def answer_query(query: str, user_role: str) -> Dict:
    """
    Optimized main function to answer queries with fallback strategy
    """
    if not query.strip():
        return {
            "answer": "Please provide a valid medical question.",
            "sources": [],
            "type": "error"
        }
    
    start_time = asyncio.get_event_loop().time()
    
    try:
        # Search for relevant documents
        contexts, sources = await search_documents(query, user_role)
        
        if contexts:
            # Document-based response
            logger.info(f"Using {len(contexts)} document contexts for response")
            context_text = "\n\n".join([
                f"Source: {ctx['source']}\nContent: {ctx['text']}"
                for ctx in contexts
            ])

            prompt = DOCUMENT_PROMPT.format(
                question=query,
                context=context_text
            )

            answer = await llm.generate(prompt, max_tokens=800)

            response = {
                "answer": answer,
                "sources": sources,
                "type": "document_based",
                "relevance_scores": [ctx["score"] for ctx in contexts]
            }
        else:
            # General knowledge fallback
            logger.info(f"No document contexts found, using general knowledge for query: {query[:50]}...")
            prompt = GENERAL_PROMPT.format(
                question=query,
                role=user_role
            )

            answer = await llm.generate(prompt, max_tokens=600)

            # Add medical disclaimer
            disclaimer = "\n\n⚠️ **Medical Disclaimer**: This information is for educational purposes only and should not replace professional medical advice. Always consult with qualified healthcare providers for personalized medical guidance."

            response = {
                "answer": answer + disclaimer,
                "sources": ["General Medical Knowledge"],
                "type": "general_knowledge"
            }
        
        # Log performance
        elapsed_time = asyncio.get_event_loop().time() - start_time
        logger.info(f"Query processed in {elapsed_time:.2f}s - Type: {response['type']}")
        
        return response
    
    except Exception as e:
        logger.error(f"Query processing failed: {str(e)}")
        return {
            "answer": "I apologize, but I'm experiencing technical difficulties. Please try again or consult with a healthcare professional directly.",
            "sources": [],
            "type": "error"
        }

# Health check function
async def health_check() -> Dict:
    """Check system health"""
    try:
        # Test embedding
        test_embedding = await embed_model.embed_query("test")
        
        # Test vector search
        test_results = await asyncio.to_thread(
            index.query,
            vector=test_embedding,
            top_k=1,
            include_metadata=True
        )
        
        # Test LLM
        test_response = await llm.generate("Say 'System OK'", max_tokens=10)
        
        return {
            "status": "healthy",
            "embedding_service": "OK",
            "vector_db": "OK",
            "llm_service": "OK",
            "cache_size": len(embed_model.cache)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }