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
userName: string = '';
  displayName: string = '';


  private stockService = inject(StoreKeeperStockService);

  stocks: StockResponse[] = [];
  isLoading = true;

  ngOnInit(): void {
     this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadStocks();
  }
 getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';

    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');
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
