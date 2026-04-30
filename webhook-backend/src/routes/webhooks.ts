import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Webhook } from '../models/Webhook';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper: build auth_config from request body
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

// GET /api/webhooks — all webhooks for logged-in user
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

// GET /api/webhooks/:id — single webhook
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const webhook = await Webhook.findOne({
      where: { webhook_id: Number(req.params.id), user_id: req.userId },
    });
    console.log("got the webhook don't worry i am working fine");//-------------
    console.log(webhook);//----------------------------------------------------
    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }
    res.json(webhook);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/webhooks — create webhook
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, target_url, method, auth_type, headers, payload_schema, ...authFields } = req.body;

    if (!name || !target_url || !method || !auth_type) {
      res.status(400).json({ message: 'name, target_url, method, and auth_type are required' });
      return;
    }

    const auth_config = buildAuthConfig(auth_type, authFields);

    const webhook = await Webhook.create({
      user_id: req.userId,
      name,
      target_url,
      method,
      auth_type,
      auth_config,
      headers: headers || null,
      payload_schema: payload_schema || null,
    });

    res.status(201).json(webhook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/webhooks/:id — update webhook
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const webhook = await Webhook.findOne({
      where: { webhook_id: Number(req.params.id), user_id: req.userId },
    });

    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }

    const { name, target_url, method, auth_type, headers, payload_schema, ...authFields } = req.body;

    const auth_config = auth_type ? buildAuthConfig(auth_type, authFields) : webhook.auth_config;

    await webhook.update({
      name: name ?? webhook.name,
      target_url: target_url ?? webhook.target_url,
      method: method ?? webhook.method,
      auth_type: auth_type ?? webhook.auth_type,
      auth_config,
      headers: headers !== undefined ? headers : webhook.headers,
      payload_schema: payload_schema !== undefined ? payload_schema : webhook.payload_schema,
    });

    res.json(webhook);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;