import {
  exportarConsultaPersonasMunicipioApi,
  getConsultaMunicipiosApi,
  getConsultaPersonasMunicipioApi
} from './api';

export const obtenerConsultaMunicipios = async (params = {}) => {
  const { data } = await getConsultaMunicipiosApi(params);
  return {
    registros: data?.data?.registros || [],
    paginacion: data?.data?.paginacion || { total: 0, totalPaginas: 1, pagina: 1 }
  };
};

export const obtenerConsultaPersonasMunicipio = async (municipioId, params = {}) => {
  const { data } = await getConsultaPersonasMunicipioApi(municipioId, params);
  return {
    municipio: data?.data?.municipio || null,
    registros: data?.data?.registros || [],
    paginacion: data?.data?.paginacion || { total: 0, totalPaginas: 1, pagina: 1 }
  };
};

export const exportarConsultaExcelMunicipio = async (municipioId, params = {}) => {
  const response = await exportarConsultaPersonasMunicipioApi(municipioId, params);
  return {
    blob: response.data,
    contentDisposition: response.headers?.['content-disposition'] || ''
  };
};
