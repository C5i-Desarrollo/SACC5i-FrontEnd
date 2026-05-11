/**
 * Custom hook para validación de formularios
 */
import { useState, useCallback } from 'react';
import * as validators from '../utils/validators';

export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Actualizar valor de campo
   */
  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  /**
   * Actualizar múltiples valores
   */
  const setMultipleValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);
  
  /**
   * Handler para inputs
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValue(name, newValue);
    
    // Validar campo si ya fue touched
    if (touched[name]) {
      validateField(name, newValue);
    }
  }, [touched]);
  
  /**
   * Handler para blur
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    validateField(name, values[name]);
  }, [values]);
  
  /**
   * Validar campo individual
   */
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return true;
    
    let fieldError = null;
    
    // Verificar cada regla
    for (const [rule, ruleValue] of Object.entries(rules)) {
      if (rule === 'required' && ruleValue) {
        if (!validators.isRequired(value)) {
          fieldError = validators.VALIDATION_MESSAGES.REQUIRED;
          break;
        }
      }
      
      if (rule === 'email' && ruleValue && value) {
        if (!validators.isValidEmail(value)) {
          fieldError = validators.VALIDATION_MESSAGES.INVALID_EMAIL;
          break;
        }
      }
      
      if (rule === 'curp' && ruleValue && value) {
        if (!validators.isValidCURP(value)) {
          fieldError = validators.VALIDATION_MESSAGES.INVALID_CURP;
          break;
        }
      }
      
      if (rule === 'rfc' && ruleValue && value) {
        if (!validators.isValidRFC(value)) {
          fieldError = validators.VALIDATION_MESSAGES.INVALID_RFC;
          break;
        }
      }
      
      if (rule === 'phone' && ruleValue && value) {
        if (!validators.isValidPhone(value)) {
          fieldError = validators.VALIDATION_MESSAGES.INVALID_PHONE;
          break;
        }
      }
      
      if (rule === 'minLength' && value) {
        if (!validators.isValidLength(value, ruleValue)) {
          fieldError = `Mínimo ${ruleValue} caracteres`;
          break;
        }
      }
      
      if (rule === 'maxLength' && value) {
        if (!validators.isValidLength(value, 0, ruleValue)) {
          fieldError = `Máximo ${ruleValue} caracteres`;
          break;
        }
      }
      
      if (rule === 'custom' && typeof ruleValue === 'function') {
        const customError = ruleValue(value, values);
        if (customError) {
          fieldError = customError;
          break;
        }
      }
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
    
    return !fieldError;
  }, [validationRules, values]);
  
  /**
   * Validar todo el formulario
   */
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(name => {
      const fieldIsValid = validateField(name, values[name]);
      if (!fieldIsValid) {
        isValid = false;
        newErrors[name] = errors[name];
      }
    });
    
    // Marcar todos los campos como touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    return isValid;
  }, [validationRules, values, errors, validateField]);
  
  /**
   * Submit del formulario
   */
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      if (e) e.preventDefault();
      
      const isValid = validateForm();
      
      if (!isValid) {
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateForm]);
  
  /**
   * Reset del formulario
   */
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  /**
   * Obtener props para un campo
   */
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur
    };
  }, [values, handleChange, handleBlur]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setMultipleValues,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    reset,
    getFieldProps
  };
};
