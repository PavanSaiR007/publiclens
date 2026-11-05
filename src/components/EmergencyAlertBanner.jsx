import React from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';

export default function EmergencyAlertBanner({ isActive, activeDrill, onToggle, onOpenDashboard }) {
  if (!isActive) return null;

  return (
    <div className="emergency-alert-strip" role="status" aria-live="polite">
      <div className="emergency-content-inner">
        <div className="emergency-icon-pulse">
          <Icon.AlertTriangle size={16} />
        </div>
        <div className="emergency-text">
          <b>{activeDrill?.title || 'SIMULATION · CIVIC RESPONSE WARNING'}</b>
          <span>{activeDrill ? `${activeDrill.area}. ${activeDrill.guidance}` : 'A response drill is currently active.'}</span>
        </div>
        <div className="emergency-actions">
          <button
            className="btn-emergency-action"
            onClick={() => {
              sound.playSuccess();
              onOpenDashboard?.();
            }}
          >
            <span>View Drill Report</span>
          </button>
          <button className="btn-dismiss-emergency" onClick={onToggle}>
            <span>Dismiss Drill</span>
          </button>
        </div>
      </div>
    </div>
  );
}
