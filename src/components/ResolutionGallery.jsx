import React from 'react';
import { Icon } from './Icons';
import './ResolutionGallery.css';

const dateLabel = (value) => value
  ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  : 'Recently updated';

export default function ResolutionGallery({ issues = [], mode = 'Citizen', onOpenIssue, onUploadProof }) {
  const isAgent = mode === 'Admin';
  const workQueue = issues
    .filter((issue) => issue.status === 'In progress')
    .sort((a, b) => Number(Boolean(b.needsRework)) - Number(Boolean(a.needsRework))
      || new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const proofReports = issues
    .filter((issue) => issue.image && issue.afterImage && (
      issue.status === 'Resolved' || issue.status === 'Awaiting citizen confirmation' || issue.needsRework
    ))
    .sort((a, b) => new Date(b.afterUploadedAt || b.resolvedAt || b.createdAt || 0)
      - new Date(a.afterUploadedAt || a.resolvedAt || a.createdAt || 0));
  const awaitingCitizen = issues.filter((issue) => issue.status === 'Awaiting citizen confirmation').length;
  const resolvedReports = issues.filter((issue) => issue.status === 'Resolved').length;

  return (
    <section className={`resolution-gallery-page ${isAgent ? 'is-agent' : 'is-citizen'}`}>
      <header className="resolution-workspace-hero">
        <div className="resolution-workspace-hero-copy">
          <span className="resolution-gallery-eyebrow"><Icon.Camera size={14} /> {isAgent ? 'FIELD QUALITY · REPAIR EVIDENCE' : 'COMMUNITY REPAIR TRACKING'}</span>
          <h1>{isAgent ? 'Repair proof center' : 'Before & after'}</h1>
          <p>{isAgent
            ? 'Upload clear after-photos for active repairs. Citizens review the evidence before a report is closed.'
            : 'See the original report and the city team’s repair photo. Confirm the fix or send it back for more work.'}</p>
        </div>
        <div className="resolution-hero-mark"><Icon.Shield size={18} /><span>{isAgent ? 'AGENT WORKSPACE' : 'YOUR REPORTS'}</span></div>
        {isAgent && (
          <div className="resolution-agent-metrics">
            <div><span className="metric-dot amber" /><small>Ready for proof</small><b>{workQueue.length}</b></div>
            <div><span className="metric-dot blue" /><small>Citizen review</small><b>{awaitingCitizen}</b></div>
            <div><span className="metric-dot green" /><small>Verified repairs</small><b>{resolvedReports}</b></div>
          </div>
        )}
        {!isAgent && <div className="resolution-gallery-count"><b>{proofReports.length}</b><span>repair updates</span></div>}
      </header>

      {isAgent && (
        <section className="resolution-agent-queue" aria-labelledby="resolution-queue-title">
          <div className="resolution-section-heading">
            <div><span className="resolution-section-kicker">FIELD WORK</span><h2 id="resolution-queue-title">Repairs ready for an after-photo</h2><p>Choose a report to compare its original evidence with the completed work.</p></div>
            <span className="resolution-section-count">{workQueue.length} ACTIVE</span>
          </div>
          {workQueue.length ? (
            <div className="resolution-agent-queue-list">
              {workQueue.map((issue) => (
                <article className="resolution-agent-work-card" key={issue.id}>
                  <button type="button" className="resolution-agent-before" onClick={() => onOpenIssue?.(issue)} aria-label={`Open ${issue.id} report`}>
                    {issue.image ? <img src={issue.image} alt={`Before repair: ${issue.title}`} /> : <span><Icon.Camera size={24} />No before-photo</span>}
                    <i>BEFORE</i>
                  </button>
                  <div className="resolution-agent-work-copy">
                    <div className="resolution-agent-work-meta"><span>{issue.id}</span><span className={issue.needsRework ? 'needs-rework' : 'in-field'}>{issue.needsRework ? 'MORE WORK REQUESTED' : 'WORK IN PROGRESS'}</span></div>
                    <h3>{issue.title}</h3>
                    <p><Icon.MapPin size={13} /> {issue.place || 'Location not supplied'}</p>
                    <div className="resolution-agent-work-details"><span>{issue.department || 'Public works'}</span><span>{issue.assignedCrew || 'Response crew'}</span><span>Reported {dateLabel(issue.createdAt)}</span></div>
                    {issue.needsRework && issue.afterImage && <div className="resolution-last-attempt"><img src={issue.afterImage} alt="Previous repair attempt" /><span><b>Previous attempt</b><small>{issue.citizenReviewStatus === 'rejected' ? 'Reporter said it is still not fixed' : 'Agent requested additional work'}</small></span></div>}
                  </div>
                  <button type="button" className="resolution-upload-action" onClick={() => onUploadProof?.(issue)}><Icon.Camera size={16} /><span>{issue.afterImage ? 'Upload new after-photo' : 'Upload after-photo'}</span><Icon.ArrowRight size={15} /></button>
                </article>
              ))}
            </div>
          ) : (
            <div className="resolution-agent-empty"><span><Icon.CheckCircle size={20} /></span><div><b>No repairs are waiting for proof</b><p>Move an assigned report to In progress when the crew starts work. It will appear here for after-photo upload.</p></div></div>
          )}
        </section>
      )}

      <section className="resolution-proof-section">
        <div className="resolution-section-heading">
          <div><span className="resolution-section-kicker">VISUAL AUDIT TRAIL</span><h2>{isAgent ? 'Submitted repair evidence' : 'Your repair updates'}</h2><p>{isAgent ? 'Track proof awaiting citizen confirmation and completed repair records.' : 'Compare the city’s evidence with your original photo and respond to open requests.'}</p></div>
          <span className="resolution-section-count">{proofReports.length} RECORDS</span>
        </div>

        {proofReports.length ? (
          <div className="resolution-gallery-grid">
            {proofReports.map((issue) => {
              const awaiting = issue.status === 'Awaiting citizen confirmation';
              const needsMoreWork = Boolean(issue.needsRework);
              return (
                <article className="resolution-gallery-card" key={issue.id}>
                  <div className="resolution-gallery-card-top">
                    <div><span>{issue.id} · {issue.type}</span><h3>{issue.title}</h3><p>{issue.place}</p></div>
                    <span className={`resolution-review-badge ${awaiting ? 'pending' : needsMoreWork ? 'rework' : 'resolved'}`}>
                      {awaiting ? 'Awaiting reporter' : needsMoreWork ? 'More work needed' : issue.citizenReviewStatus === 'confirmed' ? 'Citizen confirmed' : 'Verified repair'}
                    </span>
                  </div>
                  <div className="resolution-gallery-pair">
                    <figure><img src={issue.image} alt={`Before: ${issue.title}`} /><figcaption><span>BEFORE</span><small>Citizen evidence</small></figcaption></figure>
                    <figure><img src={issue.afterImage} alt={`After: ${issue.title}`} /><figcaption><span>{needsMoreWork ? 'ATTEMPT' : 'AFTER'}</span><small>{issue.analysis?.agentReviewedBy || 'City agent'}</small></figcaption></figure>
                  </div>
                  <div className="resolution-gallery-card-footer">
                    <span><Icon.Clock size={13} /> Uploaded {dateLabel(issue.afterUploadedAt || issue.resolvedAt)}</span>
                    <button type="button" onClick={() => onOpenIssue?.(issue)}>{awaiting && !isAgent ? 'Review photos' : 'Open report'} <Icon.ArrowRight size={14} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="resolution-gallery-empty"><span><Icon.Camera size={22} /></span><h3>No repair photos yet</h3><p>{isAgent ? 'After-photo uploads and their reporter reviews will be listed here.' : 'When the city team uploads repair proof for one of your reports, it will appear here.'}</p></div>
        )}
      </section>
    </section>
  );
}
