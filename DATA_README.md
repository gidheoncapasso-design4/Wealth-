# Documentação de Dados do Wealth (Para Desenvolvedores e IAs)

Este repositório contém os dados financeiros reais e o esquema da aplicação **Wealth** de Gidheon Capasso.

---

## 1. Arquivos de Dados

- **`database-export.json`**: Snapshot completo em formato JSON de todos os dados do banco Firestore (`appData/main_profile`).
- **`src/data.ts`**: Conjunto de dados inicial tipado em TypeScript, usado como fallback e estado padrão da aplicação.
- **`src/types.ts`**: Definições das interfaces TypeScript (`Transaction`, `RecurringExpense`, `BankConnection`, `WhatsAppConfig`, etc.).

---

## 2. Resumo do Perfil Financeiro

- **Titular:** Gidheon Capasso (`gidheoncapasso@gmail.com`)
- **WhatsApp para Alertas:** `5519982513836`
- **Principais Fontes de Receita Recorrente Mensal:**
  - **Salário - Elo:** R$ 19.500,00
  - **Ajuda de custo igreja - Gidheon:** R$ 3.150,00
  - **Mentoria - Gidheon:** R$ 700,00
  - **Total de Receitas Recorrentes:** R$ 23.350,00 / mês
- **Despesas Recorrentes:** 19 despesas cadastradas (incluindo Dízimo 10%, Aluguel, Condomínio, Escola Nicolas, Carro, Seguro, Impostos, etc.).
- **Transações Importadas:** 142 transações com categorização, valores, datas e status de validação.

---

## 3. Estrutura dos Dados

### Transações (`Transaction`)
```typescript
interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number; // Positivo para receitas (+), Negativo para despesas (-)
  date: string;
  time: string;
  icon?: string;
  colorClass?: string;
  isRecurring?: boolean;
  isRejected?: boolean;
  notes?: string;
}
```

### Despesas Recorrentes (`RecurringExpense`)
```typescript
interface RecurringExpense {
  id: string;
  title: string;
  category: string;
  amount: number; // Valor da despesa
  dueDate: number; // Dia do vencimento (1 a 31)
  paidThisMonth: boolean; // Flag indicando se já foi pago no mês atual
}
```

### Configuração de Alertas WhatsApp (`WhatsAppConfig`)
```typescript
interface WhatsAppConfig {
  phoneNumber: string; // Formato internacional (ex: 5519982513836)
  enabled: boolean;
  daysAhead: number; // Quantos dias antes do vencimento disparar o alerta
}
```

---

## 4. Instruções para IAs (Cursor, Copilot, Claude, GPT, etc.)

1. **Adicionar ou Modificar Transações:**
   - Ao adicionar novas transações em `database-export.json` ou `src/data.ts`, certifique-se de que despesas tenham valor negativo (`-`) e receitas tenham valor positivo (`+`).
2. **Cálculo de Saldo:**
   - O saldo líquido (`liquidBalance`) é a soma de todas as transações válidas (`!isRejected`).
3. **Persistência:**
   - Na versão online, a sincronização é feita com o Google Cloud Firestore através de `src/lib/firebase.ts` (coleção `appData`, documento `main_profile`).
   - Na versão local/offline, o app lê os dados de `src/data.ts` e armazena em `localStorage` sob a chave `wealth_app_data_v2`.
