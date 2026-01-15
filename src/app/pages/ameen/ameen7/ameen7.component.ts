import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModeerSercive } from '../../../services/modeer.service';
import { SpendPermissionService } from '../../../services/spend-permission.service';
import { LedgerEntry, LedgerService } from '../../../services/ledger.service';
import { StoreKeeperStockService } from '../../../services/store-keeper-stock.service';
import { CustodyAuditsService } from '../../../services/CustodyAuditsService';

export type CustodyStatus = 'pending' | 'received' | 'returned';

@Component({
  selector: 'app-ameen7',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule],
  templateUrl: './ameen7.component.html',
  styleUrl: './ameen7.component.css'
})
export class Ameen7Component implements OnInit {

  custodyData: any[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  selectedItem: any = null;
  tempStatus: CustodyStatus = 'pending';

  constructor(
    private stockService: ModeerSercive,
    private spendPermissionService: SpendPermissionService,
    private ledgerService: LedgerService,
    private storeKeeperStockService: StoreKeeperStockService,
    private custodyAuditsService: CustodyAuditsService
  ) {}

  ngOnInit(): void {
    this.loadCustodyData();
  }

  loadCustodyData() {
    this.spendPermissionService.getAll().subscribe(res => {
      this.custodyData = res
        .filter(sp => sp.permissionStatus === 'تم الصرف' && sp.storeHouse === 'مستديم')
        .map(sp => ({
          id: sp.id,
          employeeName: sp.requestorName,
          itemName: sp.itemName,
          quantity: sp.issuedQuantity,
          unit: sp.unit,
          receivedDate: sp.issueDate?.split('T')[0] || '',
          status: 'received'
        }));
    });
  }

  filteredCustody() {
    if (!this.searchTerm) return this.custodyData;
    const search = this.searchTerm.toLowerCase();
    return this.custodyData.filter(item =>
      item.employeeName.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  }
  getStatusCount(status: CustodyStatus): number {
    return this.custodyData.filter(item => item.status === status).length;
  }
  openDetailModal(item: any) {
    console.log('Viewing details for:', item);
  }

  onStatusClick(item: any) {
    this.selectedItem = item;
    this.tempStatus = item.status;
    this.showModal = true;
  }

  confirmStatus() {
    if (!this.selectedItem) return;

    const newStatus = this.tempStatus;
    const selectedId = this.selectedItem.id;

    this.spendPermissionService.getAll().subscribe(allPermissions => {
      const permission = allPermissions.find(p => p.id === selectedId);
      if (!permission) return;

      const updatedPermission = {
        ...permission,
        permissionStatus: newStatus === 'returned' ? 'تم الاسترجاع' : permission.permissionStatus
      };

      this.spendPermissionService.update(selectedId, updatedPermission).subscribe(() => {

        if (newStatus === 'returned') {

          /* 1️⃣ إضافة قيد للدفتر */
          const ledgerEntry: LedgerEntry = {
            date: new Date().toISOString(),
            itemName: permission.itemName,
            unit: permission.unit,
            documentReference: 'وارد من',
            itemsValue: permission.issuedQuantity,
            storeType: 1,
            status: 'لم يؤكد',
            spendPermissionId: permission.id
          };

          this.ledgerService.addLedgerEntry(ledgerEntry).subscribe(() => {

            /* 2️⃣ تحديث / إضافة في المخزن */
            /* 2️⃣ تحديث / إضافة في المخزن مع check على الاسم + الوحدة + التاريخ */
this.storeKeeperStockService.getAllStocks().subscribe(allStocks => {

  const issueDateOnly =
    new Date(permission.issueDate).toISOString().split('T')[0];

  const existingStock = allStocks.find(stock =>
    stock.itemName === permission.itemName &&
    stock.unit === permission.unit &&
    stock.storeType === permission.storeHouse &&
    stock.date?.split('T')[0] === issueDateOnly
  );

  if (existingStock) {
    // ✅ UPDATE
    const updatedStock = {
      itemName: existingStock.itemName,
      category: existingStock.category,
      storeType: existingStock.storeType,
      unit: existingStock.unit,
      quantity: existingStock.quantity + permission.issuedQuantity,
      date: existingStock.date,
      additionId: existingStock.additionId,
      spendPermissionId: existingStock.spendPermissionId
    };

    this.storeKeeperStockService
      .updateStock(existingStock.id, { stock: updatedStock })
      .subscribe(() => {
        console.log('✔ تم تحديث الكمية في المخزن');
      });

  } else {
    // ➕ ADD
    const newStock = {
      itemName: permission.itemName,
      category: permission.category,
      storeType: permission.storeHouse,
      unit: permission.unit,
      quantity: permission.issuedQuantity,
      date: permission.issueDate,
      spendPermissionId: permission.id
    };

    this.storeKeeperStockService
      .addStock({ stock: newStock })
      .subscribe(() => {
        console.log('✔ تم إضافة سجل جديد في المخزن');
      });
  }
});



            /* 3️⃣ حذف السجل من جدول العهد */
            this.custodyAuditsService.getAllAudits().subscribe(audits => {
              const audit = audits.find(a =>
                a.itemName === permission.itemName &&
                a.employeeName === permission.requestorName &&
                a.quantity === permission.issuedQuantity &&
                new Date(a.receiveDate).toDateString() ===
                new Date(permission.issueDate).toDateString()
              );

              if (audit) {
                this.custodyAuditsService.deleteAudit(audit.id).subscribe();
              }
            });

            /* 4️⃣ حذف من الشاشة */
            this.custodyData = this.custodyData.filter(item => item.id !== selectedId);
            this.closeModal();
          });

        } else {
          this.selectedItem.status = newStatus;
          this.closeModal();
        }
      });
    });
  }

  closeModal() {
    this.showModal = false;
    this.selectedItem = null;
  }
}
