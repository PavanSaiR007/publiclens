import React from 'react';
import { Icon } from './Icons';

export default function StatsGrid({ issues = [], mode = 'Citizen' }) {
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const resolutionRate = issues.length ? Math.round((resolvedCount / issues.length) * 100) : 84;

  const stats = [
    {
      title: mode === 'Admin' ? 'Municipal Issues' : 'Tracked Reports',
      value: issues.length.toString().padStart(2, '0'),
      change: '+4 new this week',
      isPositive: true,
      icon: <Icon.AlertTriangle size={18} />,
      color: '#3B82F6'
    },
    {
      title: 'City Resolution Rate',
      value: `${resolutionRate}%`,
      change: '↑ 14% vs last quarter',
      isPositive: true,
      icon: <Icon.CheckCircle size={18} />,
      color: '#10B981'
    },
    {
      title: 'Response Velocity',
      value: '1.8d',
      change: '↓ 0.6d faster SLA',
      isPositive: true,
      icon: <Icon.Clock size={18} />,
      color: '#F59E0B'
    },
    {
      title: 'Civic Watchmen Nearby',
      value: '1,420',
      change: 'Active in your metro ward',
      isPositive: true,
      icon: <Icon.Shield size={18} />,
      color: '#8B5CF6'
    }
  ];

  return (
    <div className="stats-grid-pro">
      {stats.map((s, idx) => (
        <div key={idx} className="stat-card-pro">
          <div className="stat-top">
            <span className="stat-label">{s.title}</span>
            <div className="stat-icon-wrap" style={{ color: s.color, backgroundColor: `${s.color}18` }}>
              {s.icon}
            </div>
          </div>
          <div className="stat-value">{s.value}</div>
          <div className={`stat-change ${s.isPositive ? 'positive' : ''}`}>
            <span>{s.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
