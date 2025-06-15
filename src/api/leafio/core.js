/*
 * author: spark@leautomaton.com
 * date: 8th Nov 2021
 */

// a framework of functions and data types for establishing "inter-graph-logic" communication i/o in GhostOS

// inter-graph-logic here means some logic that a (LEAF) programmer intends on establishing in between multiple disconnected graphs, 
// where each graph bears some (LEAF) logic and context. 
// "inter-graph-logic" communication means data/control communication between multiple (LEAF) graphs or logic involved.
import { useEffect, useRef, useState } from "react";
import { v4 as uuid4 } from 'uuid';

import { LEAFIOmetamodel } from "../metamodel.js";

import { BehaviorSubject, skip } from 'rxjs';

import { initializeLEAFlakeGQLClient } from "./leaflake.js";

// useLEAFIOapi is a react functional component exposing the leafio api.
//
// On a side note, for understanding ES6 argument destructuring, please refer to 
// https://simonsmith.io/destructuring-objects-as-function-parameters-in-es6
//
// useLEAFIOapi usage scenario:
// The best practice in designing LEAF apps is to follow the MVI dataflow model,  
// in which the three respective data domains of Model, View, and Intent provide
// a framework of sourcing (Intent), processing (Model) and presenting (View) data 
// as intended by the programmer. For example, consider the following snippet of code 
// declaring this react component as a constant within an ES6 function:
// 
// const [getCurLEAFIOState, setNewLEAFIOState, setLEAFIOCallback] = useLEAFIOapi(...);
// 
// The const currentState is an access handle to read the current state. currentState is
// a JSON object supposedly containing the most recent copy of any messages 
// obtained from subscribing to relevant i/o channels.
// 
// The const setNewLEAFIOState is a function to write data into the key'ed state and 
// mark the origin of data. It can be invoked as follows:
//
// setNewLEAFIOState(key, state, dataOrigin=LEAFIOmetamodel.OriginType.FRONTEND);
//
// The const setLEAFIOCallback is a function to register a programmer-defined callback function
// on a key'ed channel. The registered callback function would be invoked whenever a
// new block of data arrives in the corresponding key'ed channel, signified by a state change. 
// The following is the typical code usage pattern:
//
// setLEAFIOCallback(key, callbackFunc);
//

const useLEAFIOapi = ({_LEAFappList=[], stateObjInstanceID=uuid4(), dirOfSubjects = {}, permissions = {}, metamodel=LEAFIOmetamodel} = {}) => {
    //const [value, setState] = useState(subject.getValue()); // decided NOT to use useState in favor of useRef
    //const stateObjInstanceID = useRef(uuid4()); // assign a random uuid string as an instance ID
    //const [state, setState] = useState(LEAFIOmetamodel.IOStateGroundZero); // state store
    //const stateRef = useRef(state); 
    const [stateID, setStateID] = useState(uuid4()); 
    //const stateRef = useRef({...LEAFIOmetamodel.IOStateGroundZero}); // state store, making a shallow copy failed to limit the state scope to the local context as intended.
    const stateRef = useRef(JSON.parse(JSON.stringify(metamodel.breezyforest.IOStateGroundZero))); // state store, deep-copy the initialization object

    //useEffect(() => {
    //    stateRef.current = state;
    //}, [state]);
    const requestUpdate = () => { 
        setStateID(uuid4()); // request update by resetting the state ID
    };

    // a set of functions to offer switchboard functionalities to connect/disconnect leaf communication i/o 
    // (or inter-graph-logic communication) ports to subscription subjects.

    // spark_dev_note: the argument 'key' is used to specify the LEAFIO event accessable (or addressable) by using the key.
    // callbackFunc is for passing a user-defined function to be executed upon the key'ed LEAFIO event taking place. 
    // this API could be used to design/specify the complex inter-dynamics of spatio-temporal data in distributed networks.
    const setLEAFIOCallback = (key, callerid, callbackFunc=null) => {
        if (key in stateRef.current.subscriptions) {
            if (callbackFunc === null && callerid in delete stateRef.current.callbacks[key]) { // setLEAFIOCallback() can be used to remove the callbackFunc of a key'ed subscription. 
                //stateRef.current.callbacks[key] = {...stateRef.current.callbacks[key]}; // or to assign one anew.
                stateRef.current.callbacks = {...stateRef.current.callbacks, [key]: {...stateRef.current.callbacks[key]}}; // or to assign one anew.
                delete stateRef.current.callbacks[key][callerid]; // spark_dev_note: still unsure if this is the best way to deal with removing dictionary objects in javascript. only time will tell I guess...
            }
            else if (callbackFunc) {
                stateRef.current.callbacks = {...stateRef.current.callbacks, [key]: {...stateRef.current.callbacks[key], [callerid]: callbackFunc}}; // or to assign one anew.
                //stateRef.current.callbacks[key] = {...stateRef.current.callbacks[key], [callerid]: callbackFunc}; // or to assign one anew.
                //requestUpdate();
                //stateRef.current = {...stateRef.current, callbacks: {...stateRef.current.callbacks, }}
            }
        }
        else {
            console.error("leafio: an invalid key was used for storing a callback function: ", key);
        }
    };

    useEffect(() => {
        const invokeCallback = (key, control, data) => {
            if (key in stateRef.current.callbacks) {
                //console.log("invoking callback: ", key, control, data, stateObjInstanceID);
                //console.log("callback list: ", stateRef.current.callbacks[key]);
                Object.entries(stateRef.current.callbacks[key]).map(([callerid, callbackFunc]) => {
                    //console.log("executing the callback for callerid:", callerid);
                    callbackFunc({control, data});
                });
                return true;
            }
            else {
                return null;
            }
        };

        /*
         * initializeSubsDirectory() is a function to deal with instantiating main/bridge data communication 
         * channels based on the directory definition (i.e. "SubsDirectory") from metamodel.js
         * and to sort out the initial round of setting up data communication channels 
         * and their data-event-driven callback mechanism.
         * 
         * main data communication is done via subscribing to rx.js observables (i.e. BehaviorSubject) 
         * please refer to https://rxjs.dev/guide/subject#behaviorsubject for guidance
         * bridge data communication is done via graphql over websocket/https or via observable data streams over webrtc, 
         * again utilizing the subscription mechanism.
         * The release schedule of a GOS version supporting webRTC channels is to be determined. 
        **/
        const initializeSubsDirectory = () => {
            let subjectDirectory = {};
            // instantiate subscription subjects as listed in SubsDirectory
            Object.entries(metamodel.breezyforest.subsDirectory).forEach(([key, value]) => {
                // do instantiate
                if (key in dirOfSubjects) {
                    subjectDirectory[key] = dirOfSubjects[key]; // make a local reference of the value of global dirOfSubjects, under the same key
                    stateRef.current.permissions[key] = (key in permissions) ? permissions[key] : metamodel.breezyforest.IOAccessPermission.Observer; // defaults to "Observer" permission for foreign subjects
                }
                else {
                    subjectDirectory[key] = {
                        main: initializeSubsMain(),
                        bridges: {},//initializeSubsBridges(_LEAFappList, stateObjInstanceID, value['bridges'], () => {return subjectDirectory[key]}), 
                    }; // create a new subject accessable using the key
                    stateRef.current.permissions[key] = (key in permissions) ? permissions[key] : metamodel.breezyforest.IOAccessPermission.All; // defaults to "All" permission for subjects created locally
                }

                // initialize bridges
                // go over subjectDirectory[key].bridges

                // subscribe to the subject's main communication channel
                //stateRef.current.subscriptions[key] = subjectDirectory[key].main.pipe(skip(1)).subscribe(...);
                stateRef.current.subscriptions[key] = subjectDirectory[key].main.doSubscribe(
                    ({control, data}) => {
                        //console.log("got subscription message: " + key + " " + data);
                        stateRef.current.subsCache[key] = {control, data}; // store the up-to-date {control, data} pair observed in subscription messaging
                        // invoke a callback, if any, passing the new subscribed message as an argument
                        invokeCallback(key, control, data);
                        //if ( key in stateRef.current.callbacks ) {
                        //    stateRef.current.callbacks({control, data});
                        //}
                    }
                );
                //stateRef.current.callbacks[key] = {}; // initialize callback state
            });
            return subjectDirectory;
        };

        stateRef.current.dirOfSubjects = initializeSubsDirectory(); // initialize the directory of data subscriptions 

        return () => Object.entries(stateRef.current.subscriptions).forEach(([key, subscription]) => { 
            // unsubscribe from all channels upon component unmounting
            stateRef.current.dirOfSubjects[key].main.doUnsubscribe(subscription);
        }); 
    }, [dirOfSubjects, metamodel]); // rerun only if the master dirOfSubjects or metamodel changes

    //const setNewState = (state) => subject.next(state);
    //const setNewState = (state, dataOrigin=LEAFIOmetamodel.OriginType.FRONTEND) => subject.next({"control": {"provenance": {"stateObjInstanceID": stateObjInstanceID, "dataOrigin": dataOrigin}}, "data": state});
    const setNewLEAFIOState = (key, state, dataOrigin=LEAFIOmetamodel.breezyforest.originType.FRONTEND) => {
        try {
            if (stateRef.current.permissions[key] & metamodel.breezyforest.IOAccessPermission.Contributor) { // if permission exists to contribute to a subject.
                console.log("setting new subs message: ", state, stateObjInstanceID );
                // do handle the new state event by writing the new state data 
                // to the subject main channel
                stateRef.current.dirOfSubjects[key].main.doWrite( 
                    {
                        "control": {"provenance": {"stateObjInstanceID": stateObjInstanceID, "dataOrigin": dataOrigin}},
                        "data": state
                    }
                );
                return true;
            }
            else {
                const errormesg = 'leafio: permission not granted for contributing to a subject: ' + key;
                console.error(errormesg);
                return (stateRef.current.permissions[key] & metamodel.breezyforest.IOAccessPermission.Contributor); //false;
                //throw errormesg;
            }
        }
        catch(err) {
            console.error(err);
            return -1;
        }
    };

    //const getCurrentState = (key) => {return key ? stateRef.current.subsCache[key] : stateRef.current.subsCache};
    const getCurLEAFIOState = () => stateRef.current.subsCache; 
    //const getCurrentState = (key) => stateRef.current.subsCache[key];
    //const getCurrentState = (key) => {return {'key': key, 'hello': 'world'}};

    const getMasterSubsDir = () => stateRef.current.dirOfSubjects;

    //return [getCurrentState, setNewState, setCallback];
    //getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback
    return {getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback};
};

// initLEAFIOapi is to be used by nodejs in achieving the react equivalent of useLEAFIOapi defined above,
// in terms of initializing a LEAF compiler instance.
// all of the useRef(<data>) definitions have been replaced with the structurally compatible form of {current: <data>}
// all useState(<data>) have been replaced with just <data> constants.
const initLEAFIOapi = ({_LEAFappList=[], stateObjInstanceID=uuid4(), dirOfSubjects = {}, permissions = {}, metamodel=LEAFIOmetamodel} = {}) => {
    //const [value, setState] = useState(subject.getValue()); // decided NOT to use useState in favor of useRef
    //const stateObjInstanceID = useRef(uuid4()); // assign a random uuid string as an instance ID
    //const [state, setState] = useState(LEAFIOmetamodel.IOStateGroundZero); // state store
    //const stateRef = useRef(state); 
    //const stateRef = useRef({...LEAFIOmetamodel.IOStateGroundZero}); // state store, making a shallow copy failed to limit the state scope to the local context as intended.
    const stateRef = {current: JSON.parse(JSON.stringify(metamodel.breezyforest.IOStateGroundZero))}; // state store, deep-copy the initialization object

    // a set of functions to offer switchboard functionalities to connect/disconnect leaf communication i/o 
    // (or inter-graph-logic communication) ports to subscription subjects.

    // spark_dev_note: the argument 'key' is used to specify the LEAFIO event accessable (or addressable) by using the key.
    // callbackFunc is for passing a user-defined function to be executed upon the key'ed LEAFIO event taking place. 
    // this API could be used to design/specify the complex inter-dynamics of spatio-temporal data in distributed networks.
    const setLEAFIOCallback = (key, callerid, callbackFunc=null) => {
        if (key in stateRef.current.subscriptions) {
            if (callbackFunc === null && callerid in delete stateRef.current.callbacks[key]) { // setLEAFIOCallback() can be used to remove the callbackFunc of a key'ed subscription. 
                //stateRef.current.callbacks[key] = {...stateRef.current.callbacks[key]}; // or to assign one anew.
                stateRef.current.callbacks = {...stateRef.current.callbacks, [key]: {...stateRef.current.callbacks[key]}}; // or to assign one anew.
                delete stateRef.current.callbacks[key][callerid]; // spark_dev_note: still unsure if this is the best way to deal with removing dictionary objects in javascript. only time will tell I guess...
            }
            else if (callbackFunc) {
                stateRef.current.callbacks = {...stateRef.current.callbacks, [key]: {...stateRef.current.callbacks[key], [callerid]: callbackFunc}}; // or to assign one anew.
                //stateRef.current.callbacks[key] = {...stateRef.current.callbacks[key], [callerid]: callbackFunc}; // or to assign one anew.
                //requestUpdate();
                //stateRef.current = {...stateRef.current, callbacks: {...stateRef.current.callbacks, }}
            }
        }
        else {
            console.error("leafio: an invalid key was used for storing a callback function: ", key);
        }
    };

    // in lieu of a useEffect block
    const invokeCallback = (key, control, data) => {
        if (key in stateRef.current.callbacks) {
            //console.log("invoking callback: ", key, control, data, stateObjInstanceID);
            //console.log("callback list: ", stateRef.current.callbacks[key]);
            Object.entries(stateRef.current.callbacks[key]).map(([callerid, callbackFunc]) => {
                //console.log("executing the callback for callerid:", callerid);
                callbackFunc({control, data});
            });
            return true;
        }
        else {
            return null;
        }
    };

    /*
        * initializeSubsDirectory() is a function to deal with instantiating main/bridge data communication 
        * channels based on the directory definition (i.e. "SubsDirectory") from metamodel.js
        * and to sort out the initial round of setting up data communication channels 
        * and their data-event-driven callback mechanism.
        * 
        * main data communication is done via subscribing to rx.js observables (i.e. BehaviorSubject) 
        * please refer to https://rxjs.dev/guide/subject#behaviorsubject for guidance
        * bridge data communication is done via graphql over websocket/https or via observable data streams over webrtc, 
        * again utilizing the subscription mechanism.
        * The release schedule of a GOS version supporting webRTC channels is to be determined. 
    **/
    const initializeSubsDirectory = () => {
        let subjectDirectory = {};
        // instantiate subscription subjects as listed in SubsDirectory
        Object.entries(metamodel.breezyforest.subsDirectory).forEach(([key, value]) => {
            // do instantiate
            if (key in dirOfSubjects) {
                subjectDirectory[key] = dirOfSubjects[key]; // make a local reference of the value of global dirOfSubjects, under the same key
                stateRef.current.permissions[key] = (key in permissions) ? permissions[key] : metamodel.breezyforest.IOAccessPermission.Observer; // defaults to "Observer" permission for foreign subjects
            }
            else {
                subjectDirectory[key] = {
                    main: initializeSubsMain(),
                    bridges: {},//initializeSubsBridges(_LEAFappList, stateObjInstanceID, value['bridges'], () => {return subjectDirectory[key]}), 
                }; // create a new subject accessable using the key
                stateRef.current.permissions[key] = (key in permissions) ? permissions[key] : metamodel.breezyforest.IOAccessPermission.All; // defaults to "All" permission for subjects created locally
            }

            // initialize bridges
            // go over subjectDirectory[key].bridges

            // subscribe to the subject's main communication channel
            //stateRef.current.subscriptions[key] = subjectDirectory[key].main.pipe(skip(1)).subscribe(...);
            stateRef.current.subscriptions[key] = subjectDirectory[key].main.doSubscribe(
                ({control, data}) => {
                    //console.log("got subscription message: " + key + " " + data);
                    stateRef.current.subsCache[key] = {control, data}; // store the up-to-date {control, data} pair observed in subscription messaging
                    // invoke a callback, if any, passing the new subscribed message as an argument
                    invokeCallback(key, control, data);
                    //if ( key in stateRef.current.callbacks ) {
                    //    stateRef.current.callbacks({control, data});
                    //}
                }
            );
            //stateRef.current.callbacks[key] = {}; // initialize callback state
        });
        return subjectDirectory;
    };

    stateRef.current.dirOfSubjects = initializeSubsDirectory(); // initialize the directory of data subscriptions 

    const destructLEAFIOobj = () => {
        Object.entries(stateRef.current.subscriptions).forEach(([key, subscription]) => { 
            // unsubscribe from all channels upon component unmounting
            stateRef.current.dirOfSubjects[key].main.doUnsubscribe(subscription);
        }); 
    }; 
    // end of the "in lieu of a useEffect block"

    //const setNewState = (state) => subject.next(state);
    //const setNewState = (state, dataOrigin=LEAFIOmetamodel.OriginType.FRONTEND) => subject.next({"control": {"provenance": {"stateObjInstanceID": stateObjInstanceID, "dataOrigin": dataOrigin}}, "data": state});
    const setNewLEAFIOState = (key, state, dataOrigin=LEAFIOmetamodel.breezyforest.originType.FRONTEND) => {
        try {
            if (stateRef.current.permissions[key] & metamodel.breezyforest.IOAccessPermission.Contributor) { // if permission exists to contribute to a subject.
                console.log("setting new subs message: ", state, stateObjInstanceID );
                // do handle the new state event by writing the new state data 
                // to the subject main channel
                stateRef.current.dirOfSubjects[key].main.doWrite( 
                    {
                        "control": {"provenance": {"stateObjInstanceID": stateObjInstanceID, "dataOrigin": dataOrigin}},
                        "data": state
                    }
                );
                return true;
            }
            else {
                const errormesg = 'leafio: permission not granted for contributing to a subject: ' + key;
                console.error(errormesg);
                return (stateRef.current.permissions[key] & metamodel.breezyforest.IOAccessPermission.Contributor); //false;
                //throw errormesg;
            }
        }
        catch(err) {
            console.error(err);
            return -1;
        }
    };

    //const getCurrentState = (key) => {return key ? stateRef.current.subsCache[key] : stateRef.current.subsCache};
    const getCurLEAFIOState = () => stateRef.current.subsCache; 
    //const getCurrentState = (key) => stateRef.current.subsCache[key];
    //const getCurrentState = (key) => {return {'key': key, 'hello': 'world'}};

    const getMasterSubsDir = () => stateRef.current.dirOfSubjects;

    //return [getCurrentState, setNewState, setCallback];
    //getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback
    return {getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback, destructLEAFIOobj};
};

const initializeSubsBridges = (_LEAFappList, _stateObjInstanceID, _bridgesConfig, _getKeySubject) => {
    const bridges = {};
    if (!_bridgesConfig) {
        return bridges; // return empty object
    }

    if ('gql' in _bridgesConfig) {
        bridges.gql = {}; // initialize
        _LEAFappList.forEach((_leafappid) => { // go over the user-defined list of _leafappid states to listen to and set up their bridges
            bridges.gql[_leafappid] = { 
                handle: initializeLEAFlakeGQLClient(_leafappid, LEAFIOmetamodel.breezyforest.GQLParameters[_bridgesConfig.gql], (s, o) => {bridges.gql[_leafappid].doHandleRemoteChange(s,o)}),
                doHandleRemoteChange: (state, dataOrigin) => { // do something upon a remote data update event
                    // code to handle data changes in the graphql backend regarding _leafappid.
                    // The default action here is to simply bridge the backend change by writing about the changes to 
                    // the corresponding local channel.
                    _getKeySubject().main.doWrite(
                        {
                            control: {provenance: {stateObjInstanceID: _stateObjInstanceID, dataOrigin: dataOrigin, appID: _leafappid}},
                            data: state
                        }
                    );
                },
                doAddNode: async ({variables}) => {
                    // add a node using the handle qm_client
                    await bridges.gql[_leafappid].handle.qm_methods.addNode({variables});
                },
                doUpdateNode: async ({variables}) => {
                    // add a node using the handle qm_client
                    await bridges.gql[_leafappid].handle.qm_methods.updateNode({variables});
                },
                doDeleteNode: async ({node_uuid}) => {
                    await bridges.gql[_leafappid].handle.qm_method.delNode({node_uuid});
                },
                doAddEdge: async ({variables}) => {
                    await bridges.gql[_leafappid].handle.qm_methods.addEdge({variables});
                },
                doDeleteEdge: async ({edge_uuid}) => {
                    await bridges.gql[_leafappid].handle.qm_method.delEdge({edge_uuid});
                },
                doAddGraph: async ({variables}) => {
                    // add graph data consisting of nodes and edges 
                },
                doUpdateGraph: async ({variables}) => {
                    // update graph data 
                },
                doDeleteGraph: async ({variables}) => {
                    // delete graph data
                },
            };
        });
    }

    return bridges;
};

const leafioMessageDispatcher = (addressees) => (event) => {
    
};

// The '$' suffix in handle$ conventionally represents a rx.js stream
// https://javascript.plainenglish.io/reactive-programming-using-rxjs-operators-6b803c0ed7de
const initializeSubsMain = () => {
    const getSubjectMainHandle$ = () => subjectMain.handle$; // this getter function allows delayed reference from within the same json object
    const subjectMain = {
        handle$: new BehaviorSubject(), // initialize subject main write channel
        doWrite: (_data) => { // write operation
            return subjectMain.handle$.next(_data);
        }, 
        doSubscribe: (_eventCallback) => { // subscription operation
            const _handle$ = getSubjectMainHandle$();
            //return _handle$.pipe(skip(1)).subscribe((event)=>{_eventCallback(event)});
            return _handle$.pipe(skip(1)).subscribe(_eventCallback);
        },
        doUnsubscribe: (subscription) => {
            return subscription.unsubscribe();
        },
        doAddAddressee: (gqlrequest, nodeuuid) => {
        },
    };
    return subjectMain;
};

// The '_' prefixed arguments represent internal data not to be fiddled with, unless you work on developing the LEAFio API.
const initializeMasterSubsDirectory = (_stateObjInstanceID, _LEAFappList=[], _metamodel=LEAFIOmetamodel) => {
    let subjectDirectory = {};
    // instantiate subscription subjects as listed in SubsDirectory
    Object.entries(_metamodel.breezyforest.subsDirectory).forEach(([key, value]) => {
        // do instantiate
        subjectDirectory[key] = {
            main: initializeSubsMain(),
            bridges: {}, //initializeSubsBridges(_LEAFappList, _stateObjInstanceID, value['bridges'], ()=>{return subjectDirectory[key]}), 
        }; // create a new subject accessable using the key
    });
    return [_stateObjInstanceID, subjectDirectory];
};

//const initializeSubsDirectory = () => {
//    let subjectDirectory = {};
//    // instantiate subscription subjects as listed in SubsDirectory
//    Object.entries(metamodel.breezyforest.subsDirectory).forEach(([key, value]) => {
//        // do instantiate
//        //if (key in dirOfSubjects) {
//        //    subjectDirectory[key] = dirOfSubjects[key]; // make a local reference of the value of global dirOfSubjects, under the same key
//        //    stateRef.current.permissions[key] = (key in permissions) ? permissions[key] : metamodel.breezyforest.IOAccessPermission.Observer; // defaults to "Observer" permission for foreign subjects
//        //}
//        //else {
//        subjectDirectory[key] = {
//            main: initializeSubsMain(),
//            bridges: {},//initializeSubsBridges(_LEAFappList, stateObjInstanceID, value['bridges'], () => {return subjectDirectory[key]}), 
//        }; // create a new subject accessable using the key
//        //stateRef.current.permissions[key] = (key in permissions) ? permissions[key] : metamodel.breezyforest.IOAccessPermission.All; // defaults to "All" permission for subjects created locally
//        //}
//
//        // initialize bridges
//        // go over subjectDirectory[key].bridges
//
//        // subscribe to the subject's main communication channel
//        //stateRef.current.subscriptions[key] = subjectDirectory[key].main.pipe(skip(1)).subscribe(...);
//        stateRef.current.subscriptions[key] = subjectDirectory[key].main.doSubscribe(
//            ({control, data}) => {
//                //console.log("got subscription message: " + key + " " + data);
//                stateRef.current.subsCache[key] = {control, data}; // store the up-to-date {control, data} pair observed in subscription messaging
//                // invoke a callback, if any, passing the new subscribed message as an argument
//                invokeCallback(key, control, data);
//                //if ( key in stateRef.current.callbacks ) {
//                //    stateRef.current.callbacks({control, data});
//                //}
//            }
//        );
//        //stateRef.current.callbacks[key] = {}; // initialize callback state
//    });
//    return subjectDirectory;
//};

export { useLEAFIOapi, initLEAFIOapi, initializeMasterSubsDirectory }


