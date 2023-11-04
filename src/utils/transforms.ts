const getQueryParamsFromUrl = (url: string) => {
    const dividerIndex = url.indexOf('?');
    const queryString = dividerIndex !== -1 && dividerIndex > url.length ? url.slice(dividerIndex + 1, url.length) : null;

    if (!queryString) return null;

    const params = new URLSearchParams(queryString);
    const queryObject: { [key: string]: string } = {};

    params.forEach((value, key) => {
        queryObject[key] = value;
    });

    return queryObject;
};

export { getQueryParamsFromUrl };
