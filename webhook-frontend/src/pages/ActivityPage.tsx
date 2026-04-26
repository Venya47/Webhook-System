import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { WebhookActivity, ActivityStatus, Webhook } from '../types';

const STATUS_COLORS: Record<ActivityStatus, string> = {
  SUCCESS: 'badge-success',
  FAILURE: 'badge-failure',
  PENDING: 'badge-pending',
};

export default function ActivityPage() {
  const navigate = useNavigate();

  // Data
  const [activities, setActivities] = useState<WebhookActivity[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterWebhook, setFilterWebhook] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Log form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ system_name: '', webhook_id: '', status: 'SUCCESS' as ActivityStatus });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: '100' };
      if (filterWebhook) params.webhook_id = filterWebhook;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/activity', { params });
      setActivities(res.data.activities);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [filterWebhook, filterStatus]);

  useEffect(() => {
    api.get('/webhooks').then(res => setWebhooks(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleLog = async () => {
    if (!form.system_name.trim() || !form.webhook_id) {
      setFormError('System name and webhook are required');
      return;
    }
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/activity', {
        system_name: form.system_name,
        webhook_id: Number(form.webhook_id),
        status: form.status,
      });
      setForm({ system_name: '', webhook_id: '', status: 'SUCCESS' });
      setShowForm(false);
      fetchActivity();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to log activity');
    } finally {
      setFormLoading(false);
    }
  };

  const statusDot = (status: ActivityStatus) => {
    const colors: Record<ActivityStatus, string> = {
      SUCCESS: '#22c55e',
      FAILURE: '#ef4444',
      PENDING: '#f59e0b',
    };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: colors[status],
          boxShadow: `0 0 6px ${colors[status]}99`,
          flexShrink: 0,
          display: 'inline-block',
        }} />
        <span className={`badge ${STATUS_COLORS[status]}`}>{status}</span>
      </span>
    );
  };

  return (
    <div className="main-content fade-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Activity Log</div>
          <div className="page-subtitle">
            {loading ? '...' : `${total} event${total !== 1 ? 's' : ''} recorded`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(s => !s); setFormError(''); }}>
          {showForm ? '✕ Cancel' : '+ Log Activity'}
        </button>
      </div>

      {/* Inline Log Form */}
      {showForm && (
        <div className="card fade-up" style={{ marginBottom: 24, borderColor: 'var(--border-focus)' }}>
          <div className="form-section-title">New Activity Entry</div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 160px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">System Name</label>
              <input
                className="form-input"
                placeholder="e.g. payment-service"
                value={form.system_name}
                onChange={e => setForm(f => ({ ...f, system_name: e.target.value }))}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Webhook</label>
              <select
                className="form-select"
                value={form.webhook_id}
                onChange={e => setForm(f => ({ ...f, webhook_id: e.target.value }))}
              >
                <option value="">Select webhook…</option>
                {webhooks.map(w => (
                  <option key={w.webhook_id} value={w.webhook_id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ActivityStatus }))}
              >
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleLog} disabled={formLoading}>
              {formLoading ? <span className="spinner" /> : 'Save Entry'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 200 }}
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
          style={{ width: 'auto', minWidth: 160 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
          <option value="PENDING">PENDING</option>
        </select>
        {(filterWebhook || filterStatus) && (
          <button
            className="btn btn-ghost"
            onClick={() => { setFilterWebhook(''); setFilterStatus(''); }}
            style={{ fontSize: 12 }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && <div className="error-msg">{error}</div>}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <div className="empty-title">No activity yet</div>
          <div className="empty-desc">
            {filterWebhook || filterStatus
              ? 'No events match your filters'
              : 'Log your first activity entry to get started'}
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>System</th>
                <th>Webhook</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map(a => (
                <tr key={a.measurement_id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    #{a.measurement_id}
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--accent)',
                      background: 'var(--accent-dim)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {a.system_name}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {a.webhook?.name ?? `#${a.webhook_id}`}
                    </span>
                    {a.webhook?.method && (
                      <span className={`badge badge-${a.webhook.method.toLowerCase()}`} style={{ marginLeft: 8, fontSize: 10 }}>
                        {a.webhook.method}
                      </span>
                    )}
                  </td>
                  <td>{statusDot(a.status)}</td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {new Date(a.time).toLocaleString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-icon"
                      title="View Webhook"
                      onClick={() => navigate(`/webhooks/${a.webhook_id}`)}
                    >
                      👁
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}