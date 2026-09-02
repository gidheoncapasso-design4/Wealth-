import { Transaction } from "../types";

// The household commits 10% of all inflows to tithe; this is recalculated from
// the live transaction list rather than being a fixed number, so it always
// tracks whatever income is actually recorded.
export function calculateDizimo(totalInflow: number): number {
  return Math.round(totalInflow * 0.1 * 100) / 100;
}

// Auto-correct imported transactions and guarantee the household's core recurring
// income streams + the 10% tithe are always present and correctly signed, even if
// a bank statement import mislabeled a card invoice payment as a positive amount.
export function autoSanitizeTransactions(txs: Transaction[]): Transaction[] {
  let sanitized = txs.map((tx) => {
    const titleLower = (tx.title || "").toLowerCase();
    const isInvoiceOrPayment =
      titleLower.includes("pagamento") ||
      titleLower.includes("fatura") ||
      titleLower.includes("débito automático") ||
      titleLower.includes("debito automatico") ||
      titleLower.includes("cartão") ||
      titleLower.includes("cartao");
    const isRefund = titleLower.includes("estorno") || titleLower.includes("devolução") || titleLower.includes("recebido");

    if (isInvoiceOrPayment && !isRefund && tx.amount > 0) {
      return {
        ...tx,
        amount: -Math.abs(tx.amount),
        colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        icon: "creditCard",
      };
    }
    return tx;
  });

  // Ensure Salário Elo, Ajuda de custo igreja Gidheon, and Mentoria Gidheon are present and positive
  const hasElo = sanitized.some((t) => t.title.toLowerCase().includes("elo") && (t.title.toLowerCase().includes("salário") || t.title.toLowerCase().includes("salario")));
  const hasChurch = sanitized.some((t) => t.title.toLowerCase().includes("igreja"));
  const hasMentoria = sanitized.some((t) => t.title.toLowerCase().includes("mentoria"));

  if (!hasElo) {
    sanitized.unshift({
      id: "tx-salario-elo",
      title: "Salário - Elo",
      category: "Receita / Salário",
      amount: 19500.0,
      date: "Recorrente Mensal",
      time: "08:00",
      icon: "briefcase",
      colorClass: "text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/20",
      isRecurring: true,
    });
  }

  if (!hasChurch) {
    sanitized.unshift({
      id: "tx-igreja-gidheon",
      title: "Ajuda de custo igreja - Gidheon",
      category: "Receita / Salário",
      amount: 3150.0,
      date: "Recorrente Mensal",
      time: "08:00",
      icon: "landmark",
      colorClass: "text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/20",
      isRecurring: true,
    });
  }

  if (!hasMentoria) {
    sanitized.unshift({
      id: "tx-mentoria-gidheon",
      title: "Mentoria - Gidheon",
      category: "Receita / Mentoria",
      amount: 700.0,
      date: "Recorrente Mensal",
      time: "09:00",
      icon: "sparkles",
      colorClass: "text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/20",
      isRecurring: true,
    });
  }

  // Automatically calculate 10% Dízimo from total inflows
  const totalInflow = sanitized
    .filter((t) => t.amount > 0 && !t.title.toLowerCase().includes("dízimo") && !t.title.toLowerCase().includes("dizimo"))
    .reduce((sum, t) => sum + t.amount, 0);

  const dizimoVal = calculateDizimo(totalInflow);

  const dizimoIdx = sanitized.findIndex(
    (t) => t.id === "tx-dizimo-10" || t.title.toLowerCase().includes("dízimo") || t.title.toLowerCase().includes("dizimo")
  );

  if (dizimoIdx >= 0) {
    sanitized[dizimoIdx] = {
      ...sanitized[dizimoIdx],
      title: "Dízimo (10% das Receitas)",
      amount: -dizimoVal,
      category: "Dízimo & Doações",
      colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      isRecurring: true,
    };
  } else {
    sanitized.push({
      id: "tx-dizimo-10",
      title: "Dízimo (10% das Receitas)",
      category: "Dízimo & Doações",
      amount: -dizimoVal,
      date: "Recorrente Mensal",
      time: "10:00",
      icon: "heart",
      colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      isRecurring: true,
    });
  }

  return sanitized;
}
