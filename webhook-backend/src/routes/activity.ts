import { Router, Response } from 'express';
import { fn, col, literal } from 'sequelize';
import { Op } from 'sequelize';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { WebhookLog } from '../models/WebhookLog';
import { Webhook } from '../models/Webhook';

const router = Router();
router.use(authMiddleware);

// GET /api/activity/summary
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const summary = await WebhookLog.findAll({
      where: { user_id: userId },
      attributes: [
        'system_name',
        [fn('COUNT', col('id')),       'total_hits'],
        [fn('MAX', col('created_at')), 'recent_log'],
      ],
      group: ['system_name'],
      order: [[literal('recent_log'), 'DESC']],
      raw: true,
    }) as any[];

    const enriched = await Promise.all(
      summary.map(async (row: any) => {
        const latest = await WebhookLog.findOne({
          where: { user_id: userId, system_name: row.system_name },
          order: [['created_at', 'DESC']],
          attributes: ['measurement_id'],
          raw: true,
        });
        return {
          system_name:    row.system_name,
          measurement_id: latest?.measurement_id ?? null,
          total_hits:     Number(row.total_hits),
          recent_log:     row.recent_log,
        };
      })
    );

    res.json({ summary: enriched });
  } catch (err) {
    console.error('[GET /activity/summary]', err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

// GET /api/activity
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const limit  = parseInt(req.query.limit  as string) || 200;
    const offset = parseInt(req.query.offset as string) || 0;

    const where: any = { user_id: userId };
    if (req.query.webhook_id)     where.webhook_id     = Number(req.query.webhook_id);
    if (req.query.status)         where.status         = req.query.status;
    if (req.query.measurement_id) where.measurement_id = { [Op.like]: `%${req.query.measurement_id}%` };
    if (req.query.system_name)    where.system_name    = { [Op.like]: `%${req.query.system_name}%` };

    const { rows: logs, count: total } = await WebhookLog.findAndCountAll({
      where,
      include: [{ model: Webhook, attributes: ['name', 'method'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({ logs, total });
  } catch (err) {
    console.error('[GET /activity]', err);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

export default router;