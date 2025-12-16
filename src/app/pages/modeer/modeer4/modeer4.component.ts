import { Component, OnInit } from '@angular/core';
import { ModeerSercive } from '../../../services/modeer.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-modeer4',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './modeer4.component.html',
  styleUrl: './modeer4.component.css'
})
export class Modeer4Component implements OnInit {

  spendPermissions: any[] = [];

  constructor(private modeerService: ModeerSercive) {}

  ngOnInit(): void {
    this.loadSpendPermissions();
  }

  loadSpendPermissions(): void {
  this.modeerService.getSpendPermissions().subscribe({
    next: (data: any) => {
      this.spendPermissions = data.$values ?? [];
      console.log(this.spendPermissions);
    },
    error: (err) => {
      console.error(err);
    }
  });
}

}
