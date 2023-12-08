export interface IRilogTimer {
    shortTimer: any;
    longTimer: any;

    startShort(afterTimeoutFn: () => void): void;
    clearShort(): void;

    startLong(afterTimeoutFn: () => void): void;
    clearLong(): void;
}
