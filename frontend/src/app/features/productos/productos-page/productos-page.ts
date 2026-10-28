import { SelectModule } from "primeng/select";
import { InputNumberModule } from "primeng/inputnumber";
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
import { mensajeError } from "../../../shared/utils/api-error";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
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
    InputNumberModule,
    IconFieldModule,
    InputIconModule,
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

  readonly productos = this.productosService.productos;
  readonly categorias = this.categoriasService.categorias;
  readonly secciones = this.seccionesService.secciones;
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

  readonly opcionesSubseccionFormulario = computed(
    () =>
      this.secciones().find(
        (seccion) => seccion._id === this.seccionSeleccionada(),
      )?.subsecciones ?? [],
  );

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

  // Campos del formulario de producto.
  nombreProducto = "";
  precio: number | null = null;
  categoriaSeleccionada = "";
  readonly seccionSeleccionada = signal("");
  subseccionSeleccionada = "";
  editandoId: string | null = null;

  // Campo del formulario de categoría.
  nombreNuevaCategoria = "";

  ngOnInit(): void {
    this.categoriasService.cargar().subscribe({
      next: (categorias) => {
        if (!this.categoriaSeleccionada && categorias.length > 0) {
          this.categoriaSeleccionada = categorias[0]?._id ?? "";
        }
      },
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
  }

  cambiarSeccion(seccionId: string): void {
    this.seccionSeleccionada.set(seccionId);

    if (
      !this.opcionesSubseccionFormulario().includes(
        this.subseccionSeleccionada,
      )
    ) {
      this.subseccionSeleccionada = "";
    }
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

  guardarProducto(): void {
    this.error.set("");

    const nombre = this.nombreProducto.trim();
    const precio = Number(this.precio);

    if (!nombre) {
      this.error.set("Escribe el nombre del producto.");
      return;
    }

    if (this.precio === null || !Number.isFinite(precio) || precio < 0) {
      this.error.set("Indica un precio válido (0 o más).");
      return;
    }

    if (!this.categoriaSeleccionada) {
      this.error.set("Crea o selecciona una categoría.");
      return;
    }

    if (!this.editandoId && !this.seccionSeleccionada()) {
      this.error.set("Selecciona una sección.");
      return;
    }

    const datosBase = {
      nombre,
      precio,
      categoria: this.categoriaSeleccionada,
    };

    const seccion = this.seccionSeleccionada();
    const datosSeccion = seccion
      ? { seccion, subseccion: this.subseccionSeleccionada }
      : {};
    const peticion = this.editandoId
      ? this.productosService.actualizar(this.editandoId, {
          ...datosBase,
          ...datosSeccion,
        })
      : this.productosService.crear({
          ...datosBase,
          seccion,
          subseccion: this.subseccionSeleccionada,
        });

    peticion.subscribe({
      next: (producto) => {
        this.mostrarAviso(
          this.editandoId
            ? `«${producto.nombre}» actualizado.`
            : `«${producto.nombre}» añadido al catálogo.`,
        );
        this.resetFormulario();
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudo guardar el producto."));
      },
    });
  }

  editarProducto(producto: Producto): void {
    this.editandoId = producto._id;
    this.nombreProducto = producto.nombre;
    this.precio = producto.precio;
    this.categoriaSeleccionada = producto.categoria;
    this.seccionSeleccionada.set(producto.seccion ?? "");
    this.subseccionSeleccionada = producto.subseccion ?? "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  cancelarEdicion(): void {
    this.resetFormulario();
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
        if (this.editandoId === producto._id) {
          this.resetFormulario();
        }

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

  crearCategoria(): void {
    this.error.set("");

    const nombre = this.nombreNuevaCategoria.trim();

    if (!nombre) {
      return;
    }

    const yaExiste = this.categorias().some(
      (categoria) =>
        categoria.nombre.toLocaleLowerCase("es") ===
        nombre.toLocaleLowerCase("es"),
    );

    if (yaExiste) {
      this.error.set("Ya existe una categoría con ese nombre.");
      return;
    }

    this.categoriasService.crear({ nombre, icono: "🛍️" }).subscribe({
      next: (categoria) => {
        this.categoriaSeleccionada = categoria._id;
        this.nombreNuevaCategoria = "";
        this.mostrarAviso(`Categoría «${categoria.nombre}» creada.`);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudo crear la categoría."));
      },
    });
  }

  enfocarFormulario(): void {
    const input = document.getElementById("productoNombre");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
  }

  private resetFormulario(): void {
    this.nombreProducto = "";
    this.precio = null;
    this.categoriaSeleccionada = this.categorias()[0]?._id ?? "";
    this.seccionSeleccionada.set("");
    this.subseccionSeleccionada = "";
    this.editandoId = null;
  }

  private mostrarAviso(texto: string): void {
    this.aviso.set(texto);
    window.setTimeout(() => this.aviso.set(""), 3500);
  }
}
