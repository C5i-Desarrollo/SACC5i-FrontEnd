/**
 * Custom hook para fetch de datos con loading automático
 */
import { useState, useEffect, useCallback } from 'react';
import { handleError, extractData } from '../utils/errorHandler';

export const useFetch = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction();
      const extractedData = extractData(response);
      
      setData(extractedData);
    } catch (err) {
      const errorInfo = handleError(err, {
        showNotification: options.showNotification !== false,
        logToConsole: true,
        throwError: false
      });
      
      setError(errorInfo);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options.showNotification]);
  
  useEffect(() => {
    if (options.skip) return;
    
    fetchData();
  }, dependencies);
  
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);
  
  return {
    data,
    loading,
    error,
    refetch,
    setData
  };
};
