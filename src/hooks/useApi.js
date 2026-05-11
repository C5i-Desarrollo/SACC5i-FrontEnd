/**
 * Custom hook para llamadas API con estados de loading y error
 */
import { useState, useCallback } from 'react';
import { handleError, extractData } from '../utils/errorHandler';

export const useApi = (apiFunction, options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(...args);
      const extractedData = extractData(response);
      
      setData(extractedData);
      return { data: extractedData, error: null };
    } catch (err) {
      const errorInfo = handleError(err, {
        showNotification: options.showNotification !== false,
        logToConsole: true,
        throwError: false
      });
      
      setError(errorInfo);
      return { data: null, error: errorInfo };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options.showNotification]);
  
  const reset = useCallback(() => {
    setData(options.initialData || null);
    setError(null);
    setLoading(false);
  }, [options.initialData]);
  
  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData
  };
};
