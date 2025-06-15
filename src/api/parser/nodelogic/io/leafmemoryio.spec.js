const { reconstructLEAFGraph, analyzeLEAFGraph } = require("../../../../../ghostos");
const { runtimeEtaTree, etaReduceDataflowComponent } = require('../../../../../ghostos/api/parser/eta');
const { init_gRuntimeLEAFlisp } = require('../../../../../ghostos/api/parser/nodelogic/wizardry/leaflisp');

const { useLEAFIOapi, initializeMasterSubsDirectory } = require('../../../../../ghostos');
const { initializeLEAFlakeGQLClient } = require('../../../../../ghostos/api/leafio/leaflake');
const { LEAFIOmetamodel } = require('../../../../../ghostos');

const { skip, from, of, repeat, delay, interval, withLatestFrom, ReplaySubject, firstValueFrom } = require('rxjs');
const { zipWith, tap, connect, map, take } = require('rxjs/operators');

const { _leafmemoryio } = require('../../../../../ghostos/api/parser/nodelogic/io');
const { doBottle } = require("../datautils/bottling");

const ctrl_accio_bottle = doBottle('accio', 'ctrl_accio');
const data_accio_bottle = doBottle('accio', 'data_accio');

describe("ghostos/api/parser function tests", () => {
  const nodes = [
    {
      "uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566",
      "out_edges":[],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGxkZWYiLCJhcmdzIjp7InNwZWxsbmFtZSI6Imxpc3RsaWIiLCJzdmdpY29uIjp7InVybCI6IiJ9fX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6NDgsInkiOjYwOH19fX0="
    },
    {
      "uuid":"21eeb7bd-91e9-45f4-b7eb-db7031fb96c9",
      "out_edges":[{"uuid":"9680bb70-5546-4bb5-8123-1dc715079b91","source":{"uuid":"21eeb7bd-91e9-45f4-b7eb-db7031fb96c9"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmZ3JhcGgiLCJhcmdzIjp7ImdyYXBodXVpZCI6IiIsImRvbWFpbiI6IiIsImFwcGlkIjoiIiwiZ3JhcGhhZGRyc3RyIjoiL2VtYWlsaW5nbGlzdC1saWIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6LTgwLCJ5Ijo0NDcuOTk5OTk5OTk5OTk5OTR9fX19"
    },
    {
      "uuid":"b8f5dfa5-11ce-4374-814f-f740c54250a3",
      "out_edges":[{"uuid":"994d8e5b-13f3-4f55-8125-1e73732f0aa7","source":{"uuid":"b8f5dfa5-11ce-4374-814f-f740c54250a3"},"target":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmZGF0YWVkZ2UifX19"}],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmaW5mbG93cG9ydCIsImFyZ3MiOnt9fSwiYXBpIjoiYnJlZXp5Zm9yZXN0IiwiYXBwZGF0YSI6eyJwb3NpdGlvbiI6eyJ4IjoyNTYsInkiOjgzMn19fX0="
    },
    {
      "uuid":"0b07305b-3720-4019-86db-77cc09b59684",
      "out_edges":[],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmb3V0Zmxvd3BvcnQiLCJhcmdzIjp7fX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6Njg4LCJ5Ijo4MDB9fX19"
    },
    {
      "uuid":"b599577e-90a2-451a-a785-f3a13f1fd191",
      "out_edges":[{"uuid":"2a02ca63-2db7-45b7-bb6d-c2648576ee37","source":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"target":{"uuid":"0b07305b-3720-4019-86db-77cc09b59684"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmZGF0YWVkZ2UifX19"}],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6InN1YnNjcmliZSJ9fSwiYXBpIjoiYnJlZXp5Zm9yZXN0IiwiYXBwZGF0YSI6eyJwb3NpdGlvbiI6eyJ4Ijo0MzIsInkiOjc4NH19fSwiZG9tYWluIjoic3BhcmsiLCJhcHBpZCI6ImVtYWlsaW5nbGlzdCIsImlucHV0RGF0YSI6e30sImlzZGVidWciOnRydWUsInNlbGVjdGVkIjp0cnVlfQ=="
    },
    {
      "uuid":"46587425-d42d-4b3c-8e88-e0ad949385b8",
      "out_edges":[{"uuid":"f7900fd4-a3bd-46f5-a7ad-e5d8309e8b63","source":{"uuid":"46587425-d42d-4b3c-8e88-e0ad949385b8"},"target":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6Imxpc3RsaWIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6NTI4LCJ5Ijo1NjB9fX19"
    },
    {
      "uuid":"a68ef576-7360-4fea-b695-b971413df2a0",
      "out_edges":[],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGxkZWYiLCJhcmdzIjp7InNwZWxsbmFtZSI6InRlc3RiZWQiLCJzdmdpY29uIjp7InVybCI6IiJ9fX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6MzUyLCJ5Ijo0MzJ9fX19"
    },
    {
      "uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e",
      "out_edges":[{"uuid":"f9e3dc7c-df6a-4368-bb30-4ee0543cfa9d","source":{"uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e"},"target":{"uuid":"a68ef576-7360-4fea-b695-b971413df2a0"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmbGlzcCIsImFyZ3MiOnsibGlzcGV4cHJlc3Npb24iOiIoKyAocGFyc2UgaW5wb3J0KSAyKSJ9fSwiYXBpIjoiYnJlZXp5Zm9yZXN0IiwiYXBwZGF0YSI6eyJwb3NpdGlvbiI6eyJ4IjoyODgsInkiOjI3Mn19fX0="
    },
    {
      "uuid":"793491e8-f258-4f4c-94ea-05ef501441df",
      "out_edges":[{"uuid":"cd7a6800-5376-4ae9-b970-983fb8e044d3","source":{"uuid":"793491e8-f258-4f4c-94ea-05ef501441df"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="},{"uuid":"17617b23-3bad-4ce8-98a8-0d221257ed42","source":{"uuid":"793491e8-f258-4f4c-94ea-05ef501441df"},"target":{"uuid":"49170156-ee49-42a0-b11d-f4338df04d71"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmYW5jaG9yZWRnZSJ9fX0="}],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmZ3JhcGgiLCJhcmdzIjp7ImdyYXBodXVpZCI6IiIsImRvbWFpbiI6IiIsImFwcGlkIjoiIiwiZ3JhcGhhZGRyc3RyIjoiYnJlZXp5Zm9yZXN0L3Byb2JlIn19LCJhcGkiOiJicmVlenlmb3Jlc3QiLCJhcHBkYXRhIjp7InBvc2l0aW9uIjp7IngiOjE0NCwieSI6MzIwfX19fQ=="
    },
    {
      "uuid":"3cb040f8-a719-4181-9943-fcc8dc3e588e",
      "out_edges":[{"uuid":"85731bfa-0ec4-44f7-b6c2-b20d8c9f60e3","source":{"uuid":"3cb040f8-a719-4181-9943-fcc8dc3e588e"},"target":{"uuid":"16b883ab-049c-4e99-8bfa-9357075d1e89"},"data":"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="}],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6Imxpc3RsaWIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6OTc2LCJ5IjoxNzZ9fX0sImRvbWFpbiI6InNwYXJrIiwiYXBwaWQiOiJlbWFpbGluZ2xpc3QiLCJpbnB1dERhdGEiOnt9LCJpc2RlYnVnIjp0cnVlLCJzZWxlY3RlZCI6dHJ1ZX0="
    },
    {
      "uuid":"16b883ab-049c-4e99-8bfa-9357075d1e89",
      "out_edges":[],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmc3BlbGwiLCJhcmdzIjp7InNwZWxsbmFtZSI6InByb2JlIn19LCJhcGkiOiJicmVlenlmb3Jlc3QiLCJhcHBkYXRhIjp7InBvc2l0aW9uIjp7IngiOjEyMzIsInkiOjU0NH19fX0="
    },
    {
      "uuid":"49170156-ee49-42a0-b11d-f4338df04d71",
      "out_edges":[],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmbGlzcCIsImFyZ3MiOnsibGlzcGV4cHJlc3Npb24iOiIifX0sImFwaSI6ImJyZWV6eWZvcmVzdCIsImFwcGRhdGEiOnsicG9zaXRpb24iOnsieCI6MTkyLCJ5Ijo1OTJ9fX19"
    },
    {
      "uuid":"6e72a6a9-f6da-4057-adf7-3eb87c3c1efb",
      "out_edges":[],
      "data":"eyJsZWFmIjp7ImxvZ2ljIjp7InR5cGUiOiJsZWFmYW5jaG9yIiwiYXJncyI6e319LCJhcGkiOiJicmVlenlmb3Jlc3QiLCJhcHBkYXRhIjp7InBvc2l0aW9uIjp7IngiOjY4OCwieSI6NDY0fX19fQ=="
    }
  ];

  test("testing leafmemoryio dataflow function", async () => {
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
    const _etaTree = runtimeEtaTree(mode, domain, appid, domain, appid, leafgraph, leafcomponents, leafRuntimeRef.current.leafio, leafRuntimeRef.current.leaflakeio, mainMnemosyne); // leafRuntimeRef.current.masterSubsDir);
    const gRuntimeLEAFlisp = init_gRuntimeLEAFlisp(_etaTree, {data: data_accio_bottle, ctrl: ctrl_accio_bottle});
    _etaTree.gRuntimeLEAFlisp = gRuntimeLEAFlisp;

    const lambdactrl = {
        gos: {
            standardSpellbook: {},
            curatedSpellbook: {},
            stdlambdalut: {},
            curatedlambdalut: {},
            leafio: _etaTree.leafio,
            etaTree: _etaTree, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
        }, 
        user: {
            spellbook: _etaTree.graphcomponents.spelldefs,
            lambdalut: _etaTree.leafgraph.edges.lambda.sourcelut,
        }
    };
    //const leafgraph_args = {graphuuid: '', domain: 'breezyforest', appid: 'leaflisp-help', graphaddrstr: 'breezyforest/leaflisp-help'};
    //const getLEAFGraph = _leafgraph.lambda(lambdactrl)({refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: []});
    //const leafgraph = await getLEAFGraph; //.then((response) => {}) // async call to get leafgraph
    const leafmemoryio_args = {elementconfig: {leafnodename: 'hello'}};
    const dataflowlogic = await _leafmemoryio.dataflow(lambdactrl)({refnode: "jest", refnodedata: {leaf: {logic: {args: leafmemoryio_args}}}, nodelambda: [], contextuallambda: []});

    const datainput$ = new ReplaySubject(1); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
    const ctrlinput$ = new ReplaySubject(1); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
    const delay$ = new ReplaySubject(1);

    const peepedinput$ = datainput$.pipe(
        map(x => {
            console.log('peephole:', x);
            return x;
        }),
    );
    const controlflow$obj = {_stream: ctrlinput$, _config: {}};

    const output$obj = dataflowlogic([{_stream: peepedinput$}], controlflow$obj);

    datainput$.next(data_accio_bottle);
    ctrlinput$.next(ctrl_accio_bottle);
    // spark_dev_note: TBD: currently there is no sanity check done on the main_component chosen from alalyzeLEAFGraph()
    // this at times results in a loose leafnode hanging around somewhere be accidentally/erroneously chosen as the main_component
    // fix it.
    //const mainEtaFunc = leafGraphRuntime; // store the parsed graph in the "file-level global".

    console.log("subscribing");
    let outcache = undefined;
    output$obj._stream.subscribe(
        {
            next: x => {
                console.log("subscribe data next:", x);
                outcache = JSON.stringify(x);
                delay$.next(true);
            },
        }
    );
    output$obj._control._stream.subscribe(
        {
            next: x => {
                console.log("subscribe ctrl next:", x);
            },
        }
    );

    const endingcredit = await firstValueFrom(delay$)

    console.log(endingcredit);
    expect(outcache).toBe('{"_bname":"_databus","_content":{"_bname":"accio","_content":"data_accio","_label":{}},"_label":{"_type":"memoryio","_command":"io","_memoryname":"hello","_refnode":"jest","_nodelocation":{"domain":"spark","appid":"emailinglist"}}}');
    
  });
});

