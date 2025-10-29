import { Routes } from '@angular/router';
import { ListViewComponent } from './components/list-view/list-view';
import { GridViewComponent } from './components/grid-view/grid-view';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'list', component: ListViewComponent, canActivate: [authGuard] },
  { path: 'grid', component: GridViewComponent, canActivate: [authGuard] },
  { path: '', component: ListViewComponent }
];
