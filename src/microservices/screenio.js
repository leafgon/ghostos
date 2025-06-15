import { useRef, useEffect } from 'react';
import { v4 as uuid4 } from 'uuid';

import { LEAFIOmetamodel } from '../api/metamodel';

// spark_dev_note: in a typical usage scenario, states managed via useGosScreenStateIO would have direct connections to runtime properties of 
// leaf's visualization layer including threejs, the physics lib, the <canvas> element, and jsx. 
// Screen states can be synchronized with other volatile states (as per volatileio.js) via sharing a common subject through subscription. 

// refactored the implementation from https://soshace.com/react-hooks-rxjs-or-how-react-is-meant-to-be/
const useGosScreenStateIO = (subject) => {
    //const [value, setState] = useState(subject.getValue());
    const stateObjInstanceID = useRef(uuid4()); // assign a random uuid string as an instance ID
    const value = useRef(subject.getValue()); // state store

    useEffect(() => {
        //const sub = subject.pipe(skip(1)).subscribe(s => setState(s)); // skip the first value, the subsequent setState() would be redundant otherwise
        const sub = subject.pipe(skip(1)).subscribe(({control, data}) => { 
            // the first value has been skipped. the subsequent set value operation would be redundant otherwise.
            //value.current = s;
            value.current = data; // update screen properties as defined by a LEAF app. 
            // do what's necessary for the visualization layer to keep up with the change.
        }); 

        return () => sub.unsubscribe();
    }, []);

    //const setNewState = (state) => subject.next(state);
    const setNewState = (state, dataOrigin=LEAFIOmetamodel.OriginType.FRONTEND) => subject.next({"control": {"provenance": {"stateObjInstanceID": stateObjInstanceID, "dataOrigin": dataOrigin}}, "data": state});

    const getCurrentState = () => value.current;

    return [getCurrentState, setNewState];
};

export { useGosScreenStateIO };