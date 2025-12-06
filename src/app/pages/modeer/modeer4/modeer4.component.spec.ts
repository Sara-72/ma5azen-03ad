import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modeer4Component } from './modeer4.component';

describe('Modeer4Component', () => {
  let component: Modeer4Component;
  let fixture: ComponentFixture<Modeer4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modeer4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Modeer4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
