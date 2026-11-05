import React, { useState } from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';

export default function AdminTriage({
  issues,
  onVerify,
  onAssignCrew,
  onMarkInProgress,
  onOpenResolve,
  onSelectIssue
}) {
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDept, setFilterDept] = useState('All');

  const pendingIssues = issues.filter((i) => i.status !== 'Resolved' && i.status !== 'Awaiting citizen confirmation');

  const filtered = pendingIssues.filter((i) => {
    if (filterPriority !== 'All' && i.priority !== filterPriority) return false;
    if (filterDept !== 'All' && i.department !== filterDept) return false;
    return true;
  });

  return (
    <div className="admin-operations-page">
      {/* Top Banner */}
      <div className="ops-banner">
        <div className="ops-banner-copy">
          <div className="ops-indicator">
            <span className="live-dot green"></span>
            <b>MUNICIPAL INCIDENT COMMAND • ACTIVE QUEUE</b>
          </div>
          <h2>City Operations Triage Deck</h2>
          <p>
            Verify reported citizen hazards, dispatch municipal rapid-response units, and enforce SLA benchmarks across all municipal wards.
          </p>
        </div>

        <div className="ops-kpis">
          <div className="ops-kpi-pill">
            <small>Active Triage</small>
            <b>{pendingIssues.length}</b>
          </div>
          <div className="ops-kpi-pill">
            <small>Urgent Hazards</small>
            <b className="text-urgent">{issues.filter((i) => i.priority === 'Urgent' && i.status !== 'Resolved').length}</b>
          </div>
          <div className="ops-kpi-pill">
            <small>Crews In Field</small>
            <b>{issues.filter((i) => i.status === 'In progress').length}</b>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="ops-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">
            <Icon.Sliders size={13} /> Filter Severity:
          </span>
          {['All', 'Urgent', 'High', 'Normal'].map((p) => (
            <button
              key={p}
              className={`filter-btn ${filterPriority === p ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setFilterPriority(p);
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">
            <Icon.Building2 size={13} /> Department:
          </span>
          <select
            className="dept-select"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="All">All Municipal Agencies</option>
            <option value="Public works">Public Works (DOT)</option>
            <option value="Street lighting">Street Lighting</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Parks & recreation">Parks & Recreation</option>
          </select>
        </div>
      </div>

      {/* Triage Cards Table */}
      <div className="triage-table-card">
        {filtered.length === 0 ? (
          <div className="ops-empty-state">
            <Icon.CheckCircle size={36} />
            <b>All Active Incidents Triaged & Dispatched</b>
            <p>Great job! Zero backlogged citizen reports matching your current filter.</p>
          </div>
        ) : (
          <div className="triage-list">
            {filtered.map((issue) => {
              const priorityClass = (issue.priority || 'Normal').toLowerCase();
              return (
                <div key={issue.id} className="triage-row">
                  {/* Thumbnail / Symbol */}
                  <div
                    className="triage-thumb-box"
                    onClick={() => {
                      sound.playClick();
                      onSelectIssue(issue);
                    }}
                  >
                    <img src={issue.image} alt={issue.title} className="triage-thumb" />
                    <span className="triage-zoom-icon">
                      <Icon.Search size={11} />
                    </span>
                  </div>

                  {/* Core Details */}
                  <div className="triage-info" onClick={() => onSelectIssue(issue)}>
                    <div className="triage-meta-row">
                      <span className="triage-id">{issue.id}</span>
                      <span className={`badge-priority ${priorityClass}`}>{issue.priority || 'Normal'}</span>
                      <span className="triage-dept">{issue.department || 'Public Works'}</span>
                      <span className="triage-sla">SLA: 18h remaining</span>
                    </div>

                    <h4 className="triage-title">{issue.title}</h4>
                    <p className="triage-place">
                      <Icon.MapPin size={12} /> {issue.place} • {issue.confidence}% AI Defect Match • {issue.lat != null && issue.lng != null ? `GPS ±${issue.gpsAccuracy ?? '—'} m` : 'Address only'}
                    </p>
                  </div>

                  {/* Operational Status & Fast Actions */}
                  <div className="triage-actions">
                    <span className={`status-pill ${issue.status.toLowerCase().replaceAll(' ', '-')}`}>
                      {issue.status}
                    </span>

                    {issue.status === 'Reported' && (
                      <button
                        className="btn-action-primary"
                        onClick={() => {
                          sound.playClick();
                          onVerify(issue.id);
                        }}
                      >
                        <Icon.Check size={12} />
                        <span>Verify</span>
                      </button>
                    )}

                    {issue.status === 'Verified' && (
                      <button
                        className="btn-action-assign"
                        onClick={() => {
                          sound.playClick();
                          onAssignCrew(issue.id, 'Rapid Dispatch #14');
                        }}
                      >
                        <Icon.Zap size={12} />
                        <span>Dispatch Crew</span>
                      </button>
                    )}

                    {issue.status === 'In progress' && (
                      <button
                        className="btn-action-resolve"
                        onClick={() => {
                          sound.playClick();
                          onOpenResolve(issue);
                        }}
                      >
                        <Icon.Camera size={12} />
                        <span>Upload After Photo</span>
                      </button>
                    )}

                    {issue.status === 'Assigned' && (
                      <button
                        className="btn-action-assign"
                        onClick={() => {
                          sound.playClick();
                          onMarkInProgress(issue.id);
                        }}
                      >
                        <Icon.Clock size={12} />
                        <span>Start Work</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
