import { Component, OnInit } from '@angular/core';
import { ModeerSercive } from '../../../services/modeer.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from "../../../components/footer/footer.component";
import { HeaderComponent } from "../../../components/header/header.component";

@Component({
  selector: 'app-modeer3',
  templateUrl: './modeer3.component.html',
  styleUrls: ['./modeer3.component.css'],
  imports: [CommonModule, FooterComponent, HeaderComponent]
})
export class Modeer3Component implements OnInit {

  spendNotes: any[] = [];
  groupedNotes: any[] = [];

  constructor(private modeerService: ModeerSercive) {}

  ngOnInit(): void {
    this.loadNotes();
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

  changeStatus(note: any, status: 'الطلب مقبول' | 'الطلب مرفوض'): void {

    const matchedNotes = this.spendNotes.filter(n =>
      n.category === note.category &&
      n.userSignature === note.userSignature &&
      new Date(n.requestDate).toDateString() === new Date(note.requestDate).toDateString() &&
      n.college === note.college
    );

    note.showButtons = false;
    note.currentStatus = status;
    note.pendingStatus = status;
  }

  confirmNote(note: any): void {
    const status = note.pendingStatus;

    const matchedNotes = this.spendNotes.filter(n =>
      n.category === note.category &&
      n.userSignature === note.userSignature &&
      new Date(n.requestDate).toDateString() === new Date(note.requestDate).toDateString() &&
      n.college === note.college
    );

    matchedNotes.forEach(n => {
      const updatedNote = { ...n, permissinStatus: status };
      this.modeerService.updateSpendNoteStatus(n.id, updatedNote)
        .subscribe({
          error: err => console.error('Update Error', err)
        });
    });

    // إزالة المذكرة من الصفحة بعد التحديث
    this.groupedNotes = this.groupedNotes.filter(n => n !== note);
  }

  cancelChange(note: any): void {
    note.showButtons = true;
    note.currentStatus = '';
    note.pendingStatus = '';
  }

}
