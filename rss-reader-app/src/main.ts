import { bootstrapApplication } from '@angular/platform-browser';
import { enableDebugTools } from '@angular/platform-browser';
import { ApplicationRef } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig)
  .then((moduleRef) => {
    // Enable Angular DevTools in development mode
    if (!environment.production) {
      const applicationRef = moduleRef.injector.get(ApplicationRef);
      const appComponent = applicationRef.components[0];
      enableDebugTools(appComponent);
      
      // Expose Angular to global scope for DevTools detection
      (window as any).ng = {
        probe: enableDebugTools,
        coreTokens: {
          ApplicationRef: applicationRef
        }
      };
      
      console.log('✓ Angular DevTools enabled - Extension should now detect Angular');
    }
    return moduleRef;
  })
  .catch((err) => console.error(err));
