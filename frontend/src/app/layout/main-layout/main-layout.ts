import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ListaCompraService } from '../../core/services/lista-compra.service';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly listaService = inject(ListaCompraService);

  readonly totalProductos = computed(() => this.productosService.productos().length);
  readonly totalLista = computed(() => this.listaService.items().length);
  readonly pendientes = computed(
    () => this.listaService.items().filter((item) => !item.comprado).length,
  );

  ngOnInit(): void {
    // El layout necesita los contadores; las páginas reutilizan esta misma carga.
    this.productosService.cargar().subscribe({ error: () => undefined });
    this.listaService.cargar().subscribe({ error: () => undefined });
  }
}
