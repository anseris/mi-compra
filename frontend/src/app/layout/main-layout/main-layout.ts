import { Component, computed, inject, OnInit } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { CatalogoModalesService } from "../../core/services/catalogo-modales.service";
import { ListaCompraService } from "../../core/services/lista-compra.service";
import { ProductosService } from "../../core/services/productos.service";
import { NotificacionesService } from "../../shared/services/notificaciones.service";
import { mensajeError } from "../../shared/utils/api-error";
import { CatalogoModalesComponent } from "./catalogo-modales.component";

@Component({
  selector: "app-main-layout",
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CatalogoModalesComponent,
    ConfirmDialogModule,
    ToastModule,
  ],
  templateUrl: "./main-layout.html",
  styleUrl: "./main-layout.css",
})
export class MainLayout implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly listaService = inject(ListaCompraService);
  private readonly modalesService = inject(CatalogoModalesService);
  private readonly notificaciones = inject(NotificacionesService);

  readonly totalProductos = computed(
    () => this.productosService.productos().length,
  );
  readonly totalLista = computed(() => this.listaService.items().length);
  readonly pendientes = computed(
    () => this.listaService.items().filter((item) => !item.comprado).length,
  );
  readonly modal = this.modalesService.modal;

  ngOnInit(): void {
    this.productosService.cargar().subscribe({
      error: (error: unknown) =>
        this.notificaciones.error(mensajeError(error, "No se pudo cargar el catálogo.")),
    });
    this.listaService.cargar().subscribe({
      error: (error: unknown) =>
        this.notificaciones.error(mensajeError(error, "No se pudo cargar la lista.")),
    });
  }

}
