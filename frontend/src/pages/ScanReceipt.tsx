import {
    type ChangeEvent,
    type FormEvent,
    useRef,
    useState,
} from "react";
import {
    Navigate,
    useNavigate,
} from "react-router";

import { API_BASE_URL } from "../constants/api";
import { TRANSACTION_CATEGORIES } from "../constants/categories";

type TransactionType = "income" | "expense";

type ReceiptResult = {
    title: string;
    amount: number;
    category: string;
    transaction_type: TransactionType;
    transaction_date: string;
    confidence: number;
    field_confidence: {
        title: number;
        amount: number;
        category: number;
        transaction_date: number;
    };
    raw_text: string;
};

function ScanReceipt() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const token = localStorage.getItem("token");

    const today = new Date().toISOString().split("T")[0];

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);
    const [type, setType] =
        useState<TransactionType>("expense");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [transactionDate, setTransactionDate] =
        useState(today);
    const [confidence, setConfidence] =
        useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] =
        useState(false);
    const [scanComplete, setScanComplete] =
        useState(false);
    const [error, setError] = useState("");

    const availableCategories: readonly string[] =
        TRANSACTION_CATEGORIES[type];

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);
        setScanComplete(false);
        setConfidence(null);
        setError("");
    };

    const handleTypeChange = (
        newType: TransactionType
    ) => {
        setType(newType);

        const categories: readonly string[] =
            TRANSACTION_CATEGORIES[newType];

        const categoryIsValid = categories.some(
            (item) => item === category
        );

        if (!categoryIsValid) {
            setCategory("");
        }
    };

    const scanReceipt = async () => {
        if (!selectedFile) {
            setError("Please select a receipt image.");
            return;
        }

        setIsScanning(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch(
                `${API_BASE_URL}/receipts/scan`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data: unknown = await response.json();

            if (!response.ok) {
                let message = "Receipt scan failed.";

                if (
                    typeof data === "object" &&
                    data !== null &&
                    "detail" in data &&
                    typeof data.detail === "string"
                ) {
                    message = data.detail;
                }

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                }

                throw new Error(message);
            }

            if (
                typeof data !== "object" ||
                data === null ||
                !("receipt" in data)
            ) {
                throw new Error(
                    "The receipt scanner returned an invalid response."
                );
            }

            const receipt = data.receipt as ReceiptResult;

            const scannedType: TransactionType =
                receipt.transaction_type === "income"
                    ? "income"
                    : "expense";

            const scannedCategories: readonly string[] =
                TRANSACTION_CATEGORIES[scannedType];

            const scannedCategoryIsValid =
                scannedCategories.some(
                    (item) => item === receipt.category
                );

            setType(scannedType);
            setTitle(receipt.title ?? "");
            setAmount(
                Number.isFinite(receipt.amount)
                    ? String(receipt.amount)
                    : ""
            );
            setCategory(
                scannedCategoryIsValid
                    ? receipt.category
                    : ""
            );
            setTransactionDate(
                receipt.transaction_date || today
            );
            setConfidence(receipt.confidence);
            setScanComplete(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Receipt scan failed."
            );
        } finally {
            setIsScanning(false);
        }
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const cleanTitle = title.trim();
        const numericAmount = Number(amount);

        if (!cleanTitle) {
            setError("Please enter a title.");
            return;
        }

        if (!category) {
            setError("Please choose a category.");
            return;
        }

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            setError("Amount must be greater than 0.");
            return;
        }

        if (!transactionDate) {
            setError(
                "Please choose a transaction date."
            );
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/transactions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: cleanTitle,
                        amount: numericAmount,
                        category,
                        transaction_type: type,
                        transaction_date: transactionDate,
                    }),
                }
            );

            const data: unknown = await response.json();

            if (!response.ok) {
                let message =
                    "Could not save transaction.";

                if (
                    typeof data === "object" &&
                    data !== null &&
                    "detail" in data &&
                    typeof data.detail === "string"
                ) {
                    message = data.detail;
                }

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                }

                throw new Error(message);
            }

            window.alert(
                "Transaction saved successfully!"
            );
            navigate("/dashboard");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Cannot connect to backend."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
            <div className="mx-auto max-w-3xl">
                <button
                    type="button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                    ← Back to dashboard
                </button>

                <div className="mt-6">
                    <h1 className="text-4xl font-bold">
                        Scan Receipt
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Upload a receipt image, review the
                        extracted details, and save the
                        transaction.
                    </p>
                </div>

                <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={openFilePicker}
                            disabled={
                                isScanning || isSubmitting
                            }
                            className="rounded-full border border-cyan-400 px-6 py-3 font-semibold text-cyan-400 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Choose receipt image
                        </button>

                        <span className="min-w-0 flex-1 truncate text-slate-300">
                            {selectedFile
                                ? selectedFile.name
                                : "No file selected"}
                        </span>

                        <button
                            type="button"
                            onClick={scanReceipt}
                            disabled={
                                isScanning ||
                                isSubmitting ||
                                !selectedFile
                            }
                            className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isScanning
                                ? "Scanning..."
                                : "Scan Receipt"}
                        </button>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="mt-5 text-red-400"
                        >
                            {error}
                        </p>
                    )}
                </div>

                {scanComplete && (
                    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Review transaction
                                </h2>

                                <p className="mt-2 text-slate-400">
                                    Check the extracted details
                                    before saving.
                                </p>
                            </div>

                            {confidence !== null && (
                                <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                                    Confidence:{" "}
                                    {Math.round(
                                        confidence * 100
                                    )}
                                    %
                                </div>
                            )}
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 space-y-5"
                        >
                            <div>
                                <label
                                    htmlFor="receipt-type"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Transaction type
                                </label>

                                <select
                                    id="receipt-type"
                                    value={type}
                                    onChange={(event) =>
                                        handleTypeChange(
                                            event.target
                                                .value as TransactionType
                                        )
                                    }
                                    disabled={isSubmitting}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                                >
                                    <option value="income">
                                        Income
                                    </option>

                                    <option value="expense">
                                        Expense
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="receipt-title"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Merchant or title
                                </label>

                                <input
                                    id="receipt-title"
                                    type="text"
                                    maxLength={100}
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(
                                            event.target.value
                                        )
                                    }
                                    disabled={isSubmitting}
                                    required
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="receipt-amount"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Amount
                                </label>

                                <input
                                    id="receipt-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={(event) =>
                                        setAmount(
                                            event.target.value
                                        )
                                    }
                                    disabled={isSubmitting}
                                    required
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="receipt-category"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Category
                                </label>

                                <select
                                    id="receipt-category"
                                    value={category}
                                    onChange={(event) =>
                                        setCategory(
                                            event.target.value
                                        )
                                    }
                                    disabled={isSubmitting}
                                    required
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                                >
                                    <option value="">
                                        Choose a category
                                    </option>

                                    {availableCategories.map(
                                        (item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="receipt-date"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Transaction date
                                </label>

                                <input
                                    id="receipt-date"
                                    type="date"
                                    value={transactionDate}
                                    onChange={(event) =>
                                        setTransactionDate(
                                            event.target.value
                                        )
                                    }
                                    disabled={isSubmitting}
                                    required
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? "Saving..."
                                    : "Save transaction"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </main>
    );
}

export default ScanReceipt;