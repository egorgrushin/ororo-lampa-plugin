import { EMPTY, pipe, throwError } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

export const createAffectLoadingState = (setter) => (observable) => {
    let stateCleared;
    return pipe(
        tap((value) => {
            setter?.({ isLoading: true, error: undefined }, false, value);
            stateCleared = false;
        }),
        switchMap((value) => observable.pipe(
            catchError((error) => {
                setter?.({ isLoading: false, error }, false, undefined);
                stateCleared = true;
                return rethrow ? throwError(error) : EMPTY;
            }),
        )),
        tap((value) => {
            setter?.({ isLoading: false }, false, value);
            stateCleared = true;
        }),
        finalize(() => {
            if (stateCleared) return;
            setter?.({ isLoading: false }, true, undefined);
        }),
    );
};
