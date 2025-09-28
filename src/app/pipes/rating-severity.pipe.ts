import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ratingSeverity',
  standalone: true
})
export class RatingSeverityPipe implements PipeTransform {
  transform(rating: number): string {
    if (rating >= 85) return 'success';
    if (rating >= 70) return 'warning';
    return 'danger';
  }
}