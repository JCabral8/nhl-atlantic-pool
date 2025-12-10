import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [deadline, setDeadline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [usersRes, standingsRes, deadlineRes] = await Promise.all([
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/standings`),
        axios.get(`${API_BASE}/deadline`),
      ]);
      
      setUsers(usersRes.data);
      setStandings(standingsRes.data);
      setDeadline(deadlineRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStandings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/standings`);
      setStandings(res.data);
    } catch (error) {
      console.error('Error refreshing standings:', error);
    }
  };

  const refreshDeadline = async () => {
    try {
      const res = await axios.get(`${API_BASE}/deadline`);
      setDeadline(res.data);
    } catch (error) {
      console.error('Error refreshing deadline:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        standings,
        deadline,
        loading,
        refreshStandings,
        refreshDeadline,
        API_BASE,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

