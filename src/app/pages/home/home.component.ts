import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private router: Router) { }


  goToLogin() {

    this.router.navigate(['/login5']);
    console.log('Navigating to login page...');
  }

}
