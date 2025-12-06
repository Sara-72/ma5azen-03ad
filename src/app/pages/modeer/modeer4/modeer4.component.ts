import { Router } from '@angular/router';
import { FormsModule, FormBuilder,ReactiveFormsModule, FormGroup, Validators ,FormArray } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';import { Component } from '@angular/core';

@Component({
  selector: 'app-modeer4',
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './modeer4.component.html',
  styleUrl: './modeer4.component.css'
})
export class Modeer4Component {

}
