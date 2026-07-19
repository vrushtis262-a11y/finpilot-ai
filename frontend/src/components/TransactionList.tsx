import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

type Transaction = {
    id: number;
    title: string;
    amount: number;
    category: string;
    transaction_type: "income" | "expense";
    transaction_date: string;
    user_id: number;
};

type TransactionTypeFilter = "all" | "income" | "expense";
type TransactionSortBy = "transaction_date" | "amount" | "title";
type TransactionSortOrder = "asc" | "desc";

type TransactionListProps = {
    transactions: Transaction[];
    isLoading: boolean;
    error: string;
    deletingId: number | null;
    sortBy: TransactionSortBy;
    sortOrder: TransactionSortOrder;
    onSortChange: (
        sortBy: TransactionSortBy,
        sortOrder: TransactionSortOrder
    ) => void;
    onDelete: (transaction: Transaction) => Promise<void>;
};

const TRANSACTIONS_PER_PAGE = 5;

function TransactionList({
    transactions,
    isLoading,
    error,
    deletingId,
    sortBy,
    sortOrder,
    onSortChange,
    onDelete,
}: TransactionListProps) {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] =
        useState<TransactionTypeFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");

    const categories = useMemo(() => {
        return Array.from(
            new Set(
                transactions
                    .map((transaction) => transaction.category.trim())
                    .filter(Boolean)
            )
        ).sort((first, second) => first.localeCompare(second));
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return transactions.filter((transaction) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                transaction.title
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                transaction.category
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesType =
                typeFilter === "all" ||
                transaction.transaction_type === typeFilter;

            const matchesCategory =
                categoryFilter === "all" ||
                transaction.category === categoryFilter;

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory
            );
        });
    }, [
        transactions,
        searchTerm,
        typeFilter,
        categoryFilter,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredTransactions.length / TRANSACTIONS_PER_PAGE
        )
    );

    const paginatedTransactions = useMemo(() => {
        const startIndex =
            (currentPage - 1) * TRANSACTIONS_PER_PAGE;
        const endIndex = startIndex + TRANSACTIONS_PER_PAGE;

        return filteredTransactions.slice(startIndex, endIndex);
    }, [currentPage, filteredTransactions]);

    const firstVisibleTransaction =
        filteredTransactions.length === 0
            ? 0
            : (currentPage - 1) * TRANSACTIONS_PER_PAGE + 1;

    const lastVisibleTransaction = Math.min(
        currentPage * TRANSACTIONS_PER_PAGE,
        filteredTransactions.length
    );

    const filtersAreActive =
        searchTerm.trim().length > 0 ||
        typeFilter !== "all" ||
        categoryFilter !== "all";

    useEffect(() => {
        setCurrentPage(1);
    }, [
        searchTerm,
        typeFilter,
        categoryFilter,
        sortBy,
        sortOrder,
    ]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
        }).format(new Date(`${date}T00:00:00Z`));

    const handleResetFilters = () => {
        setSearchTerm("");
        setTypeFilter("all");
        setCategoryFilter("all");
        setCurrentPage(1);
    };

    const handlePreviousPage = () => {
        setCurrentPage((page) => Math.max(1, page - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((page) =>
            Math.min(totalPages, page + 1)
        );
    };

    const handleExportCsv = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setIsExporting(true);
            setExportError("");

            const response = await fetch(
                "http://127.0.0.1:8000/transactions/export/csv",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            if (!response.ok) {
                let message = "Could not export transactions.";

                try {
                    const data = await response.json();

                    if (typeof data.detail === "string") {
                        message = data.detail;
                    }
                } catch {
                    console.error(
                        "Could not read export error response."
                    );
                }

                throw new Error(message);
            }

            const csvBlob = await response.blob();
            const downloadUrl = URL.createObjectURL(csvBlob);
            const downloadLink = document.createElement("a");

            downloadLink.href = downloadUrl;
            downloadLink.download = "finpilot-transactions.csv";

            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error(err);

            setExportError(
                err instanceof Error
                    ? err.message
                    : "Could not export transactions."
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold">
                        Recent transactions
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Search, filter, sort, export, and browse
                        your income and expenses.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={
                            isExporting ||
                            isLoading ||
                            transactions.length === 0
                        }
                        className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isExporting
                            ? "Exporting..."
                            : "Export CSV"}
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/add-transaction")
                        }
                        className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                    >
                        Add transaction
                    </button>
                </div>
            </div>

            {exportError && (
                <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                    {exportError}
                </p>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="md:col-span-2">
                    <label
                        htmlFor="transaction-search"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Search
                    </label>

                    <input
                        id="transaction-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                        placeholder="Search title or category"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

                <div>
                    <label
                        htmlFor="type-filter"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Type
                    </label>

                    <select
                        id="type-filter"
                        value={typeFilter}
                        onChange={(event) =>
                            setTypeFilter(
                                event.target
                                    .value as TransactionTypeFilter
                            )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none transition focus:border-cyan-400"
                    >
                        <option value="all">All types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="category-filter"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Category
                    </label>

                    <select
                        id="category-filter"
                        value={categoryFilter}
                        onChange={(event) =>
                            setCategoryFilter(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none transition focus:border-cyan-400"
                    >
                        <option value="all">
                            All categories
                        </option>

                        {categories.map((category) => (
                            <option
                                key={category}
                                value={category}
                            >
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="sort-by"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Sort by
                    </label>

                    <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(event) =>
                            onSortChange(
                                event.target.value as TransactionSortBy,
                                sortOrder
                            )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none transition focus:border-cyan-400"
                    >
                        <option value="transaction_date">
                            Date
                        </option>
                        <option value="amount">Amount</option>
                        <option value="title">Title</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="sort-order"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Order
                    </label>

                    <select
                        id="sort-order"
                        value={sortOrder}
                        onChange={(event) =>
                            onSortChange(
                                sortBy,
                                event.target.value as TransactionSortOrder
                            )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none transition focus:border-cyan-400"
                    >
                        <option value="desc">
                            Descending
                        </option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                    Showing {filteredTransactions.length} of{" "}
                    {transactions.length} transaction(s)
                </p>

                {filtersAreActive && (
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="self-start rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 sm:self-auto"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            <div className="mt-6">
                {isLoading && (
                    <p className="text-slate-400">
                        Loading dashboard...
                    </p>
                )}

                {!isLoading && error && (
                    <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                        {error}
                    </p>
                )}

                {!isLoading &&
                    transactions.length === 0 &&
                    !error && (
                        <div className="rounded-xl bg-slate-950 p-6 text-center">
                            <p className="font-medium">
                                No transactions yet
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Add your first income or expense to
                                get started.
                            </p>
                        </div>
                    )}

                {!isLoading &&
                    transactions.length > 0 &&
                    filteredTransactions.length === 0 &&
                    !error && (
                        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center">
                            <p className="font-medium">
                                No matching transactions
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Try changing your search or filter
                                options.
                            </p>

                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="mt-4 rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10"
                            >
                                Reset filters
                            </button>
                        </div>
                    )}

                {!isLoading &&
                    paginatedTransactions.length > 0 && (
                        <>
                            <div className="space-y-4">
                                {paginatedTransactions.map(
                                    (transaction) => {
                                        const isIncome =
                                            transaction.transaction_type ===
                                            "income";

                                        const isDeleting =
                                            deletingId ===
                                            transaction.id;

                                        return (
                                            <div
                                                key={transaction.id}
                                                className="rounded-xl bg-slate-950 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium">
                                                            {
                                                                transaction.title
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {
                                                                transaction.category
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-600">
                                                            {formatDate(
                                                                transaction.transaction_date
                                                            )}
                                                        </p>
                                                    </div>

                                                    <p
                                                        className={`font-semibold ${isIncome
                                                            ? "text-emerald-400"
                                                            : "text-rose-400"
                                                            }`}
                                                    >
                                                        {isIncome
                                                            ? "+"
                                                            : "-"}
                                                        {formatCurrency(
                                                            transaction.amount
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="mt-4 flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/edit-transaction/${transaction.id}`
                                                            )
                                                        }
                                                        className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onDelete(
                                                                transaction
                                                            )
                                                        }
                                                        disabled={
                                                            isDeleting
                                                        }
                                                        className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isDeleting
                                                            ? "Deleting..."
                                                            : "Delete"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-400">
                                    Showing{" "}
                                    {firstVisibleTransaction}–
                                    {lastVisibleTransaction} of{" "}
                                    {filteredTransactions.length}
                                </p>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={
                                            handlePreviousPage
                                        }
                                        disabled={
                                            currentPage === 1
                                        }
                                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-slate-400">
                                        Page {currentPage} of{" "}
                                        {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={handleNextPage}
                                        disabled={
                                            currentPage ===
                                            totalPages
                                        }
                                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
            </div>
        </section>
    );
}

export type { TransactionSortBy, TransactionSortOrder };
export default TransactionList;