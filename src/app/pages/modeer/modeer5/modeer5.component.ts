import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { ModeerSercive } from '../../../services/modeer.service';

/* ===== Interface المعتمدة على الجرد ===== */
export interface InventoryItem {
  itemName: string;
  remainingQuantity: number;
  issuedQuantity: number;
  totalQuantity: number;
  category: string;
  itemType: string;
}

@Component({
  selector: 'app-modeer5',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './modeer5.component.html',
  styleUrl: './modeer5.component.css'
})
export class Modeer5Component implements OnInit {

  fullName: string = '';
  displayName: string = '';
  today: Date = new Date();

  inventoryData: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  categories: string[] = [];

  selectedCategory: string = 'الكل';
  viewMode: 'live' | 'history' = 'live';

  startDate: string = '';
  endDate: string = '';

  startDateError: string | null = null;
  endDateError: string | null = null;

  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;
  isSubmitting = signal(false);

  constructor(private stockService: ModeerSercive) {}

  ngOnInit(): void {
    this.fullName = localStorage.getItem('name') || 'أمين المخزن';
    this.displayName = this.fullName.split(' ').slice(0, 2).join(' ');
    this.loadInventory();
  }

  /* =======================
      Date Validation
  ======================= */
  validateDates(): void {
    this.startDateError = null;
    this.endDateError = null;

    if (!this.startDate || !this.endDate) return;

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (end < start) {
      this.endDateError = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    }
  }

  onDateBlur(): void {
    this.validateDates();

    if (
      this.viewMode === 'history' &&
      !this.startDateError &&
      !this.endDateError &&
      this.startDate &&
      this.endDate
    ) {
      this.loadHistoryFromCentralStore();
    }
  }

  /* =======================
      History (FIXED)
  ======================= */
loadHistoryFromCentralStore(): void {
  if (!this.startDate || !this.endDate) return;
  if (this.startDateError || this.endDateError) return;

  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  this.stockService.getCentralStore().subscribe({
    next: (centralStore) => {
      this.stockService.getSpendPermissions().subscribe({
        next: (spendPermissions) => {
          this.stockService.getLedgerEntries().subscribe({
            next: (ledgerEntries) => {

              /* ===============================
                 1️⃣ فلترة المخزن المركزي
              =============================== */
              const centralFiltered = centralStore.filter((c: any) => {
                const d = new Date(c.date);
                return d >= start && d <= end;
              });

              /* ===============================
                 2️⃣ فلترة الصرف
              =============================== */
              const issuedFiltered = spendPermissions.filter((p: any) => {
  const d = new Date(p.issueDate); // ✅ الصح
  return (
    p.permissionStatus === 'تم الصرف' &&
    !isNaN(d.getTime()) &&
    d >= start &&
    d <= end
  );
});


              /* ===============================
                 3️⃣ تجميع الكمية الكلية
              =============================== */
              const centralMap = new Map<string, number>();
              centralFiltered.forEach((c: any) => {
                centralMap.set(
                  c.itemName,
                  (centralMap.get(c.itemName) || 0) + (c.quantity || 0)
                );
              });

              /* ===============================
                 4️⃣ تجميع الكمية المنصرفة
              =============================== */
              const issuedMap = new Map<string, number>();
              issuedFiltered.forEach((p: any) => {
                issuedMap.set(
                  p.itemName,
                  (issuedMap.get(p.itemName) || 0) + (p.issuedQuantity || 0)
                );
              });

              /* ===============================
                 5️⃣ حساب الكمية المتبقية من Ledger
              =============================== */
              const remainingMap = new Map<string, number>();

              const ledgerFiltered = ledgerEntries.filter((l: any) => {
  // لو ليه SpendPermission مربوط
  if (l.spendPermission?.issueDate) {
    const d = new Date(l.spendPermission.issueDate);
    return d >= start && d <= end;
  }

  // fallback على تاريخ الـ ledger نفسه
  if (l.date) {
    const d = new Date(l.date);
    return d >= start && d <= end;
  }

  return false;
});

              ledgerFiltered.forEach((l: any) => {
  const name = l.itemName;
  const value = l.itemsValue || 0;

  const current = remainingMap.get(name) || 0;

  // لو مربوط بإذن صرف → منصرف
  if (l.spendPermission && l.spendPermission.permissionStatus === 'تم الصرف') {
    remainingMap.set(name, current - value);
  }
  // غير كده → وارد
  else {
    remainingMap.set(name, current + value);
  }
});


              /* ===============================
                 6️⃣ جميع الأصناف
              =============================== */
              const allItems = new Set<string>();
              centralFiltered.forEach((i: any) => allItems.add(i.itemName));
              issuedFiltered.forEach((i: any) => allItems.add(i.itemName));
              ledgerFiltered.forEach((i: any) => allItems.add(i.itemName));

              /* ===============================
                 7️⃣ بناء الجرد النهائي
              =============================== */
              const groupedMap = new Map<string, InventoryItem>();

              allItems.forEach(itemName => {
                const centralItem = centralFiltered.find(i => i.itemName === itemName);
                const issuedItem = issuedFiltered.find(i => i.itemName === itemName);

                groupedMap.set(itemName, {
                  itemName,
                  category: centralItem?.category || issuedItem?.category || 'غير مصنف',
                  itemType: centralItem?.storeType || 'غير محدد',
                  totalQuantity: centralMap.get(itemName) || 0,
                  issuedQuantity: issuedMap.get(itemName) || 0,
                  remainingQuantity: remainingMap.get(itemName) || 0
                });
              });

              /* ===============================
                 8️⃣ فلترة بالفئة
              =============================== */
              let result = Array.from(groupedMap.values());

              if (this.selectedCategory !== 'الكل') {
                result = result.filter(
                  i => i.category === this.selectedCategory
                );
              }

              this.inventoryData = result;
              this.filteredInventory = [...result];
              this.categories = [...new Set(result.map(i => i.category))];
            }
          });
        }
      });
    }
  });
}


  /* =======================
      Live Inventory (كما هو)
  ======================= */
  loadInventory(): void {
    this.startDate = '';
    this.endDate = '';
    this.startDateError = null;
    this.endDateError = null;

    this.stockService.getCentralStore().subscribe({
      next: (centralStore) => {
        this.stockService.getStoreKeeperStocks().subscribe({
          next: (storeStocks) => {
            this.stockService.getSpendPermissions().subscribe({
              next: (spendPermissions) => {

                const centralMap = new Map<string, number>();
                centralStore.forEach((c: any) => {
                  centralMap.set(
                    c.itemName,
                    (centralMap.get(c.itemName) || 0) + (c.quantity || 0)
                  );
                });

                const issuedMap = new Map<string, number>();
                spendPermissions
                  .filter((p: any) => p.permissionStatus === 'تم الصرف')
                  .forEach((p: any) => {
                    issuedMap.set(
                      p.itemName,
                      (issuedMap.get(p.itemName) || 0) + (p.issuedQuantity || 0)
                    );
                  });

                const groupedMap = new Map<string, InventoryItem>();

                storeStocks.forEach((stock: any) => {
                  const key = `${stock.itemName}_${stock.storeType}`;

                  if (groupedMap.has(key)) {
                    groupedMap.get(key)!.remainingQuantity += stock.quantity;
                  } else {
                    groupedMap.set(key, {
                      itemName: stock.itemName,
                      category: stock.category || 'غير مصنف',
                      itemType: stock.storeType || 'غير محدد',
                      totalQuantity: centralMap.get(stock.itemName) || 0,
                      issuedQuantity: issuedMap.get(stock.itemName) || 0,
                      remainingQuantity: stock.quantity
                    });
                  }
                });

                this.inventoryData = Array.from(groupedMap.values());
                this.categories = [...new Set(this.inventoryData.map(i => i.category))];
                this.applyFilter();
              }
            });
          }
        });
      }
    });
  }

  applyFilter(): void {
    if (this.selectedCategory === 'الكل') {
      this.filteredInventory = [...this.inventoryData];
    } else {
      this.filteredInventory = this.inventoryData.filter(
        i => i.category === this.selectedCategory
      );
    }
  }

  onViewModeChange(): void {
    this.selectedCategory = 'الكل';

    if (this.viewMode === 'live') {
      this.loadInventory();
    } else {
      this.inventoryData = [];
      this.filteredInventory = [];
      this.categories = [];
    }
  }

  getDeficit(item: InventoryItem): number {
    const deficit = item.totalQuantity - (item.issuedQuantity + item.remainingQuantity);
    return deficit > 0 ? deficit : 0;
  }

  confirmInventoryAudit(): void {
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.showStatus('✅ تم اعتماد كشف الجرد وحفظه في سجلات النظام بنجاح', 'success');
    }, 1500);
  }

  showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage = msg;
    this.statusType = type;
  }

  closeStatusMessage() {
    this.statusMessage = null;
    this.statusType = null;
  }
}
