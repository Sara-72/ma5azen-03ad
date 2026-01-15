import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeStockService, EmployeeStock } from '../../../services/employee-stock.service';

@Component({
  selector: 'app-employee-ma5azen5',
  templateUrl: './employee-ma5azen5.component.html',
  styleUrls: ['./employee-ma5azen5.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent]
})
export class EmployeeMa5azen5Component implements OnInit {

  // =========================
  // User Data
  // =========================
  userName: string = '';
  displayName: string = '';

  // =========================
  // Employee Stocks
  // =========================
  getEmployeeStocks: any[] = [];
  filteredStocks: any[] = [];
  categories: string[] = [];
  selectedCategory: string = '';

  constructor(private employeeStockService: EmployeeStockService) {}

  // =========================
  // Life Cycle
  // =========================
  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadEmployeeStocks();
  }

  // =========================
  // Helpers
  // =========================
  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  // =========================
  // Load + Group Employee Stocks
  // =========================
  loadEmployeeStocks() {
    this.employeeStockService.getAll().subscribe({
      next: (data: EmployeeStock[]) => {
        console.log('RAW EMPLOYEE STOCKS:', data);

        // =========================
        // Group by itemName + category + unit + itemStatus
        // =========================
        const groupedMap: { [key: string]: any } = {};

        data.forEach(item => {
          const key = `${item.itemName}|${item.category}|${item.unit}|${item.itemStatus}`;
          if (!groupedMap[key]) {
            groupedMap[key] = {
              itemName: item.itemName,
              category: item.category,
              unit: item.unit,
              itemStatus: item.itemStatus,
              quantity: Number(item.quantity) || 0
            };
          } else {
            groupedMap[key].quantity += Number(item.quantity) || 0;
          }
        });

        // تحويل Object → Array
        this.getEmployeeStocks = Object.values(groupedMap);

        // ترتيب حسب الفئة
        this.getEmployeeStocks.sort((a, b) =>
          a.category.localeCompare(b.category, 'ar')
        );

        // استخراج الفئات بدون تكرار
        this.categories = Array.from(
          new Set(this.getEmployeeStocks.map(i => i.category))
        );

        // عرض الكل مبدئيًا
        this.filteredStocks = [...this.getEmployeeStocks];

        console.log('GROUPED EMPLOYEE STOCKS:', this.getEmployeeStocks);
      },
      error: (err: any) => console.error('Error loading employee stocks', err)
    });
  }

  // =========================
  // Filter By Category
  // =========================
  filterByCategory() {
    if (!this.selectedCategory) {
      this.filteredStocks = [...this.getEmployeeStocks];
    } else {
      this.filteredStocks = this.getEmployeeStocks.filter(
        s => s.category === this.selectedCategory
      );
    }
  }
}
