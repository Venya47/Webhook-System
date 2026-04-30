import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Webhook, WebhookActivity, ActivityStatus } from '../types';
import api from '../services/api';

const statusColors: Record<ActivityStatus, { bg: string; dot: string }> = {
  SUCCESS: { bg: 'rgba(34,197,94,0.1)', dot: '#22c55e' },
  FAILURE: { bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
  PENDING: { bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
};

export default function PreviewWebhookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [activities, setActivities] = useState<WebhookActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  const fetchData = async () => {
    try {
      const wRes = await api.get(`/webhooks/${id}`);
      setWebhook(wRes.data);
    } catch (err) {
      console.error(err);
      setError("Webhook not found");
      setLoading(false);
      return;
    }

    try {
      const aRes = await api.get(`/activity/webhook/${id}`);
      setActivities(aRes.data);
    } catch (err) {
      console.error("Activity failed:", err);
      setActivities([]); 
    }

    setLoading(false);
  };

  fetchData();
   }, [id]);
  
  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', paddingTop: 80 }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <div className="main-content">
        <div className="error-msg">{error || 'Webhook not found'}</div>
      </div>
    );
  }

  const successCount = activities.filter(a => a.status === 'SUCCESS').length;
  const failureCount = activities.filter(a => a.status === 'FAILURE').length;
  const pendingCount = activities.filter(a => a.status === 'PENDING').length;

  return (
    <div className="main-content fade-up">
      <div
        className="back-link"
        onClick={() => navigate('/webhooks')}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate('/webhooks')}
      >
        ← Back to Webhooks
      </div>

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">{webhook.name}</div>
          <div className="page-subtitle">
            Created {new Date(webhook.created_at).toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/activity')}>
            📡 Activity
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/webhooks/${id}/edit`)}>
            ✏️ Edit Webhook
          </button>
        </div>
      </div>

      {/* Activity Summary Strip */}
      {activities.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          padding: '14px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginRight: 4 }}>
            ACTIVITY
          </span>
          {[
            { label: 'Success', count: successCount, color: '#22c55e' },
            { label: 'Failure', count: failureCount, color: '#ef4444' },
            { label: 'Pending', count: pendingCount, color: '#f59e0b' },
          ].map(s => (
            <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.count}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {activities.length} total
          </span>
        </div>
      )}

      <div className="card">
        {/* Core details */}
        <div className="preview-grid">
          <div className="preview-section">
            <div className="preview-label">Method</div>
            <div>
              <span className={`badge badge-${webhook.method.toLowerCase()}`}>{webhook.method}</span>
            </div>
          </div>
          <div className="preview-section">
            <div className="preview-label">Auth Type</div>
            <div>
              <span className={`badge badge-${webhook.auth_type.toLowerCase()}`}>{webhook.auth_type}</span>
            </div>
          </div>
          <div className="preview-section">
            <div className="preview-label">Auth Header</div>
            <div className="preview-value preview-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {webhook.auth_config?.header || (webhook.auth_type === 'NONE' ? '—' : 'Not configured')}
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Headers */}
        <div className="preview-section">
          <div className="preview-label">Custom Headers</div>
          {webhook.headers && Object.keys(webhook.headers).length > 0 ? (
            <div className="code-block">{JSON.stringify(webhook.headers, null, 2)}</div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              No custom headers defined
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Payload Schema */}
        <div className="preview-section">
          <div className="preview-label">Payload Schema</div>
          {webhook.payload_schema && Array.isArray(webhook.payload_schema) && webhook.payload_schema.length > 0 ? (
            <>
              <div className="code-block" style={{ marginBottom: 12 }}>
                {JSON.stringify(webhook.payload_schema, null, 2)}
              </div>
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      {(webhook.payload_schema[0] as any)?.description !== undefined && <th>Description</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(webhook.payload_schema as any[]).map((field, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{field.key}</td>
                        <td>
                          <span className="badge badge-none" style={{ fontSize: 10 }}>{field.type}</span>
                        </td>
                        {field.description !== undefined && (
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{field.description || '—'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              No payload schema defined
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Panel */}
      {activities.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div className="form-section-title" style={{ margin: 0 }}>Recent Activity</div>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11 }}
              onClick={() => navigate('/activity')}
            >
              View All →
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>System</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 8).map(a => (
                  <tr key={a.measurement_id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      #{a.measurement_id}
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: 'var(--accent)', background: 'var(--accent-dim)',
                        padding: '2px 8px', borderRadius: 4,
                      }}>
                        {a.system_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: statusColors[a.status].dot,
                          display: 'inline-block',
                        }} />
                        <span style={{
                          fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          color: statusColors[a.status].dot,
                        }}>
                          {a.status}
                        </span>
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {new Date(a.time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}