/*
 * The reference js implementation of the LEAF language specification, codenamed breezyforest 
 * This library is a part of the reference js implementation of ghostos
 * 
 * author: spark@leautomaton.com
 * date: 29 Jan 2022
 * 
 * copyright: LE Automaton Ltd
 */

//import { LEAFIOmetamodel, _leafstdlib_dataflow_api } from '../metamodel'; 
//import { reconstructLEAFGraph, analyzeLEAFGraph, parseLEAFGraph, combineInputStreams } from './leaf.js';
import { map, withLatestFrom, filter } from 'rxjs/operators';
import { of, zip } from 'rxjs';
import { isScalarType } from 'graphql';

//import { _leafelementslib } from './elements';

//import { etaReduceLambdaGraphs, etaReduceDataflowComponent, wrapInputStreamArrayHandler, runtimeEtaTree } from './eta.js';

import { from } from 'rxjs';

import { _leafinflowport, _leafoutflowport, _leafscreenio, _leafmemoryio } from './nodelogic/io/index.js';
import { _leaflambdagraph, _leafgraph, _leafspell, _leafspelldef, _leafloopyspell, _leafanchor } from './nodelogic/abstraction/index.js';
import { _leaflisp } from './nodelogic/wizardry/index.js';
import { _leafchronosflow, _leafmixflow, _leafgateflow } from './nodelogic/dataflow/index.js';
import { _leaflabel, _leafdelabel, _leafbottle, _leafunbottle, _leafcrate, _leafconfig } from './nodelogic/datautils/index.js';
import { _leafdeckspade, _leafdeckheart, _leafdeckdiamond, _leafdeckclub, _leafgnav, _leafpopupview, _leafelement } from './nodelogic/elements/index.js';

// for use in dev build only
import stringify from 'json-stringify-safe';

//({lambdactrl: {gos: {subsDirectory}, user: {nodeconfig={}}}, lambdadata: {lambdaFunc=x=>x, graphContextual}}={}) => {
//    // here the lambda function connected to the current node is always expected to be null 
//    // as the node-level lambdaFunc is not permitted for this type of node.
//    // graphContextual is quite relevant for this node type on the contrary, as this node is an abstraction used for
//    // referring to the contextual runtime function in the context of the current leaf graph. 
//    return (flowinput$) => {
//        const flowoutput$ = graphContextual(flowinput$); 
//        return flowoutput$;
//    };
//};


////const _leaffilter = ({ predicate = "(lambda (x) (True))" } = {}, lambdaFunc=x=>x, graphContextual) => {}
//// @predicate is a leaflisp expression for a lambda function to work as a predicate
//const _leaffilter = ({lambdactrl: {gos: {subsDirectory}, user: {predicate = "(lambda (x) (True))"}}, lambdadata: {lambdaFunc=x=>x, graphContextual}}={}) => {
//    return (flowinput$) => {
//        const flowoutput$ = flowinput$.pipe(
//            map(node_input=>{
//                let node_output = null; 
//                //console.log('input$ ' + JSON.stringify(input$));
//                //console.log('a leafdeckclub processed for node ' + deckname + ' with toggle: ' + logictoggle + ', flowinput: ' + node_input);
//                //console.log('input: '+ node_input + ' ' + Date.now() + ' ' + JSON.stringify(node_data)); 
//                // execute node level logic and optionally set node_output here
//                node_output = node_input; // currently do nothing but relaying input to output
//                console.log('node logic executed: ' + JSON.stringify(node_output));
//                return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
//
//                //return filter(predicate)(flowinput);
//                if (processLEAFlisp(predicate)(node_input)) {
//                    return true;
//                }
//                return false;
//            })
//        );
//        return flowoutput$;
//    };
//};
//
////const _leaftracker = ({ predicate = "(lambda (x) (True))" } = {}, lambdaFunc=x=>x, graphContextual) => {}
//const _leaftracker = ({lambdactrl: {gos: {subsDirectory}, user: {predicate = "(lambda (x) (True))"}}, lambdadata: {lambdaFunc=x=>x, graphContextual}}={}) => {
//    return (flowinput$) => {
//        const flowoutput$ = flowinput$.pipe(
//            map(node_input=>{
//                let node_output = null; 
//                //console.log('input$ ' + JSON.stringify(input$));
//                //console.log('a leafdeckclub processed for node ' + deckname + ' with toggle: ' + logictoggle + ', flowinput: ' + node_input);
//                //console.log('input: '+ node_input + ' ' + Date.now() + ' ' + JSON.stringify(node_data)); 
//                // execute node level logic and optionally set node_output here
//                node_output = node_input; // currently do nothing but relaying input to output
//                console.log('node logic executed: ' + JSON.stringify(node_output));
//                return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
//
//                //return filter(predicate)(flowinput);
//                if (processLEAFlisp(predicate)(node_input)) {
//                    return true;
//                }
//                return false;
//            })
//        );
//        return flowoutput$;
//    };
//};

const _leafanchoredge = () => {
};

// _leafelementslib was moved to elements.js (20 Mar 2022)
//const _leafelementslib = (elementname, args = {}) => {
//    const _breezyforestelements = {
//    }
//};

// a dictionary lookup function of leaf standard libraries (ver. breezyforest)
//const _leafstdlib = (type, args = {}) => {
//    const _breezyforeststdlib = {
//    /* ********************* LEAF standard library ********************* */
//    //'leaftracker': _leaftracker,          // deprecated on 9 Mar 2022, as its function can be supported by leafgraph that allows users to refer to the leafdeckspade of any chosen graph allowable.
//    // leaf io
//    ////'leafradioRX': _leafradioRX,
//    ////'leafradioTX': _leafradioTX,
//    ////'leafoutflowport': _leafoutflowport,
//    ////'leafinflowport': _leafinflowport,
//    // leaf elements
//    // (11 Mar 2022) refactor and migrate and consolidate the management of all elements to leafelement
//    'leafdeckspade': _leafdeckspade,
//    'leafdeckheart': _leafdeckheart,
//    'leafdeckdiamond': _leafdeckdiamond,
//    'leafdeckclub': _leafdeckclub,
//    'leafgnav': _leafgnav,
//    'leafpopupview': _leafpopupview,    // (11 Mar 2022) refactor and migrate this to leafelement
//    'leafelement': _leafelement, // shall support a growing list of element types and their UX definitions of leafgnav, leafpopup, leafeditor, leafimage, leafvideo, leafaudio, leaftext, leafd3, leafgraphics etc.
//    // leaf abstraction
//    'leafgraph': _leafgraph,                // completed 5 feb 2022, changed the name from _leafapp to _leafgraph on 9 Mar 2022
//    'leaflambdagraph': _leaflambdagraph,    // completed 20 jan 2022
//    'leafanchor': _leafanchor,
//    'leafspelldef': _leafspelldef,  // changed the name from _leafoperator to _leafspelldef and _leafspell on 9 Mar 2022
//    'leafspell': undefined,         // parsing this type is taken care of separately in three parsing steps involving leaf standard spells, leaf curated spells and user-defined spells
//    'leafloopyspell': _leafloopyspell, // a new concept consolidating the likes of 'map' among reactive operators, but in a themetically more compatible fashion. 
//    // leaf dataflow utils
//    'leafsyncflow': _leafsyncflow,  // to take care of needs as in rx.js merge, zip, combineLatest, concat, race, etc.
//    'leafmixflow': _leafmixflow, //_leafmixflow,    // to take care of needs as in array zip, concat etc.
//    'leafgateflow': _leafgateflow,  // bottle filtering based on bottlekey equality or inequality
//    // leaf data bottling utils
//    'leaflabel': _leaflabel,        // completed 5 feb 2022 
//    'leafdelabel': _leafdelabel,    // completed 5 feb 2022
//    //                                   // use bottle/unbottle to support structuring/destructuring of json objects, 
//    //'leafbottle2json': _leafbottle2json, //(spark_dev_note: (11 Mar 2022) use this bottle 2 json converter prior to consumption by leaflisp)
//    //'leafjson2bottle': _leafjson2bottle, //(spark_dev_note: (11 Mar 2022) use this json 2 bottle converter prior to data consumption by any leaf constructs downstream of leaflisp)
//    // spark_dev_note: implement these two converters built into _leaflisp
//    'leafbottle': _leafbottle,      // completed 5 feb 2022
//    'leafunbottle': _leafunbottle,  // completed 5 feb 2022
//    'leafcrate': _leafcrate,  
//    'leafconfig': _leafconfig,  
//    // leaf arcane wizardry 
//    'leaflisp': _leaflisp,                  // completed 20 jan 2022
//    //'leafmap': _leafmap,
//    };
//
//    if (type in _breezyforeststdlib) 
//        return _breezyforeststdlib[type];
//    else
//        return undefined; // exclude any non-standard types and any spells
//};

//_leafstd_corelib.leaflabel = _leaflabel;

/*
 * getLEAFNodeCoreLogic() is the single retrieval point of the API function defined for 
 * each leaf node logic (aka nodelogic) in breezyforest.
 * 
 * @type: is node name or its logic name 
 * @scope: is "dataflow" or "lambda" referring to leaf node scope duality
 * @lambdactrl: is a data object carrying information needed for providing ghostos-scoped 
 * communication/control mechanism to each leaf node, with the following object structure:
 * {
 *  gos: {standardSpellBook: {}, curatedSpellBook: {}, masterSubsDirectory: masterSubsDirectory}, 
 *  user: {spellbook:{}, config:node_data}
 * }
 * please note that the argument passing for @lambdactrl is curried as a means to provide nodelogic (ie. 
 * the returned function) with access to the data object within itself. 
 */
function getLEAFNodeCoreLogic (type, scope, lambdactrl) {
    // _corelib is the leaf std core js library for the eta reduction of a leaf graph, accounting for the scope duality (ie. dataflow vs lambda) of interpreting leaf logic
    const leafstd_corelib = {
        /* ********************* LEAF standard library ********************* */
        //'leaftracker': _leaftracker,          // deprecated on 9 Mar 2022, as its function can be supported by leafgraph that allows users to refer to the leafdeckspade of any chosen graph allowable.
        // leaf io
        //leafradioRX: _leafradioRX,
        //leafradioTX: _leafradioTX,
        leafoutflowport: _leafoutflowport,
        leafinflowport: _leafinflowport,
        leafscreenio: _leafscreenio,
        leafmemoryio: _leafmemoryio,
        // leaf elements
        // (11 Mar 2022) refactor and migrate and consolidate the management of all elements to leafelement
        leafdeckspade: _leafdeckspade,
        leafdeckheart: _leafdeckheart,
        leafdeckdiamond: _leafdeckdiamond,
        leafdeckclub: _leafdeckclub,
        leafgnav: _leafgnav,
        leafpopupview: _leafpopupview,    // (11 Mar 2022) refactor and migrate this to leafelement
        leafelement: _leafelement, // shall support a growing list of element types and their UX definitions of leafgnav, leafpopup, leafeditor, leafimage, leafvideo, leafaudio, leaftext, leafd3, leafgraphics etc.
        // leaf abstraction
        leafgraph: _leafgraph,                // completed 5 feb 2022, changed the name from _leafapp to _leafgraph on 9 Mar 2022
        leaflambdagraph: _leaflambdagraph,    // completed 20 jan 2022
        leafanchor: _leafanchor,
        //leafspelldef: _leafspelldef,  // changed the name from _leafoperator to _leafspelldef and _leafspell on 9 Mar 2022
        //leafspell: undefined,         // parsing this type is taken care of separately in three parsing steps involving leaf standard spells, leaf curated spells and user-defined spells
        leafspell: _leafspell,
        leafspelldef: _leafspelldef,
        leafloopyspell: _leafloopyspell, // a new concept consolidating the likes of 'map' among reactive operators, but in a themetically more compatible fashion. 
        // leaf dataflow utils
        leafchronosflow: _leafchronosflow,  // to take care of needs as in rx.js merge, zip, combineLatest, concat, race, etc.
        leafasyncflow: _leafchronosflow,  // to take care of needs as in rx.js merge, zip, combineLatest, concat, race, etc.
        leafmixflow: _leafmixflow, //_leafmixflow,    // to take care of needs as in array zip, concat etc.
        leafgateflow: _leafgateflow,  // bottle filtering based on bottlekey equality or inequality
        // leaf arcane wizardry 
        leaflisp: _leaflisp,                  // compbeted 20 jan 2022
        // leaf data utils
        leaflabel: _leaflabel,        // completed 5 feb 2022 
        leafdelabel: _leafdelabel,    // completed 5 feb 2022
        leafbottle: _leafbottle,      // completed 5 feb 2022
        leafunbottle: _leafunbottle,  // completed 5 feb 2022
        leafcrate: _leafcrate,  
        leafconfig: _leafconfig,  
        //                                   // use bottle/unbottle to support structuring/destructuring of json objects, 
        //'leafbottle2json': _leafbottle2json, //(spark_dev_note: (11 Mar 2022) use this bottle 2 json converter prior to consumption by leaflisp)
        //'leafjson2bottle': _leafjson2bottle, //(spark_dev_note: (11 Mar 2022) use this json 2 bottle converter prior to data consumption by any leaf constructs downstream of leaflisp)
        // spark_dev_note: implement these two converters built into _leaflisp
        //'leafmap': _leafmap,
    };

    //const cstr = stringify(lambdactrl, null, 2);
    //console.log('accessing leafnode core logic:', type, scope, cstr);
    //console.log('accessing leafnode core logic:', type, scope, JSON.stringify(lambdactrl));
    const nodelogic = leafstd_corelib[type][scope] ? leafstd_corelib[type][scope](lambdactrl) : undefined; // curried passing of lambdactrl as argument to the returned func

    return nodelogic;
};

/*
 * processLEAFNodeLogic is an entrypoint function to configure a function to 
 * execute the js implementation of the corresponding LEAF node logic identified by 'type'
 * for processing the LEAF Node logic
 * @lambdactrl: 
 *  @gos: currently controlplane only consists of subsDirectory (directory of inter-component comms channels), it may be expanded down the road.
 *  @user:
 *    @spellbook: a library (dictionary) of user-defined leaf spells
 *    @leaf.logic:
 *      @type specifies the leaf logic
 *      @args specifies any arguments needed when executing the given logic
 * @lambdadata:
 *  @lambdaFunc: a parsed runtime lambda function connected to the current node
 *  @graphContextual: a parsed runtime lambda function connected to the graph of which the current node is a member
 */
//const processLEAFNodeLogic = ({type, args=null}={}, nodeLambdaFunc, graphContextual) 
//const processLEAFNodeLogic = (input) => {
//    //{lambdactrl: {gos: {standardSpellBook={}, curatedSpellBook={}}, user: {spellbook, leaf}}, lambdadata: {lambdaFunc: nodeLambdaFunc, graphContextual}}
//    const {
//        lambdactrl,
//        lambdadata
//    } = input;
//    const errorLocationStr = 'in processing the LEAF Node logic.';
//    const {type, args=null} = lambdactrl.user.leaf.logic;
//    console.log('processing ' + type + ' ' + JSON.stringify(args));
//
//    const nopFunc = (flowinput) => { // default function of "no operation"
//        // spark_dev_note:
//        // currently it returns input as output as is, as this can ensure any other valid leaf operations to continue to operate without error.
//        // down the road, leaf dataflow level error data insertion is needed here before returning data back into the dataflow plane,
//        // in order to support a user-level error catching mechanism.
//        return flowinput; 
//    };
//    // curated spells (an HQ curated list of open-source leaf spell contributions by community)
//    // curated community spells
//    const _leafstandardspells = lambdactrl.gos.standardSpellBook;
//    const _leafcommunityspells = lambdactrl.gos.curatedSpellBook;
//
//    // spark_dev_note:
//    // spellbook is the rhelm for going open-source in leaf
//    // in order to disclose leaf standard spells as open-source,
//    // the standard spellbook needs refactoring to be parsed from a standard spellbook defined 
//    // in leaf graph, instead of the js code equivalent as exemplified below
//    //const _stdspellbook = { 
//    //// standard spells
//    //'_display': _leafspell({spellname: '_display'}),
//    //}
//    //// check to return leaf standard spells first and only the standard spells
//    //if (type === 'leafspell' && args.spellname in _stdspellbook) 
//    //    return _stdspellbook[args.spellname];
//
//    let nodeFunc;
//    try {
//        if (type !== 'leafspell') {
//            nodeFunc = _leafstdlib(type, args); // check for a type match in leaf standard library 
//            if (nodeFunc)
//                nodeFunc = nodeFunc({lambdactrl, lambdadata}); // initialize the node function with lambda data, if nodeFunc is found
//            else
//                throw `LEAF Error: node type ${type} with ${JSON.stringify(args)} is undefined ${errorLocationStr}`; // error thrown but no upstream error catch yet. leaf user-level error catching mechanism is yet to be implemented (9 Mar 2022).
//        }
//        else if (type === 'leafspell' && 'spellname' in args) {
//            // leaf spell type checking order is important in order to stop cheeky user attempts to override 
//            // breezyforest standard spell lib :)
//            // hence should check leaf standard spells first!
//            if (args.spellname.substring(0, 1) === '_' && args.spellname in _leafstandardspells) // leaf standard spellnames must be prefixed with '_'.
//                nodeFunc = _leafstandardspells[args.spellname]({lambdactrl, lambdadata});
//            // a curated list of community spells, any non-standard spells must NOT be prefixed with '_'
//            else if (args.spellname.substring(0, 1) !== '_' && args.spellname in _leafcommunityspells) 
//                nodeFunc = _leafcommunityspells[args.spellname]({lambdactrl, lambdadata});
//            // user-defined leaf spell library
//            else if (args.spellname.substring(0, 1) !== '_' && args.spellname in lambdactrl.user.spellbook) 
//                nodeFunc = lambdactrl.user.spellbook[args.spellname]({lambdactrl, lambdadata});
//            else
//                throw `LEAF Error: node type ${type} with ${JSON.stringify(args)} is undefined or undefinable ${errorLocationStr}`; // error thrown but no upstream error catch yet. leaf user-level error catching mechanism is yet to be implemented (9 Mar 2022).
//        }
//        else {
//            throw `LEAF Error: node type ${type} with ${JSON.stringify(args)} is undefined ${errorLocationStr}`; // error thrown but no upstream error catch yet. leaf user-level error catching mechanism is yet to be implemented (9 Mar 2022).
//            //nodeFunc = nopFunc; // done by the immediate catch error block below
//        }
//    }
//    catch (e) {
//        console.error(`LEAF Error: processing node type ${type} with ${JSON.stringify(args)} caused an exception ${errorLocationStr}: ${JSON.stringify(e)}`); // error thrown but no upstream error catch yet. leaf user-level error catching mechanism is yet to be implemented (9 Mar 2022).
//        nodeFunc = nopFunc;
//    }
//    return nodeFunc;
//};

export { getLEAFNodeCoreLogic };