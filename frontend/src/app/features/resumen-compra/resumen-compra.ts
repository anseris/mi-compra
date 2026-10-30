import { CurrencyPipe } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { ListaCompraService } from "../../core/services/lista-compra.service";

@Component({
  selector: "app-resumen-compra",
  imports: [CurrencyPipe, RouterLink, ButtonModule, CardModule, DividerModule],
  templateUrl: "./resumen-compra.html",
  styleUrl: "./resumen-compra.css",
})
export class ResumenCompra {
  private readonly listaService = inject(ListaCompraService);

  readonly items = this.listaService.items;
  readonly total = computed(() =>
    this.items().reduce((suma, item) => suma + item.precio * item.cantidad, 0),
  );
  readonly totalComprado = computed(() =>
    this.items()
      .filter((item) => item.comprado)
      .reduce((suma, item) => suma + item.precio * item.cantidad, 0),
  );
  readonly totalUnidades = computed(() =>
    this.items().reduce((suma, item) => suma + item.cantidad, 0),
  );
}
