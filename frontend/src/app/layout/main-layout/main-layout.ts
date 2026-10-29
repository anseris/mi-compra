import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { CatalogoModalesService } from "../../core/services/catalogo-modales.service";
import { ListaCompraService } from "../../core/services/lista-compra.service";
import { ProductosService } from "../../core/services/productos.service";
import { mensajeError } from "../../shared/utils/api-error";
import { CatalogoModalesComponent } from "./catalogo-modales.component";

@Component({
  selector: "app-main-layout",
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CatalogoModalesComponent,
  ],
  templateUrl: "./main-layout.html",
  styleUrl: "./main-layout.css",
})
export class MainLayout implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly listaService = inject(ListaCompraService);
  private readonly modalesService = inject(CatalogoModalesService);

  readonly totalProductos = computed(
    () => this.productosService.productos().length,
  );
  readonly totalLista = computed(() => this.listaService.items().length);
  readonly pendientes = computed(
    () => this.listaService.items().filter((item) => !item.comprado).length,
  );
  readonly error = signal("");
  readonly modal = this.modalesService.modal;
  readonly aviso = this.modalesService.aviso;

  ngOnInit(): void {
    this.productosService.cargar().subscribe({
      error: (error: unknown) =>
        this.error.set(mensajeError(error, "No se pudo cargar el catálogo.")),
    });
    this.listaService.cargar().subscribe({
      error: (error: unknown) =>
        this.error.set(mensajeError(error, "No se pudo cargar la lista.")),
    });
  }

}
