import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter, share } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { isBottle } from '../../predicates.js';
import { driveDataflowByCtrlflow } from '../../leaf.js';

const enforceBooleanResults = (errorLocationStr) => {
    return (predicate, _flowinput$) => {
        return _flowinput$.pipe(map((unitflowdata)=>{ // unitflowdata is supposed to be an array
            //const predicateresult = predicate(unitflowdata);
            const predicateresult = unitflowdata.map((_data)=>{
                const a_result = predicate(_data);
                if (typeof a_result !== 'boolean')
                    throw 'LEAF Error: flow data failed to pass the boolean type requirement, ' + errorLocationStr;
                return a_result;
            });
            return predicateresult;
        }));
    };
};
/*
 * _leafcrate() is a runtime function for the LEAFgraph node of logic type 'leafdatacrate'.
 * it is used to put any bottles passed to the leaf node via its incoming data flow into a crate.
 * Any non-bottle data are discarded in the flow.
 * @nodeconfig: to carry any compile time configs for the LEAFgraph node (configs TBD, 29 Jan 2022)
 * @lambdaFunc: a predicate that evaluates incoming data flow for inclusion in the debottling.  
 * The default is to return true for everything. The lambda may be overriden to have any non-default function 
 * defined in the context of the calling LEAF graph.
 * @graphContextual: n/a
 */
//const _leafcrate = ({nodeconfig={}}={}, lambdaFunc=x=>true, graphContextual) => {}
const _leafcrate = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        const node_context = {
            codebase: "leafcrate.js",
            refnode, 
            leafnode: refnode && lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        const openTheBottle = (_bottlekey, _bottlecrate) => {
            return (_bottlekey in _bottlecrate) ? _bottlecrate[_bottlekey] : null;
        };

        const getCrateTagLabelText = () => {
            const _candidates = Object.keys(reduced_lambda_obj).filter(_key=>(Object.keys(reduced_lambda_obj[_key]).length === 0 ));
            return (_candidates.length > 0) ? _candidates.sort().join(";") : undefined;
        };

        const cratetag_text = getCrateTagLabelText();
    
        const checkDataflowType = enforceBooleanResults('in the leafdataunbottle lambda');
        return (input$objArr, controlflow$obj) => {
            const _outflow_data$ = new Subject(); //new BehaviorSubject(raceConditionError);

            const _outflow_ctrl$ = controlflow$obj._stream.pipe(
                withLatestFrom(...input$objArr.map(_obj=>_obj._stream)),
                map(_combined_in => {
                    const combinedcrate = {_cratelabel: cratetag_text ? {tag: cratetag_text} : {}};
                    const is_array_input = Array.isArray(_combined_in[1])

                    const _next_data = (is_array_input ? _combined_in[1] : [_combined_in[1]]).flat().map(_unitdata => { // filter incoming bottles
                        // mix require bottled input
                        return (isBottle(_unitdata) && _unitdata._label.tag && typeof(_unitdata._label.tag) === "string") ? _unitdata : undefined;
                    }).filter(_unitdata => { // filter out undefined or "empty_data"
                        return (_unitdata !== undefined); //( isEmptyBottle(_unitdata));
                    }); 

                    _next_data.map(_btl => {
                        combinedcrate[_btl._bname] = (_btl._bname in combinedcrate) ? [...combinedcrate[_btl._bname], _btl] : [_btl];
                    })

                    if (Object.keys(combinedcrate).length > 1) {
                        _outflow_data$.next(combinedcrate); // publish the next available post-processed data via the data flow subject channel

                        return _combined_in[0]; // only pass the ctrl data in the main flow;
                    }
                    return undefined
                }),
                filter(_=>_!==undefined),
                share()
            );
            return {_stream: _outflow_data$.pipe(
                map(x => {
                    return x;
                }),
                share()
            ), _control: {...controlflow$obj, _stream: _outflow_ctrl$}};
            //const output$obj = driveDataflowByCtrlflow(
            //    {_stream: _outflow_ctrl$}, [{_stream: _outflow_data$}], undefined, 
            //    {...node_context, metastep: "driving leafcrate "}, 
            //    {
            //        //leaflogic: _defaultLambda, 
            //        datalogic: {pre: (_data_in) => {
            //            return _data_in;
            //        }}
            //    }
            //);
            //return output$obj;
            //const flowoutput$ = flowinput$.pipe(
            //    // process crating bottles
            //    map(([unitdata]) => { // unitdata is supposed to be an instance of an array of node inputs
            //        // iterate over the crate
            //        if (typeof unitdata === 'object' && unitdata !== null && !('_datatype' in unitdata)) { // a crate
            //            Object.entries(unitdata).map(([bottle_key, bottle_content]) => { // for each bottle in the crate
            //                if (bottle_key in combinedcrate) // if duplicate key exists in the crate
            //                    combinedcrate[bottle_key] = [].concat(combinedcrate[bottle_key], bottle_content); // merge them into an array
            //                else
            //                    combinedcrate[bottle_key] = bottle_content;
            //            });
            //        }
            //    })
            //);

            //return {...flowoutput$, _control: controlflow$obj};
            // no label to unbottle anything with, just return nothing
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const output$obj = etafunc(input$Arr, controlflow$obj);
                return {...output$obj, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};

export { _leafcrate };
