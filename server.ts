import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
