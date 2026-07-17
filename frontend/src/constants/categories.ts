export const INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Gift",
    "Refund",
    "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
    "Food",
    "Housing",
    "Transportation",
    "Utilities",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Education",
    "Travel",
    "Insurance",
    "Debt",
    "Savings",
    "Other Expense",
] as const;

export const TRANSACTION_CATEGORIES = {
    income: INCOME_CATEGORIES,
    expense: EXPENSE_CATEGORIES,
} as const; 