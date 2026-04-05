export default function Dashboard() {
  return (
    <div className="min-h-screen bg-odb-dark">
      {/* Header */}
      <header className="border-b border-odb-border bg-odb-darker px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-odb-red flex items-center justify-center">
              <span className="text-white font-bold text-sm">OB</span>
            </div>
            <h1 className="text-lg font-semibold text-odb-text">
              Oficina da Borracha
            </h1>
          </div>
          <span className="text-sm text-odb-text-muted">Sistema v1.0</span>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <h2 className="text-2xl font-semibold text-odb-text mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Ordens de Serviço', value: '0', color: 'bg-odb-red' },
            { label: 'Clientes', value: '0', color: 'bg-odb-info' },
            { label: 'Receita Mensal', value: 'R$ 0,00', color: 'bg-odb-success' },
            { label: 'Pendentes', value: '0', color: 'bg-odb-warning' },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg bg-odb-card border border-odb-border p-5 hover:bg-odb-card-hover transition-colors"
            >
              <div className={`h-1 w-12 rounded-full ${card.color} mb-4`} />
              <p className="text-sm text-odb-text-muted">{card.label}</p>
              <p className="text-2xl font-bold text-odb-text mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
