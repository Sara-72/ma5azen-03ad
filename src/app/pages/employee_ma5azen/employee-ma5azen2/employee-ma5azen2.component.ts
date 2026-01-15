import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { AdditionsService } from '../../../services/additions.service';
import { FormsModule } from '@angular/forms'; // ✅ هنا
@Component({
  selector: 'app-employee-ma5azen2',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
      FormsModule // ✅ أضفناه هناs
  ],
  standalone: true,
  templateUrl: './employee-ma5azen2.component.html',
  styleUrl: './employee-ma5azen2.component.css'
})
export class EmployeeMa5azen2Component implements OnInit {
  userName: string = '';
  displayName: string = '';
  additions: any[] = [];
searchCode: string = ''; // هذا للبحث
filteredAdditions: any[] = [];

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
applyFilter(): void {
  if (!this.searchCode) {
    this.filteredAdditions = this.additions;
  } else {
    const code = this.searchCode.toLowerCase();
    this.filteredAdditions = this.additions.filter(a => 
      a.additionCode.toString().toLowerCase().includes(code)
    );
  }
}

 loadAdditions(): void {
  this.additionsService.getAllAdditions().subscribe({
    next: (data) => {
      this.additions = data;
      this.applyFilter(); // فلترة أولية
    },
    error: (err) => {
      console.error('خطأ في جلب البيانات', err);
    }
  });
}

}
