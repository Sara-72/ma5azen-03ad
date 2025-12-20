import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-ma5azen5',
  imports: [
    HeaderComponent,
    FooterComponent,CommonModule
  ],
  templateUrl: './employee-ma5azen5.component.html',
  styleUrl: './employee-ma5azen5.component.css'
})
export class EmployeeMa5azen5Component {
 userName: string = '';
 displayName: string = '';


getFirstTwoNames(fullName: string): string {
  if (!fullName) return '';

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}
ngOnInit(): void {
  this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);

}
}
