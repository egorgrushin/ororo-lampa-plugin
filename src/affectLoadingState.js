import { of, throwError } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

export const createAffectLoadingState = (setter) => (observable) => {
    let stateCleared;
    return of(undefined).pipe(
        tap(() => {
            setter?.({ isLoading: true, error: undefined }, false);
            stateCleared = false;
        }),
        switchMap(() => observable.pipe(
            catchError((error) => {
                setter?.({ isLoading: false, error }, false, undefined);
                stateCleared = true;
                return throwError(error);
            }),
        )),
        tap(() => {
            setter?.({ isLoading: false }, false);
            stateCleared = true;
        }),
        finalize(() => {
            if (stateCleared) return;
            setter?.({ isLoading: false }, true, undefined);
        }),
    );
};
