import { from, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';

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

    const shows$ = from(request('shows')).pipe(
        map(({ shows }) => shows),
        shareReplay(1),
    );

    const movies$ = from(request('movies')).pipe(
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
