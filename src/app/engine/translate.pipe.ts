import { ChangeDetectorRef, Pipe, PipeTransform } from "@angular/core";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

@Pipe({ name: 'customTranslate', pure: false })
export class CustomTranslatePipe implements PipeTransform {
  translatePipe: TranslatePipe;

  constructor(translate: TranslateService, _ref: ChangeDetectorRef) {
    this.translatePipe = new TranslatePipe(translate, _ref);
  }

  transform(value: any): string {

    return `${this.translatePipe.transform(value)}`;
  }
}
