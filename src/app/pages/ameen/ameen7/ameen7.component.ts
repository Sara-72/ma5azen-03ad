import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModeerSercive } from '../../../services/modeer.service';
import { SpendPermissionService } from '../../../services/spend-permission.service';
import { LedgerEntry, LedgerService } from '../../../services/ledger.service';

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
    private ledgerService: LedgerService
  ) {}

  ngOnInit(): void {
    this.loadCustodyData();
  }

  loadCustodyData() {
  this.spendPermissionService.getAll().subscribe(res => {
    // فلتر حسب permissionStatus و storeHouse
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
    this.showModal = true; // ممكن تسيبي showModal false لو مش هتستخدمي modal
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
        // إنشاء سجل العهدة الجديد
        const ledgerEntry: LedgerEntry = {
          date: new Date().toISOString(),
          itemName: permission.itemName,
          unit: permission.unit,
          documentReference: 'وارد من', // ثابت دايمًا
          itemsValue: permission.issuedQuantity,
          storeType: 1,
          status: 'لم يؤكد',
          spendPermissionId: permission.id
        };

        this.ledgerService.addLedgerEntry(ledgerEntry).subscribe(() => {
          console.log('تم إضافة العهدة للدفتر');

          // ❌ إزالة العنصر مباشرة من custodyData بدون ما نغير status
          this.custodyData = this.custodyData.filter(item => item.id !== selectedId);

          this.closeModal();
        });
      } else {
        // لو لم ترجع، فقط تحديث الحالة محلياً
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
