import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ExamenesRegistradosComponent } from './examenes-registrados.component';
import {EvaluacionesService} from "../../services/evaluaciones.service";
import { MessageService } from 'primeng/api'; // Ajusta la ruta según sea necesario
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('ExamenesRegistradosComponent', () => {
  let component: ExamenesRegistradosComponent;
  let fixture: ComponentFixture<ExamenesRegistradosComponent>;
  let evaluacionServiceMock: any;
  let messageServiceMock: any;

  beforeEach(async () => {
    evaluacionServiceMock = jasmine.createSpyObj('EvaluacionesService', ['getEvaluaciones', 'actualizarEvaluacion', 'deleteEvaluacion']);
    messageServiceMock = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, HttpClientTestingModule],
      declarations: [ExamenesRegistradosComponent],
      providers: [
        { provide: EvaluacionesService, useValue: evaluacionServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamenesRegistradosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should load evaluations on init', () => {
    const fakeEvaluations = [{ id: 1, titulo: 'Examen 1', descripcion: 'Desc 1', preguntas: [] }];
    evaluacionServiceMock.getEvaluaciones.and.returnValue(of(fakeEvaluations));
    component.ngOnInit();
    expect(component.evaluaciones.length).toBe(1);
    expect(component.evaluacionesFiltradas.length).toBe(1);
  });
  it('should decrement current index on previous', () => {
    component.indiceActual = 1;
    component.anterior();
    expect(component.indiceActual).toBe(0);
  });
  it('should handle save correctly', () => {
    component.evaluacionForm.setValue({
      id: '1', titulo: 'Examen 1', descripcion: 'Desc', preguntas: []
    });
    evaluacionServiceMock.actualizarEvaluacion.and.returnValue(Promise.resolve());
    component.guardarEvaluacion();
    expect(evaluacionServiceMock.actualizarEvaluacion).toHaveBeenCalled();
  });

});
