import { Component, computed, effect, inject, OnInit, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { CategoriasService } from "../../core/services/categorias.service";
import { CatalogoModalesService } from "../../core/services/catalogo-modales.service";
import { ProductosService } from "../../core/services/productos.service";
import { SeccionesService } from "../../core/services/secciones.service";
import { ListaCompraService } from "../../core/services/lista-compra.service";
import { mensajeError } from "../../shared/utils/api-error";
import { NotificacionesService } from "../../shared/services/notificaciones.service";
import { EMPTY, finalize, forkJoin, switchMap } from "rxjs";
import type { Producto } from "../../core/models/producto.model";

function normalizarNombreProducto(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

@Component({
  selector: "app-catalogo-modales",
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: "./catalogo-modales.component.html",
})
export class CatalogoModalesComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly seccionesService = inject(SeccionesService);
  private readonly listaService = inject(ListaCompraService);
  private readonly modalesService = inject(CatalogoModalesService);
  private readonly notificaciones = inject(NotificacionesService);

  readonly categorias = this.categoriasService.categorias;
  readonly secciones = this.seccionesService.secciones;
  readonly listas = this.listaService.listas;
  readonly modal = this.modalesService.modal;
  readonly guardandoProducto = signal(false);
  readonly guardandoLista = signal(false);
  readonly seccionSeleccionada = signal("");
  readonly seccionParaSubseccion = signal("");

  nombreProducto = "";
  rProducto = "";
  favoritoProducto = false;
  precio: number | null = null;
  categoriaSeleccionada = "";
  subseccionSeleccionada = "";
  editandoId: string | null = null;
  nombreNuevaCategoria = "";
  nombreNuevaSeccion = "";
  nombreNuevaSubseccion = "";
  nombreNuevaLista = "";

  readonly opcionesSubseccionFormulario = computed(
    () =>
      this.secciones().find(
        (seccion) => seccion._id === this.seccionSeleccionada(),
      )?.subsecciones ?? [],
  );

  constructor() {
    effect(() => {
      const modal = this.modal();
      if (modal?.tipo === "lista") {
        this.nombreNuevaLista = "";
        return;
      }

      if (modal?.tipo !== "producto") {
        return;
      }

      this.limpiarFormularioProducto();
      const producto = modal.producto;
      if (producto) {
        this.editandoId = producto._id;
        this.nombreProducto = producto.nombre;
        this.rProducto = producto.r == null ? "" : String(producto.r);
        this.favoritoProducto = producto.favorito ?? false;
        this.precio = producto.precio;
        this.categoriaSeleccionada = producto.categoria;
        this.seccionSeleccionada.set(producto.seccion ?? "");
        this.subseccionSeleccionada = producto.subseccion ?? "";
      }
    });
  }

  ngOnInit(): void {
    this.categoriasService.cargar().subscribe({
      next: (categorias) => {
        const modal = this.modal();
        if (
          modal?.tipo === "producto" &&
          !modal.producto &&
          !this.categoriaSeleccionada
        ) {
          this.categoriaSeleccionada = categorias[0]?._id ?? "";
        }
      },
      error: (error: unknown) =>
        this.notificaciones.error(mensajeError(error, "No se pudieron cargar las categorías.")),
    });
    this.seccionesService.cargar().subscribe({
      error: (error: unknown) =>
        this.notificaciones.error(mensajeError(error, "No se pudieron cargar las secciones.")),
    });
  }

  cambiarSeccion(seccionId: string): void {
    this.seccionSeleccionada.set(seccionId);
    if (!this.opcionesSubseccionFormulario().includes(this.subseccionSeleccionada)) {
      this.subseccionSeleccionada = "";
    }
  }

  cerrarModal(): void {
    if (this.modal()?.tipo === "producto") {
      this.limpiarFormularioProducto();
    }
    this.modalesService.cerrar();
  }

  guardarProducto(): void {
    if (this.guardandoProducto()) {
      return;
    }

    const nombre = this.nombreProducto.trim();
    const precio = Number(this.precio);

    if (!nombre) {
      this.notificaciones.error("Escribe el nombre del producto.");
      return;
    }
    if (this.precio === null || !Number.isFinite(precio) || precio < 0) {
      this.notificaciones.error("Indica un precio válido (0 o más).");
      return;
    }
    const r = this.rProducto.trim() ? Number(this.rProducto) : null;
    if (r !== null && (!Number.isInteger(r) || r < 1 || r > 19)) {
      this.notificaciones.error("La ruta debe ser un número entero entre 1 y 19.");
      return;
    }
    if (!this.categoriaSeleccionada) {
      this.notificaciones.error("Crea o selecciona una categoría.");
      return;
    }
    if (!this.editandoId && !this.seccionSeleccionada()) {
      this.notificaciones.error("Selecciona una sección.");
      return;
    }

    const datosBase = {
      nombre,
      precio,
      categoria: this.categoriaSeleccionada,
      r,
      favorito: this.favoritoProducto,
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
      : forkJoin({
          items: this.listaService.cargar(true),
          productos: this.productosService.cargar(true),
        }).pipe(
          switchMap(({ items, productos }) => {
            const nombreNormalizado = normalizarNombreProducto(nombre);
            const duplicadoEnLista = items.some(
              (item) =>
                normalizarNombreProducto(item.nombre) === nombreNormalizado,
            );
            const duplicadoEnCatalogo = productos.some(
              (producto) =>
                normalizarNombreProducto(producto.nombre) ===
                nombreNormalizado,
            );
            if (duplicadoEnLista || duplicadoEnCatalogo) {
              this.notificaciones.error(
                duplicadoEnLista
                  ? `«${nombre}» ya está en la lista. No se ha guardado el producto.`
                  : `Ya existe un producto llamado «${nombre}» en el catálogo.`,
              );
              return EMPTY;
            }

            return this.productosService.crear({
              ...datosBase,
              seccion,
              subseccion: this.subseccionSeleccionada,
            });
          }),
        );

    this.guardandoProducto.set(true);
    peticion
      .pipe(finalize(() => this.guardandoProducto.set(false)))
      .subscribe({
        next: (producto: Producto) => {
          const aviso = this.editandoId
            ? `«${producto.nombre}» actualizado.`
            : `«${producto.nombre}» añadido al catálogo.`;
          this.cerrarModal();
          this.modalesService.mostrarAviso(aviso);
        },
        error: (error: unknown) =>
          this.notificaciones.error(
            mensajeError(error, "No se pudo guardar el producto."),
          ),
      });
  }

  crearCategoria(): void {
    const nombre = this.nombreNuevaCategoria.trim();
    if (!nombre) {
      this.notificaciones.error("Escribe el nombre de la categoría.");
      return;
    }
    if (this.categorias().some((categoria) => categoria.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) {
      this.notificaciones.error("Ya existe una categoría con ese nombre.");
      return;
    }

    this.categoriasService.crear({ nombre, icono: "🛍️" }).subscribe({
      next: (categoria) => {
        this.nombreNuevaCategoria = "";
        this.cerrarModal();
        this.modalesService.mostrarAviso(`Categoría «${categoria.nombre}» creada.`);
      },
      error: (error: unknown) =>
        this.notificaciones.error(mensajeError(error, "No se pudo crear la categoría.")),
    });
  }

  crearSeccion(): void {
    const nombre = this.nombreNuevaSeccion.trim();
    if (!nombre) {
      this.notificaciones.error("Escribe el nombre de la sección.");
      return;
    }

    this.seccionesService.crear(nombre).subscribe({
      next: (seccion) => {
        this.nombreNuevaSeccion = "";
        this.seccionParaSubseccion.set(seccion._id);
        this.modalesService.mostrarAviso(`Sección «${seccion.nombre}» creada.`);
      },
      error: (error: unknown) =>
        this.notificaciones.error(mensajeError(error, "No se pudo crear la sección.")),
    });
  }

  crearSubseccion(): void {
    const seccionId = this.seccionParaSubseccion();
    const nombre = this.nombreNuevaSubseccion.trim();
    if (!seccionId) {
      this.notificaciones.error("Selecciona la sección de la nueva subsección.");
      return;
    }
    if (!nombre) {
      this.notificaciones.error("Escribe el nombre de la subsección.");
      return;
    }

    this.seccionesService.crearSubseccion(seccionId, nombre).subscribe({
      next: (seccion) => {
        this.nombreNuevaSubseccion = "";
        if (this.seccionSeleccionada() === seccion._id) {
          this.subseccionSeleccionada = nombre;
        }
        this.modalesService.mostrarAviso(`Subsección «${nombre}» añadida a «${seccion.nombre}».`);
      },
      error: (error: unknown) =>
        this.notificaciones.error(mensajeError(error, "No se pudo crear la subsección.")),
    });
  }

  crearLista(): void {
    const nombre = this.nombreNuevaLista.trim();
    if (!nombre) {
      this.notificaciones.error("Escribe un nombre para la lista.");
      return;
    }
    if (this.guardandoLista()) {
      return;
    }

    this.guardandoLista.set(true);
    this.listaService
      .cargar()
      .pipe(
        switchMap(() => {
          const nombreNormalizado = nombre
            .replace(/\s+/g, " ")
            .toLocaleLowerCase("es");
          const duplicada = this.listas().some(
            (lista) =>
              lista.nombre.trim().replace(/\s+/g, " ").toLocaleLowerCase("es") ===
              nombreNormalizado,
          );
          if (duplicada) {
            this.notificaciones.error("Ya existe una lista con ese nombre.");
            return EMPTY;
          }
          return this.listaService.crearLista(nombre);
        }),
        finalize(() => this.guardandoLista.set(false)),
      )
      .subscribe({
        next: (lista) => {
          this.nombreNuevaLista = "";
          this.cerrarModal();
          this.modalesService.mostrarAviso(
            `Lista «${lista.nombre}» creada y activada.`,
          );
        },
        error: (error: unknown) =>
          this.notificaciones.error(mensajeError(error, "No se pudo crear la lista.")),
      });
  }

  private limpiarFormularioProducto(): void {
    this.nombreProducto = "";
    this.rProducto = "";
    this.favoritoProducto = false;
    this.precio = null;
    this.categoriaSeleccionada = untracked(
      () => this.categorias()[0]?._id ?? "",
    );
    this.seccionSeleccionada.set("");
    this.subseccionSeleccionada = "";
    this.editandoId = null;
  }
}
