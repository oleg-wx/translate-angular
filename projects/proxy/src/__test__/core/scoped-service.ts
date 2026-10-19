import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateChild, TranslateService } from 'simply-translate-angular';

/** A TranslateService scoped to `id`, as `provideTranslateChild()` sets one up on a route. */
export function scopedService(id: string): TranslateService {
  return createEnvironmentInjector([provideTranslateChild({ id })], TestBed.inject(EnvironmentInjector)).get(TranslateService);
}
