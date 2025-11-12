import { Routes } from '@angular/router';
import { ListViewComponent } from './components/list-view/list-view';
import { GridViewComponent } from './components/grid-view/grid-view';
import { NewsLookComponent } from './components/news-look/news-look';
import { SuggestedFeedsComponent } from './components/suggested-feeds/suggested-feeds';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'list', component: ListViewComponent },
  { path: 'grid', component: GridViewComponent, canActivate: [authGuard] },
  { path: 'news', component: NewsLookComponent, canActivate: [authGuard] },
  { path: 'suggested', component: SuggestedFeedsComponent, canActivate: [authGuard] },
  { path: '', component: ListViewComponent }
];
