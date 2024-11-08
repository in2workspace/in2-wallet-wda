import { Routes } from '@angular/router';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';
import { logsEnabledGuard } from './guards/logs-enabled.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tabs/credentials',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'credentials',
        canActivate: [AutoLoginPartialRoutesGuard],
        loadComponent: () =>
          import('./pages/credentials-tab/credentials-tab.component').then(
            (m) => m.CredentialsTabComponent
          ),
          children: [
            {
              path:'',
              redirectTo: '/tabs/credentials/list',
              pathMatch: 'full',
            },
            { 
              path: 'list', 
              loadComponent: () =>
                import('./pages/credentials/credentials.page').then(
                  (m) => m.CredentialsPage
                ),
            },
            {
              path: 'scanner',
              loadComponent: () =>
                import('./pages/scan/scan.component').then(
                  (m) => m.ScanComponent
                ),
            }
          ]
      },
      {
        path: 'settings',
        canActivate: [AutoLoginPartialRoutesGuard],

        loadComponent: () =>
          import('./pages/settings/settings.page').then((m) => m.SettingsPage),
        children: [],
      },
      {
        path: 'language-selector',
        canActivate: [AutoLoginPartialRoutesGuard],
        loadComponent: () =>
          import('./pages/language-selector/language-selector.page').then(
            (m) => m.LanguageSelectorPage
          ),
      },
      {
        path: 'camera-selector',
        canActivate: [AutoLoginPartialRoutesGuard],
        loadComponent: () =>
          import('./pages/camera-selector/camera-selector.page').then(
            (m) => m.CameraSelectorPage
          ),
      },
      {
        path: 'logs',
        canActivate:[AutoLoginPartialRoutesGuard, logsEnabledGuard],
        loadComponent: () =>
          import('./pages/logs/logs.page').then(
            (m) => m.LogsPage
          ),
          children:[
            {
              path:'',
              loadComponent: () =>
                import('./pages/logs/logs/logs.component').then(
                  (m) => m.LogsComponent
                )
            },
            {
            path: 'camera',
            loadComponent: () =>
              import('./pages/logs/camera-logs/camera-logs.page').then(
                (m) => m.CameraLogsPage
                )
          }]
      },
      {
        path: 'vc-selector',
        canActivate: [AutoLoginPartialRoutesGuard],
        loadComponent: () =>
          import('./pages/vc-selector/vc-selector.page').then(
            (m) => m.VcSelectorPage
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/credentials',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/callback/callback.page').then((m) => m.CallbackPage),
  },
];
