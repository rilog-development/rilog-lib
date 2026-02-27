/**
 * Parses a raw Error.stack string and removes internal rilog-lib frames.
 * Returns only the frames from the consumer's application code.
 */
const parseStackTrace = (stack: string): string => {
    return stack
        .split('\n')
        .slice(1) // remove "Error" header line
        .filter((line) => !line.includes('Rilog.') && !line.includes('RilogInterceptor.') && !line.includes('MessageInterceptor.') && !line.includes('ConsoleInterceptor.'))
        .join('\n')
        .trim();
};

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

export { getQueryParamsFromUrl, parseStackTrace };
