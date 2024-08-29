import { Component } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-indication',
  templateUrl: './indication.component.html',
  styleUrl: './indication.component.css'
})
export class IndicationComponent {

  constructor(private router: Router,    private route: ActivatedRoute) {}

  startExam(): void {
    const examId = this.route.snapshot.params['id'];
    this.router.navigate(['worker/evaluaciones', examId]).then(r => console.log(r));
  }


  goBack() {
    this.router.navigate(['worker/examenes']).then(r => console.log(r));
  }
}
