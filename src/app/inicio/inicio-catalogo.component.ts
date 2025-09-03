import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ListaService } from '../lista.service';

@Component({
  selector: 'app-inicio-catalogo',
  standalone: true,
  templateUrl: './inicio-catalogo.component.html',
  styleUrls: ['./inicio-catalogo.component.css'],
  imports: [
    HttpClientModule,
    CommonModule,
    FormsModule,
    MatIconModule,
    RouterModule,
  ],
})
export class InicioCatalogoComponent implements OnInit, AfterViewInit {
  productos: any[] = []; // Lista de productos
  productosFiltrados: any[] = []; // Productos filtrados por búsqueda/categoría
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedOrder: string = ''; // Nuevo campo para el orden seleccionado
  categorias: string[] = [
    'Cerveza',
    'Aloe Vera',
    'Café',
    'San Sebastián',
    'Smoothie',
    'Pietro Coricelli',
  ];

  isLoading: boolean = true; // Controla la visibilidad del preloader

  constructor(private http: HttpClient, private listaService: ListaService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isLoading = false; // Oculta el preloader después de que Angular haya cargado la vista
    }, 500); // Ajusta este tiempo si es necesario
  }

  cargarProductos(): void {
    this.isLoading = true;
    this.http.get<any[]>('assets/productos.json').subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.productos = response;
          this.productosFiltrados = response;
        } else {
          console.warn('No se encontraron productos.');
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  filtrarProductos(): void {
    const termino = this.searchTerm.toLowerCase();
    this.productosFiltrados = this.productos.filter((producto) => {
      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(termino) ||
        producto.preciogs.toString().includes(termino) ||
        producto['precio$'].toString().includes(termino) ||
        producto.caja.toLowerCase().includes(termino);

      const coincideCategoria = this.selectedCategory
        ? producto.categoria.toLowerCase() === this.selectedCategory.toLowerCase()
        : true;

      return coincideBusqueda && coincideCategoria;
    });

    // Ordenar los productos filtrados si se seleccionó un orden
    if (this.selectedOrder === 'asc') {
      this.productosFiltrados.sort((a, b) => a.preciogs - b.preciogs);
    } else if (this.selectedOrder === 'desc') {
      this.productosFiltrados.sort((a, b) => b.preciogs - a.preciogs);
    }
  }

  onCategoryChange(): void {
    this.filtrarProductos();
  }

  onOrderChange(): void {
    this.filtrarProductos(); // Reaplicar el filtro y orden
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // Desplazamiento suave
    });
  }
}
