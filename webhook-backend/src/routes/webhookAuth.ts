// import { Router } from 'express';
// import { WebhookController } from '../routes/webhookAuthController';
// import { webhookAuth } from '../middleware/webhookAuth';

// export class WebhookRoute {
//   public router: Router;
//   public webhookController: WebhookController = new WebhookController();

//   constructor() {
//     this.router = Router();
//     this.route();
//   }

//   route() {
//     // Login — Token Generate (NONE / BEARER / OAUTH)
//     this.router.post('/login', webhookAuth, this.webhookController.login);

//     // Refresh — new Access Token (OAUTH only)
//     this.router.post('/refresh', webhookAuth, this.webhookController.refresh);

//     // Measurement — Webhook Data Receive
//     this.router.post('/measurement', webhookAuth, this.webhookController.measurement);
//     this.router.put('/measurement', webhookAuth, this.webhookController.measurement);
//     this.router.patch('/measurement', webhookAuth, this.webhookController.measurement);
//   }
// }