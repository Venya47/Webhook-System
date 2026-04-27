import 'reflect-metadata';
import express from 'express';
import { sequelize } from './config/database';
import webhookRoutes from './routes/route';

const app = express();
const PORT = 5001;

app.use(express.json());
app.use('/api', webhookRoutes);

async function start() {
  try {
    // DB sync here
    await sequelize.sync();

    console.log("DB connected ✅");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Error starting server:", err);
  }
}

start();