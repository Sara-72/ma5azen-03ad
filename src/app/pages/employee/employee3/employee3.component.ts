import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { SpendNotesService } from '../../../services/spend-notes.service';
import { FormsModule } from '@angular/forms';


interface SpendNote {
  id: number;
  itemName: string;
  quantity: number;
  category: string;
  permissinStatus: string;
  userSignature: string;
  college: string;
  requestDate: string;
  collageKeeper: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-employee3',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule,FormsModule,],
  templateUrl: './employee3.component.html',
  styleUrls: ['./employee3.component.css']
})
export class Employee3Component implements OnInit {

 userName: string = '';
 displayName: string = '';
  spendNotes: SpendNote[] = [];
  isLoading = true;
  noNotesMessage = '';
  allNotes: SpendNote[] = [];
filteredNotes: SpendNote[] = [];

filterName = '';
filterCategory = '';
filterDate = '';

  constructor(private spendNotesService: SpendNotesService) {}
applyFilters(): void {
  this.filteredNotes = this.allNotes.filter(note => {

    const matchName =
      !this.filterName ||
      note.userSignature
        .toLowerCase()
        .includes(this.filterName.toLowerCase());

    const matchCategory =
      !this.filterCategory ||
      note.category === this.filterCategory;

    const matchDate =
      !this.filterDate ||
      note.requestDate?.startsWith(this.filterDate);

    return matchName && matchCategory && matchDate;
  });

  if (this.filteredNotes.length === 0) {
    this.noNotesMessage = 'لا توجد نتائج مطابقة.';
  } else {
    this.noNotesMessage = '';
  }
}

 ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);

  const userName = localStorage.getItem('name') || '';

  this.spendNotesService.getMySpendNotes().subscribe({
    next: (notes) => {
      // فلتر المذكرات الخاصة بالمستخدم
      this.allNotes = notes.filter(
        note => note.userSignature === userName
      );

      // ترتيب حسب التاريخ الأقدم أولاً
      this.allNotes.sort((a, b) => {
        const dateA = new Date(a.requestDate);
        const dateB = new Date(b.requestDate);
        return dateA.getTime() - dateB.getTime(); // أقدم أولاً
      });

      this.filteredNotes = [...this.allNotes];

      if (this.filteredNotes.length === 0) {
        this.noNotesMessage = 'لا توجد مذكرات صرف حالياً.';
      }

      this.isLoading = false;
    },
    error: () => {
      this.noNotesMessage = 'حدث خطأ أثناء جلب المذكرات.';
      this.isLoading = false;
    }
  });
}
getFirstTwoNames(fullName: string): string {
  if (!fullName) return '';

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}

isPending(status: string): boolean {
  if (!status) return true;
  const s = status.toLowerCase().trim();

  return s.includes('قيد') || s === 'pending';
}

isApproved(status: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();

  return (
    s === 'approved' ||
    s.includes('الطلب مقبول')
  );
}

isRejected(status: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();

  return (
    s === 'rejected' ||
    s.includes('الطلب مرفوض')
  );
}



  getStatusText(status: string): string {
    if (!status) return 'قيد المراجعة';

    const value = status.toLowerCase();

    if (value.includes('قيد') || value === 'pending')
      return 'قيد المراجعة';

    if (value === 'approved')
      return 'تم الطلب مقبول';

    if (value === 'rejected')
      return 'تم الطلب مرفوض';

    return status;
  }
}