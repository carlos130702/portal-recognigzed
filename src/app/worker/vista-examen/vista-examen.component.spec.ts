import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaExamenComponent } from './vista-examen.component';

describe('VistaExamenComponent', () => {
  let component: VistaExamenComponent;
  let fixture: ComponentFixture<VistaExamenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VistaExamenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VistaExamenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
