import { useEffect } from 'react';
import useCcp from '../../hooks/ccp/useCcp';
import FormularioCCP from './Components/FormularioCCP';
import TablaCCP from './Components/TablaCCP';
import './styles/CopiasConocimiento.css';

export default function CopiasConocimiento({ setPageTitle }) {
  const ccp = useCcp();

  useEffect(() => {
    setPageTitle?.({
      titulo: 'Copias de Conocimiento',
      icon: <i className="bx bx-file nav-icon-highlight" />
    });

    return () => setPageTitle?.(null);
  }, [setPageTitle]);

  return (
    <div className="ccp-page">
      {ccp.error && (
        <div className="ccp-error-banner">
          <i className="bx bx-error-circle"></i><span>{ccp.error}</span>
        </div>
      )}

      <div className="ccp-view" key={ccp.vista}>
        {ccp.vista === 'formulario' ? (
          <FormularioCCP
            form={ccp.form}
            setFormField={ccp.setFormField}
            modoEdicion={ccp.modoEdicion}
            setModoEdicion={ccp.setModoEdicion}
            guardando={ccp.guardando}
            guardar={ccp.guardar}
            onCancelar={() => ccp.setVista('tabla')}
            editandoId={ccp.editandoId}
          />
        ) : (
          <>
            <div className="ccp-listado-topbar">
              <div className="ccp-search-alta ccp-search-alta-externa">
                <i className="bx bx-search"></i>
                <input
                  type="text"
                  placeholder="Buscar por oficio, área o funcionario"
                  value={ccp.busqueda}
                  onChange={(e) => {
                    ccp.setBusqueda(e.target.value);
                    ccp.setPagina(1);
                  }}
                />
                {ccp.busqueda && (
                  <button className="ccp-search-alta-clear" onClick={() => { ccp.setBusqueda(''); ccp.setPagina(1); }}>
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>

              <button className="ccp-btn-nuevo" onClick={ccp.abrirNuevo}>
                <i className="bx bx-plus"></i>
                <span>Nueva Solicitud</span>
              </button>
            </div>

            <TablaCCP
              registros={ccp.registros}
              loading={ccp.loading}
              busqueda={ccp.busqueda}
              pagina={ccp.pagina}
              setPagina={ccp.setPagina}
              paginacion={ccp.paginacion}
              pageSize={ccp.pageSize}
              seleccionados={ccp.seleccionados}
              toggleSeleccionado={ccp.toggleSeleccionado}
              onEliminarSeleccionados={ccp.eliminarSeleccionados}
              onEliminarTodos={ccp.eliminarTodos}
              onEditar={ccp.abrirEdicion}
              onEliminar={ccp.eliminar}
              onDescargarExcel={ccp.descargarExcel}
              onDescargarZip={ccp.descargarZip}
              onDescargarTabla={ccp.descargarTablaExcel}
            />
          </>
        )}
      </div>
    </div>
  );
}
