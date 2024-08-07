import { of, throwError } from 'rxjs';
import { catchError, finalize, switchMap, tap, map } from 'rxjs/operators';

export const createAffectLoadingState =
    (setter) =>
    (...operators) =>
    (source) => {
        let stateCleared;
        return source.pipe(
            tap((value) => {
                setter?.({ isLoading: true, error: undefined }, false, value);
                stateCleared = false;
            }),
            switchMap((value) =>
                of(value).pipe(
                    ...operators,
                    catchError((error) => {
                        setter?.({ isLoading: false, error }, false, undefined);
                        stateCleared = true;
                        return throwError(error);
                    }),
                ),
            ),
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

export const switchWith = (project) => (source) =>
    source.pipe(
        switchMap((outerValue, index) =>
            project(outerValue, index).pipe(map((innerValue) => [outerValue, innerValue])),
        ),
    );
