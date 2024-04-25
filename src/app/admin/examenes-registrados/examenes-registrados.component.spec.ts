import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamenesRegistradosComponent } from './examenes-registrados.component';

describe('ExamenesRegistradosComponent', () => {
  let component: ExamenesRegistradosComponent;
  let fixture: ComponentFixture<ExamenesRegistradosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamenesRegistradosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamenesRegistradosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
