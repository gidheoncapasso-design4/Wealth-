import { describe, it, expect } from "vitest";
import { calculateDizimo, autoSanitizeTransactions } from "./financeUtils";
import { Transaction } from "../types";

function makeTx(overrides: Partial<Transaction> & Pick<Transaction, "id" | "title" | "amount">): Transaction {
  return {
    category: "Outros",
    time: "10:00",
    date: "Recorrente Mensal",
    icon: "payments",
    colorClass: "",
    ...overrides,
  };
}

describe("calculateDizimo", () => {
  it("calculates 10% of total inflow", () => {
    expect(calculateDizimo(23350)).toBe(2335);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculateDizimo(100.005)).toBeCloseTo(10.0, 2);
  });

  it("returns 0 for no inflow", () => {
    expect(calculateDizimo(0)).toBe(0);
  });
});

describe("autoSanitizeTransactions", () => {
  it("inserts the three core recurring income streams when missing", () => {
    const result = autoSanitizeTransactions([]);
    const titles = result.map((t) => t.title);
    expect(titles).toContain("Salário - Elo");
    expect(titles).toContain("Ajuda de custo igreja - Gidheon");
    expect(titles).toContain("Mentoria - Gidheon");
  });

  it("does not duplicate income streams that already exist", () => {
    const existing = [makeTx({ id: "tx-salario-elo", title: "Salário - Elo", amount: 19500 })];
    const result = autoSanitizeTransactions(existing);
    const eloCount = result.filter((t) => t.title === "Salário - Elo").length;
    expect(eloCount).toBe(1);
  });

  it("flips a mislabeled positive invoice payment to negative", () => {
    const imported = [makeTx({ id: "imp-1", title: "Pagamento de Fatura", amount: 500 })];
    const result = autoSanitizeTransactions(imported);
    const invoice = result.find((t) => t.id === "imp-1")!;
    expect(invoice.amount).toBe(-500);
  });

  it("does not flip a refund even if its title mentions the card", () => {
    const imported = [makeTx({ id: "imp-2", title: "Estorno Fatura Cartão", amount: 50 })];
    const result = autoSanitizeTransactions(imported);
    const refund = result.find((t) => t.id === "imp-2")!;
    expect(refund.amount).toBe(50);
  });

  it("computes the tithe as 10% of total inflow (excluding the tithe itself)", () => {
    const result = autoSanitizeTransactions([]);
    // Base income streams total 19500 + 3150 + 700 = 23350
    const dizimo = result.find((t) => t.id === "tx-dizimo-10")!;
    expect(dizimo.amount).toBe(-2335);
  });

  it("updates an existing tithe transaction in place instead of duplicating it", () => {
    const existing = [
      makeTx({ id: "tx-dizimo-10", title: "Dízimo (10% das Receitas)", amount: -999 }),
    ];
    const result = autoSanitizeTransactions(existing);
    const dizimoEntries = result.filter((t) => t.id === "tx-dizimo-10");
    expect(dizimoEntries).toHaveLength(1);
    expect(dizimoEntries[0].amount).toBe(-2335);
  });
});
