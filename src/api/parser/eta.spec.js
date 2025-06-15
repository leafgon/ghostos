//import { doBottle } from "../../../ghostos/api/parser/nodelogic/datautils";

const { reconstructLEAFGraph, analyzeLEAFGraph } = require("../../../ghostos");
const { runtimeEtaTree, etaReduceDataflowComponent, doChronosSynchronize } = require('../../../ghostos/api/parser/eta');
const { init_gRuntimeLEAFlisp } = require('../../../ghostos/api/parser/nodelogic/wizardry/leaflisp');

const { useLEAFIOapi, initializeMasterSubsDirectory } = require('../../../ghostos');
const { initializeLEAFlakeGQLClient } = require('../../../ghostos/api/leafio/leaflake');
const { LEAFIOmetamodel } = require('../../../ghostos');

const { skip, from, of, repeat, delay, interval, withLatestFrom, ReplaySubject, merge, combineLatest, firstValueFrom, BehaviorSubject } = require('rxjs');
const { zipWith, tap, connect, map, take, share, switchMap } = require('rxjs/operators');

const { _leafmemoryio } = require('../../../ghostos/api/parser/nodelogic/io');
const { doBottle } = require("./nodelogic/datautils/bottling");
const { driveDataflowByCtrlflow } = require("./leaf");
const { chronosDataflow, CHRONOSTYPE_SYNC } = require("../utils/leafdataflow");

const ctrl_accio_bottle = doBottle('accio', 'ctrl_accio');
const data_accio_bottle = doBottle('accio', 'data_accio');

const toBase64Str = (_obj) => {
    return Buffer.from(JSON.stringify(_obj)).toString("base64");
}


describe("ghostos/api/parser eta.js tests", () => {
  const nodes = [
    {
      "uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566",
      "out_edges":[],
//      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGxkZWYiLCJhcmdzIjp7InNwZWxsbmFtZSI6Imxpc3RsaWIiLCJzdmdpY29uIjp7InVybCI6IiJ9fX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6NDgsInkiOjYwOH19fX0="
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafspelldef","args":{"spellname":"listlib","svgicon":{"url":""}}},"api":"breezyforest","appdata":{"position":{"x":48,"y":608}}}}
      )
    },
    {
      "uuid":"21eeb7bd-91e9-45f4-b7eb-db7031fb96c9",
      "out_edges":[{"uuid":"9680bb70-5546-4bb5-8123-1dc715079b91","source":{"uuid":"21eeb7bd-91e9-45f4-b7eb-db7031fb96c9"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmZ3JhcGgiLCJhcmdzIjp7ImdyYXBodXVpZCI6IiIsImRvbWFpbiI6IiIsImFwcGlkIjoiIiwiZ3JhcGhhZGRyc3RyIjoiL2VtYWlsaW5nbGlzdC1saWIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6LTgwLCJ5Ijo0NDcuOTk5OTk5OTk5OTk5OTR9fX19"
      "data":toBase64Str(
        //{"leaf":{"logic":{"type":"leafgraph","args":{"graphuuid":"","domain":"","appid":"","graphaddrstr":"/emailinglist-lib"}},"api":"breezyforest","appdata":{"position":{"x":-80,"y":447.99999999999994}}}}
        {"leaf":{"logic":{"type":"leafgraph","args":{"graphuuid":"","domain":"","appid":"","graphaddrstr":"breezyforest/leaflisp-help"}},"api":"breezyforest","appdata":{"position":{"x":-80,"y":447.99999999999994}}}}
      )
    },
    {
      "uuid":"b8f5dfa5-11ce-4374-814f-f740c54250a3",
      "out_edges":[{"uuid":"994d8e5b-13f3-4f55-8125-1e73732f0aa7","source":{"uuid":"b8f5dfa5-11ce-4374-814f-f740c54250a3"},"target":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmZGF0YWVkZ2UifX19"}],
      //"out_edges":[{"uuid":"994d8e5b-13f3-4f55-8125-1e73732f0aa7","source":{"uuid":"b8f5dfa5-11ce-4374-814f-f740c54250a3"},"target":{"uuid":"0b07305b-3720-4019-86db-77cc09b59684"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmZGF0YWVkZ2UifX19"}],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmaW5mbG93cG9ydCIsImFyZ3MiOnt9fSwiYXBpIjoiYnJlZXp5Zm9yZXN0IiwiYXBwZGF0YSI6eyJwb3NpdGlvbiI6eyJ4IjoyNTYsInkiOjgzMn19fX0="
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafinflowport","args":{}},"api":"breezyforest","appdata":{"position":{"x":256,"y":832}}}}
      )
    },
    {
      "uuid":"0b07305b-3720-4019-86db-77cc09b59684",
      "out_edges":[],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmb3V0Zmxvd3BvcnQiLCJhcmdzIjp7fX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6Njg4LCJ5Ijo4MDB9fX19"
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafoutflowport","args":{}},"api":"breezyforest","appdata":{"position":{"x":688,"y":800}}}}
      )
    },
    {
      "uuid":"b599577e-90a2-451a-a785-f3a13f1fd191",
      "out_edges":[{"uuid":"2a02ca63-2db7-45b7-bb6d-c2648576ee37","source":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"target":{"uuid":"0b07305b-3720-4019-86db-77cc09b59684"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmZGF0YWVkZ2UifX19"}],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6InN1YnNjcmliZSJ9fSwiYXBpIjoiYnJlZXp5Zm9yZXN0IiwiYXBwZGF0YSI6eyJwb3NpdGlvbiI6eyJ4Ijo0MzIsInkiOjc4NH19fSwiZG9tYWluIjoic3BhcmsiLCJhcHBpZCI6ImVtYWlsaW5nbGlzdCIsImlucHV0RGF0YSI6e30sImlzZGVidWciOnRydWUsInNlbGVjdGVkIjp0cnVlfQ=="
      "data":toBase64Str(
        //{"leaf":{"logic":{"type":"leafspell","args":{"spellname":"subscribe"}},"api":"breezyforest","appdata":{"position":{"x":432,"y":784}}},"domain":"spark","appid":"emailinglist","inputData":{},"isdebug":true,"selected":true}
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"cheatsheet"}},"api":"breezyforest","appdata":{"position":{"x":432,"y":784}}},"domain":"spark","appid":"emailinglist","inputData":{},"isdebug":true,"selected":true}
      )
    },
    {
      "uuid":"46587425-d42d-4b3c-8e88-e0ad949385b8",
      "out_edges":[{"uuid":"f7900fd4-a3bd-46f5-a7ad-e5d8309e8b63","source":{"uuid":"46587425-d42d-4b3c-8e88-e0ad949385b8"},"target":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6Imxpc3RsaWIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6NTI4LCJ5Ijo1NjB9fX19"
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"listlib"}},"api":"breezyforest","appdata":{"position":{"x":528,"y":560}}}}
      )
    },
    {
      "uuid":"a68ef576-7360-4fea-b695-b971413df2a0",
      "out_edges":[],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGxkZWYiLCJhcmdzIjp7InNwZWxsbmFtZSI6InRlc3RiZWQiLCJzdmdpY29uIjp7InVybCI6IiJ9fX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6MzUyLCJ5Ijo0MzJ9fX19"
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafspelldef","args":{"spellname":"testbed","svgicon":{"url":""}}},"api":"breezyforest","appdata":{"position":{"x":352,"y":432}}}}
      )
    },
    {
      "uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e",
      "out_edges":[{"uuid":"f9e3dc7c-df6a-4368-bb30-4ee0543cfa9d","source":{"uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e"},"target":{"uuid":"a68ef576-7360-4fea-b695-b971413df2a0"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmbGlzcCIsImFyZ3MiOnsibGlzcGV4cHJlc3Npb24iOiIoKyAocGFyc2UgaW5wb3J0KSAyKSJ9fSwiYXBpIjoiYnJlZXp5Zm9yZXN0IiwiYXBwZGF0YSI6eyJwb3NpdGlvbiI6eyJ4IjoyODgsInkiOjI3Mn19fX0="
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leaflisp","args":{"lispexpression":"(+ (parse inport) 2)"}},"api":"breezyforest","appdata":{"position":{"x":288,"y":272}}}}
      )
    },
    {
      "uuid":"793491e8-f258-4f4c-94ea-05ef501441df",
      "out_edges":[{"uuid":"cd7a6800-5376-4ae9-b970-983fb8e044d3","source":{"uuid":"793491e8-f258-4f4c-94ea-05ef501441df"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="},{"uuid":"17617b23-3bad-4ce8-98a8-0d221257ed42","source":{"uuid":"793491e8-f258-4f4c-94ea-05ef501441df"},"target":{"uuid":"49170156-ee49-42a0-b11d-f4338df04d71"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmYW5jaG9yZWRnZSJ9fX0="}],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmZ3JhcGgiLCJhcmdzIjp7ImdyYXBodXVpZCI6IiIsImRvbWFpbiI6IiIsImFwcGlkIjoiIiwiZ3JhcGhhZGRyc3RyIjoiYnJlZXp5Zm9yZXN0L3Byb2JlIn19LCJhcGkiOiJicmVlenlmb3Jlc3QiLCJhcHBkYXRhIjp7InBvc2l0aW9uIjp7IngiOjE0NCwieSI6MzIwfX19fQ=="
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafgraph","args":{"graphuuid":"","domain":"","appid":"","graphaddrstr":"breezyforest/probe"}},"api":"breezyforest","appdata":{"position":{"x":144,"y":320}}}}
      )
    },
    {
      "uuid":"3cb040f8-a719-4181-9943-fcc8dc3e588e",
      "out_edges":[{"uuid":"85731bfa-0ec4-44f7-b6c2-b20d8c9f60e3","source":{"uuid":"3cb040f8-a719-4181-9943-fcc8dc3e588e"},"target":{"uuid":"16b883ab-049c-4e99-8bfa-9357075d1e89"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6Imxpc3RsaWIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6OTc2LCJ5IjoxNzZ9fX0sImRvbWFpbiI6InNwYXJrIiwiYXBwaWQiOiJlbWFpbGluZ2xpc3QiLCJpbnB1dERhdGEiOnt9LCJpc2RlYnVnIjp0cnVlLCJzZWxlY3RlZCI6dHJ1ZX0="
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"listlib"}},"api":"breezyforest","appdata":{"position":{"x":976,"y":176}}},"domain":"spark","appid":"emailinglist","inputData":{},"isdebug":true,"selected":true}
      )
    
    },
    {
      "uuid":"16b883ab-049c-4e99-8bfa-9357075d1e89",
      "out_edges":[],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6InByb2JlIn19LCJhcGkiOiJicmVlenlmb3Jlc3QiLCJhcHBkYXRhIjp7InBvc2l0aW9uIjp7IngiOjEyMzIsInkiOjU0NH19fX0="
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"probe"}},"api":"breezyforest","appdata":{"position":{"x":1232,"y":544}}}}
      )
    },
    {
      "uuid":"49170156-ee49-42a0-b11d-f4338df04d71",
      "out_edges":[],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmbGlzcCIsImFyZ3MiOnsibGlzcGV4cHJlc3Npb24iOiIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6MTkyLCJ5Ijo1OTJ9fX19"
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leaflisp","args":{"lispexpression":""}},"api":"breezyforest","appdata":{"position":{"x":192,"y":592}}}}
      )
    },
    {
      "uuid":"6e72a6a9-f6da-4057-adf7-3eb87c3c1efb",
      "out_edges":[],
      //"data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmYW5jaG9yIiwiYXJncyI6e319LCJhcGkiOiJicmVlenlmb3Jlc3QiLCJhcHBkYXRhIjp7InBvc2l0aW9uIjp7IngiOjY4OCwieSI6NDY0fX19fQ=="
      "data":toBase64Str(
        {"leaf":{"logic":{"type":"leafanchor","args":{}},"api":"breezyforest","appdata":{"position":{"x":688,"y":464}}}}
      )
    }
  ];

  test("testing doChronosSynchronize()", async () => {
    const delay$ = new ReplaySubject(1);
    // actual test
    //const mode = "nav";
    //const domain = "spark";
    //const appid = "emailinglist";
    //const leafgraph = reconstructLEAFGraph(nodes);

    //const leafcomponents = analyzeLEAFGraph(leafgraph);

    //const mainMnemosyne = {current: {}};
    //const {getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback} = {undefined, undefined, undefined, undefined}; // useLEAFIOapi({dirOfSubjects:{}});
    //const leaflakeClient = initializeLEAFlakeGQLClient({
    //    _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_full,
    //});
    //console.log(JSON.stringify(leaflakeClient));
    //const leafRuntimeRef = {current: {
    //    leafio: {
    //        getCurLEAFIOState, 
    //        getMasterSubsDir,
    //        setNewLEAFIOState, 
    //        setLEAFIOCallback
    //    },
    //    leaflakeio: leaflakeClient
    //}};

    //// initialize leaf compiler
    //const etaTree = runtimeEtaTree(mode, domain, appid, domain, appid, leafgraph, leafcomponents, leafRuntimeRef.current.leafio, leafRuntimeRef.current.leaflakeio, mainMnemosyne); // leafRuntimeRef.current.masterSubsDir);
    //const gRuntimeLEAFlisp = init_gRuntimeLEAFlisp(etaTree, {data: data_accio_bottle, ctrl: ctrl_accio_bottle});
    //etaTree.gRuntimeLEAFlisp = gRuntimeLEAFlisp;

    //const lambdactrl = {
    //    gos: {
    //        standardSpellbook: {},
    //        curatedSpellbook: {},
    //        stdlambdalut: {},
    //        curatedlambdalut: {},
    //        leafio: etaTree.leafio,
    //        etaTree: etaTree, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
    //    }, 
    //    user: {
    //        spellbook: etaTree.graphcomponents.spelldefs,
    //        lambdalut: etaTree.leafgraph.edges.lambda.sourcelut,
    //    }
    //};
    //const leafgraph_args = {graphuuid: '', domain: 'breezyforest', appid: 'leaflisp-help', graphaddrstr: 'breezyforest/leaflisp-help'};
    ////const getLEAFGraph = etaTree.leafgraph.lambda(lambdactrl)({refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: []});
    ////const leafgraph = await getLEAFGraph; //.then((response) => {}) // async call to get leafgraph
    //const leafmemoryio_args = {elementconfig: {leafnodename: 'hello'}};
    //_leafmemoryio.dataflow(lambdactrl)({refnode: "jest", refnodedata: {leaf: {logic: {args: leafmemoryio_args}}}, nodelambda: [], contextuallambda: []})

    
    //const main_component = leafcomponents.components.nodegroups.runtime[0];
    //// spark_dev_note: TBD: currently there is no sanity check done on the main_component chosen from alalyzeLEAFGraph()
    //// this at times results in a loose leafnode hanging around somewhere be accidentally/erroneously chosen as the main_component
    //// fix it.
    //const leafGraphRuntime = await etaReduceDataflowComponent({refnode: "main", component_members: main_component, contextuallambda: [], etaTree: etaTree});
    ////const mainEtaFunc = leafGraphRuntime; // store the parsed graph in the "file-level global".

    const datainput$ = new ReplaySubject(1); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
    const ctrlinput$ = new ReplaySubject(1); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data

    const peepedinput$ = datainput$.pipe(
        map(x => {
            console.log('peephole:', x);
            return x;
        }),
        share()
    );
    datainput$.next(data_accio_bottle);
    ctrlinput$.next(ctrl_accio_bottle);
    const controlflow$obj = {_stream: ctrlinput$, _config: {}};
    //const mainloop_output$obj = leafGraphRuntime([{_stream: peepedinput$}], controlflow$obj);


    const _upstream_out$objArr = [{
        _stream: peepedinput$, 
        _control: controlflow$obj
    }]; 

    const {ctrl: _chronos_ctrl_out$, data: _chronos_data_out$ } = doChronosSynchronize(_upstream_out$objArr, {time: 1000, count:-1});

    const mainctrlsubs = _chronos_ctrl_out$.pipe(
        switchMap(x => {
            console.log('peephole ctrl out:', x);
            //_chronos_data_out$.next("debugging test");
            return _chronos_data_out$;
        })
    ).subscribe({
        next: x => {
            //outbuffer = outbuffer.concat(x);
            console.log('next: ', x);
            //reRenderApp();
        },
        error: (err) => { // error
            console.log('Error: ' + err);
        },
        complete: () => {
            console.log('subs complete: ');
            delay$.next(true);
        },
    });

    const endingcredit = await firstValueFrom(delay$)

    console.log(endingcredit);
    
  });

  test("testing driveDataflowByCtrlflow()", async () => {
    const controlflow$obj = {_stream: of({_bname: "ctrl", _content: "ctrl_in"})};
    const input$objArr = [{_stream: of({_bname: "data", _content: "data_in"})}];
    const consolidated_input$objArr = [{
        _stream: chronosDataflow(
            controlflow$obj._stream.pipe(map(_peep_in=>{
                return _peep_in;
            })), 
            input$objArr.map(_$obj=>_$obj._stream.pipe(map(_peep_in=>{
                return _peep_in;
            }))), 
            false, CHRONOSTYPE_SYNC, {time: 10000}
        )
    }];
    const preprocessfunc = (_data_in) => {
        //const _rt_cache = {...node_context};
        //const _data_out = doUnbottle(undefined, _data_in); // unbottle all bottles
        //flowinterface.data_in.next(_data_in);
        const _data_out = _data_in; // do nothing
        return _data_out;
    };
    const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
        //console.log("start debugging");
        return {_stream: _input$objArr[0]._stream, _control: {..._controlflow$obj}};
    };

    const output$obj = driveDataflowByCtrlflow(
        controlflow$obj, consolidated_input$objArr, undefined, 
        {metastep: "leaf outflow"}, 
        {
            leaflogic: _nodeflowfunc, 
            datalogic: {pre: preprocessfunc}
        }
    );

    const {ctrl: _chronos_ctrl_out$, data: _chronos_data_out$ } = doChronosSynchronize([output$obj], {time:-1, count:-1}, {at: "eta.spec.js testing driveDataflowByCtrlflow"});


    //combineLatest([output$obj._stream, output$obj._control._stream])
    //combineLatest([output$obj._control._stream, output$obj._stream])
    combineLatest([_chronos_data_out$, _chronos_ctrl_out$])
    //combineLatest([_chronos_ctrl_out$, _chronos_data_out$])
    //_chronos_ctrl_out$
    .pipe(
        map(x => {
            return x;
        })
        //switchMap(x => {
        //    return _chronos_data_out$;
        //})
    ).subscribe({
        next: x => {
            //outbuffer = outbuffer.concat(x);
            console.log('next: ', x);
            //reRenderApp();
        },
        error: (err) => { // error
            console.log('Error: ' + err);
        },
        complete: () => {
            console.log('subs complete: ', mainsubs);
            //delay$.next(true);
            delay$.next(true);
        },
    });

    //output$obj._stream.pipe(
    //    map(_data_out => {
    //        return _data_out;
    //    })
    //).subscribe({
    //    next: x => {
    //        //outbuffer = outbuffer.concat(x);
    //        console.log('next: ', x);
    //        //reRenderApp();
    //    },
    //    error: (err) => { // error
    //        console.log('Error: ' + err);
    //    },
    //    complete: () => {
    //        console.log('subs complete: ', mainsubs);
    //        delay$.next(true);
    //    },
    //});
  })

  test("testing reconstructLEAFGraph()", async () => {
    const delay$ = new ReplaySubject(1);
    // actual test
    const mode = "nav";
    const domain = "spark";
    const appid = "emailinglist";
    const leafgraph = reconstructLEAFGraph(nodes);

    const leafcomponents = analyzeLEAFGraph(leafgraph);

    const mainMnemosyne = {current: {}};
    const {getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback} = {undefined, undefined, undefined, undefined}; // useLEAFIOapi({dirOfSubjects:{}});
    const leaflakeClient = initializeLEAFlakeGQLClient({
        _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_full,
    });
    console.log(JSON.stringify(leaflakeClient));
    const leafRuntimeRef = {current: {
        leafio: {
            getCurLEAFIOState, 
            getMasterSubsDir,
            setNewLEAFIOState, 
            setLEAFIOCallback
        },
        leaflakeio: leaflakeClient
    }};

    // initialize leaf compiler
    const etaTree = runtimeEtaTree(mode, domain, appid, domain, appid, leafgraph, leafcomponents, leafRuntimeRef.current.leafio, leafRuntimeRef.current.leaflakeio, mainMnemosyne); // leafRuntimeRef.current.masterSubsDir);
    const gRuntimeLEAFlisp = init_gRuntimeLEAFlisp(etaTree, {data: data_accio_bottle, ctrl: ctrl_accio_bottle});
    etaTree.gRuntimeLEAFlisp = gRuntimeLEAFlisp;

    const lambdactrl = {
        gos: {
            standardSpellbook: {},
            curatedSpellbook: {},
            stdlambdalut: {},
            curatedlambdalut: {},
            leafio: etaTree.leafio,
            etaTree: etaTree, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
        }, 
        user: {
            spellbook: etaTree.graphcomponents.spelldefs,
            lambdalut: etaTree.leafgraph.edges.lambda.sourcelut,
        }
    };
    const leafgraph_args = {graphuuid: '', domain: 'breezyforest', appid: 'leaflisp-help', graphaddrstr: 'breezyforest/leaflisp-help'};
    //const getLEAFGraph = etaTree.leafgraph.lambda(lambdactrl)({refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: []});
    //const leafgraph = await getLEAFGraph; //.then((response) => {}) // async call to get leafgraph
    //const leafmemoryio_args = {elementconfig: {leafnodename: 'hello'}};
    //_leafmemoryio.dataflow(lambdactrl)({refnode: "jest", refnodedata: {leaf: {logic: {args: leafmemoryio_args}}}, nodelambda: [], contextuallambda: []})

    
    const main_component = leafcomponents.components.nodegroups.runtime[0];
    // spark_dev_note: TBD: currently there is no sanity check done on the main_component chosen from alalyzeLEAFGraph()
    // this at times results in a loose leafnode hanging around somewhere be accidentally/erroneously chosen as the main_component
    // fix it.
    const leafGraphRuntime = await etaReduceDataflowComponent({refnode: "main", component_members: main_component, contextuallambda: [], etaTree: etaTree});
    //const mainEtaFunc = leafGraphRuntime; // store the parsed graph in the "file-level global".

    const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in eta.js", codebase:"/src/ghostos/api/parser/eta.spec.js"}, {});
    const datainput$ = new BehaviorSubject(raceConditionError); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
    const ctrlinput$ = new BehaviorSubject(raceConditionError); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data

    const peepedinput$ = datainput$.pipe(
        map(x => {
            console.log('peephole:', x);
            return x;
        }),
    );
    datainput$.next(data_accio_bottle);
    ctrlinput$.next(ctrl_accio_bottle);
    const controlflow$obj = {_stream: ctrlinput$, _config: {}};
    const mainloop_output$obj = leafGraphRuntime([{_stream: peepedinput$}], controlflow$obj);

    const mainctrlsubs = mainloop_output$obj._control._stream.pipe(
        switchMap(x => {
            console.log('peephole ctrl out:', x);
            return mainloop_output$obj._stream
        })
    ).subscribe({
        next: x => {
            //outbuffer = outbuffer.concat(x);
            console.log('next: ', x);
            //reRenderApp();
        },
        error: (err) => { // error
            console.log('Error: ' + err);
        },
        complete: () => {
            console.log('subs complete: ');
            delay$.next(true);
        },
    });
    //const mainsubs = mainloop_output$obj._stream.subscribe({
    //    next: x => {
    //        //outbuffer = outbuffer.concat(x);
    //        console.log('next: ', x);
    //        //reRenderApp();
    //    },
    //    error: (err) => { // error
    //        console.log('Error: ' + err);
    //    },
    //    complete: () => {
    //        console.log('subs complete: ');
    //    },
    //});

    
    const endingcredit = await firstValueFrom(delay$)

    console.log(endingcredit);
  });
});

