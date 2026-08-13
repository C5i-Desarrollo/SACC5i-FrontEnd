import BajaRegistradasSection from './BajaRegistradasSection';
import '../styles/BajaElementosDadosTabSection.css';

export default function BajaElementosDadosTabSection({ baja }) {
  return (
    <div className="baja-tab-dados">
      <BajaRegistradasSection
        titulo="Elementos dados de baja"
        descripcion="Los elementos registrados aqui ya no aparecen en la tabla de finalizados disponibles."
        allowEdicion={false}
        mostrarBuscador={true}
        mostrarAccionesToolbar={true}
        mostrarColumnaSeleccion={false}
        mostrarColumnaAcciones={false}
        mostrarPaginacion={true}
        placeholderBusqueda="Buscar en elementos dados de baja por persona, CUIP, municipio, numero de oficio, tipo o motivo"
        textoCargando="Cargando elementos dados de baja..."
        textoVacio="Aun no hay bajas registradas."
        busquedaBajasInput={baja.busquedaBajasInput}
        onBusquedaBajasChange={baja.setBusquedaBajasInput}
        loadingBajas={baja.loadingBajas}
        bajasTabla={baja.bajasTablaSoloLectura}
        catalogoBajas={baja.catalogoBajas}
        onAgregarBajaLocal={baja.agregarBajaLocal}
        onEditarBajaLocal={baja.editarBajaLocal}
        onEliminarBajaLocal={baja.eliminarBajaLocal}
        onLimpiarBajasLocales={baja.limpiarBajasLocales}
        onExportarBajasExcel={baja.exportarBajasSistemaExcel}
        exportingBajasExcel={baja.exportingBajasExcel}
        puedeExportarBajasCompleto={Number(baja.paginacionBajas?.total ?? baja.bajasTablaSoloLectura?.length ?? 0) > 0}
        puedeExportarBajasSeleccion={false}
        selectedRowsBajas={[]}
        allBajasCurrentSelected={false}
        onToggleSelectBaja={() => { }}
        onToggleSelectAllBajas={() => { }}
        formatDate={baja.formatDate}
        paginacionBajas={baja.paginacionBajas}
        onPaginaAnterior={() => baja.setPaginaBajas((p) => Math.max(1, p - 1))}
        onPaginaSiguiente={() => baja.setPaginaBajas((p) => p + 1)}
        mostrarContadorBajasRegistradas={true}
      />
    </div>
  );
}
