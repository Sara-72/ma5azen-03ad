import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMa5azen5Component } from './employee-ma5azen5.component';

describe('EmployeeMa5azen5Component', () => {
  let component: EmployeeMa5azen5Component;
  let fixture: ComponentFixture<EmployeeMa5azen5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeMa5azen5Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeMa5azen5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
