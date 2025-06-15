import { useRef, useEffect } from 'react';
import { v4 as uuid4 } from 'uuid';
import { skip } from 'rxjs'

//import { createGQLClient } from '../graphql/client';
import { LEAFIOmetamodel } from '../api/metamodel.js';
import { initializeLEAFlakeGQLClient } from '../api/leafio/leaflake.js';

// refactored the implementation from https://soshace.com/react-hooks-rxjs-or-how-react-is-meant-to-be/
// GosPersistentStateIO has connections to two different state rhelms, namely the backend memory and the frontend memory of a LEAF app.
// the backend memory i/o is done via graphql, whereas the frontend memory i/o is done via observable subscription. 
// the two memory rhelms can be in sync from instantiating a GosPersistentStateIO object. 
const useGosPersistentStateIO = (subject) => {
    //const [value, setState] = useState(subject.getValue());
    const stateObjInstanceID = useRef(uuid4());
    const value = useRef(subject.getValue());

    const appid = 'make this assignable via api';

    useEffect(() => {
        // for changes initiating from the frontend, the following subscription takes care of the upstream update chain
        //const sub = subject.pipe(skip(1)).subscribe(s => { 
        const sub = subject.pipe(skip(1)).subscribe(({control, data}) => { 
            // the first value has been skipped. the subsequent set value operation would be redundant otherwise.
            // reaching this point in code means data of interest (subject) has had a change. 
            // Two things can be done at this point:
            // 1. update the frontend (volatile) memory to be in sync with the change. 
            // 2. update the backend (persistent) memory to be in sync with the change.
            value.current = data; // update the frontend memory
            // update the backend memory
            if ( control.provenance.stateObjInstanceID !== stateObjInstanceID && control.provenance.dataOrigin !== LEAFIOmetamodel.OriginType.BACKEND ) {
                // do update the backend memory
            }
        }); 

        // subscribe to the backend changes
        const gql_subs_client = initializeLEAFlakeGQLClient(appid, setNewState);

        return () => sub.unsubscribe();
    });

    const setNewState = (state, dataOrigin=LEAFIOmetamodel.OriginType.FRONTEND) => subject.next({"control": {"provenance": {"stateObjInstanceID": stateObjInstanceID, "dataOrigin": dataOrigin}}, "data": state});

    const getCurrentState = () => value.current;

    return [getCurrentState, setNewState];
};

export { useGosPersistentStateIO };
