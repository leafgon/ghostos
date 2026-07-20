import { etaReduceLambdaGraphs } from "../../eta.js";
import { map, withLatestFrom, share } from "rxjs/operators";
import { _leafstdlib_dataflow_api } from "../../../metamodel.js";
import { fetchMultiKeyedData } from "../../../utils/fetchnodedata.js";
import { Subject } from "rxjs";
import safeStringify from "fast-safe-stringify";
import { v5 as uuid5 } from "uuid";
import { SHA1 } from "../../../utils/crypto.js";
import { etaTreeForest } from "../../etatreeforest.js";
import { isBottle } from "../../predicates.js";
import { driveDataflowByCtrlflow } from "../../leaf.js";
import { doBottle } from "../datautils/bottling.js";
import { driveNodeByRuntimePolicy } from "../../runtime/policyExecution.js";
import { redactValue } from "../../runtime/safeLogging.js";
const leaf_apidef = _leafstdlib_dataflow_api("leafmemoryio");

class MemoryRuntimePolicyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "MemoryRuntimePolicyError";
    this.code = "invalid_memory_runtime_policy";
    this.details = details;
  }
}

const LOCAL_MEMORY_MODES = new Set(["local", "memory", "in-memory"]);

const assertLeafMemoryPersistencePolicy = ({ persistenceMode = "local" } = {}) => {
  if (!LOCAL_MEMORY_MODES.has(persistenceMode)) {
    throw new MemoryRuntimePolicyError(
      "Persistent leafmemoryio policy mode is blocked until idempotency metadata and durable storage are defined.",
      {
        field: "persistenceMode",
        value: persistenceMode,
      },
    );
  }
  return persistenceMode;
};

const createLeafMemoryPolicyState = () => ({
  current: new Map(),
  history: [],
});

const snapshotLeafMemoryState = (state) => {
  const current = Object.fromEntries(
    Array.from(state.current.entries()).map(([key, record]) => [key, { ...record }]),
  );
  return Object.freeze({
    current,
    history: Object.freeze(state.history.map((record) => Object.freeze({ ...record }))),
  });
};

const createLeafMemoryCheckpoint = ({ state, checkpointId = "checkpoint" } = {}) => {
  if (!state?.current || !state?.history) {
    throw new MemoryRuntimePolicyError("Memory checkpoint requires policy state.", {
      field: "state",
    });
  }
  return Object.freeze({
    checkpointId,
    stateVersion: state.history.length,
    snapshot: snapshotLeafMemoryState(state),
  });
};

const validateLeafMemoryReplay = ({ state, targetEventId, checkpoint } = {}) => {
  if (!checkpoint) {
    throw new MemoryRuntimePolicyError("leafmemoryio replay requires an explicit checkpoint.", {
      field: "checkpoint",
    });
  }
  const record = state?.history?.find((entry) => entry.eventId === targetEventId);
  if (!record) {
    throw new MemoryRuntimePolicyError("leafmemoryio replay target is not present in state.", {
      field: "targetEventId",
      value: targetEventId,
    });
  }
  return record;
};

const writeLeafMemoryPolicyState = ({ state, memoryKey, value, runtime }) => {
  const serialized = safeStringify(value);
  const previous = state.current.get(memoryKey);
  const stateVersion = (previous?.stateVersion ?? 0) + 1;
  const record = Object.freeze({
    memoryKey,
    signature: SHA1(serialized),
    payload: serialized,
    raw: value,
    stateVersion,
    eventId: runtime.event.eventId,
    parentEventIds: [runtime.event.eventId, ...(runtime.event.trace?.parentEventIds ?? [])],
    trigger: runtime.decision.reason,
  });
  state.current.set(memoryKey, record);
  state.history.push(record);
  return record;
};

const driveLeafMemoryByRuntimePolicy = ({
  memoryname,
  memoryKey = memoryname,
  persistenceMode = "local",
  inflowCtrlObj,
  dataInflowObjArr = [],
  metaCtrl$,
  context = {},
  observability = {},
} = {}) => {
  assertLeafMemoryPersistencePolicy({ persistenceMode });
  if (typeof memoryname !== "string" || memoryname.trim().length === 0) {
    throw new MemoryRuntimePolicyError("leafmemoryio policy requires memoryname.", {
      field: "memoryname",
      value: memoryname,
    });
  }
  const state = createLeafMemoryPolicyState();
  const runtimeTargetKey = context.runtimeTargetKey ?? "node:leafmemoryio";

  const driver = driveNodeByRuntimePolicy({
    inflowCtrlObj,
    dataInflowObjArr,
    metaCtrl$,
    context: {
      nodeId: context.nodeId ?? "leafmemoryio",
      runtimeTargetKey,
      ...context,
    },
    policy: {
      mode: "policy",
      trigger: "data",
    },
    transformation: {
      leaflogic: ([value], _controlValue, runtime) => {
        const record = writeLeafMemoryPolicyState({
          state,
          memoryKey,
          value,
          runtime,
        });
        observability.traceSink?.emit(
          redactValue({
            event: "leafmemoryio_state_decision",
            runtimeTargetKey,
            memoryname,
            memoryKey,
            decision: "write",
            stateVersion: record.stateVersion,
            signature: record.signature,
            eventId: record.eventId,
            parentEventIds: record.parentEventIds,
            trigger: record.trigger,
          }),
        );
        return {
          memoryname,
          memoryKey,
          decision: "write",
          stateVersion: record.stateVersion,
          signature: record.signature,
        };
      },
    },
    observability,
  });

  return Object.freeze({
    ...driver,
    memory: Object.freeze({
      checkpoint: (checkpointId) => createLeafMemoryCheckpoint({ state, checkpointId }),
      snapshot: () => snapshotLeafMemoryState(state),
      validateReplay: ({ targetEventId, checkpoint } = {}) =>
        validateLeafMemoryReplay({ state, targetEventId, checkpoint }),
    }),
  });
};

const isPersistentMemory = (_name, _uri, _lambdaobj, _spade_lambda) => {
  //const thespadeuuid = _lambdactrl.gos.etaTree.leafgraph.thespade.uuid;
  //_lambdactrl.gos.etaTree.lookupRuntimeLambdaLUT("breezyforest", "main", thespadeuuid, [], []);
  // https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848
  //const _spade_labels = Object.keys(_spade_lambda);
  //const intersection = Object.keys(_lambdaobj).filter(x => _spade_labels.includes(x));
  const isvalidmemoryref = Object.keys(_spade_lambda).includes(_name);
  //console.log(isvalidmemoryref);

  if (isvalidmemoryref) return true;
  else return false;
};

/*
 * _leafscreenio() is a dataflow-plane-scoped function for the LEAF node of logic type 'leafscreenio'.
 * it is used to declare a screen io object in a dataflow-scoped leaf component graph.
 */
const _leafmemoryio = {
  dataflow:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      // space for node type specific init prior to use

      const reduced_lambda_obj = await etaReduceLambdaGraphs({
        refnode,
        nodelambda,
        contextuallambda,
        etaTree: lambdactrl.gos.etaTree,
      });

      const { args } = refnodedata.leaf.logic;
      const memoryname = fetchMultiKeyedData(leaf_apidef.editorconfig.namedatakey, args);

      const { domain, appid } = lambdactrl.gos.etaTree;
      const leafspade_uri = `www.leafgon.com/mnemosyne/${domain}/${appid}/${memoryname}`;
      const memorykey = uuid5(leafspade_uri, uuid5.URL); // uuid deterministically generated based on domain and appid

      const ismarkedglobal = "global" in reduced_lambda_obj ? true : false;
      const is_on_tap = "on-tap" in reduced_lambda_obj ? true : false;
      const is_proxy = "proxy" in reduced_lambda_obj ? true : false;

      const thespadeuuid = lambdactrl.gos.etaTree.leafgraph.thespade?.uuid;
      const spade_lambda =
        thespadeuuid && ismarkedglobal
          ? await lambdactrl.gos.etaTree.lookupRuntimeLambdaLUT(
              "breezyforest",
              "main",
              thespadeuuid,
              lambdactrl.gos.etaTree.leafgraph.edges.lambda.sourcelut[thespadeuuid],
              [],
            )
          : undefined;
      if (refnode.slice(0, 4) === "4d34") console.log("start debugging");
      if (ismarkedglobal) {
        isPersistentMemory(memoryname, leafspade_uri, reduced_lambda_obj, spade_lambda);
      }
      const node_context = {
        codebase: "leafmemoryio.js",
        refnode,
        leafnode:
          refnode !== "jest" &&
          lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode)?.leafnode.data,
      };

      return (input$objArr, controlflow$obj) => {
        // identify function
        if (memoryname === "userinput1") console.log(memoryname);
        if (memoryname === "details") console.log(memorykey);

        const preprocessfunc = (_data_in) => {
          //const _data_out = doUnbottle(undefined, _data_in); // unbottle all bottles
          //flowinterface.data_in.next(_data_in);
          const _data_out = _data_in; // do nothing
          return _data_out;
        };

        // spark_dev_note: 19/Jun/2023
        // #databus
        //const isamnesia = (_signal) => {
        //    return (isBottle(_signal) && _signal._bname === "_databus" &&
        //        _signal._label._type === "memoryio" && _signal._label._command === "forget");
        //};
        const isamnesia = (_signal) => {
          return (
            isBottle(_signal) &&
            _signal._bname !== undefined &&
            _signal._label._type === "memoryio" &&
            _signal._label._command === "forget"
          );
        };

        const isEmptyBottle = (_data) => {
          return isBottle(_data)
            ? _data._bname === "empty_bottle" || _data._bname === "nothing"
            : false;
        };
        const domemoryio = (_data, _proxy_memkey = undefined) => {
          //if (memoryname === 'csrf_token')
          //    console.log(memorykey);
          const cur_memkey = _proxy_memkey ? _proxy_memkey : memorykey;
          if (_data !== undefined && !isEmptyBottle(_data)) {
            //const resolved_data = await Promise.resolve(_data); // as per the discussion in https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise

            if (memoryname === "captionwin") console.log(memoryname);
            if (memoryname === "main" && refnode.slice(0, 4) === "188d") console.log(memoryname);

            if (isamnesia(_data)) {
              //if (lambdactrl.gos.etaTree.mnemosyne.current.hasOwnProperty(memorykey))
              //    delete lambdactrl.gos.etaTree.mnemosyne.current[memorykey];
              //return {..._data,
              //    _label: {..._data.label,
              //        _memoryname: memoryname, _refnode: refnode,
              //        _nodelocation: {domain: lambdactrl.gos.etaTree.domain, appid: lambdactrl.gos.etaTree.appid}
              //    }
              //};
              const _payload = is_on_tap
                ? doBottle("nothing", null, {
                    _type: "memoryio",
                    _command: "io",
                    _memoryname: memoryname,
                    _refnode: refnode,
                    _nodelocation: {
                      domain: lambdactrl.gos.etaTree.domain,
                      appid: lambdactrl.gos.etaTree.appid,
                    },
                  })
                : null;
              const serialized_data = safeStringify(_payload);
              const mnemosyne_data = {
                signature: SHA1(serialized_data),
                payload: serialized_data,
                raw: _payload,
              };
              lambdactrl.gos.etaTree.mnemosyne.current = {
                ...lambdactrl.gos.etaTree.mnemosyne.current,
                [cur_memkey]: mnemosyne_data,
              }; // store in the local main mnemosyne.

              // spark_dev_note: 19/Jun/2023
              // #databus
              //return enterDataBus(_payload,
              //    {
              //        _type: "memoryio",
              //        _command: "io",
              //        _memoryname: memoryname, _refnode: refnode,
              //        _nodelocation: {domain: lambdactrl.gos.etaTree.domain, appid: lambdactrl.gos.etaTree.appid}
              //    }
              //);
              return is_on_tap
                ? _payload
                : doBottle(memoryname, _payload, {
                    _type: "memoryio",
                    _command: "io",
                    _memoryname: memoryname,
                    _refnode: refnode,
                    _nodelocation: {
                      domain: lambdactrl.gos.etaTree.domain,
                      appid: lambdactrl.gos.etaTree.appid,
                    },
                  });
            } else {
              //const _payload = exitDataBus({_bus:_data});
              const _payload = _data;
              const serialized_data = safeStringify(_payload);
              const mnemosyne_data = {
                signature: SHA1(serialized_data),
                payload: serialized_data,
                raw: _payload,
              };
              lambdactrl.gos.etaTree.mnemosyne.current = {
                ...lambdactrl.gos.etaTree.mnemosyne.current,
                [cur_memkey]: mnemosyne_data,
              }; // store in the local main mnemosyne.

              // spark_dev_note: 19/Jun/2023
              // #databus
              //return enterDataBus(_payload,
              //    {
              //        _type: "memoryio",
              //        _command: "io",
              //        _memoryname: memoryname, _refnode: refnode,
              //        _nodelocation: {domain: lambdactrl.gos.etaTree.domain, appid: lambdactrl.gos.etaTree.appid}
              //    }
              //);
              return is_on_tap
                ? _payload
                : doBottle(memoryname, _payload, {
                    _type: "memoryio",
                    _command: "io",
                    _memoryname: memoryname,
                    _refnode: refnode,
                    _nodelocation: {
                      domain: lambdactrl.gos.etaTree.domain,
                      appid: lambdactrl.gos.etaTree.appid,
                    },
                  });
            }
          } else {
            if (memoryname === "backdrop") console.log("start debugging");
            if (cur_memkey in lambdactrl.gos.etaTree.mnemosyne.current) {
              const mnemosyne_data = lambdactrl.gos.etaTree.mnemosyne.current[cur_memkey];

              // spark_dev_note: 19/Jun/2023
              // #databus
              //return enterDataBus(mnemosyne_data.raw,
              //    {
              //        _type: "memoryio",
              //        _command: "o",
              //        _memoryname: memoryname, _refnode: refnode,
              //        _nodelocation: {domain: lambdactrl.gos.etaTree.domain, appid: lambdactrl.gos.etaTree.appid}
              //    }
              //);
              return is_on_tap
                ? mnemosyne_data.raw
                : doBottle(memoryname, mnemosyne_data.raw, {
                    _type: "memoryio",
                    _command: "o",
                    _memoryname: memoryname,
                    _refnode: refnode,
                    _nodelocation: {
                      domain: lambdactrl.gos.etaTree.domain,
                      appid: lambdactrl.gos.etaTree.appid,
                    },
                  });
            } else {
              // spark_dev_note: 19/Jun/2023
              // #databus
              //return enterDataBus(undefined,
              //    {
              //        _type: "memoryio",
              //        _command: "forget",
              //        _memoryname: memoryname, _refnode: refnode,
              //        _nodelocation: {domain: lambdactrl.gos.etaTree.domain, appid: lambdactrl.gos.etaTree.appid}
              //    }
              //);
              const _payload = is_on_tap
                ? doBottle("nothing", null, {
                    _type: "memoryio",
                    _command: "forget",
                    _memoryname: memoryname,
                    _refnode: refnode,
                    _nodelocation: {
                      domain: lambdactrl.gos.etaTree.domain,
                      appid: lambdactrl.gos.etaTree.appid,
                    },
                  })
                : null;
              return is_on_tap
                ? _payload
                : doBottle(memoryname, _payload, {
                    _type: "memoryio",
                    _command: "forget",
                    _memoryname: memoryname,
                    _refnode: refnode,
                    _nodelocation: {
                      domain: lambdactrl.gos.etaTree.domain,
                      appid: lambdactrl.gos.etaTree.appid,
                    },
                  });
            }
          }
        };

        const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
          console.log("start debugging");
          const _outflow_data$ = new Subject(); //BehaviorSubject(raceConditionError);

          const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
            //concatMap(_ctrl_in=> {
            //    //flowinterface.ctrl_in.next(_ctrl_in);
            //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_=>_._stream)]);
            //}),
            withLatestFrom(..._input$objArr.map((_) => _._stream)),
            map((_combined_in) => {
              // spark_dev_note: 19/Jun/2023
              // #databus
              //const _next_data = _combined_in.slice(1).filter(_data=>
              //    (_data!==undefined && !(isBottle(_data) && _data._bname === "_databus" && _data._label._type !== "memoryio")));
              //const _next_data = _combined_in.slice(1).filter(_data=>
              //    (_data!==undefined));

              //if (_next_data.length === 1) {
              //    const memorybottle = domemoryio(_next_data[0]);
              //    _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
              //}
              //else if (_next_data.length > 1) { // in and out, presence of input data indicates the intention of memory write
              //    const memorybottle = domemoryio(_next_data);
              //    _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
              //}
              //else { // out only, no input data indicates the intention of memory retrieval
              //    const memorybottle = domemoryio(undefined);
              //    _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
              //}
              //return new BehaviorSubject(_combined_in[0]); // only pass the ctrl data in the flow;

              if (is_proxy) {
                const cur_sid = _combined_in[0].sid.slice(-1).pop(); // current sid
                const proxymemkey_uri = `www.leafgon.com/mnemosyne/${domain}/${appid}/${memoryname}/${cur_sid}`;
                const proxy_memkey = uuid5(proxymemkey_uri, uuid5.URL); // uuid deterministically generated based on domain and appid

                const memorybottle = domemoryio(_combined_in[1], proxy_memkey);
                _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
              } else {
                const memorybottle = domemoryio(_combined_in[1]);
                _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
              }

              return _combined_in[0];
            }),
            share(),
          );
          return {
            _stream: _outflow_data$,
            _control: { ..._controlflow$obj, _stream: _outflow_ctrl$ },
          };
        };

        //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
        //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
        const output$obj = driveDataflowByCtrlflow(
          controlflow$obj,
          input$objArr,
          undefined,
          { ...node_context, metastep: "memory io " + memoryname },
          { leaflogic: _nodeflowfunc, datalogic: { pre: preprocessfunc } },
        );

        return output$obj;
      };
    },
  lambda:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      // space for node type specific init prior to use
      const lambda_lut = {};

      // valid refnodes are leafmemoryio node instances defined as lambda with respect to the spade node
      const thespadeuuid = lambdactrl.gos.etaTree.leafgraph.thespade?.uuid;
      //const valid_refnodes = lambdactrl.gos.etaTree.leafgraph.edges.lambda.sourcelut[lambdactrl.gos.etaTree.leafgraph.thespade.uuid];
      const isvalid = thespadeuuid
        ? lambdactrl.gos.etaTree.leafgraph.edges.lambda.sourcelut[thespadeuuid].includes(refnode)
        : false;
      if (isvalid) {
        const { args } = refnodedata.leaf.logic;
        const memoryname = fetchMultiKeyedData(leaf_apidef.editorconfig.namedatakey, args);

        if (nodelambda.length > 0) {
          const reduced_lambda_obj = await etaReduceLambdaGraphs({
            refnode,
            nodelambda,
            contextuallambda,
            etaTree: lambdactrl.gos.etaTree,
          });
          lambda_lut[memoryname] = { ...reduced_lambda_obj }; // label the eta reduced obj
        } else {
          lambda_lut[memoryname] = {}; // label an empty object
        }
        //Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
        //    lambda_lut[key] = (input$) => { // a dataflow-scoped func per key
        //        const output$ = etafunc(input$);
        //        return output$;
        //    }
        //});
        return lambda_lut;
      } else {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda
        console.error(
          `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node ` +
            `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot ` +
            "be defined as a lambda-scoped node.",
        );
        //return (flowinput$Arr, controlflow$obj) => { // identify function
        //    return {...(mergeDataflows(flowinput$Arr)), _control: controlflow$obj};
        //};
        return lambda_lut; // {}
      }
    },

  methods:
    (lambdactrl) =>
    ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      const retrieveMasterEtaTree = (_etatree) => {
        if (!_etatree.hostEtaTree) return _etatree;
        return retrieveMasterEtaTree(_etatree.hostEtaTree);
      };
      const masterEtaTree = retrieveMasterEtaTree(lambdactrl.gos.etaTree);
      return {
        etatreeforest: etaTreeForest(masterEtaTree),
        //{
        //    setEtaTree: (treename, etaTree, parentname) => {
        //        masterEtaTree.mnemosyne.current[_etatreeforest_key][treename] = {tree: etaTree, parent: parentname};
        //        return data;
        //        //lambdactrl.gos.etaTree.mnemosyne.current = {...lambdactrl.gos.etaTree.mnemosyne.current, [memorykey]: data};
        //        // TBD: ponder about the best approach to mutating the master mnemosyne
        //        // lambdactrl.gos.etaTree.mnemosyne.current[memorykey] = data;
        //        // or to use the "pure" approach of store = {...store, [key]: val}
        //    },
        //    getEtaTree: (treename) => {
        //        return masterEtaTree.mnemosyne.current[_etatreeforest][treename].tree;
        //    }
        //},
        general: {
          setMasterMemory: (memoryname, data) => {
            const { domain, appid } = lambdactrl.gos.etaTree;
            const memory_uri = `www.leafgon.com/mnemosyne/${domain}/${appid}/${memoryname}`;
            const memorykey = uuid5(memory_uri, uuid5.URL); // uuid deterministically generated based on domain and appid
            masterEtaTree.mnemosyne.current[memorykey] = data;
            return data;
            //lambdactrl.gos.etaTree.mnemosyne.current = {...lambdactrl.gos.etaTree.mnemosyne.current, [memorykey]: data};
            // TBD: ponder about the best approach to mutating the master mnemosyne
            // lambdactrl.gos.etaTree.mnemosyne.current[memorykey] = data;
            // or to use the "pure" approach of store = {...store, [key]: val}
          },
          getMasterMemory: (memoryname) => {
            const { domain, appid } = lambdactrl.gos.etaTree;
            const memory_uri = `www.leafgon.com/mnemosyne/${domain}/${appid}/${memoryname}`;
            const memorykey = uuid5(memory_uri, uuid5.URL); // uuid deterministically generated based on domain and appid
            return masterEtaTree.mnemosyne.current[memorykey];
          },
        },
      };
    },
};

export {
  MemoryRuntimePolicyError,
  _leafmemoryio,
  assertLeafMemoryPersistencePolicy,
  createLeafMemoryCheckpoint,
  driveLeafMemoryByRuntimePolicy,
  snapshotLeafMemoryState,
  validateLeafMemoryReplay,
};
