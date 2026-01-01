import { Component ,OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common'; // 1. Import this
import { FormsModule } from '@angular/forms';
import { StoreKeeperStockService } from '../../../services/store-keeper-stock.service';




// 1. Define the structure of your item
export interface InventoryItem {
  itemName: string;
  totalQuantity: number;
  issuedQuantity: number;
  remainingQuantity: number;
  category: string;
  itemType: string; // <--- Make sure this is here!
}
@Component({
  selector: 'app-modeer5',
  standalone: true,
  imports: [
    HeaderComponent, FooterComponent,
    CommonModule,FormsModule
  ],
  templateUrl: './modeer5.component.html',
  styleUrl: './modeer5.component.css'
})



export class Modeer5Component implements OnInit {

fullName: string = '';
  displayName: string = '';
  today: Date = new Date();

  inventoryData: any[] = [];
  filteredInventory: any[] = [];

  startDate: string = '';
endDate: string = '';

  // Filter variables
  categories: string[] = []; // Will hold ['أدوات مكتبية', 'إلكترونيات', etc.]
  selectedCategory: string = 'الكل';

  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;

  constructor(private stockService: StoreKeeperStockService) {}

  ngOnInit(): void {
    this.fullName = localStorage.getItem('name') || 'أمين المخزن';
    this.displayName = this.fullName.split(' ').slice(0, 2).join(' ');
    this.loadInventory();
  }

loadInventory(): void {
  this.stockService.getAllStocks().subscribe({
    next: (data) => {
      this.inventoryData = data.map(item => ({
        itemName: item.itemName,
        totalQuantity: item.initialQuantity || item.quantity,
        issuedQuantity: (item.initialQuantity || item.quantity) - item.quantity,
        remainingQuantity: item.quantity,
        category: item.category || 'غير مصنف', // e.g., أدوات مكتبية
        itemType: item.storeType || 'مستهلك'   // e.g., مستديم أو مستهلك
      }));

        // Dynamically extract unique categories for the dropdown
        this.categories = [...new Set(this.inventoryData.map(item => item.category))];

        this.filteredInventory = [...this.inventoryData];
      },



      error: (err) => this.showStatus('❌ فشل في تحميل بيانات المخزن', 'error')
    });
  }

  applyFilter(): void {
    if (this.selectedCategory === 'الكل') {
      this.filteredInventory = [...this.inventoryData];
    } else {
      this.filteredInventory = this.inventoryData.filter(item =>
        item.category === this.selectedCategory
      );
    }
  }


  // 1. Add these variables to your class
viewMode: 'live' | 'history' = 'live';
selectedHistoryDate: string = '';
historyRecords: any[] = []; // This would normally come from your database

// 2. Add a method to switch data
onViewModeChange(): void {
  if (this.viewMode === 'live') {
    this.loadInventory(); // Reload current data

  } else {
    // Logic to fetch history based on selectedHistoryDate
    this.loadHistoryData();
  }
}

loadHistoryData(): void {
if (!this.startDate || !this.endDate) {
    // Optionally show a message asking to pick both dates
    return;
  }

  console.log(`Searching records from ${this.startDate} to ${this.endDate}`);

}

  getDeficit(item: any): number {
    const diff = item.totalQuantity - (item.issuedQuantity + item.remainingQuantity);
    return diff > 0 ? diff : 0;
  }

  showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage = msg;
    this.statusType = type;
  }

  closeStatusMessage() {
    this.statusMessage = null;
    this.statusType = null;
  }


confirmInventoryAudit(): void {
  // 1. Show a loading message (optional)
  console.log('Saving audit...');

  // 2. Simulate a network delay of 1 second
  setTimeout(() => {
    // 3. This is what triggers the overlay to show
    this.showStatus('✅ تم اعتماد كشف الجرد وحفظه في سجلات النظام بنجاح', 'success');
  }, 1000);

}

}
