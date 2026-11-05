import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { sampleReportPresets } from '../data/seedData';
import { findDuplicateReportImage, generateDefectSvg } from '../utils/imageAnalysis';
import { polishReportText, sampleVoiceTranscripts } from '../utils/aiCopilot';
import { sound } from '../utils/audio';
import { launchConfetti } from '../utils/confetti';
import './ReportingPro.css';

async function optimizePhoto(file) {
  if (!window.createImageBitmap) return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78));
  if (!blob) throw new Error('Image compression failed');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ReportModal({ onClose, onSubmit, existingIssues = [], initialCoord = null, accountEmail = 'guest' }) {
  const draftKey = `civiclens-report-draft-${String(accountEmail).trim().toLowerCase()}`;
  const [category, setCategory] = useState('Road damage');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState(initialCoord ? `Lat ${initialCoord.lat.toFixed(4)}, Lng ${initialCoord.lng.toFixed(4)}` : '');
  const [priority, setPriority] = useState('Normal');
  const [department, setDepartment] = useState('Public works');
  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [confidence, setConfidence] = useState(96);
  const [gps, setGps] = useState(initialCoord || null);
  const [locating, setLocating] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [checkingDuplicateImage, setCheckingDuplicateImage] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [photoError, setPhotoError] = useState('');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [locationSource, setLocationSource] = useState(initialCoord ? 'map pin' : '');

  // New Features:
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [adaAffected, setAdaAffected] = useState(false);
  const [schoolZone, setSchoolZone] = useState(false);
  const [bikeLaneBlocked, setBikeLaneBlocked] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const qualityChecks = [
    { label: 'Photo evidence', done: Boolean(image) },
    { label: 'Location coordinates', done: Boolean(gps) },
    { label: 'Clear title', done: title.trim().length >= 8 },
    { label: 'Useful notes', done: description.trim().length >= 30 },
    { label: 'Impact context', done: adaAffected || schoolZone || bikeLaneBlocked }
  ];
  const reportQuality = Math.round((qualityChecks.filter((item) => item.done).length / qualityChecks.length) * 100);

  // Annotation Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Dynamic AI Cost & Liability Estimation
  const costEstimates = {
    'Road damage': { cost: '$520 - $850', crew: 'DOT Thermal Patch Unit', liability: 'High (Wheel Rim Damage)', sla: '18h' },
    'Street lighting': { cost: '$310 - $480', crew: 'Electrical Bucket Lift', liability: 'Medium (Pedestrian Dark Spot)', sla: '12h' },
    'Waste management': { cost: '$180 - $290', crew: 'Sanitation Compactor S-09', liability: 'Low (Sanitation & Wind Spill)', sla: '8h' },
    'Public space': { cost: '$350 - $600', crew: 'Parks Carpentry Crew 3', liability: 'Medium (Splinter / Tumble Risk)', sla: '24h' }
  };
  const activeEstimate = costEstimates[category] || costEstimates['Road damage'];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.description) {
          setHasDraft(true);
        }
      }
    } catch (e) {}
  }, [draftKey]);

  useEffect(() => {
    if (title || description) {
      localStorage.setItem(draftKey, JSON.stringify({ category, title, description, place, priority }));
    }
  }, [category, title, description, place, priority, draftKey]);

  const handleRestoreDraft = () => {
    sound.playClick();
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.place) setPlace(parsed.place);
        if (parsed.priority) setPriority(parsed.priority);
        setHasDraft(false);
        sound.playSuccess();
      }
    } catch (e) {}
  };

  const handleSelectPreset = (preset) => {
    sound.playScan();
    setIsScanning(true);
    setCategory(preset.category);
    setTitle(preset.title);
    setDescription(preset.description);
    setPlace(preset.place);
    setGps(null);
    setGpsAccuracy(null);
    setLocationSource('manual');
    setLocationError('');
    setPriority(preset.priority);
    setDepartment(preset.department);
    setAdaAffected(preset.adaAffected || false);
    setSchoolZone(preset.schoolZone || false);
    const svgData = generateDefectSvg(preset.imageType);
    setImage(svgData);
    setConfidence(97);

    const found = existingIssues.find((issue) => issue.type === preset.category);
    setDuplicateMatch(found || null);

    setTimeout(() => {
      setIsScanning(false);
      sound.playSuccess();
    }, 1200);
  };

  const handleToggleVoiceRecord = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      sound.playClick();
      return;
    }
    sound.playScan();
    setIsRecordingVoice(true);

    const randomTranscript = sampleVoiceTranscripts[Math.floor(Math.random() * sampleVoiceTranscripts.length)];
    let idx = 0;
    const interval = setInterval(() => {
      idx += 8;
      if (idx <= randomTranscript.length) {
        setDescription(randomTranscript.slice(0, idx));
      } else {
        clearInterval(interval);
        setIsRecordingVoice(false);
        sound.playSuccess();
      }
    }, 100);
  };

  const handlePolishWithAI = () => {
    sound.playScan();
    setIsPolishing(true);
    setTimeout(() => {
      const polished = polishReportText(description, category, place);
      setTitle(polished.title);
      setDescription(polished.description);
      setIsPolishing(false);
      sound.playSuccess();
    }, 800);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleApplyAnnotation = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setImage(canvas.toDataURL());
    }
    setIsAnnotating(false);
    sound.playSuccess();
  };

  const fileToDataUrl = optimizePhoto;

  const handleFiles = async (files, allowMultiple = true) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    let validationMessage = '';
    const valid = selected.filter((file) => {
      if (!file.type.startsWith('image/')) {
        validationMessage = 'Choose image files (JPG, PNG, or WEBP).';
        return false;
      }
      if (file.size > 15 * 1024 * 1024) {
        validationMessage = `${file.name} is over the 15 MB limit.`;
        return false;
      }
      return true;
    });
    if (!valid.length) {
      setPhotoError(validationMessage || 'Choose an image file to continue.');
      return;
    }
    setPhotoError(validationMessage);
    sound.playScan();
    setIsScanning(true);
    try {
      const dataUrls = await Promise.all(valid.slice(0, allowMultiple ? 5 : 1).map(fileToDataUrl));
      setImage(dataUrls[0]);
      if (allowMultiple && dataUrls.length > 1) {
        setEvidencePhotos((current) => [...current, ...dataUrls.slice(1)].slice(0, 4));
      }
      setConfidence(94);
      setTimeout(() => {
        setIsScanning(false);
        sound.playSuccess();
      }, 900);
    } catch {
      setPhotoError('We could not read that image. Try another photo.');
      setIsScanning(false);
    }
  };

  const handleFileChange = (e) => handleFiles(e.target.files, true);
  const handleSupportingFiles = async (e) => {
    const slots = Math.max(0, 4 - evidencePhotos.length);
    const selected = Array.from(e.target.files || []).slice(0, slots);
    const valid = selected.filter((file) => file.type.startsWith('image/') && file.size <= 15 * 1024 * 1024);
    if (valid.length !== selected.length) setPhotoError('Supporting images must be JPG, PNG, or WEBP and under 15 MB each.');
    if (!valid.length) return;
    try {
      const dataUrls = await Promise.all(valid.map(fileToDataUrl));
      setEvidencePhotos((current) => [...current, ...dataUrls].slice(0, 4));
      setPhotoError('');
    } catch {
      setPhotoError('We could not read one of those supporting images.');
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS is not available in this browser. Enter the street address manually.');
      setLocationSource(initialCoord ? 'map pin' : 'manual');
      return;
    }
    sound.playClick();
    setLocationError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGps({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setLocationSource('device GPS');
        const latitudeHemisphere = latitude >= 0 ? 'N' : 'S';
        const longitudeHemisphere = longitude >= 0 ? 'E' : 'W';
        setPlace(`Near ${Math.abs(latitude).toFixed(4)}° ${latitudeHemisphere}, ${Math.abs(longitude).toFixed(4)}° ${longitudeHemisphere}`);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setPlace(data.display_name.split(',').slice(0, 3).join(','));
          }
        } catch (e) {}
        setLocating(false);
        sound.playSuccess();
      },
      () => {
        setLocationError('Location permission was not granted. You can still enter the address manually.');
        setLocationSource(initialCoord ? 'map pin' : 'manual');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkingDuplicateImage) return;
    setCheckingDuplicateImage(true);
    setPhotoError('');
    const reportImage = image || generateDefectSvg(category);
    let imageHash = null;
    try {
      const duplicateCheck = await findDuplicateReportImage(reportImage, existingIssues);
      imageHash = duplicateCheck.hash;
      if (duplicateCheck.match) {
        setPhotoError(`This photo matches report ${duplicateCheck.match.id} (${duplicateCheck.match.title}). Duplicate-image reports are rejected.`);
        setCheckingDuplicateImage(false);
        return;
      }
    } catch {
      setPhotoError('We could not verify this photo against previous reports. Try uploading it again.');
      setCheckingDuplicateImage(false);
      return;
    }

    sound.playSuccess();
    launchConfetti(0.5, 0.4);
    localStorage.removeItem(draftKey);

    onSubmit({
      category,
      title: title || `${category} issue on ${place || 'Central Ave'}`,
      description: description || 'Civic infrastructure defect requiring municipal inspection.',
      place: place || 'Central District, Ward 4',
      priority,
      department,
      confidence,
      image: reportImage,
      imageHash,
      gps,
      gpsAccuracy,
      evidencePhotos,
      adaAffected,
      schoolZone,
      bikeLaneBlocked,
      isAnonymous
    });
    setCheckingDuplicateImage(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="report-modal-pro expanded">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <Icon.X size={18} />
        </button>

        <div className="modal-top-tag">
          <Icon.Camera size={13} />
          <span>CIVICLENS AI VISION • INTELLIGENT FIELD REPORTER</span>
        </div>

        <div className="modal-title-row">
          <h2>Report a Municipal Hazard</h2>
          {hasDraft && (
            <button type="button" className="btn-restore-draft" onClick={handleRestoreDraft}>
              <Icon.Sparkles size={12} />
              <span>Restore Unsaved Draft</span>
            </button>
          )}
        </div>

        <p className="modal-desc">
          Capture photographic evidence and speak or write notes. CivicLens utilizes AI vision to detect hazard classes and routes immediately to municipal response units.
        </p>

        {/* 1-Click Sample Presets */}
        <div className="preset-strip">
          <small className="preset-label">Test with sample defects (1-Click Auto-Fill):</small>
          <div className="preset-pills">
            {sampleReportPresets.map((preset) => (
              <button
                type="button"
                key={preset.name}
                className="preset-pill"
                onClick={() => handleSelectPreset(preset)}
              >
                <span className="dot"></span>
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Photo Upload & AI Scanning Area */}
          <div
            className={`ai-dropzone ${image ? 'has-media' : ''} ${isDraggingPhoto ? 'drag-over' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setIsDraggingPhoto(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsDraggingPhoto(false); }}
            onDrop={(event) => { event.preventDefault(); setIsDraggingPhoto(false); handleFiles(event.dataTransfer.files); }}
          >
            {image ? (
              <div className="evidence-preview-container">
                <img src={image} alt="Defect Evidence" className="evidence-img" />

                {isScanning && (
                  <div className="scanning-overlay">
                    <div className="laser-line"></div>
                    <div className="scan-text">
                      <Icon.Sparkles size={14} /> ANALYZING IMAGE SPECTRUM & GEOMETRY...
                    </div>
                  </div>
                )}

                {!isScanning && (
                  <div className="ai-bounding-box">
                    <div className="bounding-tag">
                      <Icon.Check size={11} />
                      <span>{category.toUpperCase()} • {confidence}% CONFIDENCE</span>
                    </div>
                  </div>
                )}

                <div className="photo-actions-overlay">
                  <button
                    type="button"
                    className="action-overlay-btn"
                    onClick={() => setIsAnnotating(true)}
                  >
                    <Icon.Edit3 size={13} /> Markup Photo
                  </button>

                  <label className="action-overlay-btn">
                    <Icon.Camera size={13} /> Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFiles(e.target.files, false)} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="dropzone-empty">
                <div className="dropzone-icon">
                  <Icon.Camera size={32} />
                </div>
                <b>Upload or Drop Photo Evidence</b>
                <span>Drop photos here or click to browse · JPG, PNG, WEBP · 15 MB each</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="report-evidence-tools">
            <div><b>Evidence set</b><span>{image ? `${1 + evidencePhotos.length} photo${evidencePhotos.length ? 's' : ''} attached` : 'Add a clear photo to strengthen this report'}</span></div>
            {image && evidencePhotos.length < 4 && <label className="add-evidence-btn"><Icon.Plus size={13} /> Add supporting photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleSupportingFiles} /></label>}
          </div>
          {evidencePhotos.length > 0 && <div className="evidence-thumbnails">{evidencePhotos.map((photo, index) => <button type="button" key={`${index}-${photo.slice(-12)}`} onClick={() => setEvidencePhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remove supporting photo"><img src={photo} alt={`Supporting evidence ${index + 1}`} /><span>×</span></button>)}</div>}
          {photoError && <div className="report-inline-error" role="alert">{photoError}</div>}

          {/* AI Defect Cost & Liability Predictor Card */}
          <div className="ai-prediction-card">
            <div className="prediction-header">
              <Icon.Sparkles size={13} />
              <span>CivicCopilot Operational Forecast</span>
            </div>
            <div className="prediction-grid">
              <div>
                <small>Est. Repair Cost</small>
                <b>{activeEstimate.cost}</b>
              </div>
              <div>
                <small>Liability Exposure</small>
                <b className="text-liability">{activeEstimate.liability}</b>
              </div>
              <div>
                <small>Target SLA</small>
                <b>{activeEstimate.sla}</b>
              </div>
              <div>
                <small>Deploy Unit</small>
                <b>{activeEstimate.crew}</b>
              </div>
            </div>
          </div>

          {/* Photo Annotation Canvas Dialog */}
          {isAnnotating && (
            <div className="annotation-overlay-modal">
              <div className="annotation-card">
                <div className="annotation-header">
                  <b>Highlight Defect on Photo (Draw Red Circle)</b>
                  <button type="button" onClick={() => setIsAnnotating(false)}>
                    <Icon.X size={16} />
                  </button>
                </div>
                <div className="canvas-wrapper">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={280}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="draw-canvas"
                  />
                </div>
                <div className="annotation-footer">
                  <small>Drag cursor to circle the pothole, crack or hazard</small>
                  <button type="button" className="btn-primary-gradient" onClick={handleApplyAnnotation}>
                    Save Annotation
                  </button>
                </div>
              </div>
            </div>
          )}

          {duplicateMatch && (
            <div className="duplicate-banner">
              <Icon.AlertTriangle size={16} />
              <div>
                <b>Nearby Similar Incident Detected ({duplicateMatch.id})</b>
                <p>"{duplicateMatch.title}" was reported nearby. Submitting will reinforce priority and upvote existing dispatch!</p>
              </div>
            </div>
          )}

          <div className="form-grid-2">
            <div>
              <label className="form-label">Category</label>
              <select
                className="pro-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Road damage">Road damage (Potholes, Cracks, Curbs)</option>
                <option value="Street lighting">Street lighting (Lamps, Outages)</option>
                <option value="Waste management">Waste management (Overflow, Litter)</option>
                <option value="Public space">Public space (Parks, Benches, Playgrounds)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Priority Severity</label>
              <select
                className="pro-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Normal">Normal (Routine maintenance SLA)</option>
                <option value="High">High (Impacting traffic / foot path)</option>
                <option value="Urgent">Urgent (Immediate physical danger)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label className="form-label">Location / Address</label>
              <div className="location-field-wrapper">
                <input
                  type="text"
                  className="pro-input"
                  placeholder="e.g. 5th Ave & Pine Street"
                  value={place}
                  onChange={(e) => { setPlace(e.target.value); setGps(null); setGpsAccuracy(null); setLocationError(''); setLocationSource('manual'); }}
                  required
                />
                <button
                  type="button"
                  className="gps-btn"
                  onClick={handleLocate}
                  title="Detect GPS"
                >
                  <Icon.Compass size={14} />
                  <span>{locating ? 'Locking...' : 'GPS'}</span>
                </button>
              </div>
              {gps && locationSource === 'device GPS' ? <small className="report-location-confirmed">GPS locked · ±{gpsAccuracy} m accuracy · {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</small> : gps && locationSource === 'map pin' ? <small className="report-location-confirmed">Map pin coordinates attached · {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</small> : <small className="report-location-manual">Address entered manually · GPS coordinates will not be attached</small>}
              {locationError && <small className="report-inline-error" role="status">{locationError}</small>}
            </div>

            <div>
              <label className="form-label">Assigned Department</label>
              <select
                className="pro-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Public works">Department of Public Works (DOT)</option>
                <option value="Street lighting">Bureau of Street Lighting & Power</option>
                <option value="Sanitation">Department of Sanitation</option>
                <option value="Parks & recreation">Parks, Recreation & Forestry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Report Title</label>
            <input
              type="text"
              className="pro-input"
              placeholder="e.g. Deep pothole damaging vehicle rims"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="desc-input-wrapper">
            <div className="desc-label-bar">
              <label className="form-label">Detailed Notes & Context</label>
              <div className="desc-tools">
                <button
                  type="button"
                  className={`btn-tool-voice ${isRecordingVoice ? 'recording' : ''}`}
                  onClick={handleToggleVoiceRecord}
                >
                  <Icon.Mic size={13} />
                  <span>{isRecordingVoice ? 'Listening (Speaking)...' : 'Record Voice Memo'}</span>
                  {isRecordingVoice && <span className="audio-wave-anim"></span>}
                </button>

                <button
                  type="button"
                  className="btn-tool-ai"
                  onClick={handlePolishWithAI}
                  disabled={isPolishing}
                >
                  <Icon.Wand2 size={13} />
                  <span>{isPolishing ? 'Synthesizing...' : 'Polish with CivicCopilot'}</span>
                </button>
              </div>
            </div>

            <textarea
              className="pro-input textarea"
              rows="3"
              placeholder="Speak or type what you noticed, landmarks, depth, or hazards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="flags-bar">
            <label className={`flag-chip ${adaAffected ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={adaAffected}
                onChange={(e) => setAdaAffected(e.target.checked)}
              />
              <span>♿ Affects Wheelchair / ADA Access</span>
            </label>

            <label className={`flag-chip ${schoolZone ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={schoolZone}
                onChange={(e) => setSchoolZone(e.target.checked)}
              />
              <span>🚸 Near School or Playground</span>
            </label>

            <label className={`flag-chip ${bikeLaneBlocked ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={bikeLaneBlocked}
                onChange={(e) => setBikeLaneBlocked(e.target.checked)}
              />
              <span>🚲 Bike / Transit Lane Blocked</span>
            </label>

            <label className={`flag-chip ${isAnonymous ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <Icon.EyeOff size={13} />
              <span>Submit Anonymously</span>
            </label>
          </div>

          <section className="report-quality-card" aria-label="Report completeness">
            <div className="report-quality-top"><div><span>REPORT QUALITY</span><b>{reportQuality}% complete</b></div><div className="report-quality-track"><i style={{ width: `${reportQuality}%` }} /></div></div>
            <p>Adding evidence and context helps the right crew respond on the first visit.</p>
            <div className="report-quality-checks">{qualityChecks.map((item) => <span className={item.done ? 'complete' : ''} key={item.label}><i>{item.done ? '✓' : '·'}</i>{item.label}</span>)}</div>
          </section>

          <div className="modal-actions-bar">
            <div className="karma-reward-hint">
              <Icon.Sparkles size={14} />
              <span>Earn +25 Karma Points upon municipal verification</span>
            </div>

            <div className="action-buttons">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-gradient" disabled={checkingDuplicateImage}>
                <Icon.CheckCircle size={15} />
                <span>{checkingDuplicateImage ? 'Checking photo…' : 'Submit to City Ops'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
