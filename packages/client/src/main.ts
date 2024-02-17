import {
  APP_INITIALIZER,
  DEFAULT_CURRENCY_CODE,
  ErrorHandler,
  LOCALE_ID,
  enableProdMode,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { APP_CONFIG } from './environments/environment';
import * as SentryAngular from '@sentry/angular-ivy';
import { MainService } from './app/engine/services/main.service';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';

if (APP_CONFIG.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: ErrorHandler,
      useValue: SentryAngular.createErrorHandler(),
    },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    { provide: LOCALE_ID, useValue: 'pt' },
    {
      provide: APP_INITIALIZER,
      useFactory: MainService.factory,
      deps: [MainService],
      multi: true,
    },
  ],
});
