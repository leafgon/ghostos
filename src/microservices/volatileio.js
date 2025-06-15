import { useRef, useEffect } from 'react';
import { v4 as uuid4 } from 'uuid';
import { skip } from 'rxjs'

import { LEAFIOmetamodel } from '../api/metamodel.js';

// refactored the implementation from https://soshace.com/react-hooks-rxjs-or-how-react-is-meant-to-be/
const useGosVolatileStateIO = (subject) => {
    //const [value, setState] = useState(subject.getValue());
    const stateObjInstanceID = useRef(uuid4()); // assign a random uuid string as an instance ID
    const value = useRef(subject.getValue()); // state store

    useEffect(() => {
        //const sub = subject.pipe(skip(1)).subscribe(s => setState(s)); // skip the first value, the subsequent setState() would be redundant otherwise
        //const sub = subject.pipe(skip(1)).subscribe(s => { })
        const sub = subject.pipe(skip(1)).subscribe(({control, data}) => { 
            // the first value has been skipped. the subsequent set value operation would be redundant otherwise.
            //value.current = s;
            value.current = data;
        }); 
        

        return () => sub.unsubscribe();
    });

    //const setNewState = (state) => subject.next(state);
    const setNewState = (state, dataOrigin=LEAFIOmetamodel.OriginType.FRONTEND) => subject.next({"control": {"provenance": {"stateObjInstanceID": stateObjInstanceID, "dataOrigin": dataOrigin}}, "data": state});

    const getCurrentState = () => value.current;

    return [getCurrentState, setNewState];
};

export { useGosVolatileStateIO };