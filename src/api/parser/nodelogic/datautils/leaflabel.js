import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter, share, switchMap } from 'rxjs/operators';
import { isBottle, isCrate } from '../../predicates.js';
import { BehaviorSubject, of, ReplaySubject, Subject, zip, take, combineLatest } from 'rxjs';
import { mergeDataflows } from '../../../utils/leafdataflow.js';
import { driveDataflowByCtrlflow, executeLEAFLogic } from '../../leaf.js';
import { doBottle } from './bottling.js';

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leaflabel.js", codebase:"/src/ghostos/api/parser/nodelogic/datautils/leaflabel.js"}, {});
/*
 * _leaflabel() is a runtime function for the LEAFgraph node of logic type 'leafdatalabel'.
 * it is used to label a bottle, a list of bottles or a crate of bottles being passed to the leaf node 
 * via its incoming data flow.
 * @label: a string label
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying a string or a list of strings. 
 * The output of which, if defined, is used preemptively in lieu of @label.
 * @graphContextual: n/a
 */
//const _leafdataLabel = ({label=''}={}, lambdaFunc=undefined, graphContextual) => {}
const _leaflabel = {
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
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
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
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});

        const doAddLabel = (_label, _dict) => {
            if (_label in _dict)
                _dict[_label] += 1;
            else
                _dict[_label] = 1;
            return _dict;
        };
        //const checkDataflowType = enforceBooleanResults('in the leafdatalabel lambda');

        const addLabel = (_lambdalabel, _unitdata) => {
            return {..._unitdata, _label: doAddLabel(_lambdalabel, {..._unitdata._label})}; // always create a new copy when modifying, never mutate the original crate
        };

        const handleSpecialLabelLogic = async (lut, labelstr="") => {

            const backslash_re = /^\\(.*)$/;
            const queryparam_re = /^\?([A-Za-z0-9-]*)$/;
            //const queryparam_re = /[(\?|\&)]([^=]+)\=([^&#]+)/g;
            let re_match = labelstr.match(backslash_re); // parse the labelstr for backslash
            if (re_match) {
                //const outputsubject$ = ReplaySubject().pipe(take(1));
                const lut_name = re_match[1]; // TBD: i haven't tested this yet. try it on LEAFlisp
                if (lut_name in lut) {
                    const _result = await executeLEAFLogic(lut(lut_name)._default, refnode); 
                    //.then((_result) => {
                    //    // logic resolved do something with the result
                    //    outputsubject$.next(_result);
                    //})
                    return _result;
                }
                return "";
                //return outputsubject$;
            }

            re_match = labelstr.match(queryparam_re); // parse the labelstr for backslash
            if (re_match) {
                //const outputsubject$ = ReplaySubject().pipe(take(1));
                const queryparam_name = re_match[1]; // TBD: i haven't tested this yet. try it on LEAFlisp

                // https://stackoverflow.com/questions/67749629/how-do-i-get-url-params-with-a-question-mark-in-react-js
                const qparams = window.location.search;
                //const params = qparams.length > 0 ? qparams.split("=") : []; // spark_dev_note: qparams parsing here only supports a single param atm. fix it. (refactored to support multiple query string variables (6/Sept/2022)
                const params = new Proxy(new URLSearchParams(qparams), {
                    get: (searchParams, prop) => searchParams.get(prop),
                }); // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
                //const zip = (a, b) => a.map((k, i) => [k, b[i]]);
                //const keyvallistpair = params.reduce((obj, cur, idx) => {obj[idx % 2].push(cur); return obj;}, [[], []]);
                //const keyvallistpair2 = params.length > 0 ? [keyvallistpair[0].map(x=>x.slice(1)), keyvallistpair[1]] : [];
                //const qparam_dict = params.length > 0 ? Object.fromEntries(zip(...keyvallistpair2)) : {};
                const qparam_dict = {};
                if (params[queryparam_name])
                    qparam_dict[queryparam_name] = params[queryparam_name];
                //return outputsubject$;
                console.log(qparam_dict);

                //return qparam_dict[queryparam_name];
                return queryparam_name in qparam_dict ? qparam_dict : undefined; // return value only
            }

            // otherwise
            //return of([labelstr]);
            return labelstr;
        };

        const node_context = {
            codebase: "leaflabel.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        return (input$objArr, controlflow$obj) => {
            
            const setupLabelDataplane = (_input$objArr) => {
                if (refnode === "8b5b7162-5a06-40da-ba43-5c404986aa36")
                {
                    console.log("start debugging")
                }
                const hasExplicitDataIn = lambdactrl.gos.etaTree.leafgraph.edges.data.targets.has(refnode); // explicit data in is the one connected in by user
                if (!hasExplicitDataIn) { // label being used as a simple constant string value
                    if (refnodedata.leaf.logic.args.labelstr) {
                        const labelPromise = handleSpecialLabelLogic(reduced_lambda_obj, refnodedata.leaf.logic.args.labelstr);
                        //const label$ = new ReplaySubject(1);
                        //labelPromise.then((labelstr) => {
                        //    label$.next(labelstr);
                        //});
                       return [Promise.resolve(labelPromise)]; //, ..._input$objArr.map(_$obj=>_$obj._stream);
                    }
                    else { // no label to label anything with, just return input as output unchanged
                        return _input$objArr.map(_$obj=>_$obj._stream);
                    }
                }
                else {
                    if (refnodedata.leaf.logic.args.labelstr) { // a non-empty label with data input greater than 0
                        // label dataplane data flowing through this point with labelstr
                        console.error("debug")
                        // To Be Implemented..
                        return _input$objArr.map(_$obj=>_$obj._stream);
                    }
                    else { // no label to label anything with, just return input as output unchanged
                        return _input$objArr.map(_$obj=>_$obj._stream);
                    }
                }
                //else if (refnodedata.leaf.logic.args.labelstr || 'label' in reduced_lambda_obj) { // a non-empty label or lambdaFunc argument
                //    console.error("debug")
                //    // To Be Implemented..
                //    return _input$objArr.map(_$obj=>_$obj._stream);
                //    //const lambdalabels$obj = reduced_lambda_obj.label ? reduced_lambda_obj.label(flowinput$Arr) : {_stream: of([refnodedata.leaf.logic.args.labelstr])};
                //    //const output$ = handleSpecialLabelLogic(reduced_lambda_obj, refnodedata.leaf.logic.args.labelstr);
                //    
                //    //// labelling the stream
                //    //const flowinput$obj = mergeDataflows(_input$objArr);
                //    //flowinput$obj[refnodedata.leaf.logic.args.labelstr] = 1;
                //    //return flowinput$obj.map(_$obj=> _$obj._stream);

                //}
                //else if (refnodedata.leaf.logic.args.labelstr && ) { // a non-empty label with data input greater than 0
                //    // label dataplane data flowing through this point with labelstr
                //    console.error("debug")
                //    // To Be Implemented..
                //    return _input$objArr.map(_$obj=>_$obj._stream);
                //}
                //else { // no label to label anything with, just return input as output unchanged
                //    return _input$objArr.map(_$obj=>_$obj._stream);
                //}
            }


            const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                
                const _outflow_data$ = new BehaviorSubject({...raceConditionError, _label: {...node_context}});
                //ReplaySubject
                //const _outflow_data$ = new Subject(); //({...raceConditionError, _label: {...node_context}});
                const _dataplane = setupLabelDataplane(_input$objArr);

                console.log(input$objArr);
                //if (refnode === "8b5b7162-5a06-40da-ba43-5c404986aa36")
                //{
                //    _input$objArr[0]._stream.subscribe({
                //        next: _dat => {
                //            console.log(_dat);
                //        }
                //    })
                //}
                const _outflow_ctrl$ = (_input$objArr.length > 0 ? _controlflow$obj._stream.pipe(
                        switchMap(_ctrl_in=> {
                            //flowinterface.ctrl_in.next(_ctrl_in);
                            //return combineLatest([of(_ctrl_in), ..._input$objArr.map(_=>_._stream)]);
                            console.log(_dataplane)
                            return combineLatest([of(_ctrl_in), ..._dataplane]);
                        }),
                        //map(_ctrl_in=>{
                        //    console.log(_dataplane)
                        //    return _ctrl_in;
                        //}),
                        ////withLatestFrom(..._dataplane),
                        //withLatestFrom(_dataplane[0]),
                        map(_combined_in => {
                            console.log(_combined_in.slice(1));
                            if (_combined_in.length == 2)
                                _outflow_data$.next(_combined_in[1]);
                            else
                                _outflow_data$.next(_combined_in.slice(1));
                            return _combined_in[0];
                        }),
                        filter(_=>_),
                        share()
                    ) :
                    _controlflow$obj._stream
                );

                return {_stream: _outflow_data$, _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            }


                //if (_input$objArr.length === 0) { // label being used as a simple constant string value
                //    //const outputsubject$ = (new ReplaySubject(1)).pipe(take(1));
                //    const outputsubject$ = new ReplaySubject(1); 
                //    if (refnodedata.leaf.logic.args.labelstr) {
                //        const labelPromise = handleSpecialLabelLogic(reduced_lambda_obj, refnodedata.leaf.logic.args.labelstr);
                //        Promise.resolve(labelPromise).then((labelstr) => {
                //            outputsubject$.next(labelstr);
                //        });
                //        return {_stream: outputsubject$, _control: _controlflow$obj};
                //    }
                //    else { // no label to label anything with, just return input as output unchanged
                //        return {...mergeDataflows(flowinput$Arr), _control: _controlflow$obj};
                //    }
                //}
                //else if (refnodedata.leaf.logic.args.labelstr || 'label' in reduced_lambda_obj) { // a non-empty label or lambdaFunc argument
                //    //const lambdalabels$obj = reduced_lambda_obj.label ? reduced_lambda_obj.label(flowinput$Arr) : {_stream: of([refnodedata.leaf.logic.args.labelstr])};
                //    const output$ = handleSpecialLabelLogic(reduced_lambda_obj, refnodedata.leaf.logic.args.labelstr);
                //    
                //    // labelling the stream
                //    const flowinput$obj = mergeDataflows(flowinput$Arr);
                //    flowinput$obj[refnodedata.leaf.logic.args.labelstr] = 1;
                //    return {...flowinput$obj, _control: controlflow$obj};

                //    //{ // labelling bottles
                //    //    const flowoutput$ = flowinput$.pipe(
                //    //        withLatestFrom(lambdalabels$), // transforms input stream into tuples of [unitdata, _lambdalabel]
                //    //        // process data labelling
                //    //        map((_data) => {
                //    //            console.log(_data);
                //    //            return _data;
                //    //        }),
                //    //        filter(([unitdata, _lambdalabel]) => (unitdata.every(x=>(isBottle(x)||(isCrate(x) && x._crate.every(isBottle)))))), // filter out any non-bottle or non-crate data
                //    //        map(([unitdata, _lambdalabel] = []) => {
                //    //            // spark_dev_note:
                //    //            // unitdata and _lambdalabel are expected to be arrays. the calling function, 
                //    //            // parseLEAFNode (leaf.js) ensures unitdata to be an array, while the above call to of([label])
                //    //            // makes _lambdalabel to be an array of a single string label.
                //    //            // lambdaFunc may return an array of a single string or multiple strings. In the latter case, 
                //    //            // its array length should be equal to that of the array of unitdata.

                //    //            // sanity check
                //    //            // unitdata.length === _lambdalabel.length or _lambdalabel.length === 1
                //    //            const preprocessed_data = (_lambdalabel.length === 1) ?                 // if  
                //    //                unitdata.map(_entry => [_entry, _lambdalabel[0]]) :                 //  then
                //    //                ((unitdata.length === _lambdalabel.length) ?                        // else if
                //    //                    unitdata.map((_entry, _idx) => [_entry, _lambdalabel[_idx]]) :   //  then
                //    //                    []);                                                            // else

                //    //            //const preprocessed_data = unitdata.map((x, i) => [x, isincluded[i]]); // preprocessed_data is a list tuples [_dataentry, _isincluded]
                //    //            // used reduce instead of map so non-bottle data can be skipped
                //    //            const processed = preprocessed_data.reduce((_result, [_dataentry, _label] = []) => {
                //    //                if (isBottle(_dataentry))
                //    //                    _result.push(addLabel(_label, _dataentry));
                //    //                else if (isCrate(_dataentry))
                //    //                    _result.push({..._dataentry, _crate: _dataentry._crate.map(_bottle=>addLabel(_label, _bottle))});
                //    //                return _result;
                //    //            },[]);
                //    //            if (processed.length > 0)
                //    //                return processed;
                //    //        }),
                //    //        filter(_entry => _entry) // filter out any null entries
                //    //    );

                //    //    // debug
                //    //    flowoutput$.pipe(
                //    //        map((_entry) => {
                //    //            console.log(_entry);
                //    //        })
                //    //    )

                //    //    return flowoutput$;

                //    //}
                //}
                //else { // no label to label anything with, just return input as output unchanged
                //    return {...mergeDataflows(flowinput$Arr), _control: controlflow$obj};
                //}

            const output$obj = driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, 
                {...node_context, metastep: "leaflabel "+refnode}, 
                {leaflogic: _nodeflowfunc, datalogic: {}}
            );

            return output$obj;
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        const lambda_lut = {};
        if (nodelambda.length > 0) {
            const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
            lambda_lut[refnodedata.leaf.logic.args.labelstr] = {...reduced_lambda_obj}; // label the eta reduced obj
        }
        else {
            lambda_lut[refnodedata.leaf.logic.args.labelstr] = {}; // label an empty object
        }
        return lambda_lut;
    },
    methods: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {

        // space for node type specific init prior to use
        let reduced_lambda_obj;
        if (nodelambda.length > 0) {
            const reduced_defaultlambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
            reduced_lambda_obj = {...reduced_defaultlambda_obj}; // label the eta reduced obj
        }
        else {
            reduced_lambda_obj = {}; // label an empty object
        }
        return reduced_lambda_obj;
    },
};

export { _leaflabel };
