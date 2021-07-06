import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
@Component({
    selector: 'app-view',
    template: `
        <div>
            APP:
            <h1>{{ 'hello_user' | translate: { user: 'Oleg' } }}</h1>
        </div>
        <small translate="welcome_to_app"></small>
    `,
    encapsulation: ViewEncapsulation.None,
})
export class AppViewComponent {
    config: any[];
    constructor() {}
}
