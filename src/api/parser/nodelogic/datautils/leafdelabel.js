import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter } from 'rxjs/operators';
import { isBottle, isCrate } from '../../predicates.js';
import { of, zip } from 'rxjs';
import { mergeDataflows } from '../../../utils/leafdataflow.js';

/*
 * _leafdelabel() is a runtime function for the LEAFgraph node of logic type 'leafdatadelabel'.
 * it is used to delabel any json data being passed to the leaf node via its incoming data flow.
 * @label: a string label to delabel
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying a string or a list of strings. 
 * The output of which, if defined, is used preemptively in lieu of @label.
 * The node would return any bottle with a matching label after delabelling it. 
 * @graphContextual: n/a
 */
//const _leafdataDelabel = ({label=''}={}, lambdaFunc=undefined, graphContextual) => {}
const _leafdelabel = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});

        const removeLabel = (_label, _bottle) => {
            if (_label in _bottle._label)
                _bottle._label[_label] -= 1;
                if (_bottle._label[_label] === 0)
                    delete _bottle._label[_label]; // runtime leafdata garbage collection :) pun intended of course...
            return _bottle;
        };
    
        //const checkDataflowType = enforceBooleanResults('in the leafdatadelabel lambda');
        return (flowinput$Arr, controlflow$obj) => {
            if (refnodedata.leaf.logic.args.label || 'label' in reduced_lambda_obj) { // a non-empty label or lambdaFunc argument
                const lambdalabels$obj = reduced_lambda_obj.label ? reduced_lambda_obj.label(flowinput$Arr) : {_stream: of([refnodedata.leaf.logic.args.label])};
                const flowinput$obj = mergeDataflows(flowinput$Arr);
                
                const flowoutput$ = flowinput$obj._stream.pipe(
                    withLatestFrom(lambdalabels$obj._stream), // transforms input stream into tuples of [unitdata, _lambdalabel]
                    // process data labelling
                    map((_data) => {
                        console.log(_data);
                        return _data;
                    }),
                    filter(([unitdata, _lambdalabel]) => (unitdata.every(x=>(isBottle(x)||(isCrate(x) && x._crate.every(isBottle)))))), // filter out any non-bottle or non-crate data
                    map(([unitdata, _lambdalabel] = []) => { // both unitdata and _lambdalabel are arrays

                        // sanity check
                        // unitdata.length === _lambdalabel.length or _lambdalabel.length === 1
                        const preprocessed_data = (_lambdalabel.length === 1) ?                 // if  
                            unitdata.map(_entry => [_entry, _lambdalabel[0]]) :                 //  then
                            ((unitdata.length === _lambdalabel.length) ?                        // else if
                                unitdata.map((_entry, _idx) => [_entry, _lambdalabel[_idx]]) :   //  then
                                []);                                                            // else

                        //const preprocessed_data = unitdata.map((x, i) => [x, isincluded[i]]); // preprocessed_data is a list tuples [_dataentry, _isincluded]
                        // used reduce instead of map so non-bottle data can be skipped
                        const copyBottle = (_bottle) => {return {..._bottle, _label: {..._bottle._label}}};
                        const processed = preprocessed_data.reduce((_result, [_dataentry, _label] = []) => {
                            if (isBottle(_dataentry))
                                _result.push(removeLabel(_label, copyBottle(_dataentry)));
                            else if (isCrate(_dataentry))
                                _result.push({..._dataentry, _crate: _dataentry._crate.map(_bottle=>removeLabel(_label, copyBottle(_bottle)))});
                            return _result;
                        },[]);
                        if (processed.length > 0)
                            return processed;
                    }),
                    filter(_entry => _entry) // filter out any null entries
                );

                return {_stream: flowoutput$, _control: controlflow$obj};
            }
            // no label to delabel anything with, do NOT return anything
            const errorLocationStr = 'at _leafdataDelabel()';
            throw 'LEAF Error: flow data cannot be labelled without a label, ' + errorLocationStr;
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
        const labelstr = refnodedata.leaf.logic.args.labelstr;
        if (reduced_lambda_obj && labelstr in reduced_lambda_obj)
            return {...reduced_lambda_obj[labelstr]};
        else
            return {};
    },
};
//(inputargs={}) => {
//    const {
//        lambdactrl,
//        lambdadata
//    } = inputargs;
//    //{lambdactrl: {gos: {subsDirectory}, user: {label=''}}, lambdadata: {lambdaFunc=x=>x, graphContextual}}
//    const removeLabel = (_label, _bottle) => {
//        if (_label in _bottle._label)
//            _bottle._label[_label] -= 1;
//            if (_bottle._label[_label] === 0)
//                delete _bottle._label[_label]; // runtime leafdata garbage collection :) pun intended of course...
//        return _bottle;
//    };
//   
//    //const checkDataflowType = enforceBooleanResults('in the leafdatadelabel lambda');
//    return (flowinput$) => {
//        if (lambdactrl.user.leaf.logic.args.label || lambdactrl.lambdaFunc) { // a non-empty label or lambdaFunc argument
//            const lambdalabels$ = lambdactrl.lambdaFunc ? lambdactrl.lambdaFunc(flowinput$) : of([lambdactrl.user.leaf.logic.args.label]);
//            
//            const flowoutput$ = flowinput$.pipe(
//                withLatestFrom(lambdalabels$), // transforms input stream into tuples of [unitdata, _lambdalabel]
//                // process data labelling
//                map((_data) => {
//                    console.log(_data);
//                    return _data;
//                }),
//                filter(([unitdata, _lambdalabel]) => (unitdata.every(x=>(isBottle(x)||(isCrate(x) && x._crate.every(isBottle)))))), // filter out any non-bottle or non-crate data
//                map(([unitdata, _lambdalabel] = []) => { // both unitdata and _lambdalabel are arrays
//
//                    // sanity check
//                    // unitdata.length === _lambdalabel.length or _lambdalabel.length === 1
//                    const preprocessed_data = (_lambdalabel.length === 1) ?                 // if  
//                        unitdata.map(_entry => [_entry, _lambdalabel[0]]) :                 //  then
//                        ((unitdata.length === _lambdalabel.length) ?                        // else if
//                            unitdata.map((_entry, _idx) => [_entry, _lambdalabel[_idx]]) :   //  then
//                            []);                                                            // else
//
//                    //const preprocessed_data = unitdata.map((x, i) => [x, isincluded[i]]); // preprocessed_data is a list tuples [_dataentry, _isincluded]
//                    // used reduce instead of map so non-bottle data can be skipped
//                    const copyBottle = (_bottle) => {return {..._bottle, _label: {..._bottle._label}}};
//                    const processed = preprocessed_data.reduce((_result, [_dataentry, _label] = []) => {
//                        if (isBottle(_dataentry))
//                            _result.push(removeLabel(_label, copyBottle(_dataentry)));
//                        else if (isCrate(_dataentry))
//                            _result.push({..._dataentry, _crate: _dataentry._crate.map(_bottle=>removeLabel(_label, copyBottle(_bottle)))});
//                        return _result;
//                    },[]);
//                    if (processed.length > 0)
//                        return processed;
//                }),
//                filter(_entry => _entry) // filter out any null entries
//            );
//
//            return flowoutput$;
//        }
//        // no label to delabel anything with, do NOT return anything
//        const errorLocationStr = 'at _leafdataDelabel()';
//        throw 'LEAF Error: flow data cannot be labelled without a label, ' + errorLocationStr;
//    };
//};

export { _leafdelabel };