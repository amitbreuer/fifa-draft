import { Routes } from '@angular/router';
import { SettingsComponent } from './components/settings/settings.component';
import { DraftComponent } from './components/draft/draft.component';
import { SummaryComponent } from './components/summary/summary.component';

export const routes: Routes = [
  { path: '', component: SettingsComponent },
  { path: 'draft', component: DraftComponent },
  { path: 'summary', component: SummaryComponent },
  { path: '**', redirectTo: '' }
];
