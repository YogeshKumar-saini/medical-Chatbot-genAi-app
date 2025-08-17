# 🏥 Medical AI Assistant

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=Streamlit&logoColor=white)](https://streamlit.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=for-the-badge&logo=pinecone&logoColor=white)](https://pinecone.io/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)

**A secure, role-based medical information system powered by AI and vector search**

*Revolutionizing healthcare access with intelligent document retrieval and conversational AI*

![Medical AI Assistant Demo](uploaded_docs/4.png)

</div>

---

## 🌟 Features

### 🔐 **Secure Authentication System**
- **Role-based access control** (Admin, Doctor, Nurse, Patient, Other)
- **BCrypt password hashing** for maximum security
- **HTTP Basic Authentication** with FastAPI

### 📚 **Intelligent Document Management**
- **PDF document upload** with role-specific access
- **Vector-based search** using Pinecone and Google embeddings
- **Automatic text chunking** and indexing
- **Source attribution** in AI responses

### 💬 **AI-Powered Chat Interface**
- **Context-aware responses** based on user role
- **RAG (Retrieval Augmented Generation)** architecture
- **LLaMA 3 integration** via Groq for fast inference
- **Real-time document retrieval** and citation

### 🎨 **Modern UI/UX**
- **Streamlit-powered frontend** with custom CSS
- **Responsive design** with gradient backgrounds
- **Role-specific dashboards** and features
- **Professional medical theme**

---

## 🏗️ Architecture

```mermaid
graph TD
    A[👤 User] --> B[🖥️ Streamlit Frontend]
    B --> C[🔒 Authentication]
    C --> D[⚡ FastAPI Backend]
    D --> E[🗄️ MongoDB Users]
    D --> F[📄 Document Upload]
    F --> G[🧠 Google Embeddings]
    G --> H[📊 Pinecone Vector DB]
    D --> I[💬 Chat System]
    I --> J[🔍 Vector Search]
    J --> H
    I --> K[🤖 Groq LLaMA3]
    K --> L[📝 AI Response]
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **MongoDB Atlas** account
- **Pinecone** account
- **Google AI** API key
- **Groq** API key

### 1. Clone the Repository

```bash
git clone https://github.com/YogeshKumar-saini/medical-Chatbot-genAi-app.git
cd medical-ai-assistant
```

### 2. Set Up Backend

```bash
cd server
pip install -r requirements.txt
```

### 3. Set Up Frontend

```bash
cd ../frontend
pip install -r requirements.txt
```

### 4. Environment Configuration

Create `.env` files in both `server/` and `frontend/` directories:

#### **Server `.env`**
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=medical_ai
appName=MedicalAI

# Vector Database
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=us-west1-gcp-free
PINECONE_INDEX_NAME=medical-docs

# AI Services
GOOGLE_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_key
```

#### **Frontend `.env`**
```env
API_URL=http://localhost:8080
```

### 5. Launch the Application

#### Start Backend Server
```bash
cd server
python main.py
```

#### Start Frontend
```bash
cd frontend
streamlit run main.py
```

🎉 **Access the application at:** `https://medical-chatbot-genaiapp.onrender.com`

---

## 📖 Usage Guide

### 👥 User Roles

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **Admin** | Upload documents, full access | 🔴 Highest |
| **Doctor** | Access doctor-specific documents | 🟡 High |
| **Nurse** | Access nursing protocols | 🟡 High |
| **Patient** | Access patient education materials | 🟢 Standard |
| **Other** | Basic medical information | 🟢 Standard |

### 🔄 Workflow

1. **📝 Sign Up/Login** - Create account or sign in
2. **📤 Upload Documents** - Admins upload role-specific PDFs
3. **💬 Ask Questions** - Users query the AI assistant
4. **🎯 Get Answers** - Receive role-appropriate responses with sources

---

## 🛠️ Technology Stack

### **Backend**
- **[FastAPI](https://fastapi.tiangolo.com/)** - High-performance web framework
- **[LangChain](https://langchain.com/)** - LLM application framework
- **[Pinecone](https://pinecone.io/)** - Vector database for semantic search
- **[MongoDB](https://mongodb.com/)** - User authentication and data storage
- **[Groq](https://groq.com/)** - Ultra-fast LLM inference

### **Frontend**
- **[Streamlit](https://streamlit.io/)** - Interactive web application framework
- **Custom CSS** - Professional medical-themed styling
- **Responsive Design** - Mobile and desktop optimized

### **AI/ML**
- **Google Generative AI Embeddings** - Text vectorization
- **LLaMA 3 (8B)** - Large language model via Groq
- **RAG Architecture** - Retrieval Augmented Generation
- **PyPDF** - PDF document processing

---

## 🔧 API Endpoints

### 🔐 Authentication
```http
POST /signup          # Create new user account
POST /login           # User authentication
```

### 📄 Document Management
```http
POST /upload_docs     # Upload PDF documents (Admin only)
```

### 💬 Chat Interface
```http
POST /chat           # Send message to AI assistant
```

### 🔍 Health Check
```http
GET /health          # Service health status
```

---

## 🎨 UI Screenshots

<div align="center">

### 🔐 **Authentication Interface**
![Auth Interface](uploaded_docs/2.png)

### 💬 **Chat Interface**
![Chat Interface](uploaded_docs/3.png)

### 📤 **Document Upload (Admin)**
![Upload Interface](uploaded_docs/4.png)

</div>

---

## 🚧 Development

### **Project Structure**
```
medical-ai-assistant/
├── 📁 server/
│   ├── 📁 auth/           # Authentication logic
│   ├── 📁 chat/           # AI chat functionality  
│   ├── 📁 config/         # Database configuration
│   ├── 📁 docs/           # Document management
│   └── 📄 main.py         # FastAPI application
├── 📁 frontend/
│   ├── 📄 main.py         # Streamlit application
│   └── 📄 requirements.txt
└── 📄 README.md
```

### **Contributing**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 🔒 Security Features

- **🔐 Password Hashing** - BCrypt encryption
- **🛡️ Role-based Access Control** - Document-level permissions
- **🔒 HTTP Basic Auth** - Secure API authentication
- **🚫 Input Validation** - Pydantic models for data validation

---

## 📊 Performance

- **⚡ Fast Inference** - Groq-powered sub-second responses
- **🔍 Semantic Search** - Vector-based document retrieval
- **📦 Efficient Storage** - Chunked document indexing
- **🚀 Async Processing** - Non-blocking operations

---

## 🤝 Support

### **Getting Help**
- 📧 **Email:** YKSAINI1090@GMAIL.COM
### **Reporting Issues**
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/YogeshKumar-saini/medical-Chatbot-genAi-app/issues)
- 💡 **Feature Requests:** [Feature Board](https://github.com/YogeshKumar-saini/medical-Chatbot-genAi-app/discussions)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🏆 Acknowledgments

- **🤖 OpenAI** - For advancing AI research
- **🔬 LangChain** - For the excellent framework
- **⚡ Groq** - For ultra-fast inference
- **🎨 Streamlit** - For the amazing UI framework

---

<div align="center">

**Made with ❤️ for the healthcare community**

[![Stars](https://img.shields.io/github/stars/YogeshKumar-saini/medical-Chatbot-genAi-app?style=social)](https://github.com/YogeshKumar-saini/medical-Chatbot-genAi-app)
[![Forks](https://img.shields.io/github/forks/YogeshKumar-saini/medical-Chatbot-genAi-app?style=social)](https://github.com/YogeshKumar-saini/medical-Chatbot-genAi-app)
[![Issues](https://img.shields.io/github/issues/YogeshKumar-saini/medical-Chatbot-genAi-app)](https://github.com/YogeshKumar-saini/medical-Chatbot-genAi-app)

*Empowering healthcare professionals with intelligent AI assistance* 🏥✨

</div>