import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, concatMap, withLatestFrom, filter } from 'rxjs/operators';
import { isBottle, isCrate } from '../../predicates.js';
import { of, zip } from 'rxjs';
import { combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { doBottle } from './bottling.js';

/*
 * _leafbottle() is a runtime function for the LEAFgraph node of logic type 'leafdatabottle'.
 * it is used to bottle any data being passed to the leaf node via its incoming data flow.
 * @bottlekey: a string reference to be used for the new bottle 
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying a string or a list of strings. 
 * The output of which, if defined, is used preemptively in lieu of @bottlekey.
 * The node would return bottle(s) after bottling them. 
 * @graphContextual: n/a
 */
//const _leafdataBottle = ({bottlekey=''}={}, lambdaFunc=undefined, graphContextual) => {}
const _leafbottle = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        const removeLabel = (_label, _bottle) => {
            if (_label in _bottle._label)
                _bottle._label[_label] -= 1;
                if (_bottle._label[_label] === 0)
                    delete _bottle._label[_label]; // runtime leafdata garbage collection :) pun intended of course...
            return _bottle;
        };

        const getBottleTagLabelText = () => {
            const _candidates = Object.keys(reduced_lambda_obj).filter(_key=>(Object.keys(reduced_lambda_obj[_key]).length === 0 ));
            return (_candidates.length > 0) ? _candidates.sort().join(";") : undefined;
        };

        const _tag_text = getBottleTagLabelText();
    
        //const checkDataflowType = enforceBooleanResults('in the leafdatadelabel lambda');
        const node_context = {
            codebase: "leafbottle.js",
            refnode, 
            leafnode: refnode && lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        return (input$objArr, controlflow$obj) => {
            let idxcache = 0;
            let loopydata_cache = [];
            let ctrl_in_cache = undefined;
            let bottle_name = undefined;

            const lambdakey$obj = reduced_lambda_obj.name ? reduced_lambda_obj.name._default(input$objArr, controlflow$obj) : {_stream: of(refnodedata.leaf.logic.args.bottlekey), _control: controlflow$obj}; // initialize lambdakey$ data flow

            const bottlefunc = (_data_in) => {
                //const _rt_cache = {idxcache, loopydata_cache};
                const _data_out = _tag_text === undefined ? doBottle(bottle_name, _data_in) : doBottle(bottle_name, _data_in, {tag: _tag_text}); // (isBottle(_data_in) && bottle_name.includes(_data_in._bname)) ? _data_in._content : undefined; //  exitDataBus({_bus: _data_in});
                return _data_out;
            };

            const nodectrl$ = controlflow$obj._stream.pipe(
                concatMap(_ctrl_in=> {
                    ctrl_in_cache = _ctrl_in;
                    return lambdakey$obj._stream; 
                }),
                map( (_lambdakey) => {
                    bottle_name = _lambdakey;
                    return ctrl_in_cache;
                })
            ); 

            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
            const output$obj = driveDataflowByCtrlflow(
                {_stream: nodectrl$}, input$objArr, undefined, 
                {...node_context, metastep: "executing bottle with key "+bottle_name}, 
                {datalogic: {pre: bottlefunc}}
            );

            return output$obj;

            ////const flowinput$obj = combineDataflows(refnode, flowinput$Arr);
            //const flowinput$obj = combineDataflows(refnode, flowinput$Arr, false, false, false, {provenance: "leafbottle.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
            //if (flowinput$obj) {
            //    if (refnodedata.leaf.logic.args.bottlekey || 'bottlekey' in reduced_lambda_obj) { // a non-empty label or lambdaFunc argument
            //        const lambdakey$obj = reduced_lambda_obj.label ? reduced_lambda_obj.label(flowinput$Arr) : {_stream: of([refnodedata.leaf.logic.args.bottlekey])};
            //        
            //        const flowoutput$ = flowinput$obj._stream.pipe(
            //            withLatestFrom(lambdakey$obj._stream), // transforms input stream into tuples of [unitdata, _lambdakey]
            //            // process data labelling
            //            map((_data) => { // a window for debugging
            //                console.log(_data);
            //                return _data;
            //            }),
            //            //filter(([unitdata, _lambdakey]) => (unitdata.every(x=>(isBottle(x)||(isCrate(x) && x._crate.every(isBottle)))))), // filter out any non-bottle or non-crate data
            //            map(([unitdata, _lambdakey] = []) => { // both unitdata and _lambdakey are arrays

            //                // sanity check
            //                // unitdata.length === _lambdakey.length or _lambdakey.length === 1
            //                    //unitdata.map(_entry => [_entry, _lambdakey[0]]) :                 //  then
            //                const preprocessed_data = (_lambdakey.length > 0 && (unitdata.length !== _lambdakey.length || unitdata.length === 1)) ? 
            //                    [[unitdata, _lambdakey[0]]] :                 
            //                    ((_lambdakey.length > 0 && unitdata.length === _lambdakey.length) ? // else if
            //                        unitdata.map((_entry, _idx) => [_entry, _lambdakey[_idx]]) :  //  then
            //                        []);                                                          // else then

            //                //const preprocessed_data = unitdata.map((x, i) => [x, isincluded[i]]); // preprocessed_data is a list of tuples [_dataentry, _lambdakey]
            //                // used reduce instead of map so non-bottle data can be skipped
            //                //const copyBottle = (_bottle) => {return {..._bottle, _label: {..._bottle._label}}};
            //                const processed = preprocessed_data.reduce((_result, [_dataentry, _key] = []) => {
            //                    //if (isBottle(_dataentry))
            //                    //    _result.push(removeLabel(_label, copyBottle(_dataentry)));
            //                    //else if (isCrate(_dataentry))
            //                    //    _result.push({..._dataentry, _crate: _dataentry._crate.map(_bottle=>removeLabel(_label, copyBottle(_bottle)))});
            //                    _result.push(doBottle(_key, _dataentry)); // bottle data up
            //                    return _result;
            //                },[]); // _result initialized to [], prior to reduce()
            //                if (processed.length === 1)
            //                    return processed[0];
            //                else if (processed.length > 1)
            //                    return processed;
            //            })
            //        );

            //        return {_stream: flowoutput$.pipe(filter(_entry=>_entry)), _control: controlflow$obj}; // filter out any null entries in the result array
            //    }
            //    // no name to bottle anything with, do NOT return anything
            //    const errorLocationStr = 'at _leafdataBottle()';
            //    console.error('LEAF Error: flow data cannot be bottled without a bottlekey, ' + errorLocationStr);
            //    return undefined; // TBD: ponder about whether it is necessary to at least return the controlflow$obj pass thru here
            //}
            //else {
            //    //return undefined; // nothing to bottle in the empty input flow.
            //    const errorLocationStr = 'at _leafdataBottle()';
            //    console.error('LEAF Error: bottling cannot be done without any input data stream , ' + errorLocationStr);
            //    return undefined; // TBD: ponder about whether controlflow$obj should be passed thru here. 
            //}
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const input$obj = combineDataflows(refnode, input$Arr);
                const output$obj = etafunc([input$obj], controlflow$obj);
                return {...output$obj, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};

export { _leafbottle, doBottle };