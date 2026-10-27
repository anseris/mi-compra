import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { API_BASE } from '../api-base';
import type {
  ActualizarProducto,
  CrearProducto,
  Producto,
} from '../models/producto.model';
import type { ApiMensaje } from '../models/api.model';

function ordenar(productos: Producto[]): Producto[] {
  return [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Estado y llamadas al backend del catálogo (`/api/productos`).
 * Guarda el listado en un signal para compartirlo entre páginas y layout.
 */
@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE}/productos`;

  private readonly productosSignal = signal<Producto[]>([]);
  private readonly cargandoSignal = signal(false);
  private cargado = false;
  private peticion$: Observable<Producto[]> | null = null;

  readonly productos = this.productosSignal.asReadonly();
  readonly cargando = this.cargandoSignal.asReadonly();

  /** GET /api/productos — carga (una sola vez) el catálogo. */
  cargar(forzar = false): Observable<Producto[]> {
    if (this.cargado && !forzar) {
      return of(this.productosSignal());
    }

    if (this.peticion$) {
      return this.peticion$;
    }

    this.cargandoSignal.set(true);

    this.peticion$ = this.http.get<Producto[]>(this.apiUrl).pipe(
      tap((productos) => {
        this.productosSignal.set(ordenar(productos));
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

  /** POST /api/productos — crea un producto. */
  crear(datos: CrearProducto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, datos).pipe(
      tap((producto) => {
        this.productosSignal.update((productos) => ordenar([...productos, producto]));
      }),
    );
  }

  /** PUT /api/productos/:id — modifica un producto. */
  actualizar(id: string, datos: ActualizarProducto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, datos).pipe(
      tap((producto) => {
        this.productosSignal.update((productos) =>
          ordenar(productos.map((actual) => (actual._id === id ? producto : actual))),
        );
      }),
    );
  }

  /** DELETE /api/productos/:id — elimina un producto del catálogo. */
  eliminar(id: string): Observable<ApiMensaje> {
    return this.http.delete<ApiMensaje>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.productosSignal.update((productos) =>
          productos.filter((producto) => producto._id !== id),
        );
      }),
    );
  }
}
