import { Request, Response, NextFunction } from 'express';

// Example config (later DB la store pannalaam)
const measurement= {
    type: "Bearer",
    token: "my-token"
  };

export const verifyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const webhookType = req.params.id; // /webhook/:id

  const config = measurement;

  if (!config) {
    return res.status(404).json({ error: "Webhook not found" });
  }

  //  No Auth
  if (config.type === "none") {
    return next();
  }

  // Bearer Token
  if (config.type === "Bearer") {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(' ')[1];

    if (token !== config.token) {
      return res.status(403).json({ error: "Invalid token" });
    }

    return next();
  }

  //  Basic Auth
  if (config.type === "Basic") {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
    return res.status(401).json({ error: "No auth header" });
    }

    const [scheme, encoded] = authHeader.split(' ');

    if (!encoded) {
    return res.status(400).json({ error: "Invalid auth format" });
    }


    const decoded = Buffer.from(encoded, 'base64').toString();

    const [username, password] = decoded.split(':');
    if (username !== "admin" || password !== "1234") {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    return next();
  }

  return res.status(400).json({ error: "Unsupported auth type" });
};