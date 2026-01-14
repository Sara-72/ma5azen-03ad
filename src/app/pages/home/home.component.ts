import { Component, HostListener, ElementRef, ViewChild, ViewChildren, QueryList} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service'; // Ensure this path is correct

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {


  translateX = 0;
  translateY = 0;
  shadowX = 0; // New
  shadowY = 0; // New


  constructor(
    private router: Router,
    private loadingService: LoadingService // Inject the service
  ) {}

  goToLogin() {
  this.loadingService.show(); // The solid white screen appears now

  setTimeout(() => {
    this.router.navigate(['/login5']).then(() => {
      this.loadingService.hide(); // The loading screen vanishes
    });
  }, 1500);
  }
}
