# MediAI Pro - Medical AI Assistant Frontend

A modern, professional medical AI assistant built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Beautiful Professional UI** - Modern design with responsive layout
- **Real-time AI Chat** - Interactive medical Q&A with document search
- **Role-based Authentication** - Patient, Doctor, Nurse, Admin access levels
- **Document Management** - Upload and manage medical documents
- **Analytics Dashboard** - Usage statistics and performance metrics
- **Data Loading Indicators** - Real-time progress tracking
- **Chunking Display** - Document processing visualization

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server running

## 🚀 Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8080` |

## 📦 Build & Deployment

### Local Build
```bash
npm run build
npm run start
```

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel --prod
   ```

2. **Set Environment Variables in Vercel**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL=https://medical-chatbot-genai-app-1.onrender.com`

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting platform**
   - Upload the `.next` folder
   - Set environment variables
   - Configure domain routing

## 🔍 Troubleshooting

### Common Issues

#### 1. API Connection Issues
**Problem**: Unable to connect to backend API
**Solution**:
- Check if backend server is running
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on backend

#### 2. Authentication Problems
**Problem**: Login not working in production
**Solution**:
- Ensure environment variables are set in Vercel
- Check that API URL doesn't have typos
- Verify backend CORS configuration

#### 3. Build Failures
**Problem**: Build fails with errors
**Solution**:
- Run `npm run build` locally first
- Check for TypeScript errors
- Ensure all dependencies are installed

### Debug Mode

Add this to your browser console to debug API calls:
```javascript
// Check API URL
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Test API connection
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log('API Health:', data));
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Main dashboard
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable components
│   │   ├── ChatInterface.tsx
│   │   ├── DocumentUpload.tsx
│   │   └── ...
│   ├── lib/               # Utilities and API client
│   │   └── api.ts
│   └── types/             # TypeScript definitions
├── public/                # Static assets
├── .env.local            # Local environment variables
├── .env.production       # Production environment variables
├── vercel.json           # Vercel configuration
└── package.json
```

## 🎯 Key Features

### Authentication
- Secure login/signup system
- Role-based access control
- Session management

### Chat Interface
- Real-time AI conversations
- Document-based responses
- Source citations
- Loading indicators

### Document Management
- PDF upload with progress tracking
- Role-based document access
- Chunking visualization

### Analytics
- Usage statistics
- Performance metrics
- Response type analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the browser console for errors
3. Ensure environment variables are set correctly
4. Verify backend API is accessible

---

**MediAI Pro** - Advanced AI-Powered Medical Information System
