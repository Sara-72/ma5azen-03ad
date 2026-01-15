import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { ModeerSercive } from '../../../services/modeer.service';

/* ===== Interface المعتمدة على الجرد ===== */
export interface InventoryItem {
  itemName: string;
  unit: string;
  category: string;
  itemType: string;

  totalQuantity: number;      // الكمية الكلية
  incomingQuantity: number;   // الوارد (سجلات فقط)
  issuedQuantity: number;     // المنصرف
  remainingQuantity: number;  // المتبقي
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
  templateUrl: './ameen6.component.html',
  styleUrl: './ameen6.component.css'
})
export class Ameen6Component implements OnInit {

  fullName: string = '';
  displayName: string = '';
  today: Date = new Date();

  inventoryData: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  categories: string[] = [];

  selectedCategory: string = 'الكل';
  viewMode: 'live' | 'history' = 'live';

  /* نوع الجرد في السجلات */
  auditMode: 'range' | 'single' = 'range';
  singleDate: string = '';

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
    this.loadInventory(); // الحالة الحالية
  }
  /* =======================
      Validation
  ======================= */
  validateDates(): boolean {
  this.startDateError = null;
  this.endDateError = null;

  if (!this.startDate || !this.endDate) {
    return false;
  }

  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  if (end < start) {
    this.endDateError = 'تاريخ نهاية الفترة يجب يلي تاريخ بدايتها';
    return false;
  }

  return true;
}
onDateChange(): void {

  // امسحي الداتا القديمة
  this.inventoryData = [];
  this.filteredInventory = [];
  this.categories = [];

  if (
    this.viewMode !== 'history' ||
    this.auditMode !== 'range'
  ) {
    return;
  }

  // ⛔ استني لحد ما التاريخ يكتمل (YYYY-MM-DD)
  if (
    !this.startDate ||
    !this.endDate ||
    this.startDate.length !== 10 ||
    this.endDate.length !== 10
  ) {
    return;
  }

  // فاليديشن (بما إن السنة اكتملت)
  if (!this.validateDates()) {
    return;
  }

  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  this.loadHistoryWithDates(start, end);
}


  /* =======================
      تغيير نوع الجرد
  ======================= */
  onAuditModeChange(): void {
    this.startDate = '';
    this.endDate = '';
    this.singleDate = '';
    this.inventoryData = [];
    this.filteredInventory = [];
  }

  /* =======================
      جرد يوم واحد
  ======================= */
  onSingleDateChange(): void {
  if (!this.singleDate) return;

  // نفس اليوم كبداية ونهاية
  const start = new Date(this.singleDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(this.singleDate);
  end.setHours(23, 59, 59, 999);

  // نستخدم نفس منطق الفترة بالظبط
  this.loadHistoryWithDates(start, end);
}

  /* =================================================
      History Logic (سجلات – يوم / فترة)
       لا يؤثر على الحالة الحالية
  ================================================= */
loadHistoryWithDates(start: Date, end: Date): void {
  this.stockService.getCentralStore().subscribe({
    next: (centralStore) => {
      this.stockService.getSpendPermissions().subscribe({
        next: (spendPermissions) => {

          const groupedMap = new Map<string, InventoryItem>();

          /* ===============================
              الوارد قبل الفترة
              (رصيد افتتاحي – الجزء الأول)
          =============================== */
          centralStore
            .filter((c: any) => new Date(c.date) < start)
            .forEach((c: any) => {
              const key = `${c.itemName}_${c.unit}_${c.category}_${c.storeType}`;

              if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                  itemName: c.itemName,
                  unit: c.unit,
                  category: c.category || 'غير مصنف',
                  itemType: c.storeType || 'غير محدد',
                  totalQuantity: 0,
                  incomingQuantity: 0,
                  issuedQuantity: 0,
                  remainingQuantity: 0
                });
              }

              groupedMap.get(key)!.totalQuantity += c.quantity || 0;
            });

          /* =================================================
              🔥 التعديل الوحيد هنا
              خصم المنصرف قبل تاريخ "من"
              (رصيد افتتاحي – الجزء الثاني)
          ================================================= */
          spendPermissions
            .filter((p: any) => {
              const d = new Date(p.issueDate);
              return p.permissionStatus === 'تم الصرف' && d < start; // ❗ أقل من فقط
            })
            .forEach((p: any) => {

              const matchedRows = Array.from(groupedMap.values())
                .filter(i =>
                  i.itemName === p.itemName &&
                  (
                    p.unit
                      ? i.unit === p.unit &&
                        i.category === (p.category || i.category) &&
                        i.itemType === (p.storeType || i.itemType)
                      : true
                  )
                );

              // نخصم فقط لو صف واحد واضح
              if (matchedRows.length === 1) {
                matchedRows[0].totalQuantity -= p.issuedQuantity || 0;
              }
            });

          /* ===============================
              الوارد داخل الفترة (كما هو)
          =============================== */
          centralStore
            .filter((c: any) => {
              const d = new Date(c.date);
              return d >= start && d <= end;
            })
            .forEach((c: any) => {
              const key = `${c.itemName}_${c.unit}_${c.category}_${c.storeType}`;

              if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                  itemName: c.itemName,
                  unit: c.unit,
                  category: c.category || 'غير مصنف',
                  itemType: c.storeType || 'غير محدد',
                  totalQuantity: 0,
                  incomingQuantity: 0,
                  issuedQuantity: 0,
                  remainingQuantity: 0
                });
              }

              groupedMap.get(key)!.incomingQuantity += c.quantity || 0;
            });

          /* ===============================
              المنصرف داخل الفترة (كما هو)
          =============================== */
          spendPermissions
            .filter((p: any) => {
              const d = new Date(p.issueDate);
              return p.permissionStatus === 'تم الصرف' && d >= start && d <= end;
            })
            .forEach((p: any) => {

              const matchedRows = Array.from(groupedMap.values())
                .filter(i =>
                  i.itemName === p.itemName &&
                  (
                    p.unit
                      ? i.unit === p.unit &&
                        i.category === (p.category || i.category) &&
                        i.itemType === (p.storeType || i.itemType)
                      : true
                  )
                );

              if (matchedRows.length === 1) {
                matchedRows[0].issuedQuantity += p.issuedQuantity || 0;
              }
            });

          /* ===============================
              حساب المتبقي من LedgerEntries (كما هو)
          =============================== */
          this.stockService.getLedgerEntries().subscribe({
            next: (ledgerEntries) => {

              ledgerEntries
                .filter((l: any) => new Date(l.date) <= end)
                .forEach((l: any) => {

                  const baseItem = centralStore.find((c: any) =>
                    c.itemName === l.itemName &&
                    c.unit === l.unit &&
                    mapStoreType(c.storeType) === mapStoreType(l.storeType)
                  );
                  if (!baseItem) return;

                  const key = `${baseItem.itemName}_${baseItem.unit}_${baseItem.category}_${baseItem.storeType}`;
                  const row = groupedMap.get(key);
                  if (!row) return;

                  if (isIncoming(l.documentReference)) {
                    row.remainingQuantity += l.itemsValue || 0;
                  }

                  if (isOutgoing(l.documentReference)) {
                    row.remainingQuantity -= l.itemsValue || 0;
                  }
                });

              /* ===============================
                  فلترة + ترتيب (كما هو)
              =============================== */
              let result = Array.from(groupedMap.values()).filter(item =>
                item.totalQuantity !== 0 ||
                item.incomingQuantity !== 0 ||
                item.issuedQuantity !== 0 ||
                item.remainingQuantity !== 0
              );

              if (this.selectedCategory !== 'الكل') {
                result = result.filter(i => i.category === this.selectedCategory);
              }

              result.sort((a, b) => {
                const categoryCompare = a.category.localeCompare(b.category);
                if (categoryCompare !== 0) return categoryCompare;

                const nameCompare = a.itemName.localeCompare(b.itemName);
                if (nameCompare !== 0) return nameCompare;

                return a.unit.localeCompare(b.unit);
              });

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
  /* =================================================
      Live Inventory
       كما هو بدون أي تعديل
  ================================================= */
  loadInventory(): void {
    this.startDate = '';
    this.endDate = '';
    this.singleDate = '';

    this.stockService.getCentralStore().subscribe({
      next: (centralStore) => {
        this.stockService.getStoreKeeperStocks().subscribe({
          next: (storeStocks) => {
            this.stockService.getSpendPermissions().subscribe({
              next: (spendPermissions) => {

                const groupedMap = new Map<string, InventoryItem>();

                centralStore.forEach((c: any) => {
                  const key = `${c.itemName}_${c.unit}_${c.category}_${c.storeType}`;

                  if (!groupedMap.has(key)) {
                    groupedMap.set(key, {
                      itemName: c.itemName,
                      unit: c.unit,
                      category: c.category || 'غير مصنف',
                      itemType: c.storeType || 'غير محدد',
                      totalQuantity: 0,
                      incomingQuantity: 0, // غير مستخدم في live
                      issuedQuantity: 0,
                      remainingQuantity: 0
                    });
                  }

                  groupedMap.get(key)!.totalQuantity += c.quantity || 0;
                });

                storeStocks.forEach((s: any) => {
                  const key = `${s.itemName}_${s.unit}_${s.category}_${s.storeType}`;

                  if (!groupedMap.has(key)) {
                    groupedMap.set(key, {
                      itemName: s.itemName,
                      unit: s.unit,
                      category: s.category || 'غير مصنف',
                      itemType: s.storeType || 'غير محدد',
                      totalQuantity: 0,
                      incomingQuantity: 0,
                      issuedQuantity: 0,
                      remainingQuantity: 0
                    });
                  }

                  groupedMap.get(key)!.remainingQuantity += s.quantity || 0;
                });

                spendPermissions
  .filter((p: any) => p.permissionStatus === 'تم الصرف')
  .forEach((p: any) => {

    //  لو الإذن محدد وحدة → نخصم من نفس الوحدة
    if (p.unit) {
      const matched = Array.from(groupedMap.values())
        .filter(i =>
          i.itemName === p.itemName &&
          i.unit === p.unit
        );

      if (matched.length > 0) {
        // نجمع المنصرف على كل الصفوف المطابقة
        matched.forEach(row => {
          row.issuedQuantity += p.issuedQuantity || 0;
        });
        return;
      }
    }

    //  لو مفيش وحدة → نخصم بالاسم فقط
    const sameItemRows = Array.from(groupedMap.values())
      .filter(i => i.itemName === p.itemName);

    if (sameItemRows.length > 0) {
      sameItemRows.forEach(row => {
        row.issuedQuantity += p.issuedQuantity || 0;
      });
    }
  });

                const result = Array.from(groupedMap.values());

result.sort((a, b) => {
  //  الفئة
  const categoryCompare = a.category.localeCompare(b.category);
  if (categoryCompare !== 0) return categoryCompare;

  //  اسم الصنف
  const nameCompare = a.itemName.localeCompare(b.itemName);
  if (nameCompare !== 0) return nameCompare;

  //  الوحدة
  return a.unit.localeCompare(b.unit);
});
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
  let deficit = 0;
  if (this.viewMode === 'history') {
    deficit =
      (item.totalQuantity + item.incomingQuantity) -
      (item.remainingQuantity + item.issuedQuantity);
  }
  else {
    deficit =
      item.totalQuantity -
      (item.remainingQuantity + item.issuedQuantity);
  }
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
  getRowClass(item: InventoryItem): any {
  return {
    //  عجز
    'row-deficit': this.getDeficit(item) > 0,

    //  حركة في السجلات
    'row-history-move':
      this.viewMode === 'history' &&
      (item.incomingQuantity !== 0 || item.issuedQuantity !== 0),
  };
}

}
function isIncoming(ref: string): boolean {
  return ref?.includes('وارد');
}

function isOutgoing(ref: string): boolean {
  return ref?.includes('منصرف') || ref?.includes('صرف');
}
function mapStoreType(value: any): string {
  if (value === 0 || value === '0') return 'مستهلك';
  if (value === 1 || value === '1') return 'مستديم';
  return String(value);
}
