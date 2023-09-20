import { RIL_TOKEN } from '../constants';
const generateToken = () => {
    const rand = () => Math.random().toString(32).substr(2);

    return rand() + rand() + rand();
};
/**
 * Set token for each not auth user for unique user registration
 * (here unique user mean open app in browser,
 * also user can enter self unique token is spec input for auth in another browser/device )
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

export { getUserUniqToken };
