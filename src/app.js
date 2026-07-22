import express from "express";
import cors from "cors";
import filesRoutes from './routes/filesRoutes/filesRoutes.js';
import dashboardRoutes from './routes/dashboard/dashboardRoutes.js';
import authRoutes from "./routes/authRoutes/authRoutes.js";
import { connectDB } from "./config/db.js";
import { verifyToken } from "./middlewares/authMiddleware.js";
import { exportFileReportPdf } from "./controllers/reportController.js";
import { getAllTotals } from "./controllers/statics/getTotals.js";

console.log("========== APP LOADED ==========");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    console.log("REQUEST ORIGIN:", origin);

    if (!origin || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      console.log("BLOCKED ORIGIN:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
connectDB();


app.use("/api/auth", authRoutes);
app.use(verifyToken);
app.use("/api/files", filesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/api/files/:id/report/pdf", exportFileReportPdf);
app.use("/api/statistics/totals", getAllTotals);

export default app;
