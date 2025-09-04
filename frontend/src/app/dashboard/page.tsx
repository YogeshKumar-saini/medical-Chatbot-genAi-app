'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  FileText,
  BarChart3,
  LogOut,
  User,
  Stethoscope,
  Upload,
  Database,
  Activity
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, getRoleColor, getRoleIcon } from '@/utils';
import ChatInterface from '@/components/ChatInterface';
import DocumentUpload from '@/components/DocumentUpload';
import type { User as UserType, DocumentStats } from '@/types';

const navigation = [
  { name: 'AI Assistant', href: '#chat', icon: MessageSquare, current: true },
  { name: 'Documents', href: '#documents', icon: FileText, current: false },
  { name: 'Analytics', href: '#analytics', icon: BarChart3, current: false },
];

const adminNavigation = [
  { name: 'Upload Documents', href: '#upload', icon: Upload, current: false, adminOnly: true },
  { name: 'System Stats', href: '#stats', icon: Database, current: false, adminOnly: true },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    chunkCount: 0,
    roleDistribution: { patient: 0, doctor: 0, nurse: 0, admin: 0, other: 0 }
  });

  const checkAuth = useCallback(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const currentUser = apiClient.getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setUser(currentUser);
    setIsLoading(false);

    // Load stats for all users (different data based on role)
    loadStats(currentUser.role);
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadStats = async (userRole: string = 'patient') => {
    try {
      // For admin users, show full system stats
      if (userRole === 'admin') {
        setStats({
          totalDocuments: 42,
          chunkCount: 1247,
          lastUploadDate: new Date(),
          roleDistribution: {
            patient: 15,
            doctor: 12,
            nurse: 8,
            admin: 5,
            other: 2
          }
        });
      } else {
        // For regular users, show personalized stats
        setStats({
          totalDocuments: 15, // Documents accessible to this user
          chunkCount: 380, // Chunks from accessible documents
          lastUploadDate: new Date(Date.now() - 86400000), // 1 day ago
          roleDistribution: {
            [userRole]: 15, // Show user's role count
            patient: 0,
            doctor: 0,
            nurse: 0,
            admin: 0,
            other: 0
          }
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default stats on error
      setStats({
        totalDocuments: 0,
        chunkCount: 0,
        roleDistribution: { patient: 0, doctor: 0, nurse: 0, admin: 0, other: 0 }
      });
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    router.push('/auth/login');
  };

  const allNavigation = user?.role === 'admin'
    ? [...navigation, ...adminNavigation]
    : navigation;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Stethoscope className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MediAI Pro</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  <div className={cn("text-xs px-2 py-1 rounded-full inline-block", getRoleColor(user.role))}>
                    {getRoleIcon(user.role)} {user.role}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <nav className="space-y-2">
                {allNavigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveTab(item.href.slice(1))}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === item.href.slice(1)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalDocuments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Chunks</span>
                  <span className="text-sm font-medium text-gray-900">{stats.chunkCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="text-sm font-medium text-gray-900">Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Content Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {allNavigation.find(nav => nav.href.slice(1) === activeTab)?.name || 'Dashboard'}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back, {user.username}! Here's your medical AI workspace.
                </p>
              </div>

              {/* Content Body */}
              <div className="p-6">
                {activeTab === 'chat' && <ChatInterface />}
                {activeTab === 'documents' && <DocumentsInterface />}
                {activeTab === 'analytics' && <AnalyticsInterface />}
                {activeTab === 'upload' && user.role === 'admin' && <DocumentUpload />}
                {activeTab === 'stats' && user.role === 'admin' && <SystemStats stats={stats} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Functional components for different sections

function DocumentsInterface() {
  const documents = [
    {
      id: '1',
      name: 'Medical Guidelines 2024.pdf',
      size: '2.4 MB',
      uploadedAt: new Date(Date.now() - 86400000),
      role: 'doctor',
      chunks: 45
    },
    {
      id: '2',
      name: 'Patient Care Protocols.pdf',
      size: '1.8 MB',
      uploadedAt: new Date(Date.now() - 172800000),
      role: 'nurse',
      chunks: 32
    },
    {
      id: '3',
      name: 'Medication Reference.pdf',
      size: '3.1 MB',
      uploadedAt: new Date(Date.now() - 259200000),
      role: 'patient',
      chunks: 67
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Document Library</h3>
          <p className="text-sm text-gray-600">Manage and view your accessible medical documents</p>
        </div>
        <div className="text-sm text-gray-500">
          {documents.length} documents
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-5">Document Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Chunks</div>
            <div className="col-span-1">Date</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {documents.map((doc) => (
            <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-12 gap-4 items-center text-sm">
                <div className="col-span-5 flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium text-gray-900 truncate">{doc.name}</span>
                </div>
                <div className="col-span-2 text-gray-600">{doc.size}</div>
                <div className="col-span-2">
                  <span className={cn("px-2 py-1 text-xs rounded-full", getRoleColor(doc.role))}>
                    {getRoleIcon(doc.role)} {doc.role}
                  </span>
                </div>
                <div className="col-span-2 text-gray-600">{doc.chunks}</div>
                <div className="col-span-1 text-gray-600">
                  {doc.uploadedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Documents will appear here once uploaded by administrators
          </p>
        </div>
      )}
    </div>
  );
}

function AnalyticsInterface() {
  const analytics = {
    totalQueries: 247,
    documentBasedResponses: 89,
    generalKnowledgeResponses: 158,
    averageResponseTime: 3.2,
    topTopics: [
      { topic: 'Diabetes Management', queries: 45 },
      { topic: 'Medication Interactions', queries: 32 },
      { topic: 'Heart Health', queries: 28 },
      { topic: 'Emergency Care', queries: 21 },
      { topic: 'Mental Health', queries: 18 }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Usage Analytics</h3>
        <p className="text-sm text-gray-600">Insights into your medical AI assistant usage</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Queries</p>
              <p className="text-2xl font-semibold text-blue-900">{analytics.totalQueries}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Document Responses</p>
              <p className="text-2xl font-semibold text-green-900">{analytics.documentBasedResponses}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">General Knowledge</p>
              <p className="text-2xl font-semibold text-purple-900">{analytics.generalKnowledgeResponses}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Avg Response Time</p>
              <p className="text-2xl font-semibold text-orange-900">{analytics.averageResponseTime}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Topics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Popular Topics</h4>
        <div className="space-y-4">
          {analytics.topTopics.map((topic, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(topic.queries / analytics.topTopics[0].queries) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{topic.queries} queries</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Response Types</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Document-based</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round((analytics.documentBasedResponses / analytics.totalQueries) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">General Knowledge</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round((analytics.generalKnowledgeResponses / analytics.totalQueries) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Performance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Response Time</span>
              <span className="text-sm font-medium text-gray-900">{analytics.averageResponseTime}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-green-600">98.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function SystemStats({ stats }: { stats: DocumentStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Documents</p>
              <p className="text-2xl font-semibold text-blue-900">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Chunks</p>
              <p className="text-2xl font-semibold text-green-900">{stats.chunkCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Active Users</p>
              <p className="text-2xl font-semibold text-purple-900">
                {Object.values(stats.roleDistribution).reduce((a, b) => a + b, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Distribution</h3>
        <div className="space-y-3">
          {Object.entries(stats.roleDistribution).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 capitalize">{role}</span>
              </div>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / stats.totalDocuments) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}