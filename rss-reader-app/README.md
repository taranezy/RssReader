# RSS Reader Application# RssReaderApp



A modern RSS reader web application built with Angular, inspired by Netvibes. This application allows you to manage RSS feed subscriptions, read news articles, and organize your content with a clean and intuitive interface.This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.5.



## Features## Development server



### Core FunctionalityTo start a local development server, run:

- **Add RSS Feeds**: Subscribe to any RSS/Atom feed by URL

- **Two View Modes**:```bash

  - **List View**: Traditional list showing all news items ordered by dateng serve

  - **Grid View**: Netvibes-style widget layout with colored boxes for each feed```

- **Read/Unread Tracking**: Mark articles as read/unread

- **Feed Management**: Add, remove, activate/deactivate feedsOnce the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

- **Color Coding**: Each feed has a unique color for easy identification

- **Filtering**: ## Code scaffolding

  - Filter by specific feeds

  - Show only unread itemsAngular CLI includes powerful code scaffolding tools. To generate a new component, run:

  - Mark all as read

- **Article Viewer**: Read articles in embedded iframe with easy back navigation```bash

- **Data Persistence**: All data stored in browser localStorage (file-based simulation)ng generate component component-name

```

### Technical Features

- Built with **Angular 19** (latest version)For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

- **SOLID Principles** implementation:

  - Single Responsibility Principle (SRP)```bash

  - Open/Closed Principle (OCP)ng generate --help

  - Liskov Substitution Principle (LSP)```

  - Interface Segregation Principle (ISP)

  - Dependency Inversion Principle (DIP)## Building

- **Standalone Components** (modern Angular approach)

- **Reactive Programming** with RxJSTo build the project run:

- **Type-safe** with TypeScript

- **Responsive Design** - works on desktop, tablet, and mobile```bash

- **No Database Required** - uses localStorage for data persistenceng build

```

## Getting Started

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

### Prerequisites

- Node.js (v18 or higher)## Running unit tests

- npm (comes with Node.js)

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

### Installation

```bash

1. Navigate to the project directory:ng test

```bash```

cd rss-reader-app

```## Running end-to-end tests



2. Install dependencies (if not already installed):For end-to-end (e2e) testing, run:

```bash

npm install```bash

```ng e2e

```

3. Start the development server:

```bashAngular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

npm start

```## Additional Resources

or

```bashFor more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

ng serve
```

4. Open your browser and navigate to:
```
http://localhost:4200
```

## Usage

### Adding a Feed

1. Click the "Manage Feeds" button at the top
2. Enter the RSS feed URL
3. Optionally enter a custom title
4. Click "Add Feed"

### Popular RSS Feeds to Try

- **New York Times**: https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
- **BBC News**: http://feeds.bbci.co.uk/news/rss.xml
- **TechCrunch**: https://techcrunch.com/feed/
- **Reddit r/programming**: https://www.reddit.com/r/programming/.rss
- **Hacker News**: https://news.ycombinator.com/rss

### Viewing Articles

#### List View
- Click on any article to open it in the embedded viewer
- Use the "Back to List" button to return
- Click the circle button to mark as read/unread

#### Grid View
- Each feed has its own colored widget showing the last 10 items
- Click on any article title to open it
- Unread count badge shows on each widget

### Managing Feeds

- **Refresh**: Click the refresh button on individual feeds or use "Refresh All"
- **Activate/Deactivate**: Toggle feeds on/off
- **Change Color**: Click on the colored square to choose a new color
- **Delete**: Click the ✕ button to remove a feed

## Architecture (SOLID Principles)

### Services
1. **LocalStorageService**: Handles data persistence (SRP)
2. **RssParserService**: Parses RSS/Atom feeds (SRP)
3. **RssFeedFetcherService**: Fetches RSS feeds via HTTP (SRP)
4. **RssFeedService**: Main service orchestrating feed management (DIP)

### Components
1. **HeaderComponent**: Navigation and filtering controls
2. **FeedManagerComponent**: Add, edit, and manage RSS subscriptions
3. **ListViewComponent**: Traditional list view of all articles
4. **GridViewComponent**: Netvibes-style grid/widget view

## Building for Production

```bash
ng build
```

---

Built with ❤️ using Angular and following SOLID principles
