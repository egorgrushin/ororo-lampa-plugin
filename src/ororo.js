export const createOroroApi = () => {
    const baseUrl = 'https://front.ororo-mirror.tv/api/v2';
    const login = localStorage.getItem('ororo_login');
    const password = localStorage.getItem('ororo_password');
    const base64 = btoa(`${login}:${password}`);

    const request = (url) => {
        const fullUrl = `${baseUrl}/${url}`;

        return fetch(fullUrl, {
            headers: {
                Authorization: `Basic ${base64}`,
            },
        }).then((response) => response.json());
    };

    const getShowsFragments = () => request('shows').then(({ shows }) => shows);

    const getShow = (showId) => request(`shows/${showId}`);

    const getEpisodeDownloadUrl = (episode) =>
        request(`episodes/${episode.id}`).then(({ download_url }) => download_url);

    return {
        getShowsFragments,
        getShow,
        getEpisodeDownloadUrl,
    };
};
