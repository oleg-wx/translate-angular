import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
})
export class MoreComponent {
  config: any[];
  day: number;
  hello: string;
  constructor(router: Router) {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    this.day = Math.floor(diff / oneDay);


  }
}
