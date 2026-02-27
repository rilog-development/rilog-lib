declare namespace NodeJS {
    interface ProcessEnv {
        RILOG_BASE_URL: string;
        RILOG_LOCAL_BASE_URL: string;
        RILOG_RIL_TOKEN: string;
        RILOG_RIL_EVENTS: string;
        RILOG_EVENTS_ARRAY_LIMIT: string;
        RILOG_LONG_TIMER_LIMIT: string;
        RILOG_SUCCESS_RESPONSE_STATUS_START_CODE: string;
        RILOG_TOKEN_GENERATION_SALT: string;
        RILOG_TOKEN_GENERATION_TIMESTAMP: string;
        RILOG_SELF_SENSETIVE_REQUEST: string;
        RILOG_SELF_SENSETIVE_CLICK_IDS: string;
        RILOG_MAX_LOCAL_STORAGE_SIZE: string;
        RILOG_MAX_EVENTS_SIZE_MB: string;
        RILOG_VERSION: string;
    }
}
