import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from 'simply-translate-angular';
@Component({
    selector: 'app-more',
    templateUrl: './more.component.html',
})
export class MoreComponent {
    config: any[];
    day: number;
    hello: string;
    constructor(private translate: TranslateService) {
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now.getTime() - start.getTime();
        var oneDay = 1000 * 60 * 60 * 24;
        this.day = Math.floor(diff / oneDay);

        this.hello = translate.translate('hello_user', { user: 'Oleg' })
        this.hello = translate.translateTo('ru-RU','hello_user', { user: 'Oleg' })
    }
}
