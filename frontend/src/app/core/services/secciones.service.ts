import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { API_BASE } from '../api-base';
import type { Seccion } from '../models/seccion.model';

@Injectable({
  providedIn: 'root',
})
export class SeccionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE}/secciones`;

  private readonly seccionesSignal = signal<Seccion[]>([]);
  private readonly cargandoSignal = signal(false);
  private cargado = false;
  private peticion$: Observable<Seccion[]> | null = null;

  readonly secciones = this.seccionesSignal.asReadonly();
  readonly cargando = this.cargandoSignal.asReadonly();

  cargar(): Observable<Seccion[]> {
    if (this.cargado) {
      return of(this.seccionesSignal());
    }

    if (this.peticion$) {
      return this.peticion$;
    }

    this.cargandoSignal.set(true);
    this.peticion$ = this.http.get<Seccion[]>(this.apiUrl).pipe(
      tap((secciones) => {
        this.seccionesSignal.set(secciones);
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

  crear(nombre: string): Observable<Seccion> {
    return this.http.post<Seccion>(this.apiUrl, { nombre }).pipe(
      tap((seccion) => {
        this.seccionesSignal.update((secciones) =>
          [...secciones, seccion].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es')),
        );
      }),
    );
  }

  crearSubseccion(seccionId: string, nombre: string): Observable<Seccion> {
    return this.http
      .post<Seccion>(`${this.apiUrl}/${seccionId}/subsecciones`, { nombre })
      .pipe(
        tap((actualizada) => {
          this.seccionesSignal.update((secciones) =>
            secciones.map((seccion) =>
              seccion._id === actualizada._id ? actualizada : seccion,
            ),
          );
        }),
      );
  }

  actualizar(seccion: Seccion): void {
    this.seccionesSignal.update((secciones) =>
      secciones.map((actual) =>
        actual._id === seccion._id ? seccion : actual,
      ),
    );
  }
}
