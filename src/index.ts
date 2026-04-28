import cors from "cors";
import('apminsight')
    .then(({ default: AgentAPI }) => AgentAPI.config())
    .catch(() => console.log('APM not available in this environment'));

import express from "express";
import { toNodeHandler } from "better-auth/node";

import subjectsRouter from "./routes/subjects.js";
import usersRouter from "./routes/users.js";
import classesRouter from "./routes/classes.js";
import departmentsRouter from "./routes/departments.js";
import statsRouter from "./routes/stats.js";
import enrollmentsRouter from "./routes/enrollments.js";

// import securityMiddleware from "./middleware/security.js";
import { auth } from "./lib/auth.js";

const app = express();
const PORT = 8000;

app.use(cors({
    origin: "https://classroom-two-kappa.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// ✅ Exp
app.options("*", cors());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// app.use(securityMiddleware);

app.use("/api/subjects", subjectsRouter);
app.use("/api/users", usersRouter);
app.use("/api/classes", classesRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/enrollments", enrollmentsRouter);

app.get("/", (req, res) => {
    res.send("Backend server is running!");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});