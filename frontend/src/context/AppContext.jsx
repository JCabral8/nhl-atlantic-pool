import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

// Production on Vercel: same-origin /api. Local dev: VITE_API_URL or localhost.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD && typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');

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
      console.log('Fetching data from API:', API_BASE);
      const [usersRes, standingsRes, deadlineRes] = await Promise.all([
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/standings`),
        axios.get(`${API_BASE}/deadline`),
      ]);
      
      // Validate that responses are JSON (not HTML)
      const isJsonResponse = (data) => {
        if (typeof data === 'string' && data.trim().startsWith('<!')) {
          return false;
        }
        return Array.isArray(data) || (typeof data === 'object' && data !== null);
      };
      
      console.log('Users fetched:', usersRes.data);
      
      // Ensure users is always an array
      if (isJsonResponse(usersRes.data) && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      } else {
        console.warn('Invalid users response, expected array but got:', typeof usersRes.data);
        setUsers([]);
      }
      
      if (isJsonResponse(standingsRes.data) && Array.isArray(standingsRes.data)) {
        setStandings(standingsRes.data);
      } else {
        console.warn('Invalid standings response');
        setStandings([]);
      }
      
      if (isJsonResponse(deadlineRes.data)) {
        setDeadline(deadlineRes.data);
      } else {
        setDeadline(null);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      console.error('API_BASE:', API_BASE);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty arrays on error so UI doesn't break
      setUsers([]);
      setStandings([]);
      setDeadline(null);
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

