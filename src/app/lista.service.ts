import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ListaService {
  private productosEnLista: any[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const listaGuardada = localStorage.getItem('listaProductos');
        if (listaGuardada) {
          this.productosEnLista = JSON.parse(listaGuardada);
        }
      } catch (e) {
        console.error('Error al acceder a localStorage:', e);
      }
    } else {
      console.warn('localStorage is not available');
    }
  }

  private guardarEnLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('listaProductos', JSON.stringify(this.productosEnLista));
    }
  }

  agregarProducto(producto: any) {
    if (!this.productosEnLista.some((p) => p.nombre === producto.nombre)) {
      this.productosEnLista.push(producto);
      this.guardarEnLocalStorage(); // Guardar en localStorage
    }
  }

  obtenerLista(): any[] {
    return this.productosEnLista;
  }

  eliminarProducto(producto: any): void {
    this.productosEnLista = this.productosEnLista.filter((p) => p.nombre !== producto.nombre);
    this.guardarEnLocalStorage(); // Actualizar localStorage
  }

  actualizarCantidad(nombreProducto: string, cantidad: number): void {
    const producto = this.productosEnLista.find((p) => p.nombre === nombreProducto);
    if (producto) {
      producto.cantidad = cantidad;
      this.guardarEnLocalStorage(); // Guardar los cambios
    }
  }
}
