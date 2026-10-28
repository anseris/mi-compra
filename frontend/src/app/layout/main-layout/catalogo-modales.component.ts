import { Component, computed, effect, inject, OnInit, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { CategoriasService } from "../../core/services/categorias.service";
import { CatalogoModalesService } from "../../core/services/catalogo-modales.service";
import { ProductosService } from "../../core/services/productos.service";
import { SeccionesService } from "../../core/services/secciones.service";
import { ListaCompraService } from "../../core/services/lista-compra.service";
import { mensajeError } from "../../shared/utils/api-error";
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
    MessageModule,
    SelectModule,
  ],
  templateUrl: "./catalogo-modales.component.html",
})
export class CatalogoModalesComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly seccionesService = inject(SeccionesService);
  private readonly listaService = inject(ListaCompraService);
  private readonly modalesService = inject(CatalogoModalesService);

  readonly categorias = this.categoriasService.categorias;
  readonly secciones = this.seccionesService.secciones;
  readonly modal = this.modalesService.modal;
  readonly error = signal("");
  readonly guardandoProducto = signal(false);
  readonly seccionSeleccionada = signal("");
  readonly seccionParaSubseccion = signal("");

  nombreProducto = "";
  precio: number | null = null;
  categoriaSeleccionada = "";
  subseccionSeleccionada = "";
  editandoId: string | null = null;
  nombreNuevaCategoria = "";
  nombreNuevaSeccion = "";
  nombreNuevaSubseccion = "";

  readonly opcionesSubseccionFormulario = computed(
    () =>
      this.secciones().find(
        (seccion) => seccion._id === this.seccionSeleccionada(),
      )?.subsecciones ?? [],
  );

  constructor() {
    effect(() => {
      const modal = this.modal();
      if (modal?.tipo !== "producto") {
        return;
      }

      this.limpiarFormularioProducto();
      const producto = modal.producto;
      if (producto) {
        this.editandoId = producto._id;
        this.nombreProducto = producto.nombre;
        this.precio = producto.precio;
        this.categoriaSeleccionada = producto.categoria;
        this.seccionSeleccionada.set(producto.seccion ?? "");
        this.subseccionSeleccionada = producto.subseccion ?? "";
      }
      this.error.set("");
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
        this.error.set(mensajeError(error, "No se pudieron cargar las categorías.")),
    });
    this.seccionesService.cargar().subscribe({
      error: (error: unknown) =>
        this.error.set(mensajeError(error, "No se pudieron cargar las secciones.")),
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
    this.error.set("");
  }

  guardarProducto(): void {
    this.error.set("");
    if (this.guardandoProducto()) {
      return;
    }

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

    const datosBase = { nombre, precio, categoria: this.categoriaSeleccionada };
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
              this.error.set(
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
          this.error.set(
            mensajeError(error, "No se pudo guardar el producto."),
          ),
      });
  }

  crearCategoria(): void {
    const nombre = this.nombreNuevaCategoria.trim();
    if (!nombre) {
      this.error.set("Escribe el nombre de la categoría.");
      return;
    }
    if (this.categorias().some((categoria) => categoria.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) {
      this.error.set("Ya existe una categoría con ese nombre.");
      return;
    }

    this.error.set("");
    this.categoriasService.crear({ nombre, icono: "🛍️" }).subscribe({
      next: (categoria) => {
        this.nombreNuevaCategoria = "";
        this.cerrarModal();
        this.modalesService.mostrarAviso(`Categoría «${categoria.nombre}» creada.`);
      },
      error: (error: unknown) =>
        this.error.set(mensajeError(error, "No se pudo crear la categoría.")),
    });
  }

  crearSeccion(): void {
    const nombre = this.nombreNuevaSeccion.trim();
    if (!nombre) {
      this.error.set("Escribe el nombre de la sección.");
      return;
    }

    this.error.set("");
    this.seccionesService.crear(nombre).subscribe({
      next: (seccion) => {
        this.nombreNuevaSeccion = "";
        this.seccionParaSubseccion.set(seccion._id);
        this.modalesService.mostrarAviso(`Sección «${seccion.nombre}» creada.`);
      },
      error: (error: unknown) =>
        this.error.set(mensajeError(error, "No se pudo crear la sección.")),
    });
  }

  crearSubseccion(): void {
    const seccionId = this.seccionParaSubseccion();
    const nombre = this.nombreNuevaSubseccion.trim();
    if (!seccionId) {
      this.error.set("Selecciona la sección de la nueva subsección.");
      return;
    }
    if (!nombre) {
      this.error.set("Escribe el nombre de la subsección.");
      return;
    }

    this.error.set("");
    this.seccionesService.crearSubseccion(seccionId, nombre).subscribe({
      next: (seccion) => {
        this.nombreNuevaSubseccion = "";
        if (this.seccionSeleccionada() === seccion._id) {
          this.subseccionSeleccionada = nombre;
        }
        this.modalesService.mostrarAviso(`Subsección «${nombre}» añadida a «${seccion.nombre}».`);
      },
      error: (error: unknown) =>
        this.error.set(mensajeError(error, "No se pudo crear la subsección.")),
    });
  }

  private limpiarFormularioProducto(): void {
    this.nombreProducto = "";
    this.precio = null;
    this.categoriaSeleccionada = untracked(
      () => this.categorias()[0]?._id ?? "",
    );
    this.seccionSeleccionada.set("");
    this.subseccionSeleccionada = "";
    this.editandoId = null;
  }
}
