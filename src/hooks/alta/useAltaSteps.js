import { useState, useCallback } from 'react';

/**
 * Hook para manejo de pasos/navegación en proceso de alta
 * Controla el flujo entre listado, paso1, paso2, etc.
 */
export const useAltaSteps = (initialStep = 'listado') => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepData, setStepData] = useState({});

  /**
   * Ir a un paso específico
   */
  const goToStep = useCallback((step, data = null) => {
    setCurrentStep(step);
    if (data) {
      setStepData(prev => ({ ...prev, [step]: data }));
    }
  }, []);

  /**
   * Ir al listado
   */
  const goToListado = useCallback(() => {
    setCurrentStep('listado');
    setStepData({});
  }, []);

  /**
   * Ir a paso 1 (nueva solicitud)
   */
  const goToPaso1 = useCallback((data = null) => {
    setCurrentStep('paso1');
    if (data) {
      setStepData(prev => ({ ...prev, paso1: data }));
    }
  }, []);

  /**
   * Ir a paso 2 (agregar personas)
   */
  const goToPaso2 = useCallback((solicitudData) => {
    setCurrentStep('paso2');
    setStepData(prev => ({ ...prev, paso2: solicitudData }));
  }, []);

  /**
   * Ir al paso siguiente
   */
  const nextStep = useCallback(() => {
    const steps = ['listado', 'paso1', 'paso2'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  /**
   * Regresar al paso anterior
   */
  const prevStep = useCallback(() => {
    const steps = ['listado', 'paso1', 'paso2'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  /**
   * Verificar si estamos en un paso específico
   */
  const isStep = useCallback((step) => currentStep === step, [currentStep]);

  /**
   * Obtener datos de un paso
   */
  const getStepData = useCallback((step) => stepData[step] || null, [stepData]);

  /**
   * Limpiar datos de pasos
   */
  const clearStepData = useCallback(() => {
    setStepData({});
  }, []);

  return {
    // Estados
    currentStep,
    stepData,
    
    // Acciones de navegación
    goToStep,
    goToListado,
    goToPaso1,
    goToPaso2,
    nextStep,
    prevStep,
    
    // Utilidades
    isStep,
    getStepData,
    clearStepData
  };
};
