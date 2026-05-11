import BajaRegistradasSection from './BajaRegistradasSection';
import '../styles/BajaManualRegistradasTabSection.css';

export default function BajaManualRegistradasTabSection({ baja, isDireccion = false }) {
  if (isDireccion) {
    return (
      <div className="baja-tab-manuales">
        <BajaRegistradasSection
          titulo="Bajas registradas manualmente"
          descripcion="Consulta en solo lectura de registros capturados manualmente para control y exportacion."
          allowEdicion={false}
          mostrarBuscador={true}
          mostrarAccionesToolbar={false}
          mostrarColumnaSeleccion={false}
          mostrarColumnaAcciones={false}
          mostrarPaginacion={false}
          placeholderBusqueda="Buscar en registros manuales por persona, apellidos, CUIP, municipio, tipo o motivo"
          textoCargando="Cargando registros manuales..."
          textoVacio="Aun no hay registros manuales capturados."
          busquedaBajasInput={baja.busquedaBajasLocalesInput}
          onBusquedaBajasChange={baja.setBusquedaBajasLocalesInput}
          loadingBajas={false}
          bajasTabla={baja.bajasTablaEditable}
          catalogoBajas={baja.catalogoBajas}
          onAgregarBajaLocal={baja.agregarBajaLocal}
          onEditarBajaLocal={baja.editarBajaLocal}
          onEliminarBajaLocal={baja.eliminarBajaLocal}
          onLimpiarBajasLocales={baja.limpiarBajasLocales}
          onExportarBajasExcel={baja.exportarBajasExcel}
          exportingBajasExcel={baja.exportingBajasExcel}
          puedeExportarBajasCompleto={false}
          puedeExportarBajasSeleccion={false}
          selectedRowsBajas={[]}
          allBajasCurrentSelected={false}
          onToggleSelectBaja={() => {}}
          onToggleSelectAllBajas={() => {}}
          formatDate={baja.formatDate}
          paginacionBajas={{ pagina: 1, totalPaginas: 1 }}
          onPaginaAnterior={() => {}}
          onPaginaSiguiente={() => {}}
          mostrarContadorBajasManuales={true}
          totalBajasManuales={baja.bajasLocales?.length || 0}
        />
      </div>
    );
  }

  return (
    <div className="baja-tab-manuales">
      <BajaRegistradasSection
        titulo="Bajas registradas manualmente"
        descripcion="Registros capturados manualmente para control y exportacion; permanecen visibles hasta su eliminacion."
        allowEdicion={true}
        mostrarBuscador={true}
        mostrarAccionesToolbar={true}
        mostrarColumnaSeleccion={true}
        mostrarColumnaAcciones={true}
        mostrarPaginacion={false}
        placeholderBusqueda="Buscar en bajas por persona, apellidos, CUIP, municipio, tipo o motivo"
        textoCargando="Cargando tabla reciente..."
        textoVacio="Aun no hay bajas recientes en esta tabla."
        busquedaBajasInput={baja.busquedaBajasLocalesInput}
        onBusquedaBajasChange={baja.setBusquedaBajasLocalesInput}
        loadingBajas={false}
        bajasTabla={baja.bajasTablaEditable}
        catalogoBajas={baja.catalogoBajas}
        onAgregarBajaLocal={baja.agregarBajaLocal}
        onEditarBajaLocal={baja.editarBajaLocal}
        onEliminarBajaLocal={baja.eliminarBajaLocal}
        onLimpiarBajasLocales={baja.limpiarBajasLocales}
        onExportarBajasExcel={baja.exportarBajasExcel}
        exportingBajasExcel={baja.exportingBajasExcel}
        puedeExportarBajasCompleto={baja.puedeExportarBajasCompleto}
        puedeExportarBajasSeleccion={baja.puedeExportarBajasSeleccion}
        selectedRowsBajas={baja.selectedRowsBajas}
        allBajasCurrentSelected={baja.allBajasCurrentSelected}
        onToggleSelectBaja={baja.toggleSelectBaja}
        onToggleSelectAllBajas={baja.seleccionarTodoBajas}
        formatDate={baja.formatDate}
        paginacionBajas={{ pagina: 1, totalPaginas: 1 }}
        onPaginaAnterior={() => {}}
        onPaginaSiguiente={() => {}}
        mostrarContadorBajasManuales={true}
        totalBajasManuales={baja.bajasLocales?.length || 0}
      />
    </div>
  );
}
