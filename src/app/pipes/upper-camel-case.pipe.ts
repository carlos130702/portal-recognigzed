import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'upperCamelCase'
})
export class UpperCamelCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;
    return value.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}
