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

  spendPermissions: any[] = [];

  constructor(private spendService: SpendPermissionService) {}

  ngOnInit(): void {
    this.loadSpendPermissions();
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
