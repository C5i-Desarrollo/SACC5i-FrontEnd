import { useState, useCallback } from 'react';
import { 
  getUsuarios, 
  createUsuario, 
  updateUsuario, 
  deleteUsuario,
  purgeRegistrosAnalistaUsuario,
  activateUsuario, 
  deactivateUsuario, 
  resetPasswordUsuario,
  generarPasswordTemporalUsuario,
  obtenerPasswordTemporalUsuario,
  revocarPasswordTemporalUsuario,
  getRegiones 
} from '../../services/api';

/**
 * Hook para manejo de lista y CRUD de usuarios
 * Centraliza todas las operaciones de usuarios
 */
export const useUsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Cargar regiones
   */
  const cargarRegiones = useCallback(async () => {
    try {
      const response = await getRegiones();
      setRegiones(response.data.data);
      return response.data.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar regiones';
      setError(errorMsg);
      console.error('Error al cargar regiones:', err);
      throw err;
    }
  }, []);

  /**
   * Cargar usuarios con filtros
   */
  const cargarUsuarios = useCallback(async (filtros = {}, options = {}) => {
    const silent = Boolean(options?.silent);

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const params = {};
      if (filtros.buscar) params.buscar = filtros.buscar;
      if (filtros.rol) params.rol = filtros.rol;
      if (filtros.activo !== '') params.activo = filtros.activo;
      if (filtros.region_id) params.region_id = filtros.region_id;
      
      const response = await getUsuarios(params);
      setUsuarios(response.data.data);
      return response.data.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar usuarios';
      setError(errorMsg);
      console.error('Error al cargar usuarios:', err);
      throw err;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Crear nuevo usuario
   */
  const crearUsuario = useCallback(async (datos) => {
    setError(null);
    try {
      const response = await createUsuario(datos);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear usuario';
      setError(errorMsg);
      console.error('Error al crear usuario:', err);
      throw err;
    }
  }, []);

  /**
   * Actualizar usuario existente
   */
  const actualizarUsuario = useCallback(async (id, datos) => {
    setError(null);
    try {
      const dataToUpdate = {
        usuario: datos.usuario,
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        extension: datos.extension,
        rol: datos.rol
      };
      
      if (datos.region_id) {
        dataToUpdate.region_id = parseInt(datos.region_id);
      }

      const response = await updateUsuario(id, dataToUpdate);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar usuario';
      setError(errorMsg);
      console.error('Error al actualizar usuario:', err);
      throw err;
    }
  }, []);

  /**
   * Eliminar usuario
   */
  const eliminarUsuario = useCallback(async (id) => {
    setError(null);
    try {
      const response = await deleteUsuario(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar usuario';
      setError(errorMsg);
      console.error('Error al eliminar usuario:', err);
      throw err;
    }
  }, []);

  /**
   * Borrar registros asociados a un analista
   */
  const borrarRegistrosAnalista = useCallback(async (id) => {
    setError(null);
    try {
      const response = await purgeRegistrosAnalistaUsuario(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al borrar registros del analista';
      setError(errorMsg);
      console.error('Error al borrar registros del analista:', err);
      throw err;
    }
  }, []);

  /**
   * Activar usuario
   */
  const activarUsuario = useCallback(async (id) => {
    setError(null);
    try {
      const response = await activateUsuario(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al activar usuario';
      setError(errorMsg);
      console.error('Error al activar usuario:', err);
      throw err;
    }
  }, []);

  /**
   * Desactivar usuario
   */
  const desactivarUsuario = useCallback(async (id) => {
    setError(null);
    try {
      const response = await deactivateUsuario(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al desactivar usuario';
      setError(errorMsg);
      console.error('Error al desactivar usuario:', err);
      throw err;
    }
  }, []);

  /**
   * Resetear contraseña de usuario
   */
  const resetearPassword = useCallback(async (id) => {
    setError(null);
    try {
      const response = await resetPasswordUsuario(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al resetear contraseña';
      setError(errorMsg);
      console.error('Error al resetear contraseña:', err);
      throw err;
    }
  }, []);

  /**
   * Generar contraseña temporal para delegación
   */
  const generarPasswordTemporal = useCallback(async (id, datos) => {
    setError(null);
    try {
      const response = await generarPasswordTemporalUsuario(id, datos);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al generar contraseña temporal';
      setError(errorMsg);
      console.error('Error al generar contraseña temporal:', err);
      throw err;
    }
  }, []);

  /**
   * Obtener estado y bitácora de contraseña temporal
   */
  const obtenerPasswordTemporal = useCallback(async (id, params = {}) => {
    setError(null);
    try {
      const response = await obtenerPasswordTemporalUsuario(id, params);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al consultar contraseña temporal';
      setError(errorMsg);
      console.error('Error al consultar contraseña temporal:', err);
      throw err;
    }
  }, []);

  /**
   * Revocar contraseña temporal activa
   */
  const revocarPasswordTemporal = useCallback(async (id, datos = {}) => {
    setError(null);
    try {
      const response = await revocarPasswordTemporalUsuario(id, datos);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al revocar contraseña temporal';
      setError(errorMsg);
      console.error('Error al revocar contraseña temporal:', err);
      throw err;
    }
  }, []);

  return {
    usuarios,
    regiones,
    loading,
    error,
    cargarRegiones,
    cargarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    borrarRegistrosAnalista,
    activarUsuario,
    desactivarUsuario,
    resetearPassword,
    generarPasswordTemporal,
    obtenerPasswordTemporal,
    revocarPasswordTemporal
  };
};
