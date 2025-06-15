const { reconstructLEAFGraph, analyzeLEAFGraph } = require("../../../../../ghostos");
const { runtimeEtaTree, etaReduceDataflowComponent } = require('../../../../../ghostos/api/parser/eta');
const { init_gRuntimeLEAFlisp } = require('../../../../../ghostos/api/parser/nodelogic/wizardry/leaflisp');

const { useLEAFIOapi, initializeMasterSubsDirectory } = require('../../../../../ghostos');
const { initializeLEAFlakeGQLClient } = require('../../../../../ghostos/api/leafio/leaflake');
const { LEAFIOmetamodel } = require('../../../../../ghostos');

const { skip, from, of, repeat, delay, interval, withLatestFrom, ReplaySubject, firstValueFrom, combineLatest } = require('rxjs');
const { zipWith, tap, connect, map, concatMap, take } = require('rxjs/operators');

const { _leafmemoryio } = require('../../../../../ghostos/api/parser/nodelogic/io');
const { _leafspell, _leafloopyspell } = require('../../../../../ghostos/api/parser/nodelogic/abstraction');
const { doBottle } = require("../datautils/bottling");

const ctrl_accio_bottle = doBottle('accio', 'ctrl_accio');
const data_accio_bottle = doBottle('accio', 'data_accio');

const encodeNodeData = (dataobj) => {
    return Buffer.from(JSON.stringify(dataobj)).toString('base64');
}

const nodedataLUT = {
    edges: {
        lambda: encodeNodeData({"leaf":{"api":"breezyforest","logic":{"type":"leaflambdaedge"}}}), //"eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmbGFtYmRhZWRnZSJ9fX0="
        data: encodeNodeData({"leaf":{"api":"breezyforest","logic":{"type":"leafdataedge"}}}), // "eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmZGF0YWVkZ2UifX19"
        anchor: encodeNodeData({"leaf":{"api":"breezyforest","logic":{"type":"leafanchoredge"}}}) // "eyJsZWFmIjp7ImFwaSI6ImJyZWV6eWZvcmVzdCIsImxvZ2ljIjp7InR5cGUiOiJsZWFmYW5jaG9yZWRnZSJ9fX0="
    }
}

const testdomain = "breezyforest";
const testappid = "jestleafspell";

describe("ghostos/api/parser function tests", () => {
  const nodes = [
    {
      "uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafspelldef","args":{"spellname":"listlib","svgicon":{"url":""}}},"api":"breezyforest","appdata":{"position":{"x":48,"y":608}}}}
      )
    },
    {
      "uuid":"21eeb7bd-91e9-45f4-b7eb-db7031fb96c9",
      "out_edges":[{"uuid":"9680bb70-5546-4bb5-8123-1dc715079b91","source":{"uuid":"21eeb7bd-91e9-45f4-b7eb-db7031fb96c9"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":nodedataLUT.edges.lambda}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafgraph","args":{"graphuuid":"","domain":"","appid":"","graphaddrstr":"/emailinglist-lib"}},"api":"breezyforest","appdata":{"position":{"x":-80,"y":447.99999999999994}}}}
      )
    },
    {
      "uuid":"83f8a828-bfd9-427e-92f2-de00d7b06acb",
      "out_edges":[{"uuid":"43a348ff-a906-42ed-a3fe-dfa865ee2ab2","source":{"uuid":"83f8a828-bfd9-427e-92f2-de00d7b06acb"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":nodedataLUT.edges.lambda}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafgraph","args":{"graphuuid":"","domain":"","appid":"","graphaddrstr":"/editormenu"}},"api":"breezyforest","appdata":{"position":{"x":0,"y":0}}}}
      )
    },
    {
      "uuid":"8020c19b-4446-4a3b-b698-a841c1c2e020",
      "out_edges":[{"uuid":"967b709c-20df-4b4b-a5a3-28990ccc327f","source":{"uuid":"8020c19b-4446-4a3b-b698-a841c1c2e020"},"target":{"uuid":"c23445d6-0248-402b-bda3-ead23d6d9c08"},"data":nodedataLUT.edges.lambda}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafgraph","args":{"graphuuid":"","domain":"","appid":"","graphaddrstr":"/leaflisp"}},"api":"breezyforest","appdata":{"position":{"x":0,"y":0}}}}
      )
    },
    {
      "uuid":"c23445d6-0248-402b-bda3-ead23d6d9c08",
      "out_edges":[{"uuid":"899f40fe-8c30-4c8f-91dd-11f4a2d4f68e","source":{"uuid":"c23445d6-0248-402b-bda3-ead23d6d9c08"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":nodedataLUT.edges.lambda}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leaflabel","args":{"labelstr":"leaflisp"}},"api":"breezyforest","appdata":{"position":{"x":0,"y":0}}}}
      )
    },
    {
      "uuid":"b8f5dfa5-11ce-4374-814f-f740c54250a3",
      "out_edges":[{"uuid":"994d8e5b-13f3-4f55-8125-1e73732f0aa7","source":{"uuid":"b8f5dfa5-11ce-4374-814f-f740c54250a3"},"target":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"data":nodedataLUT.edges.data}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafinflowport","args":{}},"api":"breezyforest","appdata":{"position":{"x":256,"y":832}}}}
      )
    },
    {
      "uuid":"0b07305b-3720-4019-86db-77cc09b59684",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafoutflowport","args":{}},"api":"breezyforest","appdata":{"position":{"x":688,"y":800}}}}
      )
    },
    {
      "uuid":"b599577e-90a2-451a-a785-f3a13f1fd191",
      "out_edges":[{"uuid":"2a02ca63-2db7-45b7-bb6d-c2648576ee37","source":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"target":{"uuid":"0b07305b-3720-4019-86db-77cc09b59684"},"data":nodedataLUT.edges.data}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"subscribe"}},"api":"breezyforest","appdata":{"position":{"x":432,"y":784}}},"domain":testdomain,"appid":testappid,"inputData":{},"isdebug":true,"selected":true}
      )
    },
    {
      "uuid":"46587425-d42d-4b3c-8e88-e0ad949385b8",
      "out_edges":[{"uuid":"f7900fd4-a3bd-46f5-a7ad-e5d8309e8b63","source":{"uuid":"46587425-d42d-4b3c-8e88-e0ad949385b8"},"target":{"uuid":"b599577e-90a2-451a-a785-f3a13f1fd191"},"data":nodedataLUT.edges.lambda}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"listlib"}},"api":"breezyforest","appdata":{"position":{"x":528,"y":560}}}}
      )
    },
    {
      "uuid":"9857e975-1977-4ea2-9169-b73867caf2db",
      "out_edges":[{"uuid":"23fb87b8-5de6-495e-9970-725473b9e3f6","source":{"uuid":"9857e975-1977-4ea2-9169-b73867caf2db"},"target":{"uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e"},"data":nodedataLUT.edges.data}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafinflowport","args":{}},"api":"breezyforest","appdata":{"position":{"x":0,"y":0}}}}
      )
    },
    {
      "uuid":"0f663e30-9691-4cc3-95ab-3a12a027bb8e",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafoutflowport","args":{}},"api":"breezyforest","appdata":{"position":{"x":0,"y":0}}}}
      )
    },
    {
      "uuid":"a68ef576-7360-4fea-b695-b971413df2a0",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafspelldef","args":{"spellname":"testbed","svgicon":{"url":""}}},"api":"breezyforest","appdata":{"position":{"x":352,"y":432}}}}
      )
    },
    {
      "uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e",
      "out_edges":[{"uuid":"7a1ef83c-453f-4048-b90c-09a747290746","source":{"uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e"},"target":{"uuid":"0f663e30-9691-4cc3-95ab-3a12a027bb8e"},"data":nodedataLUT.edges.data},{"uuid":"f9e3dc7c-df6a-4368-bb30-4ee0543cfa9d","source":{"uuid":"bbc7ac86-88f4-4b4e-987b-db2df99b538e"},"target":{"uuid":"7871c31a-8564-44a0-bd0d-8b17da18653f"},"data":nodedataLUT.edges.lambda}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leaflisp","args":{"lispexpression":"(+ (parse inport) 2)"}},"api":"breezyforest","appdata":{"position":{"x":288,"y":272}}}}
      )
    },
    {
      "uuid":"793491e8-f258-4f4c-94ea-05ef501441df",
      "out_edges":[{"uuid":"cd7a6800-5376-4ae9-b970-983fb8e044d3","source":{"uuid":"793491e8-f258-4f4c-94ea-05ef501441df"},"target":{"uuid":"674c9a22-4c6a-4e4e-9c66-95b36c59e566"},"data":nodedataLUT.edges.lambda},{"uuid":"17617b23-3bad-4ce8-98a8-0d221257ed42","source":{"uuid":"793491e8-f258-4f4c-94ea-05ef501441df"},"target":{"uuid":"49170156-ee49-42a0-b11d-f4338df04d71"},"data":nodedataLUT.edges.anchor}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafgraph","args":{"graphuuid":"","domain":"","appid":"","graphaddrstr":"breezyforest/probe"}},"api":"breezyforest","appdata":{"position":{"x":144,"y":320}}}}
      )
    },
    {
      "uuid":"3cb040f8-a719-4181-9943-fcc8dc3e588e",
      "out_edges":[{"uuid":"85731bfa-0ec4-44f7-b6c2-b20d8c9f60e3","source":{"uuid":"3cb040f8-a719-4181-9943-fcc8dc3e588e"},"target":{"uuid":"16b883ab-049c-4e99-8bfa-9357075d1e89"},"data":nodedataLUT.edges.lambda}],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"listlib"}},"api":"breezyforest","appdata":{"position":{"x":976,"y":176}}},"domain":testdomain,"appid":testappid,"inputData":{},"isdebug":true,"selected":true}
      )
    },
    {
      "uuid":"16b883ab-049c-4e99-8bfa-9357075d1e89",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafspell","args":{"spellname":"probe"}},"api":"breezyforest","appdata":{"position":{"x":1232,"y":544}}}}
      )
    },
    {
      "uuid":"49170156-ee49-42a0-b11d-f4338df04d71",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leaflisp","args":{"lispexpression":""}},"api":"breezyforest","appdata":{"position":{"x":192,"y":592}}}}
      )
    },
    {
      "uuid":"6e72a6a9-f6da-4057-adf7-3eb87c3c1efb",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafanchor","args":{}},"api":"breezyforest","appdata":{"position":{"x":688,"y":464}}}}
      )
    },
    {
      "uuid":"7871c31a-8564-44a0-bd0d-8b17da18653f",
      "out_edges":[],
      "data": encodeNodeData(
        {"leaf":{"logic":{"type":"leafloopyspell","args":{}},"api":"breezyforest","appdata":{"position":{"x":0,"y":0}}},"domain":testdomain,"appid":testappid,"inputData":{},"isdebug":true,"selected":true}
      )
    }
  ];

  test("testing leafloopyspell dataflow function", async () => {
    jest.setTimeout(100000);
    // actual test
    const mode = "nav";
    const domain = testdomain;
    const appid = testappid;
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
    const _etaTree = runtimeEtaTree(mode, domain, appid, domain, appid, leafgraph, leafcomponents, leafRuntimeRef.current.leafio, leafRuntimeRef.current.leaflakeio, mainMnemosyne); // leafRuntimeRef.current.masterSubsDir;
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
    const leafnode_args = {
        spellname: 'testbed',
        svgicon: {unicode: undefined,
            url: '',
            jsx: undefined,
        }
    };
    const dataflowlogic = await _leafloopyspell.dataflow(lambdactrl)({refnode: "7871c31a-8564-44a0-bd0d-8b17da18653f", refnodedata: {leaf: {logic: {args: leafnode_args}}}, nodelambda: ["bbc7ac86-88f4-4b4e-987b-db2df99b538e"], contextuallambda: []});

    const datainput$ = new ReplaySubject(1); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
    const ctrlinput$ = new ReplaySubject(1); //of([doBottle('accio', 'accio')]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
    const delay$ = new ReplaySubject(1);

    const peepedinput$ = datainput$.pipe(
        map(x => {
            console.log('peephole:', x);
            //return x;
            return 2;
        }),
    );
    const controlflow$obj = {_stream: ctrlinput$.pipe(
        map(x => {
            return x;
        })
    ), _config: {}};

    const output$obj = dataflowlogic([{_stream: peepedinput$}], controlflow$obj);

    datainput$.next(data_accio_bottle);
    ctrlinput$.next(ctrl_accio_bottle);
    //ctrlinput$.next("2");
    // spark_dev_note: TBD: currently there is no sanity check done on the main_component chosen from alalyzeLEAFGraph()
    // this at times results in a loose leafnode hanging around somewhere be accidentally/erroneously chosen as the main_component
    // fix it.
    //const mainEtaFunc = leafGraphRuntime; // store the parsed graph in the "file-level global".

    console.log("subscribing");

    const out$ = output$obj._control._stream.pipe(
        concatMap(_ctrl_in=> {
            return combineLatest([of(_ctrl_in), output$obj._stream]);
        }),
        map( combined_input => {
            console.log("output data next:", combined_input);
            const x = combined_input[1];
            const outcache = typeof x === "string" ? x : JSON.stringify(x);
            return outcache;
        })
    );

    const outval = await firstValueFrom(out$)

    //console.log(endingcredit);
    expect(outval).toBe('4');
    
  });

});

