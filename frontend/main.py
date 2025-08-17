import streamlit as st
from dotenv import load_dotenv
import requests
from requests.auth import HTTPBasicAuth
import os
import time

load_dotenv()

API_URL = os.getenv("API_URL")

# Page configuration with custom styling
st.set_page_config(
    page_title="Medical AI Assistant",
    page_icon="🏥",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Custom CSS for professional styling
st.markdown("""
<style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Global Styles */
    .main {
        font-family: 'Inter', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
    }
    
    .stApp {
        background: transparent;
    }
    
    /* Header Styles */
    .main-header {
        text-align: center;
        padding: 2rem 0;
        margin-bottom: 2rem;
    }
    
    .main-title {
        font-size: 3rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.5rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .main-subtitle {
        font-size: 1.2rem;
        color: rgba(255,255,255,0.9);
        font-weight: 300;
    }
    
    /* Card Styles */
    .auth-card, .chat-card, .upload-card {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        margin-bottom: 2rem;
    }
    
    /* Welcome Card */
    .welcome-card {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        border-radius: 15px;
        padding: 1.5rem;
        color: white;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(79, 172, 254, 0.3);
    }
    
    .welcome-title {
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    .role-badge {
        background: rgba(255,255,255,0.2);
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 500;
        display: inline-block;
        margin-top: 0.5rem;
    }
    
    /* Button Styles */
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 25px;
        padding: 0.7rem 2rem;
        font-weight: 600;
        color: white;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    
    /* Tab Styles */
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
        background: transparent;
    }
    
    .stTabs [data-baseweb="tab"] {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        border-radius: 10px;
        color: white;
        font-weight: 600;
        border: none;
        padding: 1rem 2rem;
    }
    
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    
    /* Input Styles */
    .stTextInput > div > div > input {
        border-radius: 10px;
        border: 2px solid #e1e8ed;
        padding: 1rem;
        font-size: 1rem;
        transition: border-color 0.3s ease;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .stSelectbox > div > div {
        border-radius: 10px;
        border: 2px solid #e1e8ed;
    }
    
    /* File Uploader Styles */
    .stFileUploader {
        border: 2px dashed #667eea;
        border-radius: 15px;
        padding: 2rem;
        text-align: center;
        background: rgba(102, 126, 234, 0.05);
    }
    
    /* Success/Error Message Styles */
    .stSuccess {
        border-radius: 10px;
        border-left: 5px solid #28a745;
    }
    
    .stError {
        border-radius: 10px;
        border-left: 5px solid #dc3545;
    }
    
    /* Chat Interface Styles */
    .chat-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .chat-title {
        font-size: 2rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5rem;
    }
    
    .chat-subtitle {
        color: #666;
        font-size: 1rem;
    }
    
    /* Source Styles */
    .source-item {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #667eea;
    }
    
    /* Loading Animation */
    .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
    }
    
    /* Logout Button */
    .logout-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
    }
    
    .logout-btn button {
        background: rgba(220, 53, 69, 0.8) !important;
        border-radius: 20px !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.9rem !important;
    }
    
    /* Admin Badge */
    .admin-badge {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        padding: 0.3rem 1rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
        margin-left: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if "username" not in st.session_state:
    st.session_state.username = ""
    st.session_state.password = ""
    st.session_state.role = ""
    st.session_state.logged_in = False
    st.session_state.mode = "auth"
    st.session_state.chat_history = []

# Auth header
def get_auth():
    return HTTPBasicAuth(st.session_state.username, st.session_state.password)

# Main header component
def render_header():
    st.markdown("""
    <div class="main-header">
        <div class="main-title">🏥 Medical AI Assistant</div>
        <div class="main-subtitle">Secure Role-Based Medical Information System</div>
    </div>
    """, unsafe_allow_html=True)

# Auth UI with enhanced styling
def auth_ui():
    render_header()
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<div class="auth-card">', unsafe_allow_html=True)
        
        tab1, tab2 = st.tabs(["🔐 Login", "📝 Sign Up"])

        # Login Tab
        with tab1:
            st.markdown("### Welcome Back!")
            st.markdown("Please sign in to your account")
            
            with st.form("login_form"):
                username = st.text_input("👤 Username", placeholder="Enter your username")
                password = st.text_input("🔒 Password", type="password", placeholder="Enter your password")
                
                col_a, col_b, col_c = st.columns([1, 2, 1])
                with col_b:
                    submitted = st.form_submit_button("Sign In", use_container_width=True)
                
                if submitted and username and password:
                    with st.spinner("Authenticating..."):
                        try:
                            res = requests.post(f"{API_URL}/login", auth=HTTPBasicAuth(username, password))
                            if res.status_code == 200:
                                user_data = res.json()
                                st.session_state.username = username
                                st.session_state.password = password
                                st.session_state.role = user_data["role"]
                                st.session_state.logged_in = True
                                st.session_state.mode = "chat"
                                st.success(f" Welcome back, {username}!")
                                time.sleep(1)
                                st.rerun()
                            else:
                                st.error(f" {res.json().get('detail', 'Login failed')}")
                        except Exception as e:
                            st.error(" Connection error. Please try again.")

        # Signup Tab
        with tab2:
            st.markdown("### Create Account")
            st.markdown("Join our Medical platform")
            
            with st.form("signup_form"):
                new_user = st.text_input("👤 Username", placeholder="Choose a username")
                new_pass = st.text_input("🔒 Password", type="password", placeholder="Create a password")
                new_role = st.selectbox("👨‍⚕️ Role", 
                    ["admin", "doctor", "nurse", "patient", "other"],
                    help="Select your role in the Medical system"
                )
                
                col_a, col_b, col_c = st.columns([1, 2, 1])
                with col_b:
                    submitted = st.form_submit_button("Create Account", use_container_width=True)
                
                if submitted and new_user and new_pass:
                    with st.spinner("Creating account..."):
                        try:
                            payload = {"username": new_user, "password": new_pass, "role": new_role}
                            res = requests.post(f"{API_URL}/signup", json=payload)
                            if res.status_code == 200:
                                st.success(" Account created successfully! Please login.")
                            else:
                                st.error(f" {res.json().get('detail', 'Signup failed')}")
                        except Exception as e:
                            st.error(" Connection error. Please try again.")
        
        st.markdown('</div>', unsafe_allow_html=True)

# Upload documents UI (Admin only)
def upload_docs():
    st.markdown('<div class="upload-card">', unsafe_allow_html=True)
    st.markdown("### 📄 Document Management")
    st.markdown("Upload PDF documents for specific roles")
    
    with st.form("upload_form"):
        uploaded_file = st.file_uploader(
            "Choose a PDF file",
            type=["pdf"],
            help="Upload medical documents, guidelines, or protocols"
        )
        role_for_doc = st.selectbox(
            "🎯 Target Role",
            ["doctor", "nurse", "patient", "other"],
            help="Select which role can access this document"
        )
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            submitted = st.form_submit_button("📤 Upload Document", use_container_width=True)
        
        if submitted and uploaded_file:
            with st.spinner("Uploading document..."):
                try:
                    files = {"file": (uploaded_file.name, uploaded_file.getvalue(), "application/pdf")}
                    data = {"role": role_for_doc}
                    res = requests.post(f"{API_URL}/upload_docs", files=files, data=data, auth=get_auth())
                    if res.status_code == 200:
                        doc_info = res.json()
                        st.success(f" Successfully uploaded: {uploaded_file.name}")
                        st.info(f"📋 Document ID: {doc_info['doc_id']} | Access: {doc_info['accessible_to']}")
                    else:
                        st.error(f" {res.json().get('detail', 'Upload failed')}")
                except Exception as e:
                    st.error(" Upload failed. Please try again.")
        elif submitted:
            st.warning("⚠️ Please select a file to upload")
    
    st.markdown('</div>', unsafe_allow_html=True)

# Chat interface with enhanced styling
def chat_interface():
    st.markdown('<div class="chat-card">', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="chat-header">
        <div class="chat-title">💬 AI Health Assistant</div>
        <div class="chat-subtitle">Ask questions about medical topics relevant to your role</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Chat input
    with st.form("chat_form", clear_on_submit=True):
        msg = st.text_input(
            "Your question:",
            placeholder="Ask about symptoms, treatments, protocols, or medical procedures...",
            help="Type your Medical-related question here"
        )
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            submitted = st.form_submit_button("🚀 Send Message", use_container_width=True)
        
        if submitted and msg.strip():
            with st.spinner("🤔 AI is thinking..."):
                try:
                    res = requests.post(f"{API_URL}/chat", data={"message": msg}, auth=get_auth())
                    if res.status_code == 200:
                        reply = res.json()
                        
                        # Display answer
                        st.markdown("### 💡 Answer:")
                        st.success(reply["answer"])
                        
                        # Display sources if available
                        if reply.get("sources"):
                            st.markdown("### 📚 Sources:")
                            for i, src in enumerate(reply["sources"], 1):
                                st.markdown(f"""
                                <div class="source-item">
                                    <strong>Source {i}:</strong> {src}
                                </div>
                                """, unsafe_allow_html=True)
                    else:
                        st.error(f" {res.json().get('detail', 'Something went wrong')}")
                except Exception as e:
                    st.error(" Connection error. Please try again.")
        elif submitted:
            st.warning("⚠️ Please enter a question")
    
    st.markdown('</div>', unsafe_allow_html=True)

# Main application flow
def main():
    if not st.session_state.logged_in:
        auth_ui()
    else:
        # Header with user info
        col1, col2 = st.columns([3, 1])
        with col1:
            admin_badge = ' <span class="admin-badge">ADMIN</span>' if st.session_state.role == "admin" else ""
            st.markdown(f"""
            <div class="welcome-card">
                <div class="welcome-title">Welcome, {st.session_state.username}!{admin_badge}</div>
                <div class="role-badge">Role: {st.session_state.role.upper()}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown('<div class="logout-btn">', unsafe_allow_html=True)
            if st.button("🚪 Logout"):
                for key in ["logged_in", "username", "password", "role", "mode", "chat_history"]:
                    st.session_state[key] = "" if key != "logged_in" else False
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Main content area
        if st.session_state.role == "admin":
            upload_docs()
            st.markdown("---")
        
        chat_interface()

if __name__ == "__main__":
    main()