export const createOroroApi = () => {
    const baseUrl = 'https://front.ororo-mirror.tv/api/v2';
    const token =
        'eyJfcmFpbHMiOnsibWVzc2FnZSI6Ilcxc3lNVGcyTnpZMFhTd2ljRmd0VFhKcVFVVkJUREoxUVZkblFUYzVXRUVpTENJeE56SXlPRGd3TXpjM0xqQXpNVGt4TXlKZCIsImV4cCI6IjIwMjUtMDgtMDVUMTc6NTI6NTcuMDMxWiIsInB1ciI6ImNvb2tpZS5yZW1lbWJlcl91c2VyX3Rva2VuIn19--bd67f7517e43f19b2747c7b6d33c525a50ca8132';

    const request = (url) => {
        const fullUrl = `${baseUrl}/${url}`;

        return fetch(fullUrl, {
            headers: {
                Cookie: `remember_user_token=${token}`,
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
