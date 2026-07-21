import { ChangeEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { API_BASE_URL } from "../constants/api";

type ReceiptResult = {
    title: string;
    amount: number;
    category: string;
    transaction_type: "income" | "expense";
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

export default function ScanReceipt() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [receipt, setReceipt] =
        useState<ReceiptResult | null>(null);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);
        setReceipt(null);
        setError("");
    };

    const scanReceipt = async () => {
        if (!selectedFile) {
            setError("Please select a receipt image.");
            return;
        }

        try {
            setLoading(true);
            setError("");

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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ?? "Receipt scan failed."
                );
            }

            setReceipt(data.receipt);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Receipt scan failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-4xl px-6 py-10">

                <button
                    onClick={() => navigate("/dashboard")}
                    className="mb-8 rounded-full border border-slate-700 px-5 py-2 hover:border-cyan-400"
                >
                    ← Back
                </button>

                <h1 className="text-4xl font-bold">
                    Scan Receipt
                </h1>

                <p className="mt-2 text-slate-400">
                    Upload a receipt image and let FinPilot AI
                    extract the transaction automatically.
                </p>

                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    <button
                        onClick={scanReceipt}
                        disabled={loading}
                        className="mt-6 rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                    >
                        {loading
                            ? "Scanning..."
                            : "Scan Receipt"}
                    </button>

                    {error && (
                        <p className="mt-6 text-red-400">
                            {error}
                        </p>
                    )}
                </div>

                {receipt && (
                    <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">

                        <h2 className="text-2xl font-bold">
                            Extracted Information
                        </h2>

                        <div className="mt-6 space-y-4">

                            <p>
                                <strong>Merchant:</strong>{" "}
                                {receipt.title}
                            </p>

                            <p>
                                <strong>Amount:</strong>{" "}
                                ${receipt.amount.toFixed(2)}
                            </p>

                            <p>
                                <strong>Category:</strong>{" "}
                                {receipt.category}
                            </p>

                            <p>
                                <strong>Type:</strong>{" "}
                                {receipt.transaction_type}
                            </p>

                            <p>
                                <strong>Date:</strong>{" "}
                                {receipt.transaction_date}
                            </p>

                            <p>
                                <strong>Confidence:</strong>{" "}
                                {(receipt.confidence * 100).toFixed(0)}
                                %
                            </p>

                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}