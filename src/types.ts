export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number; // negative for outflow, positive for inflow
  time: string;
  date: string;
  icon: string;
  colorClass: string;
  hasAttachment?: boolean;
  hasNote?: boolean;
  installment?: string;
  isRejected?: boolean;
  isRecurring?: boolean;
  importBatchId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface AssetAllocation {
  name: string;
  percentage: number;
  colorClass: string;
  amount: string;
}

export interface InvestmentItem {
  id: string;
  name: string;
  category: string;
  value: string;
  yield: string;
  icon: string;
  trendUp: boolean;
  colorClass: string;
}

export interface BankConnection {
  id: string;
  name: string;
  logo: string;
  lastSynced: string;
  status: "active" | "error" | "syncing";
  items: {
    name: string;
    status: "active" | "coming_soon";
  }[];
}

export interface FinancialGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  percentage: number;
  colorClass: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueDate: number; // Day of the month
  paidThisMonth: boolean;
}

export interface WhatsAppConfig {
  phoneNumber: string;
  enabled: boolean;
  daysAhead: number; // 1 day before
  provider?: "manual" | "webhook" | "zapi" | "evolution" | "meta";
  webhookUrl?: string;
  zapiInstanceId?: string;
  zapiToken?: string;
  zapiClientToken?: string;
  evolutionEndpoint?: string;
  evolutionInstance?: string;
  evolutionApiKey?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  lastAutoCheckDate?: string;
  // Google notification channels (sent by the server-side daily cron job)
  emailEnabled?: boolean;
  notificationEmail?: string;
  calendarEnabled?: boolean;
}

