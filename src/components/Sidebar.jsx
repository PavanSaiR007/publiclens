import React from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';

export default function Sidebar({
  activeTab,
  setActiveTab,
  mode,
  issuesCount = 0,
  pendingCount = 0,
  points = 0
}) {
  const navItems = mode === 'Admin'
    ? [
        { id: 'Overview', label: 'Operations overview', icon: <Icon.Compass size={17} /> },
        { id: 'Review queue', label: 'Requests inbox', icon: <Icon.Inbox size={17} />, alertCount: pendingCount },
        { id: 'Explore map', label: 'City map', icon: <Icon.Cube3D size={17} /> },
        { id: 'Resolution proof', label: 'Before & after', icon: <Icon.Camera size={17} /> },
        { id: 'Emergency drills', label: 'Drill center', icon: <Icon.AlertTriangle size={17} /> },
        { id: 'Service levels', label: 'SLA monitor', icon: <Icon.Clock size={17} /> },
        { id: 'Analytics', label: 'City analytics', icon: <Icon.Layers size={17} /> }
      ]
    : [
        { id: 'Overview', label: 'My dashboard', icon: <Icon.Compass size={17} /> },
        { id: 'Explore map', label: 'Explore city map', icon: <Icon.Cube3D size={17} /> },
        { id: 'My reports', label: 'My reports', icon: <Icon.CheckCircle size={17} />, count: issuesCount },
        { id: 'Resolution proof', label: 'Before & after', icon: <Icon.Camera size={17} /> },
        { id: 'Emergency drills', label: 'Drill center', icon: <Icon.AlertTriangle size={17} /> },
        { id: 'Rewards', label: 'Rewards & scratch cards', icon: <Icon.Award size={17} />, karma: points }
      ];

  return (
    <aside className="sidebar-pro">
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <div className="brand-logo-symbol">
          <div className="logo-iris"></div>
          <Icon.Shield size={18} />
        </div>
        <div className="brand-text-col">
          <span className="brand-title">Civic<span>Lens</span></span>
          <span className="brand-version">ENTERPRISE CIVIC 360</span>
        </div>
      </div>

      {/* District Workspace Selector */}
      <div className="district-pill-card">
        <div className="district-flag">
          <Icon.Building2 size={15} />
        </div>
        <div className="district-meta">
          <b>Metropolitan Central</b>
          <small>Ward 4 • District 02</small>
        </div>
        <span className="status-dot-active"></span>
      </div>

      {/* Main Navigation Menu */}
      <div className="nav-section-title">{mode === 'Admin' ? 'CITY OPERATIONS' : 'CITIZEN SPACE'}</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-btn-pro ${isActive ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setActiveTab(item.id);
              }}
            >
              <span className="nav-icon-wrap">{item.icon}</span>
              <span className="nav-label-text">{item.label}</span>

              {item.count !== undefined && item.count > 0 && (
                <span className="nav-counter-pill">{item.count}</span>
              )}

              {item.karma !== undefined && (
                <span className="nav-karma-pill">
                  <Icon.Sparkles size={11} /> {item.karma}
                </span>
              )}

              {item.alertCount !== undefined && item.alertCount > 0 && (
                <span className="nav-alert-pill">{item.alertCount} PENDING</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Municipal Resource Card */}
      <div className="sidebar-footer-card">
        <div className="footer-card-inner">
          <div className="footer-icon">
            <Icon.Shield size={18} />
          </div>
          <div className="footer-text">
            <b>Municipal 311 Hotline</b>
            <p>Direct citizen telemetry connected to City Operations 24/7.</p>
          </div>
        </div>
        <div className="footer-sub-note">
          <span className="live-dot green"></span>
          <span>Encrypted Citizen Telemetry</span>
        </div>
      </div>
    </aside>
  );
}
