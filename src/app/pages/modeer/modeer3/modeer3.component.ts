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

  ngOnInit() {
    this.modeerService.getSpendNotes().subscribe({
      next: (data) => {
        this.spendNotes = data;
        this.groupedNotes = this.groupNotes(data);
      },
      error: (err) => console.error(err)
    });
  }

  groupNotes(notes: any[]): any[] {
    const map = new Map<string, any>();

    notes.forEach(note => {
      const date = new Date(note.requestDate);
      const dateStr = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
      const key = `${dateStr}-${note.category || ''}-${note.userSignature || ''}`;

      if (!map.has(key)) {
        map.set(key, {
          requestDate: note.requestDate,
          category: note.category,
          userSignature: note.userSignature,
          college: note.college,
          items: [{ itemName: note.itemName, quantity: note.quantity }]
        });
      } else {
        // إذا المذكرة موجودة مسبقاً، نضيف الصنف الجديد
        map.get(key).items.push({ itemName: note.itemName, quantity: note.quantity });
      }
    });

    return Array.from(map.values());
  }
}
