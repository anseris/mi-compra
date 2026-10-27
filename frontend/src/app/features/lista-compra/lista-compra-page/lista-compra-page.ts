import { CheckboxModule } from "primeng/checkbox";
import { CurrencyPipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import type { ItemLista } from "../../../core/models/item-lista.model";
import { ListaCompraService } from "../../../core/services/lista-compra.service";
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

  readonly items = this.listaService.items;
  readonly listas = this.listaService.listas;
  readonly listaSeleccionada = this.listaService.listaSeleccionada;
  readonly listaSeleccionadaId = this.listaService.listaSeleccionadaId;
  readonly cargando = this.listaService.cargando;
  readonly busqueda = signal("");
  readonly error = signal("");
  readonly aviso = signal("");
  nombreNuevaLista = "";

  readonly itemsFiltrados = computed(() => {
    const consulta = this.busqueda().trim().toLocaleLowerCase("es");

    return this.items().filter(
      (item) =>
        !consulta ||
        item.nombre.toLocaleLowerCase("es").includes(consulta) ||
        item.categoriaNombre.toLocaleLowerCase("es").includes(consulta),
    );
  });

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
    this.listaService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, "No se pudo cargar la lista de la compra."),
        );
      },
    });
  }

  cambiarLista(id: string): void {
    this.error.set("");
    this.busqueda.set("");

    this.listaService.seleccionarLista(id).subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudo cargar la lista seleccionada."));
      },
    });
  }

  crearLista(): void {
    this.error.set("");
    const nombre = this.nombreNuevaLista.trim();

    if (!nombre) {
      this.error.set("Escribe un nombre para la lista.");
      return;
    }

    if (
      this.listas().some(
        (lista) => lista.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"),
      )
    ) {
      this.error.set("Ya existe una lista con ese nombre.");
      return;
    }

    this.listaService.crearLista(nombre).subscribe({
      next: (lista) => {
        this.nombreNuevaLista = "";
        this.busqueda.set("");
        this.aviso.set(`Lista «${lista.nombre}» creada.`);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, "No se pudo crear la lista."));
      },
    });
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
