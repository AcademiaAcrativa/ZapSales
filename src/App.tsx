import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_TRIGGERS,
  DEFAULT_SETTINGS,
  SIMULATED_CONVERSATIONS
} from "./data";
import { Customer, SaleRecord, CustomTrigger, BotSettings, Message, ConnectionStatus } from "./types";
import Dashboard from "./components/Dashboard";
import BotConfig from "./components/BotConfig";
import WhatsAppConnect from "./components/WhatsAppConnect";
import ChatSimulator from "./components/ChatSimulator";
import Login from "./components/Login";
import {
  LayoutDashboard,
  MessageSquare,
  QrCode,
  Settings,
  Bot,
  Wifi,
  DollarSign,
  UserCheck,
  AlertCircle,
  Sparkles,
  LogOut
} from "lucide-react";

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("zapbot_auth") === "true";
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Core App States
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<ConnectionStatus>("disconnected");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [customTriggers, setCustomTriggers] = useState<CustomTrigger[]>(INITIAL_TRIGGERS);
  const [botSettings, setBotSettings] = useState<BotSettings>(DEFAULT_SETTINGS);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  // Messages State indexed by customerId
  const [messagesByCustomer, setMessagesByCustomer] = useState<Record<string, Message[]>>({});

  // Helper to parse sale information from tags
  const parseSaleText = (text: string) => {
    const saleRegex = /\[VENDA:\s*(.*?)\s*-\s*R\$\s*([\d.,]+)\]/;
    const match = text.match(saleRegex);
    if (match) {
      const product = match[1].trim();
      const value = parseFloat(match[2].replace(",", "."));
      if (!isNaN(value)) {
        return { product, value };
      }
    }
    return undefined;
  };

  // State Handler: Connection status change
  const handleConnectionStatusChange = (newStatus: ConnectionStatus) => {
    setIsWhatsAppConnected(newStatus);
    
    if (newStatus === "connected") {
      // Load and sync customers upon connection
      setCustomers(INITIAL_CUSTOMERS);
      
      const initialMessages: Record<string, Message[]> = {};
      INITIAL_CUSTOMERS.forEach((customer) => {
        const predefined = SIMULATED_CONVERSATIONS[customer.id] || [];
        initialMessages[customer.id] = predefined.map((p, idx) => ({
          id: `msg-${customer.id}-${idx}`,
          text: p.text,
          sender: p.sender,
          timestamp: p.timestamp,
          isSale: p.text.includes("[VENDA:"),
          saleInfo: p.text.includes("[VENDA:") ? parseSaleText(p.text) : undefined,
        }));
        
        // Append system log
        initialMessages[customer.id].push({
          id: `sys-${Date.now()}-${customer.id}`,
          text: "📡 WhatsApp conectado com sucesso! O robô de respostas automáticas está ATIVO.",
          sender: "system",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });
      });
      setMessagesByCustomer(initialMessages);
    } else {
      // Add system disconnect logs to all active chats notifying the user
      const textLog = "⚠️ WhatsApp desconectado. Respostas automáticas desativadas temporariamente.";

      setMessagesByCustomer((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((id) => {
          updated[id] = [
            ...updated[id],
            {
              id: `sys-${Date.now()}-${id}`,
              text: textLog,
              sender: "system",
              timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            }
          ];
        });
        return updated;
      });
    }
  };

  // State Handler: Save general bot settings
  const handleSaveSettings = (newSettings: BotSettings) => {
    setBotSettings(newSettings);
  };

  // State Handler: Append a trigger
  const handleAddTrigger = (triggerData: Omit<CustomTrigger, "id">) => {
    const newTrig: CustomTrigger = {
      ...triggerData,
      id: `trig-${Date.now()}`
    };
    setCustomTriggers((prev) => [...prev, newTrig]);
  };

  // State Handler: Delete a trigger
  const handleDeleteTrigger = (id: string) => {
    setCustomTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  // State Handler: Record a sale transaction
  const handleAddSale = (saleData: Omit<SaleRecord, "id">) => {
    const newSale: SaleRecord = {
      ...saleData,
      id: `sale-${Date.now()}`
    };
    setSales((prev) => [...prev, newSale]);
  };

  // State Handler: Create new customer simulation
  const handleAddCustomer = (newCustomer: Customer, initialMessage: string) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    
    // Create their message list
    setMessagesByCustomer((prev) => ({
      ...prev,
      [newCustomer.id]: [
        {
          id: `msg-${newCustomer.id}-initial`,
          text: initialMessage,
          sender: "user",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }
      ]
    }));
  };

  // State Handler: Update customer's message metrics, expenditures, and lead scoring
  const handleUpdateCustomerLeadScore = (
    id: string,
    msgCountDelta: number,
    spentDelta: number,
    scoreSet?: number
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextSpent = c.totalSpent + spentDelta;
          const nextMsgCount = c.messageCount + msgCountDelta;
          
          let nextScore = c.leadScore;
          if (scoreSet !== undefined) {
            nextScore = scoreSet;
          } else {
            // General formula: more messages and more spending raises score
            nextScore = Math.min(100, c.leadScore + (msgCountDelta * 2) + (spentDelta > 0 ? 30 : 0));
          }

          return {
            ...c,
            totalSpent: nextSpent,
            messageCount: nextMsgCount,
            leadScore: nextScore,
          };
        }
        return c;
      })
    );
  };

  // Core Action: Send a message within a customer chat thread
  const handleSendMessage = (
    customerId: string,
    text: string,
    sender: "user" | "bot" | "system",
    saleDetected: { product: string; value: number } | null = null
  ) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text,
      sender,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      isSale: !!saleDetected,
      saleInfo: saleDetected || undefined,
    };

    // Append to messages list
    setMessagesByCustomer((prev) => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newMessage],
    }));

    // Update the customer record's preview snippet in list
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            lastMessage: text.length > 45 ? `${text.substring(0, 42)}...` : text,
            lastMessageTime: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            unreadCount: (sender === "user" && activeCustomerId !== customerId) ? c.unreadCount + 1 : c.unreadCount,
          };
        }
        return c;
      })
    );
  };

  // Select customer chat & mark read
  const handleSelectCustomer = (id: string) => {
    setActiveCustomerId(id);
    setActiveTab("chats");

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      })
    );
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem("zapbot_auth", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("zapbot_auth");
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased text-slate-800" id="main-app-container">
      {/* Premium Header Nav Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-xs" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/10">
              <Bot className="w-5.5 h-5.5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-base font-extrabold tracking-tight text-slate-950 flex items-center gap-1 leading-none">
                ZapBot <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono py-0.5 px-1.5 rounded">V1.5</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">CRM & Chatbot Inteligente</p>
            </div>
          </div>

          {/* Quick status bar & logout */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full py-1 px-3">
              <span className={`w-2 h-2 rounded-full ${isWhatsAppConnected === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
              <span className="text-slate-600 font-semibold">
                {isWhatsAppConnected === "connected" ? "WhatsApp Ativo" : "WhatsApp Desconectado"}
              </span>
            </div>
            {isWhatsAppConnected === "connected" && (
              <span className="hidden sm:inline text-slate-400 font-mono select-none">+55 (11) 98765-4321</span>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 text-rose-700 font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer"
              title="Sair do ZapBot"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Application Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6" id="main-content-stage">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center overflow-x-auto pb-1 border-b border-slate-200/60 shrink-0 scrollbar-none gap-1.5" id="navigation-tabs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard de Vendas
          </button>

          <button
            onClick={() => setActiveTab("chats")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 relative ${
              activeTab === "chats"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Central de Conversas (WhatsApp)
            {customers.some((c) => c.unreadCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("connect")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
              activeTab === "connect"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Conexão WhatsApp
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
              activeTab === "config"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-4 h-4" />
            Regras do Robô
          </button>
        </div>

        {/* Dynamic Tab Panel Transition */}
        <div className="flex-1 min-h-0" id="tab-panel-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="h-full flex flex-col"
            >
              {activeTab === "dashboard" && (
                <Dashboard
                  customers={customers}
                  sales={sales}
                  onSelectCustomer={handleSelectCustomer}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === "chats" && (
                <ChatSimulator
                  customers={customers}
                  activeCustomerId={activeCustomerId}
                  onSelectCustomer={handleSelectCustomer}
                  messagesByCustomer={messagesByCustomer}
                  onSendMessage={handleSendMessage}
                  botSettings={botSettings}
                  customTriggers={customTriggers}
                  isWhatsAppConnected={isWhatsAppConnected === "connected"}
                  onAddCustomer={handleAddCustomer}
                  onAddSale={handleAddSale}
                  onUpdateCustomerLeadScore={handleUpdateCustomerLeadScore}
                />
              )}

              {activeTab === "connect" && (
                <WhatsAppConnect
                  status={isWhatsAppConnected}
                  onStatusChange={handleConnectionStatusChange}
                />
              )}

              {activeTab === "config" && (
                <BotConfig
                  settings={botSettings}
                  onSaveSettings={handleSaveSettings}
                  triggers={customTriggers}
                  onAddTrigger={handleAddTrigger}
                  onDeleteTrigger={handleDeleteTrigger}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mini warning if key is missing */}
      <footer className="bg-white border-t border-slate-100 py-3.5" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 ZapBot Inc. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5 font-medium text-indigo-600/80 bg-indigo-50/50 px-3 py-1 rounded-full border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            Robô IA alimentado por Gemini 3.5 Flash
          </div>
        </div>
      </footer>
    </div>
  );
}
