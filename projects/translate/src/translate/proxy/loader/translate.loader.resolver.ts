import { inject } from '@angular/core';
import { Dictionary } from 'simply-translate';
import { TranslateLoaderCache } from './translate.loader-cache';
import { TranslateService } from '../../translate.service';
import { ResolveFn } from '@angular/router';

export const translateLoaderResolver: (id: string) => ResolveFn<Dictionary | undefined> = (id: string) => {
  return () => {
    const provider = inject(TranslateLoaderCache);
    const service = inject(TranslateService);

    const lang = service.lang;
    if (!lang) {
      return undefined;
    }

    return provider.get(lang, id);
  };
};
