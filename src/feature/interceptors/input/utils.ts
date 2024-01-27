const isInputElement = (event: any) => {
    return event.target.tagName.toLowerCase() === 'input';
};

export { isInputElement };
