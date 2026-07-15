import { Customer, SaleRecord, CustomTrigger, BotSettings } from "./types";

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Ana Silva",
    phone: "(11) 98765-4321",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    lastMessage: "Quero fechar o pedido do vestido verde, por favor!",
    lastMessageTime: "12:45",
    unreadCount: 1,
    totalSpent: 120.0,
    messageCount: 14,
    leadScore: 95,
    status: "active",
    tags: ["Interesse Alto", "Vestuário"],
  },
  {
    id: "cust-2",
    name: "Carlos Souza",
    phone: "(21) 99888-7766",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    lastMessage: "Olá, vocês entregam no Rio de Janeiro?",
    lastMessageTime: "11:30",
    unreadCount: 0,
    totalSpent: 0,
    messageCount: 5,
    leadScore: 65,
    status: "active",
    tags: ["Dúvida Envio"],
  },
  {
    id: "cust-3",
    name: "Mariana Costa",
    phone: "(31) 97777-8888",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    lastMessage: "Gostei muito dos produtos, aceitam Pix?",
    lastMessageTime: "Ontem",
    unreadCount: 0,
    totalSpent: 89.9,
    messageCount: 19,
    leadScore: 88,
    status: "active",
    tags: ["Cliente Recorrente"],
  },
  {
    id: "cust-4",
    name: "Gabriel Santos",
    phone: "(41) 96666-5555",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    lastMessage: "Qual é o prazo de entrega para Curitiba?",
    lastMessageTime: "Ontem",
    unreadCount: 0,
    totalSpent: 249.9,
    messageCount: 3,
    leadScore: 50,
    status: "active",
    tags: ["Novo Lead"],
  },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: "sale-1",
    customerName: "Mariana Costa",
    customerPhone: "(31) 97777-8888",
    product: "Blusa Floral Primavera",
    value: 89.9,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: "sale-2",
    customerName: "Ana Silva",
    customerPhone: "(11) 98765-4321",
    product: "Saia Midi Jeans",
    value: 120.0,
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
  },
  {
    id: "sale-3",
    customerName: "Lucas Lima",
    customerPhone: "(19) 95555-4444",
    product: "Camisa Algodão Slim",
    value: 149.9,
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
  },
];

export const INITIAL_TRIGGERS: CustomTrigger[] = [
  {
    id: "trig-1",
    keyword: "Preço",
    reply: "Nossos produtos principais:\n- Vestido Verão: R$ 119,90 👗\n- Calça Slim Fit: R$ 149,90 👖\n- Blusa Estampada: R$ 79,90 👚\nQual desses você mais gostou?",
    simulateSale: false,
    saleProduct: "",
    saleValue: 0,
  },
  {
    id: "trig-2",
    keyword: "Quero comprar",
    reply: "Perfeito! Vou gerar seu pedido especial agora mesmo. Você prefere pagamento por Pix ou Cartão de Crédito? Segue a confirmação:",
    simulateSale: true,
    saleProduct: "Vestido Verão Especial",
    saleValue: 119.9,
  },
  {
    id: "trig-3",
    keyword: "Endereço",
    reply: "Nossa loja física fica na Av. Paulista, 1000 - São Paulo, SP. Também fazemos entregas para todo o Brasil com frete grátis em compras acima de R$ 199,00! 🚚",
    simulateSale: false,
    saleProduct: "",
    saleValue: 0,
  },
];

export const DEFAULT_SETTINGS: BotSettings = {
  companyName: "Bella Modas",
  businessType: "Vestuário & Moda Feminina/Masculina",
  botRules: "Priorize vender o Vestido Verão (R$ 119,90) ou a Calça Slim Fit (R$ 149,90). Se o cliente pedir desconto, diga que comprando 2 peças o frete é grátis. Seja alegre e muito prestativo.",
  autoReply: "Olá! Seja muito bem-vindo à Bella Modas. 🌸 Sou o assistente virtual da loja e estou aqui para te ajudar a escolher os melhores looks. Como posso te apoiar hoje?",
  isSmartMode: true, // Powered by Gemini!
};

// Simulated message lists for customers
export const SIMULATED_CONVERSATIONS: Record<string, { text: string; sender: "user" | "bot" | "system"; timestamp: string }[]> = {
  "cust-1": [
    { text: "Olá! Vi o anúncio de vocês no Instagram", sender: "user", timestamp: "12:30" },
    { text: "Olá! Seja muito bem-vindo à Bella Modas. 🌸 Sou o assistente virtual da loja e estou aqui para te ajudar a escolher os melhores looks. Como posso te apoiar hoje?", sender: "bot", timestamp: "12:30" },
    { text: "Gostei muito daquele vestido verde midi", sender: "user", timestamp: "12:35" },
    { text: "Excelente escolha! O Vestido Verde Midi é um dos nossos campeões de vendas. Ele é feito com tecido super fresco e caimento perfeito. Ele custa R$ 119,90.", sender: "bot", timestamp: "12:36" },
    { text: "Quero fechar o pedido do vestido verde, por favor!", sender: "user", timestamp: "12:45" },
  ],
  "cust-2": [
    { text: "Oi, tudo bem?", sender: "user", timestamp: "11:28" },
    { text: "Olá! Seja muito bem-vindo à Bella Modas. 🌸 Sou o assistente virtual da loja e estou aqui para te ajudar a escolher os melhores looks. Como posso te apoiar hoje?", sender: "bot", timestamp: "11:28" },
    { text: "Olá, vocês entregam no Rio de Janeiro?", sender: "user", timestamp: "11:30" },
  ],
  "cust-3": [
    { text: "Bom dia, meu pedido chegou e amei!", sender: "user", timestamp: "Ontem" },
    { text: "Que felicidade ler isso, Mariana! Trabalhamos com muito carinho. Quando quiser mais peças, estamos à disposição!", sender: "bot", timestamp: "Ontem" },
    { text: "Gostei muito dos produtos, aceitam Pix?", sender: "user", timestamp: "Ontem" },
  ],
  "cust-4": [
    { text: "Qual é o prazo de entrega para Curitiba?", sender: "user", timestamp: "Ontem" },
  ],
};
