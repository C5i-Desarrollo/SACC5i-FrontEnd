import '../styles/Paginacion.css';
/**
 * Paginación reutilizable para tablas
 */
export default function Paginacion({ paginacion, onCambiarPagina }) {
  const { pagina, total_paginas, total } = paginacion;

  if (total_paginas <= 1) return null;

  // Generar rango de páginas visibles
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (total_paginas <= maxVisible + 2) {
      for (let i = 1; i <= total_paginas; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    let start = Math.max(2, pagina - 1);
    let end = Math.min(total_paginas - 1, pagina + 1);

    if (pagina <= 3) { start = 2; end = maxVisible - 1; }
    if (pagina >= total_paginas - 2) { start = total_paginas - (maxVisible - 2); end = total_paginas - 1; }

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total_paginas - 1) pages.push('...');

    pages.push(total_paginas);
    return pages;
  };

  return (
    <div className="rechazados-paginacion">
      <button
        className="rechazados-paginacion-nav"
        onClick={() => onCambiarPagina(pagina - 1)}
        disabled={pagina <= 1}
      >
        ← Anterior
      </button>

      {getPageNumbers().map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="rechazados-paginacion-dots">...</span>
        ) : (
          <button
            key={p}
            className={pagina === p ? 'active' : ''}
            onClick={() => onCambiarPagina(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className="rechazados-paginacion-nav"
        onClick={() => onCambiarPagina(pagina + 1)}
        disabled={pagina >= total_paginas}
      >
        Siguiente →
      </button>
    </div>
  );
}
