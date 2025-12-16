import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { ModeerSercive } from '../../../services/modeer.service';

@Component({
  selector: 'app-modeer1',
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './modeer1.component.html',
  styleUrl: './modeer1.component.css'
})

export class Modeer1Component implements OnInit {

  getStoreKeeperStocks: any[] = [];

  constructor(private modeerSercive : ModeerSercive ) {}

  userName: string = '';
  displayName: string = '';


ngOnInit(): void {
  this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);

  this.loadAdditions();
}
getFirstTwoNames(fullName: string): string {
  if (!fullName) return '';

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}


  loadgetStoreKeeperStocks() {
    this.modeerSercive.getStoreKeeperStocks().subscribe({
      next: (data: any[]) => {
        console.log('STORE KEEPER STOCKS:', data);

        // 🔹 تحويل الداتا لنفس شكل getStoreKeeperStocks القديم
        this.getStoreKeeperStocks = data.map(item => ({
          id: item.id,
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity
          // زوّدي أي حقول كانت موجودة في getStoreKeeperStocks قبل كده
        }));
      },
      error: (err: any) => {
  console.error('Error loading store keeper stocks', err);
}

    });
  }
}
