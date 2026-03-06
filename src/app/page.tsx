export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-[var(--primary)]">Aura</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="#products"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Products
            </a>
            <a
              href="#how-it-works"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#dealers"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Dealers
            </a>
            <button className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors">
              Build Your Box
            </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-24 text-center">
          <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-widest mb-4">
            Premium Shelf-Stable Food
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Energy, Anywhere.
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto mb-10">
            Gourmet, chef-curated meals that live in your pantry, boat galley,
            or bunker for years — but taste like they were cooked today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="bg-[var(--primary)] text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-[var(--primary-dark)] transition-colors">
              Build Your Box
            </button>
            <button className="border border-[var(--border)] px-8 py-3 rounded-lg font-medium text-lg hover:bg-[var(--surface)] transition-colors">
              Learn More
            </button>
          </div>
        </section>

        {/* Box Sizes */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-4">
            Choose Your Box
          </h2>
          <p className="text-[var(--muted)] text-center mb-12 max-w-lg mx-auto">
            Pick a size, fill it with exactly the meals you want. No random
            assortments.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                slots: 8,
                desc: "Perfect for trying Aura",
                price: "$49",
              },
              {
                name: "Voyager",
                slots: 12,
                desc: "Our most popular box",
                price: "$69",
                featured: true,
              },
              {
                name: "Bunker",
                slots: 24,
                desc: "Full preparedness kit",
                price: "$119",
              },
            ].map((box) => (
              <div
                key={box.name}
                className={`rounded-xl border p-8 text-center ${
                  box.featured
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)]"
                }`}
              >
                {box.featured && (
                  <span className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold mt-2">{box.name}</h3>
                <p className="text-4xl font-bold my-4">
                  {box.price}
                  <span className="text-sm text-[var(--muted)] font-normal">
                    /month
                  </span>
                </p>
                <p className="text-[var(--muted)] mb-6">{box.desc}</p>
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: box.slots }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border border-[var(--border)] bg-[var(--surface)]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--muted)] mb-4">
                  {box.slots} meals per box
                </p>
                <button
                  className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                    box.featured
                      ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                      : "border border-[var(--border)] hover:bg-[var(--surface)]"
                  }`}
                >
                  Select {box.name}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Build-a-Box",
                desc: "Pick exactly the meals you want. No surprises, no filler.",
              },
              {
                title: "Ask Aura",
                desc: "Voice & chat AI assistant. Reorder, track, and customize hands-free.",
              },
              {
                title: "Virtual Distributor",
                desc: "B2B partners earn commissions via QR codes. No inventory risk.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border border-[var(--border)] rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--muted)] text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-[var(--muted)]">
          <p>&copy; 2025 Aura. Energy, Anywhere.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--foreground)]">
              Terms
            </a>
            <a href="#" className="hover:text-[var(--foreground)]">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
