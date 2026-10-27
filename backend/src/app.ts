import express from "express";
import cors from "cors";
import categoriasRoutes from "./routes/categorias.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import listaCompraRoutes from "./routes/lista-compra.routes.js";
import listasCompraRoutes from "./routes/listas-compra.routes.js";

const app = express();

const origenesPermitidos = (process.env["CORS_ORIGINS"] ?? "")
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      origenesPermitidos.length > 0
        ? origenesPermitidos
        : ["http://localhost:4200", "http://127.0.0.1:4200"],
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mensaje: "API de Mi compra funcionando correctamente",
  });
});

app.use("/api/categorias", categoriasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/lista", listaCompraRoutes);
app.use("/api/listas", listasCompraRoutes);

export default app;
