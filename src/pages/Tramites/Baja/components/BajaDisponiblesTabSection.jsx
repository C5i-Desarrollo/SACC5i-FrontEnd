import BajaDisponiblesSection from './BajaDisponiblesSection';
import '../styles/BajaDisponiblesTabSection.css';

export default function BajaDisponiblesTabSection({ baja }) {
  return (
    <div className="baja-tab-disponibles">
      <BajaDisponiblesSection
        metricDisponibles={baja.metricDisponibles}
        metricBajas={baja.metricBajas}
        busquedaDisponiblesInput={baja.busquedaDisponiblesInput}
        onBusquedaDisponiblesChange={baja.setBusquedaDisponiblesInput}
        mostrarFiltrosDisponibles={baja.mostrarFiltrosDisponibles}
        onToggleFiltros={() => baja.setMostrarFiltrosDisponibles((prev) => !prev)}
        filtroMunicipioDisponible={baja.filtroMunicipioDisponible}
        onFiltroMunicipioChange={baja.setFiltroMunicipioDisponible}
        municipiosDisponibles={baja.municipiosDisponibles}
        filtroCuipDisponible={baja.filtroCuipDisponible}
        onFiltroCuipChange={baja.setFiltroCuipDisponible}
        onLimpiarFiltros={() => {
          baja.setFiltroMunicipioDisponible('');
          baja.setFiltroCuipDisponible('');
        }}
        loadingDisponibles={baja.loadingDisponibles}
        disponiblesFiltrados={baja.disponiblesFiltrados}
        registroSeleccionado={baja.registroSeleccionado}
        onSeleccionarRegistro={baja.setRegistroSeleccionado}
        formatDate={baja.formatDate}
        paginacionDisponibles={baja.paginacionDisponibles}
        onPaginaAnterior={() => baja.setPaginaDisponibles((p) => Math.max(1, p - 1))}
        onPaginaSiguiente={() => baja.setPaginaDisponibles((p) => p + 1)}
      />
    </div>
  );
}
