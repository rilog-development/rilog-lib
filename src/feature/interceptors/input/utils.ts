const isInputElement = (event: any) => {
    console.log('isInputElement ', event.target.tagName);

    return event.target.tagName.toLowerCase() === 'input';
};

export { isInputElement };
