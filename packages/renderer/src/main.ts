import { enableProdMode, inject, provideAppInitializer } from '@angular/core';

import { APP_CONFIG } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { AnimationController } from '@ionic/angular';
import { APP_ROUTES } from './app/app.routes';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MainService } from './app/engine/main.service';
import { AppComponent } from './app/app.component';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

if (APP_CONFIG.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      backButtonText: 'Back',
      scrollAssist: false,
      navAnimation: _ => new AnimationController().create(),
    }),
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
    provideAppInitializer(() => {
      const init = inject(MainService);
      return init.init();
    }),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
    }),
  ],
});
