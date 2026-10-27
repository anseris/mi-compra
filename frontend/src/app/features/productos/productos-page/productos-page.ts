import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Categoria } from '../../../core/models/categoria.model';
import type { Producto } from '../../../core/models/producto.model';
import { CategoriasService } from '../../../core/services/categorias.service';
import { ListaCompraService } from '../../../core/services/lista-compra.service';
import { ProductosService } from '../../../core/services/productos.service';
import { mensajeError } from '../../../shared/utils/api-error';

@Component({
  selector: 'app-productos-page',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './productos-page.html',
  styleUrl: './productos-page.css',
})
export class ProductosPage implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly listaService = inject(ListaCompraService);

  readonly productos = this.productosService.productos;
  readonly categorias = this.categoriasService.categorias;
  readonly cargando = computed(
    () => this.productosService.cargando() || this.categoriasService.cargando(),
  );

  readonly error = signal('');
  readonly aviso = signal('');
  readonly busqueda = signal('');
  readonly filtroCategoria = signal('todas');

  readonly categoriasPorId = computed(
    () => new Map(this.categorias().map((categoria) => [categoria._id, categoria])),
  );

  readonly productosFiltrados = computed(() => {
    const consulta = this.busqueda().trim().toLocaleLowerCase('es');
    const filtro = this.filtroCategoria();
    const categorias = this.categoriasPorId();

    return this.productos().filter((producto) => {
      const categoria = categorias.get(producto.categoria);
      const nombreCategoria = categoria?.nombre ?? '';

      const coincideTexto =
        !consulta ||
        producto.nombre.toLocaleLowerCase('es').includes(consulta) ||
        nombreCategoria.toLocaleLowerCase('es').includes(consulta);
      const coincideCategoria = filtro === 'todas' || producto.categoria === filtro;

      return coincideTexto && coincideCategoria;
    });
  });

  // Campos del formulario de producto.
  nombreProducto = '';
  precio: number | null = null;
  categoriaSeleccionada = '';
  editandoId: string | null = null;

  // Campo del formulario de categoría.
  nombreNuevaCategoria = '';

  ngOnInit(): void {
    this.categoriasService.cargar().subscribe({
      next: (categorias) => {
        if (!this.categoriaSeleccionada && categorias.length > 0) {
          this.categoriaSeleccionada = categorias[0]?._id ?? '';
        }
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudieron cargar las categorías.'));
      },
    });

    this.productosService.cargar().subscribe({
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo cargar el catálogo.'));
      },
    });
  }

  categoriaDe(producto: Producto): Categoria | undefined {
    return this.categoriasPorId().get(producto.categoria);
  }

  nombreCategoria(producto: Producto): string {
    return this.categoriaDe(producto)?.nombre ?? 'Sin categoría';
  }

  iconoCategoria(producto: Producto): string {
    return this.categoriaDe(producto)?.icono ?? '🛍️';
  }

  guardarProducto(): void {
    this.error.set('');

    const nombre = this.nombreProducto.trim();
    const precio = Number(this.precio);

    if (!nombre) {
      this.error.set('Escribe el nombre del producto.');
      return;
    }

    if (this.precio === null || !Number.isFinite(precio) || precio < 0) {
      this.error.set('Indica un precio válido (0 o más).');
      return;
    }

    if (!this.categoriaSeleccionada) {
      this.error.set('Crea o selecciona una categoría.');
      return;
    }

    const datos = {
      nombre,
      precio,
      categoria: this.categoriaSeleccionada,
    };

    const peticion = this.editandoId
      ? this.productosService.actualizar(this.editandoId, datos)
      : this.productosService.crear(datos);

    peticion.subscribe({
      next: (producto) => {
        this.mostrarAviso(
          this.editandoId
            ? `«${producto.nombre}» actualizado.`
            : `«${producto.nombre}» añadido al catálogo.`,
        );
        this.resetFormulario();
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo guardar el producto.'));
      },
    });
  }

  editarProducto(producto: Producto): void {
    this.editandoId = producto._id;
    this.nombreProducto = producto.nombre;
    this.precio = producto.precio;
    this.categoriaSeleccionada = producto.categoria;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.resetFormulario();
  }

  eliminarProducto(producto: Producto): void {
    if (
      !window.confirm(
        `¿Eliminar «${producto.nombre}» del catálogo? Los artículos que ya estén en la lista se conservarán.`,
      )
    ) {
      return;
    }

    this.error.set('');

    this.productosService.eliminar(producto._id).subscribe({
      next: () => {
        if (this.editandoId === producto._id) {
          this.resetFormulario();
        }

        this.mostrarAviso(`«${producto.nombre}» eliminado del catálogo.`);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo eliminar el producto.'));
      },
    });
  }

  anadirALista(producto: Producto): void {
    this.error.set('');

    this.listaService.crear({ productoId: producto._id }).subscribe({
      next: (item) => {
        this.mostrarAviso(
          item.cantidad > 1
            ? `«${producto.nombre}» añadido otra vez. Ya tienes ${item.cantidad} en la lista.`
            : `«${producto.nombre}» añadido a la lista de la compra.`,
        );
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo añadir el producto a la lista.'));
      },
    });
  }

  crearCategoria(): void {
    this.error.set('');

    const nombre = this.nombreNuevaCategoria.trim();

    if (!nombre) {
      return;
    }

    const yaExiste = this.categorias().some(
      (categoria) =>
        categoria.nombre.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'),
    );

    if (yaExiste) {
      this.error.set('Ya existe una categoría con ese nombre.');
      return;
    }

    this.categoriasService.crear({ nombre, icono: '🛍️' }).subscribe({
      next: (categoria) => {
        this.categoriaSeleccionada = categoria._id;
        this.nombreNuevaCategoria = '';
        this.mostrarAviso(`Categoría «${categoria.nombre}» creada.`);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error, 'No se pudo crear la categoría.'));
      },
    });
  }

  enfocarFormulario(): void {
    const input = document.getElementById('productoNombre');
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input?.focus();
  }

  private resetFormulario(): void {
    this.nombreProducto = '';
    this.precio = null;
    this.categoriaSeleccionada = this.categorias()[0]?._id ?? '';
    this.editandoId = null;
  }

  private mostrarAviso(texto: string): void {
    this.aviso.set(texto);
    window.setTimeout(() => this.aviso.set(''), 3500);
  }
}
