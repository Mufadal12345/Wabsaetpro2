import express from "express";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ==========================================
  // BACKEND ADMIN CONFIGURATION
  // ==========================================
  // NEVER use require("path/to/serviceAccountKey.json") directly if the code is public.
  // Instead, use an environment variable so secrets stay out of the code structure.
  
  try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountRaw) {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing.");
      console.warn("Backend Firebase Admin SDK will not be initialized until setup.");
    } else {
      const serviceAccount = JSON.parse(serviceAccountRaw);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://liev-69588-default-rtdb.europe-west1.firebasedatabase.app"
      });
      console.log("✅ Backend Firebase Admin SDK initialized successfully.");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
  }

  // API middleware
  app.use(express.json());

  // API Routes MUST go before Vite middleware
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Backend is running with full separation from frontend." });
  });

  // Proxy secure admin tasks through an API
  // e.g., app.post("/api/admin/do-something", checkAuthMiddleware, (req, res) => { ... });

  // ==========================================
  // VITE FRONTEND MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Use *all instead of * for Express v5 compatibility if it is v5, else * is fine
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
