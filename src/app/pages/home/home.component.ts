import { Component ,HostListener} from '@angular/core';
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


  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    // Moves the boxes layer (Sensitive)
    this.translateX = (e.clientX - window.innerWidth / 2) / 50;
    this.translateY = (e.clientY - window.innerHeight / 2) / 30;

    // Moves the text shadow (Subtle)
    this.shadowX = (e.clientX - window.innerWidth / 2) / 80;
    this.shadowY = (e.clientY - window.innerHeight / 2) / 80;
  }
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
