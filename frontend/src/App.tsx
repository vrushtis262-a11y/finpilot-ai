const features = [
  {
    title: "Smart expense tracking",
    description:
      "Organize your spending automatically and understand exactly where your money goes.",
    icon: "↗",
  },
  {
    title: "AI-powered insights",
    description:
      "Receive personalized recommendations based on your income, spending, and financial goals.",
    icon: "✦",
  },
  {
    title: "Simple budgeting",
    description:
      "Create practical monthly budgets and monitor your progress without complicated spreadsheets.",
    icon: "◎",
  },
];

function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="#" className="text-2xl font-bold tracking-tight">
          FinPilot <span className="text-cyan-400">AI</span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a className="transition hover:text-white" href="#features">
            Features
          </a>
          <a className="transition hover:text-white" href="#about">
            About
          </a>
          <a className="transition hover:text-white" href="#contact">
            Contact
          </a>
        </div>

        <button className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold transition hover:border-cyan-400 hover:text-cyan-400">
          Sign in
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-2 lg:px-8 lg:pt-24">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
            Your intelligent financial copilot
          </p>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Take control of your money with{" "}
            <span className="text-cyan-400">AI-powered guidance.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            FinPilot AI helps you track expenses, build smarter budgets, and
            make confident financial decisions from one simple dashboard.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
              Get started free
            </button>

            <button className="rounded-full border border-slate-700 px-7 py-3 font-semibold transition hover:border-slate-500 hover:bg-slate-900">
              Explore features
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
            <span>✓ Free to get started</span>
            <span>✓ Secure financial data</span>
            <span>✓ Personalized insights</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-3 shadow-2xl shadow-cyan-950/40">
            <img
              src="/src/assets/hero.png"
              alt="FinPilot AI financial dashboard preview"
              className="w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-y border-slate-800 bg-slate-900/60"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-semibold text-cyan-400">Built for clarity</p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to improve your financial habits
            </h2>

            <p className="mt-4 text-slate-400">
              Powerful tools presented in a simple experience, so you can focus
              on making better decisions instead of managing complicated data.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-7 transition hover:-translate-y-1 hover:border-cyan-400/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-400">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 px-7 py-14 text-center sm:px-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Make your next financial decision with confidence.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Start tracking your financial activity and let FinPilot AI turn
            everyday data into useful, understandable guidance.
          </p>

          <button className="mt-8 rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Create your account
          </button>
        </div>
      </section>

      <footer
        id="contact"
        className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500"
      >
        © 2026 FinPilot AI. Built to make personal finance simpler.
      </footer>
    </main>
  );
}

export default App;