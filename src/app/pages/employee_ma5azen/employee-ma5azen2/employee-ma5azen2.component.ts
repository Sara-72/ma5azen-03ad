import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { AdditionsService } from '../../../services/additions.service';

@Component({
  selector: 'app-employee-ma5azen2',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './employee-ma5azen2.component.html',
  styleUrl: './employee-ma5azen2.component.css'
})
export class EmployeeMa5azen2Component implements OnInit {
  userName: string = '';
  displayName: string = '';
  additions: any[] = [];

  private additionsService = inject(AdditionsService);

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadAdditions();
  }

  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  loadAdditions(): void {
    this.additionsService.getAllAdditions().subscribe({
      next: (data) => {
        this.additions = data;
      },
      error: (err) => {
        console.error('خطأ في جلب البيانات', err);
      }
    });
  }
}
