import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { redisClient } from '../config/redis.js';
import { User, UserRole } from '../models/index.js';
import { getNextSequence } from '../models/Counter.js';

dotenv.config();

interface JwtPayload {
  id: number;
  role: UserRole;
}


export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).lean();

    if (!user) {
  res.status(401).json({ error: "Invalid credentials" });
  return;
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch || user.role !== UserRole.ADMIN) {
  res.status(401).json({ error: "Invalid credentials" });
  return;
}


    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


export const userLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).lean();
     if (!user) {
  res.status(401).json({ error: "Invalid credentials" });
  return;
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch || user.role !== UserRole.ADMIN) {
  res.status(401).json({ error: "Invalid credentials" });
  return;
}


    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


export const adminRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const id = await getNextSequence('User');
    const newUser = await User.create({
      _id: id,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN
    });

    res.status(201).json({
      message: "Admin registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const userRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const id = await getNextSequence('User');
    const newUser = await User.create({
      _id: id,
      email,
      password: hashedPassword,
      role: UserRole.USER
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};




export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies["auth_token"]; // <-- correct cookie name

    if (token) {
      try {
        const payload = jwt.decode(token) as { exp?: number } | null;

        if (payload?.exp) {
          // blacklist token until it naturally expires
          await redisClient.set(`blacklist:${token}`, "1");
          await redisClient.expireat(`blacklist:${token}`, payload.exp);
        }
      } catch (err) {
        console.error("JWT decode failed:", err);
      }
    }

    // Clear cookie safely
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    console.error("Logout error:", err);
    res.status(500).json({ error: err.message });
  }
};




export const checkAuth = async (req: Request, res: Response) => {
  try {
    const rawToken = req.cookies["auth_token"];
    const token = rawToken?.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check blacklist
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: "Session expired" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    // Fetch user
    const user = await User.findById(decoded.id).select('_id email role').lean();

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Return session info
    res.status(200).json({
      authenticated: true,
      user: { id: user._id, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("checkAuth error:", err);
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
