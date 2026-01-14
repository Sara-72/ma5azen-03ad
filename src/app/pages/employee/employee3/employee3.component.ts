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
  confirmationStatus?: string; // ← هنا أضفنا الخاصية الجديدة
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

isApproved(note: SpendNote): boolean {
  if (!note.permissinStatus) return false;

  const permStatus = note.permissinStatus.toLowerCase().trim();
  const confStatus = note.confirmationStatus?.toLowerCase().trim();

  return (permStatus === 'approved' || permStatus.includes('الطلب مقبول')) && confStatus === 'مؤكد';
}

isPending(note: SpendNote): boolean {
  if (!note.permissinStatus) return true;
  const permStatus = note.permissinStatus.toLowerCase().trim();
  const confStatus = note.confirmationStatus?.toLowerCase().trim();

  return (permStatus.includes('قيد') || permStatus === 'pending') || confStatus !== 'مؤكد';
}

isRejected(note: SpendNote): boolean {
  if (!note.permissinStatus) return false;

  const permStatus = note.permissinStatus.toLowerCase().trim();
  return permStatus === 'rejected' || permStatus.includes('الطلب مرفوض');
}




getStatusText(note: SpendNote): string {
  if (!note.permissinStatus) return 'قيد المراجعة';

  const permStatus = note.permissinStatus.toLowerCase().trim();
  const confStatus = note.confirmationStatus?.toLowerCase().trim();

  // 🟢 تم الصرف ومؤكد
  if (
    (permStatus.includes('تم الصرف') || permStatus === 'spent')
    && confStatus === 'مؤكد'
  ) {
    return 'تم الصرف';
  }

  // ✅ مقبول لكن لسه ما اتصرفش
  if (
    (permStatus === 'approved' || permStatus.includes('الطلب مقبول'))
    && confStatus === 'مؤكد'
  ) {
    return 'الطلب مقبول';
  }

  // ❌ مرفوض
  if (permStatus === 'rejected' || permStatus.includes('الطلب مرفوض')) {
    return 'الطلب مرفوض';
  }

  // ⏳ باقي الحالات
  return 'قيد المراجعة';
}


}