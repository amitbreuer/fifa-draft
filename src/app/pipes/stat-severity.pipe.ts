import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statSeverity',
  standalone: true
})
export class StatSeverityPipe implements PipeTransform {
  transform(statValue: number): string {
    if (statValue >= 85) return '#22c55e'; // Green
    if (statValue >= 70) return '#eab308'; // Yellow
    if (statValue >= 55) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }
}