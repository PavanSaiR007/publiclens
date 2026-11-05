import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';
import DroneReconModal from './DroneReconModal';
import { sound } from '../utils/audio';
import { categoryMeta } from '../data/seedData';
import './IssueEvidence.css';

export default function IssueDetailModal({
  issue,
  mode,
  canReviewResolution = false,
  onCitizenPhotoReview,
  onClose,
  onResolveClick,
  onUpdateStatus,
  onUpvote
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDroneRecon, setShowDroneRecon] = useState(false);
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(0);
  const evidenceImages = [issue?.image, ...(issue?.evidencePhotos || [])].filter(Boolean);

  useEffect(() => setActiveEvidenceIndex(0), [issue?.id]);

  if (!issue) return null;

  const statusSteps = ['Reported', 'Verified', 'Assigned', 'In progress', 'Awaiting citizen confirmation', 'Resolved'];
  const currentIndex = statusSteps.indexOf(issue.status);
  const baseSla = categoryMeta[issue.type]?.slaHours || 24;
  const targetSla = Math.max(2, Math.round(baseSla * (issue.priority === 'Urgent' ? 0.35 : issue.priority === 'High' ? 0.65 : 1)));

  const handleUpvote = () => {
    if (hasUpvoted) return;
    sound.playSuccess();
    setHasUpvoted(true);
    onUpvote(issue.id);
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  const handleShareReceipt = () => {
    sound.playClick();
    setShowReceipt(true);
  };

  return (
    <>
      <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="dossier-modal-pro">
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon.X size={18} />
          </button>

          {/* Header Ribbon */}
          <div className="dossier-header-ribbon">
            <div className="dossier-id-box">
              <Icon.Shield size={14} />
              <b>MUNICIPAL INCIDENT DOSSIER • {issue.id}</b>
            </div>
            <div className="dossier-top-actions">
              <button
                className="icon-action-btn drone-recon-btn"
                onClick={() => {
                  sound.playScan();
                  setShowDroneRecon(true);
                }}
                title="Launch Autonomous 360 Drone Recon"
              >
                <Icon.Compass size={14} />
                <span>360° Drone Recon</span>
              </button>

              <button className="icon-action-btn" onClick={handleShareReceipt} title="Generate Citizen Tracking Receipt">
                <Icon.Share2 size={14} />
                <span>Share Receipt</span>
              </button>

              <button className="icon-action-btn" onClick={handlePrint} title="Print / Export Dossier">
                <Icon.Printer size={14} />
                <span>Print Dossier</span>
              </button>

              <span className={`badge-priority ${(issue.priority || 'Normal').toLowerCase()}`}>
                {issue.priority || 'Normal'} Priority
              </span>
            </div>
          </div>

          {/* Citizen Tracking Receipt Dialog Popup */}
          {showReceipt && (
            <div className="receipt-overlay-card">
              <div className="receipt-header">
                <span className="live-dot green"></span>
                <b>OFFICIAL MUNICIPAL CITIZEN RECEIPT</b>
                <button className="receipt-close" onClick={() => setShowReceipt(false)}>×</button>
              </div>
              <div className="receipt-body">
                <div className="receipt-qr-box">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="8" height="8" rx="1" />
                    <rect x="14" y="2" width="8" height="8" rx="1" />
                    <rect x="2" y="14" width="8" height="8" rx="1" />
                    <path d="M14 14h2v2h-2zM18 14h4v4h-4zM14 18h2v4h-2zM18 20h4v2h-4z" fill="currentColor" />
                  </svg>
                </div>
                <div className="receipt-details">
                  <b>Tracking Ref: {issue.id}</b>
                  <p>{issue.title}</p>
                  <small>Filed: {issue.time} • Dept: {issue.department || 'Public Works'}</small>
                  <div className="receipt-link-pill">civiclens.gov/track/{issue.id}</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Layout */}
          <div className="dossier-body-grid">
            {/* Left Column: Visual Evidence & Before/After */}
            <div className="dossier-visual-pane">
              {issue.status === 'Awaiting citizen confirmation' && issue.afterImage ? (
                <div className="before-after-suite">
                  <div className="suite-header">
                    <div className="suite-title text-blue-800"><Icon.Bell size={14} /><b>REPAIR PROOF · REPORTER REVIEW</b></div>
                    <span className="proof-score text-blue-800">UPLOADED BY {issue.analysis?.agentReviewedBy || 'CITY AGENT'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img src={issue.image} alt="Before construction, citizen report" className="h-48 w-full object-cover" />
                      <figcaption className="px-3 py-2 text-xs font-bold text-slate-600">BEFORE · CITIZEN REPORT</figcaption>
                    </figure>
                    <figure className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50">
                      <img src={issue.afterImage} alt="After construction, agent proof" className="h-48 w-full object-cover" />
                      <figcaption className="px-3 py-2 text-xs font-bold text-blue-800">AFTER · AGENT PROOF</figcaption>
                    </figure>
                  </div>
                  <div className="proof-audit-box">
                    <div className="audit-header"><Icon.Sparkles size={13} /><span>Image comparison · {issue.analysis?.changeRatio ?? 0}% visual change</span></div>
                    <ul className="audit-findings">{(issue.analysis?.findings || []).map((item, idx) => <li key={idx}><Icon.Check size={11} /> {item}</li>)}</ul>
                  </div>
                </div>
              ) : issue.needsRework && issue.afterImage ? (
                <div className="before-after-suite">
                  <div className="suite-header">
                    <div className="suite-title text-amber-800">
                      <Icon.AlertTriangle size={14} />
                      <b>REPAIR REVIEW · MORE WORK REQUIRED</b>
                    </div>
                    <span className="proof-score text-amber-800">
                      REVIEWED BY {issue.analysis?.agentReviewedBy || 'CITY AGENT'} · {issue.analysis?.changeRatio ?? 0}% VISUAL CHANGE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img src={issue.image} alt="Before construction, reported issue" className="h-48 w-full object-cover" />
                      <figcaption className="px-3 py-2 text-xs font-bold text-slate-600">BEFORE · CITIZEN REPORT</figcaption>
                    </figure>
                    <figure className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
                      <img src={issue.afterImage} alt="Agent's repair attempt photo; more work is required" className="h-48 w-full object-cover" />
                      <figcaption className="px-3 py-2 text-xs font-bold text-amber-800">AGENT PHOTO · WORK INCOMPLETE</figcaption>
                    </figure>
                  </div>
                  <div className="proof-audit-box">
                    <div className="audit-header"><Icon.Sparkles size={13} /><span>Agent review</span></div>
                    <ul className="audit-findings">
                      {(issue.analysis?.findings || ['The agent requested additional repair work.']).map((item, idx) => (
                        <li key={idx}><Icon.AlertTriangle size={11} /> {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : issue.status === 'Resolved' && issue.afterImage ? (
                <div className="before-after-suite">
                  <div className="suite-header">
                    <div className="suite-title">
                      <Icon.CheckCircle size={14} />
                      <b>VERIFIED MUNICIPAL RESOLUTION</b>
                    </div>
                    <span className="proof-score">
                      {issue.analysis?.agentApproved ? `APPROVED BY ${issue.analysis.agentReviewedBy || 'CITY AGENT'}` : 'COMPLETION PHOTOS'} · {issue.analysis?.changeRatio ?? 0}% VISUAL CHANGE
                    </span>
                  </div>

                  <div className="slider-curtain-frame">
                    <img src={issue.image} alt="Before" className="base-img" />
                    <div
                      className="curtain-after"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img src={issue.afterImage} alt="After" className="after-img" />
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPos}
                      onChange={(e) => setSliderPos(e.target.value)}
                      className="curtain-range-slider"
                    />

                    <div className="curtain-divider-line" style={{ left: `${sliderPos}%` }}>
                      <div className="curtain-handle">
                        <Icon.Sliders size={12} />
                      </div>
                    </div>

                    <span className="tag-curtain before">ORIGINAL DEFECT</span>
                    <span className="tag-curtain after">MUNICIPAL FIX</span>
                  </div>

                  <div className="proof-audit-box">
                    <div className="audit-header">
                      <Icon.Sparkles size={13} />
                      <span>Repair Proof Review</span>
                    </div>
                    <ul className="audit-findings">
                      {(issue.analysis?.findings || [
                        'Before/after evidence pair verified',
                        'Visual change detected in damaged region',
                        'GPS metadata matches municipal coordinates'
                      ]).map((item, idx) => (
                        <li key={idx}>
                          <Icon.Check size={11} /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className={`single-evidence-box ${evidenceImages.length > 1 ? 'has-gallery' : ''}`}>
                  <img src={evidenceImages[activeEvidenceIndex] || issue.image} alt={issue.title} className="single-evidence-img" />
                  <div className="evidence-overlay-meta">
                    <span className="photo-tag">
                      <Icon.Camera size={12} /> Field Photographic Evidence
                    </span>
                    <span className="ai-confidence-pill">
                      AI Detection: {issue.confidence}% Match
                    </span>
                  </div>
                  {evidenceImages.length > 1 && <div className="dossier-evidence-strip"><span>{evidenceImages.length} evidence photos</span><div>{evidenceImages.map((photo, index) => <button type="button" key={index} className={activeEvidenceIndex === index ? 'active' : ''} onClick={() => setActiveEvidenceIndex(index)} aria-label={`Show evidence photo ${index + 1}`}><img src={photo} alt="" /></button>)}</div></div>}
                </div>
              )}

              {/* Upvote & Community Engagement Bar */}
              <div className="community-engagement-bar">
                <button
                  className={`btn-upvote ${hasUpvoted ? 'voted' : ''}`}
                  onClick={handleUpvote}
                >
                  <Icon.ThumbsUp size={14} />
                  <span>{hasUpvoted ? 'Upvoted by You' : 'Upvote This Hazard'}</span>
                  <strong>({(issue.upvotes || 12) + (hasUpvoted ? 1 : 0)})</strong>
                </button>

                <span className="reported-by-note">
                  Filed by <b>{issue.isAnonymous ? 'Anonymous Citizen' : issue.reporter || 'Civic Contributor'}</b> • {issue.time}
                </span>
              </div>
            </div>

            {/* Right Column: Metadata, Timeline, Actions */}
            <div className="dossier-info-pane">
              <div className="category-pill-row">
                <span className={`category-tag ${issue.tone}`}>
                  {issue.type}
                </span>
                <span className={`status-tag-large ${issue.status.toLowerCase().replaceAll(' ', '-')}`}>
                  {issue.status}
                </span>
                {issue.adaAffected && (
                  <span className="hazard-special-pill ada">♿ ADA Impact</span>
                )}
                {issue.schoolZone && (
                  <span className="hazard-special-pill school">🚸 School Zone</span>
                )}
                {issue.bikeLaneBlocked && (
                  <span className="hazard-special-pill transit">🚲 Bike / Transit Lane</span>
                )}
                {issue.needsRework && (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Additional work required</span>
                )}
              </div>

              <h3 className="dossier-title">{issue.title}</h3>
              <p className="dossier-location">
                <Icon.MapPin size={14} /> {issue.place}
              </p>

              <div className="dossier-desc-card">
                <b>Incident Description</b>
                <p>{issue.description || 'No additional descriptive text logged.'}</p>
              </div>

              {/* Logistics Grid */}
              <div className="logistics-grid">
                <div className="logistic-item">
                  <small>Assigned Department</small>
                  <b>{issue.department || 'Public Works'}</b>
                </div>
                <div className="logistic-item">
                  <small>Operational Unit</small>
                  <b>{issue.assignedCrew || 'Dispatched Field Team'}</b>
                </div>
                <div className="logistic-item">
                  <small>Target SLA</small>
                  <b>{targetSla} Hours · {issue.priority || 'Normal'}</b>
                </div>
                <div className="logistic-item">
                  <small>Coordinates / accuracy</small>
                  <b>{issue.lat != null && issue.lng != null ? `${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}` : 'GPS not shared'}</b>
                  {issue.gpsAccuracy != null && <small>±{issue.gpsAccuracy} m reported accuracy</small>}
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="timeline-container">
                <span className="timeline-title">Resolution Workflow</span>
                <div className="dossier-timeline-bar">
                  {statusSteps.map((step, idx) => {
                    const isDone = currentIndex >= idx;
                    const isCurrent = currentIndex === idx;
                    return (
                      <div key={step} className={`step-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="node-circle">
                          {isDone ? <Icon.Check size={10} /> : idx + 1}
                        </div>
                        <span className="node-label">{step}</span>
                        {idx < statusSteps.length - 1 && <div className="node-connector"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit Trail Log */}
              {issue.auditTrail && (
                <div className="audit-trail-history">
                  <span className="history-label">Activity Log</span>
                  <div className="history-items">
                    {issue.auditTrail.map((log, i) => (
                      <div key={i} className="history-item">
                        <span className="history-dot"></span>
                        <small className="history-time">{log.time}</small>
                        <span className="history-text">{log.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar based on Role */}
              <div className="dossier-action-footer">
                {mode === 'Admin' ? (
                  <div className="admin-quick-actions">
                    {issue.status === 'In progress' && (
                      <button
                        className="btn-primary-gradient"
                        onClick={() => onResolveClick(issue)}
                      >
                        <Icon.Camera size={14} />
                        <span>Upload Post-Construction Photo</span>
                      </button>
                    )}
                    {issue.status === 'Reported' && (
                      <button
                        className="btn-secondary"
                        onClick={() => onUpdateStatus(issue.id, 'Verified')}
                      >
                        <Icon.CheckCircle size={14} />
                        <span>Verify Incident</span>
                      </button>
                    )}
                    {issue.status === 'Verified' && (
                      <button
                        className="btn-secondary"
                        onClick={() => onUpdateStatus(issue.id, 'Assigned')}
                      >
                        <Icon.Zap size={14} />
                        <span>Assign Response Crew</span>
                      </button>
                    )}
                    {issue.status === 'Assigned' && (
                      <button
                        className="btn-secondary"
                        onClick={() => onUpdateStatus(issue.id, 'In progress')}
                      >
                        <Icon.Clock size={14} />
                        <span>Mark Crew In Progress</span>
                      </button>
                    )}
                  </div>
                ) : issue.status === 'Awaiting citizen confirmation' ? (
                  <div className="citizen-proof-review-panel">
                    <div className="citizen-proof-review-copy">
                      <Icon.Camera size={17} />
                      <span><b>Did the repair happen?</b><small>Review the agent’s after-photo against your original report.</small></span>
                    </div>
                    {canReviewResolution ? (
                      <div className="citizen-proof-review-actions">
                        <button type="button" className="btn-secondary" onClick={() => onCitizenPhotoReview?.(issue.id, false)}>Still needs repair</button>
                        <button type="button" className="btn-primary-gradient" onClick={() => onCitizenPhotoReview?.(issue.id, true)}><Icon.CheckCircle size={14} /> Confirm repair</button>
                      </div>
                    ) : <small className="citizen-proof-owner-note">Only the report submitter can confirm this repair.</small>}
                  </div>
                ) : (
                  <div className="citizen-status-note">
                    {issue.status === 'Resolved' ? (
                      <div className="resolved-banner-citizen">
                        <Icon.CheckCircle size={15} />
                        <span>This municipal defect was fully resolved and validated by city inspectors.</span>
                      </div>
                    ) : (
                      <div className="in-progress-banner-citizen">
                        <Icon.Clock size={15} />
                        <span>Municipal crew is tracking this incident. Live notifications enabled.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 360 Drone Recon Simulator Modal */}
      {showDroneRecon && (
        <DroneReconModal issue={issue} onClose={() => setShowDroneRecon(false)} />
      )}
    </>
  );
}
