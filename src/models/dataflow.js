import { useState, useEffect } from 'react';
import { useGosVolatileStateIO } from '../index.js';
import { skip } from 'rxjs';

// operators to work on model, view, or intent states
const processData = (data, operatorFunc) => {
    data && operatorFunc(data);

    return data;
};

// implementation of the mvi (model-view-intent) framework (https://cycle.js.org/model-view-intent.html)
// to suit ghostos usage patterns in LEAF apps
// TLDR: MVI is a simple pattern to separate the main() function into three parts: 
// Intent (to listen to the user), Model (to process information), and View (to output back to the user).
const useMVIframework = ( subject ) => {
    const [getModelState, setModelState] = useGosVolatileStateIO(subject.getValue().model);
    const [getViewState, setViewState] = useGosVolatileStateIO(subject.getValue().view);
    const [getIntentState, setIntentState] = useGosVolatileStateIO(subject.getValue().intent);

    useEffect(() => {
        // data flow in the direction of intent -> model -> view in the mvi framework 
        const sub = subject.pipe(skip(1)).subscribe((s) => {
            processData(s.intent, setIntentState);
            processData(s.model, setModelState);
            processData(s.view, setViewState);
        }); // skip the first value, the subsequent setState() would be redundant otherwise

        return () => sub.unsubscribe();
    });

    const setNewMVIState = (state) => subject.next(state);

    return [getModelState, getViewState, getIntentState, setNewMVIState];
};

export { useMVIframework };