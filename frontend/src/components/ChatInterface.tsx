'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, FileText, Hash, Mic, Image as ImageIcon, Volume2, X, StopCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, generateId } from '@/utils';
import type { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [, setIsLoadingSuggestions] = useState(false);

  // Multimodal & Voice State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if ((!messageToSend && !imageFile) || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: messageToSend || (imageFile ? 'Analyzed Image' : ''),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const loadingMessage: ChatMessage = {
      id: generateId(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      let aiContent = '';
      let aiSources: string[] = [];

      if (imageFile) {
        // Handle Image Analysis
        const analysisResponse = await apiClient.analyzeImage(imageFile, messageToSend);
        aiContent = analysisResponse.analysis;
        setImageFile(null); // Clear image after sending
      } else {
        // Regular Text Chat
        const chatResponse = await apiClient.sendMessage(messageToSend);
        aiContent = chatResponse.answer;
        aiSources = chatResponse.sources;
      }

      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
            ...msg,
            content: aiContent,
            sources: aiSources,
            isLoading: false,
          }
          : msg
      ));
    } catch (error: any) {
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], "voice_input.wav", { type: "audio/wav" });
        await handleVoiceTranscription(audioFile);
        stream.getTracks().forEach(track => track.stop()); // Stop mic
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleVoiceTranscription = async (audioFile: File) => {
    setIsLoading(true);
    try {
      const response = await apiClient.transcribeAudio(audioFile);
      setInputMessage(response.text);
      // Optional: Auto-send after transcription? Let's verify text first.
    } catch (error) {
      console.error("Transcription failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async (text: string) => {
    try {
      const audioBlob = await apiClient.textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("TTS failed:", error);
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
    setImageFile(null);
  };

  return (
    <div className={cn("flex flex-col h-[700px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden font-sans", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Medical AI Assistant</h3>
            <p className="text-xs text-gray-500 font-medium">Powerd by Gemini 1.5 Pro</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="p-4 bg-blue-50 rounded-full mb-6 animate-pulse">
              <Bot className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">How can I help you today?</h3>
            <p className="text-gray-500 mb-8 max-w-md">
              Ask me about medical conditions, verify symptoms via images, or use voice commands for a hands-free experience.
            </p>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(suggestion)}
                    disabled={isLoading}
                    className="p-3 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex space-x-3 max-w-3xl",
                  message.type === 'user' ? "ml-auto justify-end" : "mr-auto justify-start"
                )}
              >
                {message.type === 'ai' && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div className={cn("flex flex-col", message.type === 'user' ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed",
                      message.type === 'user'
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                    )}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-gray-500">Analyzing...</span>
                      </div>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Message Actions / Metadata */}
                  {!message.isLoading && (
                    <div className="flex items-center mt-1 space-x-2 px-1">
                      <span className="text-[10px] text-gray-400">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {message.type === 'ai' && (
                        <button
                          onClick={() => handleTTS(message.content)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Read aloud"
                        >
                          <Volume2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 ml-1 bg-white p-3 rounded-lg border border-gray-100 shadow-sm max-w-sm">
                      <div className="flex items-center space-x-1 mb-2 text-blue-600">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs font-semibold">Verified Sources</span>
                      </div>
                      <div className="space-y-1">
                        {message.sources.map((source, index) => (
                          <div key={index} className="flex items-start space-x-1.5">
                            <Hash className="h-3 w-3 text-gray-400 mt-0.5" />
                            <a href="#" className="text-xs text-gray-600 hover:text-blue-600 truncate block">
                              {source}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        {/* Image Preview */}
        {imageFile && (
          <div className="mb-3 flex items-center bg-blue-50 p-2 rounded-lg w-fit border border-blue-100">
            <ImageIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-xs text-blue-700 font-medium truncate max-w-[150px]">{imageFile.name}</span>
            <button
              onClick={() => setImageFile(null)}
              className="ml-2 p-0.5 hover:bg-blue-100 rounded-full text-blue-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          {/* Attachment */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"
            title="Upload Image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {/* Text Input */}
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Listening..." : "Ask a medical question..."}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder-gray-400 resize-none py-2"
            rows={1}
            disabled={isLoading || isRecording}
          />

          {/* Voice Input */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center justify-center",
              isRecording
                ? "bg-red-50 text-red-600 hover:bg-red-100 animate-pulse"
                : "text-gray-400 hover:text-blue-600 hover:bg-white"
            )}
            title="Voice Input"
          >
            {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={(!inputMessage.trim() && !imageFile) || isLoading || isRecording}
            className={cn(
              "p-2 rounded-xl transition-all",
              (!inputMessage.trim() && !imageFile) || isLoading || isRecording
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            )}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-2">
          AI can make mistakes. Please verify important medical information with a doctor.
        </p>
      </div>
    </div>
  );
}