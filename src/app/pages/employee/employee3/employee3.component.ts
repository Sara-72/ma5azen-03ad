import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { SpendNotesService } from '../../../services/spend-notes.service';

@Component({
  selector: 'app-employee3',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './employee3.component.html',
  styleUrls: ['./employee3.component.css']
})
export class Employee3Component implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
 
}
