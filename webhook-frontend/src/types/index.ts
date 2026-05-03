export type HttpMethod = 'POST' | 'PUT' | 'PATCH';
export type AuthType = 'NONE' | 'BASIC' | 'BEARER' | 'OAUTH';
export type OAuthConfigAuthType = 'NONE' | 'BASIC' | 'BEARER';

// ── OAuth types ────────────────────────────────────────────────────────────────

export interface OAuthKVRow {
  key: string;
  value: string;
  type?: string; // 'text' | 'secret' | 'number'
}

export interface OAuthTokenConfig {
  method: 'POST' | 'GET' | 'PUT' | 'PATCH';
  // Auth used when calling the auth server for this token
  auth_type: OAuthConfigAuthType;
  auth_config: {
    username?: string;   // BASIC
    password?: string;   // BASIC
    token?: string;      // BEARER
  };
  headers: OAuthKVRow[];
  payload: OAuthKVRow[];
  token_key: string;
  expiry_source: 'response' | 'manual';
  expiry_key: string;
  date_format: string;
  jwt_bound: boolean;
  manual_duration: string;
  manual_unit: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY';
}

export interface OAuthConfig {
  refresh_enabled: boolean;
  access_token: OAuthTokenConfig;
  refresh_token: OAuthTokenConfig;
}

// ── Existing types (unchanged) ─────────────────────────────────────────────────

export interface Webhook {
  webhook_id: number;
  user_id: number;
  name: string;
  method: HttpMethod;
  auth_type: AuthType;
  auth_config: Record<string, string> | null;
  headers: Record<string, string> | null;
  payload_schema: Array<{ key: string; type: string }> | null;
  created_at: string;
}

export interface WebhookFormData {
  name: string;
  method: HttpMethod;
  auth_type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  oauth?: OAuthConfig;
  headers: { key: string; value: string }[];
  payload_schema: { key: string; type: string }[];
}

export type ActivityStatus = 'SUCCESS' | 'FAILURE' | 'PENDING';

export interface WebhookActivity {
  measurement_id: number;
  system_name: string;
  user_id: number;
  webhook_id: number;
  status: ActivityStatus;
  time: string;
  webhook?: {
    name: string;
    method: string;
  };
}