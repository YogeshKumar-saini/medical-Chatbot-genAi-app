'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, FileText, Hash } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, generateId } from '@/utils';
import type { ChatMessage } from '@/types';

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [, setIsLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSuggestions();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await apiClient.getSuggestions();
      setSuggestions(response.suggested_queries);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        'What are the symptoms of diabetes?',
        'How can I manage high blood pressure?',
        'What are common treatments for asthma?',
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: generateId(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await apiClient.sendMessage(messageToSend);

      // Update the loading message with actual response
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              content: response.answer,
              sources: response.sources,
              isLoading: false,
            }
          : msg
      ));
    } catch (error: any) {
      // Update with error message
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
              isLoading: false,
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className={cn("flex flex-col h-[600px] bg-white rounded-lg border border-gray-200", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI Medical Assistant</h3>
            <p className="text-sm text-gray-600">
              Ask me anything about medical topics - I provide both document-based insights and general medical knowledge
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">How can I help you today?</h3>
            <p className="text-gray-600 mb-6">
              Ask me about medical conditions, treatments, medications, or any health-related questions.
            </p>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Popular questions:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.slice(0, 6).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isLoading}
                      className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex space-x-3",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.type === 'ai' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                    message.type === 'user'
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing your question...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-1 mb-2">
                            <FileText className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">Sources:</span>
                          </div>
                          <div className="space-y-1">
                            {message.sources.map((source, index) => (
                              <div key={index} className="text-xs text-gray-600 flex items-center space-x-1">
                                <Hash className="h-3 w-3" />
                                <span>{source}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about symptoms, treatments, medications, procedures, or any health-related topic..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2",
              !inputMessage.trim() || isLoading
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Send</span>
          </button>
        </div>

        {/* Loading indicator for chunking */}
        {isLoading && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing chunks and analyzing documents...</span>
          </div>
        )}
      </div>
    </div>
  );
}