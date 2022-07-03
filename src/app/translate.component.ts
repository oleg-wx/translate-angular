import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StorageService } from './storage.service';
@Component({
  selector: 'app-view',
  template: `
    <div id="view_pipe">
      <h3>Pipe:</h3>
      <div>{{ 'hello_world' | translate }}</div>
      <div>{{ 'namespace' | translate }}</div>
      <b>{{ 'namespace.hello_user' | translate: { user: this.user || undefined } }}</b
      ><br />
      <small>{{ 'goodbye_world' | translate }}</small
      ><br />
      <i>{{ 'does_not_exist' | translate: { val: '125' }:{ value: 'Fallback with value: $!{val}', cases: { val: [['!!', ' [&{$#}] ']] } } }}</i>
    </div>
    <div id="view_directive">
      <div id="view_pipe">
        <h3>Directive:</h3>
        <div e2e translate="hello_world"></div>
        <div translate="namespace"></div>
        <b translate="namespace.hello_user" [values]="{ user: this.user || undefined }"></b><br />
        <small translate="goodbye_world"></small><br />
        <i
          translate="does_not_exist"
          [values]="{ val: '125' }"
          [fallback]="{ value: 'Fallback with value: $!{val}', cases: { val: [['!!', ' [&{$#}] ']] } }"
        ></i>
      </div>
    </div>
    <app-visits></app-visits>
    <hr />
    <h6>Same key: <b [translate]="'same_key'"></b></h6>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTranslateComponent implements OnInit, OnDestroy {
  user?: string;
  subs: Subscription;
  constructor(private route: ActivatedRoute, private changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subs = this.route.queryParamMap.subscribe((params) => {
      this.user = params.get('user');
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }
}
