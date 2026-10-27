import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { API_BASE } from '../api-base';
import type {
  ActualizarCategoria,
  Categoria,
  CrearCategoria,
} from '../models/categoria.model';
import type { ApiMensaje } from '../models/api.model';

function ordenar(categorias: Categoria[]): Categoria[] {
  return [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Estado y llamadas al backend de categorías (`/api/categorias`).
 * Guarda el listado en un signal para compartirlo entre páginas y layout.
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE}/categorias`;

  private readonly categoriasSignal = signal<Categoria[]>([]);
  private readonly cargandoSignal = signal(false);
  private cargado = false;
  private peticion$: Observable<Categoria[]> | null = null;

  readonly categorias = this.categoriasSignal.asReadonly();
  readonly cargando = this.cargandoSignal.asReadonly();

  /** GET /api/categorias — carga (una sola vez) las categorías. */
  cargar(forzar = false): Observable<Categoria[]> {
    if (this.cargado && !forzar) {
      return of(this.categoriasSignal());
    }

    if (this.peticion$) {
      return this.peticion$;
    }

    this.cargandoSignal.set(true);

    this.peticion$ = this.http.get<Categoria[]>(this.apiUrl).pipe(
      tap((categorias) => {
        this.categoriasSignal.set(ordenar(categorias));
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

  /** POST /api/categorias — crea una categoría. */
  crear(datos: CrearCategoria): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, datos).pipe(
      tap((categoria) => {
        this.categoriasSignal.update((categorias) => ordenar([...categorias, categoria]));
      }),
    );
  }

  /** PUT /api/categorias/:id — modifica una categoría. */
  actualizar(id: string, datos: ActualizarCategoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, datos).pipe(
      tap((categoria) => {
        this.categoriasSignal.update((categorias) =>
          ordenar(categorias.map((actual) => (actual._id === id ? categoria : actual))),
        );
      }),
    );
  }

  /** DELETE /api/categorias/:id — elimina una categoría. */
  eliminar(id: string): Observable<ApiMensaje> {
    return this.http.delete<ApiMensaje>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.categoriasSignal.update((categorias) =>
          categorias.filter((categoria) => categoria._id !== id),
        );
      }),
    );
  }
}
