import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statName',
  standalone: true
})
export class StatNamePipe implements PipeTransform {
  transform(statKey: string): string {
    // Convert stat key to readable format
    return statKey
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }
}