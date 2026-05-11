import '../styles/RevisionDocumentos.css';

const NO_APLICA_CARTILLA_TEXT = 'No aplica';

const isCartillaMilitar = (documento) => documento?.clave === 'cartilla_militar';

const isNoAplicaDocumento = (documento) => {
  const observacion = String(documento?.observacion || '').trim().toLowerCase();
  return Boolean(documento?.no_aplica) || (isCartillaMilitar(documento) && observacion.startsWith('no aplica'));
};

/**
 * RevisionDocumentos - Lista de documentos obligatorios
 * Permite validar individualmente, rechazar, o validar todos
 */
export default function RevisionDocumentos({
  documentos,
  onValidar,
  onValidarTodos,
  progreso,
  docsValidados,
  docsTotal,
  disabled
}) {
  return (
    <div className="rev-documentos">
      {/* Header */}
      <div className="rev-documentos-header">
        <div className="rev-documentos-titulo">
          <i className='bx bx-file'></i>
          <h3>Lista de Documentos</h3>
        </div>
        <button
          className="rev-btn-validar-todo"
          onClick={onValidarTodos}
          disabled={disabled}
          title="Validar todos los documentos"
        >
          ✓ ✓ Validar todo
        </button>
      </div>

      {/* Lista */}
      <div className="rev-documentos-lista">
        {documentos.map((doc, idx) => {
          const docNoAplica = isNoAplicaDocumento(doc);
          const docValidado = Boolean(doc.validado) && !docNoAplica;

          return (
            <div
              key={doc.clave}
              className={`rev-doc-item ${docValidado ? 'validado' : ''} ${doc.rechazado ? 'rechazado' : ''} ${docNoAplica ? 'no-aplica' : ''}`}
            >
              <span className="rev-doc-numero">{idx + 1}.</span>
              <span className="rev-doc-nombre">{doc.nombre}</span>
              {docNoAplica && <span className="rev-doc-tag-no-aplica">No aplica</span>}

              <div className="rev-doc-acciones">
                {/* Botón validar */}
                <button
                  className={`rev-doc-btn-validar ${docValidado ? 'activo' : ''}`}
                  onClick={() => onValidar(doc.clave, true)}
                  disabled={disabled}
                  title="Validar documento"
                >
                  <i className='bx bx-check'></i>
                </button>

                {/* Botón rechazar documento */}
                <button
                  className={`rev-doc-btn-ver ${doc.rechazado ? 'rechazado' : ''}`}
                  onClick={() => onValidar(doc.clave, false, `No cumplio con ${doc.nombre}`)}
                  disabled={disabled}
                  title="Marcar como incumplido"
                >
                  <i className='bx bx-x'></i>
                </button>

                {isCartillaMilitar(doc) && (
                  <button
                    className={`rev-doc-btn-na ${docNoAplica ? 'activo' : ''}`}
                    onClick={() => onValidar(doc.clave, true, docNoAplica ? null : NO_APLICA_CARTILLA_TEXT)}
                    disabled={disabled}
                    title={docNoAplica ? 'Quitar no aplica' : 'Marcar cartilla como no aplica'}
                  >
                    <i className='bx bx-minus'></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de progreso */}
      <div className="rev-progreso">
        <div className="rev-progreso-barra">
          <div
            className="rev-progreso-fill"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <span className="rev-progreso-text">{progreso}%</span>
      </div>
    </div>
  );
}
