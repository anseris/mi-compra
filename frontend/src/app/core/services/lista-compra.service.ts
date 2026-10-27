import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { API_BASE } from '../api-base';
import type {
  ActualizarItemLista,
  CrearItemLista,
  ItemLista,
} from '../models/item-lista.model';
import type { ApiMensaje } from '../models/api.model';

/**
 * Estado y llamadas al backend de la lista de la compra (`/api/lista`).
 * Guarda los artículos en un signal para compartirlos con el layout.
 */
@Injectable({
  providedIn: 'root',
})
export class ListaCompraService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE}/lista`;

  private readonly itemsSignal = signal<ItemLista[]>([]);
  private readonly cargandoSignal = signal(false);
  private cargado = false;
  private peticion$: Observable<ItemLista[]> | null = null;

  readonly items = this.itemsSignal.asReadonly();
  readonly cargando = this.cargandoSignal.asReadonly();

  /** GET /api/lista — carga (una sola vez) la lista de la compra. */
  cargar(forzar = false): Observable<ItemLista[]> {
    if (this.cargado && !forzar) {
      return of(this.itemsSignal());
    }

    if (this.peticion$) {
      return this.peticion$;
    }

    this.cargandoSignal.set(true);

    this.peticion$ = this.http.get<ItemLista[]>(this.apiUrl).pipe(
      tap((items) => {
        this.itemsSignal.set(items);
        this.cargado = true;
      }),
      finalize(() => {
        this.cargandoSignal.set(false);
        this.peticion$ = null;
      }),
      shareReplay(1),
    );

    return this.peticion$;
  }

  /** POST /api/lista — añade un producto del catálogo a la lista. */
  crear(datos: CrearItemLista): Observable<ItemLista> {
    return this.http.post<ItemLista>(this.apiUrl, datos).pipe(
      tap((item) => {
        this.itemsSignal.update((items) => {
          const existe = items.some((actual) => actual._id === item._id);

          return existe
            ? items.map((actual) => (actual._id === item._id ? item : actual))
            : [...items, item];
        });
      }),
    );
  }

  /** PATCH /api/lista/:id — cambia la cantidad o el estado de comprado. */
  actualizar(id: string, datos: ActualizarItemLista): Observable<ItemLista> {
    return this.http.patch<ItemLista>(`${this.apiUrl}/${id}`, datos).pipe(
      tap((item) => {
        this.itemsSignal.update((items) =>
          items.map((actual) => (actual._id === id ? item : actual)),
        );
      }),
    );
  }

  /** DELETE /api/lista/:id — quita un artículo de la lista. */
  eliminar(id: string): Observable<ApiMensaje> {
    return this.http.delete<ApiMensaje>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.itemsSignal.update((items) => items.filter((item) => item._id !== id));
      }),
    );
  }

  /** DELETE /api/lista/comprados — quita todos los artículos comprados. */
  vaciarComprados(): Observable<ApiMensaje> {
    return this.http.delete<ApiMensaje>(`${this.apiUrl}/comprados`).pipe(
      tap(() => {
        this.itemsSignal.update((items) => items.filter((item) => !item.comprado));
      }),
    );
  }
}
