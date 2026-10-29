import { Injectable, inject, signal } from "@angular/core";
import { NotificacionesService } from "../../shared/services/notificaciones.service";
import type { Producto } from "../models/producto.model";

export type ModalCatalogo =
  | { tipo: "producto"; producto: Producto | null }
  | { tipo: "categoria" }
  | { tipo: "secciones" }
  | { tipo: "lista" }
  | null;

@Injectable({
  providedIn: "root",
})
export class CatalogoModalesService {
  private readonly notificaciones = inject(NotificacionesService);
  private readonly modalSignal = signal<ModalCatalogo>(null);

  readonly modal = this.modalSignal.asReadonly();

  abrirProducto(producto: Producto | null = null): void {
    this.modalSignal.set({ tipo: "producto", producto });
  }

  abrirCategoria(): void {
    this.modalSignal.set({ tipo: "categoria" });
  }

  abrirSecciones(): void {
    this.modalSignal.set({ tipo: "secciones" });
  }

  abrirLista(): void {
    this.modalSignal.set({ tipo: "lista" });
  }

  cerrar(): void {
    this.modalSignal.set(null);
  }

  mostrarAviso(texto: string): void {
    this.notificaciones.exito(texto);
  }
}
