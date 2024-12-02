import { useState, useEffect, useCallback } from 'react';
import { getImportHistory } from '../services/api';

export const useImportHistory = () => {
  const [importHistory, setImportHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadImportHistory = useCallback(async () => {
    console.log('loadImportHistory called');
    setIsLoading(true);
    setError(null);
    try {
      const data = await getImportHistory(currentPage, itemsPerPage);
      console.log('Data received in useImportHistory:', data);
      console.log('Data type:', typeof data);
      console.log('Is data an array?', Array.isArray(data));
      
      if (Array.isArray(data)) {
        setImportHistory(data);
        setTotalItems(data.length);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
        console.log('Import history set:', data);
      } else if (data && typeof data === 'object' && 'items' in data) {
        setImportHistory(data.items);
        setTotalItems(data.totalItems || data.items.length);
        setTotalPages(data.totalPages || Math.ceil(data.items.length / itemsPerPage));
        console.log('Import history set from object:', data.items);
      } else {
        console.error('Unexpected data format:', data);
        setError('Format de données inattendu');
      }
    } catch (error) {
      console.error('Error fetching import history:', error);
      setError('Une erreur est survenue lors du chargement de l\'historique des importations.');
    } finally {
      setIsLoading(false);
      console.log('isLoading set to false');
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    console.log('useEffect in useImportHistory triggered');
    loadImportHistory();
  }, [loadImportHistory]);

  const refreshImportHistory = useCallback(() => {
    console.log('refreshImportHistory called');
    return loadImportHistory();
  }, [loadImportHistory]);

  console.log('useImportHistory current state:', { importHistory, isLoading, error, totalItems, totalPages });

  return {
    importHistory,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    isLoading,
    error,
    setCurrentPage,
    setItemsPerPage,
    refreshImportHistory
  };
};