import { RIL_TOKEN } from '../constants';

/**
 * Generate unique token. Mostly it uses for generation personal client token (dependents on browser).
 * @return {string} unique token
 */
const generateToken = () => {
    const rand = () => Math.random().toString(32).substr(2);

    return rand() + rand() + rand();
};

/**
 * Generate unique id. Mostly it uses for id in the event object.
 * @return {string} unique id
 */
const generateUniqueId = () => {
    // Random number to make the ID unique
    const randomNumber = Math.random().toString(36).substr(2, 9);

    // Timestamp to ensure uniqueness even in case of concurrent calls
    const timestamp = Date.now().toString(36);

    // Combine random number and timestamp
    return randomNumber + timestamp;
};
/**
 * Set token for each not auth user for unique user registration
 * (here unique user mean open app in browser,
 * also user can enter self unique token is spec input for auth in another browser/device )
 * @return {string} client unique token
 */
const getUserUniqToken = (): string => {
    const savedToken = localStorage?.getItem(RIL_TOKEN);

    if (savedToken) {
        return savedToken;
    } else {
        const token = generateToken();
        localStorage.setItem(RIL_TOKEN, token);

        return token;
    }
};

export { getUserUniqToken, generateUniqueId };
