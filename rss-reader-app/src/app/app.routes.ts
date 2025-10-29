import { Routes } from '@angular/router';
import { ListViewComponent } from './components/list-view/list-view';
import { GridViewComponent } from './components/grid-view/grid-view';

export const routes: Routes = [
  { path: '', redirectTo: '/list', pathMatch: 'full' },
  { path: 'list', component: ListViewComponent },
  { path: 'grid', component: GridViewComponent },
  { path: '**', redirectTo: '/list' }
];
