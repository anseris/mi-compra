import { CheckboxModule } from "primeng/checkbox";
import { CurrencyPipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import type { Categoria } from "../../../core/models/categoria.model";
import type { ItemLista } from "../../../core/models/item-lista.model";
import type { Seccion } from "../../../core/models/seccion.model";
import { CategoriasService } from "../../../core/services/categorias.service";
import { ListaCompraService } from "../../../core/services/lista-compra.service";
import { SeccionesService } from "../../../core/services/secciones.service";
import { mensajeError } from "../../../shared/utils/api-error";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { MessageModule } from "primeng/message";
import { DividerModule } from "primeng/divider";

@Component({
  selector: "app-lista-compra-page",
  imports: [
    FormsModule,
    CurrencyPipe,
    RouterLink,
    ButtonModule,
    SelectModule,
    CardModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MessageModule,
    DividerModule,
    CheckboxModule,
  ],
  templateUrl: "./lista-compra-page.html",
  styleUrl: "./lista-compra-page.css",
})
export class ListaCompraPage implements OnInit {
  private readonly listaService = inject(ListaCompraService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly seccionesService = inject(SeccionesService);

  readonly items = this.listaService.items;
  readonly categorias = this.categoriasService.categorias;
  readonly secciones = this.seccionesService.secciones;
  readonly listaSeleccionada = this.listaService.listaSeleccionada;
  readonly cargando = this.listaService.cargando;
  readonly busqueda = signal("");
  readonly error = signal("");
  readonly aviso = signal("");
  readonly filtroCategoria = signal("todas");
  readonly filtroSeccion = signal("todas");
  readonly filtroSubseccion = signal("todas");

  readonly opcionesFiltroCategoria = computed(() => [
    { nombre: "Todas las categorías", valor: "todas" },
    ...this.categorias().map((categoria: Categoria) => ({
      nombre: categoria.nombre,
      valor: categoria._id,
    })),
    { nombre: "Sin categoría", valor: "sin-categoria" },
  ]);

  readonly opcionesFiltroSeccion = computed(() => [
    { nombre: "Todas las secciones", valor: "todas" },
    ...this.secciones().map((seccion: Seccion) => ({
      nombre: seccion.nombre,
      valor: seccion._id,
    })),
    { nombre: "Sin sección", valor: "sin-seccion" },
  ]);

  readonly opcionesFiltroSubseccion = computed(() => {
    const idSeccion = this.filtroSeccion();

    if (idSeccion === "todas" || idSeccion === "sin-seccion") {
      return [{ nombre: "Todas las subsecciones", valor: "todas" }];
    }

    const seccion = this.secciones().find((item) => item._id === idSeccion);
    return [
      { nombre: "Todas las subsecciones", valor: "todas" },
      { nombre: "Sin subsección", valor: "sin-subseccion" },
      ...(seccion?.subsecciones ?? []).map((subseccion) => ({
        nombre: subseccion,
        valor: subseccion,
      })),
    ];
  });

  readonly itemsFiltrados = computed(() => {
    const consulta = this.busqueda().trim().toLocaleLowerCase("es");
    const filtroCategoria = this.filtroCategoria();
    const filtroSeccion = this.filtroSeccion();
    const filtroSubseccion = this.filtroSubseccion();

    return this.items().filter(
      (item) =>
        (filtroCategoria === "todas" ||
          (filtroCategoria === "sin-categoria"
            ? !item.categoriaId
            : item.categoriaId === filtroCategoria)) &&
        (filtroSeccion === "todas" ||
          (filtroSeccion === "sin-seccion"
            ? !item.seccionId
            : item.seccionId === filtroSeccion)) &&
        (filtroSubseccion === "todas" ||
          (filtroSubseccion === "sin-subseccion"
            ? !item.subseccion
            : item.subseccion === filtroSubseccion)) &&
        (!consulta ||
          item.nombre.toLocaleLowerCase("es").includes(consulta) ||
          item.categoriaNombre.toLocaleLowerCase("es").includes(consulta) ||
          (item.seccionNombre ?? "").toLocaleLowerCase("es").includes(consulta) ||
          (item.subseccion ?? "").toLocaleLowerCase("es").includes(consulta)),
    );
  });

  readonly hayFiltrosActivos = computed(
    () =>
      Boolean(this.busqueda().trim()) ||
      this.filtroCategoria() !== "todas" ||
      this.filtroSeccion() !== "todas" ||
      this.filtroSubseccion() !== "todas",
  );

  readonly total = computed(() =>
    this.items().reduce((suma, item) => suma + item.precio * item.cantidad, 0),
  );

  readonly totalComprado = computed(() =>
    this.items()
      .filter((item) => item.comprado)
      .reduce((suma, item) => suma + item.precio * item.cantidad, 0),
  );

  readonly pendientes = computed(
    () => this.items().filter((item) => !item.comprado).length,
  );

  readonly totalUnidades = computed(() =>
    this.items().reduce((suma, item) => suma + item.cantidad, 0),
  );

  readonly hayComprados = computed(() =>
    this.items().some((item) => item.comprado),
  );

  ngOnInit(): void {
    this.categoriasService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudieron cargar las categorías."));
      },
    });

    this.seccionesService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudieron cargar las secciones."));
      },
    });

    this.listaService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudo cargar la lista de la compra."),
        );
      },
    });
  }

  cambiarFiltroSeccion(id: string): void {
    this.filtroSeccion.set(id);
    this.filtroSubseccion.set("todas");
  }

  alternar(item: ItemLista): void {
    this.error.set("");

    this.listaService
      .actualizar(item._id, { comprado: !item.comprado })
      .subscribe({
        error: (error: unknown) => {
          this.error.set(
            mensajeError(error, "No se pudo actualizar el artículo."),
          );
        },
      });
  }

  cambiarCantidad(item: ItemLista, delta: number): void {
    const cantidad = item.cantidad + delta;

    if (cantidad <= 0) {
      this.eliminar(item);
      return;
    }

    this.error.set("");

    this.listaService.actualizar(item._id, { cantidad }).subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudo cambiar la cantidad."));
      },
    });
  }

  eliminar(item: ItemLista): void {
    this.error.set("");

    this.listaService.eliminar(item._id).subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudo quitar el artículo de la lista."),
        );
      },
    });
  }

  vaciarComprados(): void {
    if (
      !window.confirm(
        "¿Quitar de la lista todos los artículos marcados como comprados?",
      )
    ) {
      return;
    }

    this.error.set("");

    this.listaService.vaciarComprados().subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudieron quitar los artículos comprados."),
        );
      },
    });
  }
}
