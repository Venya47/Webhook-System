import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { WebhookActivity } from '../models/WebhookActivity';
import { Webhook } from '../models/Webhook';

const router = Router();
router.use(authMiddleware);

// GET /api/activity — all activity for logged-in user (optional ?webhook_id=X filter)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { webhook_id, status, limit = '50', offset = '0' } = req.query;

    const where: Record<string, unknown> = { user_id: req.userId };
    if (webhook_id) where.webhook_id = webhook_id;
    if (status) where.status = status;

    const { rows: activities, count } = await WebhookActivity.findAndCountAll({
      where,
      include: [{ model: Webhook, attributes: ['name', 'target_url', 'method'] }],
      order: [['time', 'DESC']],
      limit: Math.min(Number(limit), 100),
      offset: Number(offset),
    });

    res.json({ total: count, activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/activity/webhook/:webhookId — activity for a specific webhook
router.get('/webhook/:webhookId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify the webhook belongs to this user
    const webhook = await Webhook.findOne({
      where: { webhook_id: req.params.webhookId, user_id: req.userId },
    });
    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }

    const activities = await WebhookActivity.findAll({
      where: { webhook_id: req.params.webhookId, user_id: req.userId },
      order: [['time', 'DESC']],
      limit: 100,
    });

    res.json(activities);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/activity — log a new activity entry
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { system_name, webhook_id, status } = req.body;

    if (!system_name || !webhook_id || !status) {
      res.status(400).json({ message: 'system_name, webhook_id, and status are required' });
      return;
    }

    if (!['SUCCESS', 'FAILURE', 'PENDING'].includes(status)) {
      res.status(400).json({ message: 'status must be SUCCESS, FAILURE, or PENDING' });
      return;
    }

    // Ensure webhook belongs to user
    const webhook = await Webhook.findOne({
      where: { webhook_id, user_id: req.userId },
    });
    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }

    const activity = await WebhookActivity.create({
      system_name,
      user_id: req.userId,
      webhook_id,
      status,
    });

    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/activity/stats — summary counts per webhook for current user
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await WebhookActivity.findAll({
      where: { user_id: req.userId },
      include: [{ model: Webhook, attributes: ['name'] }],
    });

    const stats: Record<number, { webhook_id: number; name: string; SUCCESS: number; FAILURE: number; PENDING: number; total: number }> = {};

    for (const a of activities) {
      const wid = a.webhook_id;
      if (!stats[wid]) {
        stats[wid] = { webhook_id: wid, name: (a.webhook as any)?.name ?? '', SUCCESS: 0, FAILURE: 0, PENDING: 0, total: 0 };
      }
      stats[wid][a.status]++;
      stats[wid].total++;
    }

    res.json(Object.values(stats));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;