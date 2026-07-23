export type TInitResponse = {
    // for additional requests (example: save())
    access_token: string;
    // recording requests
    recording: boolean;
    // generated new unique token;
    newToken?: string;
};
