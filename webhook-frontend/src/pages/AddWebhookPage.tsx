import React from 'react';
import { useNavigate } from 'react-router-dom';
import WebhookForm from '../components/WebhookForm';
import { WebhookFormData } from '../types';
import api from '../services/api';

export default function AddWebhookPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: WebhookFormData) => {
    // Convert headers array to object
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

    await api.post('/webhooks', payload);
    navigate('/webhooks');
  };

  return (
    <div className="main-content">
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
          <div className="page-title">New Webhook</div>
          <div className="page-subtitle">Configure a new HTTP endpoint</div>
        </div>
      </div>
      <WebhookForm
        submitLabel="Create Webhook"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/webhooks')}
      />
    </div>
  );
}