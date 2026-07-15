import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import pkg from "@whiskeysockets/baileys";
const makeWASocket = (pkg as any).default || pkg;
const { useMultiFileAuthState, DisconnectReason, delay } = pkg as any;
import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client to handle missing API keys gracefully
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// --- WHATSAPP & SSE INTEGRATION STATE ---
let qrCodeDataUrl: string | null = null;
let connectionStatus: "disconnected" | "connecting" | "connected" = "disconnected";
let whatsappSock: any = null;
const clients: any[] = [];
const chatHistory: Record<string, { role: "user" | "model"; text: string }[]> = {};

let activeSettings = {
  companyName: "ZapBot Premium",
  businessType: "E-commerce de Varejo",
  botRules: "Seja simpático e tente fechar a venda.",
  autoReply: "Olá! Seja muito bem-vindo. Como posso te ajudar hoje?",
};

let activeTriggers: any[] = [];

function sendSSE(event: string, data: any) {
  clients.forEach((client) => {
    try {
      client.write(`event: ${event}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

// Helper to generate bot responses for WhatsApp
async function getBotReply(message: string, senderNumber: string) {
  const history = chatHistory[senderNumber] || [];
  
  // 1. Check custom triggers
  const lowerMessage = message.toLowerCase().trim();
  for (const trigger of activeTriggers) {
    if (trigger.keyword && lowerMessage.includes(trigger.keyword.toLowerCase().trim())) {
      let reply = trigger.reply;
      let saleDetected = null;
      if (trigger.simulateSale && trigger.saleProduct && trigger.saleValue) {
        reply += `\n\n[VENDA: ${trigger.saleProduct} - R$ ${Number(trigger.saleValue).toFixed(2)}]`;
        saleDetected = { product: trigger.saleProduct, value: Number(trigger.saleValue) };
      }
      return { reply, saleDetected };
    }
  }

  // 2. Generate with Gemini
  try {
    const ai = getGeminiClient();
    
    const geminiContents = history.map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    }));

    geminiContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const systemInstruction = `Você é o ZapBot, um robô vendedor inteligente que responde mensagens de clientes no WhatsApp para a empresa "${activeSettings.companyName}" (${activeSettings.businessType}).
Seu objetivo é simular um atendimento humano, simpático, ágil e altamente persuasivo para guiar o cliente em direção à compra.

Regras de negócio e de atendimento:
- ${activeSettings.botRules}
- Mensagem de boas-vindas da empresa: "${activeSettings.autoReply}"
- Responda de forma concisa, amigável e use emojis do WhatsApp com moderação. Use quebras de linha para facilitar a leitura.

CRÍTICO - FECHAMENTO DE VENDAS AUTOMÁTICO:
Se o cliente demonstrar intenção CLARA de finalizar a compra, concordar em adquirir um produto ou serviço, ou solicitar a cobrança/fechamento, você deve comemorar de forma profissional, dar as instruções de pagamento simuladas, e OBRIGATORIAMENTE incluir a seguinte tag exata no final da sua mensagem de confirmação de venda para que o sistema registre a transação:
[VENDA: <Nome do Produto> - R$ <Valor>]
Exemplo de fechamento de venda:
"Ótima escolha! Já reservei o seu pedido. Você pode fazer o Pix para a nossa chave. Assim que enviar o comprovante, faremos o envio do produto! 🎉\n\n[VENDA: Combo Premium - R$ 149.90]"

Por favor, faça ofertas realistas que correspondam ao tipo de negócio "${activeSettings.businessType}". Não invente preços absurdos. Os produtos devem custar valores realistas entre R$ 20,00 e R$ 499,00.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const replyText = response.text || "Desculpe, não consegui processar sua mensagem agora.";
    
    const saleRegex = /\[VENDA:\s*(.*?)\s*-\s*R\$\s*([\d.,]+)\]/;
    const match = replyText.match(saleRegex);
    let saleDetected = null;

    if (match) {
      const product = match[1].trim();
      const valueStr = match[2].replace(",", ".").trim();
      const value = parseFloat(valueStr);
      if (!isNaN(value)) {
        saleDetected = { product, value };
      }
    }

    return { reply: replyText, saleDetected };
  } catch (err) {
    console.error("Erro ao gerar resposta com Gemini no WhatsApp real:", err);
    return { reply: "Olá! Desculpe a demora, estamos processando sua solicitação de atendimento.", saleDetected: null };
  }
}

async function initializeWhatsApp() {
  if (connectionStatus === "connected" || connectionStatus === "connecting") {
    return;
  }

  connectionStatus = "connecting";
  qrCodeDataUrl = null;
  sendSSE("status", { status: connectionStatus, qr: qrCodeDataUrl });

  try {
    const authDir = path.join(process.cwd(), "auth_info_baileys");
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["ZapBot", "Chrome", "1.0.0"],
    });

    whatsappSock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(qr);
          sendSSE("status", { status: "connecting", qr: qrCodeDataUrl });
        } catch (err) {
          console.error("Erro ao gerar QR Code Data URL:", err);
        }
      }

      if (connection === "close") {
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log("Conexão fechada devido a:", lastDisconnect?.error, ", reconectando:", shouldReconnect);
        
        connectionStatus = "disconnected";
        qrCodeDataUrl = null;
        whatsappSock = null;
        sendSSE("status", { status: connectionStatus, qr: qrCodeDataUrl });

        if (shouldReconnect) {
          setTimeout(() => {
            initializeWhatsApp().catch(err => console.error(err));
          }, 5000);
        } else {
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch (e) {
            console.error("Erro ao remover diretório de credenciais:", e);
          }
        }
      } else if (connection === "open") {
        console.log("Conexão com o WhatsApp estabelecida com SUCESSO!");
        connectionStatus = "connected";
        qrCodeDataUrl = null;
        sendSSE("status", { status: connectionStatus, qr: qrCodeDataUrl });
      }
    });

    sock.ev.on("messages.upsert", async (m: any) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === "notify") {
        const senderNumber = msg.key.remoteJid;
        if (!senderNumber || senderNumber.includes("@g.us")) return;

        const messageText = msg.message?.conversation || 
                            msg.message?.extendedTextMessage?.text || 
                            "";
        
        if (!messageText) return;

        const senderName = msg.pushName || senderNumber.split("@")[0];

        // 1. Send incoming message to SSE
        sendSSE("message", {
          id: msg.key.id || `msg-${Date.now()}`,
          sender: "user",
          senderNumber,
          senderName,
          text: messageText,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });

        // 2. Add history
        if (!chatHistory[senderNumber]) {
          chatHistory[senderNumber] = [];
        }
        chatHistory[senderNumber].push({ role: "user", text: messageText });
        if (chatHistory[senderNumber].length > 15) chatHistory[senderNumber].shift();

        // 3. Generate response
        const botResult = await getBotReply(messageText, senderNumber);

        // 4. Send response back
        try {
          await delay(1200);
          await sock.sendMessage(senderNumber, { text: botResult.reply });
        } catch (e) {
          console.error("Erro ao enviar mensagem pelo WhatsApp:", e);
        }

        // 5. Send outgoing message to SSE
        sendSSE("message", {
          id: `bot-${Date.now()}`,
          sender: "bot",
          senderNumber,
          senderName,
          text: botResult.reply,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          saleDetected: botResult.saleDetected,
        });

        // 6. Add to history
        chatHistory[senderNumber].push({ role: "model", text: botResult.reply });
        if (chatHistory[senderNumber].length > 15) chatHistory[senderNumber].shift();
      }
    });

  } catch (error) {
    console.error("Erro ao inicializar WhatsApp:", error);
    connectionStatus = "disconnected";
    qrCodeDataUrl = null;
    whatsappSock = null;
    sendSSE("status", { status: connectionStatus, qr: qrCodeDataUrl });
  }
}

// API endpoint for generating chatbot responses
app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      history = [],
      companyName = "ZapBot Premium",
      businessType = "E-commerce de Varejo",
      botRules = "Seja simpático e tente fechar a venda.",
      autoReply = "Olá! Seja muito bem-vindo. Como posso te ajudar hoje?",
      customTriggers = [],
      isFirstMessage = false,
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: "A mensagem é obrigatória." });
    }

    // 1. Check for immediate custom keyword triggers (case insensitive)
    const lowerMessage = message.toLowerCase().trim();
    for (const trigger of customTriggers) {
      if (trigger.keyword && lowerMessage.includes(trigger.keyword.toLowerCase().trim())) {
        let reply = trigger.reply;
        // Check if trigger simulates a sale
        let saleDetected = null;
        if (trigger.simulateSale && trigger.saleProduct && trigger.saleValue) {
          reply += `\n\n[VENDA: ${trigger.saleProduct} - R$ ${Number(trigger.saleValue).toFixed(2)}]`;
          saleDetected = { product: trigger.saleProduct, value: Number(trigger.saleValue) };
        }
        return res.json({ reply, saleDetected, source: "trigger" });
      }
    }

    // 2. Generate content using Gemini 3.5 Flash
    const ai = getGeminiClient();

    // Map roles: UI uses 'sender' (user/bot). Convert history to Gemini format (user/model)
    const geminiContents = history.map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    }));

    // Add current message to the list
    geminiContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const systemInstruction = `Você é o ZapBot, um robô vendedor inteligente que responde mensagens de clientes no WhatsApp para a empresa "${companyName}" (${businessType}).
Seu objetivo é simular um atendimento humano, simpático, ágil e altamente persuasivo para guiar o cliente em direção à compra.

Regras de negócio e de atendimento:
- ${botRules}
- Mensagem de boas-vindas da empresa: "${autoReply}"
- Responda de forma concisa, amigável e use emojis do WhatsApp com moderação. Use quebras de linha para facilitar a leitura.

CRÍTICO - FECHAMENTO DE VENDAS AUTOMÁTICO:
Se o cliente demonstrar intenção CLARA de finalizar a compra, concordar em adquirir um produto ou serviço, ou solicitar a cobrança/fechamento, você deve comemorar de forma profissional, dar as instruções de pagamento simuladas, e OBRIGATORIAMENTE incluir a seguinte tag exata no final da sua mensagem de confirmação de venda para que o sistema registre a transação:
[VENDA: <Nome do Produto> - R$ <Valor>]
Exemplo de fechamento de venda:
"Ótima escolha! Já reservei o seu pedido. Você pode fazer o Pix para a nossa chave. Assim que enviar o comprovante, faremos o envio do produto! 🎉\n\n[VENDA: Combo Premium - R$ 149.90]"

Por favor, faça ofertas realistas que correspondam ao tipo de negócio "${businessType}". Não invente preços absurdos. Os produtos devem custar valores realistas entre R$ 20,00 e R$ 499,00.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const replyText = response.text || "Desculpe, não consegui processar sua mensagem agora.";

    // Detect if a sale tag is inside the generated reply
    // Format: [VENDA: Product Name - R$ 99.90] or [VENDA: Product Name - R$99,90]
    const saleRegex = /\[VENDA:\s*(.*?)\s*-\s*R\$\s*([\d.,]+)\]/;
    const match = replyText.match(saleRegex);
    let saleDetected = null;

    if (match) {
      const product = match[1].trim();
      const valueStr = match[2].replace(",", ".").trim();
      const value = parseFloat(valueStr);
      if (!isNaN(value)) {
        saleDetected = { product, value };
      }
    }

    return res.json({
      reply: replyText,
      saleDetected,
      source: "gemini",
    });
  } catch (error: any) {
    console.error("Erro no processamento do chatbot:", error);
    return res.status(500).json({
      error: "Erro ao gerar resposta do robô. Certifique-se de que a chave GEMINI_API_KEY está configurada corretamente nos Segredos.",
      details: error.message,
    });
  }
});

// --- WHATSAPP API ROUTES ---

// Get current connection status & QR code
app.get("/api/whatsapp/status", (req, res) => {
  res.json({
    status: connectionStatus,
    qr: qrCodeDataUrl,
  });
});

// Start connection
app.post("/api/whatsapp/connect", async (req, res) => {
  if (connectionStatus === "connected") {
    return res.json({ success: true, status: "connected", message: "WhatsApp já está conectado." });
  }
  initializeWhatsApp().catch((err) => console.error("Erro ao conectar WhatsApp:", err));
  res.json({ success: true, status: "connecting" });
});

// Disconnect WhatsApp session and clean up
app.post("/api/whatsapp/disconnect", async (req, res) => {
  connectionStatus = "disconnected";
  qrCodeDataUrl = null;

  if (whatsappSock) {
    try {
      await whatsappSock.logout();
    } catch (e) {
      console.error("Erro ao efetuar logout do socket:", e);
    }
    try {
      whatsappSock.end();
    } catch (e) {}
    whatsappSock = null;
  }

  const authDir = path.join(process.cwd(), "auth_info_baileys");
  try {
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error("Erro ao remover diretório de credenciais no disconnect:", e);
  }

  sendSSE("status", { status: "disconnected", qr: null });
  res.json({ success: true, status: "disconnected" });
});

// SSE endpoint to receive real-time updates (connection status, messages, sales)
app.get("/api/whatsapp/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  clients.push(res);

  // Send initial state immediately
  res.write(`event: status\n`);
  res.write(`data: ${JSON.stringify({ status: connectionStatus, qr: qrCodeDataUrl })}\n\n`);

  req.on("close", () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) {
      clients.splice(idx, 1);
    }
  });
});

// Sync active chatbot settings and custom triggers from client to server
app.post("/api/whatsapp/settings", (req, res) => {
  const { settings, triggers } = req.body;
  if (settings) {
    activeSettings = settings;
  }
  if (triggers) {
    activeTriggers = triggers;
  }
  res.json({ success: true });
});

// Send message to real contact
app.post("/api/whatsapp/send", async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) {
    return res.status(400).json({ error: "Destinatário (to) e mensagem (text) são obrigatórios." });
  }

  if (connectionStatus !== "connected" || !whatsappSock) {
    return res.status(400).json({ error: "WhatsApp não está conectado." });
  }

  try {
    const formattedTo = to.includes("@s.whatsapp.net") ? to : `${to.replace(/\D/g, "")}@s.whatsapp.net`;
    await whatsappSock.sendMessage(formattedTo, { text });

    if (!chatHistory[formattedTo]) {
      chatHistory[formattedTo] = [];
    }
    chatHistory[formattedTo].push({ role: "model", text });
    if (chatHistory[formattedTo].length > 15) {
      chatHistory[formattedTo].shift();
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao enviar mensagem pelo WhatsApp:", error);
    res.status(500).json({ error: error.message });
  }
});

// Configure Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Auto-connect WhatsApp if credential directory exists on startup
  const authDir = path.join(process.cwd(), "auth_info_baileys");
  if (fs.existsSync(authDir)) {
    console.log("Detectado credenciais de conexão salvas. Auto-conectando ao WhatsApp...");
    initializeWhatsApp().catch((err) => console.error("Erro ao auto-conectar WhatsApp:", err));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
