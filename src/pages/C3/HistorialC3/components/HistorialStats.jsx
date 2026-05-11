import '../styles/HistorialStats.css';
/**
 * Tarjetas de estadísticas del historial C3
 */
export default function HistorialStats({ stats }) {
  const cards = [
    {
      label: 'Total Procesados',
      value: stats.total,
      icon: 'bx-folder-open',
      cls: 'hist-card-total'
    },
    {
      label: 'Aprobados',
      value: stats.aprobados,
      icon: 'bx-check-circle',
      cls: 'hist-card-ok'
    },
    {
      label: 'Rechazados',
      value: stats.rechazados,
      icon: 'bx-x-circle',
      cls: 'hist-card-rej'
    }
  ];

  return (
    <div className="hist-stats-panel">
      {cards.map(card => (
        <div key={card.label} className={`hist-stat-card ${card.cls}`}>
          <i className={`bx ${card.icon}`}></i>
          <div>
            <span className="hist-stat-value">{card.value}</span>
            <span className="hist-stat-label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
