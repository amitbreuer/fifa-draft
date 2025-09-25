import { Routes } from '@angular/router';
import { SettingsComponent } from './components/settings/settings.component';
import { DraftComponent } from './components/draft/draft.component';

export const routes: Routes = [
  { path: '', component: SettingsComponent },
  { path: 'draft', component: DraftComponent },
  { path: '**', redirectTo: '' }
];
