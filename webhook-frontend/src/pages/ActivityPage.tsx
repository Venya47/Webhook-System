import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Webhook } from '../types';

export type LogStatus = 'success' | 'failed';

export interface WebhookLog {
  id: number;
  webhook_id: number;
  user_id: number;
  measurement_id: string;
  system_name: string;
  status: LogStatus;
  response_code: number | null;
  created_at: string;
  webhook?: { name: string; method: string };
}

export interface SystemSummary {
  system_name: string;
  measurement_id: string | null;
  total_hits: number;
  recent_log: string;
}

// Grouped by measurement_id + system_name
interface GroupedRow {
  measurement_id: string;
  system_name: string;
  total_hits: number;
  recent_time: string;
  logs: WebhookLog[];
}

const STATUS_COLORS: Record<LogStatus, string> = {
  success: 'badge-success',
  failed: 'badge-failure',
};

export default function ActivityPage() {
  const navigate = useNavigate();

  const [logs, setLogs]                         = useState<WebhookLog[]>([]);
  const [total, setTotal]                       = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [summary, setSummary]                   = useState<SystemSummary[]>([]);
  const [summaryLoading, setSummaryLoading]     = useState(true);
  const [webhooks, setWebhooks]                 = useState<Webhook[]>([]);
  const [filterWebhook, setFilterWebhook]       = useState('');
  const [filterStatus, setFilterStatus]         = useState('');
  const [filterMeasurement, setFilterMeasurement] = useState('');
  const [filterSystem, setFilterSystem]         = useState('');
  const [expandedRows, setExpandedRows]         = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fetch summary ────────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get('/activity/summary');
      setSummary(res.data.summary);
    } catch { /* non-critical */ }
    finally { setSummaryLoading(false); }
  }, []);

  // ── core fetch — accepts params directly to avoid stale closure ──────────────
  const doFetch = useCallback(async (
    webhook: string, status: string, measurement: string, system: string
  ) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: '200' };
      if (webhook)     params.webhook_id     = webhook;
      if (status)      params.status         = status;
      if (measurement) params.measurement_id = measurement;
      if (system)      params.system_name    = system;
      const res = await api.get('/activity', { params });
      setLogs(Array.isArray(res.data.logs) ? res.data.logs : []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── dropdown filters — fetch immediately ─────────────────────────────────────
  useEffect(() => {
    doFetch(filterWebhook, filterStatus, filterMeasurement, filterSystem);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterWebhook, filterStatus]);

  // ── text filters — debounced 400ms ───────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch(filterWebhook, filterStatus, filterMeasurement, filterSystem);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMeasurement, filterSystem]);

  useEffect(() => {
    api.get('/webhooks').then(r => setWebhooks(r.data)).catch(() => {});
    fetchSummary();
    doFetch('', '', '', '');
  }, [fetchSummary, doFetch]);

  // ── group logs by measurement_id + system_name ───────────────────────────────
  const groupedRows: GroupedRow[] = React.useMemo(() => {
    const map = new Map<string, GroupedRow>();
    for (const log of logs) {
      const key = `${log.measurement_id}__${log.system_name}`;
      if (!map.has(key)) {
        map.set(key, {
          measurement_id: log.measurement_id,
          system_name:    log.system_name,
          total_hits:     0,
          recent_time:    log.created_at,
          logs:           [],
        });
      }
      const row = map.get(key)!;
      row.total_hits += 1;
      row.logs.push(log);
      if (new Date(log.created_at) > new Date(row.recent_time)) {
        row.recent_time = log.created_at;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.recent_time).getTime() - new Date(a.recent_time).getTime()
    );
  }, [logs]);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleTextFilter = (setter: (v: string) => void, value: string) => {
  setter(value);
};

  const hasFilters = filterWebhook || filterStatus || filterMeasurement || filterSystem;

  const clearFilters = () => {
    setFilterWebhook('');
    setFilterStatus('');
    setFilterMeasurement('');
    setFilterSystem('');
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const statusDot = (status: LogStatus) => {
    const colors: Record<LogStatus, string> = { success: '#16a34a', failed: '#dc2626' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: colors[status],
          boxShadow: `0 0 6px ${colors[status]}66`,
          flexShrink: 0, display: 'inline-block',
        }} />
        <span className={`badge ${STATUS_COLORS[status]}`}>{status.toUpperCase()}</span>
      </span>
    );
  };

  const responseChip = (code: number | null) => {
    if (code == null) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
    const ok = code >= 200 && code < 300;
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        padding: '2px 8px', borderRadius: 4,
        background: ok ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
        color: ok ? 'var(--success)' : 'var(--danger)',
      }}>{code}</span>
    );
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="main-content fade-up">

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Activity Log</div>
          <div className="page-subtitle">
            {loading ? '...' : `${groupedRows.length} measurement${groupedRows.length !== 1 ? 's' : ''} · ${total} total hit${total !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {!summaryLoading && summary.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 16, marginBottom: 28,
        }}>
          {summary.map(s => (
            <div className="card" key={s.system_name} style={{ padding: '20px 24px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--accent)', background: 'var(--accent-dim)',
                display: 'inline-block', padding: '2px 10px',
                borderRadius: 4, marginBottom: 10,
              }}>{s.system_name}</div>

              {s.measurement_id && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--text-muted)', marginBottom: 10,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>ID: {s.measurement_id}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>
                    {s.total_hits}
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)', marginTop: 4,
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>webhook hits</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 10, color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: 2,
                  }}>last seen</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {formatTime(s.recent_log)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            className="form-input"
            style={{ paddingLeft: 30, width: 190, fontSize: 13, fontFamily: 'var(--font-mono)' }}
            placeholder="Measurement ID"
            value={filterMeasurement}
            onChange={e => setFilterMeasurement(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            className="form-input"
            style={{ paddingLeft: 30, width: 170, fontSize: 13, fontFamily: 'var(--font-mono)' }}
            placeholder="System name"
            value={filterSystem}
            onChange={e => setFilterSystem(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 170 }}
          value={filterWebhook}
          onChange={e => setFilterWebhook(e.target.value)}
        >
          <option value="">All Webhooks</option>
          {webhooks.map(w => (
            <option key={w.webhook_id} value={w.webhook_id}>{w.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 140 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="success">SUCCESS</option>
          <option value="failed">FAILED</option>
        </select>
        {hasFilters && (
          <button className="btn btn-ghost" onClick={clearFilters} style={{ fontSize: 12 }}>
            ✕ Clear
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Grouped Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : groupedRows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <div className="empty-title">No activity yet</div>
          <div className="empty-desc">
            {hasFilters ? 'No events match your filters' : 'Start managing webhooks in seconds'}
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Measurement ID</th>
                <th>System</th>
                <th>Total Hits</th>
                <th>Recent Hit</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(row => {
                const key = `${row.measurement_id}__${row.system_name}`;
                const isExpanded = expandedRows.has(key);
                return (
                  <React.Fragment key={key}>
                    {/* Summary row */}
                    <tr
                      onClick={() => toggleRow(key)}
                      style={{ cursor: 'pointer', background: isExpanded ? 'rgba(91,91,214,0.06)' : undefined }}
                    >
                      {/* Toggle arrow */}
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        <span style={{
                          display: 'inline-block',
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}>▶</span>
                      </td>

                      {/* Measurement ID */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {row.measurement_id}
                      </td>

                      {/* System name */}
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: 'var(--accent)', background: 'var(--accent-dim)',
                          padding: '2px 8px', borderRadius: 4,
                        }}>{row.system_name}</span>
                      </td>

                      {/* Total hits badge */}
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                          color: 'var(--text-primary)',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border)',
                          padding: '3px 12px', borderRadius: 20,
                        }}>
                          {row.total_hits} hit{row.total_hits !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Recent time */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatTime(row.recent_time)}
                      </td>
                    </tr>

                    {/* Expanded detail rows */}
                    {isExpanded && row.logs.map(log => (
                      <tr key={log.id} style={{ background: 'rgba(91,91,214,0.03)' }}>
                        <td></td>
                        <td colSpan={4} style={{ padding: '0 0 0 16px' }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                            gap: 16,
                            padding: '10px 16px',
                            borderLeft: '2px solid var(--accent)',
                            margin: '4px 0',
                            alignItems: 'center',
                          }}>
                            {/* Log ID */}
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Log ID</div>
                              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{log.id}</div>
                            </div>

                            {/* Webhook */}
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Webhook</div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>
                                {log.webhook?.name ?? `#${log.webhook_id}`}
                                {log.webhook?.method && (
                                  <span className={`badge badge-${log.webhook.method.toLowerCase()}`} style={{ marginLeft: 6, fontSize: 10 }}>
                                    {log.webhook.method}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Status</div>
                              {statusDot(log.status)}
                            </div>

                            {/* Response + Time */}
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Response · Time</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {responseChip(log.response_code)}
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {formatTime(log.created_at)}
                                </span>
                              </div>
                            </div>

                            {/* Action */}
                            <div>
                              <button
                                className="btn btn-icon"
                                title="View Webhook"
                                onClick={e => { e.stopPropagation(); navigate(`/webhooks/${log.webhook_id}`); }}
                              >👁</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}