import "dotenv/config"; // Load .env variables
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./swagger";
import { setupDatabaseCleanup } from "./db-cleanup";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Request Logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // ✅ Improved Error Handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("❌ Error:", message);
    res.status(status).json({ message });
  });

  // ✅ Improved Database Cleanup Handling
  try {
    await setupDatabaseCleanup();
    log("✅ Database cleanup service initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize database cleanup service:", error);
  }

  // ✅ Setup Vite only in development mode
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ Improved Port Handling (Dynamic)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

  // ✅ Remove `{ reusePort: true }` for compatibility
  server.listen(port, "0.0.0.0", () => {
    log(`✅ Server running on port ${port}`);
    log(`📖 API documentation available at http://localhost:${port}/api-docs`);
  });
})();
