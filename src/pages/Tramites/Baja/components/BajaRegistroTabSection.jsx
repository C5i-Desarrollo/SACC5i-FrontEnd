import BajaRegistroSection from './BajaRegistroSection';
import '../styles/BajaRegistroTabSection.css';

export default function BajaRegistroTabSection({ baja }) {
  return (
    <div className="baja-tab-registro">
      <BajaRegistroSection
        registroSeleccionado={baja.registroSeleccionado}
        tipoBoxRef={baja.tipoBoxRef}
        tipoQuery={baja.tipoQuery}
        onTipoQueryChange={baja.actualizarTipoQuery}
        onOpenTipos={() => baja.setOpenTipos(true)}
        openTipos={baja.openTipos}
        tiposFiltrados={baja.tiposFiltrados}
        onSeleccionarTipo={baja.seleccionarTipo}
        tipoSeleccionado={baja.tipoSeleccionado}
        motivoBoxRef={baja.motivoBoxRef}
        motivoQuery={baja.motivoQuery}
        onMotivoQueryChange={baja.actualizarMotivoQuery}
        onOpenMotivos={() => baja.setOpenMotivos(true)}
        openMotivos={baja.openMotivos}
        motivosFiltrados={baja.motivosFiltrados}
        onSeleccionarMotivo={baja.seleccionarMotivo}
        motivoSeleccionado={baja.motivoSeleccionado}
        tipoSinMotivos={baja.tipoSinMotivos}
        numeroOficioMunicipio={baja.numeroOficioMunicipio}
        onNumeroOficioMunicipioChange={baja.setNumeroOficioMunicipio}
        fechaBaja={baja.fechaBaja}
        onFechaBajaChange={baja.setFechaBaja}
        observaciones={baja.observaciones}
        onObservacionesChange={baja.setObservaciones}
        onRegistrarBaja={baja.abrirConfirmacionRegistro}
        savingBaja={baja.savingBaja}
      />
    </div>
  );
}
