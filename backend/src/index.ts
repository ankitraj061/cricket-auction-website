import express from "express";
import "dotenv/config";
import cors from 'cors'
import cookieParser from "cookie-parser";
import { connectRedis } from "./config/redis.js";
import auctionRouter from "./routes/auction.route.js";
import { rateLimit } from "./middleware/rateLimitMiddleware.js";
import authRouter from "./routes/auth.route.js";




const app = express()
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: [process.env.ORIGIN || "", process.env.PRODUCTION_ORIGIN || "", process.env.PRODUCTION_ORIGIN_2 || ""],
    credentials: true,
 }));
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(rateLimit);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Auction Backend is running!");
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
app.use('/api/auction', auctionRouter);
app.use('/api/auth', authRouter);



(async () => {
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();