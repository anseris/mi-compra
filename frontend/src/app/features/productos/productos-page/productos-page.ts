import { SelectModule } from "primeng/select";
import { CurrencyPipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import type { Categoria } from "../../../core/models/categoria.model";
import type { Producto } from "../../../core/models/producto.model";
import { CategoriasService } from "../../../core/services/categorias.service";
import { ListaCompraService } from "../../../core/services/lista-compra.service";
import { ProductosService } from "../../../core/services/productos.service";
import { SeccionesService } from "../../../core/services/secciones.service";
import { CatalogoModalesService } from "../../../core/services/catalogo-modales.service";
import { mensajeError } from "../../../shared/utils/api-error";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { DividerModule } from "primeng/divider";

@Component({
  selector: "app-productos-page",
  imports: [
    FormsModule,
    CurrencyPipe,
    ButtonModule,
    CardModule,
    SelectModule,
    InputTextModule,
    MessageModule,
    DividerModule,
  ],
  templateUrl: "./productos-page.html",
  styleUrl: "./productos-page.css",
})
export class ProductosPage implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly seccionesService = inject(SeccionesService);
  private readonly listaService = inject(ListaCompraService);
  private readonly modalesService = inject(CatalogoModalesService);

  readonly productos = this.productosService.productos;
  readonly categorias = this.categoriasService.categorias;
  readonly secciones = this.seccionesService.secciones;
  readonly vista = signal<"cards" | "listado">("cards");
  readonly productosEnLista = computed(
    () =>
      new Set(
        this.listaService
          .items()
          .flatMap((item) => (item.productoId ? [item.productoId] : [])),
      ),
  );
  readonly cargando = computed(
    () =>
      this.productosService.cargando() ||
      this.categoriasService.cargando() ||
      this.seccionesService.cargando(),
  );

  readonly error = signal("");
  readonly aviso = signal("");
  readonly busqueda = signal("");
  readonly filtroCategoria = signal("todas");
  readonly filtroSeccion = signal("todas");
  readonly filtroSubseccion = signal("todas");

  readonly opcionesFiltroCategoria = computed(() => [
    { nombre: "Todas las categorías", valor: "todas" },
    ...this.categorias().map((categoria) => ({
      nombre: categoria.nombre,
      valor: categoria._id,
    })),
  ]);

  readonly opcionesFiltroSeccion = computed(() => [
    { nombre: "Todas las secciones", valor: "todas" },
    ...this.secciones().map((seccion) => ({
      nombre: seccion.nombre,
      valor: seccion._id,
    })),
    { nombre: "Sin sección", valor: "sin-seccion" },
  ]);

  readonly opcionesFiltroSubseccion = computed(() => {
    if (
      this.filtroSeccion() === "todas" ||
      this.filtroSeccion() === "sin-seccion"
    ) {
      return [{ nombre: "Todas las subsecciones", valor: "todas" }];
    }

    const seccion = this.secciones().find(
      (actual) => actual._id === this.filtroSeccion(),
    );

    return [
      { nombre: "Todas las subsecciones", valor: "todas" },
      ...(seccion?.subsecciones ?? []).map((subseccion) => ({
        nombre: subseccion,
        valor: subseccion,
      })),
    ];
  });

  readonly categoriasPorId = computed(
    () =>
      new Map(this.categorias().map((categoria) => [categoria._id, categoria])),
  );

  readonly seccionesPorId = computed(
    () => new Map(this.secciones().map((seccion) => [seccion._id, seccion])),
  );

  readonly productosFiltrados = computed(() => {
    const consulta = this.busqueda().trim().toLocaleLowerCase("es");
    const filtroCategoria = this.filtroCategoria();
    const filtroSeccion = this.filtroSeccion();
    const filtroSubseccion = this.filtroSubseccion();
    const categorias = this.categoriasPorId();
    const secciones = this.seccionesPorId();

    return this.productos().filter((producto) => {
      const categoria = categorias.get(producto.categoria);
      const nombreCategoria = categoria?.nombre ?? "";
      const seccion = producto.seccion
        ? secciones.get(producto.seccion)
        : undefined;
      const nombreSeccion = seccion?.nombre ?? "";

      const coincideTexto =
        !consulta ||
        producto.nombre.toLocaleLowerCase("es").includes(consulta) ||
        nombreCategoria.toLocaleLowerCase("es").includes(consulta) ||
        nombreSeccion.toLocaleLowerCase("es").includes(consulta) ||
        (producto.subseccion ?? "").toLocaleLowerCase("es").includes(consulta);
      const coincideCategoria =
        filtroCategoria === "todas" || producto.categoria === filtroCategoria;
      const coincideSeccion =
        filtroSeccion === "todas" ||
        (filtroSeccion === "sin-seccion"
          ? !producto.seccion
          : producto.seccion === filtroSeccion);
      const coincideSubseccion =
        filtroSubseccion === "todas" ||
        producto.subseccion === filtroSubseccion;

      return (
        coincideTexto &&
        coincideCategoria &&
        coincideSeccion &&
        coincideSubseccion
      );
    });
  });

  readonly hayFiltrosActivos = computed(
    () =>
      Boolean(this.busqueda().trim()) ||
      this.filtroCategoria() !== "todas" ||
      this.filtroSeccion() !== "todas" ||
      this.filtroSubseccion() !== "todas",
  );

  ngOnInit(): void {
    this.categoriasService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudieron cargar las categorías."),
        );
      },
    });

    this.productosService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudo cargar el catálogo."));
      },
    });

    this.seccionesService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudieron cargar las secciones."),
        );
      },
    });

    this.listaService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudo cargar el estado de la lista."),
        );
      },
    });
  }

  cambiarFiltroSeccion(seccionId: string): void {
    this.filtroSeccion.set(seccionId);
    this.filtroSubseccion.set("todas");
  }

  categoriaDe(producto: Producto): Categoria | undefined {
    return this.categoriasPorId().get(producto.categoria);
  }

  nombreCategoria(producto: Producto): string {
    return this.categoriaDe(producto)?.nombre ?? "Sin categoría";
  }

  nombreSeccion(producto: Producto): string {
    return producto.seccion
      ? this.seccionesPorId().get(producto.seccion)?.nombre ?? "Sin sección"
      : "Sin sección";
  }

  iconoCategoria(producto: Producto): string {
    return this.categoriaDe(producto)?.icono ?? "🛍️";
  }

  productoEnLista(producto: Producto): boolean {
    return this.productosEnLista().has(producto._id);
  }

  editarProducto(producto: Producto): void {
    this.modalesService.abrirProducto(producto);
  }

  eliminarProducto(producto: Producto): void {
    if (
      !window.confirm(
        `¿Eliminar «${producto.nombre}» del catálogo? Los artículos que ya estén en la lista se conservarán.`,
      )
    ) {
      return;
    }

    this.error.set("");

    this.productosService.eliminar(producto._id).subscribe({
      next: () => {
        this.mostrarAviso(`«${producto.nombre}» eliminado del catálogo.`);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudo eliminar el producto."));
      },
    });
  }

  anadirALista(producto: Producto): void {
    this.error.set("");

    this.listaService.crear({ productoId: producto._id }).subscribe({
      next: (item) => {
        this.mostrarAviso(
          item.cantidad > 1
            ? `«${producto.nombre}» añadido otra vez. Ya tienes ${item.cantidad} en «${this.listaService.listaSeleccionada()?.nombre ?? "la lista"}».`
            : `«${producto.nombre}» añadido a «${this.listaService.listaSeleccionada()?.nombre ?? "la lista"}».`,
        );
      },
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudo añadir el producto a la lista."),
        );
      },
    });
  }

  abrirNuevoProducto(): void {
    this.modalesService.abrirProducto();
  }

  private mostrarAviso(texto: string): void {
    this.aviso.set(texto);
    window.setTimeout(() => this.aviso.set(""), 3500);
  }
}
