export const DESTINATARIO_DEFAULT = {
  area: 'DIRECCIÓN DE TELECOMUNICACIONES DEL C5I',
  funcionario: 'ALEJANDRA LUIS COSMES',
  cargo: 'DIRECTORA DE TELECOMUNICACIONES DEL C5I'
};

export const VOLANTE_OPTIONS = [
  { value: 'N/A', label: 'No aplica (N/A)' },
  { value: 'folio', label: 'Con número de folio' },
  { value: 'volante', label: 'Con número de volante' }
];

export const buildAsunto = (form) =>
  `${form.texto_asunto1 || 'C.C.P. EN ATENCIÓN AL OFICIO'} ${form.oficio_referencia || '[OFICIO]'} ${form.texto_asunto2 || 'DE FECHA'} ${form.fecha_referencia || '[FECHA]'} ${form.texto_asunto3 || 'EN EL CUAL SOLICITA'} ${(form.tipo_solicitud || '').toUpperCase()} ${form.texto_asunto4 || 'EN RNPSP.'}`;

export const formatOficio = (seq, anio) =>
  seq ? `SSP/SII/C5I/DT/${seq}/${anio}` : '';

export const formatFecha = (str) => {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
};

export const parseReferenciaVolante = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  return String(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const hasReferenciaVolante = (value, option) =>
  parseReferenciaVolante(value).includes(option);

export const formatReferenciaVolante = (value, folio, volante) => {
  const opciones = parseReferenciaVolante(value);

  if (opciones.length === 0) return 'Sin referencia';

  const partes = [];
  if (opciones.includes('N/A')) partes.push('N/A');
  if (opciones.includes('folio')) partes.push(folio ? `FOLIO: ${folio}` : 'FOLIO');
  if (opciones.includes('volante')) partes.push(volante ? `VOLANTE: ${volante}` : 'VOLANTE');

  return partes.join(' + ');
};

export const buildCompactPagination = (paginaActual, totalPaginas) => {
  if (!totalPaginas || totalPaginas <= 0) return [];

  const current = Math.max(1, Math.min(Number(paginaActual) || 1, Number(totalPaginas) || 1));
  const total = Number(totalPaginas) || 1;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const paginas = new Set([1, total, current, current - 1, current + 1]);

  if (current <= 3) {
    paginas.add(2);
    paginas.add(3);
    paginas.add(4);
  }

  if (current >= total - 2) {
    paginas.add(total - 1);
    paginas.add(total - 2);
    paginas.add(total - 3);
  }

  const ordenadas = [...paginas]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const items = [];
  for (let i = 0; i < ordenadas.length; i += 1) {
    const pagina = ordenadas[i];
    const anterior = ordenadas[i - 1];
    if (i > 0 && pagina - anterior > 1) {
      items.push('...');
    }
    items.push(pagina);
  }

  return items;
};
