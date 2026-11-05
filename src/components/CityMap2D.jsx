import React, { useState } from 'react';
import { Icon } from './Icons';
import { liveResponseCrews, citySectors, smartWasteBins as initialBins } from '../data/seedData';
import { sound } from '../utils/audio';
import { launchConfetti } from '../utils/confetti';

export default function CityMap2D({
  issues,
  selected,
  onSelect,
  filter,
  setFilter,
  themeMode = 'dark',
  onPinDrop = null,
  isPinDropActive = false
}) {
  // Layer Toggles
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showInfra, setShowInfra] = useState(false);
  const [showCrews, setShowCrews] = useState(true);
  const [showBins, setShowBins] = useState(true);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);
  const [showWeatherRadar, setShowWeatherRadar] = useState(false);
  const [visionMode, setVisionMode] = useState('tactical'); // 'tactical' | 'satellite' | 'thermal' | 'lidar'

  // State for bins so user can empty them interactively
  const [bins, setBins] = useState(initialBins);
  const [selectedBin, setSelectedBin] = useState(null);
  const [hoveredIssue, setHoveredIssue] = useState(null);
  const [hoveredCrew, setHoveredCrew] = useState(null);
  const [hoveredBin, setHoveredBin] = useState(null);
  const [activeSector, setActiveSector] = useState('all');
  const [cursorCoords, setCursorCoords] = useState({ lat: '40.7128', lng: '-74.0060' });

  // Measure Distance Tool
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measuredDistance, setMeasuredDistance] = useState(null);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const lat = (40.7 + (100 - y) * 0.0008).toFixed(4);
    const lng = (-74.02 + x * 0.0006).toFixed(4);
    setCursorCoords({ lat, lng });
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const lat = 40.7 + (100 - y) * 0.0008;
    const lng = -74.02 + x * 0.0006;

    if (isMeasuring) {
      sound.playClick();
      if (measurePoints.length === 0) {
        setMeasurePoints([{ x, y }]);
        setMeasuredDistance(null);
      } else {
        const p1 = measurePoints[0];
        const p2 = { x, y };
        const dx = (p2.x - p1.x) * 12;
        const dy = (p2.y - p1.y) * 12;
        const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
        setMeasurePoints([p1, p2]);
        setMeasuredDistance(dist);
      }
      return;
    }

    if (isPinDropActive && onPinDrop) {
      sound.playSuccess();
      onPinDrop({ x, y, lat, lng });
    }
  };

  const handleResetMeasure = () => {
    sound.playClick();
    setMeasurePoints([]);
    setMeasuredDistance(null);
    setIsMeasuring(!isMeasuring);
  };

  const handleEmptyBin = (binId, e) => {
    e && e.stopPropagation();
    sound.playSuccess();
    launchConfetti(0.5, 0.4);
    setBins((prev) =>
      prev.map((b) =>
        b.id === binId
          ? {
              ...b,
              fillLevel: 5,
              currentKg: 2.1,
              status: 'Just Emptied & Sanitized',
              lastEmptied: 'Just now'
            }
          : b
      )
    );
    if (selectedBin?.id === binId) {
      setSelectedBin((prev) =>
        prev
          ? {
              ...prev,
              fillLevel: 5,
              currentKg: 2.1,
              status: 'Just Emptied & Sanitized',
              lastEmptied: 'Just now'
            }
          : null
      );
    }
  };

  // Critical bins count (>80%)
  const criticalBinsCount = bins.filter((b) => b.fillLevel >= 80).length;

  return (
    <div
      className={`tactical-map-container ${isPinDropActive ? 'pin-drop-mode' : ''} ${isMeasuring ? 'measure-mode' : ''} vision-${visionMode}`}
      onMouseMove={handleMouseMove}
      onClick={handleMapClick}
    >
      <svg className="tactical-map-svg" viewBox="0 0 1000 650" preserveAspectRatio="none">
        <defs>
          <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#00F2FE" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#00F2FE" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="stormRadar" cx="35%" cy="40%" r="45%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#00F2FE" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={themeMode === 'light' ? 'rgba(20,75,95,0.10)' : 'rgba(255,255,255,0.04)'} strokeWidth="1" />
          </pattern>
        </defs>

        {/* Map Base Surface by Vision Mode */}
        {visionMode === 'satellite' ? (
          <rect width="1000" height="650" fill="#070D18" />
        ) : visionMode === 'thermal' ? (
          <rect width="1000" height="650" fill="#150824" />
        ) : visionMode === 'lidar' ? (
          <rect width="1000" height="650" fill="#041416" />
        ) : (
          <rect width="1000" height="650" fill={themeMode === 'light' ? '#E7F1EF' : '#0C1425'} />
        )}

        <rect width="1000" height="650" fill="url(#grid)" />

        {/* River Estuary & Harbor */}
        <path
          d="M 780 0 C 760 180, 830 300, 790 450 C 760 550, 710 600, 690 650 L 1000 650 L 1000 0 Z"
          fill={visionMode === 'thermal' ? '#2A0845' : visionMode === 'lidar' ? '#062B2B' : themeMode === 'light' ? '#CBE3E8' : '#13233D'}
          opacity="0.8"
        />
        <path
          d="M 780 0 C 760 180, 830 300, 790 450 C 760 550, 710 600, 690 650"
          fill="none"
          stroke={themeMode === 'light' ? '#5AA9B4' : '#00F2FE'}
          strokeWidth="1.5"
          opacity="0.35"
        />

        {/* District Boundaries */}
        <g className="district-zones" opacity="0.45">
          <polygon points="40,30 450,30 420,240 50,220" fill="none" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 4" />
          <text x="70" y="60" fill="#94A3B8" fontSize="11" fontFamily="DM Sans" letterSpacing="1.5">SECTOR 1 • NORTH HILLS</text>

          <polygon points="120,260 620,260 580,480 140,480" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
          <text x="160" y="290" fill="#94A3B8" fontSize="11" fontFamily="DM Sans" letterSpacing="1.5">SECTOR 2 • DOWNTOWN CORE</text>

          <polygon points="500,490 770,490 750,620 480,620" fill="none" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
          <text x="520" y="520" fill="#94A3B8" fontSize="11" fontFamily="DM Sans" letterSpacing="1.5">SECTOR 3 • HARBOR PIER</text>
        </g>

        {/* Arterial City Roads */}
        <g className="arterial-roads" stroke={themeMode === 'light' ? 'rgba(31,78,99,0.22)' : 'rgba(255,255,255,0.18)'} strokeLinecap="round">
          <line x1="0" y1="180" x2="1000" y2="180" strokeWidth="6" strokeDasharray="14 10" />
          <line x1="0" y1="380" x2="1000" y2="380" strokeWidth="9" />
          <line x1="0" y1="520" x2="800" y2="520" strokeWidth="5" strokeDasharray="8 6" />
          <line x1="280" y1="0" x2="280" y2="650" strokeWidth="7" />
          <line x1="560" y1="0" x2="560" y2="650" strokeWidth="8" strokeDasharray="12 8" />
          <path d="M 0 580 Q 400 350, 780 120" fill="none" stroke="#38BDF8" strokeWidth="3" opacity="0.45" />
        </g>

        {/* AI Optimized Waste Collection Fleet Route */}
        {showOptimizedRoute && (
          <g className="optimized-collection-route">
            {/* Route glow line */}
            <path
              d="M 580 420 L 540 430 L 670 215 L 720 400 L 810 350 L 580 420"
              fill="none"
              stroke="#00F2FE"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
              filter="drop-shadow(0 0 8px #00F2FE)"
            />
            {/* Animated dash line */}
            <path
              d="M 580 420 L 540 430 L 670 215 L 720 400 L 810 350 L 580 420"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="10 8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2.5s" repeatCount="indefinite" />
            </path>
            {/* Waypoint Numbers */}
            <circle cx="580" cy="420" r="10" fill="#00F2FE" />
            <text x="580" y="424" fill="#050B14" fontSize="10" fontWeight="bold" textAnchor="middle">1</text>
            <circle cx="670" cy="215" r="10" fill="#F59E0B" />
            <text x="670" y="219" fill="#050B14" fontSize="10" fontWeight="bold" textAnchor="middle">2</text>
            <circle cx="720" cy="400" r="10" fill="#10B981" />
            <text x="720" y="404" fill="#050B14" fontSize="10" fontWeight="bold" textAnchor="middle">3</text>
            <circle cx="810" cy="350" r="10" fill="#EC4899" />
            <text x="810" y="354" fill="#050B14" fontSize="10" fontWeight="bold" textAnchor="middle">4</text>
          </g>
        )}

        {/* Infrastructure Layer: Power Grid & Water Main */}
        {showInfra && (
          <g className="infra-layer">
            <path d="M 50 100 L 450 120 L 700 80 L 950 150" fill="none" stroke="#EAB308" strokeWidth="2.5" strokeDasharray="6 3" />
            <text x="710" y="70" fill="#EAB308" fontSize="10" fontFamily="monospace">POWER FEEDER 14</text>
            <path d="M 100 500 L 400 480 L 600 560 L 750 490" fill="none" stroke="#00F2FE" strokeWidth="3" strokeDasharray="10 5" opacity="0.8" />
            <text x="420" y="470" fill="#00F2FE" fontSize="10" fontFamily="monospace">WATER MAIN TRUNK</text>
          </g>
        )}

        {/* Weather & Storm Rainfall Radar Layer */}
        {showWeatherRadar && (
          <g className="weather-radar-layer">
            <circle cx="350" cy="280" r="220" fill="url(#stormRadar)" />
            <text x="310" y="260" fill="#60A5FA" fontSize="11" fontWeight="bold" fontFamily="monospace">STORM PRECIPITATION CELL (18mm/h)</text>
          </g>
        )}

        {/* Radar Sweep Animation */}
        <circle cx="500" cy="325" r="280" fill="url(#radarSweep)" className="radar-sweep-anim" />

        {/* Heatmap density overlay */}
        {showHeatmap && (
          <g className="heatmap-layer">
            {issues.map((issue) => (
              <circle
                key={`heat-${issue.id}`}
                cx={issue.x * 10}
                cy={issue.y * 6.5}
                r="65"
                fill={issue.tone === 'blue' ? '#3B82F6' : issue.tone === 'green' ? '#10B981' : issue.tone === 'amber' ? '#F59E0B' : '#8B5CF6'}
                opacity="0.32"
                filter="blur(16px)"
              />
            ))}
            {bins.map((bin) => (
              <circle
                key={`heat-bin-${bin.id}`}
                cx={bin.x * 10}
                cy={bin.y * 6.5}
                r={bin.fillLevel >= 80 ? '75' : '45'}
                fill={bin.fillLevel >= 80 ? '#EF4444' : '#F59E0B'}
                opacity={bin.fillLevel >= 80 ? '0.45' : '0.2'}
                filter="blur(18px)"
              />
            ))}
          </g>
        )}

        {/* Measure Tool Line */}
        {measurePoints.length === 2 && (
          <g className="measure-line-group">
            <line
              x1={measurePoints[0].x * 10}
              y1={measurePoints[0].y * 6.5}
              x2={measurePoints[1].x * 10}
              y2={measurePoints[1].y * 6.5}
              stroke="#00F2FE"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <circle cx={measurePoints[0].x * 10} cy={measurePoints[0].y * 6.5} r="5" fill="#00F2FE" />
            <circle cx={measurePoints[1].x * 10} cy={measurePoints[1].y * 6.5} r="5" fill="#00F2FE" />
          </g>
        )}
      </svg>

      {/* --- IOT SMART WASTE BINS LAYER --- */}
      {showBins &&
        bins.map((bin) => {
          const isCritical = bin.fillLevel >= 80;
          const isWarning = bin.fillLevel >= 60 && bin.fillLevel < 80;
          const statusColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

          return (
            <div
              key={bin.id}
              className={`tactical-bin-pin ${isCritical ? 'critical-fill animate-bounce' : ''}`}
              style={{ left: `${bin.x}%`, top: `${bin.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                setSelectedBin(bin);
              }}
              onMouseEnter={() => setHoveredBin(bin)}
              onMouseLeave={() => setHoveredBin(null)}
            >
              {/* Outer Pulsing Alert Halo if Overflowing */}
              {isCritical && (
                <div
                  className="absolute -inset-2 rounded-full border-2 border-red-500 animate-ping opacity-75"
                />
              )}

              {/* Smart Bin Core Icon */}
              <div
                className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border-2 shadow-lg transition-transform hover:scale-125"
                style={{ borderColor: statusColor }}
              >
                <Icon.Trash2 size={15} style={{ color: statusColor }} />
                <span
                  className="absolute -bottom-2 -right-1 text-[9px] font-mono font-bold px-1 rounded text-slate-950"
                  style={{ backgroundColor: statusColor }}
                >
                  {bin.fillLevel}%
                </span>
              </div>

              {/* Hover Bin Preview Card */}
              {hoveredBin?.id === bin.id && selectedBin?.id !== bin.id && (
                <div className="absolute left-10 top-0 z-50 w-56 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-xs font-mono pointer-events-none">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>{bin.code}</span>
                    <span className="font-bold" style={{ color: statusColor }}>
                      {bin.fillLevel}% FULL
                    </span>
                  </div>
                  <b className="text-white text-xs block mb-1">{bin.name}</b>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${bin.fillLevel}%`, backgroundColor: statusColor }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <div>Type: <span className="text-slate-200">{bin.type}</span></div>
                    <div>Sensor: <span className="text-cyan-400">{bin.temperatureC}°C • {bin.batteryPercent}% Solar</span></div>
                    <div>Capacity: <span className="text-slate-200">{bin.currentKg} / {bin.capacityKg} kg</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      {/* --- LIVE RESPONSE & SANITATION TRUCK PATROLS --- */}
      {showCrews &&
        liveResponseCrews.map((crew) => (
          <div
            key={crew.id}
            className="tactical-crew-pin"
            style={{ left: `${crew.x}%`, top: `${crew.y}%` }}
            onMouseEnter={() => setHoveredCrew(crew)}
            onMouseLeave={() => setHoveredCrew(null)}
          >
            <div className="crew-core" style={{ backgroundColor: crew.color }}>
              <Icon.Truck size={13} />
            </div>
            {hoveredCrew?.id === crew.id && (
              <div className="crew-hover-card">
                <span className="crew-type-badge">{crew.type}</span>
                <b>{crew.name}</b>
                <small>{crew.status}</small>
                <div className="crew-hover-footer">
                  <span>Vehicle: {crew.vehicle}</span>
                  <span>Crew: {crew.crewSize} members</span>
                </div>
              </div>
            )}
          </div>
        ))}

      {/* --- FLOATING CIVIC DEFECT MARKERS --- */}
      {issues.map((issue) => {
        const isSelected = selected?.id === issue.id;
        const toneColor = {
          blue: '#3B82F6',
          green: '#10B981',
          amber: '#F59E0B',
          violet: '#8B5CF6'
        }[issue.tone] || '#3B82F6';

        return (
          <div
            key={issue.id}
            className={`tactical-pin ${issue.tone} ${isSelected ? 'active' : ''}`}
            style={{ left: `${issue.x}%`, top: `${issue.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onSelect(issue);
            }}
            onMouseEnter={() => setHoveredIssue(issue)}
            onMouseLeave={() => setHoveredIssue(null)}
          >
            <div className="pin-pulse" style={{ borderColor: toneColor }}></div>
            <div className="pin-core" style={{ backgroundColor: toneColor }}>
              {issue.type === 'Road damage' && <Icon.AlertTriangle size={13} />}
              {issue.type === 'Street lighting' && <Icon.Zap size={13} />}
              {issue.type === 'Waste management' && <Icon.Trash2 size={13} />}
              {issue.type === 'Public space' && <Icon.Trees size={13} />}
            </div>

            {hoveredIssue?.id === issue.id && !isSelected && (
              <div className="pin-hover-card">
                <div className="hover-header">
                  <span className="pill-status">{issue.status}</span>
                  <small>{issue.id}</small>
                </div>
                <b>{issue.title}</b>
                <p>{issue.place}</p>
                <div className="hover-meta">
                  <span>Priority: {issue.priority || 'Normal'}</span>
                  <span>{issue.confidence}% AI Match</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* --- SELECTED IOT SMART BIN DOSSIER MODAL --- */}
      {selectedBin && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 top-20 z-50 w-80 p-5 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-white font-mono"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                <Icon.Trash2 size={16} />
              </div>
              <div>
                <b className="text-xs text-white block">{selectedBin.code}</b>
                <span className="text-[10px] text-slate-400">{selectedBin.type}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedBin(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <Icon.X size={15} />
            </button>
          </div>

          <h3 className="text-sm font-bold mt-3 mb-1 text-white">{selectedBin.name}</h3>
          <p className="text-[11px] text-slate-400 mb-3">{selectedBin.place}</p>

          {/* Ultrasonic Fill Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Ultrasonic Fill Level:</span>
              <b className={selectedBin.fillLevel >= 80 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {selectedBin.fillLevel}%
              </b>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${selectedBin.fillLevel}%`,
                  backgroundColor: selectedBin.fillLevel >= 80 ? '#EF4444' : selectedBin.fillLevel >= 60 ? '#F59E0B' : '#10B981'
                }}
              />
            </div>
          </div>

          {/* Live Sensor Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-4">
            <div>
              <small className="text-slate-500 block">Weight Load</small>
              <b>{selectedBin.currentKg} / {selectedBin.capacityKg} kg</b>
            </div>
            <div>
              <small className="text-slate-500 block">Temperature</small>
              <b className="text-cyan-400">{selectedBin.temperatureC}°C (Normal)</b>
            </div>
            <div>
              <small className="text-slate-500 block">Solar Battery</small>
              <b className="text-emerald-400">{selectedBin.batteryPercent}% Charged</b>
            </div>
            <div>
              <small className="text-slate-500 block">Last Emptied</small>
              <b className="text-slate-300">{selectedBin.lastEmptied}</b>
            </div>
          </div>

          {/* 1-Click Sanitation Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={(e) => handleEmptyBin(selectedBin.id, e)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Icon.Check size={14} />
              <span>Simulate Emptying & Compaction</span>
            </button>

            <button
              onClick={() => {
                sound.playAlert();
                alert(`Sanitation Unit S-09 detour initiated to collect ${selectedBin.code} at ${selectedBin.place}. ETA: 12 mins.`);
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icon.Truck size={14} />
              <span>Dispatch Sanitation Truck</span>
            </button>
          </div>
        </div>
      )}

      {/* --- AI ROUTE OPTIMIZATION HUD PILL --- */}
      {showOptimizedRoute && (
        <div className="absolute top-16 left-6 z-40 px-4 py-2 rounded-xl bg-slate-950/90 border border-cyan-400/60 shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs font-mono text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <b className="text-cyan-300">AI VRP ROUTE ACTIVE:</b>
          </div>
          <span>14.8 KM</span>
          <span className="text-slate-600">•</span>
          <span>4 BINS SCHEDULED</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-bold">-28% CO2 FUEL SAVED</span>
        </div>
      )}

      {/* --- TACTICAL MAP HUD BAR & CONTROLS --- */}
      <div className="tactical-hud-top">
        <div className="hud-group">
          {/* Sector Selector */}
          <select
            className="hud-sector-select"
            value={activeSector}
            onChange={(e) => {
              sound.playClick();
              setActiveSector(e.target.value);
            }}
          >
            {citySectors.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>

          {/* Smart Waste Bins Layer Toggle */}
          <button
            className={`hud-btn ${showBins ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setShowBins(!showBins);
            }}
          >
            <Icon.Trash2 size={13} />
            <span>Smart Bins ({bins.length})</span>
            {criticalBinsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-slate-950 font-bold text-[10px]">
                {criticalBinsCount} Alert
              </span>
            )}
          </button>

          {/* AI Route Optimizer Toggle */}
          <button
            className={`hud-btn ${showOptimizedRoute ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setShowOptimizedRoute(!showOptimizedRoute);
            }}
            title="Calculate shortest AI collection path connecting all overflowing bins"
          >
            <Icon.Sparkles size={13} />
            <span>AI Fleet Route {showOptimizedRoute ? 'ON' : 'OFF'}</span>
          </button>

          {/* Heatmap Toggle */}
          <button
            className={`hud-btn ${showHeatmap ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setShowHeatmap(!showHeatmap);
            }}
          >
            <Icon.Layers size={13} />
            <span>Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>

          {/* Weather / Rain Radar */}
          <button
            className={`hud-btn ${showWeatherRadar ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setShowWeatherRadar(!showWeatherRadar);
            }}
          >
            <Icon.Compass size={13} />
            <span>Rain Radar</span>
          </button>

          {/* Power & Water Grid */}
          <button
            className={`hud-btn ${showInfra ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setShowInfra(!showInfra);
            }}
          >
            <Icon.Zap size={13} />
            <span>Power & Water Grid</span>
          </button>

          {/* Patrol Units */}
          <button
            className={`hud-btn ${showCrews ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setShowCrews(!showCrews);
            }}
          >
            <Icon.Truck size={13} />
            <span>Patrols ({liveResponseCrews.length})</span>
          </button>

          {/* Vision Mode Switcher */}
          <select
            className="hud-sector-select"
            value={visionMode}
            onChange={(e) => {
              sound.playClick();
              setVisionMode(e.target.value);
            }}
          >
            <option value="tactical">Tactical Vector</option>
            <option value="satellite">Satellite Ortho</option>
            <option value="thermal">Thermal Infrared</option>
            <option value="lidar">LiDAR Contour</option>
          </select>

          {/* Measure Caliper */}
          <button
            className={`hud-btn ${isMeasuring ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleResetMeasure();
            }}
          >
            <Icon.Ruler size={13} />
            <span>{isMeasuring ? 'Exit Ruler' : 'Measure Distance'}</span>
          </button>
        </div>

        {/* Live GPS / Measurement Display */}
        <div className="hud-coords">
          {isMeasuring && measuredDistance !== null ? (
            <span>MEASURED: {measuredDistance} METERS</span>
          ) : (
            <>
              <Icon.Crosshair size={13} />
              <span>GPS: {cursorCoords.lat}° N, {cursorCoords.lng}° W</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
