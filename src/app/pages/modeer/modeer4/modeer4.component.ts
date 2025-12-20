import { Component, OnInit } from '@angular/core';
import { ModeerSercive } from '../../../services/modeer.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';

interface SpendItem {
  itemName: string;
  unit: string;
  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  storeHouse?: string;
  stockStatus?: string;
  unitPrice?: number;
  totalValue?: number;
  ManagerSignature:string;
  DocumentNumber?: string;
  
}

interface SpendPermissionGroup {
  requestorName: string;
  requestDate: string;
  documentDate: string;
  destinationName: string;
  category: string;
  items: SpendItem[];
  ManagerSignature:string;
  DocumentNumber?: string;
}

@Component({
  selector: 'app-modeer4',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './modeer4.component.html',
  styleUrls: ['./modeer4.component.css']
})
export class Modeer4Component implements OnInit {

  groupedPermissions: SpendPermissionGroup[] = [];

  constructor(private modeerService: ModeerSercive) {}

  ngOnInit(): void {
    this.loadSpendPermissions();
  }

  loadSpendPermissions(): void {
  this.modeerService.getSpendPermissions().subscribe({
    next: (data: any[]) => {
      this.groupedPermissions = this.groupPermissions(data)
        .sort((a, b) => {
          const docA = new Date(a.documentDate).getTime();
          const docB = new Date(b.documentDate).getTime();
          return docB - docA; 
        });

      console.log(this.groupedPermissions);
    },
    error: (err) => console.error(err)
  });
}



  private groupPermissions(data: any[]): SpendPermissionGroup[] {
  const groups: { [key: string]: SpendPermissionGroup } = {};

  data.forEach(p => {
    const formatDate = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

const key = `${p.requestorName ?? ''}|${formatDate(p.requestDate)}|${formatDate(p.documentDate)}|${p.destinationName ?? ''}|${p.category ?? ''}`;

    if (!groups[key]) {
      groups[key] = {
        requestorName: p.requestorName,
        requestDate: p.requestDate,
        documentDate: p.documentDate,
        destinationName: p.destinationName,
        category: p.category,
        items: [],
        ManagerSignature: p.managerSignature ?? '' , 
        DocumentNumber: p.documentNumber  ?? ''
      };
    }

    groups[key].items.push({
      itemName: p.itemName,
      unit: p.unit,
      requestedQuantity: p.requestedQuantity,
      approvedQuantity: p.approvedQuantity,
      issuedQuantity: p.issuedQuantity,
      storeHouse: p.storeHouse,
      stockStatus: p.stockStatus,
      unitPrice: p.unitPrice,
      totalValue: p.totalValue,
      ManagerSignature: p.managerSignature ?? ''
    });
  });

  return Object.values(groups);
}

}
