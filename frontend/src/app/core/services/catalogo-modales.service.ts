import { Injectable, signal } from "@angular/core";
import type { Producto } from "../models/producto.model";

export type ModalCatalogo =
  | { tipo: "producto"; producto: Producto | null }
  | { tipo: "categoria" }
  | { tipo: "secciones" }
  | null;

@Injectable({
  providedIn: "root",
})
export class CatalogoModalesService {
  private readonly modalSignal = signal<ModalCatalogo>(null);

  readonly modal = this.modalSignal.asReadonly();
  readonly aviso = signal("");

  abrirProducto(producto: Producto | null = null): void {
    this.limpiarAviso();
    this.modalSignal.set({ tipo: "producto", producto });
  }

  abrirCategoria(): void {
    this.limpiarAviso();
    this.modalSignal.set({ tipo: "categoria" });
  }

  abrirSecciones(): void {
    this.limpiarAviso();
    this.modalSignal.set({ tipo: "secciones" });
  }

  cerrar(): void {
    this.modalSignal.set(null);
  }

  mostrarAviso(texto: string): void {
    this.aviso.set(texto);
    window.setTimeout(() => this.aviso.set(""), 3500);
  }

  limpiarAviso(): void {
    this.aviso.set("");
  }
}
