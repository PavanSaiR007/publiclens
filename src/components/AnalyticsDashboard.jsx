import React, { useState } from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';

export default function AnalyticsDashboard({ issues = [] }) {
  const [timeRange, setTimeRange] = useState('30d');

  const resolved = issues.filter((i) => i.status === 'Resolved').length;
  const inProgress = issues.filter((i) => i.status === 'In progress').length;
  const assigned = issues.filter((i) => i.status === 'Assigned').length;
  const reported = issues.filter((i) => i.status === 'Reported').length;

  const departmentStats = [
    { name: 'Public Works (DOT)', total: 42, resolved: 36, avgTime: '1.4 Days', score: 92, color: '#3B82F6' },
    { name: 'Street Lighting & Power', total: 28, resolved: 25, avgTime: '1.1 Days', score: 96, color: '#10B981' },
    { name: 'Department of Sanitation', total: 35, resolved: 31, avgTime: '0.8 Days', score: 94, color: '#F59E0B' },
    { name: 'Parks & Recreation', total: 19, resolved: 15, avgTime: '2.6 Days', score: 85, color: '#8B5CF6' }
  ];

  const wardScores = [
    { ward: 'Ward 1 • Waterfront District', score: 94, grade: 'A+', trend: '+3.2%', activeHazards: 3, resolved: 28 },
    { ward: 'Ward 2 • Downtown Civic Core', score: 82, grade: 'B', trend: '+1.5%', activeHazards: 8, resolved: 42 },
    { ward: 'Ward 3 • Tech & Harbor Corridor', score: 91, grade: 'A', trend: '+4.1%', activeHazards: 4, resolved: 31 },
    { ward: 'Ward 4 • North Hills Residential', score: 88, grade: 'B+', trend: '+2.8%', activeHazards: 5, resolved: 24 }
  ];

  const handleExportPDF = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="analytics-page-container">
      {/* Top Banner */}
      <div className="analytics-hero-banner">
        <div>
          <div className="analytics-eyebrow">
            <span className="live-dot green"></span>
            <b>MUNICIPAL INTELLIGENCE & TELEMETRY SUITE</b>
          </div>
          <h2>City Infrastructure Health & Analytics</h2>
          <p>
            Real-time resolution velocity, departmental SLA benchmarks, and municipal ward risk metrics across all city districts.
          </p>
        </div>

        <div className="analytics-top-actions">
          <div className="time-range-toggle">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                className={`range-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => {
                  sound.playClick();
                  setTimeRange(range);
                }}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button className="btn-export-dossier" onClick={handleExportPDF}>
            <Icon.Printer size={14} />
            <span>Export Council Dossier</span>
          </button>
        </div>
      </div>

      {/* High-Level Impact Metrics */}
      <div className="impact-metrics-grid">
        <div className="impact-card">
          <div className="impact-top">
            <span className="impact-label">Municipal Savings</span>
            <span className="impact-badge-green">+18% YoY</span>
          </div>
          <div className="impact-value">$184,500</div>
          <p>Estimated vehicle damage claims averted by rapid asphalt patching</p>
        </div>

        <div className="impact-card">
          <div className="impact-top">
            <span className="impact-label">Energy Efficiency</span>
            <span className="impact-badge-green">14,200 kWh</span>
          </div>
          <div className="impact-value">84 Lamps</div>
          <p>Sodium-vapor streetlights retrofitted to smart LED heads</p>
        </div>

        <div className="impact-card">
          <div className="impact-top">
            <span className="impact-label">Recycled Civic Waste</span>
            <span className="impact-badge-green">98.2% Diverted</span>
          </div>
          <div className="impact-value">18.4 Tons</div>
          <p>Litter, pallet debris, and overflow composted or recycled</p>
        </div>

        <div className="impact-card">
          <div className="impact-top">
            <span className="impact-label">SLA Compliance</span>
            <span className="impact-badge-green">Above Target</span>
          </div>
          <div className="impact-value">94.8%</div>
          <p>Resolved within municipal 24-hour response charter</p>
        </div>
      </div>

      {/* Main Charts & Rankings Grid */}
      <div className="analytics-main-grid">
        {/* Left Column: Interactive Incident Velocity Area Chart */}
        <div className="analytics-card chart-card">
          <div className="card-header-row">
            <div>
              <h3>Incident Intake vs Resolution Velocity</h3>
              <p>Weekly trend of citizen defect reports against verified municipal closures</p>
            </div>
            <div className="chart-legend-row">
              <span className="chart-legend intake">● Reports Ingested</span>
              <span className="chart-legend resolved">● Verified Closures</span>
            </div>
          </div>

          {/* High-Tech Vector Area Chart */}
          <div className="vector-chart-wrapper">
            <svg viewBox="0 0 700 240" className="velocity-chart-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="resolveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06D6A0" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06D6A0" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(255,255,255,0.06)" />
              <line x1="0" y1="100" x2="700" y2="100" stroke="rgba(255,255,255,0.06)" />
              <line x1="0" y1="160" x2="700" y2="160" stroke="rgba(255,255,255,0.06)" />
              <line x1="0" y1="220" x2="700" y2="220" stroke="rgba(255,255,255,0.12)" />

              {/* Intake Wave Area */}
              <path
                d="M 0 160 Q 120 120, 240 140 T 480 80 T 700 95 L 700 220 L 0 220 Z"
                fill="url(#intakeGrad)"
              />
              <path
                d="M 0 160 Q 120 120, 240 140 T 480 80 T 700 95"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
              />

              {/* Resolution Wave Area */}
              <path
                d="M 0 180 Q 120 150, 240 110 T 480 60 T 700 50 L 700 220 L 0 220 Z"
                fill="url(#resolveGrad)"
              />
              <path
                d="M 0 180 Q 120 150, 240 110 T 480 60 T 700 50"
                fill="none"
                stroke="#06D6A0"
                strokeWidth="3.5"
              />

              {/* Interactive Data Nodes */}
              <circle cx="240" cy="110" r="5" fill="#06D6A0" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="480" cy="60" r="5" fill="#06D6A0" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="700" cy="50" r="6" fill="#06D6A0" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X-Axis Labels */}
            <div className="chart-x-axis">
              <span>Week 1 (Oct 01)</span>
              <span>Week 2 (Oct 08)</span>
              <span>Week 3 (Oct 15)</span>
              <span>Week 4 (Oct 22)</span>
              <span>Current (Nov 05)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Ward Health Scorecard */}
        <div className="analytics-card">
          <div className="card-header-row">
            <div>
              <h3>Metropolitan Ward Health Score</h3>
              <p>Municipal infrastructure risk & response index</p>
            </div>
          </div>

          <div className="ward-scores-list">
            {wardScores.map((w) => (
              <div key={w.ward} className="ward-score-row">
                <div className="ward-grade-box">{w.grade}</div>
                <div className="ward-info-col">
                  <b>{w.ward}</b>
                  <small>{w.activeHazards} Active • {w.resolved} Closed • {w.trend} Trend</small>
                </div>
                <div className="ward-bar-col">
                  <div className="ward-bar-track">
                    <div className="ward-bar-fill" style={{ width: `${w.score}%` }}></div>
                  </div>
                  <b>{w.score}/100</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Scoreboard Table */}
      <div className="analytics-card dept-card">
        <div className="card-header-row">
          <div>
            <h3>Departmental SLA & Resource Efficiency Scoreboard</h3>
            <p>Operational velocity ranked across municipal response units</p>
          </div>
        </div>

        <div className="dept-scoreboard-table">
          <div className="dept-head-row">
            <span>Department Name</span>
            <span>Total Tickets</span>
            <span>Resolved</span>
            <span>Avg Response</span>
            <span>Quality Score</span>
            <span>Performance</span>
          </div>

          {departmentStats.map((d) => (
            <div key={d.name} className="dept-data-row">
              <div className="dept-name-cell">
                <span className="dept-dot" style={{ backgroundColor: d.color }}></span>
                <b>{d.name}</b>
              </div>
              <span>{d.total} Assigned</span>
              <span className="text-resolved">{d.resolved} Verified</span>
              <span>{d.avgTime}</span>
              <span className="text-score">{d.score}%</span>
              <div className="perf-bar-track">
                <div className="perf-bar-fill" style={{ width: `${d.score}%`, backgroundColor: d.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
