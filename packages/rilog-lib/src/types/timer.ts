export interface IRilogTimer {
    longTimer: any;

    startLong(afterTimeoutFn: () => void): void;
    clearLong(): void;
}
