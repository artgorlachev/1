import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export type AuthRequest = Request & { userId?: string };

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  const token = header.replace("Bearer ", "");
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT secret missing" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
