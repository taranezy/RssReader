import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FeedManagerComponent } from './components/feed-manager/feed-manager';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FeedManagerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'RSS Reader';
}
