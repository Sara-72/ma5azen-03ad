import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ameen5Component } from './ameen5.component';

describe('Ameen5Component', () => {
  let component: Ameen5Component;
  let fixture: ComponentFixture<Ameen5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ameen5Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ameen5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
