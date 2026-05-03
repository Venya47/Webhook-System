import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Webhook } from '../models/Webhook';
import { WebhookOauthConfig } from '../models/WebhookOauthConfig';

const router = Router();

router.use(authMiddleware);

// ── Helper: build auth_config for BASIC/BEARER ────────────────────────────────
function buildAuthConfig(auth_type: string, body: Record<string, string>): Record<string, string> | null {
  if (auth_type === 'BASIC') {
    const { username, password } = body;
    if (!username || !password) return null;
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { encoded, header: `Basic ${encoded}` };
  }
  if (auth_type === 'BEARER') {
    const { token } = body;
    if (!token) return null;
    return { token, header: `Bearer ${token}` };
  }
  return null;
}

// ── Helper: build auth_config for OAuth token endpoint (NONE/BASIC/BEARER) ────
function buildOAuthAuthConfig(
  auth_type: string,
  auth_config: Record<string, string>
): Record<string, string> | null {
  if (auth_type === 'BASIC') {
    const { username, password } = auth_config;
    if (!username || !password) return null;
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { username, password, encoded, header: `Basic ${encoded}` };
  }
  if (auth_type === 'BEARER') {
    const { token } = auth_config;
    if (!token) return null;
    return { token, header: `Bearer ${token}` };
  }
  return null;
}

// ── Helper: save/update OAuth configs ─────────────────────────────────────────
async function saveOAuthConfigs(webhook_id: number, oauth: any): Promise<void> {
  // Delete existing configs for this webhook and re-create
  await WebhookOauthConfig.destroy({ where: { webhook_id } });

  const { access_token, refresh_token, refresh_enabled } = oauth;

  // Always save access token config
  await WebhookOauthConfig.create({
    webhook_id,
    token_type: 'ACCESS',
    method: access_token.method,
    auth_type: access_token.auth_type,
    auth_config: buildOAuthAuthConfig(access_token.auth_type, access_token.auth_config ?? {}),
    headers: access_token.headers?.length ? access_token.headers : null,
    payload: access_token.payload?.length ? access_token.payload : null,
    token_key: access_token.token_key,
    expiry_source: access_token.expiry_source?.toUpperCase() ?? 'RESPONSE',
    expiry_key: access_token.expiry_key || null,
    date_format: access_token.date_format || null,
    jwt_bound: access_token.jwt_bound ?? false,
    manual_duration: access_token.manual_duration ? Number(access_token.manual_duration) : null,
    manual_unit: access_token.manual_unit || null,
  });

  // Save refresh token config only if enabled
  if (refresh_enabled && refresh_token) {
    await WebhookOauthConfig.create({
      webhook_id,
      token_type: 'REFRESH',
      method: refresh_token.method,
      auth_type: refresh_token.auth_type,
      auth_config: buildOAuthAuthConfig(refresh_token.auth_type, refresh_token.auth_config ?? {}),
      headers: refresh_token.headers?.length ? refresh_token.headers : null,
      payload: refresh_token.payload?.length ? refresh_token.payload : null,
      token_key: refresh_token.token_key,
      expiry_source: refresh_token.expiry_source?.toUpperCase() ?? 'RESPONSE',
      expiry_key: refresh_token.expiry_key || null,
      date_format: refresh_token.date_format || null,
      jwt_bound: refresh_token.jwt_bound ?? false,
      manual_duration: refresh_token.manual_duration ? Number(refresh_token.manual_duration) : null,
      manual_unit: refresh_token.manual_unit || null,
    });
  }
}

// ── GET /api/webhooks ─────────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const webhooks = await Webhook.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
    });
    res.json(webhooks);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/webhooks/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const webhook = await Webhook.findOne({
      where: { webhook_id: Number(req.params.id), user_id: req.userId },
      include: [{ model: WebhookOauthConfig }],
    });
    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }
    res.json(webhook);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/webhooks ────────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, method, auth_type, headers, payload_schema, oauth, ...authFields } = req.body;

    if (!name || !method || !auth_type) {
      res.status(400).json({ message: 'unique name are required' });
      return;
    }

    const auth_config = buildAuthConfig(auth_type, authFields);

    const webhook = await Webhook.create({
      user_id: req.userId,
      name,
      method,
      auth_type,
      auth_config,
      headers: headers || null,
      payload_schema: payload_schema || null,
    });

    // Save OAuth config if auth_type is OAUTH
    if (auth_type === 'OAUTH' && oauth) {
      await saveOAuthConfigs(webhook.webhook_id, oauth);
    }

    res.status(201).json(webhook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /api/webhooks/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const webhook = await Webhook.findOne({
      where: { webhook_id: Number(req.params.id), user_id: req.userId },
    });

    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }

    const { name, method, auth_type, headers, payload_schema, oauth, ...authFields } = req.body;

    const auth_config = auth_type ? buildAuthConfig(auth_type, authFields) : webhook.auth_config;

    await webhook.update({
      name: name ?? webhook.name,
      method: method ?? webhook.method,
      auth_type: auth_type ?? webhook.auth_type,
      auth_config,
      headers: headers !== undefined ? headers : webhook.headers,
      payload_schema: payload_schema !== undefined ? payload_schema : webhook.payload_schema,
    });

    // Update OAuth config if auth_type is OAUTH
    const effectiveAuthType = auth_type ?? webhook.auth_type;
    if (effectiveAuthType === 'OAUTH' && oauth) {
      await saveOAuthConfigs(webhook.webhook_id, oauth);
    } else if (effectiveAuthType !== 'OAUTH') {
      // Auth type changed away from OAUTH — remove old configs
      await WebhookOauthConfig.destroy({ where: { webhook_id: webhook.webhook_id } });
    }

    res.json(webhook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;