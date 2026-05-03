import React, { useState } from 'react';
import { WebhookFormData, HttpMethod, AuthType, OAuthConfigAuthType } from '../types';

interface KVPair { key: string; value: string; }
interface PayloadField { key: string; type: string; }

interface Props {
  initial?: Partial<WebhookFormData>;
  onSubmit: (data: WebhookFormData) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

const defaultTokenConfig = {
  method: 'POST' as 'POST' | 'GET' | 'PUT' | 'PATCH',
  auth_type: 'NONE' as OAuthConfigAuthType,
  auth_config: { username: '', password: '', token: '' },
  headers: [] as { key: string; value: string }[],
  payload: [] as { key: string; value: string; type: string }[],
  token_key: '',
  expiry_source: 'response' as 'response' | 'manual',
  expiry_key: '',
  date_format: 'DD-MM-YYYYTHH:mm:ss',
  jwt_bound: true,
  manual_duration: '1',
  manual_unit: 'HOUR' as 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY',
};

const defaultForm: WebhookFormData = {
  name: '',
  method: 'POST',
  auth_type: 'NONE',
  username: '',
  password: '',
  token: '',
  headers: [],
  payload_schema: [],
  oauth: {
    refresh_enabled: false,
    access_token: { ...defaultTokenConfig, jwt_bound: true },
    refresh_token: { ...defaultTokenConfig, jwt_bound: false },
  },
};

const DATE_FORMATS = [
  'DD-MM-YYYYTHH:mm:ss',
  'YYYY-MM-DDTHH:mm:ss',
  'MM-DD-YYYYTHH:mm:ss',
  'Unix timestamp',
];

// ── Key-Value builder ──────────────────────────────────────────────────────────
function KVBuilder({
  rows,
  onChange,
  hasType = false,
}: {
  rows: { key: string; value: string; type?: string }[];
  onChange: (rows: { key: string; value: string; type?: string }[]) => void;
  hasType?: boolean;
}) {
  const add = () => onChange([...rows, { key: '', value: '', type: 'text' }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i: number, field: string, val: string) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r));
    onChange(next);
  };

  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: hasType ? '1fr 1fr 130px auto' : '1fr 1fr auto',
            gap: 8,
            marginBottom: 8,
            alignItems: 'center',
          }}
        >
          <input
            className="form-input"
            placeholder="Key"
            value={row.key}
            onChange={e => update(i, 'key', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <input
            className="form-input"
            placeholder="Value"
            value={row.value}
            onChange={e => update(i, 'value', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          {hasType && (
            <select
              className="form-select"
              value={row.type || 'text'}
              onChange={e => update(i, 'type', e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            >
              <option value="text">text</option>
              <option value="secret">secret</option>
              <option value="number">number</option>
            </select>
          )}
          <button className="kv-remove" onClick={() => remove(i)} title="Remove">×</button>
        </div>
      ))}
      <button className="add-field-btn" onClick={add}>+ Add field</button>
    </div>
  );
}

// ── Expiry sub-section ─────────────────────────────────────────────────────────
function ExpiryConfig({
  label,
  config,
  onChange,
}: {
  label: string;
  config: {
    expiry_source: 'response' | 'manual';
    expiry_key: string;
    date_format: string;
    jwt_bound: boolean;
    manual_duration: string;
    manual_unit: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY';
  };
  onChange: (patch: Partial<typeof config>) => void;
}) {
  return (
    <div>
      <p className="form-label" style={{ marginBottom: 8 }}>{label} expiry</p>
      <div style={{ display: 'flex', marginBottom: 14, width: 'fit-content' }}>
        {(['response', 'manual'] as const).map((t, idx) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange({ expiry_source: t })}
            style={{
              height: 32,
              padding: '0 16px',
              background: config.expiry_source === t ? 'var(--accent)' : 'var(--bg-input)',
              color: config.expiry_source === t ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: idx === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              fontWeight: config.expiry_source === t ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {t === 'response' ? 'Get from response' : 'Set manually'}
          </button>
        ))}
      </div>

      {config.expiry_source === 'response' ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ width: 160 }}
            placeholder="Expiry key"
            value={config.expiry_key}
            onChange={e => onChange({ expiry_key: e.target.value })}
          />
          <select
            className="form-select"
            style={{ width: 220 }}
            value={config.date_format}
            onChange={e => onChange({ date_format: e.target.value })}
          >
            {DATE_FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={config.jwt_bound}
              onChange={e => onChange({ jwt_bound: e.target.checked })}
              style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Expiry bound in JWT
            </span>
          </label>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="form-label" style={{ marginBottom: 6 }}>Duration</label>
            <input
              className="form-input"
              placeholder="1"
              value={config.manual_duration ?? '1'}
              onChange={e => onChange({ manual_duration: e.target.value })}
              type="number"
              min="1"
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="form-label" style={{ marginBottom: 6 }}>Unit</label>
            <select
              className="form-select"
              value={config.manual_unit ?? 'HOUR'}
              onChange={e => onChange({ manual_unit: e.target.value as 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' })}
            >
              <option value="SECOND">Second</option>
              <option value="MINUTE">Minute</option>
              <option value="HOUR">Hour</option>
              <option value="DAY">Day</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Token config block (access or refresh) ─────────────────────────────────────
function TokenConfigBlock({
  title,
  config,
  onChange,
}: {
  title: string;
  config: any;
  onChange: (patch: any) => void;
}) {
  const authType: OAuthConfigAuthType = config.auth_type ?? 'NONE';
  const authConfig = config.auth_config ?? { username: '', password: '', token: '' };

  const setAuthConfig = (patch: Record<string, string>) =>
    onChange({ auth_config: { ...authConfig, ...patch } });

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        marginBottom: 12,
      }}
    >
      <div className="form-section-title" style={{ marginTop: 0, marginBottom: 16 }}>{title}</div>

      {/* Method */}
      <div className="form-group">
        <label className="form-label">Method</label>
        <select
          className="form-select"
          value={config.method ?? 'POST'}
          onChange={e => onChange({ method: e.target.value })}
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      {/* Auth Type for this token endpoint */}
      <div className="form-group">
        <label className="form-label">Auth type</label>
        <select
          className="form-select"
          value={authType}
          onChange={e => onChange({ auth_type: e.target.value as OAuthConfigAuthType })}
        >
          <option value="NONE">None</option>
          <option value="BASIC">Basic</option>
          <option value="BEARER">Bearer</option>
        </select>
      </div>

      {/* BASIC credentials */}
      {authType === 'BASIC' && (
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="username"
              value={authConfig.username || ''}
              onChange={e => setAuthConfig({ username: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={authConfig.password || ''}
              onChange={e => setAuthConfig({ password: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* BEARER token */}
      {authType === 'BEARER' && (
        <div className="form-group">
          <label className="form-label">Bearer Token</label>
          <input
            className="form-input"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={authConfig.token || ''}
            onChange={e => setAuthConfig({ token: e.target.value })}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
        </div>
      )}

      {/* Custom Headers */}
      <div className="form-group">
        <label className="form-label">Custom headers</label>
        <KVBuilder rows={config.headers} onChange={headers => onChange({ headers })} />
      </div>

      {/* Custom Payload */}
      <div className="form-group">
        <label className="form-label">Custom payload</label>
        <KVBuilder rows={config.payload} onChange={payload => onChange({ payload })} hasType />
      </div>

      <div className="divider" />

      {/* Token key */}
      <div className="form-group">
        <label className="form-label">Response — token key</label>
        <input
          className="form-input"
          placeholder="e.g. access_token"
          value={config.token_key}
          onChange={e => onChange({ token_key: e.target.value })}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
          JSON path to the token in the auth server response
        </p>
      </div>

      {/* Expiry */}
      <ExpiryConfig
        label={title.toLowerCase().includes('refresh') ? 'Refresh token' : 'Access token'}
        config={config}
        onChange={onChange}
      />
    </div>
  );
}

// ── Main WebhookForm ───────────────────────────────────────────────────────────
export default function WebhookForm({ initial, onSubmit, submitLabel, onCancel }: Props) {
  const [form, setForm] = useState<WebhookFormData>({ ...defaultForm, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthPanelOpen, setOauthPanelOpen] = useState(false);

  const set = (field: keyof WebhookFormData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const setOAuth = (section: 'access_token' | 'refresh_token', patch: any) =>
    setForm(f => ({
      ...f,
      oauth: {
        ...f.oauth!,
        [section]: { ...f.oauth![section], ...patch },
      },
    }));

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

  const handleAuthChange = (val: AuthType) => {
    set('auth_type', val);
    if (val !== 'OAUTH') setOauthPanelOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name) { setError('Unique Name required'); return; }
    if (form.auth_type === 'BASIC' && (!form.username || !form.password)) {
      setError('Username and Password are required for BASIC auth'); return;
    }
    if (form.auth_type === 'BEARER' && !form.token) {
      setError('Token is required for BEARER auth'); return;
    }
    if (form.auth_type === 'OAUTH') {
      if (!form.oauth?.access_token?.token_key) {
        setError('Access token key is required for OAuth'); return;
      }
      if (form.oauth?.access_token?.auth_type === 'BASIC' && (!form.oauth.access_token.auth_config?.username || !form.oauth.access_token.auth_config?.password)) {
        setError('Username and Password are required for access token BASIC auth'); return;
      }
      if (form.oauth?.access_token?.auth_type === 'BEARER' && !form.oauth.access_token.auth_config?.token) {
        setError('Bearer token is required for access token BEARER auth'); return;
      }
      if (form.oauth?.refresh_enabled) {
        if (!form.oauth?.refresh_token?.token_key) {
          setError('Refresh token key is required'); return;
        }
        if (form.oauth?.refresh_token?.auth_type === 'BASIC' && (!form.oauth.refresh_token.auth_config?.username || !form.oauth.refresh_token.auth_config?.password)) {
          setError('Username and Password are required for refresh token BASIC auth'); return;
        }
        if (form.oauth?.refresh_token?.auth_type === 'BEARER' && !form.oauth.refresh_token.auth_config?.token) {
          setError('Bearer token is required for refresh token BEARER auth'); return;
        }
      }
    }
    setError('');
    setLoading(true);
    try { await onSubmit(form); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to save webhook'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card fade-up" style={{ maxWidth: 1100 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="form-select"
            value={form.auth_type}
            onChange={e => handleAuthChange(e.target.value as AuthType)}
          >
            <option value="NONE">None</option>
            <option value="BASIC">Basic</option>
            <option value="BEARER">Bearer</option>
            <option value="OAUTH">OAuth</option>
          </select>

          {form.auth_type === 'OAUTH' && (
            <button
              className="btn btn-ghost"
              style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 13 }}
              onClick={() => setOauthPanelOpen(p => !p)}
              type="button"
            >
              {oauthPanelOpen ? '✕ Close config' : '⚙ Config'}
            </button>
          )}
        </div>
      </div>

      {/* BASIC fields */}
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

      {/* BEARER field */}
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

      {/* OAuth panel */}
      {form.auth_type === 'OAUTH' && oauthPanelOpen && (
        <div
          className="fade-up"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="form-section-title" style={{ margin: 0, flex: 1 }}>OAuth configuration</div>
            <button
              className="btn btn-icon"
              style={{ fontSize: 18, lineHeight: 1 }}
              onClick={() => setOauthPanelOpen(false)}
              type="button"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Refresh token toggle */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={form.oauth?.refresh_enabled ?? false}
                onChange={e =>
                  setForm(f => ({ ...f, oauth: { ...f.oauth!, refresh_enabled: e.target.checked } }))
                }
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Enable refresh token
              </span>
            </label>
          </div>

          {/* Access token config */}
          <TokenConfigBlock
            title="Access token configuration"
            config={form.oauth!.access_token}
            onChange={patch => setOAuth('access_token', patch)}
          />

          {/* Refresh token config */}
          {form.oauth?.refresh_enabled && (
            <div className="fade-up">
              <TokenConfigBlock
                title="Refresh token configuration"
                config={form.oauth!.refresh_token}
                onChange={patch => setOAuth('refresh_token', patch)}
              />
            </div>
          )}
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
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
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