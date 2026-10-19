import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TRANSLATE_IMPORTS } from 'simply-translate-angular';
import { VisitsComponent } from './visits/visits.component';

@Component({
  imports: [TRANSLATE_IMPORTS, VisitsComponent],
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
