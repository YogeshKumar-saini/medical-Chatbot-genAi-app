import streamlit as st
from dotenv import load_dotenv
import requests
from requests.auth import HTTPBasicAuth
import os
import time
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8080")

# Page configuration with optimizations
st.set_page_config(
    page_title="MediAI Pro",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed",
    menu_items={
        'Get Help': 'https://github.com/your-repo/medical-ai',
        'Report a bug': 'https://github.com/your-repo/medical-ai/issues',
        'About': "MediAI Pro - Advanced Medical AI Assistant v2.0"
    }
)


# Optimized session state with caching
class SessionManager:
    """Optimized session state management"""
    
    @staticmethod
    def init_session():
        """Initialize session state with default values"""
        defaults = {
            "username": "",
            "password": "",
            "role": "",
            "logged_in": False,
            "chat_history": [],
            "selected_query": "",
            "user_preferences": {},
            "last_activity": time.time(),
            "session_id": None
        }
        
        for key, default_value in defaults.items():
            if key not in st.session_state:
                st.session_state[key] = default_value
    
    @staticmethod
    def update_activity():
        """Update last activity timestamp"""
        st.session_state.last_activity = time.time()
    
    @staticmethod
    def clear_session():
        """Clear all session data"""
        for key in list(st.session_state.keys()):
            if key.startswith(('username', 'password', 'role', 'logged_in', 'chat_', 'selected_')):
                del st.session_state[key]

# Initialize session
session_manager = SessionManager()
session_manager.init_session()

# Optimized API client with retry logic
class APIClient:
    """Optimized API client with caching and retry logic"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.timeout = 30
        # Add connection pooling
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,
            pool_maxsize=20,
            max_retries=3
        )
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)
    
    def get_auth(self) -> HTTPBasicAuth:
        """Get authentication object"""
        return HTTPBasicAuth(st.session_state.username, st.session_state.password)
    
    async def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with retry logic"""
        url = f"{self.base_url}/api/v1{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {method} {endpoint} - {str(e)}")
            raise
    
    def login(self, username: str, password: str) -> Dict:
        """Login user"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/login",
                auth=HTTPBasicAuth(username, password),
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Login failed: {str(e)}")
    
    def signup(self, user_data: Dict) -> Dict:
        """Register new user"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/signup",
                json=user_data,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Signup failed: {str(e)}")
    
    def chat(self, message: str) -> Dict:
        """Send chat message"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/chat/chat",
                data={"message": message},
                auth=self.get_auth(),
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Chat request failed: {str(e)}")
    
    def get_suggestions(self) -> List[str]:
        """Get chat suggestions"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/v1/chat/suggestions",
                auth=self.get_auth(),
                timeout=10
            )
            response.raise_for_status()
            return response.json().get("suggested_queries", [])
        except Exception:
            return []  # Return empty list on failure
    
    def upload_document(self, file, role: str) -> Dict:
        """Upload document"""
        try:
            files = {"file": (file.name, file.getvalue(), "application/pdf")}
            data = {"role": role}
            response = self.session.post(
                f"{self.base_url}/api/v1/upload_docs",
                files=files,
                data=data,
                auth=self.get_auth(),
                timeout=60  # Longer timeout for file upload
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Document upload failed: {str(e)}")

# Initialize API client
api_client = APIClient(API_URL)

def render_hero_header():
    """Render the main header with animations"""
    st.markdown("""
    <div class="hero-header">
        <div class="hero-title">🏥 MediAI Pro</div>
        <div class="hero-subtitle">
            Advanced AI-Powered Medical Information System with Real-Time Intelligence
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_auth_interface():
    """Optimized authentication interface"""
    render_hero_header()
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<div class="ultra-glass-card">', unsafe_allow_html=True)
        
        tab1, tab2 = st.tabs(["🔐 Sign In", "✨ Create Account"])

        with tab1:
            st.markdown("### 🎯 Welcome Back!")
            st.markdown("Access your personalized medical AI assistant")
            
            with st.form("login_form", clear_on_submit=False):
                username = st.text_input(
                    "👤 Username", 
                    placeholder="Enter your username",
                    help="Use your registered username"
                )
                password = st.text_input(
                    "🔒 Password", 
                    type="password", 
                    placeholder="Enter your password",
                    help="Enter your secure password"
                )
                
                col_a, col_b, col_c = st.columns([1, 2, 1])
                with col_b:
                    submitted = st.form_submit_button("🚀 Sign In", use_container_width=True)
                
                if submitted and username and password:
                    with st.spinner("🔍 Authenticating..."):
                        try:
                            user_data = api_client.login(username, password)
                            
                            # Update session state
                            st.session_state.username = username
                            st.session_state.password = password
                            st.session_state.role = user_data.get("role", "")
                            st.session_state.logged_in = True
                            session_manager.update_activity()
                            
                            st.success(f"🎉 Welcome back, {username}!")
                            time.sleep(1)
                            st.rerun()
                            
                        except Exception as e:
                            st.error(f"❌ {str(e)}")

        with tab2:
            st.markdown("### 🌟 Join MediAI Pro")
            st.markdown("Create your account for personalized medical assistance")
            
            with st.form("signup_form", clear_on_submit=True):
                col_left, col_right = st.columns(2)
                
                with col_left:
                    new_user = st.text_input(
                        "👤 Username", 
                        placeholder="Choose a unique username",
                        help="3-50 characters, letters, numbers, underscores only"
                    )
                    new_pass = st.text_input(
                        "🔒 Password", 
                        type="password", 
                        placeholder="Create a secure password",
                        help="At least 8 characters with letters and numbers"
                    )
                
                with col_right:
                    full_name = st.text_input(
                        "📝 Full Name", 
                        placeholder="Your full name (optional)",
                        help="Optional: Your display name"
                    )
                    email = st.text_input(
                        "📧 Email", 
                        placeholder="email@example.com (optional)",
                        help="Optional: For password recovery"
                    )
                
                new_role = st.selectbox(
                    "👨‍⚕️ Your Role", 
                    ["patient", "doctor", "nurse", "admin", "other"],
                    help="Select your role to get personalized content and access levels"
                )
                
                col_a, col_b, col_c = st.columns([1, 2, 1])
                with col_b:
                    submitted = st.form_submit_button("✨ Create Account", use_container_width=True)
                
                if submitted and new_user and new_pass:
                    with st.spinner("🔧 Creating your account..."):
                        try:
                            signup_data = {
                                "username": new_user,
                                "password": new_pass,
                                "role": new_role,
                                "full_name": full_name if full_name else None,
                                "email": email if email else None
                            }
                            
                            result = api_client.signup(signup_data)
                            st.success("🎉 Account created successfully! Please sign in.")
                            
                        except Exception as e:
                            st.error(f"❌ {str(e)}")
        
        st.markdown('</div>', unsafe_allow_html=True)

def render_document_upload():
    """Document upload interface for admins"""
    st.markdown('<div class="ultra-glass-card">', unsafe_allow_html=True)
    st.markdown("### 📚 Document Management Hub")
    st.markdown("Upload and manage medical documents for role-based access")
    
    with st.form("upload_form", clear_on_submit=True):
        col1, col2 = st.columns([2, 1])
        
        with col1:
            uploaded_file = st.file_uploader(
                "📂 Choose PDF Document",
                type=["pdf"],
                help="Upload medical documents, guidelines, protocols, or research papers"
            )
        
        with col2:
            role_for_doc = st.selectbox(
                "🎯 Access Control",
                ["doctor", "nurse", "patient", "other"],
                help="Select which role can access this document"
            )
            
            priority = st.selectbox(
                "📊 Priority Level",
                ["high", "medium", "low"],
                index=1,
                help="Set document priority for search ranking"
            )
        
        col_a, col_b, col_c = st.columns([1, 2, 1])
        with col_b:
            submitted = st.form_submit_button("🚀 Upload Document", use_container_width=True)
        
        if submitted and uploaded_file:
            with st.spinner("🔄 Processing document..."):
                try:
                    result = api_client.upload_document(uploaded_file, role_for_doc)
                    st.success(f"✅ Successfully uploaded: {uploaded_file.name}")
                    
                    # Display upload details
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.info(f"📋 **Doc ID:** {result.get('doc_id', 'N/A')}")
                    with col2:
                        st.info(f"👥 **Access:** {result.get('accessible_to', role_for_doc)}")
                    with col3:
                        st.info(f"📊 **Priority:** {priority.upper()}")
                        
                except Exception as e:
                    st.error(f"❌ {str(e)}")
        elif submitted:
            st.warning("⚠️ Please select a file to upload")
    
    st.markdown('</div>', unsafe_allow_html=True)

def render_chat_interface():
    """Advanced chat interface with real-time features"""
    st.markdown('<div class="chat-container">', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="chat-header">
        <div class="chat-title">💬 AI Medical Assistant</div>
        <div class="chat-subtitle">
            Ask me anything about medical topics - I provide both document-based insights and general medical knowledge
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Get and display suggestions
    try:
        suggestions = api_client.get_suggestions()
        personalized = len(suggestions) > 5  # Assume personalized if more than base suggestions
    except:
        suggestions = [
            "What are the symptoms of diabetes?",
            "How can I manage high blood pressure?",
            "What are common treatments for asthma?",
            "When should I see a doctor for chest pain?",
            "What medications interact with blood thinners?"
        ]
        personalized = False
    
    # Display chat history
    if st.session_state.chat_history:
        st.markdown("### 💭 Recent Conversation")
        
        # Show last 6 messages
        recent_messages = st.session_state.chat_history[-6:]
        for msg in recent_messages:
            if msg["type"] == "user":
                st.markdown(f"""
                <div class="message-container">
                    <div class="user-message">👤 {msg["content"]}</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="message-container">
                    <div class="ai-message">{msg["content"]}</div>
                </div>
                """, unsafe_allow_html=True)
                
                # Show sources if available
                if msg.get("sources"):
                    for source in msg["sources"]:
                        st.markdown(f"""
                        <div class="source-item">
                            📚 <strong>Source:</strong> {source}
                        </div>
                        """, unsafe_allow_html=True)

    # Suggested queries
    if suggestions:
        suggestion_type = "🎯 Personalized" if personalized else "💡 Popular"
        st.markdown(f"### {suggestion_type} Medical Questions")
        
        # Display as interactive grid
        cols = st.columns(2)
        for i, suggestion in enumerate(suggestions[:8]):  # Show up to 8 suggestions
            with cols[i % 2]:
                if st.button(
                    f"💊 {suggestion}", 
                    key=f"suggestion_{i}",
                    help=f"Click to use this question",
                    use_container_width=True
                ):
                    st.session_state.selected_query = suggestion
                    st.rerun()

    # Main chat input
    st.markdown("### 🗣️ Ask Your Medical Question")
    
    with st.form("chat_form", clear_on_submit=True):
        default_msg = st.session_state.get("selected_query", "")
        
        col1, col2 = st.columns([4, 1])
        with col1:
            message = st.text_area(
                "Your question:",
                value=default_msg,
                placeholder="Ask about symptoms, treatments, medications, procedures, or any health-related topic...",
                help="💡 Tip: Be specific for better answers. I can help with both general questions and document-specific queries.",
                height=120,
                max_chars=1000
            )
        
        with col2:
            st.markdown("<br>", unsafe_allow_html=True)  # Spacing
            submitted = st.form_submit_button("🚀 Get Answer", use_container_width=True)
            
            if st.session_state.chat_history:
                clear_chat = st.form_submit_button("🗑️ Clear History", use_container_width=True)
                if clear_chat:
                    st.session_state.chat_history = []
                    st.success("Chat history cleared!")
                    st.rerun()
        
        if submitted and message.strip():
            # Add user message to history
            user_msg = {"type": "user", "content": message, "timestamp": datetime.now()}
            st.session_state.chat_history.append(user_msg)
            
            with st.spinner("🔍 Analyzing your question..."):
                try:
                    response = api_client.chat(message)
                    
                    # Determine response type and display accordingly
                    answer_type = response.get("type", "unknown")
                    answer = response.get("answer", "No response received")
                    sources = response.get("sources", [])
                    
                    # Display response based on type
                    if answer_type == "document_based":
                        st.markdown("### 📚 Document-Based Response")
                        st.success(answer)
                    elif answer_type == "general_knowledge":
                        st.markdown("### 🧠 General Medical Knowledge")
                        st.info(answer)
                    else:
                        st.markdown("### 🤖 AI Response")
                        st.write(answer)
                    
                    # Add AI response to history
                    ai_msg = {
                        "type": "ai", 
                        "content": answer,
                        "sources": sources,
                        "answer_type": answer_type,
                        "timestamp": datetime.now()
                    }
                    st.session_state.chat_history.append(ai_msg)
                    
                    # Display sources
                    if sources:
                        st.markdown("### 📖 Information Sources")
                        for i, source in enumerate(sources, 1):
                            source_icon = "📄" if source != "General Medical Knowledge" else "🧠"
                            st.markdown(f"""
                            <div class="source-item">
                                {source_icon} <strong>Source {i}:</strong> {source}
                            </div>
                            """, unsafe_allow_html=True)
                    
                    # Clear selected query
                    st.session_state.selected_query = ""
                    session_manager.update_activity()
                    
                except Exception as e:
                    error_msg = f"Connection error: {str(e)}"
                    st.error(f"🔌 {error_msg}")
                    
                    # Add error to history
                    error_msg_obj = {
                        "type": "ai", 
                        "content": f"Sorry, I encountered an error: {error_msg}",
                        "sources": [],
                        "timestamp": datetime.now()
                    }
                    st.session_state.chat_history.append(error_msg_obj)
        
        elif submitted:
            st.warning("⚠️ Please enter a question to get started!")
    
    st.markdown('</div>', unsafe_allow_html=True)

def render_user_dashboard():
    """User dashboard with analytics and preferences"""
    st.markdown('<div class="ultra-glass-card">', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("#### 👤 Profile Info")
        st.markdown(f"**Username:** {st.session_state.username}")
        st.markdown(f"**Role:** {st.session_state.role.title()}")
        
    with col2:
        st.markdown("#### 📊 Activity Stats")
        chat_count = len(st.session_state.chat_history)
        st.markdown(f"**Messages:** {chat_count}")
        st.markdown(f"**Status:** 🟢 Active")
        
    with col3:
        st.markdown("#### ⚙️ Quick Settings")
        if st.button("🔄 Reset Chat", use_container_width=True):
            st.session_state.chat_history = []
            st.success("Chat history cleared!")
        
        if st.button("📱 Export Data", use_container_width=True):
            # Create export data
            export_data = {
                "username": st.session_state.username,
                "role": st.session_state.role,
                "chat_history": st.session_state.chat_history,
                "export_date": datetime.now().isoformat()
            }
            
            st.download_button(
                "💾 Download JSON",
                data=json.dumps(export_data, indent=2),
                file_name=f"mediai_export_{st.session_state.username}_{datetime.now().strftime('%Y%m%d')}.json",
                mime="application/json"
            )
    
    st.markdown('</div>', unsafe_allow_html=True)

def main():
    """Main application with optimized routing"""
    session_manager.update_activity()
    
    if not st.session_state.logged_in:
        render_auth_interface()
    else:
        # Logout button
        st.markdown('<div class="logout-btn">', unsafe_allow_html=True)
        if st.button("🚪 Logout"):
            session_manager.clear_session()
            st.success("👋 Successfully logged out!")
            time.sleep(1)
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Welcome header with role badge
        role_icons = {
            "doctor": "👨‍⚕️", "nurse": "👩‍⚕️", "patient": "🧑‍🤝‍🧑",
            "admin": "👑", "other": "👤"
        }
        
        admin_badge = ' <span class="admin-badge">👑 ADMIN</span>' if st.session_state.role == "admin" else ""
        role_icon = role_icons.get(st.session_state.role, "👤")
        
        st.markdown(f"""
        <div class="premium-welcome">
            <div class="welcome-title">
                🎉 Welcome back, {st.session_state.username}!{admin_badge}
            </div>
            <div class="role-badge">
                {role_icon} {st.session_state.role.upper()} ACCESS
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Main interface with role-based tabs
        if st.session_state.role == "admin":
            tab1, tab2, tab3 = st.tabs([
                "💬 AI Assistant", 
                "📚 Document Manager", 
                "👤 Dashboard"
            ])
            
            with tab1:
                render_chat_interface()
            
            with tab2:
                render_document_upload()
            
            with tab3:
                render_user_dashboard()
                
        else:
            tab1, tab2 = st.tabs([
                "💬 AI Assistant", 
                "👤 Dashboard"
            ])
            
            with tab1:
                render_chat_interface()
            
            with tab2:
                render_user_dashboard()

if __name__ == "__main__":
    main()