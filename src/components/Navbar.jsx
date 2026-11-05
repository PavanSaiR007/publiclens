import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';
import { parseGpsCoordinates } from '../utils/coordinates';

export default function Navbar({
  account,
  mode,
  query,
  setQuery,
  onSearchCoordinates,
  onOpenReport,
  onLogout,
  theme,
  setTheme,
  emergencyActive,
  onToggleEmergency,
  backendOnline = false,
  onOpenSplash,
  pendingIssues = [],
  pendingReviewIssues = [],
  onOpenNotifications
}) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAudio = () => {
    const state = sound.toggle();
    setAudioEnabled(state);
    if (state) sound.playClick();
  };

  const handleToggleTheme = () => {
    sound.playClick();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="navbar-pro">
      {/* Left: Operational Clock & Status */}
      <div className="navbar-left">
        <div className="clock-badge">
          <span className="live-dot green"></span>
          <span className="clock-text">{currentTime} METRO TIME</span>
        </div>
        <div
          className={`backend-indicator-badge ${backendOnline ? 'online' : 'hybrid'}`}
          title={
            backendOnline
              ? 'Connected to CivicLens Node.js API (Port 3001) with Real-Time SSE Stream'
              : 'Running in Hybrid Local-First Cache Mode'
          }
        >
          <span className={`live-dot ${backendOnline ? 'green' : 'amber'}`}></span>
          <span>{backendOnline ? 'BACKEND LIVE (PORT 3001)' : 'HYBRID OFFLINE'}</span>
        </div>
        <span className="badge-ops-status">
          <Icon.Shield size={12} />
          <span>ALL WARD SENSORS ACTIVE • 99.98% SLA</span>
        </span>
      </div>

      {/* Center: Global Search Bar */}
      <div className="navbar-center">
        <div className="global-search-wrapper">
          <Icon.Search size={15} />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search reports or GPS coordinates: 40.7128, -74.0060"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              const coordinates = parseGpsCoordinates(value);
              if (coordinates) onSearchCoordinates?.(coordinates);
            }}
            aria-label="Search reports by details or GPS coordinates"
          />
          {query && (
            <button className="clear-query-btn" onClick={() => setQuery('')}>
              <Icon.X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Right: Role-aware actions and account controls */}
      <div className="navbar-right">
        {/* Emergency Drill Toggle */}
        <button
          className={`btn-drill-toggle ${emergencyActive ? 'active' : ''}`}
          onClick={() => {
            sound.playClick();
            onToggleEmergency();
          }}
          title="Start or complete a simulated emergency response drill"
        >
          <Icon.AlertTriangle size={13} />
          <span>{emergencyActive ? 'Active Drill ⚠️' : 'Simulate Drill'}</span>
        </button>

        {mode === 'Admin' ? (
          <div className="relative">
            <button onClick={() => setNotificationsOpen((open) => !open)} className="navbar-notice-trigger relative inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50" aria-label={`${pendingIssues.length} pending report notifications`} aria-expanded={notificationsOpen}>
              <Icon.Bell size={17} /> <span className="hidden xl:inline">Requests</span>
              {pendingIssues.length > 0 && <span className="min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-white">{pendingIssues.length > 99 ? '99+' : pendingIssues.length}</span>}
            </button>
            {notificationsOpen && <div className="navbar-notice-menu absolute right-0 top-12 z-[100] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><b className="text-sm text-slate-900">New citizen reports</b><p className="mt-0.5 text-xs text-slate-500">{pendingIssues.length} awaiting review</p></div><span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">Inbox</span></div>
              {pendingIssues.length ? <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{pendingIssues.slice(0, 6).map((issue) => <button key={issue.id} onClick={() => { setNotificationsOpen(false); onOpenNotifications?.(issue); }} className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" /><span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-800">{issue.title}</b><span className="mt-0.5 block truncate text-xs text-slate-500">{issue.place} · {issue.id}</span></span><span className="text-[11px] text-slate-400">{issue.priority || 'Normal'}</span></button>)}</div> : <div className="px-4 py-8 text-center text-sm text-slate-500">You’re all caught up.</div>}
              <button onClick={() => { setNotificationsOpen(false); onOpenNotifications?.(); }} className="w-full border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">Open request inbox →</button>
            </div>}
          </div>
        ) : (
          <div className="relative">
            <button onClick={() => setNotificationsOpen((open) => !open)} className="navbar-notice-trigger relative inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50" aria-label={`${pendingReviewIssues.length} repair photos waiting for your review`} aria-expanded={notificationsOpen}>
              <Icon.Bell size={17} /> <span className="hidden xl:inline">Updates</span>
              {pendingReviewIssues.length > 0 && <span className="min-w-5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-white">{pendingReviewIssues.length > 99 ? '99+' : pendingReviewIssues.length}</span>}
            </button>
            {notificationsOpen && <div className="navbar-notice-menu absolute right-0 top-12 z-[100] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><b className="text-sm text-slate-900">Repair updates</b><p className="mt-0.5 text-xs text-slate-500">{pendingReviewIssues.length} photo{pendingReviewIssues.length === 1 ? '' : 's'} awaiting your review</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Your reports</span></div>
              {pendingReviewIssues.length ? <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{pendingReviewIssues.map((issue) => <button key={issue.id} onClick={() => { setNotificationsOpen(false); onOpenNotifications?.(issue); }} className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-emerald-50"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-800">{issue.title}</b><span className="mt-0.5 block truncate text-xs text-slate-500">Agent uploaded repair proof · {issue.id}</span></span><Icon.ArrowRight size={14} className="mt-1 shrink-0 text-slate-400" /></button>)}</div> : <div className="px-4 py-8 text-center text-sm text-slate-500">No repair photos need your review.</div>}
              <button onClick={() => { setNotificationsOpen(false); onOpenNotifications?.(); }} className="w-full border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Open my reports →</button>
            </div>}
          </div>
        )}

        {/* Audio Mute/Unmute */}
        {mode === 'Citizen' && <button
          className={`icon-round-btn ${audioEnabled ? 'active' : ''}`}
          onClick={handleToggleAudio}
          title={audioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          {audioEnabled ? <Icon.Volume2 size={16} /> : <Icon.VolumeX size={16} />}
        </button>}

        {/* Splash Video Intro Replay */}
        {onOpenSplash && (
          <button
            className="icon-round-btn"
            onClick={() => {
              sound.playClick();
              onOpenSplash();
            }}
            title="Reopen Cinematic Video Splash Screen"
          >
            <Icon.Play size={14} className="text-cyan-400" />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          className="icon-round-btn"
          onClick={handleToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Icon.Sun size={16} /> : <Icon.Moon size={16} />}
        </button>

        {/* Quick Report Issue Button */}
        {mode === 'Citizen' && <button
          className="btn-report-header"
          onClick={() => {
            sound.playClick();
            onOpenReport();
          }}
        >
          <Icon.Plus size={15} />
          <span>Report Defect</span>
        </button>}

        {/* User Pill & Sign Out */}
        <div className="user-profile-pill">
          <div className="avatar-chip">
            {(account?.name || account?.email || 'CL').slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-text">
            <b>{account?.name || (account?.role === 'admin' ? 'City Agent' : 'Citizen')}</b>
            <small>{account?.email || ''}</small>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              sound.playClick();
              onLogout();
            }}
            title="Sign Out"
          >
            <Icon.LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
