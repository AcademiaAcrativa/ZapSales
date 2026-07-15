export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface Message {
  id: string;
  text: string;
  timestamp: string; // ISO String or readable HH:MM
  sender: "user" | "bot" | "system"; // user = cliente, bot = robô de atendimento, system = logs do sistema
  isSale?: boolean;
  saleInfo?: {
    product: string;
    value: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  totalSpent: number;
  messageCount: number;
  leadScore: number; // calculated engagement score (e.g., 0-100)
  status: "active" | "archived";
  tags: string[];
}

export interface CustomTrigger {
  id: string;
  keyword: string;
  reply: string;
  simulateSale: boolean;
  saleProduct: string;
  saleValue: number;
}

export interface SaleRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  product: string;
  value: number;
  timestamp: string; // ISO String
}

export interface BotSettings {
  companyName: string;
  businessType: string;
  botRules: string;
  autoReply: string;
  isSmartMode: boolean; // toggle between custom keyword triggers vs Gemini AI power
}
