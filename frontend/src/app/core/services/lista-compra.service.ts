import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { API_BASE } from '../api-base';
import type { ListaCompra } from '../models/lista-compra.model';
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
  private readonly listasUrl = `${API_BASE}/listas`;

  private readonly itemsSignal = signal<ItemLista[]>([]);
  private readonly listasSignal = signal<ListaCompra[]>([]);
  private readonly listaSeleccionadaIdSignal = signal('');
  private readonly cargandoSignal = signal(false);
  private cargado = false;
  private peticion$: Observable<ItemLista[]> | null = null;

  readonly items = this.itemsSignal.asReadonly();
  readonly listas = this.listasSignal.asReadonly();
  readonly listaSeleccionadaId = this.listaSeleccionadaIdSignal.asReadonly();
  readonly listaSeleccionada = computed(() =>
    this.listasSignal().find((lista) => lista._id === this.listaSeleccionadaIdSignal()) ?? null,
  );
  readonly cargando = this.cargandoSignal.asReadonly();

  /** GET /api/listas y GET /api/lista — carga la lista seleccionada. */
  cargar(forzar = false): Observable<ItemLista[]> {
    if (this.cargado && !forzar) {
      return of(this.itemsSignal());
    }

    if (this.peticion$) {
      return this.peticion$;
    }

    this.cargandoSignal.set(true);

    this.peticion$ = this.http.get<ListaCompra[]>(this.listasUrl).pipe(
      tap((listas) => {
        this.listasSignal.set(listas);
        const seleccionada = listas.find(
          (lista) => lista._id === this.listaSeleccionadaIdSignal(),
        );
        const predeterminada = listas.find((lista) => lista.predeterminada);
        this.listaSeleccionadaIdSignal.set(
          (seleccionada ?? predeterminada ?? listas[0])?._id ?? '',
        );
      }),
      switchMap(() => this.cargarItemsSeleccionados()),
      finalize(() => {
        this.cargandoSignal.set(false);
        this.peticion$ = null;
      }),
      shareReplay(1),
    );

    return this.peticion$;
  }

  seleccionarLista(id: string): Observable<ItemLista[]> {
    if (!this.listasSignal().some((lista) => lista._id === id)) {
      return throwError(() => new Error('La lista seleccionada no existe.'));
    }

    this.listaSeleccionadaIdSignal.set(id);
    this.itemsSignal.set([]);
    this.cargado = false;
    return this.cargar(true);
  }

  crearLista(nombre: string): Observable<ListaCompra> {
    return this.http.post<ListaCompra>(this.listasUrl, { nombre }).pipe(
      tap((lista) => {
        this.listasSignal.update((listas) => [...listas, lista]);
        this.listaSeleccionadaIdSignal.set(lista._id);
        this.itemsSignal.set([]);
        this.cargado = true;
      }),
    );
  }

  /** POST /api/lista — añade un producto del catálogo a la lista. */
  crear(datos: CrearItemLista): Observable<ItemLista> {
    return this.cargar().pipe(
      switchMap(() =>
        this.http.post<ItemLista>(this.apiUrl, {
          ...datos,
          listaId: this.listaSeleccionadaIdSignal(),
        }),
      ),
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
    return this.http.patch<ItemLista>(
      `${this.apiUrl}/${id}?listaId=${encodeURIComponent(this.listaSeleccionadaIdSignal())}`,
      datos,
    ).pipe(
      tap((item) => {
        this.itemsSignal.update((items) =>
          items.map((actual) => (actual._id === id ? item : actual)),
        );
      }),
    );
  }

  /** DELETE /api/lista/:id — quita un artículo de la lista. */
  eliminar(id: string): Observable<ApiMensaje> {
    return this.http.delete<ApiMensaje>(
      `${this.apiUrl}/${id}?listaId=${encodeURIComponent(this.listaSeleccionadaIdSignal())}`,
    ).pipe(
      tap(() => {
        this.itemsSignal.update((items) => items.filter((item) => item._id !== id));
      }),
    );
  }

  /** DELETE /api/lista/comprados — quita todos los artículos comprados. */
  vaciarComprados(): Observable<ApiMensaje> {
    return this.http.delete<ApiMensaje>(
      `${this.apiUrl}/comprados?listaId=${encodeURIComponent(this.listaSeleccionadaIdSignal())}`,
    ).pipe(
      tap(() => {
        this.itemsSignal.update((items) => items.filter((item) => !item.comprado));
      }),
    );
  }

  private cargarItemsSeleccionados(): Observable<ItemLista[]> {
    const listaId = this.listaSeleccionadaIdSignal();

    if (!listaId) {
      this.itemsSignal.set([]);
      this.cargado = true;
      return of([]);
    }

    return this.http
      .get<ItemLista[]>(`${this.apiUrl}?listaId=${encodeURIComponent(listaId)}`)
      .pipe(
        tap((items) => {
          this.itemsSignal.set(items);
          this.cargado = true;
        }),
      );
  }
}
