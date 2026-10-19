import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TRANSLATE_IMPORTS } from 'simply-translate-angular';
import { StorageService } from '../../storage.service';

@Component({
  imports: [TRANSLATE_IMPORTS],
  selector: 'app-visits',
  template: `
    <div>
      <hr />
      @if (lang) {
        <i>{{ 'i_have_been_here_count' | translateTo: lang: { count: this.count, days: this.days } }}</i>
      } @else {
        <i>{{ 'i_have_been_here_count' | translate:{ count: this.count, days: this.days } }}</i>
      }
      |
      <button (click)="resetVisits()">X</button>
      <hr />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitsComponent implements OnInit {
  private _prefix: string;
  count?: number = 0;
  days?: number = 0;
  subs: Subscription;

  @Input()
  lang: string;

  constructor(private route: ActivatedRoute, private router: Router, private changeDetector: ChangeDetectorRef, private storageService: StorageService) {}

  ngOnInit(): void {
    this.changeDetector.detectChanges();
    this.subs = this.route.url.subscribe((segments) => {
      this._prefix = segments.map((it) => it.path).join('/');
      this.showVisits();
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }
  private calcDiffDays(date: Date) {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  protected resetVisits() {
    this.storageService.removeItem(this._prefix + 'count');
    this.storageService.removeItem(this._prefix + 'lastDate');
    this.showVisits();
  }

  private showVisits() {
    let count = this.storageService.getItem(this._prefix + 'count') ?? '-1';
    this.count = parseInt(count);
    this.count++;
    this.storageService.setItem(this._prefix + 'count', this.count);

    let lastDate_ = this.storageService.getItem(this._prefix + 'lastDate') ?? '';
    let lastDate: Date;
    if (lastDate) {
      lastDate = new Date(Date.parse(lastDate_));
    } else {
      lastDate = new Date();
      this.storageService.setItem(this._prefix + 'lastDate', lastDate.toDateString());
    }

    this.days = this.calcDiffDays(lastDate);
  }
}
