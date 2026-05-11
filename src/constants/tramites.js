/**
 * Constantes relacionadas con trámites
 */

export const TIPO_DOCUMENTO = {
  OFICIO: 'Oficio',
  VOLANTE: 'Volante',
  FOLIO: 'Folio'
};

export const PROCESO_MOVIMIENTO = {
  ALTA: 'ALTA',
  BAJA: 'BAJA'
};

export const TERMINO = {
  ORDINARIO: 'Ordinario',
  URGENTE: 'Urgente',
  NORMAL: 'Normal'
};

export const DIAS_HORAS = {
  DIAS: 'Dias',
  HORAS: 'Horas'
};

export const ESTATUS_SOLICITUD = {
  BORRADOR: 'borrador',
  EN_REVISION: 'en_revision',
  PENDIENTE_C3: 'pendiente_c3',
  VALIDADO_C3: 'validado_c3',
  RECHAZADO_C3: 'rechazado_c3',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
};

export const ESTATUS_PERSONA = {
  PENDIENTE: 'pendiente',
  VALIDADO: 'validado',
  RECHAZADO: 'rechazado',
  PENDIENTE_C3: 'pendiente_c3',
  APROBADO_C3: 'aprobado_c3',
  RECHAZADO_C3: 'rechazado_c3',
  ACTIVO: 'activo'
};

export const ESTATUS_LABELS = {
  [ESTATUS_SOLICITUD.BORRADOR]: 'Borrador',
  [ESTATUS_SOLICITUD.EN_REVISION]: 'En Revisión',
  [ESTATUS_SOLICITUD.PENDIENTE_C3]: 'Pendiente C3',
  [ESTATUS_SOLICITUD.VALIDADO_C3]: 'Validado C3',
  [ESTATUS_SOLICITUD.RECHAZADO_C3]: 'Rechazado C3',
  [ESTATUS_SOLICITUD.APROBADO]: 'Aprobado',
  [ESTATUS_SOLICITUD.RECHAZADO]: 'Rechazado',
  [ESTATUS_SOLICITUD.COMPLETADO]: 'Completado',
  [ESTATUS_SOLICITUD.CANCELADO]: 'Cancelado'
};

export const ESTATUS_COLORS = {
  [ESTATUS_SOLICITUD.BORRADOR]: '#6c757d',
  [ESTATUS_SOLICITUD.EN_REVISION]: '#ffc107',
  [ESTATUS_SOLICITUD.PENDIENTE_C3]: '#17a2b8',
  [ESTATUS_SOLICITUD.VALIDADO_C3]: '#28a745',
  [ESTATUS_SOLICITUD.RECHAZADO_C3]: '#dc3545',
  [ESTATUS_SOLICITUD.APROBADO]: '#28a745',
  [ESTATUS_SOLICITUD.RECHAZADO]: '#dc3545',
  [ESTATUS_SOLICITUD.COMPLETADO]: '#007bff',
  [ESTATUS_SOLICITUD.CANCELADO]: '#6c757d'
};
