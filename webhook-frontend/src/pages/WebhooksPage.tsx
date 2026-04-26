import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Webhook } from '../types';

export default function WebhooksPage() {
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/webhooks')
      .then(res => setWebhooks(res.data))
      .catch(() => setError('Failed to load webhooks'))
      .finally(() => setLoading(false));
  }, []);

  const methodBadge = (m: string) => (
    <span className={`badge badge-${m.toLowerCase()}`}>{m}</span>
  );

  const authBadge = (a: string) => (
    <span className={`badge badge-${a.toLowerCase()}`}>{a}</span>
  );

  return (
    <div className="main-content fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Webhooks</div>
          <div className="page-subtitle">
            {loading ? '...' : `${webhooks.length} configured endpoint${webhooks.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/webhooks/new')}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          New Webhook
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⬡</div>
          <div className="empty-title">No webhooks yet</div>
          <div className="empty-desc">Create your first webhook to get started</div>
          <button className="btn btn-primary" onClick={() => navigate('/webhooks/new')}>
            Create Webhook
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Target URL</th>
                <th>Method</th>
                <th>Auth</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map(wh => (
                <tr key={wh.webhook_id}>
                  <td style={{ fontWeight: 600 }}>{wh.name}</td>
                  <td>
                    <span
                      className="preview-mono"
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        maxWidth: 240,
                        display: 'inline-block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                      }}
                      title={wh.target_url}
                    >
                      {wh.target_url}
                    </span>
                  </td>
                  <td>{methodBadge(wh.method)}</td>
                  <td>{authBadge(wh.auth_type)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {new Date(wh.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn btn-icon"
                        title="Preview"
                        onClick={() => navigate(`/webhooks/${wh.webhook_id}`)}
                      >
                        👁
                      </button>
                      <button
                        className="btn btn-icon"
                        title="Edit"
                        onClick={() => navigate(`/webhooks/${wh.webhook_id}/edit`)}
                      >
                        ✏️
                      </button>
                    </div>
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