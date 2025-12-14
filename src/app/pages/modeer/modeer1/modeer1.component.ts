import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { AdditionsService } from '../../../services/additions.service';
import { CommonModule } from '@angular/common';

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

  constructor(private additionsService: AdditionsService) {}

  ngOnInit(): void {
    this.loadAdditions();
  }

  loadAdditions() {
    this.additionsService.getAdditions().subscribe({
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
