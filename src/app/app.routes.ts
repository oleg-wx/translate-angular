import { Routes } from '@angular/router';
import { TranslateToComponent } from './components/translate-to.component';
import { TryDateComponent } from './components/try-date.component';
import { SwitchLangComponent } from './switch-lang/switch-lang.component';
import { AppTranslateComponent } from './translate.component';
import { TryDirectiveComponent } from './try-directive/try-directive.component';
import { TryProxyComponent } from './try-proxy/try-proxy.component';

export const routes: Routes = [
  { path: 'translate', component: AppTranslateComponent },
  { path: 'translate-to', component: TranslateToComponent },
  { path: 'try-date', component: TryDateComponent },
  { path: 'switch-lang', component: SwitchLangComponent },
  { path: 'try-directive', component: TryDirectiveComponent },
  { path: 'try-proxy', component: TryProxyComponent },
  { path: 'dynamic', loadChildren: () => import('./dynamic/dynamic.routes').then((m) => m.routes) },
  { path: 'another-dynamic', loadChildren: () => import('./another-dynamic/dynamic.routes').then((m) => m.routes) },
];
