import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';




interface PhotoAttachment {
  file: File;
  previewUrl: string;
}
@Component({
  selector: 'app-elda3m',
  standalone: true, // Ensure standalone is true if you're importing components directly
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './elda3m.component.html',
  styleUrl: './elda3m.component.css'
})


export class Elda3mComponent {
attachments: PhotoAttachment[] = [];
  showSuccessModal: boolean = false;

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.attachments.push({ file: file, previewUrl: e.target.result });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removePhoto(index: number) {
    this.attachments.splice(index, 1);
  }

  submitForm() {
    this.showSuccessModal = true;
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  // closeModal() {
  //   this.showSuccessModal = false;
  //   document.body.style.overflow = 'auto'; // Restore scroll
  //   this.attachments = []; // Clear photos on success
  // }
}

