import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import {
  StoreKeeperStockService,
  StockResponse
} from '../../../services/store-keeper-stock.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ameen5',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './ameen5.component.html',
  styleUrl: './ameen5.component.css'
})
export class Ameen5Component implements OnInit {

  private stockService = inject(StoreKeeperStockService);

  stocks: StockResponse[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadStocks();
  }

  loadStocks(): void {
    this.stockService.getAllStocks().subscribe({
      next: (data) => {
        this.stocks = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading stocks', err);
        this.isLoading = false;
      }
    });
  }
}
