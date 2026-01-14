import { Component, OnInit } from '@angular/core';
import { SpendPermissionService } from '../../../services/spend-permission.service';
import { StoreKeeperStockService } from '../../../services/store-keeper-stock.service';
import { SpendNoteService } from '../../../services/spend-note.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../../components/footer/footer.component';
import { HeaderComponent } from '../../../components/header/header.component';
import { forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LedgerService } from '../../../services/ledger.service';

@Component({
  selector: 'app-ameen3',
  standalone: true,
  templateUrl: './ameen3.component.html',
  styleUrls: ['./ameen3.component.css'],
  imports: [CommonModule, FooterComponent, HeaderComponent, FormsModule]
})
export class Ameen3Component implements OnInit {

  fullName = '';
  displayName = '';
  today = new Date();

  groupedPermissions: any[] = [];
  confirmingPerm: any = null;

  constructor(
    private spendPermissionService: SpendPermissionService,
    private stockService: StoreKeeperStockService,
    private spendNoteService: SpendNoteService,
    private ledgerService: LedgerService
  ) {}

  ngOnInit(): void {
    this.fullName = localStorage.getItem('name') || '';
    this.displayName = this.fullName.split(' ').slice(0, 2).join(' ');
    this.loadNewPermissions();
  }

  /* ================= Helpers ================= */

  normalize(val: string) {
    return val?.trim().toLowerCase();
  }

  hasPermissions(): boolean {
    return this.groupedPermissions.length > 0;
  }

  openConfirmInline(perm: any) {
    this.confirmingPerm = perm;
  }

  cancelConfirm() {
    this.confirmingPerm = null;
  }

  confirmApprove() {
    if (this.confirmingPerm) {
      this.approvePermission(this.confirmingPerm);
    }
  }
  getStoreTypeNumber(storeType: string): number {
  return storeType?.trim() === 'مستديم' ? 1 : 0;
}


  /* ================= تحميل الأذونات ================= */

  loadNewPermissions() {
    this.spendPermissionService.getAll().subscribe(res => {
      const newOnes = res.filter(p => p.permissionStatus === 'جديد');
      const grouped: any = {};

      newOnes.forEach(p => {
        const key = `${p.requestorName}|${p.requestDate}|${p.documentDate}|${p.category}`;

        if (!grouped[key]) {
          grouped[key] = {
            destinationName: p.destinationName,
            category: p.category,
            requestDate: p.requestDate,
            documentDate: p.documentDate,
            requestorName: p.requestorName,
            documentNumber: p.documentNumber,
            managerSignature: p.managerSignature,
            items: []
          };
        }

        grouped[key].items.push({
          permissionId: p.id,
          fullPermission: p,
          itemName: p.itemName,
          unit: p.unit,
          requestedQuantity: p.requestedQuantity,
          approvedQuantity: p.approvedQuantity,
          issuedQuantity: p.issuedQuantity,
          storeHouse: p.storeHouse,
          stockStatus: p.stockStatus,
          unitPrice: p.unitPrice,
          totalValue: p.totalValue
        });
      });

      this.groupedPermissions = Object.values(grouped);
    });
  }

  /* ================= تنفيذ الصرف ================= */

  approvePermission(perm: any) {
  const issueDate = new Date().toISOString();

  this.stockService.getAllStocks().subscribe(stocks => {

    /* ================= تجميع الأصناف ================= */
    const groupedItems = new Map<string, any>();

    perm.items.forEach((item: any) => {
      const key = `${item.itemName}|${item.storeHouse}|${item.unit}`;

      if (!groupedItems.has(key)) {
        groupedItems.set(key, {
          ...item,
          totalQuantity: 0
        });
      }

      groupedItems.get(key).totalQuantity += item.issuedQuantity ?? 0;
    });

    /* ================= خصم المخزن FIFO ================= */
    const stockRequests = Array.from(groupedItems.values()).map(group => {

      const matchedStocks = stocks
        .filter(s =>
          this.normalize(s.itemName) === this.normalize(group.itemName) &&
          this.normalize(s.category) === this.normalize(perm.category) &&
          this.normalize(s.unit) === this.normalize(group.unit) &&
          this.normalize(s.storeType) === this.normalize(group.storeHouse)
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      if (matchedStocks.length === 0) {
        this.statusMessage = `❌ الصنف ${group.itemName} غير موجود بالمخزن`;
        this.statusType = 'error';
        return of(null);
      }

      let remainingQty = group.totalQuantity;
      const updates: any[] = [];

      for (const stock of matchedStocks) {
        if (remainingQty <= 0) break;

        const qtyToDeduct = Math.min(stock.quantity, remainingQty);

        const newQty = stock.quantity - qtyToDeduct;

updates.push(
  this.stockService.updateStock(stock.id, {
    stock: {
      ...stock,
      quantity: newQty < 0 ? 0 : newQty, // ✅ يكتب 0 صراحة
      storeKeeperSignature: this.fullName,
      lastUpdated: new Date().toISOString() // 🔥 يجبر الـ backend على التحديث
    }
  })
);


        remainingQty -= qtyToDeduct;
      }

      if (remainingQty > 0) {
  this.statusMessage = `❌ الكمية غير كافية للصنف ${group.itemName}`;
  this.statusType = 'error';
  return of(null);
}

if (updates.length === 0) {
  return of(true); // 🔥 يمنع تعليق forkJoin
}

return forkJoin(updates);

    });

    forkJoin(stockRequests).subscribe(() => {

      /* ================= تحديث أذونات الصرف ================= */
      const permissionUpdates = perm.items.map((item: any) => {
        const updatedPermission = {
          ...item.fullPermission,
          issueDate: issueDate,
          issuedQuantity: item.issuedQuantity,
          permissionStatus: 'تم الصرف'
        };

        return this.spendPermissionService.update(
          item.permissionId,
          updatedPermission
        );
      });

      forkJoin(permissionUpdates).subscribe(() => {

        /* ================= إضافة LedgerEntries ================= */
        const ledgerRequests = perm.items.map((item: any) => {

          if (!item.issuedQuantity || item.issuedQuantity <= 0) {
            return of(null);
          }

          const ledgerEntry = {
            date: new Date().toISOString(),
            itemName: item.itemName,
            unit: item.unit,
            documentReference: 'منصرف إلى',
            itemsValue: item.issuedQuantity, // ✅ من الإذن فقط
            storeType: this.getStoreTypeNumber(item.storeHouse),
            spendPermissionId: item.permissionId,
            status: 'لم يؤكد'
          };

          return this.ledgerService.addLedgerEntry(ledgerEntry);
        });

        forkJoin(ledgerRequests).subscribe({
          next: () => {
            this.updateSpendNotesLikeModeer(perm);
          },
          error: () => {
            this.statusMessage = '❌ فشل تسجيل سندات اليومية';
            this.statusType = 'error';
          }
        });

      });

    });

  });
}



  /* ================= تحديث SpendNotes (نفس طريقة المدير) ================= */

  updateSpendNotesLikeModeer(perm: any) {

  this.spendNoteService.getAll().subscribe(allNotes => {

    const matchedNotes = allNotes.filter((n: any) => {

      const noteDate = new Date(n.requestDate);
      const permDate = new Date(perm.requestDate);

      const sameRequestDay =
        noteDate.getFullYear() === permDate.getFullYear() &&
        noteDate.getMonth() === permDate.getMonth() &&
        noteDate.getDate() === permDate.getDate();

      const sameCategory =
        (n.category || '').trim() === (perm.category || '').trim();

      const sameUser =
        (n.userSignature || '').trim() === (perm.requestorName || '').trim();

      const sameCollege =
        (n.college || '').trim() === (perm.destinationName || '').trim();

      const sameItem =
        perm.items.some((it: any) =>
          (it.itemName || '').trim() === (n.itemName || '').trim()
        );

      return (
        sameRequestDay &&
        sameCategory &&
        sameUser &&
        sameCollege &&
        sameItem
      );
    });

    if (matchedNotes.length === 0) {
      console.warn(
        'NO MATCHED NOTES (DATE + CATEGORY + USER + COLLEGE + ITEM)',
        { perm, allNotes }
      );
      this.finishUI(perm);
      return;
    }

    const updates = matchedNotes.map(note => {

      console.log('NOTE BEFORE UPDATE', note);

      const updatedNote = {
  id: note.id,
  itemName: note.itemName,
  quantity: note.quantity,
  requestDate: note.requestDate,

  // ✅ دول لازم يكونوا موجودين
  userSignature: note.userSignature,
  college: note.college,
  category: note.category,

  // ❗ مهم جدًا: لازم تبعتي employeeId
  employeeId: note.employeeId,

  // ✅ التحديث
  permissinStatus: 'تم الصرف',
  confirmationStatus: 'مؤكد',
  collageKeeper: this.fullName
};

      return this.spendNoteService.updateSpendNoteStatus(
        note.id,
        updatedNote
      );
    });

    forkJoin(updates).subscribe({
      next: () => this.finishUI(perm),
      error: err => {
        console.error('❌ خطأ تحديث SpendNotes', err);
        this.statusMessage = '❌ فشل تحديث بعض مذكرات الصرف';
        this.statusType = 'error';
      }
    });

  });
}

// 1. Add these properties to your class
statusMessage: string | null = null;
statusType: 'success' | 'error' | null = null;

// 2. Add the close method
closeStatusMessage(): void {
  this.statusMessage = null;
  this.statusType = null;
}

  /* ================= UI ================= */
// 3. Update finishUI to set the message instead of alert()
finishUI(perm: any) {
  this.groupedPermissions = this.groupedPermissions.filter(p => p !== perm);
  this.confirmingPerm = null;

  this.statusMessage = '✅ تم الصرف وتحديث المخزن بنجاح';
  this.statusType = 'success';
}

}
