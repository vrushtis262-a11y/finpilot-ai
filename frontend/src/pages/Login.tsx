import { Link } from "react-router";

function Login() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                <Link to="/" className="text-2xl font-bold">
                    FinPilot <span className="text-cyan-400">AI</span>
                </Link>

                <h1 className="mt-8 text-3xl font-bold">Welcome back</h1>

                <p className="mt-2 text-slate-400">
                    Sign in to continue to your financial dashboard.
                </p>

                <form className="mt-8 space-y-5">
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
                            placeholder="Enter your password"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                        Sign in
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