import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-more',
  template: ` <hr />
    <div>
      DATES:
      <h4>{{ 'day_since_new_year' | translate: { days: day } }}</h4>
      <input [(ngModel)]="day" />
      <hr />
      <br />
    </div>`,
})
export class TryDateComponent implements OnInit {
  config: any[];
  day: number;

  constructor() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    this.day = Math.floor(diff / oneDay);
  }

  ngOnInit(): void {}
}
