import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ItemLista } from '../../../core/models/item-lista.model';
import { ListaCompraService } from '../../../core/services/lista-compra.service';
import { mensajeError } from '../../../shared/utils/api-error';

@Component({
  selector: 'app-lista-compra-page',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './lista-compra-page.html',
  styleUrl: './lista-compra-page.css',
})
export class ListaCompraPage implements OnInit {
  private readonly listaService = inject(ListaCompraService);

  readonly items = this.listaService.items;
  readonly cargando = this.listaService.cargando;
  readonly busqueda = signal('');
  readonly error = signal('');

  readonly itemsFiltrados = computed(() => {
    const consulta = this.busqueda().trim().toLocaleLowerCase('es');

    return this.items().filter(
      (item) =>
        !consulta ||
        item.nombre.toLocaleLowerCase('es').includes(consulta) ||
        item.categoriaNombre.toLocaleLowerCase('es').includes(consulta),
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

  readonly hayComprados = computed(() => this.items().some((item) => item.comprado));

  ngOnInit(): void {
    this.listaService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo cargar la lista de la compra.'));
      },
    });
  }

  alternar(item: ItemLista): void {
    this.error.set('');

    this.listaService.actualizar(item._id, { comprado: !item.comprado }).subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo actualizar el artículo.'));
      },
    });
  }

  cambiarCantidad(item: ItemLista, delta: number): void {
    const cantidad = item.cantidad + delta;

    if (cantidad <= 0) {
      this.eliminar(item);
      return;
    }

    this.error.set('');

    this.listaService.actualizar(item._id, { cantidad }).subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo cambiar la cantidad.'));
      },
    });
  }

  eliminar(item: ItemLista): void {
    this.error.set('');

    this.listaService.eliminar(item._id).subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo quitar el artículo de la lista.'));
      },
    });
  }

  vaciarComprados(): void {
    if (
      !window.confirm(
        '¿Quitar de la lista todos los artículos marcados como comprados?',
      )
    ) {
      return;
    }

    this.error.set('');

    this.listaService.vaciarComprados().subscribe({
      error: (error: unknown) => {
        this.error.set(
          mensajeError(error, 'No se pudieron quitar los artículos comprados.'),
        );
      },
    });
  }
}
