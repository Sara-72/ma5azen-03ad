import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { GlobalLoaderComponent } from './components/global-loader/global-loader.component';
import { LoadingService } from './services/loading.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalLoaderComponent,CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private router: Router, private loadingService: LoadingService) {

    // Listen to the routing process
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // As soon as a link is clicked, show the loader
        this.loadingService.show();
      }

      if (event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError) {

        // As soon as the page is finished loading, hide it
        // We add a small delay (500ms) so it doesn't flicker too fast
        setTimeout(() => {
          this.loadingService.hide();
        }, 500);
      }
    });
  }
}
