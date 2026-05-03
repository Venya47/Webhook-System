import { Request, Response, NextFunction } from 'express';
import { Webhook } from '../models/Webhook';

export const webhookAuth = async (req: any, res: Response, next: NextFunction) => {
  try {
    const webhookName = req.headers?.webhook_name as string ?? 'default';
    // finds webhook config with name
    const webhook = await Webhook.findOne({ where: { name: webhookName } });

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    req.webhook_config = webhook;

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};