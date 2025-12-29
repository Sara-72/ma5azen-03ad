import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modeer5Component } from './modeer5.component';

describe('Modeer5Component', () => {
  let component: Modeer5Component;
  let fixture: ComponentFixture<Modeer5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modeer5Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Modeer5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
