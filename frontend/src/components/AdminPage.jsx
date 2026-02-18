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
  Select,
  MenuItem,
  FormControl,
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
const ATLANTIC_TEAMS_LIST = [
  'Boston Bruins', 'Buffalo Sabres', 'Detroit Red Wings', 'Florida Panthers',
  'Montreal Canadiens', 'Ottawa Senators', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
];
const ATLANTIC_TEAMS = new Set(ATLANTIC_TEAMS_LIST);

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
  const [manualStandings, setManualStandings] = useState(() =>
    ATLANTIC_TEAMS_LIST.map((team) => ({ team, gp: 0, w: 0, l: 0, otl: 0, pts: 0 }))
  );
  const [manualSaving, setManualSaving] = useState(false);
  const [predictionsGrid, setPredictionsGrid] = useState([]);
  const [predictionsGridLoading, setPredictionsGridLoading] = useState(false);
  const [predictionsSaveMessage, setPredictionsSaveMessage] = useState(null);
  const [predictionsSaving, setPredictionsSaving] = useState(false);

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

  useEffect(() => {
    if (!authenticated || !dbInfo?.tables) return;
    let cancelled = false;
    setPredictionsGridLoading(true);
    (async () => {
      try {
        const [usersRes, predRes] = await Promise.all([
          axios.get(`${API_BASE}/users`),
          axios.get(`${API_BASE}/predictions/all`).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const allPreds = Array.isArray(predRes.data) ? predRes.data : [];
        const grid = users.map((u) => {
          const pred = allPreds.find((p) => String(p.userId) === String(u.id) || p.userName === u.name);
          const teams = pred?.predictions
            ? [...Array(8)].map((_, i) => (pred.predictions.find((p) => p.rank === i + 1)?.team || ''))
            : ['', '', '', '', '', '', '', ''];
          return { userId: u.id, userName: u.name, teams };
        });
        setPredictionsGrid(grid);
      } catch {
        if (!cancelled) setPredictionsGrid([]);
      } finally {
        if (!cancelled) setPredictionsGridLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authenticated, dbInfo?.tables, API_BASE]);

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

  const fetchNHLStandings = async () => {
    const res = await fetch(`${API_BASE}/nhl-standings-proxy`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.details || err.error || `Proxy returned ${res.status}`;
      if (res.status === 502) {
        throw new Error('Auto-fetch unavailable. Use the manual form below or rely on the daily GitHub Action.');
      }
      throw new Error(msg);
    }
    return await res.json();
  };

  const handleUpdateStandings = async () => {
    setStandingsUpdateMessage(null);
    setStandingsUpdating(true);
    const adminPassword = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
    try {
      const apiData = await fetchNHLStandings();
      const standings = Array.isArray(apiData.standings) && apiData.standings.length >= 8
        ? apiData.standings
        : parseAtlanticStandings(apiData);
      if (standings.length === 0) throw new Error('No Atlantic Division teams in response');

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
      setStandingsUpdateMessage(
        errorStr.includes('Auto-fetch unavailable') || errorStr.includes('502') || errorStr.includes('Could not load')
          ? 'Auto-fetch unavailable. Use the manual form below to enter standings, or wait for the daily GitHub Action.'
          : errorStr
      );
    } finally {
      setStandingsUpdating(false);
    }
  };

  const handleManualStandingsChange = (index, field, value) => {
    const n = Number(value);
    setManualStandings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: isNaN(n) ? 0 : n };
      return next;
    });
  };

  const handlePredictionsGridChange = (userIndex, rankIndex, team) => {
    setPredictionsGrid((prev) => {
      const next = prev.map((row, i) =>
        i !== userIndex ? row : { ...row, teams: row.teams.map((t, j) => (j === rankIndex ? team : t)) }
      );
      return next;
    });
  };

  const handleSavePredictions = async () => {
    setPredictionsSaveMessage(null);
    setPredictionsSaving(true);
    const adminPassword = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
    try {
      let saved = 0;
      for (const row of predictionsGrid) {
        const teams = row.teams.filter(Boolean);
        if (teams.length !== 8 || new Set(teams).size !== 8) continue;
        const predictions = row.teams.map((team, i) => ({ team, rank: i + 1 }));
        await axios.post(
          `${API_BASE}/admin/predictions`,
          { userId: row.userId, predictions },
          { headers: { 'x-admin-password': adminPassword } }
        );
        saved++;
      }
      setPredictionsSaveMessage(saved ? `Saved predictions for ${saved} user(s).` : 'Fill all 8 positions with unique teams per user to save.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save';
      setPredictionsSaveMessage(typeof msg === 'string' ? msg : 'Failed to save');
    } finally {
      setPredictionsSaving(false);
    }
  };

  const handleSaveManualStandings = async () => {
    setStandingsUpdateMessage(null);
    setManualSaving(true);
    const adminPassword = sessionStorage.getItem('admin_authenticated') === 'true' ? 'hunter' : '';
    try {
      const standings = manualStandings.map((s) => ({
        team: s.team,
        gp: Number(s.gp) || 0,
        w: Number(s.w) || 0,
        l: Number(s.l) || 0,
        otl: Number(s.otl) || 0,
        pts: Number(s.pts) || 0,
      }));
      const response = await axios.post(
        `${API_BASE}/standings/update-now`,
        { standings },
        { headers: { 'x-admin-password': adminPassword } }
      );
      if (response.data.success) {
        setStandingsUpdateMessage(`Standings saved (${response.data.updated ?? 8} teams).`);
        fetchLastUpdated();
        refreshStandings?.();
      } else {
        setStandingsUpdateMessage(response.data.message || response.data.error || 'Save failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message;
      setStandingsUpdateMessage(typeof errorMsg === 'string' ? errorMsg : err.message || 'Failed to save');
    } finally {
      setManualSaving(false);
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
                    To update now: use the manual form below (always works), or run from your computer in the repo folder: <code style={{ fontSize: '0.85em' }}>npm run update-standings</code> (set env STANDINGS_INGEST_SECRET and optionally STANDINGS_INGEST_URL first).
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

                  <Typography variant="subtitle2" fontWeight="600" sx={{ mt: 3, mb: 1 }}>
                    Or enter standings manually
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    If auto-fetch fails, look up current Atlantic Division standings (e.g. NHL.com or ESPN) and enter points below.
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxWidth: 720 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Team</strong></TableCell>
                          <TableCell align="right">GP</TableCell>
                          <TableCell align="right">W</TableCell>
                          <TableCell align="right">L</TableCell>
                          <TableCell align="right">OTL</TableCell>
                          <TableCell align="right">Pts</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {manualStandings.map((row, index) => (
                          <TableRow key={row.team}>
                            <TableCell>{row.team}</TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0, style: { width: 56 } }}
                                value={row.gp}
                                onChange={(e) => handleManualStandingsChange(index, 'gp', e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0, style: { width: 56 } }}
                                value={row.w}
                                onChange={(e) => handleManualStandingsChange(index, 'w', e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0, style: { width: 56 } }}
                                value={row.l}
                                onChange={(e) => handleManualStandingsChange(index, 'l', e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0, style: { width: 56 } }}
                                value={row.otl}
                                onChange={(e) => handleManualStandingsChange(index, 'otl', e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0, style: { width: 56 } }}
                                value={row.pts}
                                onChange={(e) => handleManualStandingsChange(index, 'pts', e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Button
                    variant="outlined"
                    onClick={handleSaveManualStandings}
                    disabled={manualSaving}
                    startIcon={manualSaving ? <CircularProgress size={18} /> : null}
                  >
                    {manualSaving ? 'Saving…' : 'Save manual standings'}
                  </Button>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Manual entry: user predictions (users x positions) */}
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    User predictions (manual entry)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter each user&apos;s predicted order (1–8) by choosing a team per position. Each user must have 8 unique teams.
                  </Typography>
                  {predictionsGridLoading ? (
                    <Box display="flex" alignItems="center" gap={1} py={2}>
                      <CircularProgress size={24} />
                      <Typography variant="body2">Loading users and predictions…</Typography>
                    </Box>
                  ) : (
                    <>
                      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', mb: 2 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>User</TableCell>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
                                <TableCell key={r} align="center" sx={{ fontWeight: 600, minWidth: 140 }}>
                                  Position {r}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {predictionsGrid.map((row, userIndex) => (
                              <TableRow key={row.userId}>
                                <TableCell sx={{ fontWeight: 500 }}>{row.userName}</TableCell>
                                {row.teams.map((team, rankIndex) => (
                                  <TableCell key={rankIndex} align="center" padding="none">
                                    <FormControl size="small" sx={{ minWidth: 130, mx: 0.5 }}>
                                      <Select
                                        value={team || ''}
                                        displayEmpty
                                        onChange={(e) => handlePredictionsGridChange(userIndex, rankIndex, e.target.value)}
                                        renderValue={(v) => v || '—'}
                                      >
                                        <MenuItem value="">—</MenuItem>
                                        {ATLANTIC_TEAMS_LIST.map((t) => (
                                          <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Button
                        variant="contained"
                        onClick={handleSavePredictions}
                        disabled={predictionsSaving || predictionsGrid.length === 0}
                        startIcon={predictionsSaving ? <CircularProgress size={18} /> : null}
                      >
                        {predictionsSaving ? 'Saving…' : 'Save predictions'}
                      </Button>
                      {predictionsSaveMessage && (
                        <Alert
                          severity={predictionsSaveMessage.startsWith('Saved') ? 'success' : 'info'}
                          sx={{ mt: 2 }}
                          onClose={() => setPredictionsSaveMessage(null)}
                        >
                          {predictionsSaveMessage}
                        </Alert>
                      )}
                    </>
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

