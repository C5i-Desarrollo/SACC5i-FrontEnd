export const normalizeSearchText = (value = '') => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const matchesSearchQuery = (value, query) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(value);
  if (!haystack) return false;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
};

const normalizeSolicitudDigits = (value = '') => {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+/, '');
  return digits || '0';
};

export const isSolicitudSearchQuery = (query = '') => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;
  return /^\d+$/.test(normalizedQuery)
    || /^(sol|solicitud)[\s:-]*\d+$/.test(normalizedQuery);
};

export const matchesSolicitudQuery = (tramite = {}, persona = {}, query = '') => {
  const normalizedDigits = normalizeSolicitudDigits(query);
  if (!normalizedDigits) return false;

  const numeroSolicitudTramite = normalizeSolicitudDigits(tramite?.numero_solicitud);
  const numeroSolicitudPersona = normalizeSolicitudDigits(persona?.numero_solicitud);

  return numeroSolicitudTramite === normalizedDigits
    || numeroSolicitudPersona === normalizedDigits;
};

export const buildSearchableText = (...values) => {
  return values
    .map((value) => String(value ?? ''))
    .join(' ')
    .trim();
};

export const getDisplayPersonName = (persona = {}) => {
  const candidates = [
    persona.nombre_completo,
    persona.nombre_persona,
    persona.nombre_persona_completo,
    persona.nombre,
    persona.nombres,
    persona.nombre_s,
    [persona.nombre, persona.apellido_paterno, persona.apellido_materno].filter(Boolean).join(' '),
    [persona.nombres, persona.apellidos].filter(Boolean).join(' '),
    [persona.nombre_s, persona.apellido_paterno_s, persona.apellido_materno_s].filter(Boolean).join(' ')
  ].filter(Boolean);

  return candidates[0] || '';
};

export const buildPersonSearchableText = (persona = {}, tramite = {}) => {
  return buildSearchableText(
    getDisplayPersonName(persona),
    persona.puesto_nombre,
    persona.municipio_nombre,
    tramite?.municipio_nombre,
    tramite?.region_nombre,
    tramite?.numero_solicitud,
    tramite?.tipo_oficio_nombre,
    tramite?.validador_c3_nombre,
    tramite?.analista_nombre,
    persona.numero_solicitud,
    persona.numero_oficio_c3
  );
};
