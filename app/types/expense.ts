import type { Currency } from './session';

export const EXPENSE_CATEGORIES = [
  'travel',
  'accommodation',
  'food',
  'transport',
  'fees',
  'entertainment',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  travel: 'Travel',
  accommodation: 'Accommodation',
  food: 'Food & Drink',
  transport: 'Local Transport',
  fees: 'Fees & Visas',
  entertainment: 'Entertainment',
  other: 'Other',
};

export interface Expense {
  id: string;
  userId?: string; // present on Supabase rows, unused in demo mode
  /**
   * Optional: an expense with no tripId is a standalone expense.
   * The v1 UI always sets it — the field is nullable so a future /expenses
   * page needs no migration.
   */
  tripId?: string;
  /**
   * ISO YYYY-MM-DD. MUST be named `date`: SupabaseAdapter orders every table by it.
   */
  date: string;
  category: ExpenseCategory;
  description?: string; // "Hotel Arts - 4 nights"
  /** ALWAYS USD. Forms convert at submit via currencyStore.toUSD(). */
  amount: number;
  /** Currency the user actually typed the amount in. */
  originalCurrency: Currency;
  /** Amount in originalCurrency, kept so the UI can show "€1,120". */
  originalAmount: number;
  /** USD rate at time of recording (1 originalCurrency = X USD). */
  exchangeRate: number;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type NewExpense = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export interface ExpenseCategoryTotal {
  category: ExpenseCategory;
  label: string; // denormalized for charts
  amount: number; // USD
}

export interface ExpenseStats {
  totalExpenses: number; // USD
  expenseCount: number;
  avgExpense: number;
  biggestExpense: number;
  byCategory: ExpenseCategoryTotal[]; // sorted desc
}
