import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WalletDashboardComponent } from './wallet-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: WalletDashboardComponent
  },
  {
    path: 'wallet',
    loadChildren:  () => import('../wallet/wallet.module').then(m => m.WalletModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletHomeRoutingModule { }
