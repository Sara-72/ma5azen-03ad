import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { SpendPermissionService } from '../../../services/spend-permission.service';
import { CustodyAuditsService } from '../../../services/CustodyAuditsService';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-employee2',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './employee2.component.html',
  styleUrls: ['./employee2.component.css']
})
export class Employee2Component implements OnInit {

  userName: string = '';
  displayName: string = '';
  spendPermissions: any[] = [];
  custodyAudits: any[] = [];

  private spendService = inject(SpendPermissionService);
  private auditService = inject(CustodyAuditsService);

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadUserSpendPermissions();
  }

  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  loadUserSpendPermissions() {
    const userName = (this.userName || '').trim().toLowerCase();

    // أولًا جلب كل العهد
    this.spendService.getAll().subscribe({
      next: (data: any[]) => {
        // فلترة حسب اسم الموظف وحالة الصرف والمخزن
        this.spendPermissions = data.filter(sp => 
          (sp.requestorName || '').trim().toLowerCase() === userName &&
          sp.permissionStatus === 'تم الصرف' &&
          sp.storeHouse === 'مستديم'
        );

        // بعد كده جلب CustodyAudits الحالي لتجنب التكرار
        this.auditService.getAllAudits().subscribe({
          next: audits => {
            this.custodyAudits = audits;
            this.saveUserToCustodyAudits();
          },
          error: err => console.error('خطأ في جلب CustodyAudits:', err)
        });
      },
      error: err => console.error('خطأ في جلب SpendPermissions:', err)
    });
  }

  saveUserToCustodyAudits() {
    const employeeId = Number(localStorage.getItem('employeeId')) || 0;
    const employeeName = this.userName;

    const observables = this.spendPermissions
      .filter(sp => !this.custodyAudits.some(audit =>
        audit.itemName === sp.itemName &&
        audit.employeeName === employeeName &&
        audit.receiveDate === sp.issueDate
      ))
      .map(sp => {
        const auditData = {
          itemName: sp.itemName,
          receiveDate: sp.issueDate,
          quantity: sp.issuedQuantity,
          employeeName: employeeName,
          id: employeeId
        };
        return this.auditService.addAudit(auditData);
      });

    if (observables.length > 0) {
      forkJoin(observables).subscribe({
        next: results => console.log('تم حفظ جميع العهد الجديدة بنجاح', results),
        error: err => console.error('خطأ في حفظ العهد:', err)
      });
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach((row: any) => {
      const rect = row.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      row.style.setProperty('--mouse-x', `${x}px`);
      row.style.setProperty('--mouse-y', `${y}px`);
    });
  }
}
