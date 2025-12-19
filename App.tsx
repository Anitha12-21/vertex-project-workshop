
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Image as ImageIcon, Plus, Trash2, Github, ChevronRight, Menu, X, Sparkles, MessageSquare } from 'lucide-react';
import { Message, ChatHistory } from './types';
import ChatMessage from './components/ChatMessage';
import { sendMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId);

  // Initialize first chat if empty
  useEffect(() => {
    if (chats.length === 0) {
      const newChatId = Date.now().toString();
      const initialChat: ChatHistory = {
        id: newChatId,
        title: 'New Conversation',
        messages: [],
        updatedAt: Date.now()
      };
      setChats([initialChat]);
      setCurrentChatId(newChatId);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChat?.messages]);

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading || !currentChatId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      image: selectedImage || undefined,
      timestamp: Date.now(),
      status: 'done'
    };

    const assistantPlaceholderId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'sending'
    };

    // Update local state with user message and placeholder
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const updatedMessages = [...chat.messages, userMessage, assistantPlaceholder];
        const newTitle = chat.messages.length === 0 ? (inputText.slice(0, 30) || 'Image Query') : chat.title;
        return { ...chat, messages: updatedMessages, title: newTitle, updatedAt: Date.now() };
      }
      return chat;
    }));

    const textToSubmit = inputText;
    const imageToSubmit = selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const chatHistory = currentChat?.messages.map(m => ({
        role: m.role,
        content: m.content
      })) || [];

      const result = await sendMessageToGemini(textToSubmit, imageToSubmit || undefined, chatHistory);

      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: chat.messages.map(m => 
              m.id === assistantPlaceholderId 
                ? { ...m, content: result.text, sources: result.sources, status: 'done' }
                : m
            )
          };
        }
        return chat;
      }));
    } catch (error) {
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: chat.messages.map(m => 
              m.id === assistantPlaceholderId 
                ? { ...m, status: 'error' }
                : m
            )
          };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-100">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 z-30 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">OmniChat</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 rounded-xl transition-all font-medium text-sm text-indigo-300"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => {
                setCurrentChatId(chat.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                currentChatId === chat.id ? 'bg-indigo-600/10 border border-indigo-600/30' : 'hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <MessageSquare size={16} className={currentChatId === chat.id ? 'text-indigo-400' : 'text-slate-500'} />
                <span className="truncate text-sm font-medium">
                  {chat.title}
                </span>
              </div>
              <button 
                onClick={(e) => deleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Gemini 3 Pro</span>
            </div>
            <a href="https://github.com" target="_blank" className="hover:text-white"><Github size={14} /></a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white mr-2">
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold truncate max-w-[200px] md:max-w-md">
                {currentChat?.title || 'OmniChat'}
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Intelligent Assistant</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar" ref={scrollRef}>
          {currentChat && currentChat.messages.length > 0 ? (
            <div className="max-w-3xl mx-auto">
              {currentChat.messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-6">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-indigo-600/5">
                <Sparkles size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">How can I help you today?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                OmniChat is powered by the latest Gemini 3 Pro model. I can assist with coding, creative writing, data analysis, or answering complex questions with real-time web grounding.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {['Explain quantum physics', 'Write a Python script', 'Summarize this topic', 'Plan a travel itinerary'].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setInputText(suggestion)}
                    className="p-3 text-left rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-xs text-slate-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-slate-900">
          <div className="max-w-3xl mx-auto">
            {selectedImage && (
              <div className="relative inline-block mb-3 p-2 bg-slate-800 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-lg" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600/10 blur-xl group-focus-within:bg-indigo-600/20 transition-all rounded-3xl -z-10"></div>
              <div className="flex items-end bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500/50 transition-all">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                  title="Upload Image"
                >
                  <ImageIcon size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                <textarea
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask OmniChat anything..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 py-2 px-3 resize-none min-h-[40px] max-h-40 custom-scrollbar text-sm"
                />
                
                <button 
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && !selectedImage) || isLoading}
                  className={`p-2 rounded-xl transition-all ${
                    (!inputText.trim() && !selectedImage) || isLoading
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            
            <p className="mt-3 text-center text-[10px] text-slate-500">
              OmniChat may provide inaccurate information. Verify important facts. Powered by Gemini.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
