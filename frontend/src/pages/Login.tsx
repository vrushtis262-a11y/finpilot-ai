import {
    type FormEvent,
    useState,
} from "react";
import {
    Link,
    useNavigate,
} from "react-router";

import { API_BASE_URL } from "../constants/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] =
        useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            setError(
                "Please enter your email and password."
            );
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        password,
                    }),
                }
            );

            const data: unknown =
                await response.json();

            if (!response.ok) {
                let message =
                    "Incorrect email or password.";

                if (
                    typeof data === "object" &&
                    data !== null &&
                    "detail" in data &&
                    typeof data.detail === "string"
                ) {
                    message = data.detail;
                }

                throw new Error(message);
            }

            if (
                typeof data !== "object" ||
                data === null ||
                !("access_token" in data) ||
                typeof data.access_token !== "string"
            ) {
                throw new Error(
                    "The server returned an invalid login response."
                );
            }

            localStorage.setItem(
                "token",
                data.access_token
            );

            navigate("/dashboard", {
                replace: true,
            });
        } catch (err) {
            console.error(
                "Login request failed:",
                err
            );

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
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                <Link
                    to="/"
                    className="text-2xl font-bold"
                >
                    FinPilot{" "}
                    <span className="text-cyan-400">
                        AI
                    </span>
                </Link>

                <h1 className="mt-8 text-3xl font-bold">
                    Welcome back
                </h1>

                <p className="mt-2 text-slate-400">
                    Sign in to continue to your financial
                    dashboard.
                </p>

                {error && (
                    <div
                        role="alert"
                        className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                    >
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                >
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Email address
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => {
                                setEmail(
                                    event.target.value
                                );
                                setError("");
                            }}
                            autoComplete="email"
                            autoCapitalize="none"
                            spellCheck={false}
                            disabled={isSubmitting}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => {
                                setPassword(
                                    event.target.value
                                );
                                setError("");
                            }}
                            autoComplete="current-password"
                            disabled={isSubmitting}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 disabled:opacity-60"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting
                            ? "Signing in..."
                            : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Don&apos;t have an account?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default Login;