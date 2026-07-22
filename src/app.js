import express from "express";
import cors from "cors";
import filesRoutes from './routes/filesRoutes/filesRoutes.js';
import dashboardRoutes from './routes/dashboard/dashboardRoutes.js';
import authRoutes from "./routes/authRoutes/authRoutes.js";
import { connectDB } from "./config/db.js";
import { verifyToken } from "./middlewares/authMiddleware.js";
import { exportFileReportPdf } from "./controllers/reportController.js";
import { getAllTotals } from "./controllers/statics/getTotals.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
connectDB();

app.use(verifyToken);

app.use("/api/auth", authRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/api/files/:id/report/pdf", exportFileReportPdf);
app.use("/api/statistics/totals", getAllTotals);

export default app;
