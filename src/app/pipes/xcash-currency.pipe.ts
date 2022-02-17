import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';


@Pipe({
  name: 'xcash'
})
export class XcashCurrencyPipe extends DecimalPipe implements PipeTransform {

  transform(value: number, args?: any): any {
      let formatedByCurrencyPipe = super.transform(value);
      return formatedByCurrencyPipe + ' XCASH';
  }

}
