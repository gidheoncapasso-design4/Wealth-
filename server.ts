import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Lazy-loaded Gemini Client
let aiInstance: any = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in Secrets");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Simulated Smart Financial Analyst response in case of missing key or demo fallback
function getSimulatedAnalystResponse(message: string, context?: any): string {
  const name = context?.userName || "Gidheon Capasso";
  const firstName = name.split(" ")[0];
  const lowercase = message.toLowerCase().trim();
  const txs = context?.transactions || [];
  const recs = context?.recurringExpenses || [];
  const totalFixed = context?.totalFixedExpenses || 18280;
  const liquid = context?.liquidBalance || 35070;
  const invested = context?.investedAmount || 0;
  const netWorth = liquid + invested;

  // Greetings & casual chat
  if (lowercase.match(/^(oi|olá|ola|bom dia|boa tarde|boa noite|opa|fala|e aí|e ai|tudo bem|como vai)/i)) {
    return `Olá, ${firstName}! Tudo ótimo por aqui. Como posso te ajudar hoje? Podemos conversar sobre seu fluxo de caixa, planejar novas metas, analisar despesas ou qualquer outra dúvida financeira que você tiver!`;
  }

  // General questions or asking about capability
  if (lowercase.includes("quem é você") || lowercase.includes("o que você faz") || lowercase.includes("ajuda")) {
    return `Eu sou o seu consultor e analista financeiro inteligente, ${firstName}! Você pode conversar comigo livremente por texto ou por voz sobre qualquer assunto: planejamento financeiro, simulações de compra, controle de gastos, metas da família, reserva de emergência e estratégias de investimento. Como posso te apoiar hoje?`;
  }

  // Dízimo & Finanças Família
  if (lowercase.includes("dízimo") || lowercase.includes("dizimo") || lowercase.includes("igreja") || lowercase.includes("espiritual") || lowercase.includes("doação")) {
    const totalInflows = 23350.00;
    const dizimoAmount = totalInflows * 0.10;
    return `✝️ **Análise de Dízimos & Finanças da Família (${firstName} & Elo)**\n\n` +
      `• **Total de Receitas Mês**: R$ ${totalInflows.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• **Dízimo Calculado (10% de Todas as Entradas)**: R$ ${dizimoAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• **Status no Planejamento**: Integrado automaticamente aos Custos Fixos recorrentes da família.\n\n` +
      `**Recomendação do Analista:**\n` +
      `O Dízimo representa prioridade e fidelidade. Ao calcular 10% sobre as entradas de Salário Elo (R$ 19.500) + Pró-labore e Mentorias Gidheon (R$ 3.850), o valor de R$ 2.335,00/mês se mantém perfeitamente sustentável dentro do seu fluxo de caixa livre de R$ 5.070,00/mês.`;
  }

  // Fluxo de Caixa & Sobra
  if (lowercase.includes("fluxo") || lowercase.includes("sobra") || lowercase.includes("entradas") || lowercase.includes("receita") || lowercase.includes("resultado")) {
    const totalInflows = 23350.00;
    const netCashFlow = totalInflows - totalFixed;
    return `💡 **Diagnóstico de Fluxo de Caixa & Sobra Mensal**\n\n` +
      `• **Total de Entradas (Receitas Mês)**: R$ ${totalInflows.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• **Total de Custos Fixos (Mês)**: R$ ${totalFixed.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${recs.length} despesas)\n` +
      `• **Sobra Livre Líquida**: R$ ${netCashFlow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${((netCashFlow/totalInflows)*100).toFixed(1)}% do orçamento)\n\n` +
      `**Estratégias de Otimização:**\n` +
      `1. **Aporte Automático**: Programe a transferência da sobra de R$ 5.070,00 no início do mês diretamente para a conta de investimento.\n` +
      `2. **Acompanhamento das Variáveis**: Mantenha as saídas do cartão de crédito dentro da margem de segurança para garantir a preservação desta sobra.`;
  }

  // Corte de Gastos & Enxugamento
  if (lowercase.includes("corte") || lowercase.includes("enxugar") || lowercase.includes("gargalo") || lowercase.includes("reduzir") || lowercase.includes("despesa")) {
    return `✂️ **Análise de Otimização e Corte de Custos Fixos**\n\n` +
      `Avaliando suas ${recs.length} despesas fixas cadastradas (R$ ${totalFixed.toLocaleString("pt-BR")},00/mês):\n\n` +
      `• **Aluguel**: R$ 4.500,00 (24,6% do custo fixo)\n` +
      `• **Financiamento Veículo**: R$ 3.000,00 (16,4% do custo fixo)\n` +
      `• **Supermercado / Alimentação Casa**: R$ 2.000,00 (10,9% do custo fixo)\n` +
      `• **Dízimo & Família**: R$ 2.335,00 (12,8% do custo fixo)\n\n` +
      `**Pontos de Ajuste Recomendados:**\n` +
      `1. **Gastos com Lazer/Restaurantes**: Concentrar no cartão de crédito com teto rígido.\n` +
      `2. **Assinaturas & Conectividade**: Revisar pacotes de TV, streaming e telefone para economia estimada de R$ 300 - R$ 500/mês.`;
  }

  // Metas & Reserva de Emergência
  if (lowercase.includes("meta") || lowercase.includes("reserva") || lowercase.includes("europa") || lowercase.includes("viagem")) {
    return `🎯 **Plano de Ação para Metas & Reserva de Emergência**\n\n` +
      `• **Reserva de Emergência Ideal (6 meses de custos fixos)**: R$ ${(totalFixed * 6).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• **Patrimônio Atual (Saldo + Investido)**: R$ ${netWorth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• **Meta Viagem Europa**: R$ 35.000,00\n\n` +
      `**Cronograma de Execução:**\n` +
      `Com uma capacidade de poupança mensal de R$ 5.070,00, vocês conseguirão completar o valor integral da Viagem para a Europa em aproximadamente **7 meses** mantendo a disciplina de aportes!`;
  }

  if (lowercase.includes("economizar") || lowercase.includes("poupar") || lowercase.includes("guardar")) {
    return `Olá ${firstName}! Analisando o seu planejamento financeiro:\n\n` +
      `• **Custos Fixos Mensais Cadastrados**: R$ ${totalFixed.toLocaleString("pt-BR")},00 (${recs.length} despesas como Aluguel, Carro, Escola, etc.)\n` +
      `• **Movimentações no Extrato**: ${txs.length} lançamentos ativos.\n\n` +
      `**Dicas de Otimização Real:**\n` +
      `1. Seus custos fixos estão mapeados na aba **Contas Fixas**. Mantenha o acompanhamento dos pagamentos para evitar juros de mora.\n` +
      `2. Utilize o botão **Importar Extrato Bancário** para categorizar e controlar seus gastos variáveis comparados ao teto mensal.`;
  }

  if (lowercase.includes("gasto") || lowercase.includes("despesa") || lowercase.includes("alimentação") || lowercase.includes("lazer")) {
    const foodTxs = txs.filter((t: any) => {
      const cat = (t.category || "").toLowerCase();
      const title = (t.title || "").toLowerCase();
      return cat.includes("aliment") || cat.includes("restaur") || title.includes("ifood") || title.includes("mercado") || title.includes("restaurante") || title.includes("padaria");
    });

    if (foodTxs.length > 0) {
      const totalFood = foodTxs.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
      return `${firstName}, analisando seus lançamentos reais no extrato:\n\n` +
        `• **Total Encontrado em Alimentação**: R$ ${totalFood.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
        `• **Detalhamento (${foodTxs.length} registros)**:\n` +
        foodTxs.map((t: any) => `  - ${t.title}: R$ ${Math.abs(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${t.date || "Recente"})`).join("\n");
    } else {
      return `${firstName}, no momento **não há lançamentos na categoria de Alimentação** no seu extrato de caixa atual.\n\n` +
        `• **Transações no extrato**: ${txs.length}\n` +
        `• **Custos Fixos cadastrados**: R$ ${totalFixed.toLocaleString("pt-BR")},00/mês (${recs.length} contas cadastradas)\n\n` +
        `Para analisar seus gastos de alimentação, você pode importar seu extrato bancário na aba **Transações > Importar Extrato**!`;
    }
  }

  if (lowercase.includes("investimento") || lowercase.includes("ações") || lowercase.includes("renda") || lowercase.includes("carteira")) {
    return `Olá ${firstName}! Aqui está o panorama do seu patrimônio:\n\n` +
      `• **Saldo Líquido Disponível**: R$ ${liquid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• **Patrimônio Investido**: R$ ${invested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• **Patrimônio Total**: R$ ${netWorth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n` +
      `**Orientação de Alocação**: Recomenda-se manter uma reserva de liquidez cobrindo seus custos fixos reais (R$ ${totalFixed.toLocaleString("pt-BR")}/mês) antes de direcionar novos aportes para investimentos de longo prazo.`;
  }

  return `Olá, ${firstName}! Entendi seu ponto sobre: "${message}".\n\n` +
    `Com base nas suas finanças (Entradas R$ 23.350, Custos Fixos R$ ${totalFixed.toLocaleString("pt-BR")}/mês e Sobra de R$ 5.070/mês), estamos em uma posição favorável. Me dê mais detalhes do que você está planejando ou quer decidir para eu calcular e te orientar passo a passo!`;
}

// AI Chatbot Route using @google/genai SDK
app.post("/api/wealth-ai/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Mensagem é necessária" });
    }

    try {
      const ai = getGeminiClient();
      
      const userName = context?.userName || "Gidheon Capasso";
      const liquidBalance = context?.liquidBalance || 0;
      const investedAmount = context?.investedAmount || 0;
      const netWorth = context?.netWorth || (liquidBalance + investedAmount);
      const totalFixedExpenses = context?.totalFixedExpenses || 18280;
      
      const txsList = (context?.transactions || [])
        .map((t: any) => `- ${t.date || "Data N/A"}: ${t.title} (${t.category}) -> R$ ${t.amount}`)
        .join("\n");
      
      const recsList = (context?.recurringExpenses || [])
        .map((r: any) => `- ${r.title} (${r.category}): R$ ${r.amount}/mês (Vencimento dia ${r.dueDate}, Pago: ${r.paidThisMonth ? "Sim" : "Não"})`)
        .join("\n");

      // Formatting the context with REAL financial details and natural chat instructions
      const systemInstruction = `
        Você é o Gemini, o assistente e consultor financeiro de inteligência artificial de ${userName} e sua família.
        
        SUA IDENTIDADE E POSTURA:
        - Você é uma IA de conversação avançada e natural: inteligente, empática, rápida, calorosa, perspicaz e muito clara.
        - Fale de forma totalmente natural em português do Brasil, como um parceiro e conselheiro financeiro de alto nível.
        - Você entende todo tipo de conversa: desde saudações simples ("oi", "tudo bem?"), desabafos, dúvidas rápidas ("posso sair para jantar hoje?"), planos familiares, até análises estratégicas complexas sobre investimentos, compras de imóveis, veículos, rentabilidade e corte de gastos.
        - Não seja rígido nem fale como um robô programado com relatórios padronizados. Converse com o usuário, faça perguntas relevantes quando faltar informação, dê respostas diretas, estruturadas e fluidas.
        
        DADOS FINANCEIROS REAIS DE ${userName} NO SISTEMA:
        - Titular: ${userName}
        - Patrimônio Total: R$ ${netWorth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        - Saldo Líquido Disponível: R$ ${liquidBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        - Total Investido: R$ ${investedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        - Custos Fixos Mensais: R$ ${totalFixedExpenses.toLocaleString("pt-BR")},00/mês (${(context?.recurringExpenses || []).length} contas cadastradas)
        
        Contas Fixas Cadastradas do Usuário:
${recsList || "  Nenhuma conta fixa cadastrada."}

        Lançamentos Atuais no Extrato (${(context?.transactions || []).length} movimentações ativas):
${txsList || "  Extrato de movimentações sem transações ativas no momento."}

        DIRETRIZES FUNDAMENTAIS:
        1. Utilize os números reais fornecidos acima sempre que a pergunta exigir cálculos ou dados da conta.
        2. NUNCA invente compras ou estabelecimentos fictícios que não estejam no extrato.
        3. Se o usuário perguntar algo sobre finanças que não está nos dados, responda com sinceridade e dê sugestões práticas.
        4. Mantenha a continuidade do diálogo com base nas mensagens anteriores.
      `;

      // Filter and sanitize chat history
      const formattedHistory: any[] = [];
      if (Array.isArray(history)) {
        for (const h of history) {
          if (h && h.text && h.id !== "welcome") {
            formattedHistory.push({
              role: h.role === "user" ? "user" : "model",
              parts: [{ text: h.text }],
            });
          }
        }
      }

      // Append current message
      formattedHistory.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: formattedHistory,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Olá! Como posso te ajudar hoje?";
      return res.json({ text: replyText, isRealAPI: true });

    } catch (apiError: any) {
      console.warn("Gemini API call failed or key missing:", apiError.message);
      
      const simulatedText = getSimulatedAnalystResponse(message, context);
      return res.json({
        text: simulatedText,
        isRealAPI: false,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for fallback parsing when Gemini key is not configured
function parseStatementFallback(rawText: string) {
  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const items: any[] = [];

  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes("data,categoria") || line.includes("<OFX>") || line.includes("EXTRATO BANCÁRIO")) return;

    let amount = -120.0;
    let category = "Outros";
    let title = line;
    let confidence = "Alta";
    let reasoning = "Reconhecimento inteligente de palavras-chave bancárias";

    const lower = line.toLowerCase();

    const moneyMatch = line.match(/R?\$?\s*(-?\d+[.,]\d{2})/i) || line.match(/(-?\d+[.,]\d{2})/);
    if (moneyMatch) {
      let numStr = moneyMatch[1].replace(".", "").replace(",", ".");
      if (moneyMatch[1].includes(",")) {
        numStr = moneyMatch[1].replace(/\./g, "").replace(",", ".");
      }
      const parsedVal = parseFloat(numStr);
      if (!isNaN(parsedVal)) {
        amount = parsedVal;
        const isExplicitInflow = lower.includes("pix recebido") || lower.includes("salário") || lower.includes("rendimento") || lower.includes("estorno") || lower.includes("depósito recebido") || lower.includes("resgate") || line.includes("+");
        if (isExplicitInflow) {
          amount = Math.abs(amount);
        } else {
          // Default to negative for payments, invoice payments, purchases, debits, card transactions, transfers
          amount = -Math.abs(amount);
        }
      }
    }

    if (lower.includes("cartão") || lower.includes("cartao") || lower.includes("fatura") || lower.includes("crédito") || lower.includes("credito") || lower.includes("visa") || lower.includes("mastercard")) {
      category = "Cartão de Crédito";
      reasoning = "Identificado pagamento de fatura ou lançamento de cartão de crédito";
      if (!lower.includes("estorno") && !lower.includes("recebido")) {
        amount = -Math.abs(amount);
      }
    } else if (lower.includes("supermercado") || lower.includes("mercado") || lower.includes("mami") || lower.includes("carrefour") || lower.includes("pão de açúcar") || lower.includes("restaurante") || lower.includes("outback") || lower.includes("ifood") || lower.includes("padaria") || lower.includes("mcdonalds")) {
      category = "Alimentação";
      reasoning = "Identificado estabelecimento do setor alimentício / refeição";
      title = line.replace(/COMPRA DEBITO|COMPRA CARTAO|PIX ENVIADO|R\$/gi, "").trim();
    } else if (lower.includes("salão") || lower.includes("cabel") || lower.includes("unha") || lower.includes("barbea") || lower.includes("estétic") || lower.includes("manicure") || lower.includes("pedicure") || lower.includes("esmalter") || lower.includes("depilac") || lower.includes("depilaç")) {
      category = "Beleza";
      reasoning = "Identificado estabelecimento do setor de beleza, salão, barbearia e cuidados pessoais";
      title = line.replace(/COMPRA DEBITO|COMPRA CARTAO|PIX ENVIADO|R\$/gi, "").trim();
    } else if (lower.includes("uber") || lower.includes("posto") || lower.includes("gasolina") || lower.includes("ipiranga") || lower.includes("shell") || lower.includes("estacionamento") || lower.includes("pedágio")) {
      category = "Transporte";
      reasoning = "Identificado serviço de mobilidade, combustível ou transporte";
      title = line.replace(/COMPRA DEBITO|COMPRA CARTAO|PIX ENVIADO|R\$/gi, "").trim();
    } else if (lower.includes("aluguel") || lower.includes("condomínio") || lower.includes("imobiliária")) {
      category = "Moradia";
      reasoning = "Identificada despesa de habitação / moradia";
    } else if (lower.includes("netflix") || lower.includes("spotify") || lower.includes("prime") || lower.includes("disney") || lower.includes("cinema") || lower.includes("hbomax")) {
      category = "Entretenimento";
      reasoning = "Identificada assinatura de entretenimento / streaming";
      title = title.replace(/DEBITO AUTOMATICO|R\$/gi, "").trim();
    } else if (lower.includes("drogaria") || lower.includes("farmácia") || lower.includes("raia") || lower.includes("médico") || lower.includes("smart fit") || lower.includes("academia")) {
      category = "Saúde";
      reasoning = "Identificada despesa de saúde, farmácia ou academia";
    } else if (lower.includes("cdb") || lower.includes("tesouro") || lower.includes("investimento") || lower.includes("ações") || lower.includes("rendimento")) {
      category = "Investimentos";
      reasoning = "Identificada aplicação financeira ou rendimento de investimentos";
    } else if (lower.includes("pix recebido") || lower.includes("salário") || lower.includes("pagto salario") || lower.includes("faturamento") || lower.includes("consultoria")) {
      category = "Salário";
      amount = Math.abs(amount);
      reasoning = "Identificado recebimento de renda / faturamento";
    }

    if (!title || title.length < 2) title = `Lançamento ${idx + 1}`;

    items.push({
      title: title.slice(0, 45),
      originalDescription: line,
      amount,
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      category,
      confidence,
      reasoning,
    });
  });

  return { bankName: "Extrato Detectado", period: "Mês Vigente", items };
}

// AI Bank Statement Parsing Route with Gemini 3.6 Flash
app.post("/api/statement/parse", async (req, res) => {
  try {
    const { statementText, fileData, mimeType } = req.body;

    if (!statementText && !fileData) {
      return res.status(400).json({ error: "É necessário fornecer o texto do extrato ou um arquivo." });
    }

    try {
      const ai = getGeminiClient();

      const systemInstruction = `
        Você é um auditor financeiro e especialistas em contabilidade pessoal do Brasil.
        Sua tarefa é ler e analisar extratos bancários brutos (em formato texto, OFX, CSV, PDF ou imagem), extraindo rigorosamente CADA LANÇAMENTO individual.
        
        Para cada lançamento encontrado, extraia:
        1. 'title': Nome limpo e curto da transação (ex: 'iFood Delivery', 'Uber Trip', 'Supermercado Mami', 'Pix Recebido').
        2. 'originalDescription': Descrição original bruta no extrato.
        3. 'amount': Valor numérico em Reais (use valor NEGATIVO para despesas/saídas como -150.00, e valor POSITIVO para receitas/entradas como +2500.00).
        4. 'date': Data formatada (ex: '12/Ago').
        5. 'category': Categoria padrão entre: 'Alimentação', 'Cartão de Crédito', 'Beleza', 'Transporte', 'Moradia', 'Utilidades', 'Filhos & Cuidados', 'Serviços', 'Tributos', 'Seguros', 'Entretenimento', 'Shopping', 'Saúde', 'Salário', 'Investimentos', 'Outros'.
        6. 'confidence': Confiança da IA ('Alta', 'Média' ou 'Baixa').
        7. 'reasoning': Uma frase curta explicando por que essa categoria foi escolhida.

        REGRAS RÍGIDAS SOBRE SINAL DE VALOR (+ ENTRADA OU - SAÍDA):
        - 'Pagamento de Fatura', 'Pagamento de Fatura Débito Automático', 'Pagamento Cartão', 'Fatura Cartão', 'Débito Automático', compras e transferências enviadas são DESPESAS / SAÍDAS. Elas DEVEM ter valor NEGATIVO (ex: -3160.64, -2982.28, -4653.97).
        - NUNCA retorne valor positivo para pagamento de fatura ou pagamentos de cartão de crédito.
        - Apenas PIX recebido, depósitos recebidos, salário, rendimentos ou 'Estorno' (ex: 'Estorno Shopee') são ENTRADAS (valores positivos, ex: +16.10).
      `;

      const contents: any[] = [];

      if (fileData && mimeType) {
        contents.push({
          inlineData: {
            mimeType: mimeType,
            data: fileData,
          },
        });
      }

      if (statementText) {
        contents.push({
          text: `Analise e categorize cada linha deste extrato bancário:\n\n${statementText}`,
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bankName: { type: Type.STRING },
              period: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    originalDescription: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    date: { type: Type.STRING },
                    category: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                  },
                  required: ["title", "originalDescription", "amount", "date", "category", "confidence", "reasoning"],
                },
              },
            },
            required: ["items"],
          },
        },
      });

      const parsedData = JSON.parse(response.text || "{}");
      return res.json({
        success: true,
        data: parsedData,
        isRealAPI: true,
      });

    } catch (apiError: any) {
      console.warn("Gemini API Statement Parse falling back to smart local parser:", apiError.message);
      const fallbackData = parseStatementFallback(statementText || "Linha 1 - Extrato Processado");
      return res.json({
        success: true,
        data: fallbackData,
        isRealAPI: false,
        warning: "Usando parser inteligente integrado. Insira sua GEMINI_API_KEY em Secrets para conexão direta com Gemini.",
      });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", port: PORT });
});

// WhatsApp Notification endpoint
app.post("/api/whatsapp/send-reminder", (req, res) => {
  try {
    const { phoneNumber, title, amount, dueDate, daysAhead } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: "Número do WhatsApp é obrigatório." });
    }

    // Clean phone number (only digits)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const formattedAmount = amount
      ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "R$ 0,00";

    const messageText = `🔔 *Lembrete de Vencimento Wealth*\n\n` +
      `Olá! ⚠️ Lembrete de pagamento:\n` +
      `• *Conta*: ${title}\n` +
      `• *Valor*: ${formattedAmount}\n` +
      `• *Vencimento*: Dia ${dueDate} (Vence amanhã!)\n\n` +
      `👉 *Marque como pago no seu app*: ${req.headers.origin || "https://ais-dev-kuxts4gfhrrbfdzt7jkjjt-848157551135.us-east1.run.app"}`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}&text=${encodedMessage}`;

    return res.json({
      success: true,
      whatsappUrl,
      cleanPhone,
      messageText,
      hasWebhook: !!process.env.WHATSAPP_WEBHOOK_URL,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});


async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || process.argv[1]?.includes("dist");

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        if (vite && vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Wealth Server] running on http://0.0.0.0:${PORT} (${isProduction ? "production" : "development"})`);
  });
}

startServer();
