import { defaultIfEmpty, from, isObservable, Observable, of, take } from 'rxjs';
import { Dictionaries } from 'simply-translate';
import { LoadedDictionaries, TranslateServiceBase } from './translate.service';

/** Normalizes whatever a loader returned into an observable of dictionaries. */
export function asDictionaries$(loaded: LoadedDictionaries): Observable<Dictionaries> {
  if (isObservable(loaded)) {
    return loaded;
  }
  if (loaded instanceof Promise) {
    return from(loaded);
  }
  return of(loaded ?? {});
}

/**
 * The first dictionaries a loader produces, or `{}` when it completes without any.
 * Keeps one misbehaving loader from blocking or repeating its caller: a loader that
 * never completes after emitting, emits twice, or emits nothing (`catchError(() => EMPTY)`).
 */
export function firstDictionaries$(loaded: LoadedDictionaries): Observable<Dictionaries> {
  return asDictionaries$(loaded).pipe(take(1), defaultIfEmpty({} as Dictionaries));
}

/** Merges every language of `dictionaries` into the service. */
export function extendAll(service: TranslateServiceBase, dictionaries: Dictionaries | undefined) {
  if (!dictionaries) {
    return;
  }
  Object.keys(dictionaries).forEach((lang) => service.extendDictionary(lang, dictionaries[lang]));
}
