import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import {
  getCcpListApi,
  getCcpByIdApi,
  getCcpSiguienteNumeroApi,
  crearCcpApi,
  actualizarCcpApi,
  eliminarCcpApi,
  descargarExcelCcpApi,
  descargarZipCcpApi,
  descargarTablaExcelCcpApi,
  eliminarCcpMasivoApi,
  eliminarTodosCcpApi
} from '../../services/api';
import { DESTINATARIO_DEFAULT } from '../../pages/CCP/Components/ccpHelpers';

const parseReferenciaVolante = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  return String(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
};

const toUpperTrim = (value) => String(value ?? '').trim().toUpperCase();
const toUpper = (value) => String(value ?? '').toUpperCase();

const normalizarDestinatario = (datos = {}) => ({
  area: toUpperTrim(datos.area) || DESTINATARIO_DEFAULT.area,
  funcionario: toUpperTrim(datos.funcionario) || DESTINATARIO_DEFAULT.funcionario,
  cargo: toUpperTrim(datos.cargo) || DESTINATARIO_DEFAULT.cargo
});

const CCP_TABLE_PAGE_SIZE = 20;

/**
 * Hook principal para el módulo Copias de Conocimiento
 */
const useCcp = () => {
  const { showNotification } = useNotification();
  const anioActual = new Date().getFullYear();
  const hoy = new Date().toISOString().slice(0, 10);

  // ── Estado: tabla ──────────────────────────────────────────────
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1 });

  // ── Estado: selección para ZIP ─────────────────────────────────
  const [seleccionados, setSeleccionados] = useState([]);

  // ── Estado: vista activa ───────────────────────────────────────
  // 'tabla' | 'formulario'
  const [vista, setVista] = useState('tabla');
  const [registroEditando, setRegistroEditando] = useState(null);

  // ── Estado: formulario ─────────────────────────────────────────
  const [form, setForm] = useState({
    numero_oficio_seq: '',
    anio: anioActual,
    fecha: hoy,
    ...normalizarDestinatario(),
    oficio_referencia: '',
    fecha_referencia: hoy,
    tipo_solicitud: '',
    referencia_volante: 'N/A',
    folio_numero: '',
    volante_numero: '',
    // Textos estáticos del formato (editables solo con botón "Editar campos")
    texto_prefijo: 'SSP/SII/C5I/DT/',
    texto_asunto1: 'C.C.P. EN ATENCIÓN AL OFICIO',
    texto_asunto2: 'DE FECHA',
    texto_asunto3: 'EN EL CUAL SOLICITA',
    texto_asunto4: 'EN RNPSP.'
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // ── Cargar tabla ───────────────────────────────────────────────
  const cargarRegistros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getCcpListApi({ busqueda, pagina, limit: CCP_TABLE_PAGE_SIZE });
      setRegistros(data.data || []);
      setPaginacion({ total: data.total, totalPaginas: data.totalPaginas });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [busqueda, pagina]);

  useEffect(() => { cargarRegistros(); }, [cargarRegistros]);

  // ── Cargar siguiente número al abrir el formulario ─────────────
  const cargarSiguienteNumero = useCallback(async (anio = anioActual) => {
    try {
      const { data } = await getCcpSiguienteNumeroApi(anio);
      setForm(f => ({ ...f, numero_oficio_seq: data.siguiente, anio: data.anio }));
    } catch (_) { /* silencioso */ }
  }, [anioActual]);

  // ── Abrir formulario nuevo ─────────────────────────────────────
  const abrirNuevo = useCallback(async () => {
    const anio = new Date().getFullYear();
    const hoyFecha = new Date().toISOString().slice(0, 10);
    setForm({
      numero_oficio_seq: '',
      anio,
      fecha: hoyFecha,
      ...normalizarDestinatario(),
      oficio_referencia: '',
      fecha_referencia: hoyFecha,
      tipo_solicitud: '',
      referencia_volante: 'N/A',
      folio_numero: '',
      volante_numero: '',
      texto_prefijo: 'SSP/SII/C5I/DT/',
      texto_asunto1: 'C.C.P. EN ATENCIÓN AL OFICIO',
      texto_asunto2: 'DE FECHA',
      texto_asunto3: 'EN EL CUAL SOLICITA',
      texto_asunto4: 'EN RNPSP.'
    });
    setModoEdicion(false);
    setRegistroEditando(null);
    setVista('formulario');
    await cargarSiguienteNumero(anio);
  }, [cargarSiguienteNumero]);

  // ── Abrir formulario edición ───────────────────────────────────
  const abrirEdicion = useCallback(async (id) => {
    try {
      const { data } = await getCcpByIdApi(id);
      const r = data.data;
      setForm({
        numero_oficio_seq: r.numero_oficio_seq,
        anio: r.anio,
        fecha: r.fecha,
        ...normalizarDestinatario({
          area: r.area,
          funcionario: r.funcionario,
          cargo: r.cargo
        }),
        oficio_referencia: r.oficio_referencia,
        fecha_referencia: r.fecha_referencia,
        tipo_solicitud: toUpper(r.tipo_solicitud || ''),
        referencia_volante: r.referencia_volante || 'N/A',
        folio_numero: r.folio_numero || '',
        volante_numero: r.volante_numero || '',
        texto_prefijo: 'SSP/SII/C5I/DT/',
        texto_asunto1: 'C.C.P. EN ATENCIÓN AL OFICIO',
        texto_asunto2: 'DE FECHA',
        texto_asunto3: 'EN EL CUAL SOLICITA',
        texto_asunto4: 'EN RNPSP.'
      });
      setRegistroEditando(id);
      setModoEdicion(false);
      setVista('formulario');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // ── Guardar (crear o actualizar) ───────────────────────────────
  const guardar = useCallback(async () => {
    // Validación de campos requeridos
    const requeridos = [
      { campo: 'numero_oficio_seq', label: 'Número de oficio' },
      { campo: 'fecha',             label: 'Fecha' },
      { campo: 'area',              label: 'Área / Dirección' },
      { campo: 'funcionario',       label: 'Funcionario' },
      { campo: 'oficio_referencia', label: 'No. oficio de referencia' },
      { campo: 'fecha_referencia',  label: 'Fecha de referencia' },
    ];
    for (const { campo, label } of requeridos) {
      if (!form[campo]) {
        showNotification(`El campo "${label}" es requerido.`, 'error');
        return;
      }
    }

    const referenciasVolante = parseReferenciaVolante(form.referencia_volante);
    if (referenciasVolante.length === 0) {
      showNotification('Selecciona al menos una opción de referencia de volante.', 'error');
      return;
    }

    const requiereFolio = referenciasVolante.includes('folio');
    const requiereVolante = referenciasVolante.includes('volante');
    if (requiereFolio && !form.folio_numero) {
      showNotification('El número de folio es requerido.', 'error');
      return;
    }

    if (requiereVolante && !form.volante_numero) {
      showNotification('El número de volante es requerido.', 'error');
      return;
    }

    const payload = {
      ...form,
      ...normalizarDestinatario(form),
      tipo_solicitud: toUpperTrim(form.tipo_solicitud),
      referencia_volante: referenciasVolante.join('|'),
      folio_numero: requiereFolio ? form.folio_numero : '',
      volante_numero: requiereVolante ? form.volante_numero : ''
    };

    setGuardando(true);
    setError(null);
    try {
      if (registroEditando) {
        await actualizarCcpApi(registroEditando, payload);
        showNotification('Registro actualizado correctamente.', 'success');
      } else {
        await crearCcpApi(payload);
        showNotification('Registro creado correctamente.', 'success');
      }
      setVista('tabla');
      await cargarRegistros();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setGuardando(false);
    }
  }, [form, registroEditando, cargarRegistros, showNotification]);

  // ── Eliminar ───────────────────────────────────────────────────
  const eliminar = useCallback(async (id) => {
    if (!window.confirm('¿Confirma eliminar este registro?')) return;
    try {
      await eliminarCcpApi(id);
      await cargarRegistros();
      showNotification('Registro eliminado correctamente.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al eliminar';
      setError(msg);
      showNotification(msg, 'error');
    }
  }, [cargarRegistros, showNotification]);

  const eliminarSeleccionados = useCallback(async () => {
    if (seleccionados.length === 0) {
      showNotification('No hay registros seleccionados.', 'warning');
      return;
    }

    if (!window.confirm(`¿Eliminar ${seleccionados.length} registro(s) seleccionados?`)) return;

    try {
      await eliminarCcpMasivoApi(seleccionados);
      setSeleccionados([]);
      await cargarRegistros();
      showNotification('Registros eliminados correctamente.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al eliminar seleccionados';
      setError(msg);
      showNotification(msg, 'error');
    }
  }, [seleccionados, cargarRegistros, showNotification]);

  const eliminarTodos = useCallback(async () => {
    if (!window.confirm('¿Eliminar TODOS los registros de CCP? Esta acción es irreversible.')) return;

    try {
      await eliminarTodosCcpApi();
      setSeleccionados([]);
      setPagina(1);
      await cargarRegistros();
      showNotification('Tabla CCP limpiada correctamente.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al limpiar tabla CCP';
      setError(msg);
      showNotification(msg, 'error');
    }
  }, [cargarRegistros, showNotification]);

  // ── Descarga Excel individual ──────────────────────────────────
  const descargarExcel = useCallback(async (id, numeroOficio) => {
    try {
      const { data } = await descargarExcelCcpApi(id);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `CCP_${(numeroOficio || id).replace(/\//g, '-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar Excel');
    }
  }, []);

  // ── Descarga ZIP ───────────────────────────────────────────────
  const descargarZip = useCallback(async () => {
    try {
      const { data } = await descargarZipCcpApi(seleccionados);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CCP_Registros.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al generar ZIP');
    }
  }, [seleccionados]);
  // ── Descarga tabla completa como Excel horizontal ───────────────
  const descargarTablaExcel = useCallback(async () => {
    try {
      const { data } = await descargarTablaExcelCcpApi(busqueda);
      const url = URL.createObjectURL(
        new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CCP_Tabla_Completa.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al exportar tabla');
    }
  }, [busqueda]);
  // ── Helpers formulario ─────────────────────────────────────────
  const setFormField = useCallback((field, value) => {
    const normalizado = ['area', 'funcionario', 'cargo', 'tipo_solicitud'].includes(field)
      ? toUpper(value)
      : value;
    setForm(f => ({ ...f, [field]: normalizado }));
  }, []);

  const toggleSeleccionado = useCallback((id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  return {
    // tabla
    registros, loading, error, busqueda, setBusqueda,
    pagina, setPagina, paginacion,
    pageSize: CCP_TABLE_PAGE_SIZE,
    seleccionados, toggleSeleccionado,
    eliminarSeleccionados,
    eliminarTodos,
    // vista
    vista, setVista,
    // formulario
    form, setFormField, modoEdicion, setModoEdicion, guardando,
    editandoId: registroEditando,
    // acciones
    abrirNuevo, abrirEdicion, guardar, eliminar,
    descargarExcel, descargarZip, descargarTablaExcel,
    cargarRegistros
  };
};

export default useCcp;
