import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';

export default function DroneReconModal({ issue, onClose }) {
  const [visionMode, setVisionMode] = useState('standard'); // 'standard' | 'thermal' | 'lidar'
  const [altitude, setAltitude] = useState(48);
  const [pitch, setPitch] = useState(14);
  const [yaw, setYaw] = useState(182);
  const [scanActive, setScanActive] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    sound.playScan();
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 1) % 360);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (mode) => {
    sound.playClick();
    setVisionMode(mode);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drone-recon-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close drone recon">
          <Icon.X size={18} />
        </button>

        {/* Top Telemetry Header */}
        <div className="drone-telemetry-top">
          <div className="drone-id-badge">
            <span className="live-dot green"></span>
            <b>AUTONOMOUS GIS DRONE RECON • ALPHA-1</b>
          </div>
          <div className="drone-stats-strip">
            <span>ALT: <b>{altitude}m</b></span>
            <span>PITCH: <b>{pitch}°</b></span>
            <span>HDG: <b>{yaw}° NNE</b></span>
            <span>WIND: <b>8.4 kt W</b></span>
            <span>LINK: <b>5G ULTRA (12ms)</b></span>
          </div>
        </div>

        {/* Viewport Stage */}
        <div className={`drone-viewport-stage ${visionMode}`}>
          {/* Main Visual Stream */}
          <img src={issue?.image} alt="Drone Feed" className="drone-feed-img" />

          {/* Vision Mode Shaders / Filter Overlays */}
          {visionMode === 'thermal' && <div className="thermal-shader-overlay"></div>}
          {visionMode === 'lidar' && <div className="lidar-grid-overlay"></div>}

          {/* Tactical Drone HUD Reticle */}
          <div className="drone-hud-crosshairs">
            <div className="hud-corner top-left"></div>
            <div className="hud-corner top-right"></div>
            <div className="hud-corner bottom-left"></div>
            <div className="hud-corner bottom-right"></div>
            <div className="hud-center-cross"></div>
            <div className="hud-compass-ring">
              <span className="compass-mark n">N</span>
              <span className="compass-mark e">E</span>
              <span className="compass-mark s">S</span>
              <span className="compass-mark w">W</span>
            </div>
          </div>

          {/* Target Tracking Bounding Box */}
          <div className="drone-target-box">
            <div className="target-tag">
              <span className="target-ping"></span>
              <b>TARGET LOCKED: {issue?.id}</b>
              <small>SEVERITY: {issue?.priority?.toUpperCase() || 'NORMAL'}</small>
            </div>
            <div className="target-coords">
              <span>LAT: {issue?.lat ? issue.lat.toFixed(5) : '40.71280'}</span>
              <span>LNG: {issue?.lng ? issue.lng.toFixed(5) : '-74.00600'}</span>
            </div>
          </div>

          {/* Scanning Line Animation */}
          {scanActive && <div className="drone-laser-scanline"></div>}

          {/* Vision Modes Selector Overlay */}
          <div className="drone-vision-modes">
            <button
              className={`vision-btn ${visionMode === 'standard' ? 'active' : ''}`}
              onClick={() => handleModeChange('standard')}
            >
              RGB Optical
            </button>
            <button
              className={`vision-btn ${visionMode === 'thermal' ? 'active' : ''}`}
              onClick={() => handleModeChange('thermal')}
            >
              Thermal Infrared
            </button>
            <button
              className={`vision-btn ${visionMode === 'lidar' ? 'active' : ''}`}
              onClick={() => handleModeChange('lidar')}
            >
              LiDAR Elevation
            </button>
          </div>
        </div>

        {/* Bottom Drone Flight Controls & Diagnostics */}
        <div className="drone-controls-bottom">
          <div className="flight-slider-col">
            <label>
              <span>Drone Altitude: <b>{altitude}m</b></span>
              <input
                type="range"
                min="15"
                max="120"
                value={altitude}
                onChange={(e) => setAltitude(e.target.value)}
              />
            </label>
          </div>

          <div className="flight-slider-col">
            <label>
              <span>Gimbal Pitch: <b>{pitch}°</b></span>
              <input
                type="range"
                min="-45"
                max="45"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
              />
            </label>
          </div>

          <div className="drone-action-buttons">
            <button
              className="btn-drone-capture"
              onClick={() => {
                sound.playSuccess();
                alert(`High-resolution aerial reconnaissance frame saved to municipal incident file ${issue?.id}!`);
              }}
            >
              <Icon.Camera size={14} />
              <span>Capture Recon Snapshot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
