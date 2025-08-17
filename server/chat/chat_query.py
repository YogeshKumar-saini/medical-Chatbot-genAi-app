import os
import json
import asyncio
from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from fastapi import FastAPI
from pydantic import BaseModel

# Load environment variables
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# Initialize Pinecone index
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# Initialize embedding and LLM models
embed_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
llm = ChatGroq(temperature=0.3, model_name="llama3-8b-8192", groq_api_key=GROQ_API_KEY)

# Prompt template
prompt = PromptTemplate.from_template("""
You are a knowledgeable and reliable healthcare assistant.

Your task:
- Answer the user's healthcare-related question ONLY using the given context.
- If the context does not contain the answer, say clearly: 
  "I could not find relevant information in the provided documents."
- Avoid making up information (no hallucinations).
- Be concise, medically accurate, and explain in simple terms.
- Always cite sources with [Source: filename, Page: X].

Conversation history so far:
{chat_history}

Question:
{question}

Context:
{context}

Return the response in **structured JSON** with keys:
- "answer": your main response (clear and user-friendly)
- "citations": list of document sources and page numbers you used
- "confidence": "high", "medium", or "low" based on how relevant the context was
""")

rag_chain = prompt | llm

# Directory for persistent memory
MEMORY_DIR = "user_memory"
os.makedirs(MEMORY_DIR, exist_ok=True)

def load_memory(user_id: str):
    """Load user memory from disk."""
    path = os.path.join(MEMORY_DIR, f"memory_{user_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_memory(user_id: str, history):
    """Save user memory to disk."""
    path = os.path.join(MEMORY_DIR, f"memory_{user_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

async def answer_query(query: str, user_role: str, user_id: str = "default"):
    """Answer a query with persistent conversation memory."""
    history = load_memory(user_id)

    # Build context from Pinecone
    embedding = await asyncio.to_thread(embed_model.embed_query, query)
    results = await asyncio.to_thread(index.query, vector=embedding, top_k=5, include_metadata=True)

    filtered_contexts = []
    sources = set()
    for match in results["matches"]:
        metadata = match["metadata"]
        if metadata.get("role") == user_role:
            filtered_contexts.append(
                f"[Source: {metadata.get('source')}, Page: {metadata.get('page')}] {metadata.get('text','')}\n"
            )
            sources.add(f"{metadata.get('source')} (Page {metadata.get('page')})")

    docs_text = "\n".join(filtered_contexts) if filtered_contexts else "No relevant info."

    # Format structured chat history (last 5 turns only)
    history_text = "\n".join(
        [f"{turn['role'].capitalize()}: {turn['content']}" for turn in history[-5:]]
    )

    final_answer = await asyncio.to_thread(
        rag_chain.invoke,
        {"question": query, "context": docs_text, "chat_history": history_text}
    )

    # Save structured turn
    history.append({"role": "user", "content": query})
    history.append({"role": "assistant", "content": final_answer.content})

    save_memory(user_id, history)

    return {
        "answer": final_answer.content,
        # "sources": list(sources),
        "confidence": "high" if len(filtered_contexts) >= 3 else "medium"
    }

