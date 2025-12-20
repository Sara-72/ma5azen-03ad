import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-employee2',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './employee2.component.html',
  styleUrl: './employee2.component.css'
})
export class Employee2Component {
  
 userName: string = '';
 displayName: string = '';

ngOnInit(): void {
  this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);

}
getFirstTwoNames(fullName: string): string {
  if (!fullName) return '';

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}
}
