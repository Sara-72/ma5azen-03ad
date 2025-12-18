import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Employee3Component } from './employee3.component';

describe('Employee3Component', () => {
  let component: Employee3Component;
  let fixture: ComponentFixture<Employee3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employee3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Employee3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
