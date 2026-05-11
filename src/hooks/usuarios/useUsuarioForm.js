import { useState, useCallback } from 'react';

const separarNombreCompleto = (nombreCompleto = '') => {
  const valor = String(nombreCompleto || '').trim();
  if (!valor) {
    return { nombre: '', apellido: '' };
  }

  const partes = valor.split(/\s+/);
  if (partes.length === 1) {
    return { nombre: partes[0], apellido: '' };
  }

  const apellido = partes.pop();
  return {
    nombre: partes.join(' '),
    apellido
  };
};

/**
 * Hook para manejo de formularios de usuarios
 * Gestiona estados de creación y edición
 */
export const useUsuarioForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    usuario: '',
    email: '',
    nombre: '',
    apellido: '',
    extension: '',
    rol: 'analista',
    region_id: ''
  });

  /**
   * Abrir formulario de creación
   */
  const abrirFormularioCrear = useCallback(() => {
    setShowForm(true);
    setEditingUser(null);
  }, []);

  /**
   * Cerrar formulario de creación
   */
  const cerrarFormularioCrear = useCallback(() => {
    setShowForm(false);
    setNewUser({
      usuario: '',
      email: '',
      nombre: '',
      apellido: '',
      extension: '',
      rol: 'analista',
      region_id: ''
    });
  }, []);

  /**
   * Abrir formulario de edición
   */
  const abrirFormularioEditar = useCallback((usuario) => {
    const usuarioSeguro = usuario || {};
    const nombreActual = String(usuarioSeguro.nombre || '').trim();
    const apellidoActual = String(usuarioSeguro.apellido || '').trim();
    const { nombre, apellido } = separarNombreCompleto(usuarioSeguro.nombre_completo);

    setEditingUser({
      ...usuarioSeguro,
      nombre: nombreActual || nombre,
      apellido: apellidoActual || apellido
    });
    setShowForm(false);
  }, []);

  /**
   * Cerrar formulario de edición
   */
  const cerrarFormularioEditar = useCallback(() => {
    setEditingUser(null);
  }, []);

  /**
   * Actualizar campo del nuevo usuario
   */
  const actualizarCampoNuevo = useCallback((campo, valor) => {
    setNewUser(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  /**
   * Actualizar campo del usuario en edición
   */
  const actualizarCampoEdicion = useCallback((campo, valor) => {
    setEditingUser(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  /**
   * Resetear formulario completo
   */
  const resetearFormularios = useCallback(() => {
    setShowForm(false);
    setEditingUser(null);
    setNewUser({
      usuario: '',
      email: '',
      nombre: '',
      apellido: '',
      extension: '',
      rol: 'analista',
      region_id: ''
    });
  }, []);

  return {
    // Estados
    showForm,
    editingUser,
    newUser,
    
    // Setters directos
    setNewUser,
    setEditingUser,
    setShowForm,
    
    // Métodos
    abrirFormularioCrear,
    cerrarFormularioCrear,
    abrirFormularioEditar,
    cerrarFormularioEditar,
    actualizarCampoNuevo,
    actualizarCampoEdicion,
    resetearFormularios
  };
};
