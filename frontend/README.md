# MediAI Pro - Next.js Frontend

A modern, professional Next.js frontend for the MediAI Pro medical AI assistant system.

## Features

### 🎨 Professional UI Design
- Modern, clean interface with Tailwind CSS
- Responsive design for all devices
- Professional medical-themed color scheme
- Smooth animations and transitions

### 🔐 Authentication System
- Secure login and signup pages
- Role-based access control (Patient, Doctor, Nurse, Admin)
- JWT token management
- Automatic session handling

### 💬 Advanced Chat Interface
- Real-time AI chat with medical assistant
- Streaming responses for better UX
- Message history with timestamps
- Source citations for medical information
- Loading indicators and chunking display
- Personalized suggestions based on user role

### 📚 Document Management
- Admin-only document upload interface
- PDF file validation and processing
- Progress tracking during upload
- Role-based access control for documents
- File size and type validation

### 📊 Dashboard & Analytics
- Role-based navigation and features
- Real-time statistics display
- Document count and chunk tracking
- User activity monitoring
- System health indicators

### 🛡️ Error Handling & Reliability
- Comprehensive error boundaries
- Toast notifications for user feedback
- Graceful fallback UI components
- Network error recovery
- Input validation and sanitization

### 📱 Mobile-First Design
- Fully responsive layout
- Touch-friendly interface
- Optimized for mobile devices
- Progressive web app ready

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Build Tool**: Next.js CLI

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running (see server README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your backend API URL
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Main dashboard
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable UI components
│   │   ├── ChatInterface.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Notification.tsx
│   ├── lib/                # Utility libraries
│   │   └── api.ts          # API client
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── utils/              # Helper functions
│       └── index.ts
├── public/                 # Static assets
├── .env.local             # Environment variables
└── package.json
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api-url
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Key Components

### ChatInterface
Advanced chat component with:
- Real-time message streaming
- Loading states and progress indicators
- Source attribution
- Message history
- Auto-scrolling

### DocumentUpload
Admin document upload interface with:
- Drag-and-drop file upload
- Progress tracking
- File validation
- Role-based permissions

### ErrorBoundary
Comprehensive error handling with:
- Graceful error recovery
- User-friendly error messages
- Error reporting
- Fallback UI

## API Integration

The frontend communicates with the FastAPI backend through:
- RESTful endpoints for authentication
- WebSocket/streaming for real-time chat
- File upload endpoints for documents
- Health check endpoints

## Security Features

- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure token storage
- Role-based access control
- Secure file upload validation

## Performance Optimizations

- Code splitting with Next.js
- Image optimization
- Lazy loading components
- Efficient re-renders with React.memo
- Optimized bundle size
- Caching strategies

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Write comprehensive tests
3. Update documentation
4. Create detailed commit messages
5. Follow semantic versioning

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ for healthcare professionals and patients worldwide.
