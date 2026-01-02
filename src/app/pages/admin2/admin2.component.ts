import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';


@Component({
  selector: 'app-admin2',
  imports: [

    HeaderComponent,
    FooterComponent ,CommonModule,
    FormsModule, RouterModule
    // ReactiveFormsModule,
  ],
  templateUrl: './admin2.component.html',
  styleUrl: './admin2.component.css'
})
export class Admin2Component implements OnInit {
accounts: any[] = [];
  searchTerm: string = '';

  // Modal Controls
  showEditModal = false;
  showDeleteModal = false;
  selectedUser: any = {};

  // Status Modal
  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void { this.loadData(); }

  loadData() {
    this.auth.getAllAccounts().subscribe({
      next: (data) => this.accounts = data,
      error: () => this.showStatus('خطأ في تحميل البيانات', 'error')
    });
  }

  // --- DELETE LOGIC ---
  openDeleteModal(user: any) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    this.showDeleteModal = false;
    this.auth.deleteAccount(this.selectedUser.id, this.selectedUser.endpoint).subscribe({
      next: () => {
        this.showStatus('تم حذف الحساب بنجاح', 'success');
        this.loadData();
      },
      error: () => this.showStatus('فشل في عملية الحذف', 'error')
    });
  }


  // --- HELPERS ---
  showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage = msg;
    this.statusType = type;
  }

  closeStatusMessage() {
    this.statusMessage = null;
    this.statusType = null;
  }

  filteredAccounts() {
    if (!this.searchTerm) return this.accounts;
    const s = this.searchTerm.toLowerCase();
    return this.accounts.filter(a =>
      a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s)
    );
  }

  getRoleClass(role: string) {
    switch (role) {
      case 'موظف': return 'bg-emp';
      case 'موظف مخزن': return 'bg-store-emp';
      case 'أمين مخزن': return 'bg-keeper';
      case 'مدير مخزن': return 'bg-manager';
      default: return '';
    }
  }




  originalRole: string = '';

openEditModal(user: any) {
  this.selectedUser = { ...user };
  this.originalRole = user.role; // Store the original to check for changes
  this.showEditModal = true;
}

confirmEdit() {
  this.showEditModal = false;

  // Case A: Role has changed
  if (this.selectedUser.role !== this.originalRole) {
    this.handleRoleChange();
  }
  // Case B: Only data (Name/Email/Pass) changed
  else {
    this.auth.updateAccount(this.selectedUser.id, this.selectedUser.endpoint, this.selectedUser).subscribe({
      next: () => {
        this.showStatus('تم تحديث البيانات بنجاح', 'success');
        this.loadData();
      },
      error: () => this.showStatus('فشل في تحديث البيانات', 'error')
    });
  }
}

private handleRoleChange() {
  // 1. Delete from old endpoint
  this.auth.deleteAccount(this.selectedUser.id, this.selectedUser.endpoint).subscribe({
    next: () => {
      // 2. Prepare data for the new endpoint
      const body = {
        name: this.selectedUser.name,
        email: this.selectedUser.email,
        password: this.selectedUser.password,
        faculty: this.selectedUser.faculty
      };

      // 3. Add to new endpoint
      let request;
      switch (this.selectedUser.role) {
        case 'موظف': request = this.auth.addUser(body); break;
        case 'موظف مخزن': request = this.auth.addEmployee(body); break;
        case 'أمين مخزن': request = this.auth.addStoreKeeper(body); break;
        case 'مدير مخزن': request = this.auth.addInventoryManager(body); break;
      }

      request?.subscribe({
        next: () => {
          this.showStatus('تم تغيير الرتبة وتحديث البيانات بنجاح', 'success');
          this.loadData();
        },
        error: () => this.showStatus('حدث خطأ أثناء نقل الحساب', 'error')
      });
    }
  });
}
  }


