import express from "express";
import cors from "cors";
import categoriasRoutes from "./routes/categorias.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import listaCompraRoutes from "./routes/lista-compra.routes.js";
import listasCompraRoutes from "./routes/listas-compra.routes.js";

const app = express();

const origenesConfigurados = (process.env["CORS_ORIGINS"] ?? "")
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

function normalizarOrigen(origen: string): string {
  const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(origen) ? origen : `https://${origen}`);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Origen CORS no válido: ${origen}`);
  }

  return url.origin;
}

const origenesPermitidos = (
  origenesConfigurados.length > 0
    ? origenesConfigurados
    : ["http://localhost:4200", "http://127.0.0.1:4200"]
).map(normalizarOrigen);

app.use(
  cors({
    origin: origenesPermitidos,
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
