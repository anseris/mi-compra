import { CurrencyPipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { DividerModule } from "primeng/divider";
import type { ItemLista } from "../../core/models/item-lista.model";
import type { Producto } from "../../core/models/producto.model";
import { ListaCompraService } from "../../core/services/lista-compra.service";
import { ProductosService } from "../../core/services/productos.service";
import { NotificacionesService } from "../../shared/services/notificaciones.service";
import { mensajeError } from "../../shared/utils/api-error";
import { forkJoin } from "rxjs";

@Component({
  selector: "app-de-ruta",
  imports: [
    CurrencyPipe,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DividerModule,
  ],
  templateUrl: "./de-ruta.html",
  styleUrl: "./de-ruta.css",
})
export class DeRuta implements OnInit {
  private readonly listaService = inject(ListaCompraService);
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly nivelRuta = signal(1);
  readonly cargando = signal(true);
  readonly terminando = signal(false);
  readonly items = this.listaService.items;
  readonly productos = this.productosService.productos;

  private readonly productosPorId = computed(
    () => new Map(this.productos().map((producto) => [producto._id, producto])),
  );

  readonly nivelesDisponibles = computed(() => {
    const productosPorId = this.productosPorId();
    return [
      ...new Set(
        this.items()
          .map((item) =>
            item.productoId
              ? productosPorId.get(item.productoId)?.r
              : undefined,
          )
          .filter(
            (r): r is number =>
              typeof r === "number" &&
              Number.isInteger(r) &&
              r >= 1 &&
              r <= 19,
          ),
      ),
    ].sort((a, b) => a - b);
  });

  readonly itemsRuta = computed(() => {
    const productosPorId = this.productosPorId();
    return this.items().filter((item) => {
      if (!item.productoId) {
        return false;
      }

      return productosPorId.get(item.productoId)?.r === this.nivelRuta();
    });
  });

  readonly todosMarcados = computed(() =>
    this.itemsRuta().every((item) => item.comprado),
  );
  readonly marcadosEnParada = computed(
    () => this.itemsRuta().filter((item) => item.comprado).length,
  );

  readonly esUltimaParada = computed(() => this.nivelRuta() === 19);

  ngOnInit(): void {
    forkJoin({
      items: this.listaService.cargar(),
      productos: this.productosService.cargar(),
    }).subscribe({
      next: () => {
        const primeraParada = this.nivelesDisponibles()[0];
        this.nivelRuta.set(primeraParada ?? 19);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.notificaciones.error(
          mensajeError(error, "No se pudo cargar el recorrido de compra."),
        );
        this.cargando.set(false);
      },
    });
  }

  alternar(item: ItemLista, comprado: boolean): void {
    this.listaService.actualizar(item._id, { comprado }).subscribe({
      error: (error: unknown) =>
        this.notificaciones.error(
          mensajeError(error, "No se pudo actualizar el artículo."),
        ),
    });
  }

  cambiarCantidad(item: ItemLista, delta: number): void {
    const cantidad = item.cantidad + delta;
    if (cantidad <= 0) {
      this.eliminar(item);
      return;
    }

    this.listaService.actualizar(item._id, { cantidad }).subscribe({
      error: (error: unknown) =>
        this.notificaciones.error(
          mensajeError(error, "No se pudo cambiar la cantidad."),
        ),
    });
  }

  eliminar(item: ItemLista): void {
    this.listaService.eliminar(item._id).subscribe({
      error: (error: unknown) =>
        this.notificaciones.error(
          mensajeError(error, "No se pudo quitar el artículo de la lista."),
        ),
    });
  }

  avanzar(): void {
    if (!this.todosMarcados() || this.terminando()) {
      return;
    }

    if (this.esUltimaParada()) {
      this.terminar();
      return;
    }

    const siguienteNivel = this.nivelesDisponibles().find(
      (nivel) => nivel > this.nivelRuta(),
    );
    this.nivelRuta.set(siguienteNivel ?? 19);
  }

  private terminar(): void {
    this.terminando.set(true);
    this.listaService.vaciarLista().subscribe({
      next: () => {
        this.notificaciones.exito("Recorrido terminado. La lista se ha vaciado.");
        void this.router.navigateByUrl("/productos");
      },
      error: (error: unknown) => {
        this.notificaciones.error(
          mensajeError(error, "No se pudo terminar el recorrido."),
        );
        this.terminando.set(false);
      },
    });
  }
}
