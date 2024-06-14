import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UpperCamelCasePipe} from "../pipes/upper-camel-case.pipe";

@NgModule({
  declarations: [UpperCamelCasePipe],
  imports: [
    CommonModule
  ],
  exports: [UpperCamelCasePipe]
})
export class SharedModule { }
