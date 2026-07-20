import {
    type ChangeEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Navigate, useNavigate } from "react-router";
import { API_BASE_URL } from "../constants/api";
import BudgetForm from "../components/BudgetForm";
import BudgetCard, {
    type BudgetSummary,
} from "../components/BudgetCard";
import CategoryExpensePieChart from "../components/CategoryExpensePieChart";
import MonthlyIncomeExpenseChart from "../components/MonthlyIncomeExpenseChart";
import TransactionList, {
    type TransactionSortBy,
    type TransactionSortOrder,
} from "../components/TransactionList";

type Transaction = {
    id: number;
    title: string;
    amount: number;
    category: string;
    transaction_type: "income" | "expense";
    transaction_date: string;
    user_id: number;
};

type AnalyticsSummary = {
    total_income: number;
    total_expense: number;
    balance: number;
    transaction_count: number;
};

type MonthlyAnalytics = {
    month: string;
    total_income: number;
    total_expense: number;
    balance: number;
};

type CategoryExpense = {
    category: string;
    total: number;
};

type CsvPreviewTransaction = {
    preview_id: number;
    row_number: number;
    title: string;
    amount: number;
    category: string;
    transaction_type: "income" | "expense";
    transaction_date: string;
    is_duplicate: boolean;
    duplicate_reason: string | null;
    selected: boolean;
};

type CsvInvalidRow = {
    row_number?: number;
    reason?: string;
    error?: string;
    [key: string]: unknown;
};

type CsvPreviewResponse = {
    filename: string;
    total_rows: number;
    valid_count: number;
    invalid_count: number;
    duplicate_count: number;
    importable_count: number;
    transactions: CsvPreviewTransaction[];
    invalid_rows: CsvInvalidRow[];
};

type CsvImportResponse = {
    message?: string;
    requested_count?: number;
    imported_count?: number;
    skipped_count?: number;
    detail?: string;
};

const emptySummary: AnalyticsSummary = {
    total_income: 0,
    total_expense: 0,
    balance: 0,
    transaction_count: 0,
};

function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

function getErrorMessage(
    data: unknown,
    fallback: string
): string {
    if (
        typeof data === "object" &&
        data !== null &&
        "detail" in data &&
        typeof data.detail === "string"
    ) {
        return data.detail;
    }

    if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
    ) {
        return data.message;
    }

    return fallback;
}

function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const currentMonth = getCurrentMonth();
    const csvFileInputRef = useRef<HTMLInputElement | null>(null);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] =
        useState<AnalyticsSummary>(emptySummary);
    const [monthlyAnalytics, setMonthlyAnalytics] = useState<
        MonthlyAnalytics[]
    >([]);
    const [categoryExpenses, setCategoryExpenses] = useState<
        CategoryExpense[]
    >([]);
    const [budget, setBudget] = useState<BudgetSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBudgetLoading, setIsBudgetLoading] = useState(true);
    const [error, setError] = useState("");
    const [budgetError, setBudgetError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
    const [transactionSortBy, setTransactionSortBy] =
        useState<TransactionSortBy>("transaction_date");
    const [transactionSortOrder, setTransactionSortOrder] =
        useState<TransactionSortOrder>("desc");

    const [isCsvPreviewOpen, setIsCsvPreviewOpen] = useState(false);
    const [isCsvPreviewLoading, setIsCsvPreviewLoading] =
        useState(false);
    const [isCsvImporting, setIsCsvImporting] = useState(false);
    const [csvPreview, setCsvPreview] =
        useState<CsvPreviewResponse | null>(null);
    const [selectedCsvRows, setSelectedCsvRows] = useState<
        Set<number>
    >(new Set());
    const [csvError, setCsvError] = useState("");
    const [csvSuccessMessage, setCsvSuccessMessage] = useState("");

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("token");
        navigate("/login");
    }, [navigate]);

    const fetchDashboardData = useCallback(async () => {
        if (!token) {
            return;
        }

        try {
            setError("");
            setBudgetError("");
            setIsBudgetLoading(true);

            const [
                transactionsResponse,
                summaryResponse,
                monthlyResponse,
                categoryExpensesResponse,
                budgetResponse,
            ] = await Promise.all([
                fetch(
                    `${API_BASE_URL}/transactions?sort_by=${transactionSortBy}&order=${transactionSortOrder}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
                fetch(`${API_BASE_URL}/analytics/summary`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${API_BASE_URL}/analytics/monthly`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(
                    `${API_BASE_URL}/analytics/category-expenses`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
                fetch(
                    `${API_BASE_URL}/budgets/summary/${currentMonth}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
            ]);

            if (
                transactionsResponse.status === 401 ||
                summaryResponse.status === 401 ||
                monthlyResponse.status === 401 ||
                categoryExpensesResponse.status === 401 ||
                budgetResponse.status === 401
            ) {
                handleUnauthorized();
                return;
            }

            const transactionsData =
                await transactionsResponse.json();
            const summaryData = await summaryResponse.json();
            const monthlyData = await monthlyResponse.json();
            const categoryExpensesData =
                await categoryExpensesResponse.json();

            if (!transactionsResponse.ok) {
                throw new Error(
                    getErrorMessage(
                        transactionsData,
                        "Could not load transactions."
                    )
                );
            }

            if (!summaryResponse.ok) {
                throw new Error(
                    getErrorMessage(
                        summaryData,
                        "Could not load financial summary."
                    )
                );
            }

            if (!monthlyResponse.ok) {
                throw new Error(
                    getErrorMessage(
                        monthlyData,
                        "Could not load monthly analytics."
                    )
                );
            }

            if (!categoryExpensesResponse.ok) {
                throw new Error(
                    getErrorMessage(
                        categoryExpensesData,
                        "Could not load category analytics."
                    )
                );
            }

            setTransactions(transactionsData);
            setSummary(summaryData);
            setMonthlyAnalytics(monthlyData);
            setCategoryExpenses(categoryExpensesData);

            if (budgetResponse.status === 404) {
                setBudget(null);
            } else {
                const budgetData = await budgetResponse.json();

                if (!budgetResponse.ok) {
                    setBudget(null);
                    setBudgetError(
                        getErrorMessage(
                            budgetData,
                            "Could not load the monthly budget."
                        )
                    );
                } else {
                    setBudget(budgetData);
                }
            }
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load dashboard data."
            );
        } finally {
            setIsLoading(false);
            setIsBudgetLoading(false);
        }
    }, [
        currentMonth,
        handleUnauthorized,
        token,
        transactionSortBy,
        transactionSortOrder,
    ]);

    useEffect(() => {
        if (!token) {
            return;
        }

        fetchDashboardData();
    }, [fetchDashboardData, token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const totalIncome = summary.total_income;
    const totalExpenses = summary.total_expense;
    const totalBalance = summary.balance;
    const totalSavings = totalBalance;

    const incomeTransactionCount = transactions.filter(
        (transaction) => transaction.transaction_type === "income"
    ).length;

    const expenseTransactionCount = transactions.filter(
        (transaction) => transaction.transaction_type === "expense"
    ).length;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);

    const handleDelete = async (transaction: Transaction) => {
        const shouldDelete = window.confirm(
            `Delete "${transaction.title}"? This action cannot be undone.`
        );

        if (!shouldDelete) {
            return;
        }

        try {
            setDeletingId(transaction.id);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/transactions/${transaction.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                let message = "Could not delete transaction.";

                try {
                    const data = await response.json();
                    message = getErrorMessage(data, message);
                } catch {
                    console.error(
                        "Could not read delete error response."
                    );
                }

                throw new Error(message);
            }

            await fetchDashboardData();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Could not delete transaction."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleTransactionSortChange = (
        sortBy: TransactionSortBy,
        sortOrder: TransactionSortOrder
    ) => {
        setTransactionSortBy(sortBy);
        setTransactionSortOrder(sortOrder);
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const resetCsvImport = () => {
        setCsvPreview(null);
        setSelectedCsvRows(new Set());
        setCsvError("");
        setIsCsvPreviewLoading(false);
        setIsCsvImporting(false);

        if (csvFileInputRef.current) {
            csvFileInputRef.current.value = "";
        }
    };

    const closeCsvPreview = () => {
        if (isCsvPreviewLoading || isCsvImporting) {
            return;
        }

        setIsCsvPreviewOpen(false);
        resetCsvImport();
    };

    const openCsvFilePicker = () => {
        setCsvError("");
        setCsvSuccessMessage("");
        csvFileInputRef.current?.click();
    };

    const handleCsvFileChange = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvError("Please select a CSV file.");
            event.target.value = "";
            return;
        }

        try {
            setCsvPreview(null);
            setSelectedCsvRows(new Set());
            setCsvError("");
            setIsCsvPreviewOpen(true);
            setIsCsvPreviewLoading(true);

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
                `${API_BASE_URL}/transactions/import/csv/preview`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = (await response.json()) as
                | CsvPreviewResponse
                | { detail?: string };

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "Could not preview the CSV file."
                    )
                );
            }

            const previewData = data as CsvPreviewResponse;
            const initiallySelected = new Set(
                previewData.transactions
                    .filter(
                        (transaction) =>
                            !transaction.is_duplicate &&
                            transaction.selected
                    )
                    .map((transaction) => transaction.preview_id)
            );

            setCsvPreview(previewData);
            setSelectedCsvRows(initiallySelected);
        } catch (err) {
            console.error(err);

            setCsvError(
                err instanceof Error
                    ? err.message
                    : "Could not preview the CSV file."
            );
        } finally {
            setIsCsvPreviewLoading(false);
        }
    };

    const handleCsvRowToggle = (
        transaction: CsvPreviewTransaction
    ) => {
        if (transaction.is_duplicate || isCsvImporting) {
            return;
        }

        setSelectedCsvRows((currentRows) => {
            const updatedRows = new Set(currentRows);

            if (updatedRows.has(transaction.preview_id)) {
                updatedRows.delete(transaction.preview_id);
            } else {
                updatedRows.add(transaction.preview_id);
            }

            return updatedRows;
        });
    };

    const importableCsvRows =
        csvPreview?.transactions.filter(
            (transaction) => !transaction.is_duplicate
        ) ?? [];

    const allImportableRowsSelected =
        importableCsvRows.length > 0 &&
        importableCsvRows.every((transaction) =>
            selectedCsvRows.has(transaction.preview_id)
        );

    const handleSelectAllCsvRows = () => {
        if (isCsvImporting) {
            return;
        }

        if (allImportableRowsSelected) {
            setSelectedCsvRows(new Set());
            return;
        }

        setSelectedCsvRows(
            new Set(
                importableCsvRows.map(
                    (transaction) => transaction.preview_id
                )
            )
        );
    };

    const handleCsvImport = async () => {
        if (!csvPreview || selectedCsvRows.size === 0) {
            setCsvError(
                "Select at least one transaction to import."
            );
            return;
        }

        const selectedTransactions = csvPreview.transactions
            .filter((transaction) =>
                selectedCsvRows.has(transaction.preview_id)
            )
            .map((transaction) => ({
                title: transaction.title,
                amount: transaction.amount,
                category: transaction.category,
                transaction_type: transaction.transaction_type,
                transaction_date: transaction.transaction_date,
            }));

        try {
            setCsvError("");
            setIsCsvImporting(true);

            const response = await fetch(
                `${API_BASE_URL}/transactions/import/csv`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        transactions: selectedTransactions,
                    }),
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data =
                (await response.json()) as CsvImportResponse;

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "Could not import transactions."
                    )
                );
            }

            const importedCount =
                typeof data.imported_count === "number"
                    ? data.imported_count
                    : selectedTransactions.length;

            const skippedCount =
                typeof data.skipped_count === "number"
                    ? data.skipped_count
                    : 0;

            setCsvSuccessMessage(
                skippedCount > 0
                    ? `${importedCount} transaction(s) imported. ${skippedCount} duplicate transaction(s) skipped.`
                    : `${importedCount} transaction(s) imported successfully.`
            );

            await fetchDashboardData();
            setIsCsvPreviewOpen(false);
            resetCsvImport();
        } catch (err) {
            console.error(err);

            setCsvError(
                err instanceof Error
                    ? err.message
                    : "Could not import transactions."
            );
        } finally {
            setIsCsvImporting(false);
        }
    };

    const getInvalidRowMessage = (row: CsvInvalidRow) => {
        if (typeof row.reason === "string") {
            return row.reason;
        }

        if (typeof row.error === "string") {
            return row.error;
        }

        return "This row could not be imported.";
    };

    const summaryCards = [
        {
            title: "Total balance",
            value: formatCurrency(totalBalance),
            change: "Income minus expenses",
        },
        {
            title: "Total income",
            value: formatCurrency(totalIncome),
            change: `${incomeTransactionCount} income transaction(s)`,
        },
        {
            title: "Total expenses",
            value: formatCurrency(totalExpenses),
            change: `${expenseTransactionCount} expense transaction(s)`,
        },
        {
            title: "Transactions",
            value: summary.transaction_count.toString(),
            change: "Total recorded transactions",
        },
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-slate-800 bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-2xl font-bold"
                    >
                        FinPilot{" "}
                        <span className="text-cyan-400">AI</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <span className="hidden text-sm text-slate-400 sm:block">
                            Welcome back
                        </span>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold transition hover:border-cyan-400 hover:text-cyan-400"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="font-semibold text-cyan-400">
                            Financial overview
                        </p>

                        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                            Your dashboard
                        </h1>

                        <p className="mt-3 text-slate-400">
                            Track your financial health and recent activity.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <input
                            ref={csvFileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleCsvFileChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={openCsvFilePicker}
                            disabled={
                                isCsvPreviewLoading || isCsvImporting
                            }
                            className="rounded-full border border-cyan-400 px-5 py-2.5 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Import CSV
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/add-transaction")
                            }
                            className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                            Add transaction
                        </button>
                    </div>
                </div>

                {csvSuccessMessage && (
                    <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
                        <p>{csvSuccessMessage}</p>

                        <button
                            type="button"
                            onClick={() =>
                                setCsvSuccessMessage("")
                            }
                            className="font-semibold text-emerald-100 hover:text-white"
                            aria-label="Dismiss import success message"
                        >
                            Close
                        </button>
                    </div>
                )}

                <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <article
                            key={card.title}
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                        >
                            <p className="text-sm text-slate-400">
                                {card.title}
                            </p>

                            <p className="mt-3 text-3xl font-bold">
                                {isLoading ? "..." : card.value}
                            </p>

                            <p className="mt-3 text-sm text-cyan-400">
                                {card.change}
                            </p>
                        </article>
                    ))}
                </div>

                <div className="mt-8">
                    <BudgetCard
                        budget={budget}
                        isLoading={isBudgetLoading}
                        error={budgetError}
                        onManageBudget={() =>
                            setIsBudgetFormOpen(true)
                        }
                    />
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    {isLoading ? (
                        <>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                                Loading monthly analytics...
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                                Loading category analytics...
                            </div>
                        </>
                    ) : (
                        <>
                            <MonthlyIncomeExpenseChart
                                data={monthlyAnalytics}
                            />

                            <CategoryExpensePieChart
                                data={categoryExpenses}
                            />
                        </>
                    )}
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <TransactionList
                        transactions={transactions}
                        isLoading={isLoading}
                        error={error}
                        deletingId={deletingId}
                        sortBy={transactionSortBy}
                        sortOrder={transactionSortOrder}
                        onSortChange={
                            handleTransactionSortChange
                        }
                        onDelete={handleDelete}
                    />

                    <aside className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                        <p className="text-sm font-semibold text-cyan-400">
                            Financial insight
                        </p>

                        <h2 className="mt-3 text-xl font-semibold">
                            {totalBalance >= 0
                                ? "You are currently saving money"
                                : "Your expenses are higher than your income"}
                        </h2>

                        <p className="mt-3 leading-7 text-slate-300">
                            {summary.transaction_count === 0
                                ? "Add transactions to receive personalized financial insights."
                                : totalBalance >= 0
                                    ? `Your current balance is ${formatCurrency(
                                        totalBalance
                                    )}. Your estimated savings rate is ${totalIncome > 0
                                        ? (
                                            (totalSavings /
                                                totalIncome) *
                                            100
                                        ).toFixed(1)
                                        : "0.0"
                                    }%.`
                                    : `You are spending ${formatCurrency(
                                        Math.abs(totalBalance)
                                    )} more than your recorded income.`}
                        </p>
                    </aside>
                </div>
            </section>

            <BudgetForm
                isOpen={isBudgetFormOpen}
                month={currentMonth}
                existingAmount={
                    budget ? budget.budget_amount : null
                }
                token={token}
                onClose={() => setIsBudgetFormOpen(false)}
                onSaved={fetchDashboardData}
                onUnauthorized={handleUnauthorized}
            />

            {isCsvPreviewOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="csv-preview-title"
                >
                    <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
                        <div className="flex items-start justify-between gap-6 border-b border-slate-800 px-6 py-5">
                            <div>
                                <p className="text-sm font-semibold text-cyan-400">
                                    Smart CSV import
                                </p>

                                <h2
                                    id="csv-preview-title"
                                    className="mt-1 text-2xl font-bold"
                                >
                                    Preview transactions
                                </h2>

                                {csvPreview && (
                                    <p className="mt-2 text-sm text-slate-400">
                                        {csvPreview.filename}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={closeCsvPreview}
                                disabled={
                                    isCsvPreviewLoading ||
                                    isCsvImporting
                                }
                                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Close
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {isCsvPreviewLoading ? (
                                <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50 text-slate-400">
                                    Reading and validating your CSV file...
                                </div>
                            ) : csvError && !csvPreview ? (
                                <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-200">
                                    <p className="font-semibold">
                                        CSV preview failed
                                    </p>
                                    <p className="mt-2 text-sm">
                                        {csvError}
                                    </p>
                                </div>
                            ) : csvPreview ? (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Total rows
                                            </p>
                                            <p className="mt-2 text-2xl font-bold">
                                                {csvPreview.total_rows}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Valid
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-emerald-300">
                                                {csvPreview.valid_count}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Importable
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-cyan-300">
                                                {
                                                    csvPreview.importable_count
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Duplicates
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-amber-300">
                                                {
                                                    csvPreview.duplicate_count
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Invalid
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-rose-300">
                                                {csvPreview.invalid_count}
                                            </p>
                                        </div>
                                    </div>

                                    {csvError && (
                                        <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
                                            {csvError}
                                        </div>
                                    )}

                                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
                                        <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-semibold">
                                                    Valid transactions
                                                </p>
                                                <p className="mt-1 text-sm text-slate-400">
                                                    Duplicate rows are disabled
                                                    automatically.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    handleSelectAllCsvRows
                                                }
                                                disabled={
                                                    importableCsvRows.length ===
                                                    0 ||
                                                    isCsvImporting
                                                }
                                                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {allImportableRowsSelected
                                                    ? "Deselect all"
                                                    : "Select all"}
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                                                <thead className="bg-slate-950/40 text-xs uppercase tracking-wide text-slate-500">
                                                    <tr>
                                                        <th className="px-4 py-3">
                                                            Import
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Row
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Title
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Category
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Type
                                                        </th>
                                                        <th className="px-4 py-3 text-right">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-slate-800">
                                                    {csvPreview.transactions.map(
                                                        (transaction) => {
                                                            const isSelected =
                                                                selectedCsvRows.has(
                                                                    transaction.preview_id
                                                                );

                                                            return (
                                                                <tr
                                                                    key={
                                                                        transaction.preview_id
                                                                    }
                                                                    className={
                                                                        transaction.is_duplicate
                                                                            ? "bg-amber-400/5 text-slate-500"
                                                                            : "bg-slate-900"
                                                                    }
                                                                >
                                                                    <td className="px-4 py-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                isSelected
                                                                            }
                                                                            disabled={
                                                                                transaction.is_duplicate ||
                                                                                isCsvImporting
                                                                            }
                                                                            onChange={() =>
                                                                                handleCsvRowToggle(
                                                                                    transaction
                                                                                )
                                                                            }
                                                                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400"
                                                                            aria-label={`Select row ${transaction.row_number}`}
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        {
                                                                            transaction.row_number
                                                                        }
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-4 py-3">
                                                                        {
                                                                            transaction.transaction_date
                                                                        }
                                                                    </td>
                                                                    <td className="min-w-48 px-4 py-3 font-medium text-slate-100">
                                                                        {
                                                                            transaction.title
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        {
                                                                            transaction.category
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 capitalize">
                                                                        {
                                                                            transaction.transaction_type
                                                                        }
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                                                                        {formatCurrency(
                                                                            transaction.amount
                                                                        )}
                                                                    </td>
                                                                    <td className="min-w-48 px-4 py-3">
                                                                        {transaction.is_duplicate ? (
                                                                            <span className="text-amber-300">
                                                                                {
                                                                                    transaction.duplicate_reason
                                                                                }
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-emerald-300">
                                                                                Ready
                                                                                to
                                                                                import
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {csvPreview.invalid_rows.length >
                                        0 && (
                                            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5">
                                                <h3 className="font-semibold text-rose-200">
                                                    Invalid rows
                                                </h3>

                                                <div className="mt-3 space-y-2 text-sm text-rose-100/80">
                                                    {csvPreview.invalid_rows.map(
                                                        (row, index) => (
                                                            <p
                                                                key={`${row.row_number ?? "unknown"}-${index}`}
                                                            >
                                                                Row{" "}
                                                                {row.row_number ??
                                                                    "unknown"}
                                                                :{" "}
                                                                {getInvalidRowMessage(
                                                                    row
                                                                )}
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-400">
                                {selectedCsvRows.size} transaction(s)
                                selected
                            </p>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={closeCsvPreview}
                                    disabled={
                                        isCsvPreviewLoading ||
                                        isCsvImporting
                                    }
                                    className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCsvImport}
                                    disabled={
                                        !csvPreview ||
                                        selectedCsvRows.size === 0 ||
                                        isCsvPreviewLoading ||
                                        isCsvImporting
                                    }
                                    className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isCsvImporting
                                        ? "Importing..."
                                        : `Import ${selectedCsvRows.size} transaction(s)`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Dashboard;