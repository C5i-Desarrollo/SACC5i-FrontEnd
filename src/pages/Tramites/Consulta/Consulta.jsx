import { useEffect } from 'react';
import { MdManageSearch } from 'react-icons/md';
import { useConsultaFinalizados } from '../../../hooks/consulta/useConsultaFinalizados';
import { ConsultaMunicipiosSection, ConsultaPersonasSection } from './components';
import './styles/index.css';

export default function Consulta({ setPageTitle }) {
  const consulta = useConsultaFinalizados();

  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: 'Consulta de Finalizados',
        subtitulo: 'Consulta por municipio y exportacion de personas finalizadas',
        icon: <MdManageSearch className="nav-icon-highlight" />
      });
    }

    return () => {
      if (setPageTitle) setPageTitle(null);
    };
  }, [setPageTitle]);

  return (
    <div className="consulta-container">
      <ConsultaMunicipiosSection
        busquedaMunicipiosInput={consulta.busquedaMunicipiosInput}
        onBusquedaChange={consulta.setBusquedaMunicipiosInput}
        loadingMunicipios={consulta.loadingMunicipios}
        municipios={consulta.municipios}
        municipioActivo={consulta.municipioActivo}
        paginacionMunicipios={consulta.paginacionMunicipios}
        onPaginaAnterior={() => consulta.setPaginaMunicipios((p) => Math.max(1, p - 1))}
        onPaginaSiguiente={() => consulta.setPaginaMunicipios((p) => p + 1)}
        onVerMunicipio={consulta.abrirDetalleMunicipio}
      />

      <ConsultaPersonasSection
        municipioActivo={consulta.municipioActivo}
        busquedaPersonasInput={consulta.busquedaPersonasInput}
        onBusquedaPersonasChange={consulta.setBusquedaPersonasInput}
        loadingPersonas={consulta.loadingPersonas}
        personas={consulta.personas}
        selectedRows={consulta.selectedRows}
        allCurrentPageSelected={consulta.allCurrentPageSelected}
        onToggleSelectAll={consulta.seleccionarTodoPagina}
        onToggleSelectRow={consulta.togglePersonaSelection}
        onAgregarPersona={consulta.agregarPersonaLocal}
        onEditarPersona={consulta.editarPersonaLocal}
        onEliminarPersona={consulta.eliminarPersonaLocal}
        onLimpiarRegistrosRecientes={consulta.limpiarRegistrosRecientes}
        onExportarCompleto={() => consulta.exportarExcel(false)}
        onExportarSeleccion={() => consulta.exportarExcel(true)}
        exportingExcel={consulta.exportingExcel}
        puedeExportarCompleto={consulta.puedeExportarCompleto}
        puedeExportarSeleccion={consulta.puedeExportarSeleccion}
        tieneRegistrosRecientes={consulta.tieneRegistrosRecientes}
        paginacionPersonas={consulta.paginacionPersonas}
        onPaginaAnterior={() => consulta.setPaginaPersonas((p) => Math.max(1, p - 1))}
        onPaginaSiguiente={() => consulta.setPaginaPersonas((p) => p + 1)}
      />
    </div>
  );
}