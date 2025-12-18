import { Component ,OnInit, inject, signal} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray, AbstractControl,ValidationErrors,ValidatorFn} from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';


@Component({
  selector: 'app-employee3',
  imports: [
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './employee3.component.html',
  styleUrl: './employee3.component.css'
})
export class Employee3Component {

}
