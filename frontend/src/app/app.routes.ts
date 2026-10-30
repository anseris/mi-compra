import { Routes } from "@angular/router";
import { MainLayout } from "./layout/main-layout/main-layout";

export const routes: Routes = [
  {
    path: "",
    component: MainLayout,
    children: [
      { path: "", pathMatch: "full", redirectTo: "productos" },
      {
        path: "productos",
        loadComponent: () =>
          import("./features/productos/productos-page/productos-page").then(
            (m) => m.ProductosPage,
          ),
      },
      {
        path: "lista",
        loadComponent: () =>
          import("./features/lista-compra/lista-compra-page/lista-compra-page").then(
            (m) => m.ListaCompraPage,
          ),
      },
      {
        path: "resumen-compra",
        loadComponent: () =>
          import("./features/resumen-compra/resumen-compra").then(
            (m) => m.ResumenCompra,
          ),
      },
      {
        path: "de-ruta",
        loadComponent: () =>
          import("./features/de-ruta/de-ruta").then((m) => m.DeRuta),
      },
    ],
  },

  { path: "**", redirectTo: "" },
];
