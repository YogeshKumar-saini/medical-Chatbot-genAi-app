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

from pathlib import Path
load_dotenv(Path(__file__).parent.parent / ".env")

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

from langchain_google_genai import ChatGoogleGenerativeAI

# Optimized LLM with retry logic
class OptimizedLLM:
    def __init__(self):
        provider = os.getenv("LLM_PROVIDER", "gemini")
        groq_model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
        logger.info(f"Initializing LLM with provider: {provider}")

        if provider == "groq" and GROQ_API_KEY:
             logger.info(f"Using Groq model: {groq_model}")
             self.llm = ChatGroq(
                 temperature=0.3,
                 model_name=groq_model,
                 groq_api_key=GROQ_API_KEY,
                 max_retries=3
             )
        else:
             self.llm = ChatGoogleGenerativeAI(
                temperature=0.3,
                model="gemini-3-pro-preview",
                google_api_key=GOOGLE_API_KEY,
                request_timeout=30,
                max_retries=3,
                convert_system_message_to_human=True
            )

    async def generate(self, prompt: str, max_tokens: int = 1000) -> str:
        try:
            response = await asyncio.to_thread(self.llm.invoke, prompt)
            return response.content.strip()
        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            raise

    async def generate_stream(self, prompt: str, max_tokens: int = 1000):
        """Streaming version of generate method"""
        try:
            # For Gemini, we'll simulate streaming by yielding chunks
            # In a production setup, you'd use the actual streaming API
            response = await asyncio.to_thread(self.llm.invoke, prompt)
            content = response.content.strip()

            # Split content into chunks for streaming effect
            words = content.split()
            current_chunk = ""

            for word in words:
                current_chunk += word + " "
                if len(current_chunk) >= 50:  # Yield chunks of ~50 characters
                    yield current_chunk
                    current_chunk = ""
                    await asyncio.sleep(0.05)  # Small delay for streaming effect

            if current_chunk:
                yield current_chunk

        except Exception as e:
            logger.error(f"Streaming LLM generation failed: {str(e)}")
            yield f"Error: {str(e)}"

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

# Conversation memory class
class ConversationMemory:
    def __init__(self, max_messages: int = 10):
        self.max_messages = max_messages
        self.messages = []

    def add_message(self, role: str, content: str):
        """Add a message to the conversation memory"""
        self.messages.append({"role": role, "content": content})
        # Keep only the most recent messages
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def get_context(self, current_query: str = "") -> str:
        """Get conversation context for the current query"""
        if not self.messages:
            return ""

        # Format conversation history
        context_parts = []
        for msg in self.messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            content = msg["content"][:200] + "..." if len(msg["content"]) > 200 else msg["content"]
            context_parts.append(f"{role}: {content}")

        conversation_context = "\n".join(context_parts)

        return f"Previous conversation:\n{conversation_context}\n\nCurrent question: {current_query}\n\n"

    def clear(self):
        """Clear conversation memory"""
        self.messages = []

# Global conversation memory store (in production, this should be per-user/session)
conversation_memories = {}

def get_conversation_memory(user_id: str) -> ConversationMemory:
    """Get or create conversation memory for a user"""
    if user_id not in conversation_memories:
        conversation_memories[user_id] = ConversationMemory()
    return conversation_memories[user_id]

# Enhanced prompts with conversation context
DOCUMENT_PROMPT_WITH_CONTEXT = PromptTemplate.from_template("""
You are a knowledgeable medical assistant engaged in an ongoing conversation.

{conversation_context}

Context from medical knowledge base: {context}
Current question: {question}

Guidelines:
- Consider the conversation history when responding
- Be precise and factual
- Cite sources when available
- If context is insufficient, state clearly what information is missing
- Use medical terminology appropriately for the user's role
- Maintain continuity with previous responses

Answer:
""")

GENERAL_PROMPT_WITH_CONTEXT = PromptTemplate.from_template("""
You are a medical AI assistant engaged in an ongoing conversation.

{conversation_context}

Current question: {question}
User Role: {role}

Guidelines:
- Consider the conversation history when responding
- Tailor complexity to user's role (patient vs healthcare professional)
- Always emphasize consulting healthcare professionals
- For emergencies, advise immediate medical attention
- Be helpful but not diagnostic
- Include disclaimer about general information
- Maintain continuity with previous responses

Answer:
""")

# Enhanced streaming version with conversation memory
async def answer_query_stream_with_memory(query: str, user_role: str, user_id: str):
    """
    Streaming version with conversation memory that yields chunks as they're generated
    """
    if not query.strip():
        yield "Please provide a valid medical question."
        return

    try:
        # Get conversation memory
        memory = get_conversation_memory(user_id)
        conversation_context = memory.get_context(query)

        # Add current user message to memory
        memory.add_message("user", query)

        # Search for relevant documents
        contexts, sources = await search_documents(query, user_role)

        if contexts:
            # Document-based response
            logger.info(f"Using {len(contexts)} document contexts for streaming response with memory")
            context_text = "\n\n".join([
                f"Source: {ctx['source']}\nContent: {ctx['text']}"
                for ctx in contexts
            ])

            prompt = DOCUMENT_PROMPT_WITH_CONTEXT.format(
                conversation_context=conversation_context,
                question=query,
                context=context_text
            )

            full_response = ""
            async for chunk in llm.generate_stream(prompt, max_tokens=800):
                full_response += chunk
                yield chunk

            # Add AI response to memory
            memory.add_message("assistant", full_response)

        else:
            # General knowledge fallback
            logger.info(f"No document contexts found, using general knowledge for query: {query[:50]}...")
            prompt = GENERAL_PROMPT_WITH_CONTEXT.format(
                conversation_context=conversation_context,
                question=query,
                role=user_role
            )

            full_response = ""
            async for chunk in llm.generate_stream(prompt, max_tokens=600):
                full_response += chunk
                yield chunk

            # Add medical disclaimer at the end
            disclaimer = "\n\n⚠️ **Medical Disclaimer**: This information is for educational purposes only and should not replace professional medical advice. Always consult with qualified healthcare providers for personalized medical guidance."
            yield disclaimer
            full_response += disclaimer

        # Add AI response to memory
        memory.add_message("assistant", full_response)

        # Generate contextual follow-up questions
        try:
            followup_prompt = f"""Based on this conversation, suggest 2-3 relevant follow-up questions the user might ask. Keep them concise and medically relevant.

Conversation:
{conversation_context}
User: {query}
Assistant: {full_response[:500]}...

Suggested follow-up questions:"""

            followup_response = await llm.generate(followup_prompt, max_tokens=150)
            # Store follow-up suggestions in memory for potential use
            memory.followup_suggestions = followup_response.strip().split('\n')[:3]
        except Exception as e:
            logger.warning(f"Failed to generate follow-up suggestions: {e}")

    except Exception as e:
        logger.error(f"Streaming query processing with memory failed: {str(e)}")
        yield "I apologize, but I'm experiencing technical difficulties. Please try again or consult with a healthcare professional directly."

# Streaming version of answer_query (legacy compatibility)
async def answer_query_stream(query: str, user_role: str):
    """
    Legacy streaming version without conversation memory
    """
    await answer_query_stream_with_memory(query, user_role, "anonymous")

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
