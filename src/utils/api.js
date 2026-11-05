// CivicLens Full-Stack Municipal API Client & Real-time SSE Engine

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';
const STORAGE_KEY = 'civiclens-issues-v2';

export const civicApi = {
  // 1. Healthcheck
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        return { online: true, ...data };
      }
    } catch (e) {
      // Backend offline or unreachable
    }
    return { online: false };
  },

  // 2. Fetch all issues (with query filters)
  async getIssues(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'All') params.set('status', filters.status);
      if (filters.category && filters.category !== 'All') params.set('category', filters.category);
      if (filters.priority && filters.priority !== 'All') params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      if (filters.sort) params.set('sort', filters.sort);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/issues${qs}`, {
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.issues)) {
          // Sync to localStorage as backup
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.issues));
          } catch {}
          return { data: json.issues, isLive: true };
        }
      }
    } catch (err) {
      console.warn('[CivicLens API] Backend unavailable, using local cache:', err.message);
    }

    // Fallback to localStorage
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { data: JSON.parse(cached), isLive: false };
      }
    } catch {}

    return { data: null, isLive: false };
  },

  // 3. Create a new issue
  async createIssue(issueData) {
    try {
      const res = await fetch(`${API_BASE}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, issue: json.issue, isLive: true };
      }
      if (res.status === 409) {
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.error || 'This photo is already attached to another report.', duplicate: json.duplicate || null, isLive: true };
      }
    } catch (err) {
      console.warn('[CivicLens API] Fallback to local submission:', err.message);
    }

    // Local fallback
    const id = issueData.id || `CIV-${Math.floor(1000 + Math.random() * 9000)}`;
    const fallbackIssue = {
      ...issueData,
      id,
      time: 'Just now',
      status: issueData.status || 'Reported',
      priority: issueData.priority || 'Normal',
      upvotes: 1,
      auditTrail: [
        { time: 'Just now', event: `Report submitted by ${issueData.reporter || 'Resident'}` },
        ...(issueData.auditTrail || [])
      ]
    };
    return { success: true, issue: fallbackIssue, isLive: false };
  },

  // 4. Update an issue
  async updateIssue(id, updates) {
    try {
      const res = await fetch(`${API_BASE}/issues/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, issue: json.issue, isLive: true };
      }
    } catch (err) {
      console.warn('[CivicLens API] Fallback to local update:', err.message);
    }
    return { success: true, isLive: false };
  },

  // 5. Upvote an issue
  async upvoteIssue(id) {
    try {
      const res = await fetch(`${API_BASE}/issues/${encodeURIComponent(id)}/upvote`, {
        method: 'POST',
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, upvotes: json.upvotes, isLive: true };
      }
    } catch (err) {
      console.warn('[CivicLens API] Fallback to local upvote');
    }
    return { success: true, isLive: false };
  },

  // 6. Photometrically resolve an issue
  async resolveIssue(id, payload) {
    try {
      const res = await fetch(`${API_BASE}/issues/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, issue: json.issue, isLive: true };
      }
      const error = await res.json().catch(() => ({}));
      return { success: false, error: error.error || 'The server rejected this resolution.', isLive: true };
    } catch (err) {
      console.warn('[CivicLens API] Fallback to local resolution:', err.message);
    }
    return { success: true, isLive: false };
  },

  // 7. Municipal crews
  async getCrews() {
    try {
      const res = await fetch(`${API_BASE}/crews`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return { crews: json.crews, isLive: true };
      }
    } catch {}
    return { crews: null, isLive: false };
  },

  // 8. Analytics
  async getAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/analytics`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return { analytics: json.analytics, isLive: true };
      }
    } catch {}
    return { analytics: null, isLive: false };
  },

  // 9. Community Perks
  async getPerks() {
    try {
      const res = await fetch(`${API_BASE}/perks`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return { perks: json.perks, isLive: true };
      }
    } catch {}
    return { perks: null, isLive: false };
  },

  // 10. Redeem a perk pass
  async redeemPerk(perkId, citizenName = 'Resident') {
    try {
      const res = await fetch(`${API_BASE}/perks/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perkId, citizenName }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, pass: json.pass, isLive: true };
      }
    } catch {}
    return {
      success: true,
      pass: {
        ticketCode: `PASS-${Math.floor(100000 + Math.random() * 900000)}`,
        citizenName,
        issuedAt: new Date().toISOString()
      },
      isLive: false
    };
  },

  // 11. Auth Login
  async login(email, password, role) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, session: json.session };
      }
    } catch {}
    return {
      success: true,
      session: {
        name: role === 'admin' ? 'Chief Operations Officer' : 'Jordan Davis',
        email,
        role: role || (email?.includes('admin') ? 'admin' : 'citizen'),
        department: role === 'admin' ? 'Central Municipal Dispatch' : 'Resident Contributor',
        badge: role === 'admin' ? 'Municipal Officer' : 'Gold Champion'
      }
    };
  },

  // 12. Reset to defaults
  async resetDatabase() {
    try {
      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: false };
  },

  // 13. Real-time Server-Sent Events (SSE) Listener with Auto-Reconnect
  subscribeLiveEvents(onEvent, onConnectionChange) {
    if (typeof window === 'undefined' || !('EventSource' in window)) {
      return () => {};
    }

    let es = null;
    let reconnectTimer = null;
    let isTerminated = false;

    function connect() {
      if (isTerminated) return;
      try {
        es = new EventSource(`${API_BASE}/events`);

        es.onopen = () => {
          if (onConnectionChange) onConnectionChange(true);
        };

        const eventTypes = [
          'ISSUE_CREATED',
          'ISSUE_UPDATED',
          'ISSUE_UPVOTED',
          'ISSUE_RESOLVED',
          'ISSUE_DELETED',
          'CREW_UPDATED',
          'DATABASE_RESET'
        ];

        eventTypes.forEach((type) => {
          es.addEventListener(type, (e) => {
            try {
              const data = JSON.parse(e.data);
              if (onEvent) onEvent({ type, data });
            } catch (err) {
              console.error('[SSE Parse Error]', err);
            }
          });
        });

        es.onerror = () => {
          if (onConnectionChange) onConnectionChange(false);
          if (es) {
            es.close();
            es = null;
          }
          if (!isTerminated) {
            reconnectTimer = setTimeout(connect, 5000);
          }
        };
      } catch (err) {
        if (onConnectionChange) onConnectionChange(false);
        if (!isTerminated) {
          reconnectTimer = setTimeout(connect, 7000);
        }
      }
    }

    connect();

    return () => {
      isTerminated = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) {
        es.close();
        es = null;
      }
    };
  }
};
