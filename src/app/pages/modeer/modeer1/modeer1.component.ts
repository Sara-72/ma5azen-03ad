import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { ModeerSercive } from '../../../services/modeer.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modeer1',
  templateUrl: './modeer1.component.html',
  styleUrls: ['./modeer1.component.css'],
  imports: [
    CommonModule,
    FormsModule,      
    HeaderComponent,
    FooterComponent,
  ]
})
export class Modeer1Component implements OnInit {

  getStoreKeeperStocks: any[] = [];
  filteredStocks: any[] = [];
  categories: string[] = [];
  selectedCategory: string = '';

  userName: string = '';
  displayName: string = '';

  constructor(private modeerSercive: ModeerSercive) {}

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadStoreKeeperStocks();
  }

  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  loadStoreKeeperStocks() {
    this.modeerSercive.getStoreKeeperStocks().subscribe({
      next: (data: any[]) => {
        console.log('STORE KEEPER STOCKS:', data);

        this.getStoreKeeperStocks = data.map(item => ({
          id: item.id,
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          storeType: item.storeType, 
          unit: item.unit
        }));

        // 🔹 جمع جميع الفئات بدون تكرار
        this.categories = Array.from(new Set(this.getStoreKeeperStocks.map(i => i.category)));

        // 🔹 عرض كل الأصناف مبدئيًا
        this.filteredStocks = [...this.getStoreKeeperStocks];
      },
      error: (err: any) => console.error('Error loading store keeper stocks', err)
    });
  }

  // =========================
  // فلترة حسب الفئة
  // =========================
  filterByCategory() {
    if (!this.selectedCategory) {
      this.filteredStocks = [...this.getStoreKeeperStocks];
    } else {
      this.filteredStocks = this.getStoreKeeperStocks.filter(
        s => s.category === this.selectedCategory
      );
    }
  }

}
