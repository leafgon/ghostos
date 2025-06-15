import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter, concatMap, switchMap, share } from 'rxjs/operators';
import { isBottle, isCrate } from '../../predicates.js';
import { of, zip, Subject } from 'rxjs';
import { mergeDataflows, flattenArray, combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { doUnbottle } from './bottling.js';
//import { memoize } from 'lodash';

/*
 * _leafunbottle() is a runtime function for the LEAFgraph node of logic type 'leafdataunbottle'.
 * it is used to unbottle any bottles either by themselves or in crates being passed to the leaf node 
 * via the incoming data flow.
 * @bottlekey: a string reference (_bname) of the bottle to be unbottled
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying a string or a list of strings. 
 * The output of which, if defined, is used preemptively in lieu of @bottlekey.
 * The node would return the content of bottles with matching _bname after unbottling them. 
 * If multiple bottles are unbottled, a list carrying their contents is returned. 
 * If multiple bottlekeys are given, all bottles with their _cname matching one of the bottlekeys
 * are unbottled.
 * @graphContextual: n/a
 */
//const _leafdataUnbottle = ({bottlekey=''}={}, lambdaFunc=undefined, graphContextual) => {}
const _leafunbottle = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        const openTheBottle = (_bottlekey, _bottlecrate) => {
            return (_bottlekey in _bottlecrate) ? _bottlecrate[_bottlekey] : null;
        };
    
        const node_context = {
            codebase: "leafunbottle.js",
            refnode, 
            leafnode: refnode && lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        //const node_etafunc_resolver = (input$objArr, controlflow$obj) => JSON.stringify(refnode);
         
        return (input$objArr, controlflow$obj) => {
            //const flowinput$obj = mergeDataflows(flowinput$Arr);
            if (refnodedata.leaf.logic.args.bottlekey || 'bottlekey' in reduced_lambda_obj) { // a non-empty label or lambdaFunc argument
                const lambdakey$obj = reduced_lambda_obj.label ? reduced_lambda_obj.label._default(input$objArr, controlflow$obj) : {_stream: of([refnodedata.leaf.logic.args.bottlekey]), _control: controlflow$obj}; // initialize lambdakey$ data flow
                
                let idxcache = 0;
                let loopydata_cache = [];
                let ctrl_in_cache = undefined;
                let bottle_label = undefined;

                const unbottlefunc = (_data_in) => {
                    const _rt_cache = {idxcache, loopydata_cache};
                    const _data_out = [_data_in].flat().map( _a_data => {
                        return (isBottle(_a_data) && bottle_label.includes(_a_data._bname)) ? _a_data._content : undefined
                    }).filter(_in=>_in); //  exitDataBus({_bus: _data_in});
                    //return (_data_out.length === 0 ? undefined : (_data_out.length === 1 ? _data_out[0] : _data_out));
                    if (_data_out.length > 0) {
                      return (_data_out.length === 1 ? _data_out[0] : _data_out);
                    }
                };

                const nodectrl$ = controlflow$obj._stream.pipe(
                    //switchMap(_ctrl_in=> {
                    //    ctrl_in_cache = _ctrl_in;
                    //    //return [of(_ctrl_in), lambdakey$obj._stream];
                    //    return lambdakey$obj._stream;
                    //}),
                    withLatestFrom(lambdakey$obj._stream),
                    map( (_composite_in) => {
                        if (refnode === "20421ab4-c222-4a0b-8d43-1f505a6193c9")
                            console.log("start debugging");
                        const _lambdakey = _composite_in[1];
                        bottle_label = _lambdakey;
                        return _composite_in[0];
                    }),
                    share()
                ); 

                const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                  console.log("start debugging");
                  const _outflow_data$ = new Subject(); //BehaviorSubject({...raceConditionError, _label: {...node_context}});
      
                  const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                      //switchMap(_ctrl_in=> {
                      //    //flowinterface.ctrl_in.next(_ctrl_in);
                      //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_=>_._stream)]);
                      //}),
                      withLatestFrom(..._input$objArr.map(_=>_._stream)),
                      map(_combined_in => {
                          //const _next_data = _combined_in.slice(1).filter(_data=>_data!==undefined);

                          //const unitdataArr = _next_data.length === 1 ? _next_data.flat() : _next_data;
                          const _next_data = _combined_in[1];

                          const do_unbottlefunc = (_data_in) => {
                              const _rt_cache = {idxcache, loopydata_cache};
                              const _data_out = [_data_in].flat().map( _a_data => {
                                  return (isBottle(_a_data) && bottle_label.includes(_a_data._bname)) ? _a_data._content : undefined
                              }).filter(_in=>_in); //  exitDataBus({_bus: _data_in});
                              //return (_data_out.length === 0 ? undefined : (_data_out.length === 1 ? _data_out[0] : _data_out));
                              if (_data_out.length > 0) {
                                return (_data_out.length === 1 ? _data_out[0] : _data_out);
                              }
                              return undefined;
                          };

                          const is_array_input = Array.isArray(_next_data);
                          const unbottleddata = (is_array_input ? 
                              _next_data.map(
                                  _next_datum => do_unbottlefunc(_next_datum)
                              ).filter(_entry => _entry !== undefined) : // filter out any null entries
                              do_unbottlefunc(_next_data)
                          );

                          //let _ctrl_out = undefined;
                          if (unbottleddata?.length > 0 || (!is_array_input && unbottleddata !== undefined)) {
                              _outflow_data$.next(unbottleddata); // publish the next available post-processed data via the data flow subject channel
                              return _combined_in[0]; // only pass the ctrl data in the flow;
                          }
                          return undefined;
                      }),
                      filter(_=>_!==undefined),
                      share()
                  );
                  return {
                      _stream: _outflow_data$.pipe(
                          map(_in => {
                              return _in;
                          }),
                          share()
                      ), 
                      _control: {..._controlflow$obj, 
                          _stream: _outflow_ctrl$.pipe(
                              map(_in => {
                                  return _in;
                              }),
                              share()
                          )
                      }
                  };
                };

                //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
                //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
                const output$obj = driveDataflowByCtrlflow(
                    {_stream: nodectrl$}, input$objArr, undefined, 
                    {...node_context, metastep: "executing unbottle with key "+bottle_label}, 
                    {
                      leaflogic: _nodeflowfunc, 
                      datalogic: {
                        post: (_data_out) => {
                          return _data_out;
                        }
                      }
                    }
                );

                //const flowoutput$ = controlflow$obj._stream.pipe(

                //    withLatestFrom(lambdakey$obj._stream), // transforms input stream into tuples of [unitdata, _lambdakey]
                //    // process data labelling
                //    map((_data) => { // a window for debugging
                //        if (["a80b", "6945"].includes(refnode?.slice(0,4)))
                //            console.log(lambdactrl.gos.etaTree, "refnode: ", refnode, _data);
                //        //if (refnode && refnode.slice(0,4) === "e1e1")
                //        //    console.log("start debugging");
                //        return _data;
                //    }),
                //    filter(([unitdata, _lambdakey]) => {
                //        const unitdata_array = Array.isArray(unitdata) ? unitdata : [unitdata];
                //        return (unitdata_array.every(x=>(isBottle(x)||(isCrate(x) && x._crate.every(isBottle)))));
                //        //return (isBottle(unitdata)||(isCrate(unitdata) && unitdata._crate.every(isBottle)));
                //    }), // filter out any non-bottle or non-crate data
                //    map(([unitdata, _lambdakey] = []) => { // both unitdata and _lambdakey are arrays

                //        const unitdata_array = Array.isArray(unitdata) ? unitdata : [unitdata];
                //        // sanity check
                //        // unitdata.length === _lambdakey.length or _lambdakey.length === 1
                //        //const preprocessed_data = (_lambdakey.length === 1) ?                 // if  
                //        //    unitdata.map(_entry => [_entry, _lambdakey[0]]) :                 //  then
                //        //    ((unitdata.length === _lambdakey.length) ?                        // else if
                //        //        unitdata.map((_entry, _idx) => [_entry, _lambdakey[_idx]]) :  //  then
                //        //        []);                                                          // else then

                //        //const preprocessed_data = unitdata.map((x, i) => [x, isincluded[i]]); // preprocessed_data is a list of tuples [_dataentry, _lambdakey]
                //        // used reduce instead of map so non-bottle data can be skipped
                //        //const copyBottle = (_bottle) => {return {..._bottle, _label: {..._bottle._label}}};
                //        const processed = unitdata_array.reduce((_result, _dataentry) => {
                //            //if (isBottle(_dataentry))
                //            //    _result.push(removeLabel(_label, copyBottle(_dataentry)));
                //            //else if (isCrate(_dataentry))
                //            //    _result.push({..._dataentry, _crate: _dataentry._crate.map(_bottle=>removeLabel(_label, copyBottle(_bottle)))});
                //            if (isBottle(_dataentry) && _lambdakey.includes(_dataentry._bname))
                //                _result.push(_dataentry._content); // unbottle 
                //            else if (isCrate(_dataentry)) {
                //                _dataentry._crate.map(_bottle => {
                //                    if (_lambdakey.includes(_bottle._bname))
                //                        _result.push(_bottle._content); // unbottle 
                //                })
                //            }

                //            return flattenArray(_result);
                //        },[]); // _result initialized to [], prior to reduce()

                //        if (refnode && refnode.slice(0,4) === "6a01")
                //            console.log("start debugging");
                //        //const processed = [];
                //        //if (isBottle(unitdata) && _lambdakey.includes(unitdata._bname))
                //        //    processed.push(unitdata._content); // unbottle 
                //        //else if (isCrate(unitdata)) {
                //        //    unitdata._crate.map(_bottle => {
                //        //        if (_lambdakey.includes(_bottle._bname))
                //        //            processed.push(_bottle._content); // unbottle 
                //        //    })
                //        //}

                //        //return flattenArray(_result);
                //        //if (processed.length === 1)
                //        //    return processed[0];
                //        if (processed.length > 0)
                //            return processed;
                //    })
                //);

                //return {_stream: flowoutput$.pipe(filter(_entry=>_entry)), _control: controlflow$obj}; // filter out any null entries in the result array
                return output$obj;
            }
            // no name to bottle anything with, do NOT return anything
            const errorLocationStr = 'at _leafdataUnbottle()';
            throw 'LEAF Error: flow data cannot be unbottled without a bottlekey, ' + errorLocationStr;
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        // TBD: check if the following repackaging of _dataflow and _control is redundant
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const output$obj = etafunc(input$Arr, controlflow$obj);
                return {...output$obj, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};

export { _leafunbottle, doUnbottle };
