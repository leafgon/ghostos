import { BehaviorSubject, Subject, combineLatest, of } from "rxjs";
import { concatMap, map, withLatestFrom } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
import { driveDataflowByCtrlflow, executeLEAFLogic } from "../../../leaf.js";
import { doBottle, doUnbottle } from "../../datautils/bottling.js";
//import { exitDataBus } from "../../../../utils/leafdataflow";

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in gnav.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/gnav.js"}, {});
/*
 * spark_dev_note: 25/Apr/2023
 * all leaflogic and datalogic functions must be designed to conform to the following spec, 
 * in order to make sure of the inter-operability of newly developed leaf elements 
 * in breezyforest.
 * 
 * leaflogic lives in the rx flow domain, hence is an ideal function to deal with
 * any data i/o existing in that domain. Data in the reactive stream domain is accessable via 
 * invoking leaf lambda functions, normally bearing the function argument signature of ([input$Arr, ctrlflow$obj]), 
 * or via calling any functions or rx inline pipe-map that would provide the logic for statically 
 * manipulating data flown through any locally accessable rx streams of interest. 
 * Please note the convention of variable names post-scripted with the dollar sign ($), denoting the handles for 
 * respective data streams.
 * 
 * datalogic lives in the static data domain. How data i/o happens in this domain is not directly compatible with the stream domain.
 * the two optional datalogic functions, pre and post, are used to "statically" work on data, in terms of taking data input, 
 * performing data transformation/read/write operations, and returning data output, at two temporal data points, respectively 
 * coinciding with the time before (pre) and after (post) the incidence of data flowing through the leaflogic stream domain.
 * 
 */

const cachekeys = {
    EDGES: "_edges",
    BACKDROP: "_backdrop"
};

const initElementInterface = (_stream_cache) => {
    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    const iselementio = ('elementio' in reduced_lambda_obj) ? true : false;
    const edgesgen = (('edges' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.edges)) ? reduced_lambda_obj.edges._default : undefined;
    const backdropgen = (('backdrop' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.backdrop)) ? reduced_lambda_obj.backdrop._default : undefined;

    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/gnav.js",
        refnode: _stream_cache[ElemCacheKeyLUT.REFNODE], 
        //leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
    };
    let _controlflow_config = {};
    const _leaflogic = (input$objArr, controlflow$obj) => {
        _controlflow_config = controlflow$obj._config;
        //const _stream_cache = {};
        //const _outflow_data$ = new BehaviorSubject(raceConditionError);
        const _outflow_data$ = new Subject(); 

        const edges$obj = (edgesgen ? 
            driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, node_context, 
                {
                    leaflogic: edgesgen,
                    datalogic: {post: (_data) => {
                        _stream_cache[ElemCacheKeyLUT.gnav.EDGES] = _data;
                        return _data;
                    }}
                }
            ) :
            {_stream: of([]), _control: controlflow$obj._stream}
        );

        const backdrop$obj =  (backdropgen ? 
            driveDataflowByCtrlflow(
                edges$obj._control, input$objArr, undefined, node_context, 
                {
                    leaflogic: backdropgen,
                    datalogic: {post: (_data) => {
                        _stream_cache[ElemCacheKeyLUT.gnav.BACKDROP] = _data;
                        return _data;
                    }}
                }
            ) : 
            {_stream: of("/assets/test/hubbleinfrared_dark2.jpg"), _control: edges$obj._control}
        ); 

        const _inflow_ctrl$ = backdrop$obj._control._stream;

        const _ctrl_out$ = _inflow_ctrl$.pipe(
            //concatMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;

            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc
            //    // spark_dev_note: #http_dataflow_point
            //    const _data_in$ = combineLatest([...input$objArr.map(_input=>_input._stream)]);

            //    // return data read from the rx stream domain as an array
            //    return _data_in$;
            //}),
            withLatestFrom(...input$objArr.map(_input=>_input._stream)),
            map(_combined_in => {
                const _data_in = _combined_in[1];
                console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc

                //if (_data_in.length > 1)
                //    _outflow_data$.next(_data_in);
                //else if (_data_in.length === 1)
                //    _outflow_data$.next(_data_in[0]);
                if (_data_in !== undefined)
                    _outflow_data$.next(_data_in);
                // return ctrl
                return _combined_in[0]; //_stream_cache[ElemCacheKeyLUT.CTRLIN];
            })
        );

        return {_stream: _outflow_data$, _control: {_stream: _ctrl_out$}}
    };

    // put any static data preprocessing logic applied to all incident data, 
    // flown on each incoming edge stream.
    // data preprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_pre = (_data_in) => {
        const quarantined_data_in = (Array.isArray(_data_in) ? 
            _data_in.map(_in => {
                return doUnbottle("screenio", _in);
            }).filter(_=>_) :
            doUnbottle("screenio", _data_in)
        );

        const data_out = quarantined_data_in;

        return data_out;
    };

    // put any static data postprocessing logic applied to all incident data, 
    // to be flown on the outgoing edge stream.
    // data postprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_post = (data_in) => {

        const graph_options = { 'layout': '3d' };
        const mock_navnodeedges = [];

        const navnodes = data_in;
        // spark_dev_note: (22/Mar/2023)
        // #bugreport #mar2023bug1
        // _metadata[4] is an un-exited _databus bottle 
        // fix: to convert undefined data to []
        //const navnodeedges = _metadata[4].map((edge) => {return {...edge, uuid: uuid4()};});
        // spark_dev_note: 18/Jun/2023
        // #databus
        //const _edgelist = exitDataBus({_bus: _stream_cache[ElemCacheKeyLUT.gnav.EDGES]}) 
        const _edgelist = doUnbottle(_stream_cache[ElemCacheKeyLUT.gnav.EDGES]); 
        const navnodeedges = (_edgelist ? _edgelist : []).map((edge) => {return {...edge, uuid: uuid4()};});

        const navbackdrop = _stream_cache[ElemCacheKeyLUT.gnav.BACKDROP]; //.map(() => {return {...edge, uuid: uuid4()};});
        //const bgtagvectors = _metadata[6];

        const recognizedLambdaConstants = ['edges', 'backdrop', 'tagvectors', 'tagaction', 'blankaction']; // a prompt of type "button" can be linked, by name, to a key-labelled lambda func
        const curLambdaKeys = Object.keys(reduced_lambda_obj);
        const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));

        const elementiosubject$ = new BehaviorSubject(raceConditionError);
        //const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
        //const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;

        // spark_dev_note: #http_dataflow_point // corresponding handles upstream
        //const _uidefs = data_in[0];          // uidefs$obj._stream
        //const _margin_userval = data_in[1];          // margin$obj._stream
        //const _fieldwidth_userval = data_in[2];          // fieldwidth$obj._stream
        //let _flowdatain = data_in.slice(3);   // [...input$objArr]
        //_flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

        const node_output = formatElementFlowdata({
            element: {
                nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                type: 'gnav',
                componentdata: {
                    //graph_data: {"nodes": Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]], "edges": mock_navnodeedges},
                    graph_data: {"nodes": Array.isArray(navnodes) ? navnodes : [navnodes], "edges": navnodeedges},
                    backdrop_url: navbackdrop,
                    bgtagvectors: async () => {
                        const _leaflogic = (('tagvectors' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.tagvectors)) ? reduced_lambda_obj.tagvectors._default : undefined;
                        const _leaflogic_ret = (_leaflogic ?
                            await executeLEAFLogic(_leaflogic, [], {..._controlflow_config}) : 
                            []);
                        return _leaflogic_ret;
                    },
                    tagaction: async (_tagid) => {
//const domain = getDomain ? await executeLEAFLogic(getDomain, [], {}) : defaultdomain;
                        const tagactionlogic = (('tagaction' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.tagaction)) ? reduced_lambda_obj.tagaction._default : undefined;
                        const tagaction_ret = (tagactionlogic ?
                            await executeLEAFLogic(tagactionlogic, _tagid, {..._controlflow_config}) : 
                            _tagid);

                        if (iselementio)
                            elementiosubject$.next(doBottle('elementio', {element: 'gnav', nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE], io: {'tagaction': tagaction_ret}}));
                        return tagaction_ret;
                    },
                    blankaction: async (_coord) => {
//const domain = getDomain ? await executeLEAFLogic(getDomain, [], {}) : defaultdomain;
                        const blankactionlogic = (('blankaction' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.blankaction)) ? reduced_lambda_obj.blankaction._default : undefined;
                        const blankaction_ret = (blankactionlogic ?
                            await executeLEAFLogic(blankactionlogic, _coord, {..._controlflow_config}) : 
                            _coord);
                        return blankaction_ret;
                    },
                    graph_options,
                    ..._stream_cache[ElemCacheKeyLUT.RTCONTEXT],
                },
            }
        }, "screenio");

        return node_output;
    };

    return {
        leaflogic: _leaflogic,
        datalogic: {
            pre: _datalogic_pre,
            post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props, cachekeys};