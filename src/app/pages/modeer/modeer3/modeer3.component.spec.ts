import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modeer3Component } from './modeer3.component';

describe('Modeer3Component', () => {
  let component: Modeer3Component;
  let fixture: ComponentFixture<Modeer3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modeer3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Modeer3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
