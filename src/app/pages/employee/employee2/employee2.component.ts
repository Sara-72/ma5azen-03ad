import { Component ,HostListener} from '@angular/core';
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



@HostListener('mousemove', ['$event'])
onMouseMove(event: MouseEvent) {
  const rows = document.querySelectorAll('tbody tr');
  rows.forEach((row: any) => {
    const rect = row.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    row.style.setProperty('--mouse-x', `${x}px`);
    row.style.setProperty('--mouse-y', `${y}px`);
  });
}}
