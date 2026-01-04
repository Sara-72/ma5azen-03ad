import { Component, OnInit } from '@angular/core';
import { ModeerSercive } from '../../../services/modeer.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from "../../../components/footer/footer.component";
import { HeaderComponent } from "../../../components/header/header.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modeer3',
  templateUrl: './modeer3.component.html',
  styleUrls: ['./modeer3.component.css'],
  imports: [CommonModule, FooterComponent, HeaderComponent, FormsModule]
})
export class Modeer3Component implements OnInit {
userName: string = '';
  displayName: string = '';

  spendNotes: any[] = [];
  groupedNotes: any[] = [];
  storeKeeperStocks: any[] = [];


  constructor(private modeerService: ModeerSercive) {}

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);
    this.loadNotes();
  }
  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  loadNotes(): void {
    this.modeerService.getSpendNotes().subscribe({
      next: (data) => {
        this.spendNotes = data.filter(n => n.permissinStatus === 'قيد المراجعة');

        this.groupedNotes = this.groupNotes(this.spendNotes);
      },
      error: (err) => console.error('Load SpendNotes Error', err)
    });
  }

  groupNotes(notes: any[]): any[] {
    const map = new Map<string, any>();

    notes.forEach(note => {
      const dateStr = new Date(note.requestDate).toDateString();
      const key = `${dateStr}-${note.category || ''}-${note.userSignature || ''}`;

      if (!map.has(key)) {
        map.set(key, {
          id: note.id,
          requestDate: note.requestDate,
          category: note.category,
          userSignature: note.userSignature,
          college: note.college,
          collageKeeper: note.collageKeeper,
          permissinStatus: note.permissinStatus,
          showButtons: true,
          currentStatus: '',
          items: [{ itemName: note.itemName, quantity: note.quantity }]
        });
      } else {
        map.get(key).items.push({ itemName: note.itemName, quantity: note.quantity });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }
  loadStoreKeeperStocks(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    this.modeerService.getStoreKeeperStocks().subscribe({
      next: (data) => resolve(data),
      error: (err) => reject(err)
    });
  });
}
groupStoreStocks(stocks: any[]): Map<string, number> {
  const map = new Map<string, number>();

  stocks.forEach(stock => {
    const key = `${stock.itemName}|${stock.storeType}|${stock.unit}`;

    const currentQty = map.get(key) || 0;
    map.set(key, currentQty + Number(stock.quantity || 0));
  });

  return map;
}
checkStockAvailability(note: any, stockMap: Map<string, number>, stocks: any[]): boolean {

  let hasError = false;
  const reasons: string[] = [];

  note.items.forEach((item: any) => {
    item.stockError = null;
    item.availableQty = null;
  });

  for (const item of note.items) {

    const sameNameStocks = stocks.filter(
      s => s.itemName === item.itemName
    );

    if (sameNameStocks.length === 0) {
      item.stockError = 'الصنف غير موجود في المخزن';
      reasons.push(`الصنف (${item.itemName}) غير موجود في المخزن`);
      hasError = true;
      continue;
    }

    const sameCategoryStocks = sameNameStocks.filter(
      s => s.category === note.category
    );

    if (sameCategoryStocks.length === 0) {
      const foundCategories = Array.from(
        new Set(sameNameStocks.map(s => s.category))
      ).join(' ، ');

      item.stockError =
        `الصنف موجود ولكن من فئة (${foundCategories}) وليس من فئة (${note.category})`;

      reasons.push(
        `الصنف (${item.itemName}) موجود في فئة (${foundCategories}) وليس في فئة (${note.category})`
      );

      hasError = true;
      continue;
    }

    const totalAvailable = sameCategoryStocks
      .reduce((sum, s) => sum + Number(s.quantity || 0), 0);

    if (item.quantity > totalAvailable) {
      item.stockError = 'الكمية غير كافية';
      item.availableQty = totalAvailable;

      reasons.push(
        `الكمية غير كافية للصنف (${item.itemName}) — المتاح: ${totalAvailable}`
      );

      hasError = true;
    }
  }

  //  نخزن سبب الرفض تلقائيًا
  note.autoRejectionReason = reasons.join(' | ');

  return hasError;
}



async changeStatus(note: any, decision: 'مقبول' | 'مرفوض'): Promise<void> {

  // نخزن القرار
  note.decision = decision;
  note.showReasonError = false;

  try {
    // 🔹 نحمّل المخزون ونعمل فحص في الحالتين
    const stocks = await this.loadStoreKeeperStocks();
    const stockMap = this.groupStoreStocks(stocks);

    const hasStockError = this.checkStockAvailability(note, stockMap, stocks);

    // =================================
    // 🔴 حالة الرفض
    // =================================
    if (decision === 'مرفوض') {

      note.showButtons = false;

      // ✅ سبب الرفض تلقائي
      if (hasStockError && note.autoRejectionReason) {
        note.rejectionReason = note.autoRejectionReason;
      } else {
        note.rejectionReason = 'تم رفض الطلب';
      }

      note.currentStatus = 'سبب الرفض';
      return;
    }

    // =================================
    // 🟢 حالة القبول
    // =================================
    if (decision === 'مقبول') {

      // ❌ لو فيه مشاكل مخزون → نمنع القبول
      if (hasStockError) {
        note.showButtons = true;   // يفضل في نفس المرحلة
        note.currentStatus = '';
        note.decision = null;
        return;
      }

      // ✅ لو كله تمام
      note.showButtons = false;
      note.rejectionReason = '';
      note.currentStatus = 'هل تريد قبول الطلب ؟';
      return;
    }

  } catch (err) {
    // ❌ خطأ تقني
    note.showButtons = true;
    note.currentStatus = '';
  }
}

async confirmNote(note: any): Promise<void> {

  // ❌ منع التأكيد بدون سبب رفض
  if (note.decision === 'مرفوض' && !note.rejectionReason?.trim()) {
    note.showReasonError = true;
    return;
  }

  // هنا مفيش فحص مخزون
  // لأن الفحص تم وقت الضغط على "قبول الطلب"

  const finalStatus =
    note.decision === 'مقبول' ? 'الطلب مقبول' : 'الطلب مرفوض';

  const matchedNotes = this.spendNotes.filter(n =>
    n.category === note.category &&
    n.userSignature === note.userSignature &&
    new Date(n.requestDate).toDateString() ===
      new Date(note.requestDate).toDateString() &&
    n.college === note.college
  );

  let updatedCount = 0;

  matchedNotes.forEach(n => {
    const updatedNote = {
      ...n,
      permissinStatus: finalStatus,
      rejectionReason:
        note.decision === 'مرفوض' ? note.rejectionReason : null
    };

    this.modeerService.updateSpendNoteStatus(n.id, updatedNote).subscribe({
      next: () => {
        updatedCount++;
        if (updatedCount === matchedNotes.length) {
          this.statusType = 'success';
          this.statusMessage =
            note.decision === 'مقبول'
              ? '✅ تم قبول الطلب بنجاح'
              : '❌ تم رفض الطلب وتسجيل سبب الرفض';
        }
      },
      error: () => {
        this.statusType = 'error';
        this.statusMessage = '❌ حدث خطأ أثناء تحديث الطلب';
      }
    });
  });

  this.groupedNotes = this.groupedNotes.filter(n => n !== note);
}


  cancelChange(note: any): void {
    note.showButtons = true;
    note.currentStatus = '';
    note.pendingStatus = '';
  }


  // 1. Add these properties to the class
statusMessage: string | null = null;
statusType: 'success' | 'error' | null = null;

// 2. Add the close method
closeStatusMessage(): void {
  this.statusMessage = null;
  this.statusType = null;
}

}
