import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { SpendPermissionService } from '../../../services/spend-permission.service';

@Component({
  selector: 'app-ameen3',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './ameen3.component.html',
  styleUrls: ['./ameen3.component.css']
})
export class Ameen3Component implements OnInit {
userName: string = '';
  displayName: string = '';


  spendPermissions: any[] = [];

  constructor(private spendService: SpendPermissionService) {}

  ngOnInit(): void {
     this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadSpendPermissions();
  }
 getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';

    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');
  }

  loadSpendPermissions() {
    this.spendService.getAll().subscribe({
      next: (res: any[]) => {
        console.log('Spend Permissions:', res);
        this.spendPermissions = res;
      },
      error: (err) => {
        console.error('Error loading spend permissions', err);
      }
    });
  }
}
