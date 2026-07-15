import { Link } from "react-router";

const summaryCards = [
    {
        title: "Total balance",
        value: "$12,450.00",
        change: "+8.2% this month",
    },
    {
        title: "Monthly income",
        value: "$5,200.00",
        change: "+4.1% this month",
    },
    {
        title: "Monthly expenses",
        value: "$3,180.00",
        change: "-2.3% this month",
    },
    {
        title: "Monthly savings",
        value: "$2,020.00",
        change: "38.8% savings rate",
    },
];

function Dashboard() {
    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-slate-800 bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
                    <Link to="/" className="text-2xl font-bold">
                        FinPilot <span className="text-cyan-400">AI</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <span className="hidden text-sm text-slate-400 sm:block">
                            Welcome, Vrushti
                        </span>

                        <Link
                            to="/"
                            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold transition hover:border-cyan-400 hover:text-cyan-400"
                        >
                            Sign out
                        </Link>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                <p className="font-semibold text-cyan-400">Financial overview</p>

                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                    Your dashboard
                </h1>

                <p className="mt-3 text-slate-400">
                    Track your financial health and recent activity.
                </p>

                <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <article
                            key={card.title}
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                        >
                            <p className="text-sm text-slate-400">{card.title}</p>
                            <p className="mt-3 text-3xl font-bold">{card.value}</p>
                            <p className="mt-3 text-sm text-cyan-400">{card.change}</p>
                        </article>
                    ))}
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Recent transactions</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Your latest income and expenses
                                </p>
                            </div>

                            <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                                Add transaction
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">
                                <div>
                                    <p className="font-medium">Salary</p>
                                    <p className="mt-1 text-sm text-slate-500">Income</p>
                                </div>
                                <p className="font-semibold text-emerald-400">+$5,200.00</p>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">
                                <div>
                                    <p className="font-medium">Rent</p>
                                    <p className="mt-1 text-sm text-slate-500">Housing</p>
                                </div>
                                <p className="font-semibold text-rose-400">-$1,450.00</p>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">
                                <div>
                                    <p className="font-medium">Groceries</p>
                                    <p className="mt-1 text-sm text-slate-500">Food</p>
                                </div>
                                <p className="font-semibold text-rose-400">-$186.40</p>
                            </div>
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                        <p className="text-sm font-semibold text-cyan-400">AI insight</p>

                        <h2 className="mt-3 text-xl font-semibold">
                            You are spending less this month
                        </h2>

                        <p className="mt-3 leading-7 text-slate-300">
                            Your expenses are approximately 2.3% lower than last month.
                            Keeping this pace could increase your monthly savings.
                        </p>
                    </aside>
                </div>
            </section>
        </main>
    );
}

export default Dashboard;