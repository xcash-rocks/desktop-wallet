import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren:  () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard], // Maybe this line is overkill because AdminComponent cannot be called without a child
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'wallet-dashboard',
        pathMatch: 'full'
      },
      {
        path: 'wallet-dashboard',
        loadChildren:  () => import('./modules/wallet-dashboard/wallet-dashboard.module').then(m => m.WalletDashboardModule)
      },
      {
        path: 'contacts',

        loadChildren:  () => import('./modules/contacts/contacts.module').then(m => m.ContactsModule)
      },
      {
        path: 'settings',

        loadChildren:  () => import('./modules/settings/settings.module').then(m => m.SettingsModule)
      },
      {
        path: 'xcashdpops',

        loadChildren:  () => import('./modules/xcashdpops/xcashdpops.module').then(m => m.XcashdpopsModule)
      },

    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  // Pre-Loading of modules : modules will be loaded in the background asynchronously just after the application is started
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
