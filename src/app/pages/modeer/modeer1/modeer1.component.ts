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

  additions: any[] = [];

  constructor(private modeerSercive : ModeerSercive ) {}

  ngOnInit(): void {
    this.loadAdditions();
  }

  loadAdditions() {
    this.modeerSercive.getAdditions().subscribe({
      next: (data) => {
        console.log('API DATA:', data);
        this.additions = data;
      },
      error: (err) => {
        console.error('Error loading additions', err);
      }
    });
  }
}
