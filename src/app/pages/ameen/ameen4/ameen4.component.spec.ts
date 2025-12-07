import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ameen4Component } from './ameen4.component';

describe('Ameen4Component', () => {
  let component: Ameen4Component;
  let fixture: ComponentFixture<Ameen4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ameen4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ameen4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
