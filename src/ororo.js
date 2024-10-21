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

    const getShowsFragments = () => request('shows').then(({ shows }) => shows);
    const getMoviesFragments = () => request('movies').then(({ movies }) => movies);

    const getShow = (showId) => request(`shows/${showId}`);
    const getMovie = (movieId) => request(`movies/${movieId}`);

    const getEpisode = (episode) => request(`episodes/${episode.id}`);

    return {
        getShowsFragments,
        getMoviesFragments,
        getShow,
        getMovie,
        getEpisode,
    };
};
