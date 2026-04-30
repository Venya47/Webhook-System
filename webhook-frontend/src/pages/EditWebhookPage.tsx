import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebhookForm from '../components/WebhookForm';
import { Webhook, WebhookFormData } from '../types';
import api from '../services/api';

export default function EditWebhookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/webhooks/${id}`)
      .then(res => setWebhook(res.data))
      .catch(() => setError('Webhook not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: WebhookFormData) => {
    const headersObj = data.headers.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key.trim()] = value;
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      name: data.name,
      target_url: data.target_url,
      method: data.method,
      auth_type: data.auth_type,
      username: data.username,
      password: data.password,
      token: data.token,
      headers: Object.keys(headersObj).length ? headersObj : null,
      payload_schema: data.payload_schema.filter(f => f.key.trim()).length
        ? data.payload_schema.filter(f => f.key.trim())
        : null,
    };

    await api.put(`/webhooks/${id}`, payload);
    navigate(`/webhooks/${id}`);
  };

  const buildInitial = (wh: Webhook): Partial<WebhookFormData> => ({
    name: wh.name,
    target_url: wh.target_url,
    method: wh.method,
    auth_type: wh.auth_type,
    headers: wh.headers
      ? Object.entries(wh.headers).map(([key, value]) => ({ key, value }))
      : [],
    payload_schema: Array.isArray(wh.payload_schema) ? wh.payload_schema : [],
    // Don't pre-fill auth secrets for security
    username: '',
    password: '',
    token: '',
  });

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

  return (
    <div className="main-content">
      <div
        className="back-link"
        onClick={() => navigate(`/webhooks/${id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate(`/webhooks/${id}`)}
      >
        ← Back to Preview
      </div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Edit Webhook</div>
          <div className="page-subtitle" style={{ fontFamily: 'var(--font-mono)' }}>{webhook.name}</div>
        </div>
      </div>
      <WebhookForm
        initial={buildInitial(webhook)}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/webhooks/${id}}`)}
      />
    </div>
  );
}