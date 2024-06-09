export const createOroroApi = () => {
    const baseUrl = 'https://front.ororo-mirror.tv/api/v2';
    const token = 'ZWdvcmdydXNoaW5AZ21haWwuY29tOkxhbGFlcHQy';
    const authorization = `Basic ${token}`;

    const request = (url) => {
        const fullUrl = `${baseUrl}/${url}`;

        return fetch(fullUrl, {
            headers: {
                Authorization: authorization,
            },
        }).then((response) => response.json());
    };

    const getShowsFragments = () => request('shows').then((data) => data.shows);

    const getShow = (showId) => request(`shows/${showId}`);

    return {
        getShowsFragments,
        getShow,
    };
};
