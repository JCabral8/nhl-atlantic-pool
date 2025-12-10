import { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';

export const usePredictions = (userId) => {
  const { API_BASE } = useApp();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchPredictions();
    }
  }, [userId]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/predictions/${userId}`);
      
      if (res.data.predictions) {
        setPredictions(res.data.predictions);
        setSubmittedAt(res.data.submittedAt);
        setLastUpdated(res.data.lastUpdated);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePredictions = async (newPredictions) => {
    try {
      const res = await axios.post(`${API_BASE}/predictions/${userId}`, {
        predictions: newPredictions,
      });
      
      setSubmittedAt(res.data.submittedAt);
      setLastUpdated(res.data.submittedAt);
      setPredictions(newPredictions);
      
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error saving predictions:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  return {
    predictions,
    setPredictions,
    loading,
    error,
    submittedAt,
    lastUpdated,
    savePredictions,
    refetch: fetchPredictions,
  };
};

