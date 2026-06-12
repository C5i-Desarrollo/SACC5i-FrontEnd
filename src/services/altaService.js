import { getFinalizadosApi } from './api';

export const obtenerAltasRegistradas = async (params = {}) => {
  const { data } = await getFinalizadosApi(params);

  const registros =
    Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.registros)
        ? data.data.registros
        : Array.isArray(data?.registros)
          ? data.registros
          : [];

  return {
    registros,
    paginacion:
      data?.data?.paginacion ||
      data?.paginacion ||
      {
        total: registros.length,
        totalPaginas: 1,
        pagina: 1
      }
  };
};