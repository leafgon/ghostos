import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
//import { TIMEOUTBEHAVIOR_BESTEFFORT, combineDataflows, exitDataBus, mergeDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow';
import { concatMap, filter, map, share, switchMap, withLatestFrom, finalize } from 'rxjs/operators';
import { interval, of, take, timeout, catchError, combineLatest, Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { driveDataflowByCtrlflow, executeLEAFLogicInSync, timeoutPromise } from '../../leaf.js';
import { mergeDataflows } from '../../../utils/leafdataflow.js';
import { isBottle } from '../../predicates.js';

const getEtaContext = (_lambda_obj) => {
    const keywordlist = Object.keys(_lambda_obj).map(_key => { 
        if (Object.keys(_lambda_obj[_key]).length === 0)
            return _key;
        else
            return undefined;
    }).filter(_=>_);

    return keywordlist.sort();
};

const _lookupSpellBook = (spell_lambda_obj) => async ({refnode, spellbook, spellname, lambdalut, contextuallambda, etaTree}={}) => {
    // TBD
    if (refnode === '530acdcf-067d-4868-ba0c-b7a83e6edfdf')
        console.log("start debugging");
    if (spellname in spellbook)
    {
        const spelldefnode = spellbook[spellname];

        const nodelambda = (spelldefnode in lambdalut) ? 
            lambdalut[spelldefnode] :
            [];

        if (spellname === 'accio' && refnode.slice(0,4) === '39c9')
            console.log('debug time', spelldefnode, spellbook)
        //const spell_lambda_obj = await etaReduceLambdaGraphs({refnode: spelldefnode, nodelambda, contextuallambda, etaTree});
        //const _keywordlist = getEtaContext(spell_lambda_obj);
        //const _spelldef = await etaTree.etaReduceLEAFNode({nodeuuid: spelldefnode, contextuallambda: _keywordlist});
        const _spelldef = await etaTree.etaReduceLEAFNode({nodeuuid: spelldefnode, contextuallambda});

        if (refnode === '530acdcf-067d-4868-ba0c-b7a83e6edfdf')
            console.log("start debugging");
        if (spellname === 'accio' && refnode.slice(0,4) === '39c9')
            console.log('debug time')

        return _spelldef;
    }
    else {
        console.log("lookupSpellBook couldn't find the spellname", spellname);
        return undefined;
    }
};

const GENERIC_SPELL_BNAME = "cast-spell";
const GENERIC_SPELLNAME = "{*}";

const _leafspell = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // do initialize the leafnode logic as per the currently connected leaf graph lambda context 
        //const _lambdacontextlut = nodelambda;
        //const node_setup = lambdajsArgs.default({default: lambdalambdafunc});
        //
        //const leafnode_attributes = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode); // retreive the leaf node attributes
        //const leafnode_logic = leafnode_attributes.leafnode.data.leaf.logic;

        if (['0b62c9db-f889-4bf8-9773-c7b93ba9bd3f'].includes(refnode))
            console.log("start debugging")
        // look up the spell from spellbooks in the order of precedence
        const spellname = refnodedata.leaf.logic.args.spellname;
        const is_generic_spell = (spellname === GENERIC_SPELLNAME);
        if (spellname === "menudata")
            console.log("start debugging");
        let _contextuallambda = contextuallambda;

        let spell_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree});
        const _keywordlist = getEtaContext(spell_lambda_obj);
        if (_keywordlist.length > 0) {
            _contextuallambda = _contextuallambda.concat(_keywordlist);
            spell_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree});
        }

        //const nodeiosubject_in$ = new ReplaySubject(1);
        //const nodeiosubject_out$ = new ReplaySubject(1);
        let nodeleafinst$ = undefined;

        if (['b490aada-daab-4322-9001-14aea8bcb3d3', '97fa68cf-bcc5-44cf-8311-ffa6a1422ac3', 'abb18b4d-b8af-4349-949d-fae21bc142ef', 'e9536f42-df6d-4086-a643-5f3c0b02aac9', 'b5a20ce3-3e67-42cd-9f60-3f70c6acd269', '59fe3646-b338-4ab0-a8a6-d6ad401be4fa'].includes(refnode))
            console.log("start debugging")
        let spelldef = undefined;

        const lookupSpellBook = _lookupSpellBook(spell_lambda_obj);

        const parseSpellBook = async () => {
            console.log("parseSpellBook:", spellname, refnode, (lambdactrl.gos.etaTree.domain + "/" + lambdactrl.gos.etaTree.appid), " parsing...");
            if (!spellname) {
                console.error(`LEAF Error: spellname undefined, refnode: ${refnode} at ${lambdactrl.gos.etaTree.domain}/${lambdactrl.gos.etaTree.appid}`);
                return undefined;
            }
            if (globalThis?.DEBUG) {
                const tracecoord = (lambdactrl.gos.etaTree.domain + "/" + lambdactrl.gos.etaTree.appid + "/" + spellname + "/" + refnode);
                globalThis.trace[tracecoord] ? 
                    globalThis.trace[tracecoord].push("parsing") :
                    globalThis.trace[tracecoord] = ["parsing"];
            }

            if (["2293da4a-b517-4b0b-b396-cb030dc05900"].includes(refnode))
                console.log("start debugging")
            if (['e9536f42-df6d-4086-a643-5f3c0b02aac9'].includes(refnode))
                console.log("start debugging")
            if (refnode.slice(0,4) === '7435')
                console.log('debug time')
            if (refnode.slice(0,4) === 'c96a')
                console.log("start debugging");
            let _spelldef = undefined;

            if (spellname === GENERIC_SPELLNAME) { 
                // a {generic} spell can be used to invoke any spell defined in the current eta tree id'ed by the nodeuuid of the spelldef node
                // a {generic} spell awaits a bottle named "castspell" whose content contains the nodeuuid of the relevant spelldef node
                //const refnodedata = lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid).leafnode.data;
                //_spelldef = lambdactrl.gos.etaTree.lookupLEAFNodeMethods()

            }
            if (!_spelldef) { 
                //const spell_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
                if (spell_lambda_obj && spellname in spell_lambda_obj) {
                    _spelldef = spell_lambda_obj[spellname];
                }
                // test 
                //_spelldef = {_default: input$ => [337]};
                // end of test 
            }
            if (!_spelldef) {
                const userspellbook = lambdactrl.user.spellbook;
                const userlambdalut = lambdactrl.user.lambdalut;
                _spelldef = await lookupSpellBook({refnode, spellbook: userspellbook, spellname, lambdalut: userlambdalut, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree}); // TBD: look up the eta-reduced matching spell def by name 
            }
            if (!_spelldef) {
                const stdlambdalut = lambdactrl.gos.stdlambdalut;
                const stdspellbook = lambdactrl.gos.standardSpellbook;
                _spelldef = await lookupSpellBook({refnode, spellbook: stdspellbook, spellname, lambdalut: stdlambdalut, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree});
            }
            if (!_spelldef) { // if lookup failed so far, curatedspellbook is last in the order or precedence
                const curatedlambdalut = lambdactrl.gos.curatedlambdalut;
                const curatedspellbook = lambdactrl.gos.curatedSpellbook;
                _spelldef = await lookupSpellBook({refnode, spellbook: curatedspellbook, spellname, lambdalut: curatedlambdalut, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree});
            }
            //if (refnode.slice(0,4) === '4947' || refnode.slice(0,4) === '39c9') {
            //    console.log('debug time')
            //    executeLEAFLogicInSync(_spelldef._default, [], {})._stream.subscribe(
            //        x => {
            //            console.log(x);
            //        }
            //    );
            //}
            if (['e9536f42-df6d-4086-a643-5f3c0b02aac9'].includes(refnode))
                console.log("start debugging")
            console.log("parseSpellBook:", spellname, refnode, (lambdactrl.gos.etaTree.domain + "/" + lambdactrl.gos.etaTree.appid), " parsed", _spelldef);
            if (globalThis?.DEBUG) {
                const tracecoord = (lambdactrl.gos.etaTree.domain + "/" + lambdactrl.gos.etaTree.appid + "/" + spellname + "/" + refnode);
                globalThis.trace[tracecoord] ? 
                    globalThis.trace[tracecoord].push("parsed") :
                    globalThis.trace[tracecoord] = ["parsed"];
            }
            if (spellname === "initialize")
                console.log("start debugging");

            spelldef = _spelldef;
            if (!(spelldef && '_default' in spelldef)) {
                console.error(`LEAF Error: _leafspell() called with spellname ${spellname} is missing a default dataflow component graph definition.`);
                // spark_dev_note: 12/July/2023
                // #errorhandling #leaf #debugging #testing
                // from LEAF users' perspective, it is wise to report this error to the users' display, 
                // as the cause of the error is likely to do with logical errors in user LEAF codes. 
                // One example causing this error includes, but is not limited to, 
                // a case where a spell is imported by using a leafgraph node and a spelldef node and
                // there's a typo in the spellbook name. 
                return undefined; 
                //return (_input$objArr, _controlflow$obj) => { // return merged dataflow as a default _default
                //    //const _cache = {...reduced_lambda_obj};
                //    console.log("start debugging");
                //    return {...mergeDataflows(_input$objArr), _control: _controlflow$obj};
                //};
            }

            //return _spelldef._default; //{inputdata, spelldef: reduced_spelldef};
            return _spelldef; //{inputdata, spelldef: reduced_spelldef};
        };

        const is_bypass = "bypass" in spell_lambda_obj ? true : false;

        const executeSpellIsolated = (spellfunc, inputdata, is_bypass) => {
            const mainloop$ = interval(10).pipe(take(1));
            const lambda_result = [];
            //const resolved_input = await Promise.resolve(inputdata);
            const isolatedinput$obj = {_stream: of(inputdata)};
            const isolatedoutput$ = mainloop$.pipe(
                concatMap(async (_idx) => {
                    // execute a round of the given lambda logic
                    const controlflow$obj = isolatedinput$obj; // reset the controlflow$obj from the inputflow$
                    //const lambdaresult$obj = reduced_lambda_obj._default([{_stream: of(inputdata)}], controlflow$obj);
                    //const lambdaresult$obj = spell_lambda_obj._default([isolatedinput$obj], controlflow$obj);
                    const lambdaresult$obj = spellfunc([isolatedinput$obj], controlflow$obj);
                    await lambdaresult$obj._stream.forEach((_)=>{
                        //const resolved_ = await Promise.resolve(_); // as per https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise
                        lambda_result.push(Array.isArray(_) ? _.flat() : _);
                        //lambda_result.flat(); // aggregate the result of the logic
                        //console.log(_);
                        //return _;
                        //inputsubject$.next(resolved_); // emit the result downstream
                    }); 
                    //inputsubject$.next(lambda_result); // to emit the aggregate result in one go
                    //return lambdaresult$obj._stream;
                    //return isolatedoutput$;
                    //return lambdaresult$obj._stream;
                    //return is_bypass ? of(inputdata) : of(lambda_result);
                    return is_bypass ? inputdata : lambda_result;
                }),
                //mergeMap(x => {
                //    console.log(x);
                //    return x;
                //})
            ); //.forEach((_) => {
                //lambda_result.push(_.flat());
            //}); //.subscribe({next: x => {x}});
            //console.log(lambda_result);
            //return is_bypass ? inputdata : lambda_result;
            //return is_bypass ? isolatedinput$obj._stream : Promise.resolve(executionoutput$);
            return isolatedoutput$;
        };

        const executeSpell = (spellfunc, spellinput$obj, spellctrl$obj, is_bypass) => {
            const mainloop$ = interval(10).pipe(take(1));
            const lambda_result = [];
            //const resolved_input = await Promise.resolve(inputdata);
            const isolatedoutput$ = spellinput$obj._stream.pipe(
                concatMap( (inputdata) => {
                    //return mainloop$.pipe(
                        //take(1),
                    //    mergeMap( x => {
                    const lambdaresult$obj = spellfunc([spellinput$obj], spellctrl$obj);
                    return is_bypass ? spellinput$obj._stream : lambdaresult$obj._stream;
                    //    }),
                        //map(x => {
                        //    console.log(x);
                        //    return x;
                        //})
                    //);
                }),
                map(x => {
                    console.log("executeSpell ran:",x);
                    return x;
                })
            );
            //mainloop$.pipe(
            //    mergeMap( (_idx) => {
            //        // execute a round of the given lambda logic
            //        //const lambdaresult$obj = reduced_lambda_obj._default([{_stream: of(inputdata)}], controlflow$obj);
            //        //const lambdaresult$obj = spell_lambda_obj._default([isolatedinput$obj], controlflow$obj);
            //        const lambdaresult$obj = spellfunc([spellinput$obj], spellctrl$obj);
            //        //inputsubject$.next(lambda_result); // to emit the aggregate result in one go
            //        //return lambdaresult$obj._stream;
            //        //return isolatedoutput$;
            //        //return lambdaresult$obj._stream;
            //        //return is_bypass ? of(inputdata) : of(lambda_result);
            //        return is_bypass ? spellinput$obj._stream : lambdaresult$obj._stream;
            //    }),
            //    //mergeMap(x => {
            //    //    console.log(x);
            //    //    return x;
            //    //})
            //); //.forEach((_) => {
            //    //lambda_result.push(_.flat());
            ////}); //.subscribe({next: x => {x}});
            ////console.log(lambda_result);
            ////return is_bypass ? inputdata : lambda_result;
            ////return is_bypass ? isolatedinput$obj._stream : Promise.resolve(executionoutput$);
            return isolatedoutput$;
        };

        //const mainloop$ = interval(10).pipe(take(1));
        
        let spell_subscription = undefined;

        //const spelldefProm = parseSpellBook();       

        const node_context = {
            codebase: "leafspell.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree?.leafgraph?.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        let spellprom = is_generic_spell ? undefined : timeoutPromise(parseSpellBook(), 30000, "leafspell.js", "LEAF Error: resolving transformation.leaflogic timed out", node_context)

        //const _leaflogic2 = await spellprom;
        // spark_dev_note: 3/Nov/2023
        // temporarily disabled time out for testing purposes. enable it back for production use.
        //const _leaflogic = await timeoutPromise(spelldefProm, 100000, "leafspell.js", "LEAF Error: resolving transformation.leaflogic timed out", node_context);
        //const _leaflogic = await spelldefProm;
        //parseSpellBook();       

        //if (typeof _leaflogic !== 'function')
        //    console.log("start debugging");

        return (input$objArr, controlflow$obj) => { // return a dataflow-scoped func

            //if (!(spelldef && '_default' in spelldef)) {
            //    console.error(`LEAF Error: _leafspell() called with spellname ${spellname} is missing a default dataflow component graph definition.`);

            //    const defaultout$obj = driveDataflowByCtrlflow(
            //        controlflow$obj, input$objArr, undefined, 
            //        {...node_context, metastep: "relaying input data as is due to error condition"}
            //    );
            //    return defaultout$obj;
            //}
            const preprocessfunc = (_data_in) => {
                //const _data_out = exitDataBus({_bus: _data_in});
                if (refnode === "b5a20ce3-3e67-42cd-9f60-3f70c6acd269")
                    console.log("start debugging");
                const _data_out = _data_in;
                return _data_out;
            };

            const _executeSpell = async (_spellprom, _ctrl$, _data$) => {
                const _leaflogic = await _spellprom;

                if (_leaflogic === undefined) {
                    console.error("LEAF Error: dataflow triggered for an undefined spell");
                    return undefined;
                }

                if (_leaflogic !== undefined && typeof(_leaflogic?._default) !== 'function') {
                    console.error("spell def could not be resolved: ", _leaflogic);
                    return undefined;
                }

                const output$obj = driveDataflowByCtrlflow(
                    {...controlflow$obj, _stream: _ctrl$}, [{_stream: _data$}], undefined, 
                    {...node_context, metastep: "executing parsed spell in the flow: "+spellname}, 
                    {
                        leaflogic: _leaflogic._default, //spelldefProm, //spelldef._default, 
                        //datalogic: {
                        //    pre: preprocessfunc,
                        //    post: postprocessfunc
                        //}
                    }
                );

                return output$obj._control._stream.pipe(
                    withLatestFrom(output$obj._stream),
                    map(_combined_in => {
                        return _combined_in;
                    }),
                    finalize(() => { 
                        console.log('spell stream _executeSpell: finalizing stream 4 spell, ', spellname); 
                        //if (spell_subscription !== undefined) {
                        //    console.log("spell stream _executeSpell: unsubscribing spell, ", spellname);
                        //    spell_subscription.unsubscribe();
                        //    spell_subscription = undefined;
                        //}
                        //if (op_subs !== undefined) {
                        //    op_subs.unsubscribe();
                        //    op_subs = undefined;
                        //}
                    })
                );
            };

            const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                console.log("start debugging");
                const _outflow_data$ = new Subject();
                const relay_ctrl$ = new Subject(); //_combined_in[0]);
                const relay_data$ = new Subject(); //_combined_in[1]);
                const spell_output_relay$ = new Subject();
                const outer_relay_ctrl$ = new Subject(); //BehaviorSubject(_combined_in[1][0]);
                let spell_subscription = undefined;
    
                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    //switchMap(_ctrl_in=> {
                    //    //flowinterface.ctrl_in.next(_ctrl_in);
                    //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_=>_._stream)]);
                    //}),
                    withLatestFrom(..._input$objArr.map(_=>_._stream)),
                    switchMap( _combined_in => {
                        //return combineLatest(spelldefProm, relay_ctrl$, relay_data$);
                        //const spellop = firstValueFrom(spell_output$).then(_spell_output => {
                        //    //spell_output_relay$.next(_spell_output);
                        //    console.log("spell returned", _spell_output);
                        //    return _spell_output;
                        //});

                        if (spell_subscription === undefined && spellprom) {
                            console.log("spell stream: subscribing spell, ", spellname);
                            if (!spellname)
                                console.error("undefined spellname: ", JSON.stringify(node_context));
                            _executeSpell(spellprom, relay_ctrl$, relay_data$).then( spell_output$ => {
                                if (spell_output$ === undefined) {
                                    relay_data$.next(_combined_in[1]);
                                    //relay_data$.next(undefined);
                                    relay_ctrl$.next(_combined_in[0]);
                                }
                                else {
                                    spell_subscription = spell_output$.subscribe({
                                        next: _next_out => {
                                            console.log(`leafspell ${spellname} output: ${_next_out}`);
                                            spell_output_relay$.next(_next_out);
                                        },
                                        error: emsg => {
                                            console.error(`leafspell ${spellname} had an error in the subscription stream: ${emsg}`);
                                        },
                                        complete: () => {
                                            console.log(`leafspell ${spellname} subscription completed.`);
                                        }
                                    });
                                    setTimeout(()=>{
                                        relay_data$.next(_combined_in[1]);
                                        relay_ctrl$.next(_combined_in[0]);
                                    }, 1);
                                }
                            });
                        }
                        else {
                            relay_data$.next(_combined_in[1]);
                            relay_ctrl$.next(_combined_in[0]);
                        }
                        //const spell_output = await spellop;
                        //return _combined_in;
                        //return new BehaviorSubject(spell_output);
                        //return spell_output;
                        return spell_output_relay$;
                    }),
                    //switchMap(_relay$ => {
                    //    return _relay$;
                    //}),
                    withLatestFrom(spell_output_relay$),
                    map(_combined_in => {

                        _outflow_data$.next(_combined_in[1][1]);

                        outer_relay_ctrl$.next(_combined_in[1][0]);
                        return _combined_in[1]; // pass thru the data in the flow;
                    }),
                    withLatestFrom(outer_relay_ctrl$),
                    map(_out_sig => {
                        return _out_sig[1];
                    }),
                    finalize( () => { 
                        console.log('spell stream: finalizing spell, ', spellname); 
                        if (spell_subscription !== undefined) {
                            console.log("spell stream: unsubscribing spell, ", spellname);
                            spell_subscription.unsubscribe();
                            spell_subscription = undefined;
                        }
                        //if (op_subs !== undefined) {
                        //    op_subs.unsubscribe();
                        //    op_subs = undefined;
                        //}
                    }),
                    share()
                );
                return {_stream: _outflow_data$, _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            };

            // test using /editor/spark/genericspell
            const _genericspell_flowfunc = (_input$objArr, _controlflow$obj) => {
                const _outflow_data$ = new Subject();
                const relay_ctrl$ = new Subject(); //_combined_in[0]);
                const relay_data$ = new Subject(); //_combined_in[1]);
                const spell_output_relay$ = new Subject();
                const outer_relay_ctrl$ = new Subject(); //BehaviorSubject(_combined_in[1][0]);
                let spell_subscription = undefined;

                const inflow_data$ = (_input$objArr.length > 1 ? merge(..._input$objArr.map(_in$obj=>_in$obj._stream)) : _input$objArr[0]._stream);
    
                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    withLatestFrom(inflow_data$),
                    switchMap( _combined_in => {
                        const _ctrl_in = _combined_in[0];
                        const _data_in = _combined_in[1];
    
                        if (isBottle(_data_in) && _data_in._bname === GENERIC_SPELL_BNAME) {
                            const spell_nodeuuid = _data_in._content.nodeuuid;
                            const spell_input = _data_in._content.input;
                            //const _node_attributes = lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(spell_nodeuuid);
                            const spell_etaTree = lambdactrl.gos.etaTree.leafgraph.graph.dataflow.nodes().includes(spell_nodeuuid) ? lambdactrl.gos.etaTree : lambdactrl.gos.etaTree.hostEtaTree;
                            const refnodedata = spell_etaTree?.leafgraph.graph.dataflow.getNodeAttributes(spell_nodeuuid).leafnode.data;

                            console.log("spellleaf generic: ", refnodedata);

                            // spark_dev_note: 12/Mar/2024
                            // implement sanity check here to see if the spell being cast is defined by a spelldef node.
                            // this can be done by checking if refnodedata indicates that the node of interest is of type spelldef.
                            // lookupLEAFNodeMethods() relies on the methods of a spelldef node, hence the need for sanity check as 
                            // this generic spell casting workflow would NOT work for any other node types. 
                            // 
                            // memoize the following spell parsing step for performance
                            if (["leafspelldef", "leaflabel"].includes(refnodedata?.leaf?.logic?.type)) // sanity check
                            {
                                const runtime_spellname = refnodedata.leaf.logic.args.spellname;
                                spellprom = lambdactrl.gos.etaTree.lookupLEAFNodeMethods(spell_nodeuuid);
                                console.log("spell stream: subscribing runtime spell, ", runtime_spellname);

                                _executeSpell(spellprom, relay_ctrl$, relay_data$).then( spell_output$ => {
                                    if (spell_output$ === undefined) {
                                        relay_data$.next(_combined_in[1]);
                                        //relay_data$.next(undefined);
                                        relay_ctrl$.next(_combined_in[0]);
                                    }
                                    else {
                                        spell_subscription = spell_output$.subscribe({
                                            next: _next_out => {
                                                console.log(`leafspell ${spellname} output: ${_next_out}`);
                                                spell_output_relay$.next(_next_out);
                                            },
                                            error: emsg => {
                                                console.error(`leafspell ${spellname} had an error in the subscription stream: ${emsg}`);
                                            },
                                            complete: () => {
                                                console.log(`leafspell ${spellname} subscription completed.`);
                                            }
                                        });
                                        setTimeout(()=>{
                                            //relay_data$.next(_combined_in[1]);
                                            relay_data$.next(spell_input);
                                            relay_ctrl$.next(_combined_in[0]);
                                        }, 1);
                                    }
                                });
                            }
                            else {
                                relay_data$.next(_combined_in[1]);
                                relay_ctrl$.next(_combined_in[0]);
                            }
                        }
                        else {
                            relay_data$.next(_combined_in[1]);
                            relay_ctrl$.next(_combined_in[0]);
                        }

                        return spell_output_relay$;
    
                    }),
                    withLatestFrom(spell_output_relay$),
                    map(_combined_in => {

                        _outflow_data$.next(_combined_in[1][1]);

                        outer_relay_ctrl$.next(_combined_in[1][0]);
                        return _combined_in[1]; // pass thru the data in the flow;
                    }),
                    withLatestFrom(outer_relay_ctrl$),
                    map(_out_sig => {
                        return _out_sig[1];
                    }),
                    finalize( () => { 
                        console.log('spell stream: finalizing spell, ', spellname); 
                        if (spell_subscription !== undefined) {
                            console.log("spell stream: unsubscribing spell, ", spellname);
                            spell_subscription.unsubscribe();
                            spell_subscription = undefined;
                        }
                        //if (op_subs !== undefined) {
                        //    op_subs.unsubscribe();
                        //    op_subs = undefined;
                        //}
                    }),
                    share()
                );
                return {_stream: _outflow_data$, _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            };

            const postprocessfunc = (_data_in) => {
                if (refnode === "b5a20ce3-3e67-42cd-9f60-3f70c6acd269")
                    console.log("start debugging");
                const _data_out = _data_in;
                return _data_out;
            };
            
            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 20000}, TIMEOUTBEHAVIOR_BESTEFFORT, {...node_context})}];
            const output$obj = driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, 
                {...node_context, metastep: "executing spell "+spellname}, 
                {
                    leaflogic: is_generic_spell ? _genericspell_flowfunc : _nodeflowfunc, //spelldefProm, //spelldef._default, 
                    datalogic: {
                        pre: preprocessfunc,
                        post: postprocessfunc
                    }
                }
            );

            //return output$obj;

            return {
                _stream: output$obj._stream.pipe(
                    //filter(_outflow_data => _outflow_data !== raceConditionError),
                    map(_data_out => {
                        return _data_out;
                    }),
                    share()
                ), 
                _control: {
                    _stream: output$obj._control._stream.pipe(
                        //filter(_outflow_data => _outflow_data !== raceConditionError),
                        map(_ctrl_out => {
                            return _ctrl_out;
                        }),
                        share()
                    )
                }
            }

            //const reduced_spelldef$ = of(1).pipe(
            //    concatMap(_ => {
            //        return Promise.resolve(parseSpellBook())
            //    }),
            //    timeout(60000),
            //    catchError(error=>{
            //        const errormsg = `parseSpellBook() for spell ${spellname} (refnode: ${refnode}) timed out: ${error}`;
            //        console.error(errormsg);
            //        return of(errormsg);
            //    })
            //)
            //const combined_input$obj = combineDataflows(refnode, [{_stream: preprocessedinput$}, {_stream: reduced_spelldef$}]);
            //console.log(`parsed spellbook for spell ${spellname} (refnode: ${refnode}): `);

            //const _out$ = reduced_spelldef$.pipe(
            //    concatMap( (spelldef) => {
            //        if (spelldef && '_default' in spelldef) {
            //            const _nodeleafinst$obj = executeLEAFLogicInSync(spelldef._default, preprocessedinput$, undefined, {...controlflow$obj._config});
            //            // spark_dev_note: started debugging rxjs and found the inter-conversion between
            //            // data and stream$ quite tricky as multiple streams are weaved as per (weaveDataflows) eta.js and leaf.js
            //            // also tricky is to maintain subscriptions that are spawned upon invoking executeLEAFLogic() 
            //            // whose function relies on firstValueFrom to convert stream$ into a Promise but limits the 
            //            // execution of any LEAF logic into passing thru a single LEAF message.  
            //            // A behavior subject instance (nodeiosubject_in$) can be passed to any execution instance 
            //            // requiring extended message subscription listening indefinitely for 
            //            // event-driven messages,
            //            // to have inputdata messaged across via calling nodeiosubject_in$.next(<some message>).
            
            //            //return executeLEAFLogicInSync(spelldef._default, of(inputdata), {...controlflow$obj._config})._stream;
            //            return _nodeleafinst$obj._stream;
            //        }
            //        else {
            //            console.error(`LEAF Error: _leafspell() called with spellname ${spellname} is missing a default dataflow component graph definition.`);
            //            return mergedinput$obj._stream;
            //        }
            //    }),
            //    map(_ => {
            //        console.log(_);
            //        return Array.isArray(_) ? _.flat() : _;
            //    })
            //);

            //return {_stream: _out$, _control: controlflow$obj};
            //if (spelldef && '_default' in spelldef) {
            //    const _nodeleafinst$obj = executeLEAFLogicInSync(spelldef._default, preprocessedinput$obj._stream, undefined, controlflow$obj._stream.pipe(map(_ctrldata=>{
            //        return _ctrldata;
            //    })), {...controlflow$obj._config});
            //    //._stream.pipe(
            //    //    map( _outputdata => {
            //    //        console.log(_outputdata);
            //    //        return _outputdata;
            //    //    })
            //    //);
            //    // spark_dev_note: started debugging rxjs and found the inter-conversion between
            //    // data and stream$ quite tricky as multiple streams are weaved as per (weaveDataflows) eta.js and leaf.js
            //    // also tricky is to maintain subscriptions that are spawned upon invoking executeLEAFLogic() 
            //    // whose function relies on firstValueFrom to convert stream$ into a Promise but limits the 
            //    // execution of any LEAF logic into passing thru a single LEAF message.  
            //    // A behavior subject instance (nodeiosubject_in$) can be passed to any execution instance 
            //    // requiring extended message subscription listening indefinitely for 
            //    // event-driven messages,
            //    // to have inputdata messaged across via calling nodeiosubject_in$.next(<some message>).
    
            //    //return executeLEAFLogicInSync(spelldef._default, of(inputdata), {...controlflow$obj._config})._stream;
            //    //return _nodeleafinst$obj;
            //    return {_stream: _nodeleafinst$obj._stream, _control: _nodeleafinst$obj._control};
            //}
            //else {
            //    console.error(`LEAF Error: _leafspell() called with spellname ${spellname} is missing a default dataflow component graph definition.`);
            //    return preprocessedinput$obj;
            //}

            //const reduced_spelldef$ = of(1).pipe(
            //    concatMap(_ => {
            //        return Promise.resolve(parseSpellBook())
            //    }),
            //    timeout(60000),
            //    catchError(error=>{
            //        const errormsg = `parseSpellBook() for spell ${spellname} (refnode: ${refnode}) timed out: ${error}`;
            //        console.error(errormsg);
            //        return of(errormsg);
            //    })
            //).subscribe();

            //if (!nodeiosubject_in$.observed) {
            //    reduced_spelldef$.pipe(
            //        concatMap( (spelldef) => {
            //            if (spelldef && '_default' in spelldef) {
            //                const _nodeleafinst$ = executeLEAFLogicInSync(spelldef._default, nodeiosubject_in$, undefined, {...controlflow$obj._config})._stream;
            //                // spark_dev_note: started debugging rxjs and found the inter-conversion between
            //                // data and stream$ quite tricky as multiple streams are weaved as per (weaveDataflows) eta.js and leaf.js
            //                // also tricky is to maintain subscriptions that are spawned upon invoking executeLEAFLogic() 
            //                // whose function relies on firstValueFrom to convert stream$ into a Promise but limits the 
            //                // execution of any LEAF logic into passing thru a single LEAF message.  
            //                // A behavior subject instance (nodeiosubject_in$) can be passed to any execution instance 
            //                // requiring extended message subscription listening indefinitely for 
            //                // event-driven messages,
            //                // to have inputdata messaged across via calling nodeiosubject_in$.next(<some message>).
            //    
            //                //return executeLEAFLogicInSync(spelldef._default, of(inputdata), {...controlflow$obj._config})._stream;
            //                return _nodeleafinst$;
            //            }
            //            else {
            //                console.error(`LEAF Error: _leafspell() called with spellname ${spellname} is missing a default dataflow component graph definition.`);
            //                return mergedinput$obj._stream;
            //            }
            //        }),
            //        map(_ => {
            //            console.log(_);
            //            return Array.isArray(_) ? _.flat() : _;
            //        })
            //    ).subscribe({
            //        next: x => {
            //            nodeiosubject_out$.next(x);
            //            if (["18c0", "3a9a"].includes(refnode.slice(0,4)))
            //                console.log("start debugging");
            //        },
            //        complete: () => {
            //            if (["18c0", "3a9a"].includes(refnode.slice(0,4)))
            //                console.log("start debugging");
            //        }
            //    });
            //}

            //combined_input$obj._stream.pipe(
            //    //take(1),
            //    concatMap( (_metadata) => {
            //        const [inputdata, spelldef] = _metadata.length === 2 ? _metadata : [_metadata.slice(0,-1), _metadata.slice(-1)[0]];
            //        if (["18c0", "3a9a"].includes(refnode.slice(0,4)))
            //            console.log("start debugging");
            //        if (spelldef && '_default' in spelldef) {
            //            nodeiosubject_in$.next(inputdata);
            //            return combined_input$obj._stream;
            //        }
            //        else {
            //            console.error(`LEAF Error: _leafspell() called with spellname ${spellname} is missing a default dataflow component graph definition.`);
            //            return mergedinput$obj._stream;
            //        }
            //    })
            //).subscribe({
            //    next: x => {
            //        //nodeiosubject_out$.next(x);
            //        if (["18c0", "3a9a"].includes(refnode.slice(0,4)))
            //            console.log("start debugging");
            //    },
            //    complete: () => {
            //        if (["18c0", "3a9a"].includes(refnode.slice(0,4)))
            //            console.log("start debugging");
            //    }
            //});

            //return {_stream: nodeiosubject_out$, _control: controlflow$obj};
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // look up the spell from spellbooks in the order of precedence
        const spellname = refnodedata.leaf.logic.args.spellname;
        //if (refnode.slice(0,4) === 'dec1')
        //    console.log("start debugging");
        let reduced_spelldef = undefined;

        let spell_lambda_obj = {};
        let _contextuallambda = contextuallambda;
        if (!reduced_spelldef) { 
            spell_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
            const _keywordlist = getEtaContext(spell_lambda_obj);

            if (_keywordlist.length > 0) { // if contextuallambda labels do exists on the spell node
                // re-evaluate the node's lambda graphs
                _contextuallambda = _contextuallambda.concat(_keywordlist);
                spell_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree});
            }
            if (spell_lambda_obj && spellname in spell_lambda_obj) {
                reduced_spelldef = spell_lambda_obj[spellname];
            }

            // test 
            //reduced_spelldef = {_default: input$ => [337]};
            // end of test 
        }

        const lookupSpellBook = _lookupSpellBook(spell_lambda_obj);

        if (!reduced_spelldef) {
            const userspellbook = lambdactrl.user.spellbook;
            const userlambdalut = lambdactrl.user.lambdalut;
            reduced_spelldef = await lookupSpellBook({refnode, spellbook: userspellbook, spellname, lambdalut: userlambdalut, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree}); // TBD: look up the eta-reduced matching spell def by name 
        }
        if (!reduced_spelldef) {
            const stdlambdalut = lambdactrl.gos.stdlambdalut;
            const stdspellbook = lambdactrl.gos.standardSpellbook;
            reduced_spelldef = await lookupSpellBook({refnode, spellbook: stdspellbook, spellname, lambdalut: stdlambdalut, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree});
        }
        if (!reduced_spelldef) { // if lookup failed so far, curatedspellbook is last in the order of precedence
            const curatedlambdalut = lambdactrl.gos.curatedlambdalut;
            const curatedspellbook = lambdactrl.gos.curatedSpellbook;
            reduced_spelldef = await lookupSpellBook({refnode, spellbook: curatedspellbook, spellname, lambdalut: curatedlambdalut, contextuallambda: _contextuallambda, etaTree: lambdactrl.gos.etaTree});
        }
        //const lambda_lut = {};
        //console.error(`LEAF Error: the leafspell construct (${refnode}) is invalid because it is defined outside the dataflow plane scope.`);
        //lambda_lut._default = (input$) => { // leaf dataflow identity function that does nothing
        //    return input$; // do nothing
        //};
        //if (refnode.slice(0,4) === 'dec1') {
        //    console.log("start debugging");
        //    executeLEAFLogicInSync(reduced_spelldef.accio._default, [], {})._stream.subscribe(
        //        x => {
        //            console.log(x);
        //        }
        //    );
        //}
        return reduced_spelldef;
    },
};

export { _leafspell };
