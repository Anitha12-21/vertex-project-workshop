
import React from 'react';
import { Message } from '../types';
import { User, Bot, ExternalLink, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600 ml-3' : 'bg-slate-700 mr-3'
        }`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-indigo-400" />}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-indigo-700 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
          }`}>
            {message.image && (
              <img 
                src={message.image} 
                alt="Uploaded content" 
                className="max-w-xs mb-3 rounded-lg border border-white/10" 
              />
            )}
            
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
              {message.status === 'sending' && (
                <span className="inline-block w-4 h-4 ml-2 border-2 border-white/20 border-t-white animate-spin rounded-full vertical-middle"></span>
              )}
              {message.status === 'error' && (
                <div className="flex items-center text-red-400 mt-2 text-xs">
                  <AlertCircle size={14} className="mr-1" />
                  Failed to get response. Please try again.
                </div>
              )}
            </div>
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 py-1 px-2 rounded-full transition-colors"
                >
                  <ExternalLink size={10} className="mr-1" />
                  {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                </a>
              ))}
            </div>
          )}
          
          <div className="mt-1 text-[10px] text-slate-500 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
