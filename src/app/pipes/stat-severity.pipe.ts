import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statSeverity',
  standalone: true
})
export class StatSeverityPipe implements PipeTransform {
  transform(statValue: number): string {
    if (statValue >= 85) return 'success'; // Green
    if (statValue >= 70) return 'warn'; // Yellow
    if (statValue >= 55) return 'info'; // Orange
    return 'danger'; // Red
  }
}