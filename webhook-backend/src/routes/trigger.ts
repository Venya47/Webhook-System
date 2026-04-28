import axios from "axios";
import { Router, Response } from 'express';
import { WebhookLog } from '../models/WebhookLog';
import { Webhook } from '../models/Webhook';

const router = Router();

router.post("/trigger/measurement", async (req, res) => {
  try {

    const webhooks = await Webhook.findAll({
      where: {
        name: "measurement"
      }
    });

    if (webhooks.length === 0) {
      return res.status(404).json({ error: "No webhook found" });
    }

    const incomingData = req.body;

    for (const hook of webhooks) {

      // payload_schema from DB (array format)
      const schema = (hook.payload_schema || []) as Array<{ key: string; type: string; description?: string }>;

      const payload: any = {};

      // map keys dynamically
      for (const field of schema) {
        payload[field.key] = incomingData[field.key];
      }
      // send mapped payload
      try {
    const response = await axios.post(hook.target_url, payload, {
      headers: {
        "Content-Type": "application/json",
        ...hook.headers
      }
    });

    // ✅ SUCCESS LOG
    await WebhookLog.create({
      webhook_id: hook.id,
      user_id: hook.user_id,   //added
      measurement_id: req.body.measurement_id,
      system_name: req.body.system_name,
      status: "success",
      response_code: response.status
    });

  } catch (err: any) {

    // ❌ FAILURE LOG
    await WebhookLog.create({
      webhook_id: hook.id,
      user_id: hook.user_id,   //added
      measurement_id: req.body.measurement_id,
      system_name:req.body.system_name,
      status: "failed",
      response_code: err.response?.status || 500
    });

  }
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});




