import { Component } from '@angular/core';
@Component({
  styles: [
    `
      :host {
        display: block;
        background: #ff000029;
      }
    `,
  ],
  template: `
    <a [routerLink]="['other']">other</a>
    <h6>Same key: <b [translate]="'same_key'"></b></h6>
    <h6>Same dyn: <b [translate]="'same_dyn'"></b></h6>
    <h6>Only root: <b [translate]="'only_root_key'"></b></h6>
  `,
})
export class DynamicComponent {
  constructor() {}
}
