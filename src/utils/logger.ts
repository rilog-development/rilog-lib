/**
 * Create a decorator function for logging
 */
const logMethods =
    (label: string) =>
    (target: any, memberName: string, descriptor: PropertyDescriptor): any => {
        /**
         * Get the original method
         */
        const originalMethod = descriptor.value;

        /**
         * Modify the descriptor to wrap the original method
         */
        descriptor.value = function (...args: any[]): any {
            /**
             *  Log method name and parameters
             */
            console.log(`[Rilog-lib debug] (${label}|${memberName}):`, JSON.stringify(args));
            /**
             * Call the original method
             */
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };

export { logMethods };
