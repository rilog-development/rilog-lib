/**
 * Create a decorator function for logging
 */
const logMethods =
    (label: string, showArgs: boolean = false) =>
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
            console.log(`[Rilog-lib debug] (${label}|${memberName}):`, showArgs && JSON.stringify(args));
            /**
             * Call the original method
             */
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };

export { logMethods };
