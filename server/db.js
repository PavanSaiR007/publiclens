import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initialIssues, initialCrews, initialPerks } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function imageHashDistance(firstHash, secondHash) {
  if (!/^[a-f\d]{16}$/i.test(firstHash || '') || !/^[a-f\d]{16}$/i.test(secondHash || '')) return Infinity;
  let distance = 0;
  for (let index = 0; index < 16; index += 1) {
    let bits = parseInt(firstHash[index], 16) ^ parseInt(secondHash[index], 16);
    while (bits) {
      distance += bits & 1;
      bits >>>= 1;
    }
  }
  return distance;
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state cache
let state = {
  issues: [],
  crews: [],
  perks: [],
  activityLog: [],
  meta: {
    initializedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.issues) && parsed.issues.length > 0) {
        state = parsed;
        console.log(`[CivicLens DB] Loaded ${state.issues.length} issues, ${state.crews?.length || 0} crews from disk.`);
        return;
      }
    }
  } catch (err) {
    console.warn('[CivicLens DB] Failed to parse existing database.json, re-seeding...', err.message);
  }

  // Seed default data
  state = {
    issues: [...initialIssues],
    crews: [...initialCrews],
    perks: [...initialPerks],
    activityLog: [
      { id: 'LOG-01', timestamp: new Date().toISOString(), text: 'System initialized and municipal telemetry connected' }
    ],
    meta: {
      initializedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  };
  saveDatabase();
  console.log(`[CivicLens DB] Initialized fresh database with ${state.issues.length} seed incidents.`);
}

function saveDatabase() {
  try {
    state.meta.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[CivicLens DB] Error writing database.json:', err);
  }
}

// Initialize on import
loadDatabase();

export const db = {
  getAllIssues(filters = {}) {
    let result = [...state.issues];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.place && i.place.toLowerCase().includes(q)) ||
          (i.id && i.id.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.department && i.department.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter((i) => i.status?.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.category && filters.category !== 'All') {
      result = result.filter((i) => i.type?.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.priority && filters.priority !== 'All') {
      result = result.filter((i) => i.priority?.toLowerCase() === filters.priority.toLowerCase());
    }

    if (filters.reporterEmail) {
      const reporterEmail = filters.reporterEmail.trim().toLowerCase();
      result = result.filter((i) => (i.reporterEmail || i.reporterId || '').toLowerCase() === reporterEmail);
    }

    if (filters.sort === 'upvotes') {
      result.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filters.sort === 'urgency') {
      const pWeights = { Critical: 4, Urgent: 3, High: 2, Normal: 1 };
      result.sort((a, b) => (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0));
    } else {
      // Newest first default (by id or index)
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  },

  getIssueById(id) {
    return state.issues.find((i) => i.id === id) || null;
  },

  findDuplicateImageHash(imageHash) {
    if (!/^[a-f\d]{16}$/i.test(imageHash || '')) return null;
    return state.issues.find((issue) => imageHashDistance(imageHash, issue.imageHash) <= 3) || null;
  },

  addIssue(issueData) {
    const id = issueData.id || `CIV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newIssue = {
      id,
      title: issueData.title || 'Untitled Civic Defect',
      place: issueData.place || 'Downtown Metro Area',
      type: issueData.type || 'Road damage',
      time: 'Just now',
      status: issueData.status || 'Reported',
      priority: issueData.priority || 'Normal',
      department: issueData.department || 'Public works',
      assignedCrew: issueData.assignedCrew || 'Awaiting Triage',
      tone: issueData.type === 'Street lighting' ? 'green' : issueData.type === 'Waste management' ? 'amber' : issueData.type === 'Public space' ? 'violet' : 'blue',
      x: issueData.x ?? null,
      y: issueData.y ?? null,
      lat: issueData.lat ?? null,
      lng: issueData.lng ?? null,
      gpsAccuracy: issueData.gpsAccuracy ?? null,
      confidence: issueData.confidence || 95,
      description: issueData.description || 'Civic defect reported via mobile lens.',
      image: issueData.image || null,
      imageHash: issueData.imageHash || null,
      evidencePhotos: issueData.evidencePhotos || [],
      createdAt: issueData.createdAt || new Date().toISOString(),
      hasAfter: Boolean(issueData.hasAfter),
      afterImage: issueData.afterImage || null,
      afterPhotoName: issueData.afterPhotoName || '',
      afterUploadedAt: issueData.afterUploadedAt || null,
      resolvedAt: issueData.resolvedAt || null,
      needsRework: Boolean(issueData.needsRework),
      citizenReviewStatus: issueData.citizenReviewStatus || null,
      citizenReviewRequestedAt: issueData.citizenReviewRequestedAt || null,
      citizenReviewRespondedAt: issueData.citizenReviewRespondedAt || null,
      analysis: issueData.analysis || null,
      upvotes: 1,
      reporter: issueData.reporter || 'Anonymous Resident',
      reporterEmail: issueData.reporterEmail || '',
      reporterId: issueData.reporterId || issueData.reporterEmail || '',
      isAnonymous: Boolean(issueData.isAnonymous),
      adaAffected: Boolean(issueData.adaAffected),
      schoolZone: Boolean(issueData.schoolZone),
      bikeLaneBlocked: Boolean(issueData.bikeLaneBlocked),
      isDuplicate: Boolean(issueData.isDuplicate),
      duplicateOf: issueData.duplicateOf || null,
      duplicateDistanceMeters: issueData.duplicateDistanceMeters ?? null,
      auditTrail: [
        {
          time: 'Just now',
          event: `Incident filed by ${issueData.reporter || 'Anonymous Resident'}`
        },
        ...(issueData.auditTrail || [])
      ]
    };

    state.issues.unshift(newIssue);
    this.logActivity(`New report registered: ${newIssue.title} (${newIssue.id})`);
    saveDatabase();
    return newIssue;
  },

  updateIssue(id, updates) {
    const index = state.issues.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const current = state.issues[index];
    const newAudit = [...(current.auditTrail || [])];

    if (updates.status && updates.status !== current.status) {
      newAudit.unshift({
        time: 'Just now',
        event: `Status transitioned from "${current.status}" to "${updates.status}"`
      });
    }

    if (updates.assignedCrew && updates.assignedCrew !== current.assignedCrew) {
      newAudit.unshift({
        time: 'Just now',
        event: `Assigned response crew: ${updates.assignedCrew}`
      });
    }

    if (updates.priority && updates.priority !== current.priority) {
      newAudit.unshift({
        time: 'Just now',
        event: `Priority escalated to ${updates.priority}`
      });
    }

    if (updates.needsRework && updates.reworkNote && !updates.auditEntry?.event) {
      newAudit.unshift({ time: 'Just now', event: updates.reworkNote });
    }
    if (updates.auditEntry?.event) newAudit.unshift(updates.auditEntry);

    const updated = {
      ...current,
      ...updates,
      auditTrail: newAudit
    };
    delete updated.auditEntry;

    state.issues[index] = updated;
    this.logActivity(`Incident ${id} updated: ${updates.status || 'data modified'}`);
    saveDatabase();
    return updated;
  },

  upvoteIssue(id) {
    const issue = state.issues.find((i) => i.id === id);
    if (!issue) return null;
    issue.upvotes = (issue.upvotes || 0) + 1;
    saveDatabase();
    return issue;
  },

  resolveIssue(id, { afterImage, afterPhotoName, afterUploadedAt, analysis } = {}) {
    if (!afterImage || analysis?.agentApproved !== true) return null;
    const issue = state.issues.find((i) => i.id === id);
    if (!issue || issue.status !== 'In progress') return null;

    issue.status = 'Resolved';
    issue.hasAfter = true;
    issue.afterImage = afterImage;
    issue.afterPhotoName = afterPhotoName || '';
    issue.afterUploadedAt = afterUploadedAt || new Date().toISOString();
    issue.resolvedAt = new Date().toISOString();
    issue.needsRework = false;
    issue.analysis = analysis;

    issue.auditTrail = [
      {
        time: 'Just now',
        event: `Post-construction photo approved by ${analysis.agentReviewedBy || 'city agent'}`
      },
      ...(issue.auditTrail || [])
    ];

    this.logActivity(`Incident ${id} verified and resolved.`);
    saveDatabase();
    return issue;
  },

  deleteIssue(id) {
    const prevCount = state.issues.length;
    state.issues = state.issues.filter((i) => i.id !== id);
    if (state.issues.length !== prevCount) {
      this.logActivity(`Incident ${id} deleted.`);
      saveDatabase();
      return true;
    }
    return false;
  },

  getCrews() {
    return state.crews;
  },

  updateCrew(id, updates) {
    const crew = state.crews.find((c) => c.id === id);
    if (!crew) return null;
    Object.assign(crew, updates);
    saveDatabase();
    return crew;
  },

  getAnalytics() {
    const total = state.issues.length;
    const resolved = state.issues.filter((i) => i.status === 'Resolved').length;
    const inProgress = state.issues.filter((i) => i.status === 'In progress').length;
    const verified = state.issues.filter((i) => i.status === 'Verified').length;
    const open = total - resolved;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    const cityHealthIndex = Math.min(100, Math.max(50, Math.round(75 + (resolutionRate * 0.25))));

    const departmentStats = {};
    for (const issue of state.issues) {
      const dept = issue.department || 'Public works';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, resolved: 0, avgSlaHours: 18 };
      }
      departmentStats[dept].total += 1;
      if (issue.status === 'Resolved') departmentStats[dept].resolved += 1;
    }

    return {
      totalIssues: total,
      openIssues: open,
      resolvedIssues: resolved,
      inProgressIssues: inProgress,
      verifiedIssues: verified,
      resolutionRate,
      cityHealthIndex,
      departmentStats,
      activeCrews: state.crews.length,
      recentActivity: state.activityLog.slice(0, 10),
      timestamp: new Date().toISOString()
    };
  },

  getPerks() {
    return state.perks;
  },

  redeemPerk(perkId, citizenName = 'Resident') {
    const perk = state.perks.find((p) => p.id === perkId);
    if (!perk) return null;

    const ticketCode = `PASS-${Math.floor(100000 + Math.random() * 900000)}`;
    const pass = {
      ...perk,
      ticketCode,
      citizenName,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    };

    this.logActivity(`Perk voucher ${perk.title} issued to ${citizenName} (${ticketCode})`);
    return pass;
  },

  logActivity(text) {
    const entry = {
      id: `LOG-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      text
    };
    state.activityLog.unshift(entry);
    if (state.activityLog.length > 50) {
      state.activityLog.pop();
    }
  },

  reset() {
    state.issues = [...initialIssues];
    state.crews = [...initialCrews];
    state.perks = [...initialPerks];
    state.activityLog = [
      { id: 'LOG-INIT', timestamp: new Date().toISOString(), text: 'System database restored to municipal defaults' }
    ];
    saveDatabase();
    return { success: true, count: state.issues.length };
  }
};
