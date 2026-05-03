// import { Response } from 'express';
// import jwt from 'jsonwebtoken';
// import httpStatus from 'http-status';
// import moment from 'moment';
// import { Webhook } from '../models/Webhook';
// import { WebhookOauthConfig } from '../models/WebhookOauthConfig';
// import { WebhookToken } from '../models/WebhookToken';
// import { WebhookLog } from '../models/WebhookLog';

// const WEBHOOK_JWT_SECRET = process.env.WEBHOOK_JWT_SECRET!;
// const ACCESS_TOKEN_EXPIRY_HOURS = 1;
// const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// export class WebhookController {
//   constructor() {}

//   // ─── Helpers ──────────────────────────────────────────────────────────────

//   printHead = (data: any) => {
//     console.log(`-------------------------${data} at ${moment().format('YYYY-MM-DD HH:mm:ss')}-----------------------------------`);
//   };

//   printError = (data: any) => console.log('ERROR -', data);
//   printSuccess = (data: any) => console.log('SUCCESS -', data);

//   private generateAccessToken = (webhookId: number): { token: string; expiry: Date } => {
//     const expiry = moment().add(ACCESS_TOKEN_EXPIRY_HOURS, 'hours').toDate();
//     const token = jwt.sign({ webhook_id: webhookId, type: 'access' }, WEBHOOK_JWT_SECRET, { expiresIn: '1h' });
//     return { token, expiry };
//   };

//   private generateRefreshToken = (webhookId: number): { token: string; expiry: Date } => {
//     const expiry = moment().add(REFRESH_TOKEN_EXPIRY_DAYS, 'days').toDate();
//     const token = jwt.sign({ webhook_id: webhookId, type: 'refresh' }, WEBHOOK_JWT_SECRET, { expiresIn: '7d' });
//     return { token, expiry };
//   };

//   private saveLog = async (
//     webhook: Webhook,
//     measurementId: string | null,
//     status: 'success' | 'failed',
//     responseCode: number
//   ) => {
//     try {
//       await WebhookLog.create({
//         webhook_id: webhook.webhook_id,
//         user_id: webhook.user_id,
//         measurement_id: measurementId,
//         system_name: webhook.name,
//         status,
//         response_code: responseCode,
//       });
//     } catch (err) {
//       console.error('Log save failed —', err);
//     }
//   };

//   // ─── Validate Credentials ─────────────────────────────────────────────────

//   private validateCredentials = (req: any, webhook: Webhook): boolean => {
//     const authType = webhook.auth_type;

//     if (authType === 'BEARER') {
//       let bearerToken: string | undefined;
//       if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
//         bearerToken = req.headers.authorization.split(' ')[1];
//       }
//       if (!bearerToken || bearerToken !== webhook.auth_config?.token) {
//         this.printError('Bearer token mismatch');
//         return false;
//       }
//     }

//     if (authType === 'OAUTH') {
//       const oauthAuthType = webhook.auth_config?.type; // 'basic' or 'bearer'

//       if (oauthAuthType === 'basic') {
//         let basicEncoded: string | undefined;
//         if (req.headers.authorization?.split(' ')[0] === 'Basic') {
//           basicEncoded = req.headers.authorization.split(' ')[1];
//         }
//         if (!basicEncoded) {
//           this.printError('Basic credentials missing');
//           return false;
//         }
//         const decoded = Buffer.from(basicEncoded, 'base64').toString('utf8');
//         const [username, password] = decoded.split(':');
//         if (username !== webhook.auth_config?.username || password !== webhook.auth_config?.password) {
//           this.printError('Basic credentials mismatch');
//           return false;
//         }
//       }

//       if (oauthAuthType === 'bearer') {
//         let bearerToken: string | undefined;
//         if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
//           bearerToken = req.headers.authorization.split(' ')[1];
//         }
//         if (!bearerToken || bearerToken !== webhook.auth_config?.token) {
//           this.printError('Bearer token mismatch');
//           return false;
//         }
//       }
//     }

//     return true;
//   };

//   // ─── LOGIN ────────────────────────────────────────────────────────────────

//   login = async (req: any, res: Response) => {
//     try {
//       const webhook: Webhook = req.webhook_config;
//       this.printHead('Webhook Login — ' + webhook.name);

//       // NONE
//       if (webhook.auth_type === 'NONE') {
//         const access = this.generateAccessToken(webhook.webhook_id);
//         await WebhookToken.upsert({
//           webhook_id: webhook.webhook_id,
//           access_token: access.token,
//           access_expiry: access.expiry,
//           refresh_token: null,
//           refresh_expiry: null,
//         });
//         return res.status(httpStatus.OK).json({ access_token: access.token });
//       }

//       // BEARER
//       if (webhook.auth_type === 'BEARER') {
//         if (!this.validateCredentials(req, webhook)) {
//           return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED' });
//         }
//         const access = this.generateAccessToken(webhook.webhook_id);
//         await WebhookToken.upsert({
//           webhook_id: webhook.webhook_id,
//           access_token: access.token,
//           access_expiry: access.expiry,
//           refresh_token: null,
//           refresh_expiry: null,
//         });
//         return res.status(httpStatus.OK).json({ access_token: access.token });
//       }

//       // OAUTH
//       if (webhook.auth_type === 'OAUTH') {
//         if (!this.validateCredentials(req, webhook)) {
//           return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED' });
//         }

//         const oauthConfig = await WebhookOauthConfig.findOne({ where: { webhook_id: webhook.webhook_id } });
//         if (!oauthConfig) {
//           return res.status(httpStatus.BAD_REQUEST).json({ message: 'OAuth config not found' });
//         }

//         const access = this.generateAccessToken(webhook.webhook_id);
//         let refreshToken = null;
//         let refreshExpiry = null;

//         if (oauthConfig.is_refresh_enabled) {
//           const refresh = this.generateRefreshToken(webhook.webhook_id);
//           refreshToken = refresh.token;
//           refreshExpiry = refresh.expiry;
//         }

//         await WebhookToken.upsert({
//           webhook_id: webhook.webhook_id,
//           access_token: access.token,
//           access_expiry: access.expiry,
//           refresh_token: refreshToken,
//           refresh_expiry: refreshExpiry,
//         });

//         // Response schema follow panni return pannum
//         const response: any = {
//           [oauthConfig.access_token_key]: access.token,
//           [oauthConfig.access_expiry_key]: oauthConfig.access_expiry_format === 'UNIX'
//             ? moment(access.expiry).unix()
//             : moment(access.expiry).toISOString(),
//         };

//         if (oauthConfig.is_refresh_enabled && oauthConfig.refresh_token_key) {
//           response[oauthConfig.refresh_token_key] = refreshToken;
//           if (oauthConfig.refresh_expiry_key) {
//             response[oauthConfig.refresh_expiry_key] = oauthConfig.refresh_expiry_format === 'UNIX'
//               ? moment(refreshExpiry!).unix()
//               : moment(refreshExpiry!).toISOString();
//           }
//         }

//         this.printSuccess(response);
//         return res.status(httpStatus.OK).json(response);
//       }

//       return res.status(httpStatus.BAD_REQUEST).json({ message: 'Unknown auth type' });
//     } catch (error) {
//       this.printError(error);
//       return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
//     }
//   };

//   // ─── REFRESH ──────────────────────────────────────────────────────────────

//   refresh = async (req: any, res: Response) => {
//     try {
//       const webhook: Webhook = req.webhook_config;
//       this.printHead('Webhook Refresh — ' + webhook.name);

//       if (webhook.auth_type !== 'OAUTH') {
//         return res.status(httpStatus.BAD_REQUEST).json({ message: 'Refresh only for OAUTH type' });
//       }

//       const oauthConfig = await WebhookOauthConfig.findOne({ where: { webhook_id: webhook.webhook_id } });
//       if (!oauthConfig || !oauthConfig.is_refresh_enabled) {
//         return res.status(httpStatus.BAD_REQUEST).json({ message: 'Refresh not enabled' });
//       }

//       // Refresh token header-la varum
//       let refreshToken: string | undefined;
//       if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
//         refreshToken = req.headers.authorization.split(' ')[1];
//       }

//       if (!refreshToken) {
//         return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Refresh token missing' });
//       }

//       // DB-la irukkadhoda compare pannum
//       const webhookToken = await WebhookToken.findOne({ where: { webhook_id: webhook.webhook_id } });

//       if (!webhookToken || webhookToken.refresh_token !== refreshToken) {
//         this.printError('Refresh token mismatch');
//         return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED — Invalid refresh token' });
//       }

//       // Refresh token expire aachaa?
//       if (moment().isAfter(moment(webhookToken.refresh_expiry!))) {
//         this.printError('Refresh token expired');
//         return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED — Refresh token expired, login again' });
//       }

//       // JWT verify
//       try {
//         jwt.verify(refreshToken, WEBHOOK_JWT_SECRET);
//       } catch (err) {
//         this.printError('Refresh token JWT invalid');
//         return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED — Invalid refresh token' });
//       }

//       // Pudhu access token generate pannum
//       const access = this.generateAccessToken(webhook.webhook_id);
//       await webhookToken.update({
//         access_token: access.token,
//         access_expiry: access.expiry,
//       });

//       const response: any = {
//         [oauthConfig.access_token_key]: access.token,
//         [oauthConfig.access_expiry_key]: oauthConfig.access_expiry_format === 'UNIX'
//           ? moment(access.expiry).unix()
//           : moment(access.expiry).toISOString(),
//       };

//       this.printSuccess(response);
//       return res.status(httpStatus.OK).json(response);
//     } catch (error) {
//       this.printError(error);
//       return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
//     }
//   };

//   // ─── MEASUREMENT ──────────────────────────────────────────────────────────

//   measurement = async (req: any, res: Response) => {
//     const webhook: Webhook = req.webhook_config;
//     const measurementId = req?.body?.id ?? null;

//     try {
//       this.printHead('Measurement — ' + webhook.name);

//       // ── 1. Method Check ──
//       if (req.method !== webhook.method) {
//         this.printError(`Method mismatch — expected ${webhook.method}, got ${req.method}`);
//         await this.saveLog(webhook, measurementId, 'failed', httpStatus.METHOD_NOT_ALLOWED);
//         return res.status(httpStatus.METHOD_NOT_ALLOWED).json({ message: 'METHOD NOT ALLOWED' });
//       }

//       // ── 2. Auth Check ──
//       if (webhook.auth_type !== 'NONE') {
//         let bearerToken: string | undefined;
//         if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
//           bearerToken = req.headers.authorization.split(' ')[1];
//         }

//         if (!bearerToken) {
//           this.printError('Token missing');
//           await this.saveLog(webhook, measurementId, 'failed', httpStatus.UNAUTHORIZED);
//           return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED — Token missing' });
//         }

//         const webhookToken = await WebhookToken.findOne({ where: { webhook_id: webhook.webhook_id } });

//         if (!webhookToken || webhookToken.access_token !== bearerToken) {
//           this.printError('Token mismatch');
//           await this.saveLog(webhook, measurementId, 'failed', httpStatus.UNAUTHORIZED);
//           return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED — Invalid token' });
//         }

//         // Access token expire aachaa?
//         if (moment().isAfter(moment(webhookToken.access_expiry))) {
//           this.printError('Access token expired');

//           if (webhook.auth_type === 'OAUTH') {
//             const oauthConfig = await WebhookOauthConfig.findOne({ where: { webhook_id: webhook.webhook_id } });
//             if (oauthConfig?.is_refresh_enabled && webhookToken.refresh_token && moment().isBefore(moment(webhookToken.refresh_expiry!))) {
//               await this.saveLog(webhook, measurementId, 'failed', httpStatus.UNAUTHORIZED);
//               return res.status(httpStatus.UNAUTHORIZED).json({ message: 'ACCESS_TOKEN_EXPIRED — Call /refresh' });
//             }
//           }

//           await this.saveLog(webhook, measurementId, 'failed', httpStatus.UNAUTHORIZED);
//           return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED — Token expired, login again' });
//         }

//         // JWT verify
//         try {
//           jwt.verify(bearerToken, WEBHOOK_JWT_SECRET);
//         } catch (err) {
//           this.printError('JWT invalid');
//           await this.saveLog(webhook, measurementId, 'failed', httpStatus.UNAUTHORIZED);
//           return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED — Invalid token' });
//         }
//       }

//       // ── 3. Headers Check ──
//       if (webhook.headers && Object.keys(webhook.headers).length) {
//         for (const key of Object.keys(webhook.headers)) {
//           if (!req.headers.hasOwnProperty(key) || req.headers[key] !== webhook.headers[key]) {
//             this.printError(`Header mismatch — key: ${key}`);
//             await this.saveLog(webhook, measurementId, 'failed', httpStatus.UNAUTHORIZED);
//             return res.status(httpStatus.UNAUTHORIZED).json({ message: `UNAUTHORIZED — Header mismatch: ${key}` });
//           }
//         }
//       }

//       // ── 4. Payload Schema Check ──
//       if (webhook.payload_schema && Object.keys(webhook.payload_schema).length) {
//         for (const key of Object.keys(webhook.payload_schema)) {
//           if (!req.body.hasOwnProperty(key)) {
//             this.printError(`Payload key missing — key: ${key}`);
//             await this.saveLog(webhook, measurementId, 'failed', httpStatus.BAD_REQUEST);
//             return res.status(httpStatus.BAD_REQUEST).json({ message: `BAD REQUEST — Missing payload key: ${key}` });
//           }
//         }
//       }

//       // ── All Checks Passed ──
//       await this.saveLog(webhook, measurementId, 'success', httpStatus.OK);
//       const data = { message: 'Webhook received successfully' };
//       this.printSuccess(data);
//       return res.status(httpStatus.OK).json(data);

//     } catch (error) {
//       this.printError(error);
//       await this.saveLog(webhook, measurementId, 'failed', httpStatus.INTERNAL_SERVER_ERROR);
//       return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
//     }
//   };
// }