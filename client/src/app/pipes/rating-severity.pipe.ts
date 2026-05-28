import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ratingSeverity',
  standalone: true
})
export class RatingSeverityPipe implements PipeTransform {
  transform(rating: number): 'success' | 'warn' | 'danger' {
    if (rating >= 85) return 'success'; // Green
    if (rating >= 70) return 'warn'; // Yellow/Orange
    return 'danger'; // Red
  }
}
