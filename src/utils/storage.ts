const calculateLocalStorageSizeInMB = (): Promise<number> => {
    return new Promise((resolve, reject) => {
        let totalSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const item = localStorage.getItem(key);
                if (item) {
                    // Convert the string to bytes to calculate its size
                    const sizeInBytes = new Blob([item]).size;
                    // Convert bytes to megabytes and add to total size
                    totalSize += sizeInBytes / (1024 * 1024);
                }
            }
        }

        resolve(totalSize);
    });
};

const calculateStringSizeInMB = (str: string): number => {
    // Convert the string to bytes to calculate its size
    const sizeInBytes = new Blob([str]).size;
    // Convert bytes to megabytes
    return sizeInBytes / (1024 * 1024);
};

const calculateLocalStorageValueSizeInMB = (key: string): Promise<number> => {
    return new Promise((resolve) => {
        let totalSize = 0;
        const item = localStorage.getItem(key);

        if (item) {
            // Convert the string to bytes to calculate its size
            const sizeInBytes = new Blob([item]).size;
            // Convert bytes to megabytes and add to total size
            totalSize += sizeInBytes / (1024 * 1024);
        }

        resolve(totalSize);
    });
};

export { calculateStringSizeInMB, calculateLocalStorageSizeInMB, calculateLocalStorageValueSizeInMB };
