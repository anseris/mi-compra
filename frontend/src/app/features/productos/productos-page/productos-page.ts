import { SelectModule } from "primeng/select";
import { CurrencyPipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { ConfirmationService } from "primeng/api";
import type { Categoria } from "../../../core/models/categoria.model";
import type { Producto } from "../../../core/models/producto.model";
import { CategoriasService } from "../../../core/services/categorias.service";
import { ListaCompraService } from "../../../core/services/lista-compra.service";
import { ProductosService } from "../../../core/services/productos.service";
import { SeccionesService } from "../../../core/services/secciones.service";
import { CatalogoModalesService } from "../../../core/services/catalogo-modales.service";
import { NotificacionesService } from "../../../shared/services/notificaciones.service";
import { mensajeError } from "../../../shared/utils/api-error";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { DividerModule } from "primeng/divider";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { EMPTY, finalize, switchMap } from "rxjs";

function claveNombreProducto(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

@Component({
  selector: "app-productos-page",
  imports: [
    FormsModule,
    CurrencyPipe,
    ButtonModule,
    CardModule,
    SelectModule,
    InputTextModule,
    DividerModule,
    ToggleSwitchModule,
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
  private readonly notificaciones = inject(NotificacionesService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly productos = this.productosService.productos;
  readonly categorias = this.categoriasService.categorias;
  readonly secciones = this.seccionesService.secciones;
  readonly listas = this.listaService.listas;
  readonly listaSeleccionada = this.listaService.listaSeleccionada;
  readonly listaSeleccionadaId = this.listaService.listaSeleccionadaId;
  readonly opcionesLista = computed(() =>
    this.listas().map((lista) => ({
      nombre: lista.nombre,
      valor: lista._id,
    })),
  );
  readonly vista = signal<"cards" | "listado">("cards");
  readonly productosEnLista = computed(
    () =>
      new Set(
        this.listaService
          .items()
          .map((item) => claveNombreProducto(item.nombre))
          .filter(Boolean),
      ),
  );
  readonly productosAnadiendo = signal(new Set<string>());
  readonly cargando = computed(
    () =>
      this.productosService.cargando() ||
      this.categoriasService.cargando() ||
      this.seccionesService.cargando() ||
      this.listaService.cargando(),
  );

  readonly busqueda = signal("");
  readonly filtroCategoria = signal("todas");
  readonly filtroSeccion = signal("todas");
  readonly filtroSubseccion = signal("todas");
  readonly soloFavoritos = signal(false);

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
    const soloFavoritos = this.soloFavoritos();
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
      const coincideFavorito = !soloFavoritos || producto.favorito;

      return (
        coincideTexto &&
        coincideCategoria &&
        coincideSeccion &&
        coincideSubseccion &&
        coincideFavorito
      );
    });
  });

  readonly hayFiltrosActivos = computed(
    () =>
      Boolean(this.busqueda().trim()) ||
      this.filtroCategoria() !== "todas" ||
      this.filtroSeccion() !== "todas" ||
      this.filtroSubseccion() !== "todas" ||
      this.soloFavoritos(),
  );

  ngOnInit(): void {
    this.categoriasService.cargar().subscribe({
      error: (error: unknown) => {
        this.notificaciones.error(
          mensajeError(error, "No se pudieron cargar las categorías."),
        );
      },
    });

    this.productosService.cargar().subscribe({
      error: (error: unknown) => {
        this.notificaciones.error(mensajeError(error, "No se pudo cargar el catálogo."));
      },
    });

    this.seccionesService.cargar().subscribe({
      error: (error: unknown) => {
        this.notificaciones.error(
          mensajeError(error, "No se pudieron cargar las secciones."),
        );
      },
    });

    this.listaService.cargar().subscribe({
      error: (error: unknown) => {
        this.notificaciones.error(
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
      ? (this.seccionesPorId().get(producto.seccion)?.nombre ?? "Sin sección")
      : "Sin sección";
  }

  iconoCategoria(producto: Producto): string {
    return this.categoriaDe(producto)?.icono ?? "🛍️";
  }

  productoEnLista(producto: Producto): boolean {
    return this.productosEnLista().has(claveNombreProducto(producto.nombre));
  }

  editarProducto(producto: Producto): void {
    this.modalesService.abrirProducto(producto);
  }

  cambiarLista(id: string): void {
    this.busqueda.set("");
    this.listaService.seleccionarLista(id).subscribe({
      error: (error: unknown) =>
        this.notificaciones.error(
          mensajeError(error, "No se pudo cargar la lista seleccionada."),
        ),
    });
  }

  eliminarLista(): void {
    const lista = this.listaSeleccionada();
    if (!lista || lista.predeterminada) {
      return;
    }

    this.confirmationService.confirm({
      header: "Eliminar lista",
      message: `¿Eliminar la lista «${lista.nombre}» y todos sus artículos? Esta acción no se puede deshacer.`,
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        this.listaService.eliminarLista(lista._id).subscribe({
          next: () =>
            this.notificaciones.exito(`Lista «${lista.nombre}» eliminada.`),
          error: (error: unknown) =>
            this.notificaciones.error(
              mensajeError(error, "No se pudo eliminar la lista."),
            ),
        });
      },
    });
  }

  eliminarProducto(producto: Producto): void {
    this.confirmationService.confirm({
      header: "Eliminar producto",
      message: `¿Eliminar «${producto.nombre}» del catálogo? Los artículos que ya estén en la lista se conservarán.`,
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        this.productosService.eliminar(producto._id).subscribe({
          next: () => {
            this.notificaciones.exito(`«${producto.nombre}» eliminado del catálogo.`);
          },
          error: (error: unknown) => {
            this.notificaciones.error(
              mensajeError(error, "No se pudo eliminar el producto."),
            );
          },
        });
      },
    });
  }

  anadirALista(producto: Producto): void {
    const claveNombre = claveNombreProducto(producto.nombre);

    if (this.productosAnadiendo().has(claveNombre)) {
      this.notificaciones.info(`«${producto.nombre}» se está añadiendo a la lista.`);
      return;
    }

    this.productosAnadiendo.update((productos) =>
      new Set(productos).add(claveNombre),
    );
    this.listaService
      .cargar()
      .pipe(
        switchMap((items) => {
          const nombreYaExiste = items.some(
            (item) => claveNombreProducto(item.nombre) === claveNombre,
          );
          if (nombreYaExiste) {
            this.notificaciones.info(
              `«${producto.nombre}» ya está en la lista y no se ha añadido otra vez.`,
            );
            return EMPTY;
          }

          return this.listaService.crear({ productoId: producto._id });
        }),
      )
      .pipe(
        finalize(() =>
          this.productosAnadiendo.update((productos) => {
            const siguientes = new Set(productos);
            siguientes.delete(claveNombre);
            return siguientes;
          }),
        ),
      )
      .subscribe({
        next: () =>
          this.notificaciones.exito(
            `«${producto.nombre}» añadido a «${this.listaService.listaSeleccionada()?.nombre ?? "la lista"}».`,
          ),
        error: (error: unknown) =>
          this.notificaciones.error(
            mensajeError(error, "No se pudo añadir el producto a la lista."),
          ),
      });
  }

  quitarDeLista(producto: Producto): void {
    const item = this.listaService
      .items()
      .find(
        (actual) =>
          claveNombreProducto(actual.nombre) ===
          claveNombreProducto(producto.nombre),
      );
    if (!item) {
      return;
    }

    this.listaService.eliminar(item._id).subscribe({
      next: () =>
        this.notificaciones.exito(`«${producto.nombre}» quitado de la lista.`),
      error: (error: unknown) =>
        this.notificaciones.error(
          mensajeError(error, "No se pudo quitar el producto de la lista."),
        ),
    });
  }

  abrirNuevoProducto(): void {
    this.modalesService.abrirProducto();
  }

  abrirCrearCategoria(): void {
    this.modalesService.abrirCategoria();
  }

  abrirGestionSecciones(): void {
    this.modalesService.abrirSecciones();
  }

  abrirCrearLista(): void {
    this.modalesService.abrirLista();
  }

}
