
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  sources?: Source[];
  status?: 'sending' | 'error' | 'done';
}

export interface Source {
  title: string;
  uri: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}
