import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Storage as DatabaseIcon,
  Lock as LockIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Header from './Header';

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
}));

// Atlantic Division team names (must match backend)
const ATLANTIC_TEAMS = new Set([
  'Tampa Bay Lightning', 'Boston Bruins', 'Detroit Red Wings', 'Montreal Canadiens',
  'Toronto Maple Leafs', 'Florida Panthers', 'Ottawa Senators', 'Buffalo Sabres',
]);

/** Parse Atlantic Division from NHL API response (same shape as backend) */
function parseAtlanticStandings(apiData) {
  if (!apiData?.records) throw new Error('Invalid NHL API response');
  const out = [];
  for (const record of apiData.records) {
    if (!record.teamRecords) continue;
    for (const tr of record.teamRecords) {
      const name = tr.team?.name;
      if (name && ATLANTIC_TEAMS.has(name)) {
        const stats = tr.leagueRecord || {};
        const standings = tr.standings || {};
        out.push({
          team: name,
          gp: Number(standings.gamesPlayed ?? (stats.wins + stats.losses + (stats.ot || 0)) ?? 0),
          w: Number(stats.wins || 0),
          l: Number(stats.losses || 0),
          otl: Number(stats.ot || 0),
          pts: Number(standings.points ?? tr.points ?? 0),
        });
      }
    }
  }
  return out;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { API_BASE, refreshStandings } = useApp();
  const [passwordModalOpen, setPasswordModalOpen] = useState(true);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbInfo, setDbInfo] = useState(null);
  const [tableData, setTableData] = useState({});
  const [loadingTable, setLoadingTable] = useState({});
  const [standingsUpdating, setStandingsUpdating] = useState(false);
  const [standingsUpdateMessage, setStandingsUpdateMessage] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cronStatus, setCronStatus] = useState(null);
  const [cronTesting, setCronTesting] = useState(false);
  const [cronTestMessage, setCronTestMessage] = useState(null);

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    if (isAuth) {
      setAuthenticated(true);
      setPasswordModalOpen(false);
      fetchDatabaseInfo();
      fetchLastUpdated();
      fetchCronStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/admin/auth`, { password });
      
      if (response.data.success) {
        setAuthenticated(true);
        setPasswordModalOpen(false);
        sessionStorage.setItem('admin_authenticated', 'true');
        fetchDatabaseInfo();
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error;
      setError(typeof errorMsg === 'string' ? errorMsg : (error.message || 'Failed to authenticate'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const password = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
      console.log('Fetching database info from:', `${API_BASE}/admin/database`);
      const response = await axios.get(`${API_BASE}/admin/database`, {
        headers: {
          'x-admin-password': password,
        },
      });
      setDbInfo(response.data);
    } catch (error) {
      console.error('Error fetching database info:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch database information';
      setError(errorMsg);
      // Set dbInfo to null so error fallback renders
      setDbInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    if (tableData[tableName]) {
      return; // Already loaded
    }

    setLoadingTable(prev => ({ ...prev, [tableName]: true }));
    try {
      const password = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
      const response = await axios.get(`${API_BASE}/admin/database/${tableName}`, {
        headers: {
          'x-admin-password': password,
        },
        params: {
          limit: 100,
          offset: 0,
        },
      });
      setTableData(prev => ({ ...prev, [tableName]: response.data }));
    } catch (error) {
      console.error(`Error fetching table ${tableName}:`, error);
      const errorMsg = error.response?.data?.error;
      const errorStr = typeof errorMsg === 'string' ? errorMsg : (error.message || 'Failed to load data');
      setTableData(prev => ({ ...prev, [tableName]: { error: errorStr } }));
    } finally {
      setLoadingTable(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setAuthenticated(false);
    setPasswordModalOpen(true);
    setPassword('');
    setDbInfo(null);
    setTableData({});
  };

  const fetchLastUpdated = async () => {
    try {
      const response = await axios.get(`${API_BASE}/standings/last-updated`);
      setLastUpdated(response.data.lastUpdated || response.data.timestamp || null);
    } catch (error) {
      console.error('Error fetching last updated:', error);
      setLastUpdated(null);
    }
  };

  const fetchCronStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cron/status`);
      setCronStatus(response.data);
    } catch (error) {
      console.error('Error fetching cron status:', error);
      setCronStatus({ configured: false, error: error.message });
    }
  };

  const handleTestCron = async () => {
    setCronTestMessage(null);
    setCronTesting(true);
    try {
      const adminPassword = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
      const response = await axios.post(`${API_BASE}/cron/status`, {}, {
        headers: { 'x-admin-password': adminPassword },
      });
      if (response.data.success) {
        setCronTestMessage(`Cron test successful: ${response.data.result?.updated ?? 0} teams updated.`);
        fetchLastUpdated();
        refreshStandings?.();
      } else {
        setCronTestMessage(response.data.error || response.data.message || 'Cron test failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message;
      const errorStr = typeof errorMsg === 'string' ? errorMsg : (err.message || 'Failed to test cron');
      setCronTestMessage(errorStr);
    } finally {
      setCronTesting(false);
    }
  };

  // Proxy-only: browser never resolves NHL host (avoids ERR_NAME_NOT_RESOLVED on some networks)
  const fetchNHLStandings = async () => {
    const nhlUrl = 'https://statsapi.web.nhl.com/api/v1/standings';
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(nhlUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(nhlUrl)}`,
    ];
    let lastErr;
    for (const url of proxies) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        return await res.json();
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Could not load standings');
  };

  const handleUpdateStandings = async () => {
    setStandingsUpdateMessage(null);
    setStandingsUpdating(true);
    const adminPassword = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
    try {
      const apiData = await fetchNHLStandings();
      const standings = parseAtlanticStandings(apiData);
      if (standings.length === 0) throw new Error('No Atlantic Division teams in NHL response');

      const response = await axios.post(
        `${API_BASE}/standings/update-now`,
        { standings },
        { headers: { 'x-admin-password': adminPassword } }
      );
      if (response.data.success) {
        setStandingsUpdateMessage(`Standings updated successfully (${response.data.updated ?? 0} teams).`);
        fetchLastUpdated();
        refreshStandings?.();
      } else {
        setStandingsUpdateMessage(response.data.message || response.data.error || 'Update failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message;
      const errorStr = typeof errorMsg === 'string' ? errorMsg : (err.message || 'Failed to update standings');
      setStandingsUpdateMessage(errorStr);
    } finally {
      setStandingsUpdating(false);
    }
  };

  if (!authenticated) {
    return (
      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Header />
        <StyledContainer maxWidth="sm">
          <Dialog open={passwordModalOpen} onClose={() => {}} maxWidth="xs" fullWidth disableEscapeKeyDown>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <LockIcon />
                <Typography variant="h6">Admin Access</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePasswordSubmit();
                    }
                  }}
                  error={!!error}
                  helperText={error}
                  sx={{ mt: 2 }}
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => navigate('/')}>Cancel</Button>
              <Button 
                onClick={handlePasswordSubmit} 
                variant="contained" 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                {loading ? 'Authenticating...' : 'Submit'}
              </Button>
            </DialogActions>
          </Dialog>
        </StyledContainer>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Header />
      <StyledContainer maxWidth="xl">
        {!dbInfo && !loading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Click the refresh button to load database information.
          </Alert>
        )}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Admin - Database Viewer
            </Typography>
            <Box display="flex" gap={2}>
              <Tooltip title="Refresh database info">
                <IconButton onClick={fetchDatabaseInfo} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button variant="outlined" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </Box>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        {loading && !dbInfo ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : dbInfo && !dbInfo.error ? (
          <Grid container spacing={3}>
            {/* Database Connection Info */}
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <DatabaseIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Database Information
                    </Typography>
                  </Box>
                  <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip 
                    label={`Type: ${dbInfo?.databaseType || 'Unknown'}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Status: ${dbInfo?.connectionStatus || 'unknown'}`} 
                    color={dbInfo?.connectionStatus === 'connected' ? 'success' : 'error'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Database: ${dbInfo?.databaseName || 'N/A'}`} 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Tables: ${dbInfo?.tables?.length || 0}`} 
                    variant="outlined" 
                  />
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Update NHL Standings */}
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <UpdateIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">
                      NHL Standings
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click the button to fetch latest Atlantic Division standings (from your browser) and save to the database.
                  </Typography>
                  
                  {lastUpdated && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Last updated: {new Date(lastUpdated).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                    <Button
                      variant="contained"
                      onClick={handleUpdateStandings}
                      disabled={standingsUpdating}
                      startIcon={standingsUpdating ? <CircularProgress size={20} /> : <UpdateIcon />}
                    >
                      {standingsUpdating ? 'Updating…' : 'Update NHL standings'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={handleTestCron}
                      disabled={cronTesting || !cronStatus?.configured}
                      startIcon={cronTesting ? <CircularProgress size={20} /> : null}
                    >
                      {cronTesting ? 'Testing…' : 'Test Cron Job'}
                    </Button>
                    
                    <Button
                      variant="text"
                      onClick={() => { fetchLastUpdated(); fetchCronStatus(); }}
                      size="small"
                    >
                      Refresh Status
                    </Button>
                  </Box>
                  
                  {cronStatus && (
                    <Box mb={2}>
                      <Chip
                        label={cronStatus.configured ? 'Cron configured' : 'Cron not configured'}
                        color={cronStatus.configured ? 'success' : 'warning'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {cronStatus.configured && (
                        <Typography variant="caption" color="text.secondary" component="span">
                          {cronStatus.schedule}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {standingsUpdateMessage && (
                    <Alert
                      severity={standingsUpdateMessage.startsWith('Standings updated') ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                      onClose={() => setStandingsUpdateMessage(null)}
                    >
                      {standingsUpdateMessage}
                    </Alert>
                  )}
                  
                  {cronTestMessage && (
                    <Alert
                      severity={cronTestMessage.includes('successful') ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                      onClose={() => setCronTestMessage(null)}
                    >
                      {cronTestMessage}
                    </Alert>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Tables List */}
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Tables
                  </Typography>
                  {dbInfo.tables && dbInfo.tables.length > 0 ? (
                    dbInfo.tables.map((table) => (
                      <Accordion key={table.name} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" mr={2}>
                            <Typography fontWeight="600">{table.name}</Typography>
                            <Box display="flex" gap={2}>
                              <Chip 
                                label={`${table.rowCount} rows`} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${table.columns?.length || 0} columns`} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          {/* Table Schema */}
                          <Typography variant="subtitle2" fontWeight="600" mb={1}>
                            Schema:
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Column</strong></TableCell>
                                  <TableCell><strong>Type</strong></TableCell>
                                  <TableCell align="center"><strong>Nullable</strong></TableCell>
                                  <TableCell><strong>Default</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {table.columns && table.columns.length > 0 ? (
                                  table.columns.map((col, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{col.name}</TableCell>
                                      <TableCell>{col.type}</TableCell>
                                      <TableCell align="center">
                                        {col.nullable ? 'Yes' : 'No'}
                                      </TableCell>
                                      <TableCell>{col.default || '-'}</TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} align="center">
                                      {typeof table.error === 'string' ? table.error : 'No columns found'}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          {/* Table Data */}
                          <Box mt={2}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => fetchTableData(table.name)}
                              disabled={loadingTable[table.name]}
                              startIcon={loadingTable[table.name] ? <CircularProgress size={16} /> : null}
                            >
                              {loadingTable[table.name] ? 'Loading...' : 'Load Data'}
                            </Button>
                            
                            {tableData[table.name] && (
                              <Box mt={2}>
                                {tableData[table.name].error ? (
                                  <Alert severity="error">{tableData[table.name].error}</Alert>
                                ) : (
                                  <>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                      Showing {tableData[table.name].data?.length || 0} of {tableData[table.name].totalCount || 0} rows
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                      <Table size="small" stickyHeader>
                                        <TableHead>
                                          <TableRow>
                                            {tableData[table.name].data && tableData[table.name].data.length > 0 && 
                                              Object.keys(tableData[table.name].data[0]).map((key) => (
                                                <TableCell key={key}><strong>{key}</strong></TableCell>
                                              ))
                                            }
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {tableData[table.name].data && tableData[table.name].data.length > 0 ? (
                                            tableData[table.name].data.map((row, idx) => (
                                              <TableRow key={idx}>
                                                {Object.values(row).map((value, cellIdx) => (
                                                  <TableCell key={cellIdx}>
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                                                  </TableCell>
                                                ))}
                                              </TableRow>
                                            ))
                                          ) : (
                                            <TableRow>
                                              <TableCell colSpan={100} align="center">
                                                No data
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Alert severity="info">No tables found in database</Alert>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        ) : (
          <StyledCard>
            <CardContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                No database information available. Click refresh to try again.
              </Alert>
              <Button variant="contained" onClick={fetchDatabaseInfo} disabled={loading}>
                Refresh Database Info
              </Button>
            </CardContent>
          </StyledCard>
        )}
      </StyledContainer>
    </Box>
  );
};

export default AdminPage;

