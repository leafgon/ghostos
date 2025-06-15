import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { combineDataflows, zipDataflows, mergeDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { map, withLatestFrom, filter, switchMap, share } from 'rxjs/operators';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { isEmptyBottle } from '../../predicates.js';
import { doBottle, doUnbottle } from '../datautils/bottling.js';
import { Subject, combineLatest, of } from 'rxjs';

const getIOChannel = (dict) => {
    if (!dict)
        return 'appview'; // defaults to 'appview' channel
    const osview = Object.keys(dict).filter(x => (x === 'osview') || (x === 'osview2'));
    if (osview.length > 0)
        return osview[0]; // osview channel passed in
    else
        return 'appview';
}

// same as in App.js
function debounce(fn, ms) {
    let timer;
    return _ => {
        clearTimeout(timer);
        timer = setTimeout(_ => {
            timer = null
            fn.apply(this, arguments)
        }, ms);
    };
}
/*
 * _leafscreenio() is a dataflow-plane-scoped function for the LEAF node of logic type 'leafscreenio'.
 * it is used to declare a screen io object in a dataflow-scoped leaf component graph.
 */
const _leafscreenio = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        //const _leafnode = contextuallambda; // derivative leafnode
        //const _leafnode_logic = contextuallambda.uuid;
        
        // get the refnode w.r.t. the current leaf node
        //const refnode = refnodepath[0]; //leafgraph.graph.lambda.outNeighbors(contextuallambda[0])[0]; 
        //const refnode_logic = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
        //const contextual_lut = refnode ? parseLambdaLUT(contextuallambda, _refnode, _refnode_logic) : undefined;
        // get the refnode w.r.t. the contextuallambda nodes
        // check for parsing error conditions
        //if (!contextuallambda) { 
        //    throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
        //        `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        //}
        //if (!('_default' in contextual_lut)) {
        //  throw `LEAF error: the logical construct built using the ${_refnode_logic.type} node `+
        //        `(${_refnode}) called with args (${JSON.stringify(_refnode_logic.args)}) has no `+
        //        `default defined for its lambda, while being referenced by the leaflambdagraph node (${leafnode}). `+
        //        'A default lambda construct is required by the leaflambdagraph node.';
        //}
        
        // for the derivative nodelambda, look up the list of lambda leaf nodes connected to the defualt lambda entry node.
        // for the derivative contextuallambda, use current node's nodelambda.
        //const _nodelambda = leafgraph.edges.lambda.sourcelut[contextual_lut._default.uuid]; 

        //const thecorelogic = await etaReduceLambdaGraphs(contextual_lut._default.uuid, _nodelambda, _contextuallambda, leafgraph, graphcomponents);
        //const thecorelogic = await etaReduceLambdaGraphs({nodelambda: contextuallambda, contextuallambda: nodelambda});
        //const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda});

        // allow lambda for fudging around with different modes of actions of leafscreenio only in the os domain of breezyforest
        // spark_dev_note: 11/May/2023 
        // #emailinglist-lib #thirdpartydomain
        // the following (commented line of code) imposed restriction on non-breezyforest domain app logics 
        // by forcing them to write only to appview.
        // it was introduced as a security measure without fully understanding
        // the balance between "ease of use yet vulnerable" vs "cumbersome yet secure".
        // the trouble was seen when a breezyforest app used a library (emailinglist-lib) from 
        // a third-party domain (spark), which writes to osview2 but was forced to "appview" channel
        // without complaining about the restriction, and caused a heck of a lot debugging the funky
        // aftereffect. 
        // the restriction is lifted for now until a wider-scope reasoning is done on the matter. 
        //const reduced_lambda_obj = (lambdactrl.gos.etaTree.domain === 'breezyforest') ? await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree}) : {};
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
        const channelname = getIOChannel(reduced_lambda_obj);

        const node_context = {
            codebase: "leafscreenio.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        return (input$objArr, controlflow$obj) => { // identify function
            
            const _leafscreenio_postprocessfunc = (_data_in) => {
                const _rt_cache = {...node_context};
                //const _data_out = doUnbottle(undefined, _data_in); // unbottle all bottles
                //flowinterface.data_in.next(_data_in);

                // spark_dev_note:
                // leafio addressed to osview and osview2 gets heard by callbackOnLEAFIOosView & callbackOnLEAFIOosView2 in App.js
                // and the data expected by the two callback functions is array, so if the data is not in array
                // put it into an array and send. 
                const _data_in_arr = Array.isArray(_data_in) ? _data_in : [_data_in];
                // spark_dev_note: 19/Jun/2023
                // #databus
                //const _payload = _data_in_arr.map(_in => {
                //    return doUnbottle("screenio", exitDataBus({_bus: _in, _flatten:true}));
                //}).filter(_=>_);
                const _payload = _data_in_arr.map(_in => {
                    return doUnbottle("screenio", _in);
                }).filter(_=>_);
                // spark_dev_note: 31/July/2023
                // visual elements written to screenio in LEAF gets sent to App.js via leafio as in the following.
                // when previously written visual elements get closed (by user), via the LEAF coding pattern of
                // erasing any memory of visual elements using "amnesia", the "amnesia" memoryio would output 
                // "null" data that eventually gets passed down here as [null] through LEAF edge connectivity.
                // The above line of unbottling followed by filter(_=>_) would leave an empty array (ie [])
                // This empty array still needs to be written to the designated leafio channel, as a way to 
                // notify the relevant LEAFVisualElements object about the nulling event so it can react to
                // the user action. 
                //debounce(() => {
                console.log("screenio:", _payload);
                if (_payload !== undefined) {
                    lambdactrl.gos.leafio.getMasterSubsDir()[channelname].main.doWrite(
                        {
                            //"control": {"provenance": {"stateObjInstanceID": 'doineedthis', "dataOrigin": 'andthis'}},
                            //"data": {graph_data: graph_data}
                            "control": {},
                            "data": _payload
                        }
                    );
                }
                //    },
                //    20
                //)();

                const _data_out = doBottle("screenio","written"); // do nothing
                return _data_out;
            };

            const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                console.log("start debugging");
                //const _outflow_data$ = new ReplaySubject(1);
                const _outflow_data$ = new Subject(); // new ReplaySubject(1);
    
                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    //switchMap(_ctrl_in=> {
                    //    //flowinterface.ctrl_in.next(_ctrl_in);
                    //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_=>_._stream)]);
                    //}),
                    withLatestFrom(..._input$objArr.map(_=>_._stream)),
                    switchMap(_combined_in => {
                        const _next_data = _combined_in.slice(1).filter(_data=>_data!==undefined);
                        if (_next_data.length === 1) { // in and out, presence of input data indicates the intention of memory write
                            _outflow_data$.next(_next_data[0]); // publish the next available post-processed data via the data flow subject channel
                        }
                        else if (_next_data.length > 1)
                            _outflow_data$.next(_next_data);
                        //else { // out only, no input data indicates the intention of memory retrieval
                        //    //const memorybottle = domemoryio(undefined);
                        //    _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
                        //}
                        return of(_combined_in[0]); // only pass the ctrl data in the flow;
                    }),
                    share()
                );
                return {_stream: _outflow_data$, _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            }
            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
            const output$obj = driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, 
                {...node_context, metastep: "invoking screenio"}, 
                {
                    leaflogic: _nodeflowfunc, 
                    datalogic: {post: _leafscreenio_postprocessfunc}
                }
            );

            return output$obj;

            ////const mergedflow$obj = combineDataflows(refnode, flowinput$Arr);
            //const mergedflow$obj = combineDataflows(refnode, flowinput$Arr, false, false, false, {provenance: "leafdeckclub.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams

            //if (mergedflow$obj) {
            //    const mock_navnodeedges = [];
            //    //const mock_navnodeedges2 = [
            //    //// spark_dev_note: determine where the provenance of navnodeedges would be provided. in the bottle? or nowhere?
            //    //// the following structure is what's used in the leaf graph either for a node or for an edge
            //    ////        provenance: {  
            //    ////            graph: {domain: 'storm', appid: 'leafeditor'} // about the graph that initiated the creation of this edge
            //    ////        },
            //    //// for now (21 Feb 2022), we're sticking to the following structure for testing purposes
            //    //    {
            //    //        //label: '',
            //    //        source: {uuid: '308bd84f-3af2-478e-ae35-b2842a9bd3a2'}, 
            //    //        target: {uuid: '308bd84f-3af2-478e-ae35-b2842a9bd3a3'},
            //    //        uuid: 'aca6bb1e-44c6-41ff-94e6-742888cd8ff2', // an edge id unique in the domain
            //    //    },
            //    //];
            //    
            //    // spark_dev_note:
            //    // leafio addressed to osview and osview2 gets heard by callbackOnLEAFIOosView & callbackOnLEAFIOosView2 in App.js
            //    // and the data expected by the two callback functions is array, so if the data is not in array
            //    // put it into an array and send. 
            //    const outflow$ = mergedflow$obj._stream.pipe(
            //        map(
            //            _data => {
            //                debounce(() => {
            //                        const _payload = exitDataBus({_bus:_data, _flatten:true});
            //                        console.log("screenio:", _payload);
            //                        if (_payload !== undefined) {
            //                            lambdactrl.gos.leafio.getMasterSubsDir()[channelname].main.doWrite(
            //                                {
            //                                    //"control": {"provenance": {"stateObjInstanceID": 'doineedthis', "dataOrigin": 'andthis'}},
            //                                    //"data": {graph_data: graph_data}
            //                                    "control": {},
            //                                    "data": Array.isArray(_payload) ? _payload : [_payload]
            //                                }
            //                            );
            //                        }
            //                    },
            //                    20
            //                )();

            //                return _data;
            //                //return _data.map(
            //                //    x => {
            //                //        // {element: {gnav: {nodeuuid, componentloader}}}
            //                //        // spark_dev_note: currently x, as a result of leafmixflow, is an array, 
            //                //        // otherwise any non-array data are wrapped in an array here as a makeshift solution
            //                //        // make sure to confirm if this is normal and intended a leaf behavior.
            //                //        // also, this is where leafscreenio dispatches various kinds of screen io
            //                //        // including gnav and popupwindow. the current code base only supports gnav
            //                //        // and this is done without checking the destination element. refactor it to 
            //                //        // support multiple element destinations.  
            //                //        //const graph_data = {"nodes": Array.isArray(x) ? x : [x], "edges": mock_navnodeedges};
            //                //        //const graph_data = {"nodes": [], "edges": []};
            //                //        //sending a message down on the 'appview' channel 
            //                //        lambdactrl.gos.leafio.getMasterSubsDir()['appview'].main.doWrite( 
            //                //            {
            //                //                //"control": {"provenance": {"stateObjInstanceID": 'doineedthis', "dataOrigin": 'andthis'}},
            //                //                //"data": {graph_data: graph_data}
            //                //                "control": {},
            //                //                "data": x
            //                //            }
            //                //        );
            //                //        return x;
            //                //    }
            //                //)
            //                //return _data;
            //            }
            //        )
            //    )

            //    return {_stream: outflow$, _control: controlflow$obj}; 
            //}
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
            `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot `+
            'be defined as a lambda-scoped node.');
        return (flowinput$Arr, controlflow$obj) => { // identify function
            return {...(mergeDataflows(flowinput$Arr)), _control: controlflow$obj}; 
        };
    },
};

export { _leafscreenio };



