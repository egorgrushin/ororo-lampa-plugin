export const createOroroApi = () => {
    const baseUrl = 'https://front.ororo-mirror.tv/api/v2';

    const request = (url) => {
        const fullUrl = `${baseUrl}/${url}`;
        return fetch(fullUrl);
    };

    const getShows = () => request('shows');

    return {
        getShows,
    };
};
