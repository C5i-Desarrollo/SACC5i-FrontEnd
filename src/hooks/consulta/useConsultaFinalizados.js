import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import {
  exportarConsultaExcelMunicipio,
  obtenerConsultaMunicipios,
  obtenerConsultaPersonasMunicipio
} from '../../services/consultaService';

const PAGINACION_DEFAULT = { total: 0, totalPaginas: 1, pagina: 1, limit: 10 };
const LOCAL_PERSONAS_GLOBAL_KEY = '__global__';
const EXPORT_PAGE_LIMIT = 100;
const esRegistroLocal = (id) => String(id || '').startsWith('local-');

const normalizarTexto = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const normalizarMayusculas = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const parseFilename = (contentDisposition = '', fallback = 'Consulta_Finalizados.xlsx') => {
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (simpleMatch?.[1]) return simpleMatch[1];

  return fallback;
};

const descargarBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const formatearFechaNacimientoExport = (value) => {
  if (!value) return '---';

  if (typeof value === 'string') {
    const isoDate = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    }
  }

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return '---';
  return fecha.toLocaleDateString('es-MX');
};

const sanitizarSegmentoArchivo = (value = '') =>
  String(value)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .trim();

const construirNombreArchivoExcel = ({
  municipioNombre = '',
  soloSeleccionados = false,
  incluyeLocales = false,
  sinMunicipio = false
}) => {
  const baseMunicipio = sinMunicipio
    ? 'Sin_Municipio'
    : (sanitizarSegmentoArchivo(municipioNombre) || 'Municipio');
  const alcance = soloSeleccionados ? 'Seleccionados' : 'Completo';
  const sufijoLocales = incluyeLocales ? '_Con_Adjuntos' : '';
  return `Consulta_${baseMunicipio}_${alcance}${sufijoLocales}.xlsx`;
};

const resolverMunicipioExport = (item = {}, municipioNombreDefault = '') => {
  if (item?.municipio_nombre) return item.municipio_nombre;
  if (item?.municipio_id === null || item?.municipio_id === undefined) return 'Sin municipio';
  return municipioNombreDefault || 'Sin municipio';
};

const descargarExcelDesdeRegistros = async (
  registros = [],
  municipioNombreDefault = '',
  filename = 'Consulta_Finalizados.xlsx'
) => {
  const XLSX = await import('xlsx');

  const filas = registros.map((item, index) => ({
    'No.': index + 1,
    Municipio: resolverMunicipioExport(item, municipioNombreDefault),
    Nombre: item?.nombre || '---',
    'Apellido Paterno': item?.apellido_paterno || '---',
    'Apellido Materno': item?.apellido_materno || '---',
    'Fecha de nacimiento': formatearFechaNacimientoExport(item?.fecha_nacimiento)
  }));

  const worksheet = XLSX.utils.json_to_sheet(filas);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consulta');
  XLSX.writeFile(workbook, filename);
};

export const useConsultaFinalizados = () => {
  const { showNotification } = useNotification();
  const municipiosInFlightRef = useRef(new Map());
  const personasInFlightRef = useRef(new Map());

  const [busquedaMunicipiosInput, setBusquedaMunicipiosInput] = useState('');
  const [busquedaMunicipios, setBusquedaMunicipios] = useState('');
  const [paginaMunicipios, setPaginaMunicipios] = useState(1);
  const [municipios, setMunicipios] = useState([]);
  const [paginacionMunicipios, setPaginacionMunicipios] = useState(PAGINACION_DEFAULT);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  const [municipioActivo, setMunicipioActivo] = useState(null);
  const [busquedaPersonasInput, setBusquedaPersonasInput] = useState('');
  const [busquedaPersonas, setBusquedaPersonas] = useState('');
  const [paginaPersonas, setPaginaPersonas] = useState(1);
  const [personas, setPersonas] = useState([]);
  const [paginacionPersonas, setPaginacionPersonas] = useState(PAGINACION_DEFAULT);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [personasLocalesByMunicipio, setPersonasLocalesByMunicipio] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const municipioActivoId = municipioActivo?.municipio_id;

  const personasLocalesMunicipio = useMemo(() => {
    const registrosGlobales = personasLocalesByMunicipio[LOCAL_PERSONAS_GLOBAL_KEY] || [];
    const registrosMunicipio = municipioActivoId === undefined || municipioActivoId === null
      ? []
      : (personasLocalesByMunicipio[String(municipioActivoId)] || []);
    const registros = municipioActivoId === undefined || municipioActivoId === null
      ? registrosGlobales
      : [...registrosGlobales, ...registrosMunicipio];

    if (!busquedaPersonas) return registros;

    const query = normalizarTexto(busquedaPersonas);
    if (!query) return registros;

    return registros.filter((item) => {
      const nombreCompleto = [item.nombre, item.apellido_paterno, item.apellido_materno]
        .filter(Boolean)
        .join(' ');
      return normalizarTexto(nombreCompleto).includes(query);
    });
  }, [busquedaPersonas, municipioActivoId, personasLocalesByMunicipio]);

  const personasTabla = useMemo(
    () => [...personasLocalesMunicipio, ...personas],
    [personas, personasLocalesMunicipio]
  );

  const selectedRowsServidor = useMemo(
    () => selectedRows.filter((id) => !String(id).startsWith('local-')),
    [selectedRows]
  );

  const selectedRowsLocales = useMemo(
    () => selectedRows.filter((id) => String(id).startsWith('local-')),
    [selectedRows]
  );

  const selectedRowsEnTablaActual = useMemo(() => {
    const selectedSet = new Set(selectedRows);
    return personasTabla.filter((item) => selectedSet.has(item.finalizado_id));
  }, [personasTabla, selectedRows]);

  const puedeExportarCompleto = useMemo(
    () => Boolean(municipioActivo) || personasLocalesMunicipio.length > 0,
    [municipioActivo, personasLocalesMunicipio.length]
  );

  const puedeExportarSeleccion = selectedRows.length > 0;
  const tieneRegistrosRecientes = personasLocalesMunicipio.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaMunicipios(busquedaMunicipiosInput.trim());
      setPaginaMunicipios(1);
    }, 280);

    return () => clearTimeout(timer);
  }, [busquedaMunicipiosInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaPersonas(busquedaPersonasInput.trim());
      setPaginaPersonas(1);
    }, 280);

    return () => clearTimeout(timer);
  }, [busquedaPersonasInput]);

  const cargarMunicipios = useCallback(async () => {
    const requestKey = JSON.stringify({
      busqueda: busquedaMunicipios,
      pagina: paginaMunicipios,
      limit: 10
    });

    const inFlightRequest = municipiosInFlightRef.current.get(requestKey);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    setLoadingMunicipios(true);
    const requestPromise = (async () => {
      try {
        const { registros, paginacion } = await obtenerConsultaMunicipios({
          busqueda: busquedaMunicipios,
          pagina: paginaMunicipios,
          limit: 10
        });
        setMunicipios(registros);
        setPaginacionMunicipios(paginacion);
      } catch (error) {
        setMunicipios([]);
        showNotification(error?.response?.data?.message || 'No se pudo cargar la consulta por municipios', 'error');
      } finally {
        setLoadingMunicipios(false);
        municipiosInFlightRef.current.delete(requestKey);
      }
    })();

    municipiosInFlightRef.current.set(requestKey, requestPromise);
    return requestPromise;
  }, [busquedaMunicipios, paginaMunicipios, showNotification]);

  const cargarPersonasMunicipio = useCallback(async () => {
    if (municipioActivoId === undefined || municipioActivoId === null) {
      setPersonas([]);
      setPaginacionPersonas(PAGINACION_DEFAULT);
      return;
    }

    const requestKey = JSON.stringify({
      municipioId: municipioActivoId,
      busqueda: busquedaPersonas,
      pagina: paginaPersonas,
      limit: 10
    });

    const inFlightRequest = personasInFlightRef.current.get(requestKey);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    setLoadingPersonas(true);
    const requestPromise = (async () => {
      try {
        const { registros, paginacion } = await obtenerConsultaPersonasMunicipio(
          municipioActivoId,
          {
            busqueda: busquedaPersonas,
            pagina: paginaPersonas,
            limit: 10
          }
        );

        setPersonas(registros);
        setPaginacionPersonas(paginacion);
      } catch (error) {
        setPersonas([]);
        showNotification(error?.response?.data?.message || 'No se pudo cargar la tabla de personas finalizadas', 'error');
      } finally {
        setLoadingPersonas(false);
        personasInFlightRef.current.delete(requestKey);
      }
    })();

    personasInFlightRef.current.set(requestKey, requestPromise);
    return requestPromise;
  }, [busquedaPersonas, municipioActivoId, paginaPersonas, showNotification]);

  useEffect(() => {
    cargarMunicipios();
  }, [cargarMunicipios]);

  useEffect(() => {
    cargarPersonasMunicipio();
  }, [cargarPersonasMunicipio]);

  useEffect(() => {
    setSelectedRows([]);
  }, [municipioActivo?.municipio_id, paginaPersonas, busquedaPersonas]);

  const abrirDetalleMunicipio = useCallback((municipio) => {
    const isSameMunicipio = municipioActivo && String(municipioActivo.municipio_id) === String(municipio?.municipio_id);

    setMunicipioActivo(isSameMunicipio ? null : municipio);
    setBusquedaPersonasInput('');
    setBusquedaPersonas('');
    setPaginaPersonas(1);
    setSelectedRows([]);
  }, [municipioActivo]);

  const togglePersonaSelection = useCallback((finalizadoId) => {
    setSelectedRows((prev) => {
      if (prev.includes(finalizadoId)) {
        return prev.filter((id) => id !== finalizadoId);
      }
      return [...prev, finalizadoId];
    });
  }, []);

  const agregarPersonaLocal = useCallback((persona) => {
    const nombre = normalizarMayusculas(persona?.nombre || '');
    const apellidoPaterno = normalizarMayusculas(persona?.apellido_paterno || '');
    const apellidoMaterno = normalizarMayusculas(persona?.apellido_materno || '');
    const fechaNacimiento = persona?.fecha_nacimiento || '';

    if (!nombre || !apellidoPaterno || !fechaNacimiento) {
      showNotification('Complete nombre, apellido paterno y fecha de nacimiento', 'warning');
      return false;
    }

    const municipioId = municipioActivo?.municipio_id ?? null;
    const municipioKey = municipioId === null
      ? LOCAL_PERSONAS_GLOBAL_KEY
      : String(municipioId);

    const registroLocal = {
      finalizado_id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno,
      fecha_nacimiento: fechaNacimiento,
      municipio_id: municipioId,
      es_local: true
    };

    setPersonasLocalesByMunicipio((prev) => {
      const actuales = prev[municipioKey] || [];
      return {
        ...prev,
        [municipioKey]: [registroLocal, ...actuales]
      };
    });

    showNotification('Persona agregada correctamente a la tabla', 'success');
    return true;
  }, [municipioActivo, showNotification]);

  const editarPersonaLocal = useCallback((finalizadoId, persona) => {
    if (!esRegistroLocal(finalizadoId)) {
      showNotification('Solo puede editar registros recien agregados', 'warning');
      return false;
    }

    const nombre = normalizarMayusculas(persona?.nombre || '');
    const apellidoPaterno = normalizarMayusculas(persona?.apellido_paterno || '');
    const apellidoMaterno = normalizarMayusculas(persona?.apellido_materno || '');
    const fechaNacimiento = persona?.fecha_nacimiento || '';

    if (!nombre || !apellidoPaterno || !fechaNacimiento) {
      showNotification('Complete nombre, apellido paterno y fecha de nacimiento', 'warning');
      return false;
    }

    let encontrado = false;
    setPersonasLocalesByMunicipio((prev) => {
      let huboCambios = false;
      const next = {};

      Object.entries(prev).forEach(([key, registros]) => {
        const actualizados = registros.map((item) => {
          if (item.finalizado_id !== finalizadoId) return item;

          encontrado = true;
          huboCambios = true;
          return {
            ...item,
            nombre,
            apellido_paterno: apellidoPaterno,
            apellido_materno: apellidoMaterno,
            fecha_nacimiento: fechaNacimiento
          };
        });

        if (actualizados.length > 0) {
          next[key] = actualizados;
        }
      });

      return huboCambios ? next : prev;
    });

    if (!encontrado) {
      showNotification('No se encontro el registro local para editar', 'warning');
      return false;
    }

    showNotification('Registro local actualizado correctamente', 'success');
    return true;
  }, [showNotification]);

  const eliminarPersonaLocal = useCallback((finalizadoId) => {
    if (!esRegistroLocal(finalizadoId)) {
      showNotification('Solo puede eliminar registros recien agregados', 'warning');
      return false;
    }

    let eliminado = false;
    setPersonasLocalesByMunicipio((prev) => {
      let huboCambios = false;
      const next = {};

      Object.entries(prev).forEach(([key, registros]) => {
        const filtrados = registros.filter((item) => item.finalizado_id !== finalizadoId);

        if (filtrados.length !== registros.length) {
          eliminado = true;
          huboCambios = true;
        }

        if (filtrados.length > 0) {
          next[key] = filtrados;
        }
      });

      return huboCambios ? next : prev;
    });

    if (!eliminado) {
      showNotification('No se encontro el registro local para eliminar', 'warning');
      return false;
    }

    setSelectedRows((prev) => prev.filter((id) => id !== finalizadoId));
    showNotification('Registro local eliminado correctamente', 'success');
    return true;
  }, [showNotification]);

  const limpiarRegistrosRecientes = useCallback(() => {
    const idsLocalesVisibles = personasLocalesMunicipio
      .map((item) => item.finalizado_id)
      .filter((id) => esRegistroLocal(id));

    if (idsLocalesVisibles.length === 0) {
      showNotification('No hay registros recien agregados para limpiar', 'info');
      return false;
    }

    const idsSet = new Set(idsLocalesVisibles);

    setPersonasLocalesByMunicipio((prev) => {
      let huboCambios = false;
      const next = {};

      Object.entries(prev).forEach(([key, registros]) => {
        const filtrados = registros.filter((item) => !idsSet.has(item.finalizado_id));

        if (filtrados.length !== registros.length) {
          huboCambios = true;
        }

        if (filtrados.length > 0) {
          next[key] = filtrados;
        }
      });

      return huboCambios ? next : prev;
    });

    setSelectedRows((prev) => prev.filter((id) => !idsSet.has(id)));
    showNotification('Registros recien agregados eliminados de la tabla', 'success');
    return true;
  }, [personasLocalesMunicipio, showNotification]);

  const seleccionarTodoPagina = useCallback(() => {
    const currentIds = personasTabla.map((item) => item.finalizado_id);
    const allSelected = currentIds.every((id) => selectedRows.includes(id));

    if (allSelected) {
      setSelectedRows((prev) => prev.filter((id) => !currentIds.includes(id)));
      return;
    }

    setSelectedRows((prev) => {
      const set = new Set(prev);
      currentIds.forEach((id) => set.add(id));
      return [...set];
    });
  }, [personasTabla, selectedRows]);

  const obtenerTodasLasPersonasServidorParaExportacion = useCallback(async () => {
    if (municipioActivoId === undefined || municipioActivoId === null) {
      return [];
    }

    const acumuladas = [];
    let pagina = 1;
    let totalPaginas = 1;

    do {
      const { registros, paginacion } = await obtenerConsultaPersonasMunicipio(
        municipioActivoId,
        {
          busqueda: busquedaPersonas,
          pagina,
          limit: EXPORT_PAGE_LIMIT
        }
      );

      acumuladas.push(...(registros || []));
      totalPaginas = Math.max(1, Number(paginacion?.totalPaginas) || 1);
      pagina += 1;
    } while (pagina <= totalPaginas);

    return acumuladas;
  }, [busquedaPersonas, municipioActivoId]);

  const exportarExcel = useCallback(async (soloSeleccionados = false) => {
    const tieneMunicipioSeleccionado = municipioActivoId !== undefined && municipioActivoId !== null;
    const hayLocalesVisibles = personasLocalesMunicipio.length > 0;
    const incluyeLocalesSeleccionados = soloSeleccionados && selectedRowsLocales.length > 0;
    const requiereExportacionFrontend =
      !tieneMunicipioSeleccionado ||
      (!soloSeleccionados && hayLocalesVisibles) ||
      incluyeLocalesSeleccionados;

    if (soloSeleccionados && selectedRows.length === 0) {
      showNotification('Seleccione al menos un registro para exportar', 'warning');
      return;
    }

    if (!soloSeleccionados && !tieneMunicipioSeleccionado && personasLocalesMunicipio.length === 0) {
      showNotification('Agregue al menos una persona para exportar sin municipio', 'warning');
      return;
    }

    setExportingExcel(true);
    try {
      if (!requiereExportacionFrontend) {
        const { blob, contentDisposition } = await exportarConsultaExcelMunicipio(
          municipioActivoId,
          {
            busqueda: busquedaPersonas,
            ids: soloSeleccionados ? selectedRowsServidor.join(',') : ''
          }
        );

        const filename = parseFilename(
          contentDisposition,
          `Consulta_${(municipioActivo?.municipio_nombre || 'Municipio').replace(/\s+/g, '_')}.xlsx`
        );

        descargarBlob(blob, filename);
      } else {
        let registrosParaExportar = [];

        if (soloSeleccionados) {
          registrosParaExportar = selectedRowsEnTablaActual;
        } else if (tieneMunicipioSeleccionado) {
          const registrosServidor = await obtenerTodasLasPersonasServidorParaExportacion();
          registrosParaExportar = [...personasLocalesMunicipio, ...registrosServidor];
        } else {
          registrosParaExportar = [...personasLocalesMunicipio];
        }

        if (registrosParaExportar.length === 0) {
          showNotification('No hay registros disponibles para exportar', 'warning');
          return;
        }

        const filename = construirNombreArchivoExcel({
          municipioNombre: municipioActivo?.municipio_nombre || '',
          soloSeleccionados,
          incluyeLocales: hayLocalesVisibles || selectedRowsLocales.length > 0 || !tieneMunicipioSeleccionado,
          sinMunicipio: !tieneMunicipioSeleccionado
        });

        await descargarExcelDesdeRegistros(
          registrosParaExportar,
          municipioActivo?.municipio_nombre || '',
          filename
        );
      }

      showNotification(
        soloSeleccionados ? 'Excel con registros seleccionados generado correctamente' : 'Excel completo generado correctamente',
        'success'
      );
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo exportar el archivo Excel', 'error');
    } finally {
      setExportingExcel(false);
    }
  }, [
    busquedaPersonas,
    municipioActivo,
    municipioActivoId,
    obtenerTodasLasPersonasServidorParaExportacion,
    personasLocalesMunicipio,
    selectedRows,
    selectedRowsEnTablaActual,
    selectedRowsLocales,
    selectedRowsServidor,
    showNotification
  ]);

  const allCurrentPageSelected = useMemo(() => {
    if (!personasTabla.length) return false;
    return personasTabla.every((item) => selectedRows.includes(item.finalizado_id));
  }, [personasTabla, selectedRows]);

  return {
    busquedaMunicipiosInput,
    setBusquedaMunicipiosInput,
    paginaMunicipios,
    setPaginaMunicipios,
    municipios,
    paginacionMunicipios,
    loadingMunicipios,
    municipioActivo,
    busquedaPersonasInput,
    setBusquedaPersonasInput,
    paginaPersonas,
    setPaginaPersonas,
    personas: personasTabla,
    paginacionPersonas,
    loadingPersonas,
    exportingExcel,
    puedeExportarCompleto,
    puedeExportarSeleccion,
    tieneRegistrosRecientes,
    selectedRows,
    allCurrentPageSelected,
    abrirDetalleMunicipio,
    agregarPersonaLocal,
    editarPersonaLocal,
    eliminarPersonaLocal,
    limpiarRegistrosRecientes,
    togglePersonaSelection,
    seleccionarTodoPagina,
    exportarExcel
  };
};
