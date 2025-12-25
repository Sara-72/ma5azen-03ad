import { Component, OnInit } from '@angular/core';
import { SpendPermissionService } from '../../../services/spend-permission.service';
import { StoreKeeperStockService } from '../../../services/store-keeper-stock.service';
import { SpendNoteService } from '../../../services/spend-note.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../../components/footer/footer.component';
import { HeaderComponent } from '../../../components/header/header.component';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

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
    private spendNoteService: SpendNoteService
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
            spendNote: p.spendNote,
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

      /* 🔹 تجميع الكميات */
      const groupedItems = new Map<string, any>();

      perm.items.forEach((item: any) => {
        const key = `${item.itemName}|${item.storeHouse}|${item.unit}`;
        if (!groupedItems.has(key)) {
          groupedItems.set(key, { ...item, totalQuantity: 0 });
        }
        groupedItems.get(key).totalQuantity += item.requestedQuantity;
      });

      /* 🔹 خصم المخزن */
      const stockRequests = Array.from(groupedItems.values()).map(group => {
        const stock = stocks.find(s =>
          this.normalize(s.itemName) === this.normalize(group.itemName) &&
          this.normalize(s.storeType) === this.normalize(group.storeHouse) &&
          this.normalize(s.unit) === this.normalize(group.unit)
        );

        if (!stock) throw new Error(`الصنف ${group.itemName} غير موجود`);
        if (stock.quantity < group.totalQuantity)
          throw new Error(`الكمية غير كافية للصنف ${group.itemName}`);

        return this.stockService.updateStock(stock.id, {
          stock: {
            ...stock,
            quantity: stock.quantity - group.totalQuantity,
            storeKeeperSignature: this.fullName
          }
        });
      });

      forkJoin(stockRequests).subscribe(() => {

        /* 🔹 تحديث SpendPermissions (محاولة فقط) */
        const permissionUpdates = perm.items.map((item: any) =>
          this.spendPermissionService.update(item.permissionId, {
            ...item.fullPermission,
            permissionStatus: 'تم الصرف',
            issueDate: issueDate,
            issuedQuantity: item.requestedQuantity
          })
        );

        forkJoin(permissionUpdates).subscribe(() => {
          /* 🔹 تحديث SpendNotes بالطريقة المضمونة */
          this.updateGroupedSpendNotes(perm);
        });

      });

    });
  }

  /* ================= تحديث SpendNotes (زي Modeer3) ================= */
  updateGroupedSpendNotes(perm: any) {
  const targetDate = new Date(perm.requestDate).toDateString();

  this.spendNoteService.getAll().subscribe(allNotes => {

    const matchedNotes = allNotes.filter((n: any) =>
      new Date(n.requestDate).toDateString() === targetDate &&
      n.category === perm.category &&
      perm.items.some((it: any) => it.fullPermission.spendNoteId === n.id)
    );

    if (matchedNotes.length === 0) {
      console.warn('⚠️ لم يتم العثور على SpendNotes مطابقة');
      this.finishUI(perm);
      return;
    }

    const updates = matchedNotes.map(note => {

      // ✅ DTO نظيف – بدون spread
      const cleanUpdate = {
        id: note.id,
        itemName: note.itemName,
        quantity: note.quantity,
        requestDate: note.requestDate,
        userSignature: note.userSignature,
        college: note.college,
        category: note.category,

        permissinStatus: 'تم الصرف',
        confirmationStatus: 'تم الصرف',
        collageKeeper: this.fullName,

        employeeId: note.employeeId
      };

      return this.spendNoteService.updateSpendNoteStatus(note.id, cleanUpdate);
    });

    forkJoin(updates).subscribe({
      next: () => this.finishUI(perm),
      error: err => {
        console.error('❌ خطأ تحديث SpendNotes', err);
        alert('فشل تحديث بعض مذكرات الصرف');
      }
    });

  });
}



  /* ================= UI ================= */
  finishUI(perm: any) {
    this.groupedPermissions = this.groupedPermissions.filter(p => p !== perm);
    this.confirmingPerm = null;
    alert('✅ تم الصرف بنجاح');
  }
}
