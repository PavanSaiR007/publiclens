import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CityMap3D from './components/CityMap3D';
import CityMap2D from './components/CityMap2D';
import RealCityMap from './components/RealCityMap';
import IssueDetailModal from './components/IssueDetailModal';
import ReportModal from './components/ReportModal';
import ResolutionModal from './components/ResolutionModal';
import AdminTriage from './components/AdminTriage';
import RewardsHub from './components/RewardsHub';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EmergencyAlertBanner from './components/EmergencyAlertBanner';
import EmergencyDrills, { DRILL_SCENARIOS } from './components/EmergencyDrills';
import ResolutionGallery from './components/ResolutionGallery';
import AuthModal from './components/AuthModal';
import SplashPage from './components/SplashPage';
import { Icon } from './components/Icons';
import { initialIssues } from './data/seedData';
import { sound } from './utils/audio';
import { civicApi } from './utils/api';
import { distanceBetweenCoordinatesMeters, parseGpsCoordinates } from './utils/coordinates';
import './components/CityMapLight.css';
import ServiceLevels from './components/ServiceLevels';

const STORAGE_KEY = 'civiclens-issues-v2';
const POINTS_KEY = 'civiclens-points-v2';
const DRILLS_KEY = 'civiclens-emergency-drills-v1';

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('civiclens-theme');
      return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
    } catch {
      return 'light';
    }
  });

  const [backendOnline, setBackendOnline] = useState(false);

  const [showSplash, setShowSplash] = useState(true);

  const [auth, setAuth] = useState(() => {
    try {
      const saved = sessionStorage.getItem('civiclens-session-v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const authRef = useRef(auth);

  const [activeTab, setActiveTab] = useState('Overview');
  const mode = auth?.role === 'admin' ? 'Admin' : 'Citizen';
  const [mapViewMode, setMapViewMode] = useState('REAL');
  const [emergencyDrills, setEmergencyDrills] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRILLS_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const activeDrill = emergencyDrills.find((drill) => drill.status === 'Active') || null;
  const emergencyActive = Boolean(activeDrill);

  const [issues, setIssues] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialIssues;
  });

  const [selectedIssue, setSelectedIssue] = useState(() => issues[0] || null);

  // Modals & Pin Drop Mode
  const [showReportModal, setShowReportModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [inspectingDossier, setInspectingDossier] = useState(null);
  const [isPinDropActive, setIsPinDropActive] = useState(false);
  const [droppedCoord, setDroppedCoord] = useState(null);

  // Search & Filter
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Points
  const [points, setPoints] = useState(() => {
    try {
      const savedSession = JSON.parse(sessionStorage.getItem('civiclens-session-v2') || 'null');
      const saved = localStorage.getItem(`${POINTS_KEY}:${(savedSession?.email || 'guest').trim().toLowerCase()}`);
      return saved === null ? 420 : Number(saved);
    } catch {
      return 420;
    }
  });

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const startEmergencyDrill = (scenario) => {
    if (!scenario || activeDrill) return;
    const drillReport = {
      id: `DRILL-${Date.now().toString(36).toUpperCase()}`,
      title: scenario.alert,
      scenarioId: scenario.id,
      level: scenario.level,
      area: scenario.area,
      guidance: scenario.guidance,
      color: scenario.color,
      status: 'Active',
      startedAt: new Date().toISOString(),
      startedBy: auth?.name || 'CivicLens operator',
      simulationOnly: true
    };
    setEmergencyDrills((previous) => [drillReport, ...previous]);
    setActiveTab('Emergency drills');
    showToast(`${scenario.title} started. A drill report was added to the Drill Center.`, 'info');
    sound.playAlert();
  };

  const endEmergencyDrill = () => {
    if (!activeDrill) return;
    const endedAt = new Date().toISOString();
    setEmergencyDrills((previous) => previous.map((drill) => drill.id === activeDrill.id
      ? { ...drill, status: 'Completed', endedAt }
      : drill));
    showToast(`${activeDrill.id} marked complete. Drill report saved.`, 'success');
  };

  const toggleEmergencyDrill = () => {
    if (activeDrill) {
      endEmergencyDrill();
      return;
    }
    startEmergencyDrill(DRILL_SCENARIOS[0]);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem(DRILLS_KEY, JSON.stringify(emergencyDrills));
  }, [emergencyDrills]);

  useEffect(() => {
    if (auth?.email) localStorage.setItem(`${POINTS_KEY}:${auth.email.trim().toLowerCase()}`, String(points));
  }, [points, auth?.email]);

  useEffect(() => {
    localStorage.setItem('civiclens-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  // Synchronize with backend API & Real-time Server-Sent Events (SSE)
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      const health = await civicApi.checkHealth();
      if (!isMounted) return;
      setBackendOnline(health.online);

      if (health.online) {
        const { data, isLive } = await civicApi.getIssues();
        if (isMounted && isLive && Array.isArray(data) && data.length > 0) {
          setIssues(data);
          if (!selectedIssue && data.length > 0) {
            setSelectedIssue(data[0]);
          }
        }
      }
    }

    syncWithBackend();

    // Subscribe to real-time events broadcast by the backend
    const unsubscribe = civicApi.subscribeLiveEvents(
      ({ type, data }) => {
        if (!isMounted) return;

        if (type === 'ISSUE_CREATED') {
          setIssues((prev) => {
            if (prev.some((i) => i.id === data.id)) return prev;
            return [data, ...prev];
          });
          showToast(
            authRef.current?.role === 'admin'
              ? `New citizen request ${data.id} is waiting in your inbox.`
              : `New city report ${data.id} was registered.`,
            'info'
          );
        } else if (type === 'ISSUE_UPDATED') {
          setIssues((prev) => prev.map((i) => (i.id === data.id ? { ...i, ...data } : i)));
          setSelectedIssue((curr) => (curr && curr.id === data.id ? { ...curr, ...data } : curr));
          setInspectingDossier((curr) => (curr && curr.id === data.id ? { ...curr, ...data } : curr));
          if (data.status === 'Awaiting citizen confirmation'
            && data.citizenReviewStatus === 'pending'
            && (data.reporterEmail || '').trim().toLowerCase() === authRef.current?.email?.trim().toLowerCase()) {
            showToast(`The city team uploaded repair proof for ${data.id}. Please review the before-and-after photos.`, 'info');
          }
        } else if (type === 'ISSUE_UPVOTED') {
          setIssues((prev) =>
            prev.map((i) => (i.id === data.id ? { ...i, upvotes: data.upvotes } : i))
          );
        } else if (type === 'ISSUE_RESOLVED') {
          setIssues((prev) => prev.map((i) => (i.id === data.id ? { ...i, ...data } : i)));
          setSelectedIssue((curr) => (curr && curr.id === data.id ? { ...curr, ...data } : curr));
          showToast(`✓ Ticket ${data.id} verified and resolved!`, 'success');
        } else if (type === 'ISSUE_DELETED') {
          setIssues((prev) => prev.filter((i) => i.id !== data.id));
        } else if (type === 'DATABASE_RESET') {
          civicApi.getIssues().then(({ data: freshIssues }) => {
            if (isMounted && freshIssues) setIssues(freshIssues);
          });
        }
      },
      (isLiveOnline) => {
        if (isMounted) setBackendOnline(isLiveOnline);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogin = async (userSession) => {
    sessionStorage.setItem('civiclens-session-v2', JSON.stringify(userSession));
    const scopedPoints = localStorage.getItem(`${POINTS_KEY}:${userSession.email.trim().toLowerCase()}`);
    setPoints(scopedPoints === null ? 420 : Number(scopedPoints));
    setAuth(userSession);
    setActiveTab('Overview');
    showToast(`Welcome back, ${userSession.name || userSession.email}!`, 'success');
    civicApi.login(userSession.email, '', userSession.role).catch(() => {});
  };

  const handleLogout = () => {
    sessionStorage.removeItem('civiclens-session-v2');
    setAuth(null);
    setShowReportModal(false);
    setIsPinDropActive(false);
  };

  const handleUpvote = (id) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, upvotes: (i.upvotes || 0) + 1 } : i))
    );
    civicApi.upvoteIssue(id);
    showToast('Upvote recorded! Urgency boosted for city crew.', 'success');
  };

  const handleUpdateStatus = (id, newStatus) => {
    const log = {
      time: 'Just now',
      event: `Status updated to ${newStatus} by ${auth?.name || 'Admin'}`
    };
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            status: newStatus,
            auditTrail: [log, ...(i.auditTrail || [])]
          };
        }
        return i;
      })
    );
    setInspectingDossier((current) => current?.id === id
      ? { ...current, status: newStatus, auditTrail: [log, ...(current.auditTrail || [])] }
      : current);
    setSelectedIssue((current) => current?.id === id
      ? { ...current, status: newStatus, auditTrail: [log, ...(current.auditTrail || [])] }
      : current);
    civicApi.updateIssue(id, { status: newStatus });
    showToast(`Issue ${id} marked as ${newStatus}.`, 'success');
  };

  const handleAssignCrew = (id, crewName) => {
    const log = { time: 'Just now', event: `Assigned to ${crewName}` };
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            status: 'Assigned',
            assignedCrew: crewName,
            auditTrail: [log, ...(i.auditTrail || [])]
          };
        }
        return i;
      })
    );
    setInspectingDossier((current) => current?.id === id
      ? { ...current, status: 'Assigned', assignedCrew: crewName, auditTrail: [log, ...(current.auditTrail || [])] }
      : current);
    setSelectedIssue((current) => current?.id === id
      ? { ...current, status: 'Assigned', assignedCrew: crewName, auditTrail: [log, ...(current.auditTrail || [])] }
      : current);
    civicApi.updateIssue(id, { status: 'Assigned', assignedCrew: crewName });
    showToast(`Dispatched to ${crewName}!`, 'success');
  };

  const handleMapPinDrop = (coord) => {
    setIsPinDropActive(false);
    setDroppedCoord(coord);
    setShowReportModal(true);
    showToast(`Pin locked at Lat ${coord.lat.toFixed(4)}, Lng ${coord.lng.toFixed(4)}! Opening reporter...`, 'success');
  };

  const handleReportSubmit = (data) => {
    const duplicateImage = data.imageHash && issues.find((issue) => issue.imageHash === data.imageHash);
    if (duplicateImage) {
      showToast(`Report rejected: this photo is already attached to ${duplicateImage.id}.`, 'error');
      return;
    }
    const newId = `CIV-${1050 + issues.length}`;
    const hasGpsOnCityMap = data.gps
      && data.gps.lat >= 40.7 && data.gps.lat <= 40.78
      && data.gps.lng >= -74.02 && data.gps.lng <= -73.96;
    const gpsMapPosition = hasGpsOnCityMap
      ? {
          x: Math.round((data.gps.lng + 74.02) / 0.0006),
          y: Math.round(100 - (data.gps.lat - 40.7) / 0.0008)
        }
      : null;
    const newIssue = {
      id: newId,
      type: data.category,
      title: data.title,
      description: data.description,
      place: data.place,
      priority: data.priority,
      department: data.department,
      status: 'Reported',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      confidence: data.confidence,
      tone:
        data.category === 'Road damage'
          ? 'blue'
          : data.category === 'Street lighting'
          ? 'green'
          : data.category === 'Waste management'
          ? 'amber'
          : 'violet',
      x: droppedCoord?.x ?? gpsMapPosition?.x ?? null,
      y: droppedCoord?.y ?? gpsMapPosition?.y ?? null,
      lat: droppedCoord?.lat ?? data.gps?.lat ?? null,
      lng: droppedCoord?.lng ?? data.gps?.lng ?? null,
      gpsAccuracy: data.gpsAccuracy ?? null,
      image: data.image,
      imageHash: data.imageHash || null,
      evidencePhotos: data.evidencePhotos || [],
      hasAfter: false,
      upvotes: 1,
      reporter: data.isAnonymous ? 'Anonymous Citizen' : (auth?.name || 'Jordan Davis'),
      reporterEmail: auth?.email?.trim().toLowerCase() || '',
      reporterId: auth?.email?.trim().toLowerCase() || '',
      adaAffected: data.adaAffected,
      schoolZone: data.schoolZone,
      bikeLaneBlocked: data.bikeLaneBlocked,
      isAnonymous: data.isAnonymous,
      auditTrail: [
        { time: 'Just now', event: `Report submitted by ${data.isAnonymous ? 'Anonymous Citizen' : (auth?.name || 'Citizen')}` },
        { time: 'Just now', event: `AI triage verified: ${data.category} (${data.confidence}% confidence)` }
      ]
    };

    setIssues([newIssue, ...issues]);
    setSelectedIssue(newIssue);
    setShowReportModal(false);
    setDroppedCoord(null);
    setPoints((p) => p + 25);
    civicApi.createIssue(newIssue).then((result) => {
      if (result.success) return;
      setIssues((previous) => previous.filter((issue) => issue.id !== newId));
      setSelectedIssue((current) => current?.id === newId ? selectedIssue : current);
      setPoints((current) => Math.max(0, current - 25));
      showToast(result.error || 'This report was rejected because its photo is already in use.', 'error');
    });
    showToast(`Report ${newId} registered in municipal registry! +25 Karma Points.`, 'success');
  };

  const handleResolutionSubmit = (resolutionData) => {
    if (!selectedIssue || selectedIssue.status !== 'In progress'
      || !resolutionData.afterImage || !resolutionData.agentConfirmed
      || !resolutionData.analysis || resolutionData.analysis.comparisonFailed
      || !resolutionData.analysis.agentApproved) {
      showToast('Upload and compare an after-photo, then confirm the repair as the agent.', 'info');
      return;
    }
    const resolvedId = selectedIssue.id;
    const reviewedAt = new Date().toISOString();
    const afterUploadedAt = resolutionData.afterUploadedAt || reviewedAt;
    const verifiedAnalysis = {
      ...resolutionData.analysis,
      isRepaired: false,
      agentApproved: true,
      agentReviewedBy: auth?.name || 'City Agent',
      agentReviewedEmail: auth?.email || '',
      agentReviewedAt: reviewedAt
    };
    const resolutionLog = {
      time: 'Just now',
      event: `Post-construction photo uploaded by ${auth?.name || 'City Agent'} and sent to the reporter for confirmation`
    };
    const proofUpdate = {
      status: 'Awaiting citizen confirmation',
      hasAfter: true,
      afterImage: resolutionData.afterImage,
      afterPhotoName: resolutionData.afterPhotoName,
      afterUploadedAt,
      resolvedAt: null,
      needsRework: false,
      citizenReviewStatus: 'pending',
      citizenReviewRequestedAt: reviewedAt,
      citizenReviewRespondedAt: null,
      analysis: verifiedAnalysis,
      auditTrail: [resolutionLog, ...(selectedIssue.auditTrail || [])]
    };

    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === resolvedId) {
          return { ...i, ...proofUpdate, auditTrail: [resolutionLog, ...(i.auditTrail || [])] };
        }
        return i;
      })
    );
    setSelectedIssue((current) => current?.id === resolvedId
      ? { ...current, ...proofUpdate }
      : current);
    setInspectingDossier(null);

    civicApi.updateIssue(resolvedId, { ...proofUpdate, auditEntry: resolutionLog });
    setShowResolveModal(false);
    showToast(`Repair proof for ${resolvedId} sent to the reporter for confirmation.`, 'success');
  };

  const handleCitizenPhotoReview = (issueId, isFixed) => {
    const issue = issues.find((item) => item.id === issueId);
    const signedInEmail = auth?.email?.trim().toLowerCase();
    if (!issue || issue.status !== 'Awaiting citizen confirmation'
      || (issue.reporterEmail || '').trim().toLowerCase() !== signedInEmail) return;

    const respondedAt = new Date().toISOString();
    const event = isFixed
      ? `Reporter ${auth?.name || signedInEmail} confirmed the repair using the after-photo`
      : `Reporter ${auth?.name || signedInEmail} reported that the repair is still incomplete; returned to the crew`;
    const updatedIssue = {
      ...issue,
      status: isFixed ? 'Resolved' : 'In progress',
      citizenReviewStatus: isFixed ? 'confirmed' : 'rejected',
      citizenReviewRespondedAt: respondedAt,
      resolvedAt: isFixed ? respondedAt : null,
      needsRework: !isFixed,
      reworkNote: isFixed ? undefined : event,
      auditTrail: [{ time: 'Just now', event }, ...(issue.auditTrail || [])]
    };
    setIssues((previous) => previous.map((item) => item.id === issueId ? updatedIssue : item));
    setSelectedIssue(updatedIssue);
    setInspectingDossier(updatedIssue);
    civicApi.updateIssue(issueId, {
      status: updatedIssue.status,
      citizenReviewStatus: updatedIssue.citizenReviewStatus,
      citizenReviewRespondedAt: respondedAt,
      resolvedAt: updatedIssue.resolvedAt,
      needsRework: updatedIssue.needsRework,
      reworkNote: updatedIssue.reworkNote,
      auditEntry: { time: 'Just now', event }
    });

    if (isFixed && signedInEmail) {
      const reporterPointsKey = `${POINTS_KEY}:${signedInEmail}`;
      const reporterPoints = Number(localStorage.getItem(reporterPointsKey) ?? 420) + 50;
      localStorage.setItem(reporterPointsKey, String(reporterPoints));
      setPoints(reporterPoints);
      showToast(`You confirmed ${issueId} is fixed. +50 Karma Points.`, 'success');
    } else {
      showToast(`${issueId} returned to the crew for more work.`, 'info');
    }
  };

  const handleIncompleteRepair = ({ afterImage, afterPhotoName, afterUploadedAt, analysis } = {}) => {
    if (!selectedIssue || selectedIssue.status !== 'In progress' || !afterImage || !analysis || analysis.comparisonFailed) return;
    const issueId = selectedIssue.id;
    const reviewedAt = new Date().toISOString();
    const reviewedAnalysis = {
      ...analysis,
      agentApproved: false,
      agentReviewedBy: auth?.name || 'City Agent',
      agentReviewedEmail: auth?.email || '',
      agentReviewedAt: reviewedAt
    };
    const log = {
      time: 'Just now',
      event: `Agent ${auth?.name || 'City Agent'} reviewed the after-photo and marked the repair incomplete${afterPhotoName ? ` (${afterPhotoName})` : ''}. Work remains in progress.`
    };
    const updatedIssue = {
      ...selectedIssue,
      status: 'In progress',
      needsRework: true,
      hasAfter: true,
      afterImage,
      afterPhotoName: afterPhotoName || '',
      afterUploadedAt: afterUploadedAt || reviewedAt,
      analysis: reviewedAnalysis,
      auditTrail: [log, ...(selectedIssue.auditTrail || [])]
    };
    setIssues((prev) => prev.map((item) => item.id === issueId ? updatedIssue : item));
    setSelectedIssue(updatedIssue);
    setInspectingDossier((current) => current?.id === issueId ? updatedIssue : current);
    civicApi.updateIssue(issueId, {
      status: 'In progress',
      needsRework: true,
      hasAfter: true,
      afterImage,
      afterPhotoName: afterPhotoName || '',
      afterUploadedAt: updatedIssue.afterUploadedAt,
      analysis: reviewedAnalysis,
      reworkNote: log.event
    });
    setShowResolveModal(false);
    showToast(`Issue ${issueId} needs more repair work and remains In progress.`, 'info');
  };

  const filteredIssues = useMemo(() => {
    const gpsSearch = parseGpsCoordinates(query);
    return issues.filter((item) => {
      if (filterStatus !== 'All' && item.status !== filterStatus) return false;
      if (filterCategory !== 'All' && item.type !== filterCategory) return false;
      if (query.trim()) {
        if (gpsSearch) {
          if (item.lat === null || item.lat === undefined || item.lat === '' || item.lng === null || item.lng === undefined || item.lng === '') return false;
          const issueCoordinates = { lat: Number(item.lat), lng: Number(item.lng) };
          if (!Number.isFinite(issueCoordinates.lat) || !Number.isFinite(issueCoordinates.lng)
            || distanceBetweenCoordinatesMeters(gpsSearch, issueCoordinates) > 150) return false;
        } else {
          const coordinatesText = item.lat != null && item.lng != null
            ? `${item.lat}, ${item.lng} ${Number(item.lat).toFixed(5)}, ${Number(item.lng).toFixed(5)}`
            : '';
          const text = `${item.title} ${item.place} ${item.type} ${item.id} ${item.department} ${coordinatesText}`.toLowerCase();
          if (!text.includes(query.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [issues, filterStatus, filterCategory, query]);

  const ownedIssues = useMemo(() => {
    const email = auth?.email?.trim().toLowerCase();
    if (!email) return [];
    return issues.filter((item) => (item.reporterEmail || item.reporterId || '').toLowerCase() === email);
  }, [issues, auth?.email]);
  const pendingCitizenReviews = useMemo(() => {
    const email = auth?.email?.trim().toLowerCase();
    if (!email) return [];
    return issues.filter((item) => item.status === 'Awaiting citizen confirmation'
      && item.citizenReviewStatus === 'pending'
      && (item.reporterEmail || '').trim().toLowerCase() === email);
  }, [issues, auth?.email]);
  const myIssues = useMemo(() => {
    const visibleIds = new Set(filteredIssues.map((item) => item.id));
    return ownedIssues.filter((item) => visibleIds.has(item.id));
  }, [ownedIssues, filteredIssues]);
  const pendingIssues = useMemo(() => issues
    .filter((item) => item.status === 'Reported')
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [issues]);
  const mapIssues = useMemo(() => filteredIssues.filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y)), [filteredIssues]);
  const geoMapIssues = useMemo(() => filteredIssues.filter((item) =>
    Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))
    && Number(item.lat) >= -90 && Number(item.lat) <= 90
    && Number(item.lng) >= -180 && Number(item.lng) <= 180
  ), [filteredIssues]);

  const exportReportsCsv = () => {
    const columns = ['Issue ID', 'Title', 'Category', 'Location', 'Priority', 'Department', 'Status', 'Reporter', 'Latitude', 'Longitude', 'Created at'];
    const exportList = mode === 'Admin' ? filteredIssues : myIssues;
    const rows = exportList.map((issue) => [issue.id, issue.title, issue.type, issue.place, issue.priority || 'Normal', issue.assignedCrew || issue.department, issue.status, issue.isAnonymous ? 'Anonymous' : issue.reporter, issue.lat ?? '', issue.lng ?? '', issue.createdAt || issue.time]);
    const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'civiclens-reports.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (showSplash) {
    return (
      <SplashPage
        onEnter={() => {
          sound.playSuccess();
          setShowSplash(false);
        }}
      />
    );
  }

  if (!auth) {
    return <AuthModal onLogin={handleLogin} />;
  }

  return (
    <div className={`app-root theme-${theme}`}>
      {toast && (
        <div className={`toast-notification-banner ${toast.type}`}>
          <Icon.CheckCircle size={15} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Emergency Alert Drill Banner */}
      <EmergencyAlertBanner
        isActive={emergencyActive}
        activeDrill={activeDrill}
        onToggle={endEmergencyDrill}
        onOpenDashboard={() => setActiveTab('Emergency drills')}
      />

      <Navbar
        account={auth}
        mode={mode}
        query={query}
        setQuery={setQuery}
        onSearchCoordinates={() => {
          setMapViewMode('REAL');
          setActiveTab('Explore map');
        }}
        onOpenReport={() => setShowReportModal(true)}
        pendingIssues={pendingIssues}
        pendingReviewIssues={pendingCitizenReviews}
        onOpenNotifications={(issue) => {
          setActiveTab(mode === 'Admin' ? 'Review queue' : 'My reports');
          if (issue) setInspectingDossier(issue);
        }}
        onLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
        emergencyActive={emergencyActive}
        onToggleEmergency={toggleEmergencyDrill}
        backendOnline={backendOnline}
        onOpenSplash={() => setShowSplash(true)}
      />

      <div className="layout-body-wrapper">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mode={mode}
          issuesCount={mode === 'Admin' ? issues.length : ownedIssues.length}
          pendingCount={pendingIssues.length}
          points={points}
        />

        <main className="main-viewport">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'Overview' && mode === 'Citizen' && (
            <section className="overview-page citizen-overview">
              <div className="overview-hero citizen-hero">
                <div className="overview-hero-glow" />
                <div className="overview-hero-content">
                  <div className="overview-hero-copy">
                    <span className="overview-eyebrow"><Icon.MapPin size={14} /> YOUR CITY, YOUR VOICE</span>
                    <h1 className="overview-heading">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {auth?.name?.split(' ')[0] || 'neighbor'}.</h1>
                    <p className="overview-description">Spot something that needs attention? Send a photo and location to the city team, then follow every update here.</p>
                  </div>
                  <button onClick={() => setShowReportModal(true)} className="overview-primary-cta"><Icon.Plus size={17} /> Report an issue</button>
                </div>
              </div>

              {pendingCitizenReviews.length > 0 && (
                <div className="overview-review-card">
                  <div className="overview-review-icon"><Icon.Bell size={18} /></div>
                  <div className="overview-review-copy">
                    <span>YOUR REVIEW IS NEEDED</span>
                    <h2>The city team uploaded repair proof</h2>
                    <p>{pendingCitizenReviews[0].title} · {pendingCitizenReviews[0].place}</p>
                    {pendingCitizenReviews.length > 1 && <small>{pendingCitizenReviews.length - 1} more repair update{pendingCitizenReviews.length === 2 ? '' : 's'} waiting for you</small>}
                  </div>
                  <div className="overview-review-photos">
                    <figure><img src={pendingCitizenReviews[0].image} alt="Original reported issue" /><figcaption>BEFORE</figcaption></figure>
                    <figure><img src={pendingCitizenReviews[0].afterImage} alt="Agent repair proof" /><figcaption>AFTER</figcaption></figure>
                  </div>
                  <button onClick={() => setInspectingDossier(pendingCitizenReviews[0])} className="overview-review-cta">Review repair <Icon.ArrowRight size={15} /></button>
                </div>
              )}

              <div className="overview-metric-grid">
                {[
                  { label: 'My reports', value: ownedIssues.length, hint: 'Reports submitted from this account', icon: <Icon.Camera size={18} />, tone: 'teal' },
                  { label: 'Being handled', value: ownedIssues.filter((item) => ['Verified', 'Assigned', 'In progress', 'Awaiting citizen confirmation'].includes(item.status)).length, hint: 'With the city team or ready for review', icon: <Icon.Clock size={18} />, tone: 'blue' },
                  { label: 'Resolved', value: ownedIssues.filter((item) => item.status === 'Resolved').length, hint: 'Closed with completion evidence', icon: <Icon.CheckCircle size={18} />, tone: 'green' },
                  { label: 'Civic points', value: points, hint: 'Earn points for useful reports', icon: <Icon.Award size={18} />, tone: 'amber' }
                ].map((metric) => <div key={metric.label} className="overview-metric-card"><div className={`overview-metric-icon ${metric.tone}`}>{metric.icon}</div><p className="overview-metric-label">{metric.label}</p><div className="overview-metric-value">{metric.value}</div><p className="overview-metric-hint">{metric.hint}</p></div>)}
              </div>

              <div className="overview-lower-grid">
                <div className="overview-panel">
                  <div className="overview-panel-header"><div><h2>Your latest reports</h2><p>Follow progress and review city updates</p></div><button onClick={() => setActiveTab('My reports')} className="overview-text-action">View all</button></div>
                  {ownedIssues.length > 0 ? (
                    <div className="overview-report-list">
                      {ownedIssues.slice(0, 4).map((item) => (
                        <button key={item.id} onClick={() => setInspectingDossier(item)} className="overview-report-row">
                          <div className="overview-report-thumb">
                            {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="overview-report-copy">
                            <div className="overview-report-title-row">
                              <span className="overview-report-title">{item.title}</span>
                              <span className="overview-report-id">{item.id}</span>
                            </div>
                            <p className="overview-report-place">{item.place} · {item.type}</p>
                          </div>
                          <span className={`overview-status ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="overview-empty-state">
                      <div className="overview-empty-icon"><Icon.Camera size={21} /></div>
                      <h3>No reports yet</h3>
                      <p>Your submissions and city updates will appear here.</p>
                      <button onClick={() => setShowReportModal(true)} className="overview-primary-cta">Create your first report</button>
                    </div>
                  )}
                </div>
                <div className="overview-panel overview-quick-panel"><h2>Quick actions</h2><p className="overview-panel-subtitle">Tools to make a useful report</p><div className="overview-actions-list"><button onClick={() => setActiveTab('Explore map')} className="overview-action-button"><span className="overview-action-icon teal"><Icon.MapPin size={18} /></span><span><b>Explore the city map</b><small>See nearby reports and avoid duplicates</small></span><Icon.ChevronRight size={16} className="overview-action-chevron" /></button><button onClick={() => setActiveTab('Rewards')} className="overview-action-button"><span className="overview-action-icon amber"><Icon.Award size={18} /></span><span><b>Open rewards</b><small>Check points and scratch cards</small></span><Icon.ChevronRight size={16} className="overview-action-chevron" /></button><button onClick={() => setActiveTab('Resolution proof')} className="overview-action-button"><span className="overview-action-icon teal"><Icon.Camera size={18} /></span><span><b>View before &amp; after photos</b><small>Compare completed repair evidence</small></span><Icon.ChevronRight size={16} className="overview-action-chevron" /></button></div><div className="overview-note"><div><Icon.Shield size={15} /> Your report goes to the city team</div><p>Location is attached when you allow GPS or place a pin. The operations team reviews each submission and updates its status.</p></div></div>
              </div>
            </section>
          )}

          {activeTab === 'Overview' && mode === 'Admin' && (
            <section className="overview-page admin-overview">
              <div className="overview-hero admin-hero"><div className="overview-hero-glow" /><div className="overview-hero-content"><div className="overview-hero-copy"><span className="overview-eyebrow"><Icon.Shield size={14} /> Agent workspace</span><h1 className="overview-heading">Operations overview</h1><p className="overview-description">Review citizen requests, route work to the right department, and keep every reporter informed. <span className="overview-hero-support">{issues.length} reports in the registry</span></p></div><div className="overview-hero-actions"><button onClick={() => setActiveTab('Review queue')} className="overview-primary-cta admin-cta"><Icon.Inbox size={17} /> Open requests <span className="overview-cta-count">{pendingIssues.length}</span></button><button onClick={() => setActiveTab('Resolution proof')} className="overview-secondary-cta"><Icon.Camera size={16} /> Repair proof center <span>{issues.filter((item) => item.status === 'In progress').length}</span></button></div></div></div>
              <div className="overview-metric-grid">{[
                { label: 'Need review', value: pendingIssues.length, detail: 'New citizen submissions', icon: <Icon.AlertTriangle size={18} />, tone: 'amber' },
                { label: 'Active work', value: issues.filter((item) => ['Assigned', 'In progress'].includes(item.status)).length, detail: 'Assigned to a response team', icon: <Icon.Truck size={18} />, tone: 'violet' },
                { label: 'Citizen review', value: issues.filter((item) => item.status === 'Awaiting citizen confirmation').length, detail: 'Proof sent to report owners', icon: <Icon.Bell size={18} />, tone: 'blue' },
                { label: 'Resolved', value: issues.filter((item) => item.status === 'Resolved').length, detail: 'Completion recorded', icon: <Icon.CheckCircle size={18} />, tone: 'green' }
              ].map((metric) => <div key={metric.label} className="overview-metric-card"><div className={`overview-metric-icon ${metric.tone}`}>{metric.icon}</div><p className="overview-metric-label">{metric.label}</p><div className="overview-metric-value">{metric.value}</div><p className="overview-metric-hint">{metric.detail}</p></div>)}</div>
              <div className="overview-lower-grid"><div className="overview-panel"><div className="overview-panel-header"><div><h2>Incoming citizen requests</h2><p>Newest reports awaiting verification</p></div><button onClick={() => setActiveTab('Review queue')} className="overview-text-action">View inbox →</button></div>{pendingIssues.slice(0, 5).length ? <div className="overview-report-list">{pendingIssues.slice(0, 5).map((item) => <button key={item.id} onClick={() => { setActiveTab('Review queue'); setInspectingDossier(item); }} className="overview-report-row"><div className="overview-report-thumb">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</div><div className="overview-report-copy"><div className="overview-report-title-row"><span className="overview-report-title">{item.title}</span><span className="overview-report-id">{item.id}</span></div><p className="overview-report-place">{item.place} · {item.type}</p></div><span className={`overview-priority ${item.priority === 'Critical' || item.priority === 'Urgent' ? 'urgent' : 'normal'}`}>{item.priority || 'Normal'}</span></button>)}</div> : <div className="overview-empty-state"><h3>All caught up</h3><p>New citizen reports will appear here.</p></div>}</div><div className="overview-panel overview-snapshot"><h2>Response snapshot</h2><p className="overview-panel-subtitle">Current work by status</p><div className="overview-snapshot-list">{['Reported', 'Verified', 'Assigned', 'In progress', 'Awaiting citizen confirmation', 'Resolved'].map((status) => { const count = issues.filter((item) => item.status === status).length; const ratio = issues.length ? Math.round(count / issues.length * 100) : 0; return <div key={status}><div className="overview-snapshot-label"><span>{status === 'Awaiting citizen confirmation' ? 'Citizen review' : status}</span><b>{count}</b></div><div className="overview-snapshot-track"><div style={{ width: `${ratio}%` }} /></div></div>; })}</div><button onClick={() => setActiveTab('Service levels')} className="overview-outline-action">Open SLA monitor</button><button onClick={() => setActiveTab('Resolution proof')} className="overview-outline-action overview-proof-link">Open repair proof center</button></div></div>
            </section>
          )}

          {/* TAB 2: EXPLORE MAP */}
          {activeTab === 'Explore map' && (
            <div className="fullscreen-map-page">
              <div className="fullscreen-map-header">
                <div>
                  <h2>Metropolitan Digital Twin & GIS Navigator</h2>
                  <p>Explore city assets, infrastructure telemetry, and citizen hazards across all wards.</p>
                </div>
                <div className="fullscreen-controls">
                  {mode === 'Citizen' && <button
                    className={`dim-btn ${isPinDropActive ? 'active pin-active' : ''}`}
                    onClick={() => {
                      sound.playClick();
                      setIsPinDropActive(!isPinDropActive);
                    }}
                  >
                    <Icon.MapPin size={13} />
                    <span>{isPinDropActive ? 'Cancel Pin' : 'Drop Pin on Map'}</span>
                  </button>}

                  <div className="map-dimension-toggle">
                    <button
                      className={`dim-btn ${mapViewMode === '3D' ? 'active' : ''}`}
                      onClick={() => setMapViewMode('3D')}
                    >
                      <Icon.Cube3D size={13} /> 3D Digital Twin
                    </button>
                    <button
                      className={`dim-btn ${mapViewMode === '2D' ? 'active' : ''}`}
                      onClick={() => setMapViewMode('2D')}
                    >
                      <Icon.Layers size={13} /> 2D Tactical
                    </button>
                    <button
                      className={`dim-btn ${mapViewMode === 'REAL' ? 'active' : ''}`}
                      onClick={() => setMapViewMode('REAL')}
                    >
                      <Icon.MapPin size={13} /> Real Streets
                    </button>
                  </div>
                  {mode === 'Citizen' && <button className="btn-primary-gradient" onClick={() => setShowReportModal(true)}>
                    <Icon.Plus size={14} /> Report Incident Here
                  </button>}
                </div>
              </div>

              <div className="fullscreen-canvas-wrapper">
                {mapViewMode === '3D' ? (
                  <CityMap3D
                    issues={mapIssues}
                    selected={selectedIssue}
                    onSelect={(issue) => {
                      setSelectedIssue(issue);
                      setInspectingDossier(issue);
                    }}
                    onPinDrop={handleMapPinDrop}
                    isPinDropActive={isPinDropActive}
                  />
                ) : mapViewMode === '2D' ? (
                  <CityMap2D
                    issues={mapIssues}
                    selected={selectedIssue}
                    onSelect={(issue) => {
                      setSelectedIssue(issue);
                      setInspectingDossier(issue);
                    }}
                    filter={filterStatus}
                    setFilter={setFilterStatus}
                    themeMode={theme}
                    onPinDrop={handleMapPinDrop}
                    isPinDropActive={isPinDropActive}
                  />
                ) : (
                  <RealCityMap
                    issues={geoMapIssues}
                    searchPosition={parseGpsCoordinates(query)}
                    selected={selectedIssue}
                    onSelect={(issue) => {
                      setSelectedIssue(issue);
                      setInspectingDossier(issue);
                    }}
                    themeMode={theme}
                    onPinDrop={handleMapPinDrop}
                    isPinDropActive={isPinDropActive}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RECORDS */}
          {activeTab === 'My reports' && (
            <div className="reports-table-page">
              <div className="reports-header-row">
                <div>
                  <h2>Incident Records & Community Tracking</h2>
                  <p>Track all citizen hazards filed across municipal departments.</p>
                </div>
                <button className="btn-primary-gradient" onClick={() => setShowReportModal(true)}>
                  <Icon.Plus size={15} />
                  <span>Report New Defect</span>
                </button>
              </div>

              <div className="records-toolbar-pro">
                <div className="records-status-filters">{['All', 'Reported', 'Verified', 'Assigned', 'In progress', 'Awaiting citizen confirmation', 'Resolved'].map((status) => <button key={status} className={filterStatus === status ? 'active' : ''} onClick={() => setFilterStatus(status)}>{status === 'All' ? `All (${ownedIssues.length})` : `${status === 'Awaiting citizen confirmation' ? 'Needs review' : status} (${ownedIssues.filter((issue) => issue.status === status).length})`}</button>)}</div>
                <div className="records-toolbar-actions"><select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} aria-label="Filter by category"><option value="All">All categories</option><option>Road damage</option><option>Street lighting</option><option>Waste management</option><option>Public space</option></select><button onClick={exportReportsCsv}><Icon.Share2 size={14} /> Export CSV</button></div>
              </div>

              <div className="records-table-container">
                <div className="records-table-head">
                  <span>Incident ID</span>
                  <span>Defect & Address</span>
                  <span>Category</span>
                  <span>Priority</span>
                  <span>Assigned Unit</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>

                <div className="records-table-body">
                  {myIssues.length === 0 && <div className="records-empty-pro"><Icon.Search size={20} /><b>No reports match these filters</b><span>Clear the search or choose another status or category.</span><button onClick={() => { setQuery(''); setFilterStatus('All'); setFilterCategory('All'); }}>Clear filters</button></div>}
                  {myIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="records-row"
                      onClick={() => {
                        sound.playClick();
                        setInspectingDossier(issue);
                      }}
                    >
                      <span className="col-id">
                        <b>{issue.id}</b>
                      </span>

                      <div className="col-desc">
                        <img src={issue.image} alt={issue.title} className="table-thumb" />
                        <div>
                          <b>{issue.title}</b>
                          <small>{issue.place}</small>
                        </div>
                      </div>

                      <span className="col-cat">
                        <span className={`cat-pill ${issue.tone}`}>{issue.type}</span>
                      </span>

                      <span className="col-priority">
                        <span className={`badge-priority ${(issue.priority || 'Normal').toLowerCase()}`}>
                          {issue.priority || 'Normal'}
                        </span>
                      </span>

                      <span className="col-crew">
                        <small>{issue.assignedCrew || issue.department}</small>
                      </span>

                      <span className="col-status">
                        <span className={`status-pill ${issue.status.toLowerCase().replaceAll(' ', '-')}`}>
                          {issue.status}
                        </span>
                      </span>

                      <span className="col-action">
                        <button className="btn-view-row">
                          <span>Inspect</span>
                          <Icon.ChevronRight size={13} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Resolution proof' && (
            <ResolutionGallery
              issues={mode === 'Admin' ? issues : ownedIssues}
              mode={mode}
              onUploadProof={(issue) => {
                setSelectedIssue(issue);
                setShowResolveModal(true);
              }}
              onOpenIssue={(issue) => {
                setSelectedIssue(issue);
                setInspectingDossier(issue);
              }}
            />
          )}

          {activeTab === 'Emergency drills' && (
            <EmergencyDrills
              drills={emergencyDrills}
              activeDrill={activeDrill}
              onStartDrill={startEmergencyDrill}
              onEndDrill={endEmergencyDrill}
            />
          )}

          {/* TAB 4: CITY INTELLIGENCE & ANALYTICS */}
          {activeTab === 'Analytics' && (
            <AnalyticsDashboard issues={issues} />
          )}

          {activeTab === 'Service levels' && (
            <ServiceLevels
              issues={issues}
              onSelectIssue={(issue) => setInspectingDossier(issue)}
            />
          )}

          {/* TAB 5: REWARDS */}
          {activeTab === 'Rewards' && (
            <RewardsHub
              points={points}
              onPointsChange={(newPts) => setPoints(newPts)}
              issues={ownedIssues}
              citizenName={auth?.name || 'Jordan Davis'}
            />
          )}

          {/* TAB 6: ADMIN TRIAGE */}
          {activeTab === 'Review queue' && mode === 'Admin' && (
            <AdminTriage
              issues={issues}
              onVerify={(id) => handleUpdateStatus(id, 'Verified')}
              onAssignCrew={handleAssignCrew}
              onMarkInProgress={(id) => handleUpdateStatus(id, 'In progress')}
              onOpenResolve={(issue) => {
                setSelectedIssue(issue);
                setShowResolveModal(true);
              }}
              onSelectIssue={(issue) => setInspectingDossier(issue)}
            />
          )}
        </main>
      </div>

      {showReportModal && mode === 'Citizen' && (
        <ReportModal
          onClose={() => {
            setShowReportModal(false);
            setDroppedCoord(null);
          }}
          onSubmit={handleReportSubmit}
          existingIssues={issues}
          initialCoord={droppedCoord}
          accountEmail={auth?.email}
        />
      )}

      {inspectingDossier && (
        <IssueDetailModal
          issue={inspectingDossier}
          mode={mode}
          canReviewResolution={(inspectingDossier.reporterEmail || '').trim().toLowerCase() === auth?.email?.trim().toLowerCase()}
          onCitizenPhotoReview={handleCitizenPhotoReview}
          onClose={() => setInspectingDossier(null)}
          onResolveClick={(issue) => {
            setSelectedIssue(issue);
            setInspectingDossier(null);
            setShowResolveModal(true);
          }}
          onUpdateStatus={handleUpdateStatus}
          onUpvote={handleUpvote}
        />
      )}

      {showResolveModal && selectedIssue && (
        <ResolutionModal
          issue={selectedIssue}
          agentName={auth?.name}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolutionSubmit}
          onIncomplete={handleIncompleteRepair}
        />
      )}
    </div>
  );
}
