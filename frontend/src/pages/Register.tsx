import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { API_BASE_URL } from "../constants/api";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const registerResponse = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: name,
                    email,
                    password,
                }),
            });

            const registerData = await registerResponse.json();

            if (!registerResponse.ok) {
                const message =
                    typeof registerData.detail === "string"
                        ? registerData.detail
                        : "Registration failed. Check your information.";

                alert(message);
                return;
            }

            const loginResponse = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
                localStorage.setItem("token", loginData.access_token);
                alert("Registration successful!");
                navigate("/dashboard");
            } else {
                alert("Account created. Please log in.");
                navigate("/login");
            }
        } catch (error) {
            console.error(error);
            alert("Cannot connect to backend.");
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                <Link to="/" className="text-2xl font-bold">
                    FinPilot <span className="text-cyan-400">AI</span>
                </Link>

                <h1 className="mt-8 text-3xl font-bold">Create your account</h1>

                <p className="mt-2 text-slate-400">
                    Start building healthier financial habits today.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Full name
                        </label>

                        <input
                            id="name"
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Email address
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
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
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                        Create account
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default Register;