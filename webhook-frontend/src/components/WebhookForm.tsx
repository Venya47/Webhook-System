import React, { useState } from 'react';
import { WebhookFormData, HttpMethod, AuthType } from '../types';

interface KVPair { key: string; value: string; }
interface PayloadField { key: string; type: string; }

interface Props {
  initial?: Partial<WebhookFormData>;
  onSubmit: (data: WebhookFormData) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

const defaultForm: WebhookFormData = {
  name: '',
  target_url: '',
  method: 'POST',
  auth_type: 'NONE',
  username: '',
  password: '',
  token: '',
  headers: [],
  payload_schema: [],
};

export default function WebhookForm({ initial, onSubmit, submitLabel, onCancel }: Props) {
  const [form, setForm] = useState<WebhookFormData>({ ...defaultForm, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof WebhookFormData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  // Headers
  const addHeader = () => set('headers', [...form.headers, { key: '', value: '' }]);
  const removeHeader = (i: number) => set('headers', form.headers.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: keyof KVPair, val: string) => {
    const updated = [...form.headers];
    updated[i] = { ...updated[i], [field]: val };
    set('headers', updated);
  };

  // Payload schema
  const addField = () => set('payload_schema', [...form.payload_schema, { key: '', type: 'string' }]);
  const removeField = (i: number) => set('payload_schema', form.payload_schema.filter((_, idx) => idx !== i));
  const updateField = (i: number, field: keyof PayloadField, val: string) => {
    const updated = [...form.payload_schema];
    updated[i] = { ...updated[i], [field]: val };
    set('payload_schema', updated);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.target_url) {
      setError('Name and Target URL are required');
      return;
    }
    if (form.auth_type === 'BASIC' && (!form.username || !form.password)) {
      setError('Username and Password are required for BASIC auth');
      return;
    }
    if (form.auth_type === 'BEARER' && !form.token) {
      setError('Token is required for BEARER auth');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card fade-up" style={{ maxWidth: 720 }}>
      {error && <div className="error-msg">{error}</div>}

      {/* Basic Info */}
      <div className="form-section-title">Basic Info</div>
      <div className="form-group">
        <label className="form-label">Webhook Name</label>
        <input
          className="form-input"
          placeholder="My Webhook"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Target URL</label>
          <input
            className="form-input"
            placeholder="https://api.example.com/hook"
            value={form.target_url}
            onChange={e => set('target_url', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">HTTP Method</label>
          <select
            className="form-select"
            value={form.method}
            onChange={e => set('method', e.target.value as HttpMethod)}
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
      </div>

      {/* Authentication */}
      <div className="form-section-title">Authentication</div>
      <div className="form-group">
        <label className="form-label">Auth Type</label>
        <select
          className="form-select"
          value={form.auth_type}
          onChange={e => set('auth_type', e.target.value as AuthType)}
        >
          <option value="NONE">None</option>
          <option value="BASIC">Basic Auth</option>
          <option value="BEARER">Bearer Token</option>
           <option value="OAuth">Bearer Token</option>
        </select>
      </div>

      {form.auth_type === 'BASIC' && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="username"
              value={form.username || ''}
              onChange={e => set('username', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password || ''}
              onChange={e => set('password', e.target.value)}
            />
          </div>
        </div>
      )}

      {form.auth_type === 'BEARER' && (
        <div className="form-group">
          <label className="form-label">Bearer Token</label>
          <input
            className="form-input"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={form.token || ''}
            onChange={e => set('token', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
        </div>
      )}

      {/* Headers */}
      <div className="form-section-title">Headers</div>
      {form.headers.map((h, i) => (
        <div className="kv-row" key={i}>
          <input
            className="form-input"
            placeholder="Header-Name"
            value={h.key}
            onChange={e => updateHeader(i, 'key', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <input
            className="form-input"
            placeholder="value"
            value={h.value}
            onChange={e => updateHeader(i, 'value', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <button className="kv-remove" onClick={() => removeHeader(i)} title="Remove">×</button>
        </div>
      ))}
      <button className="add-field-btn" onClick={addHeader}>+ Add Header</button>

      {/* Payload Schema */}
      <div className="form-section-title" style={{ marginTop: 24 }}>Payload Schema</div>
      <div
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          marginBottom: 12,
          lineHeight: 1.6,
        }}
      >
        Define the expected structure of incoming data (template only — not sent at runtime)
      </div>
      {form.payload_schema.map((f, i) => (
        <div className="kv-row kv-row-3" key={i}>
          <input
            className="form-input"
            placeholder="field_name"
            value={f.key}
            onChange={e => updateField(i, 'key', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <input
            className="form-input"
            placeholder="description"
            value={(f as any).description || ''}
            onChange={e => {
              const updated = [...form.payload_schema];
              (updated[i] as any).description = e.target.value;
              set('payload_schema', updated);
            }}
            style={{ fontSize: 12 }}
          />
          <select
            className="form-select"
            value={f.type}
            onChange={e => updateField(i, 'type', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
            <option value="array">array</option>
          </select>
          <button className="kv-remove" onClick={() => removeField(i)} title="Remove">×</button>
        </div>
      ))}
      <button className="add-field-btn" onClick={addField}>+ Add Field</button>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : submitLabel}
        </button>
        <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
}