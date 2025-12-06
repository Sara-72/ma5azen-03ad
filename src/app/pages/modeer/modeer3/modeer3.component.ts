import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, FormBuilder,ReactiveFormsModule, FormGroup, Validators ,FormArray } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-modeer3',
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './modeer3.component.html',
  styleUrl: './modeer3.component.css'
})
export class Modeer3Component {

}
