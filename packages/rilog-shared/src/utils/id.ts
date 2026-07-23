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

export { generateUniqueId };
