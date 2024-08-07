import { from, shareReplay, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export const createOroroApi = (login, password) => {
    const baseUrl = 'https://front.ororo-mirror.tv/api/v2';
    const encoded = btoa(`${login}:${password}`);

    const request = (url) => {
        const fullUrl = `${baseUrl}/${url}`;

        return fetch(fullUrl, {
            headers: {
                // ororo.tv не умеет по другому
                Authorization: `Basic ${encoded}`,
            },
        }).then((response) => response.json());
    };

    const shows$ = of(undefined).pipe(
        switchMap(() => from(request('shows'))),
        map(({ shows }) => shows),
        shareReplay(1),
    );

    const movies$ = of(undefined).pipe(
        switchMap(() => from(request('movies'))),
        map(({ movies }) => movies),
        shareReplay(1),
    );

    const getShow = (showId) => request(`shows/${showId}`);
    const getMovie = (movieId) => request(`movies/${movieId}`);

    const getEpisode = (episode) => request(`episodes/${episode.id}`);

    return {
        shows$,
        movies$,
        getShow,
        getMovie,
        getEpisode,
    };
};
