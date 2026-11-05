import React, { useState } from 'react';
import { Icon } from './Icons';
import { compareImages, optimizeEvidencePhoto } from '../utils/imageAnalysis';
import { sound } from '../utils/audio';
import { launchConfetti } from '../utils/confetti';

export default function ResolutionModal({ issue, agentName, onClose, onResolve, onIncomplete }) {
  const [afterImage, setAfterImage] = useState(null);
  const [afterPhotoName, setAfterPhotoName] = useState('');
  const [afterUploadedAt, setAfterUploadedAt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [agentConfirmed, setAgentConfirmed] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const runAnalysis = async (imageData, fileName) => {
    setAfterImage(imageData);
    setAfterPhotoName(fileName);
    setAfterUploadedAt(new Date().toISOString());
    setAnalysisResult(null);
    setAgentConfirmed(false);
    setUploadError('');
    setAnalyzing(true);
    sound.playScan();

    const result = await compareImages(issue.image, imageData);
    setAnalysisResult(result);
    setAnalyzing(false);
    if (!result.comparisonFailed) sound.playSuccess();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Choose an image file for the completed repair photo.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Choose an image smaller than 25 MB.');
      return;
    }

    setAfterImage(null);
    setAfterPhotoName('');
    setAnalysisResult(null);
    setAgentConfirmed(false);
    setAnalyzing(true);
    setUploadError('');
    optimizeEvidencePhoto(file)
      .then((imageData) => runAnalysis(imageData, file.name))
      .catch(() => {
        setAnalyzing(false);
        setUploadError('This image could not be opened. Try another photo.');
      });
    event.target.value = '';
  };

  const handleConfirmResolution = () => {
    if (!afterImage || !analysisResult || analysisResult.comparisonFailed || !agentConfirmed) return;
    sound.playSuccess();
    launchConfetti(0.5, 0.4);
    onResolve({
      afterImage,
      afterPhotoName,
      afterUploadedAt,
      agentConfirmed: true,
      analysis: { ...analysisResult, agentApproved: true }
    });
  };

  const comparisonReady = Boolean(analysisResult && !analysisResult.comparisonFailed && !analyzing);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="report-modal-pro">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal"><Icon.X size={18} /></button>
        <div className="modal-top-tag"><Icon.Camera size={13} /><span>POST-CONSTRUCTION PHOTO REVIEW · {issue.id}</span></div>
        <h2>Submit repair proof for review</h2>
        <p className="modal-desc">Upload a real after-photo and compare it with the citizen’s original evidence. The reporter will receive an in-app update and confirm whether the repair is complete.</p>

        <div className="resolution-proof-grid">
          <div className="proof-card">
            <span className="proof-tag before">BEFORE · CITIZEN PHOTO</span>
            <img src={issue.image} alt="Original reported issue" className="proof-thumb" />
            <small>{issue.title}</small>
          </div>

          <div className="proof-card after-drop">
            <span className="proof-tag after">AFTER · AGENT UPLOAD</span>
            {afterImage ? (
              <div className="after-thumb-wrapper">
                <img src={afterImage} alt="Agent's post-construction photo" className="proof-thumb" />
                <label className="change-after-label"><Icon.Camera size={12} /> Replace photo<input type="file" accept="image/*" onChange={handleFileChange} /></label>
              </div>
            ) : (
              <label className="after-dropzone-empty">
                <Icon.Camera size={24} />
                <b>Upload after-photo</b>
                <span>Take this photo after the repair is finished</span>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
            {afterPhotoName && <small className="block truncate px-2 text-center" title={afterPhotoName}>{afterPhotoName}</small>}
          </div>
        </div>

        {uploadError && <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{uploadError}</div>}

        {analyzing && (
          <div className="analysis-status-card analyzing">
            <div className="pulse-radar-dot" />
            <div><b>Comparing the before and after photos…</b><p>Checking the sampled images for visible differences.</p></div>
          </div>
        )}

        {analysisResult && !analyzing && (
          <div className={`analysis-status-card ${analysisResult.comparisonFailed ? 'border border-amber-300 bg-amber-50 text-amber-950' : 'border border-sky-200 bg-sky-50 text-sky-950'}`}>
            <div className="flex items-center justify-between gap-3">
              <b>{analysisResult.comparisonFailed ? 'Photo comparison needs another upload' : 'Photo comparison ready for agent review'}</b>
              {!analysisResult.comparisonFailed && <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold">{analysisResult.changeRatio}% visual change</span>}
            </div>
            <div className="mt-2 space-y-1 text-xs leading-5">{analysisResult.findings.map((finding, index) => <p key={index}>• {finding}</p>)}</div>
          </div>
        )}

        <label className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${comparisonReady ? 'cursor-pointer border-teal-200 bg-teal-50/70' : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'}`}>
          <input type="checkbox" className="mt-1 h-4 w-4 accent-teal-700" checked={agentConfirmed} disabled={!comparisonReady} onChange={(event) => setAgentConfirmed(event.target.checked)} />
          <span className="text-sm leading-5 text-slate-800"><b className="block">I inspected both photos and confirm the repair is complete.</b><small className="mt-1 block text-slate-600">Agent sign-off: {agentName || 'City agent'}. Pixel differences alone do not certify construction.</small></span>
        </label>

        <div className="modal-actions-bar">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          {afterImage && <button type="button" className="btn-secondary" disabled={!comparisonReady} onClick={() => onIncomplete?.({
            afterImage,
            afterPhotoName,
            afterUploadedAt,
            analysis: analysisResult,
          })}>Needs more work</button>}
          <button type="button" className="btn-primary-gradient" disabled={!comparisonReady || !agentConfirmed} onClick={handleConfirmResolution}>
            <Icon.Bell size={15} /><span>Send proof to citizen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
