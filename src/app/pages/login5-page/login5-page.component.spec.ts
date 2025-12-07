import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login5PageComponent } from './login5-page.component';

describe('Login5PageComponent', () => {
  let component: Login5PageComponent;
  let fixture: ComponentFixture<Login5PageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login5PageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login5PageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
