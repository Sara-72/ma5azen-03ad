import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModeerSercive } from '../../../services/modeer.service';

@Component({
  selector: 'app-employee-ma5azen4',
  templateUrl: './employee-ma5azen4.component.html',
  styleUrls: ['./employee-ma5azen4.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
  ]
})
export class EmployeeMa5azen4Component implements OnInit {

  // =========================
  // User Data
  // =========================
  userName: string = '';
  displayName: string = '';

  // =========================
  // Store Keeper Stocks
  // =========================
  getStoreKeeperStocks: any[] = [];
  filteredStocks: any[] = [];
  categories: string[] = [];
  selectedCategory: string = '';

  constructor(private modeerSercive: ModeerSercive) {}

  // =========================
  // Life Cycle
  // =========================
  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadStoreKeeperStocks();
  }

  // =========================
  // Helpers
  // =========================
  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  // =========================
  // Load + Group Stocks
  // =========================
  loadStoreKeeperStocks() {
    this.modeerSercive.getStoreKeeperStocks().subscribe({
      next: (data: any[]) => {
        console.log('STORE KEEPER STOCKS RAW:', data);

        const groupedMap: { [key: string]: any } = {};

        data.forEach(item => {
          const key = `${item.itemName}|${item.storeType}|${item.unit}|${item.category}`;

          if (!groupedMap[key]) {
            groupedMap[key] = {
              itemName: item.itemName,
              category: item.category,
              storeType: item.storeType,
              unit: item.unit,
              quantity: Number(item.quantity) || 0
            };
          } else {
            groupedMap[key].quantity += Number(item.quantity) || 0;
          }
        });

        // تحويل Object → Array
        this.getStoreKeeperStocks = Object.values(groupedMap);
        this.getStoreKeeperStocks.sort((a, b) =>
  a.category.localeCompare(b.category, 'ar')
);

        // استخراج الفئات بدون تكرار
        this.categories = Array.from(
          new Set(this.getStoreKeeperStocks.map(i => i.category))
        );

        // عرض الكل مبدئيًا
        this.filteredStocks = [...this.getStoreKeeperStocks];

        console.log('STORE KEEPER STOCKS GROUPED:', this.getStoreKeeperStocks);
      },
      error: (err: any) =>
        console.error('Error loading store keeper stocks', err)
    });
  }

  // =========================
  // Filter By Category
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
