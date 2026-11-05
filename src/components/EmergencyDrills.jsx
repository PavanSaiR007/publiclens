import React, { useMemo, useState } from 'react';
import { Icon } from './Icons';
import './EmergencyDrills.css';

export const DRILL_SCENARIOS = [
  {
    id: 'flash-flood',
    title: 'Flash flood warning',
    alert: 'SIMULATION · FLASH FLOOD WARNING',
    level: 'Level 2 · Severe weather',
    area: 'Sectors 2 & 4 · Riverside and Downtown',
    guidance: 'Avoid low-lying underpasses near Riverside Pier. Move to higher ground and follow marked evacuation routes.',
    color: 'blue'
  },
  {
    id: 'extreme-heat',
    title: 'Extreme heat advisory',
    alert: 'SIMULATION · EXTREME HEAT ADVISORY',
    level: 'Level 1 · Public health',
    area: 'Sectors 1 & 3 · North Hills and Harbor',
    guidance: 'Open cooling centers, check on vulnerable residents, and avoid strenuous outdoor activity during peak heat.',
    color: 'amber'
  },
  {
    id: 'severe-wind',
    title: 'Severe wind response',
    alert: 'SIMULATION · SEVERE WIND WARNING',
    level: 'Level 2 · Wind hazard',
    area: 'Sectors 3 & 4 · Harbor and Waterfront',
    guidance: 'Secure loose outdoor items, avoid waterfront paths, and report blocked roads or fallen trees to the city team.',
    color: 'violet'
  }
];

export default function EmergencyDrills({ drills = [], activeDrill, onStartDrill, onEndDrill }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(DRILL_SCENARIOS[0].id);
  const selectedScenario = useMemo(
    () => DRILL_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) || DRILL_SCENARIOS[0],
    [selectedScenarioId]
  );
  const completedCount = drills.filter((drill) => drill.status === 'Completed').length;

  return (
    <section className="drill-center-page">
      <header className="drill-center-heading">
        <div>
          <span className="drill-eyebrow"><Icon.AlertTriangle size={14} /> CIVIC RESPONSE EXERCISES</span>
          <h1>Emergency drill center</h1>
          <p>Simulate a public warning, review the response guidance, and keep a clear drill report history. Simulations are labeled and kept separate from real incident reports.</p>
        </div>
        <div className="drill-summary"><div><b>{drills.length}</b><span>Total drill reports</span></div><div><b>{completedCount}</b><span>Completed</span></div></div>
      </header>

      {activeDrill && (
        <div className={`active-drill-card ${activeDrill.color || 'blue'}`}>
          <div className="active-drill-pulse"><Icon.AlertTriangle size={19} /></div>
          <div className="active-drill-copy"><span>ACTIVE SIMULATION · {activeDrill.id}</span><h2>{activeDrill.title}</h2><p>{activeDrill.area} · {activeDrill.level}</p><small>{activeDrill.guidance}</small></div>
          <button onClick={onEndDrill}><Icon.Check size={15} /> End drill</button>
        </div>
      )}

      {!activeDrill && (
        <div className="drill-scenario-panel">
          <div className="drill-section-heading"><div><h2>Start a response exercise</h2><p>Choose the warning scenario to publish in the drill banner.</p></div><span><Icon.Shield size={13} /> SIMULATION MODE</span></div>
          <div className="drill-scenario-grid">
            {DRILL_SCENARIOS.map((scenario) => (
              <button type="button" key={scenario.id} className={`drill-scenario-card ${scenario.color} ${selectedScenarioId === scenario.id ? 'selected' : ''}`} onClick={() => setSelectedScenarioId(scenario.id)}>
                <span className="drill-scenario-icon"><Icon.AlertTriangle size={17} /></span>
                <b>{scenario.title}</b><small>{scenario.area}</small><span className="drill-scenario-level">{scenario.level}</span>
              </button>
            ))}
          </div>
          <div className="drill-launch-row"><p><b>Warning preview</b><span>{selectedScenario.guidance}</span></p><button onClick={() => onStartDrill(selectedScenario)}><Icon.AlertTriangle size={15} /> Start simulation</button></div>
        </div>
      )}

      <div className="drill-report-panel">
        <div className="drill-section-heading"><div><h2>Drill reports</h2><p>Every simulated warning is logged here with its scope and status.</p></div><span>{drills.length} RECORDS</span></div>
        {drills.length ? (
          <div className="drill-report-list">
            {drills.map((drill) => (
              <article className="drill-report-row" key={drill.id}>
                <div className={`drill-report-icon ${drill.color || 'blue'}`}><Icon.Inbox size={17} /></div>
                <div className="drill-report-main"><div><b>{drill.title}</b><span className="drill-report-id">{drill.id}</span></div><p>{drill.area} · {drill.level}</p><small>{drill.guidance}</small></div>
                <div className="drill-report-meta"><span className={`drill-report-status ${(drill.status || '').toLowerCase()}`}>{drill.status}</span><small>{new Date(drill.startedAt).toLocaleString()}</small><em>SIMULATION ONLY</em></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="drill-empty-state"><Icon.Inbox size={21} /><b>No drill reports yet</b><span>Start a scenario to create the first drill report.</span></div>
        )}
      </div>
    </section>
  );
}
