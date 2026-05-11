import { useState, useCallback } from 'react';

const CAMPOS_OFICIO_MAYUSCULAS = ['numero_oficio_c3', 'numero_oficio_c5', 'numero_oficio'];
const CAMPOS_NOMBRE_MAYUSCULAS = ['nombre', 'apellido_paterno', 'apellido_materno'];

/**
 * Hook para manejo de formularios de alta
 * Gestiona estado de formularios, validación y cambios
 */
export const useAltaForm = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /**
   * Manejar cambio en un campo
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const normalizedValue = (CAMPOS_OFICIO_MAYUSCULAS.includes(name) || CAMPOS_NOMBRE_MAYUSCULAS.includes(name))
      ? String(value || '').toUpperCase()
      : value;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: normalizedValue };
      
      // Lógica especial para término/días_horas
      if (name === 'termino') {
        if (normalizedValue === 'Sin termino') {
          newData.dias_horas = 'Normal';
        }
      }
      
      return newData;
    });

    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  /**
   * Manejar cambio genérico (para casos especiales)
   */
  const setValue = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Marcar campo como tocado
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  /**
   * Validar campo individual
   */
  const validateField = useCallback((name, value, rules = {}) => {
    if (rules.required && !value) {
      return `El campo ${rules.label || name} es requerido`;
    }
    
    if (rules.minLength && value.length < rules.minLength) {
      return `Mínimo ${rules.minLength} caracteres`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Formato inválido';
    }
    
    return null;
  }, []);

  /**
   * Validar formulario completo
   */
  const validate = useCallback((validationRules = {}) => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(
        fieldName, 
        formData[fieldName], 
        validationRules[fieldName]
      );
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  /**
   * Resetear formulario
   */
  const reset = useCallback((newValues = initialValues) => {
    setFormData(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Establecer errores manualmente
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  /**
   * Obtener props para un campo de formulario
   */
  const getFieldProps = useCallback((name) => ({
    name,
    value: formData[name] || '',
    onChange: handleChange,
    onBlur: handleBlur
  }), [formData, handleChange, handleBlur]);

  return {
    // Estados
    formData,
    errors,
    touched,
    
    // Acciones
    handleChange,
    handleBlur,
    setValue,
    validate,
    validateField,
    reset,
    setFieldError,
    getFieldProps
  };
};
