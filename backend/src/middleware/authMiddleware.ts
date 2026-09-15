import { redisClient } from "../config/redis.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser, UserRole } from "../models/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
interface JwtPayload {
  id: number;
  role: UserRole;
}


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const rawToken = req.cookies["auth_token"];

  if (!rawToken) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = rawToken.replace(/^Bearer\s+/i, "").trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const cached = await redisClient.get<string>(`user:${decoded.id}`);
    const isBlacklisted = await redisClient.get<string>(`blacklist:${token}`);

if (isBlacklisted) {
  return res.status(401).json({ error: "Unauthorized: Token expired" });
}


const user = cached
  ? JSON.parse(cached)
  : await User.findById(decoded.id).lean();


    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    // Clear broken/stale auth cookie so next login can set a clean token.
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
