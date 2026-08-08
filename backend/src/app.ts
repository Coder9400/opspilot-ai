import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import enquiryRoutes from './routes/enquiry.routes';
import quotationRoutes from './routes/quotation.routes';
import followUpRoutes from './routes/followup.routes';
import dashboardRoutes from './routes/dashboard.routes';
import companyRoutes from './routes/company.routes';
import receivedQuotationsRoutes from './routes/received-quotations.routes';
import { sendSuccess } from './utils/response';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins = env.isProduction
  ? [env.CLIENT_URL]
  : [env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:4200', 'http://localhost:4000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  sendSuccess(res, {
    message: 'OPSPILOT backend is running',
    version: '1.0.0',
    environment: env.NODE_ENV,
    aiProvider: env.AI_PROVIDER,
    database: 'supabase',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/received-quotations', receivedQuotationsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested route does not exist',
    },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler);

export default app;
