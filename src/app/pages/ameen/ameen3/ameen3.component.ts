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

      const groupedItems = new Map<string, any>();

      perm.items.forEach((item: any) => {
        const key = `${item.itemName}|${item.storeHouse}|${item.unit}`;
        if (!groupedItems.has(key)) {
          groupedItems.set(key, { ...item, totalQuantity: 0 });
        }

        groupedItems.get(key).totalQuantity +=
          (item.issuedQuantity ?? item.requestedQuantity);
      });

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

        const permissionUpdates = perm.items.map((item: any) => {

          const updatedPermission = {
            ...item.fullPermission,
            issueDate: issueDate,
            issuedQuantity: item.issuedQuantity ?? item.requestedQuantity,
            permissionStatus: 'تم الصرف' 
          };

          return this.spendPermissionService.update(
            item.permissionId,
            updatedPermission
          );
        });

        forkJoin(permissionUpdates).subscribe(() => {

          this.updateSpendNotesLikeModeer(perm);

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
