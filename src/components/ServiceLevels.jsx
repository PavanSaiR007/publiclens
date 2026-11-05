import React, { useMemo } from 'react';
import { Icon } from './Icons';
import { categoryMeta } from '../data/seedData';
import './ServiceLevels.css';

function ageHours(issue) {
  if (issue.createdAt) return Math.max(0, (Date.now() - new Date(issue.createdAt).getTime()) / 3600000);
  const label = String(issue.time || '').toLowerCase();
  const amount = Number(label.match(/[\d.]+/)?.[0] || 0);
  if (label.includes('day')) return amount * 24;
  if (label.includes('hr') || label.includes('hour')) return amount;
  if (label.includes('min')) return amount / 60;
  return 0;
}

function targetHours(issue) {
  const base = categoryMeta[issue.type]?.slaHours || 24;
  const factor = issue.priority === 'Urgent' ? 0.35 : issue.priority === 'High' ? 0.65 : 1;
  return Math.max(2, Math.round(base * factor));
}

function issueSla(issue) {
  if (issue.status === 'Resolved') return { state: 'Met', remaining: 0, elapsed: ageHours(issue), target: targetHours(issue) };
  const target = targetHours(issue);
  const elapsed = ageHours(issue);
  const remaining = target - elapsed;
  return { state: remaining <= 0 ? 'Overdue' : elapsed / target >= 0.7 ? 'At risk' : 'On track', remaining, elapsed, target };
}

export default function ServiceLevels({ issues = [], onSelectIssue }) {
  const active = useMemo(() => issues.filter((issue) => issue.status !== 'Resolved'), [issues]);
  const scored = useMemo(() => active.map((issue) => ({ issue, sla: issueSla(issue) })).sort((a, b) => a.sla.remaining - b.sla.remaining), [active]);
  const overdue = scored.filter(({ sla }) => sla.state === 'Overdue').length;
  const atRisk = scored.filter(({ sla }) => sla.state === 'At risk').length;
  const resolvedIssues = issues.filter((issue) => issue.status === 'Resolved');
  const resolved = resolvedIssues.length;
  const metRate = resolved ? Math.round((resolvedIssues.filter((issue) => ageHours(issue) <= targetHours(issue)).length / resolved) * 100) : 100;
  const departments = useMemo(() => {
    const totals = {};
    issues.forEach((issue) => {
      const name = issue.assignedCrew || issue.department || categoryMeta[issue.type]?.department || 'Unassigned';
      totals[name] ||= { total: 0, open: 0, overdue: 0 };
      totals[name].total += 1;
      if (issue.status !== 'Resolved') totals[name].open += 1;
      if (issueSla(issue).state === 'Overdue') totals[name].overdue += 1;
    });
    return Object.entries(totals).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.open - a.open).slice(0, 5);
  }, [issues]);
  const downloadCsv = () => {
    const rows = [['Issue ID', 'Title', 'Category', 'Department', 'Priority', 'Status', 'SLA state', 'Hours remaining']];
    scored.forEach(({ issue, sla }) => rows.push([issue.id, issue.title, issue.type, issue.department || '', issue.priority || 'Normal', issue.status, sla.state, Math.max(0, sla.remaining).toFixed(1)]));
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'civiclens-service-levels.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section className="service-levels-page">
    <header className="service-page-heading"><div><span className="service-eyebrow">CITY RESPONSE PERFORMANCE</span><h2>Service level monitor</h2><p>Track response windows, spot reports at risk, and balance department workloads.</p></div><button className="service-export" onClick={downloadCsv}><Icon.Share2 size={15} /> Export queue</button></header>
    <div className="service-kpis">
      <Metric icon={<Icon.Clock size={18} />} label="Open reports" value={active.length} hint="Awaiting completion" tone="blue" />
      <Metric icon={<Icon.AlertTriangle size={18} />} label="Overdue" value={overdue} hint="Past target response" tone="red" />
      <Metric icon={<Icon.Clock size={18} />} label="At risk" value={atRisk} hint="Within 30% of SLA" tone="amber" />
      <Metric icon={<Icon.CheckCircle size={18} />} label="On-time closure" value={`${metRate}%`} hint={`${resolved} completed reports`} tone="green" />
    </div>
    <div className="service-layout">
      <div className="service-panel"><div className="service-panel-head"><div><h3>Response queue</h3><p>Sorted by time remaining</p></div><span className="queue-total">{scored.length} active</span></div>
        {scored.length ? <div className="sla-queue">{scored.map(({ issue, sla }) => <button className="sla-row" key={issue.id} onClick={() => onSelectIssue?.(issue)}><span className={`sla-marker ${sla.state.toLowerCase().replace(' ', '-')}`}></span><span className="sla-main"><b>{issue.title}</b><small>{issue.id} · {issue.place}</small><small>{issue.department || categoryMeta[issue.type]?.department || 'Unassigned'} · {issue.priority || 'Normal'} priority</small></span><span className={`sla-state ${sla.state.toLowerCase().replace(' ', '-')}`}>{sla.state}</span><span className="sla-clock">{sla.state === 'Overdue' ? `${Math.abs(sla.remaining).toFixed(0)}h overdue` : `${sla.remaining.toFixed(0)}h left`}<small>of {sla.target}h target</small></span><Icon.ChevronRight size={15} /></button>)}</div> : <div className="service-empty"><Icon.CheckCircle size={22} /><b>All clear</b><span>No open reports in the response queue.</span></div>}
      </div>
      <aside className="service-panel department-panel"><div className="service-panel-head"><div><h3>Department workload</h3><p>Open assignments by team</p></div></div>{departments.length ? departments.map((department) => <div className="department-load" key={department.name}><div><b>{department.name}</b><span>{department.open} open{department.overdue ? ` · ${department.overdue} overdue` : ''}</span></div><div className="load-track"><i style={{ width: `${Math.max(5, (department.open / Math.max(1, active.length)) * 100)}%` }} /></div></div>) : <div className="service-empty compact">Department assignments appear as reports arrive.</div>}<div className="service-note"><Icon.Shield size={15} /><span>SLA targets adapt to issue type and priority. Urgent hazards receive shorter response windows.</span></div></aside>
    </div>
  </section>;
}

function Metric({ icon, label, value, hint, tone }) { return <article className={`service-metric ${tone}`}><span className="metric-icon">{icon}</span><small>{label}</small><b>{value}</b><span>{hint}</span></article>; }
