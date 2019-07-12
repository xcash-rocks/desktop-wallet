import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { main_menuRoutingModule } from './main_menu-routing.module';
import { main_menuComponent } from './main_menu.component';
import {SharedModule} from '../../../theme/shared/shared.module';
import {NgbProgressbarModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    main_menuRoutingModule,
    SharedModule,
    NgbProgressbarModule
  ],
  declarations: [main_menuComponent]
})
export class main_menuModule { }
