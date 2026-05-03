import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebhookForm from '../components/WebhookForm';
import { Webhook, WebhookFormData, OAuthConfig } from '../types';
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

    const payload: Record<string, unknown> = {
      name: data.name,
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

    // Include oauth config if auth_type is OAUTH
    if (data.auth_type === 'OAUTH' && data.oauth) {
      payload.oauth = data.oauth;
    }

    await api.put(`/webhooks/${id}`, payload);
    navigate(`/webhooks/${id}`);
  };

  // Build OAuth initial state from oauth_configs returned by backend
  const buildOAuthInitial = (oauthConfigs: any[]): OAuthConfig => {
    const access = oauthConfigs.find(c => c.token_type === 'ACCESS');
    const refresh = oauthConfigs.find(c => c.token_type === 'REFRESH');

    const mapConfig = (c: any) => ({
      method: c?.method ?? 'POST',
      auth_type: c?.auth_type ?? 'NONE',
      auth_config: {
        username: c?.auth_config?.username ?? '',
        password: '',   // don't pre-fill secrets
        token: '',      // don't pre-fill secrets
      },
      headers: c?.headers ?? [],
      payload: c?.payload ?? [],
      token_key: c?.token_key ?? '',
      expiry_source: (c?.expiry_source?.toLowerCase() ?? 'response') as 'response' | 'manual',
      expiry_key: c?.expiry_key ?? '',
      date_format: c?.date_format ?? 'DD-MM-YYYYTHH:mm:ss',
      jwt_bound: c?.jwt_bound ?? false,
      manual_duration: c?.manual_duration?.toString() ?? '1',
      manual_unit: c?.manual_unit ?? 'HOUR',
    });

    return {
      refresh_enabled: !!refresh,
      access_token: mapConfig(access),
      refresh_token: mapConfig(refresh),
    };
  };

  const buildInitial = (wh: Webhook & { oauth_configs?: any[] }): Partial<WebhookFormData> => ({
    name: wh.name,
    method: wh.method,
    auth_type: wh.auth_type,
    headers: wh.headers
      ? Object.entries(wh.headers).map(([key, value]) => ({ key, value }))
      : [],
    payload_schema: Array.isArray(wh.payload_schema) ? wh.payload_schema : [],
    username: '',
    password: '',
    token: '',
    oauth: wh.auth_type === 'OAUTH' && wh.oauth_configs?.length
      ? buildOAuthInitial(wh.oauth_configs)
      : undefined,
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
        initial={buildInitial(webhook as any)}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/webhooks/${id}`)}
      />
    </div>
  );
}