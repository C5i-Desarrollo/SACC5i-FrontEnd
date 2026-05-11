/**
 * Custom hook para búsqueda con debounce
 */
import { useState, useEffect, useMemo } from 'react';
import { debounce, searchInFields } from '../utils/helpers';

export const useSearch = (data = [], searchFields = [], options = {}) => {
  const { debounceTime = 300 } = options;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Debounce del término de búsqueda
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceTime);
    
    handler();
  }, [searchTerm, debounceTime]);
  
  // Filtrar datos
  const filteredData = useMemo(() => {
    return searchInFields(data, debouncedSearchTerm, searchFields);
  }, [data, debouncedSearchTerm, searchFields]);
  
  const reset = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };
  
  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    reset,
    isSearching: searchTerm !== debouncedSearchTerm
  };
};
