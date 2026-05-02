import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para parsear JSON
  app.use(express.json());

  // Rutas de API pueden ir aquí
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Iniciando en modo DESARROLLO (Vite Middleware)");
    // Configuración de Vite para desarrollo
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Iniciando en modo PRODUCCIÓN (Archivos Dist)");
    // Configuración para producción
    const distPath = path.resolve(__dirname, 'dist');
    console.log(`Buscando archivos estáticos en: ${distPath}`);
    
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      console.log(`Fallback SPA para: ${req.url}`);
      const indexPath = path.resolve(distPath, 'index.html');
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error al iniciar el servidor:", err);
});
