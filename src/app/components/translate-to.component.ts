import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'translate-to',
  templateUrl: './translate-to.component.html',
})
export class TranslateToComponent {
  subs?: Subscription;
  lang?: string;
  user?: string;

  constructor(private route: ActivatedRoute, private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.subs = this.route.queryParamMap.subscribe((params) => {
      this.user = params.get('user');
      this.lang = params.get('lang');
      this.changeDetector.detectChanges();
    });
  }
}
