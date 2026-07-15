import React, { useState, useEffect, useRef } from "react";
import { Customer, Message, CustomTrigger, BotSettings, SaleRecord } from "../types";
import {
  Send,
  User,
  Bot,
  Sparkles,
  Search,
  Phone,
  Plus,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Tag,
  ShoppingBag,
  Clock,
  ChevronRight,
  Sparkle,
  Wifi
} from "lucide-react";

interface ChatSimulatorProps {
  customers: Customer[];
  activeCustomerId: string | null;
  onSelectCustomer: (id: string) => void;
  messagesByCustomer: Record<string, Message[]>;
  onSendMessage: (customerId: string, text: string, sender: "user" | "bot" | "system", saleDetected?: { product: string; value: number } | null) => void;
  botSettings: BotSettings;
  customTriggers: CustomTrigger[];
  isWhatsAppConnected: boolean;
  onAddCustomer: (customer: Customer, initialMessage: string) => void;
  onAddSale: (sale: Omit<SaleRecord, "id">) => void;
  onUpdateCustomerLeadScore: (id: string, messageCountChange: number, totalSpentChange: number, scoreSet?: number) => void;
}

export default function ChatSimulator({
  customers,
  activeCustomerId,
  onSelectCustomer,
  messagesByCustomer,
  onSendMessage,
  botSettings,
  customTriggers,
  isWhatsAppConnected,
  onAddCustomer,
  onAddSale,
  onUpdateCustomerLeadScore,
}: ChatSimulatorProps) {
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [inputText, setInputText] = useState("");
  const [inputMode, setInputMode] = useState<"customer" | "seller">("customer"); // dual send mode
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // New customer states
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustInitialMsg, setNewCustInitialMsg] = useState("Olá, gostaria de saber mais sobre as roupas do catálogo!");
  const [newCustNicheTag, setNewCustNicheTag] = useState("Novo Lead");

  // Celebratory sale modal state
  const [latestSaleAlert, setLatestSaleAlert] = useState<{ customerName: string; product: string; value: number } | null>(null);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Filter customers by search term
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) || null;
  const activeChatMessages = activeCustomerId ? messagesByCustomer[activeCustomerId] || [] : [];

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages, isBotTyping]);

  // Handle simulated message submission
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeCustomerId || !activeCustomer) return;

    const textToSend = inputText.trim();
    setInputText("");

    if (inputMode === "seller") {
      // Sent manually by store owner
      onSendMessage(activeCustomerId, textToSend, "bot"); // Treated as manual bot/seller response
      onUpdateCustomerLeadScore(activeCustomer.id, 1, 0);
    } else {
      // Sent as customer (Simulador)
      onSendMessage(activeCustomerId, textToSend, "user");
      onUpdateCustomerLeadScore(activeCustomer.id, 1, 0);

      // Trigger automatic chatbot response if WhatsApp is connected
      if (isWhatsAppConnected) {
        setIsBotTyping(true);

        try {
          // Prepare chat history to feed to Gemini endpoint
          const chatHistory = activeChatMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text,
          }));

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: textToSend,
              history: chatHistory,
              companyName: botSettings.companyName,
              businessType: botSettings.businessType,
              botRules: botSettings.botRules,
              autoReply: botSettings.autoReply,
              customTriggers: customTriggers,
            }),
          });

          const data = await response.json();

          // Wait a brief simulated typing delay to look realistic
          setTimeout(() => {
            setIsBotTyping(false);
            if (response.ok) {
              // Send bot response and log sale if any detected
              onSendMessage(activeCustomerId, data.reply, "bot", data.saleDetected);

              if (data.saleDetected) {
                // Record sale in core state
                onAddSale({
                  customerName: activeCustomer.name,
                  customerPhone: activeCustomer.phone,
                  product: data.saleDetected.product,
                  value: data.saleDetected.value,
                  timestamp: new Date().toISOString(),
                });

                // Update lead score and spent totals
                onUpdateCustomerLeadScore(
                  activeCustomer.id,
                  1,
                  data.saleDetected.value,
                  100 // Closed sale sets temperature to boiling 100
                );

                // Open Celebratory Modal Alert
                setLatestSaleAlert({
                  customerName: activeCustomer.name,
                  product: data.saleDetected.product,
                  value: data.saleDetected.value,
                });
              } else {
                // Regular interaction increases lead score by a small factor if not already boiling
                const currentScore = activeCustomer.leadScore;
                const nextScore = Math.min(98, currentScore + 8);
                onUpdateCustomerLeadScore(activeCustomer.id, 1, 0, nextScore);
              }
            } else {
              onSendMessage(
                activeCustomerId,
                `⚠️ Erro de Rede: ${data.error || "Não foi possível contactar o servidor do robô."}`,
                "system"
              );
            }
          }, 1500);
        } catch (err: any) {
          setTimeout(() => {
            setIsBotTyping(false);
            onSendMessage(
              activeCustomerId,
              "⚠️ Falha de conexão: Verifique se a sua chave GEMINI_API_KEY está configurada no painel de Secrets.",
              "system"
            );
          }, 1200);
        }
      }
    }
  };

  // Submit new customer simulation form
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const newCustId = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      id: newCustId,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?w=150`,
      lastMessage: newCustInitialMsg.trim(),
      lastMessageTime: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      unreadCount: 1,
      totalSpent: 0,
      messageCount: 1,
      leadScore: 40, // standard new lead score
      status: "active",
      tags: [newCustNicheTag],
    };

    onAddCustomer(newCustomer, newCustInitialMsg.trim());

    // Reset fields & close modal
    setNewCustName("");
    setNewCustPhone("");
    setNewCustInitialMsg("Olá, gostaria de saber mais sobre as roupas do catálogo!");
    setNewCustNicheTag("Novo Lead");
    setShowAddCustomerModal(false);

    // Auto select the new customer
    onSelectCustomer(newCustId);
  };

  const getLeadTemperatureLabel = (score: number) => {
    if (score >= 80) return { label: "Fervendo", bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" };
    if (score >= 50) return { label: "Quente", bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
    return { label: "Frio", bg: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
  };

  // Extract clean text (removing the bracketed [VENDA:...] metadata tag for beautiful bubble UI display)
  const renderMessageText = (msg: Message) => {
    const saleRegex = /\[VENDA:\s*(.*?)\s*-\s*R\$\s*([\d.,]+)\]/;
    const cleanText = msg.text.replace(saleRegex, "").trim();

    // Render receipt styling if it contains sale info
    if (msg.isSale && msg.saleInfo) {
      return (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap">{cleanText}</p>
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs space-y-2 shadow-inner">
            <div className="flex items-center justify-between font-bold border-b border-emerald-200/50 pb-1.5">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Venda Confirmada! 🎉
              </span>
              <span className="font-mono text-[10px] tracking-wider uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                Robô
              </span>
            </div>
            <div className="space-y-1 font-medium">
              <p className="flex justify-between">
                <span className="text-emerald-600">Produto:</span>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">{msg.saleInfo.product}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-emerald-600">Valor Pago:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  R$ {msg.saleInfo.value.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return <p className="whitespace-pre-wrap">{msg.text}</p>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[640px]" id="simulator-grid">
      
      {/* Left Chat List Column */}
      <div className="border-r border-slate-100 flex flex-col h-full bg-slate-50/50" id="chats-sidebar">
        {/* Sidebar Header */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-950 text-base">Conversas Recentes</h4>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Simular Entrada de Cliente"
            >
              <Plus className="w-4 h-4" />
              Simular Cliente
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou celular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Customer Threads list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100" id="chats-scroll-area">
          {filteredCustomers.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs px-4">
              Nenhuma conversa correspondente encontrada. Use o botão acima para simular a chegada de um novo lead!
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isActive = customer.id === activeCustomerId;
              const hasUnread = customer.unreadCount > 0;
              const leadStyle = getLeadTemperatureLabel(customer.leadScore);

              return (
                <div
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer.id)}
                  className={`p-3.5 flex gap-3 cursor-pointer transition-all ${
                    isActive ? "bg-indigo-50/75 border-l-4 border-indigo-600" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {/* Avatar wrapper with status indicators */}
                  <div className="relative shrink-0">
                    <img
                      src={customer.avatar}
                      alt={customer.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${leadStyle.dot}`}
                      title={`Lead Score: ${customer.leadScore} (${leadStyle.label})`}
                    ></span>
                  </div>

                  {/* Customer details text content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm leading-none truncate ${isActive ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                        {customer.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{customer.lastMessageTime}</span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono tracking-tight leading-none truncate">
                      {customer.phone}
                    </p>

                    <p className={`text-xs truncate ${hasUnread ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                      {customer.lastMessage}
                    </p>

                    {/* Tags line */}
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      {customer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      <span
                        className={`inline-flex items-center text-[9px] font-bold px-1 py-0.2 rounded border ${leadStyle.bg}`}
                      >
                        {leadStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Unread badge & spent metadata */}
                  <div className="flex flex-col justify-between items-end shrink-0">
                    {hasUnread && (
                      <span className="w-4.5 h-4.5 bg-emerald-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                        {customer.unreadCount}
                      </span>
                    )}
                    {customer.totalSpent > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 mt-auto">
                        R$ {customer.totalSpent.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Center Active Chat Window Column */}
      <div className="md:col-span-2 flex flex-col h-full bg-slate-100" id="active-chat-panel">
        {activeCustomer ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={activeCustomer.avatar}
                  alt={activeCustomer.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h5 className="font-bold text-sm text-slate-900 leading-tight">
                    {activeCustomer.name}
                  </h5>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1 leading-none pt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-300" />
                    {activeCustomer.phone}
                  </p>
                </div>
              </div>

              {/* Bot status indicators inside active chat */}
              <div className="flex items-center gap-2">
                {botSettings.isSmartMode ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 fill-current" />
                    Robô IA Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    <Bot className="w-3 h-3" />
                    Robô Simples Ativo
                  </span>
                )}
              </div>
            </div>

            {/* Connection Warning Banner */}
            {!isWhatsAppConnected && (
              <div className="bg-amber-50 border-b border-amber-200/50 p-3 flex items-start gap-2.5 text-xs text-amber-800 animate-fade-in">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>WhatsApp Desconectado:</strong> O robô de respostas automáticas não responderá enquanto o WhatsApp estiver desconectado. Conecte sua conta na aba <strong>"Conexão WhatsApp"</strong> para liberar o simulador do robô.
                </p>
              </div>
            )}

            {/* Chat Messages Body Area */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 shadow-inner"
              style={{
                backgroundImage:
                  "radial-gradient(#e2e8f0 1.5px, transparent 1.5px)",
                backgroundSize: "20px 20px"
              }}
              id="messages-body-area"
            >
              {activeChatMessages.map((msg) => {
                const isSystem = msg.sender === "system";
                const isBot = msg.sender === "bot";

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="px-3 py-1 bg-slate-200/80 border border-slate-300/50 text-[11px] font-mono font-semibold text-slate-600 rounded-lg max-w-[85%] text-center shadow-sm">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isBot ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm space-y-1 ${
                        isBot
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-white text-slate-900 rounded-tl-none border border-slate-200"
                      }`}
                    >
                      {/* Speech metadata label */}
                      <div className="flex items-center gap-1 justify-between text-[10px] font-bold opacity-60">
                        <span className="flex items-center gap-0.5">
                          {isBot ? (
                            <>
                              <Bot className="w-3.5 h-3.5" />
                              Robô {botSettings.isSmartMode ? "(IA)" : ""}
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5" />
                              Cliente
                            </>
                          )}
                        </span>
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>

                      {/* Clean Message text */}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                        {renderMessageText(msg)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Simulated typing dot animation */}
              {isBotTyping && (
                <div className="flex justify-end animate-fade-in">
                  <div className="bg-slate-200 text-slate-500 rounded-2xl rounded-tr-none px-4 py-3 flex items-center gap-1.5 shadow-sm border border-slate-300/45">
                    <span className="text-[10px] font-bold font-mono tracking-tight text-slate-500">
                      ZapBot digitando
                    </span>
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                    </span>
                  </div>
                </div>
              )}

              <div ref={messageEndRef}></div>
            </div>

            {/* Input Bar with Simulator Mode Selection */}
            <div className="p-3 bg-white border-t border-slate-150 flex flex-col gap-2 shadow-inner">
              
              {/* Simulator Dual Input Mode Selector Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Modo do Simulador:
                  </span>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInputMode("customer")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                        inputMode === "customer"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Enviar como Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("seller")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                        inputMode === "seller"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Enviar como Vendedor (Manual)
                    </button>
                  </div>
                </div>

                {/* Helpful instructions tooltip */}
                <div className="text-[10px] font-medium text-slate-400 italic">
                  {inputMode === "customer" 
                    ? "*Simula a mensagem do cliente. O robô irá responder." 
                    : "*Responde manualmente como dono da loja."}
                </div>
              </div>

              {/* Text Input area */}
              <form onSubmit={handleSend} className="flex items-center gap-2" id="chat-input-form">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    inputMode === "customer"
                      ? "Escreva a mensagem fingindo ser o cliente (ex: 'Quanto custa?', 'Quero comprar')..."
                      : "Responda como vendedor..."
                  }
                  className={`flex-1 px-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    inputMode === "customer"
                      ? "border-indigo-150 bg-indigo-50/20 focus:border-indigo-400"
                      : "border-slate-200 bg-slate-50/25 focus:border-emerald-500"
                  }`}
                  required
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2.5 rounded-xl text-white shadow-md transition-all shrink-0 ${
                    !inputText.trim()
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : inputMode === "customer"
                      ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg"
                      : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg"
                  }`}
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center text-slate-400" id="no-chat-selected">
            <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm inline-flex">
              {isWhatsAppConnected ? (
                <Bot className="w-12 h-12 text-slate-300" />
              ) : (
                <Wifi className="w-12 h-12 text-rose-400 animate-pulse" />
              )}
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h5 className="font-bold text-slate-800 text-sm">
                {isWhatsAppConnected ? "Nenhuma conversa selecionada" : "WhatsApp Desconectado"}
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isWhatsAppConnected 
                  ? 'Selecione um cliente na lista lateral ou clique em "Simular Cliente" para criar uma conversa e testar o robô!'
                  : 'Por favor, conecte seu WhatsApp na aba "Conexão WhatsApp" para sincronizar suas conversas recentes e ativar o simulador de atendimento automático!'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Celebratory Success Sale Dialog Alert */}
      {latestSaleAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-emerald-100 shadow-2xl relative overflow-hidden">
            {/* Ambient visual confetti */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"></div>

            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl font-bold">
              🎉
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                Venda fechada pelo robô!
              </span>
              <h4 className="font-bold text-slate-950 text-base pt-1">O robô realizou uma venda!</h4>
              <p className="text-xs text-slate-500">
                O cliente <strong>{latestSaleAlert.customerName}</strong> fechou uma compra do produto:
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-medium text-xs text-slate-700">
              <p className="truncate text-slate-900 font-bold">{latestSaleAlert.product}</p>
              <p className="text-emerald-600 font-bold text-sm pt-0.5">R$ {latestSaleAlert.value.toFixed(2)}</p>
            </div>

            <button
              onClick={() => setLatestSaleAlert(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Excelente! Fechar
            </button>
          </div>
        </div>
      )}

      {/* Add Simulated Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-100 shadow-2xl">
            <h4 className="font-bold text-base text-slate-950">Simular Novo Cliente</h4>
            <p className="text-xs text-slate-500">
              Crie um novo contato simulado e envie uma mensagem inicial para testar como o robô do site responde.
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5" id="modal-add-customer-form">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nome do Cliente</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Ex: Pedro Lucas"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Número do WhatsApp</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tag de Nicho do Cliente</label>
                <select
                  value={newCustNicheTag}
                  onChange={(e) => setNewCustNicheTag(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="Novo Lead">Novo Lead 🎯</option>
                  <option value="Interesse Alto">Interesse Alto 🔥</option>
                  <option value="Dúvida Geral">Dúvida Geral ❓</option>
                  <option value="Outro">Outro 📁</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mensagem Inicial Enviada pelo Cliente</label>
                <textarea
                  value={newCustInitialMsg}
                  onChange={(e) => setNewCustInitialMsg(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Criar e Iniciar Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
