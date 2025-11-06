import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeautersComponent } from './features.component';

describe('FeautersComponent', () => {
  let component: FeautersComponent;
  let fixture: ComponentFixture<FeautersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeautersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeautersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
