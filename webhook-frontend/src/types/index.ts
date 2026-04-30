export type HttpMethod = 'GET' | 'POST';
export type AuthType = 'NONE' | 'BASIC' | 'BEARER';

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

export interface ActivityStats {
  webhook_id: number;
  name: string;
  SUCCESS: number;
  FAILURE: number;
  PENDING: number;
  total: number;
}