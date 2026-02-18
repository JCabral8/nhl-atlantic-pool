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

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    if (isAuth) {
      setAuthenticated(true);
      setPasswordModalOpen(false);
      fetchDatabaseInfo();
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
      setError(error.response?.data?.error || 'Failed to authenticate');
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
      // Set dbInfo to empty object so UI still renders
      setDbInfo({ tables: [], error: errorMsg });
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
      setTableData(prev => ({ ...prev, [tableName]: { error: error.response?.data?.error || 'Failed to load data' } }));
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

  const handleUpdateStandings = async () => {
    setStandingsUpdateMessage(null);
    setStandingsUpdating(true);
    try {
      const adminPassword = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
      const response = await axios.post(`${API_BASE}/standings/update-now`, {}, {
        headers: { 'x-admin-password': adminPassword },
      });
      if (response.data.success) {
        setStandingsUpdateMessage(`Standings updated successfully (${response.data.updated ?? 0} teams).`);
        refreshStandings?.();
      } else {
        setStandingsUpdateMessage(response.data.message || response.data.error || 'Update failed');
      }
    } catch (err) {
      setStandingsUpdateMessage(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update standings');
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
                    handlePasswordSubmit();
                  }
                }}
                error={!!error}
                helperText={error}
                sx={{ mt: 2 }}
              />
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
        ) : dbInfo || !loading ? (
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
                      label={`Type: ${dbInfo.databaseType}`} 
                      color="primary" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Status: ${dbInfo.connectionStatus}`} 
                      color={dbInfo.connectionStatus === 'connected' ? 'success' : 'error'}
                      variant="outlined"
                    />
                    <Chip 
                      label={`Database: ${dbInfo.databaseName}`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Tables: ${dbInfo.tables?.length || 0}`} 
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
                    Fetch latest Atlantic Division standings from the NHL API and save to the database.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleUpdateStandings}
                    disabled={standingsUpdating}
                    startIcon={standingsUpdating ? <CircularProgress size={20} /> : <UpdateIcon />}
                  >
                    {standingsUpdating ? 'Updating…' : 'Update NHL standings'}
                  </Button>
                  {standingsUpdateMessage && (
                    <Alert
                      severity={standingsUpdateMessage.startsWith('Standings updated') ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                      onClose={() => setStandingsUpdateMessage(null)}
                    >
                      {standingsUpdateMessage}
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
                                      {table.error || 'No columns found'}
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

