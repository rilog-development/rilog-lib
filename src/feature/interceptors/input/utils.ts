const isInputElement = (event: any) => {
    return event.target.tagName === 'INPUT';
};

export { isInputElement };
