import { Router } from 'express';
import { verifyAuth } from '../middleware/auth';
import { Measurement } from '../models/Measurement';

const router = Router();

router.post('/my-server/measurement', 
  verifyAuth,
  async (req, res) => {
  try {
    const data = req.body;

    // map JSON → columns
    await Measurement.create({
      webhookId: "measurement",
      measurement_id: data.measurement_id,
      system_name: data.system_name,
      height: Number(data.height),
      length: Number(data.length),
      width: Number(data.width)
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;