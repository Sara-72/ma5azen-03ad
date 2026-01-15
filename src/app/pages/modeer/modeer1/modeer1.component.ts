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
      console.log('STORE KEEPER STOCKS RAW:', data);

      const groupedMap: { [key: string]: any } = {};

      data.forEach(item => {
        // 🔑 مفتاح التجميع (غيره حسب منطقك لو حابب)
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

      //  نحول الـ object لـ array
      this.getStoreKeeperStocks = Object.values(groupedMap);
      // يرتب الاصناف المشتركة في الفئة ورا بعض
      this.getStoreKeeperStocks.sort((a, b) =>
  a.category.localeCompare(b.category, 'ar')
);

      //  استخراج الفئات بدون تكرار
      this.categories = Array.from(
        new Set(this.getStoreKeeperStocks.map(i => i.category))
      );

      //  عرض كل الأصناف مبدئيًا
      this.filteredStocks = [...this.getStoreKeeperStocks];

      console.log('STORE KEEPER STOCKS GROUPED:', this.getStoreKeeperStocks);
    },
    error: (err: any) =>
      console.error('Error loading store keeper stocks', err)
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
