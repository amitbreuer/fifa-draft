import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mainStatName',
  standalone: true
})
export class MainStatNamePipe implements PipeTransform {
  transform(statKey: string): string {
    return statKey.toUpperCase();
  }
}