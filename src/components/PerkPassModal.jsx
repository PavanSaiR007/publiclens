import React from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';

export default function PerkPassModal({ perk, citizenName = 'Jordan Davis', onClose }) {
  if (!perk) return null;

  const handleDownload = () => {
    sound.playSuccess();
    alert(`Pass ${perk.code} downloaded successfully to your device!`);
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pass-modal-container">
        <button className="modal-close-btn" onClick={onClose}>
          <Icon.X size={18} />
        </button>

        {/* Digital Wallet Pass Card */}
        <div className="digital-wallet-card">
          <div className="wallet-card-header">
            <div className="wallet-brand">
              <Icon.Shield size={16} />
              <span>CIVICLENS METROPOLITAN PASS</span>
            </div>
            <span className="wallet-tier-pill">VERIFIED CITIZEN</span>
          </div>

          <div className="wallet-card-body">
            <span className="wallet-category">{perk.category}</span>
            <h3 className="wallet-title">{perk.title}</h3>
            <p className="wallet-desc">{perk.desc}</p>

            <div className="wallet-grid-info">
              <div>
                <small>HOLDER</small>
                <b>{citizenName}</b>
              </div>
              <div>
                <small>PASS ID</small>
                <b className="pass-code-mono">{perk.code}</b>
              </div>
              <div>
                <small>ISSUING JURISDICTION</small>
                <b>City of Metropolitan Ops</b>
              </div>
              <div>
                <small>VALIDITY</small>
                <b>Active • 30 Days</b>
              </div>
            </div>

            {/* Aztec / Barcode Simulation */}
            <div className="wallet-barcode-section">
              <div className="barcode-bars">
                {[...Array(42)].map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: `${(i % 3) + 1.5}px`,
                      marginRight: `${(i % 2) + 1.5}px`
                    }}
                  ></span>
                ))}
              </div>
              <span className="barcode-number">{perk.code} • 8492-0194</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pass-actions-row">
          <button className="btn-secondary" onClick={handlePrint}>
            <Icon.Printer size={14} />
            <span>Print Physical Pass</span>
          </button>

          <button className="btn-primary-gradient" onClick={handleDownload}>
            <Icon.Download size={14} />
            <span>Download Digital Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
}
