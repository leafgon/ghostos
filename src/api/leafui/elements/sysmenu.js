// spark_dev_note: debugging ref number for implementing sysmenu mouse touch down and drag events
// is #devrefdrag

import React, { useState, memo, useRef, useEffect, Fragment, useLayoutEffect } from 'react';
import Hammer from '@egjs/hammerjs';
import propagating from 'propagating-hammerjs';
//import { connect } from 'react-redux';
//import LEAFUISet from '../leafui/set';
import PropTypes from 'prop-types';
//import Measure from 'react-measure';
import { Transition, animated, interpolate } from 'react-spring';
//import { Planet } from 'react-planet';
import { Planet, Satellite } from '../lib/sysmenu';
//import { Typography, Tooltip } from '@material-ui/core';
//import { withStyles, makeStyles } from '@material-ui/core/styles';
//import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
//import BackupIcon from '@material-ui/icons/Backup';
//import { Badge, Popover } from '@material-ui/core';
import { Badge, Popover, Typography, Tooltip } from '@mui/material';
//import { makeStyles, propsToClassKey, withStyles } from '@mui/styles';
import { styled } from '@mui/system';
import { v4 as uuid4 } from 'uuid';
import { ReplaySubject, from, take } from 'rxjs';

//import { createSvgIcon } from '@material-ui/core/utils';
import Icon from '@mui/material/Icon';
import cloneDeep from 'lodash/cloneDeep';
import { throttle } from 'lodash';

import {_breezyforeststdlib_name} from '../../metamodel';
import { executeLEAFLogic, subscribeToLEAFLogic } from '../../parser/leaf';
import { enterDataBus } from '../../utils/leafdataflow';
import { doBottle } from '../../parser/nodelogic/datautils/bottling';

//import '../styles/sysmenu.css';
// spark_dev_note: 17/Nov/2022
// refactored the usage of @mui api for css handling
// changed sysmenu.js to using styled instead of the depricated makeStyles
// this refactoring somehow caused the hammerjs to stop working, at least for sysmenu.js, as bgtag.js works just fine.
// now, the gesture/mouse handling in sysmenu.js uses HTML5 native calls attached to onMouseDown instead 
// whether this is better or worse off than hammerjs is uncertain. only time will tell... 


// maybe down the road...
const propTypes = {
  occupySpace: PropTypes.bool,
  slices: PropTypes.number,
  margin: PropTypes.number
}
const defaultProps = {
  occupySpace: true,
  slices: 3,
  margin: 0
}

const URL_ICON_ERROR_MSG = 'http://localhost:3000/icons/alert/error/materialicons/24px.svg';
const MAX_MENU_COUNT = 12;

/*
    spark_dev_note: errMsgFunc() should conform to the same input and output format as any other lambda functions
    defined in LEAF. 
 */
const errMsgFunc = (input$) => {
    console.log('wassup man!'); // TBD (20 Feb 2022)

    return input$;
};

/*
    preprocessMenuData() checks for the max allowable menu count in the menudata, and redacts overflows while 
    attaching to the returned menudata an error message-carrying menudata entry for each redaction.
*/
export const preprocessMenuData = (menudata, maxMenuCount=12) => {
    // spark_dev_note: stringify removes all references to function objects in the data, hence not fit for purpose
    // devise a way to make a copy in a kosher way and revive functions
    // https://stackoverflow.com/questions/7759200/is-there-any-possibility-to-have-json-stringify-preserve-functions
    //const processedData = JSON.parse(JSON.stringify(menudata)); // work on copied data as a pure function
    const processedData = cloneDeep(menudata); // work on copied data to conform to being a pure function
    const generateDiamondError = (errcount, erroneousDias) => {
        const diamond_error = { // data defining a diamond-level satellite entry of a 1st-tier navigable node
            uuid: uuid4(),
            name: 'error',
            color: '#ff2222',
            svgicon: URL_ICON_ERROR_MSG,
            lambdas: { // a dictionary of lambda functions belonging to the diamond
                default: 'showerror', // or undefined,
                badge: () => errcount,
                showerror: errMsgFunc,
            },
            clubs: []
        };

        return diamond_error;
    };

    const generateClubError = (errcount, erroneousDias) => {
        const club_error = {
            // data defining a club-level satellite entry of a diamond-level satellite
            uuid: uuid4(),
            name: 'error',
            color: '#ff2222',
            svgicon: URL_ICON_ERROR_MSG,
            lambdas: { // a dictionary of lambda functions belonging to the club
                default: 'showerror', // or undefined,
                badge: () => errcount,
                showerror: errMsgFunc,
            }
        }

        return club_error;
    };

    const redacted_diamonds = processedData.diamonds.slice(0, maxMenuCount); // redact diamonds with idx higher than 11th 
    const erroneous_diamonds = processedData.diamonds.slice(maxMenuCount);
    processedData.diamonds = redacted_diamonds;
    redacted_diamonds.map((a_diamond) => {
        const redacted_clubs = a_diamond.clubs.slice(0, maxMenuCount); // redact clubs with idx higher than 11th
        const erroneous_clubs = a_diamond.clubs.slice(maxMenuCount);
        a_diamond.clubs = redacted_clubs;
        if (erroneous_clubs.length > 0)
            redacted_clubs.push(generateClubError(erroneous_clubs.length, erroneous_clubs));
        //return a_diamond;
    });
    if (erroneous_diamonds.length > 0) //generate a consolidated error message diamond
        redacted_diamonds.push(generateDiamondError(erroneous_diamonds.length, erroneous_diamonds));

    return processedData;
};

const SystemMenuComponent = ({ appprops }) => {
  //const {_leafjs, appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
  //const {appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
  // define global context in its own world
  //const leafjscamera = _leafjs.camera; 
  const {
    margin,
    occupySpace,
    //impl,
    config,
    nodeuuid,
    refnodedata,
    sysMenuData,
    sysMenuPosition,
    helpText,
    domain,
    appid,
    centerRadius,
    //curNodeUUID
    //...rest
  } = appprops;
  const children = sysMenuData;

  const executionBuffer = useRef([]);
  //#devrefdrag
  //const processedMenuData = useRef(null); //preprocessMenuData(sysMenuData, MAX_MENU_COUNT);
  const processedMenuData = useRef(preprocessMenuData(sysMenuData, MAX_MENU_COUNT)); //preprocessMenuData(sysMenuData, MAX_MENU_COUNT);
  //const processedMenuData = useRef(undefined); //preprocessMenuData(sysMenuData, MAX_MENU_COUNT);
  //#devrefdrag
  // spark_dev_note: sysMenuData is the single most important data communication means with respect to gluing this react component
  // to the LEAF data flow in the ghostOS layer upstream. Whatever change happens in the LEAF data flow level would get updated here on the fly.
  // The json structure of sysMenuData as per 'breezyforest' is as follows (17 Feb 2022):
  /*
  // a json specifying a 1st tier navigable node of type leafheart or leafspade
  {
    type: 'heart' or 'spade'
    uuid: <string>,
    name: <string representing the data-flow-level name of the navigable node (aka leafheart or leafspade) of choice> or undefined,
    description: <string representing the node's description as defined by the LEAF author> or undefined,
    lambdas: { // a dictionary of lambda functions belonging to the 1st tier node
        default: <string representing the key of the default lambda func> or undefined,
        <a func tag as a key>: <a js object representing a lambda func>,
        <a func tag as a key>: <a js object representing a lambda func>,
        ...
    },
    diamonds: [
        { // data defining a diamond-level satellite entry of a 1st-tier navigable node
            uuid: <string>,
            lambdas: { // a dictionary of lambda functions belonging to the diamond
                default: <string representing the key of the default lambda func> or undefined,
                badge: <a lambda function to get a diamond badge value> or undefined,
                <a func tag as a key>: <a js object representing a lambda func>,
                <a func tag as a key>: <a js object representing a lambda func>,
                ...
            },
            clubs: [
                { // data defining a club-level satellite entry of a diamond-level satellite
                    uuid: <string>,
                    lambdas: { // a dictionary of lambda functions belonging to the club
                        default: <string representing the key of the default lambda func> or undefined,
                        badge: <a lambda function to get a club badge value> or undefined,
                        <a func tag as a key>: <a js object representing a lambda func>,
                        <a func tag as a key>: <a js object representing a lambda func>,
                        ...
                    }
                },
                ...
            ]
        },
        ...
    ]
  }
  */


  // mutable states
  const [nodeinfo, setNodeinfo] = useState(true);
  const [isMounted, setIsMounted] = useState(true); // element lifecycle flag
  const stateRef = useRef({nodeinfo: false, isMounted: false, satnodeinfo: null});
  const hammerRef = useRef([]);
  const [state, setState] = useState({render_id: null});
  const [renderid, setRenderid] = useState(undefined);

  // the difference btwn useLayoutEffect and useEffect: https://kentcdodds.com/blog/useeffect-vs-uselayouteffect
  useLayoutEffect(() => {
    // now the hammer business
    //const bgTagElement = document.getElementById("bgtagframe"); // find the element <div> id from the JSX def
    //handleNewBGTag({center: {x: 200, y: 300}});//{x: e.center.x, y: e.center.y} t203
    //console.log(testdata);
  });

    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const need_rerender = () => {
        //if (stateRef.current.isMounted) 
        setRenderid(uuid4());
            //setState((otherstate) => {
            //    return {...otherstate, render_id: uuid4()};
            //});
    };

    const setCurSatNodeIdx = (val) => {
        console.log('setCurSatNodeIdx(): ', val);
        stateRef.current.satnodeinfo = val;
    };
    const getCurSatNodeIdx = (val) => {
        return stateRef.current.satnodeinfo;
    };

    //const [state, setState] = useState({nodeinfo: true, isMounted: true});
    const setStateRef = (setfunc) => {
      stateRef.current = setfunc(stateRef.current);
    }

    const satCenterActionFunc = (satidx, clubHouseKeepingFunc = null) => {
        if (getCurSatNodeIdx() === satidx) {
            console.log('same node clicked');
            //stateRef.current.satnodeinfo = null;
            setCurSatNodeIdx(null);
            need_rerender();
            //clubHouseKeepingFunc && clubHouseKeepingFunc(null);
        //setStateRef( prevState => {return {...prevState, satnodeinfo: null}} );
        }
        else {
            //stateRef.current.satnodeinfo = i;
            console.log('node clicked: ', satidx);
            setCurSatNodeIdx(satidx);
            need_rerender();
            //clubHouseKeepingFunc && clubHouseKeepingFunc(satidx);
        //setStateRef( prevState => {return {...prevState, satnodeinfo: i}} );
        }
        //console.log("sysmenu-satcenter-"+satidx);
    };

    const handleTooltipClose = () => {
    //if (stateRef.current.isMounted) {
        console.log("handleTooltipClose() called");
    //setNodeinfo( false );
        const doTooltipAction = () => {
            stateRef.current.nodeinfo = false;
            need_rerender();
        }
        //setTimeout(() => { stateRef.current.nodeinfo = false; need_rerender(); }, 2000);
        //setTimeout(() => { stateRef.current.nodeinfo = false; }, 2000);
    //setStateRef( prevState => {return {...prevState, nodeinfo: false}} );
    //setState( prevState => {return {...prevState, ...stateRef.current}}); // force component rerender
    //isunmounted = false;
    //}
        throttle(doTooltipAction, 1000)();
    };
    
    const handleTooltipOpen = (idx, evtype) => { // evtype either "press" | "pressup"
        //if (stateRef.current.nodeinfo) {
        //    handleTooltipClose();
        //}
        const doTooltipAction = (_evtype) => {
            if (_evtype === "mousedown") {
                //setNodeinfo( true );
                stateRef.current.nodeinfo = true;
                //setStateRef( prevState => {return {...prevState, nodeinfo: true}} );
                //setState( prevState => {return {...prevState, ...stateRef.current}}); // force component rerender
                //if (stateRef.current.isMounted) 
                need_rerender();

                setTimeout(() => { handleTooltipClose(); }, 10000);
            }
            else if (_evtype === "mouseup" && stateRef.current.nodeinfo) {
                handleTooltipClose();
            }
        };

        if (!stateRef.current.nodeinfo)
            throttle(doTooltipAction, 1000)(evtype);
        else
            handleTooltipClose();
    };

  useEffect(() => {
    processedMenuData.current = preprocessMenuData(sysMenuData, MAX_MENU_COUNT);
    stateRef.current.isMounted = true;
    /*********************************************************
    // element mounted upon reaching here
    //const sysMenuElement = document.getElementById("sysmenu"); // find the element <div> id from the JSX def
    //const sysMenuElement = document.getElementById("sysmenu-center"); // find the element <div> id from the JSX def
    const registerStickyHammer = (satid, satidx, actionFunc, isUserDefined=false) => {
        //console.log('registering hammer func: ', satid, satid, actionFunc)
        //const sysMenuSatElement = document.getElementById("sysmenu-satcenter-"+i); // find the element <div> id from the JSX def
        const sysMenuSatElement = document.getElementById(satid); // find the element <div> id from the JSX def
        const hammer = propagating(new Hammer.Manager(sysMenuSatElement, {} )); //, {preventDefault: true}; // initialize hammer 
        //const hammer = new Hammer.Manager(sysMenuSatElement, {} ); //, {preventDefault: true}; // initialize hammer 
        //console.log('element to register hammer: ', sysMenuSatElement);
        //const hammer = new Hammer.Manager(sysMenuSatElement, {} ); //, {preventDefault: true}; // initialize hammer 
        hammer.add(new Hammer.Tap({event: 'singletap'}));

        const debug_Press = new Hammer.Press({event: 'press', time:500 });
        const debug_PressUp = new Hammer.Press({event: 'pressup' });
        const debug_Pan = new Hammer.Pan({event: 'pan'});

        //mc_toggletext.add([longPress]);
        hammer.add([debug_Press]); 
        hammer.add([debug_PressUp]);
        const doAction = e => {
            console.log('hammer event target: ', e.target.id, ' handler id: ', satid, ' func:', actionFunc);
            switch (e.target.id) {
            case satid:
                //e.preventDefault();
                //handleTooltipOpen();
                //const nodeclickmat = {i: true};
                //if (stateRef.current.satnodeinfo === i)
                if (actionFunc) {
                    //if (actionFunc.name === 'satCenterActionFunc') {}
                    if (!isUserDefined) {
                        actionFunc(satidx, e.type);
                    }
                    else {
                        //const clickinput$ = from([[`breezyforest-${satid}-click`]]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
                        ////const controlflow$obj = {_stream: clickinput$, _control: {_config: {nodeuuid}}};
                        //const controlflow$obj = {_stream: clickinput$, _config: {nodeuuid}};
                        //const clickoutput$obj = actionFunc([{_stream: clickinput$}], controlflow$obj);
                        //let outbuffer = [];
                        //// TBD: use executeLEAFLogic instead of the following subscribe block
                        //if (clickoutput$obj) {
                        //    clickoutput$obj._stream.subscribe({
                        //        next: x => {
                        //            outbuffer = outbuffer.concat(x);
                        //            console.log('next: ', x);
                        //        },
                        //        error: (err) => { // error
                        //            console.log('Error: ' + err);
                        //        },
                        //        complete: () => {
                        //            console.log(outbuffer);
                        //        },
                        //    });
                        //    console.log(clickoutput$obj);
                        //}
                        executeLEAFLogic(actionFunc, `breezyforest-${satid}-click`, {nodeuuid});
                    }
                }
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                break;
            default: // when you don't know what to make out of error handling... ;p
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                console.warn("WARNING: leaf sysmenu: unknown tab target: ", e); 
            }
        }
        hammer.on('press', doAction);
        hammer.on('pressup', doAction);
        //hammerRef.current.push(hammer);
        return hammer;
    }

    const registerHammer = (satid, satidx, actionFunc, isUserDefined=false) => {
        //console.log('registering hammer func: ', satid, satid, actionFunc)
        //const sysMenuSatElement = document.getElementById("sysmenu-satcenter-"+i); // find the element <div> id from the JSX def
        const sysMenuSatElement = document.getElementById(satid); // find the element <div> id from the JSX def
        if (!sysMenuSatElement)
            console.log(satid);
        //const hammer = propagating(new Hammer.Manager(sysMenuSatElement)); //, {preventDefault: true}; // initialize hammer 
        const hammer = new Hammer.Manager(sysMenuSatElement); //, {preventDefault: true}; // initialize hammer 
        //const hammer = propagating(new Hammer(sysMenuSatElement)); //, {preventDefault: true}; // initialize hammer 
        //const hammer = new Hammer(sysMenuSatElement); //, {preventDefault: true}; // initialize hammer 
        //console.log('element to register hammer: ', sysMenuSatElement);
        //const hammer = new Hammer.Manager(sysMenuSatElement, {} ); //, {preventDefault: true}; // initialize hammer 
        //const singletap = new Hammer.Tap({event: 'singletap', taps: 1});
        const singletap = new Hammer.Tap({taps: 1});
        hammer.add(singletap);
        hammer.on("tap", e => {
            console.log('hammer event target: ', e.target.id, ' handler id: ', satid, ' func:', actionFunc);
            switch (e.target.id) {
            case satid+"-centercontent":
                //e.preventDefault();
                //handleTooltipOpen();
                //const nodeclickmat = {i: true};
                //if (stateRef.current.satnodeinfo === i)
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                if (actionFunc) {
                    //if (actionFunc.name === 'satCenterActionFunc') {}
                    if (!isUserDefined) {
                        actionFunc(satidx);
                    }
                    else {
                        //const clickinput$ = from([[`breezyforest-${satid}-click`]]); //.pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
                        //const controlflow$obj = {_stream: clickinput$, _control: {_config: {nodeuuid}}};
                        //const controlflow$obj = {_stream: clickinput$, _config: {nodeuuid}};
                        //const clickoutput$obj = actionFunc([{_stream: clickinput$}], controlflow$obj);
                        //let outbuffer = [];
                        //// TBD: use executeLEAFLogic instead of the following subscribe block
                        //if (clickoutput$obj) {
                        //    const subshandle = clickoutput$obj._stream.subscribe({
                        //        next: x => {
                        //            outbuffer = outbuffer.concat(x);
                        //            console.log('next: ', x);
                        //        },
                        //        error: (err) => { // error
                        //            console.log('Error: ' + err);
                        //        },
                        //        complete: () => {
                        //            console.log(outbuffer);
                        //            //subshandle.unsubscribe();
                        //        },
                        //    });
                        //    console.log(clickoutput$obj);
                        //}
                        console.log(config);
                        const inputData = {clickref: `breezyforest-${satid}-click`, nodeinput: appprops.inputData, sourcegraph: {domain: domain, appid: appid}}; // appprops.inputData is passed via nodemenu.js from flowereditor/index.js
                        executeLEAFLogic(actionFunc, inputData, {nodeuuid, refnodedata}); // the runtimeconfig being passed here reaches the final flow via control$obj._config in the flow
                    }
                }
                break;
            default: // when you don't know what to make out of error handling... ;p
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                console.warn("WARNING: leaf sysmenu: unknown tab target: ", e); 
            }
        });
        //hammerRef.current.push(hammer);
        return hammer;
    };

    const initHammer = () => {
        const hammerlist = [];
      hammerlist.push(registerStickyHammer("sysmenu-center"+nodeuuid, null, handleTooltipOpen));
      hammerlist.push(registerStickyHammer("sysmenu-center-orbit"+nodeuuid, null, handleTooltipOpen));
      if (!processedMenuData.current)
        console.log(nodeuuid);
      processedMenuData.current.diamonds.map((a_diamond, diamond_idx) => {
        //return {key: child.key}
        hammerlist.push(registerHammer("sysmenu-satcenter-"+nodeuuid+diamond_idx, diamond_idx, satCenterActionFunc));
        hammerlist.push(registerHammer("sysmenu-satcenter-orbit"+nodeuuid+diamond_idx, diamond_idx, satCenterActionFunc));

        a_diamond.clubs.map((a_club, club_idx) => {
            //console.log('registering club hammer for diamond-', diamond_idx, ': ', club_idx, ', ', a_club.lambdas.default);
            //devrefdrag
            //registerHammer("sysmenu-sat-div-"+nodeuuid+diamond_idx+'-'+club_idx, club_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true);
            hammerlist.push(registerHammer("sysmenu-sat-"+nodeuuid+diamond_idx+'-'+club_idx, club_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true));
            //devrefdrag
            //doTouchAction("sysmenu-sat-"+nodeuuid+diamond_idx+'-'+club_idx, club_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true);
        });
      });
      hammerRef.current = hammerlist;

    };  

    const registerStickyEventHandler = (satid, satidx, actionFunc, isUserDefined=false) => {
        //console.log('registering hammer func: ', satid, satid, actionFunc)
        //const sysMenuSatElement = document.getElementById("sysmenu-satcenter-"+i); // find the element <div> id from the JSX def
        const sysMenuSatElement = document.getElementById(satid); // find the element <div> id from the JSX def
        const doAction = e => {
            console.log('finger event target: ', e.target.id, ' handler id: ', satid, ' func:', actionFunc);
            switch (e.target.id) {
            case satid:
                if (actionFunc) {
                    if (!isUserDefined) {
                        actionFunc(satidx, e.type);
                    }
                    else {
                        executeLEAFLogic(actionFunc, `breezyforest-${satid}-click`, {nodeuuid});
                    }
                }
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                break;
            default: // when you don't know what to make out of error handling... ;p
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                console.warn("WARNING: leaf sysmenu: unknown tab target: ", e); 
            }
        };
        sysMenuSatElement.addEventListener('mousedown', doAction);
        sysMenuSatElement.addEventListener('mouseup', doAction);
    }

    const registerEventHandler = (satid, satidx, actionFunc, isUserDefined=false, clubname=null) => {
        //console.log('registering hammer func: ', satid, satid, actionFunc)
        //const sysMenuSatElement = document.getElementById("sysmenu-satcenter-"+i); // find the element <div> id from the JSX def
        const sysMenuSatElement = document.getElementById(satid); // find the element <div> id from the JSX def
        if (!sysMenuSatElement)
            console.log(satid);
        const doAction = e => {
            console.log('finger event target: ', e.target.id, ' handler id: ', satid, ' func:', actionFunc);
            switch (e.target.id) {
            case satid+"-centercontent":
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                if (actionFunc) {
                    if (!isUserDefined) {
                        actionFunc(satidx);
                    }
                    else {
                        console.log(config);
                        const inputData = {clickref: `breezyforest-${satid}-click`, nodeinput: appprops.inputData, sourcegraph: {domain: domain, appid: appid}}; // appprops.inputData is passed via nodemenu.js from flowereditor/index.js
                        executeLEAFLogic(actionFunc, inputData, {nodeuuid, refnodedata}); // the runtimeconfig being passed here reaches the final flow via control$obj._config in the flow
                    }
                }
                break;
            default: // when you don't know what to make out of error handling... ;p
                e.preventDefault();
                e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                console.warn("WARNING: leaf sysmenu: unknown tab target: ", e); 
            }
        };
        sysMenuSatElement.addEventListener('mousedown', doAction);
        if (appprops.isdraggable && clubname)
            sysMenuSatElement.addEventListener("ondragstart", (event) => onDragStart(event, _breezyforeststdlib_name[clubname]));
        //sysMenuSatElement.addEventListener('mouseup', doAction);
        //hammerRef.current.push(hammer);
        //return hammer;
    };

    const initEventListeners = () => {
        registerStickyEventHandler("sysmenu-center"+nodeuuid, null, handleTooltipOpen);
        registerStickyHammer("sysmenu-center-orbit"+nodeuuid, null, handleTooltipOpen);
        if (!processedMenuData.current)
            console.log(nodeuuid);
        processedMenuData.current.diamonds.map((a_diamond, diamond_idx) => {
            //return {key: child.key}
            const registerClubEvents = (arg1) => {
                // spark_dev_note: move the following evenhandler registration block for clubs into satCenterActionFunc
                // as the elements needed to register club events would be loaded only as a function of the state governed by satCenterActionFunc
                // hence would fail to register event at its current form without refactoring
                a_diamond.clubs.map((a_club, club_idx) => {
                    //console.log('registering club hammer for diamond-', diamond_idx, ': ', club_idx, ', ', a_club.lambdas.default);
                    //devrefdrag
                    //registerHammer("sysmenu-sat-div-"+nodeuuid+diamond_idx+'-'+club_idx, club_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true);
                    registerEventHandler("sysmenu-sat-"+nodeuuid+diamond_idx+'-'+club_idx, club_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true, a_club.name);
                    //devrefdrag
                    //doTouchAction("sysmenu-sat-"+nodeuuid+diamond_idx+'-'+club_idx, club_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true);
                });
            };
            const doDiamondAction = (arg1, arg2) => {
                //return satCenterActionFunc(arg1, registerClubEvents);
                return satCenterActionFunc(arg1);
            };
            registerEventHandler("sysmenu-satcenter-"+nodeuuid+diamond_idx, diamond_idx, doDiamondAction);
            registerEventHandler("sysmenu-satcenter-orbit"+nodeuuid+diamond_idx, diamond_idx, doDiamondAction);

        });
    }

    //#devrefdrag 
    //initHammer();
    //initEventListeners(); // spark_dev_note: programmatically registering event listeners does not seem to work in tandem with ReactFlow
    //#devrefdrag 

    // setup touch interactions on the element
    //console.log(_leafjs);
    //console.log(appprops);
    //if (_leafjs) {



    // async call to handleTooltipClose delayed by 2000ms 
    //setTimeout(() => { handleTooltipClose(); }, 2000);
    *********************************************************/

    // return cleanup code to the hook 
    return () => {
      //setIsMounted(false); // mark the component as unmounted
      //setStateRef(prevState => {return {...prevState, isMounted: false}}); // mark the component as unmounted
        //hammerRef.current.map(a_hammer => a_hammer.destroy());
        //hammerRef.current = [];
        //stateRef.current.isMounted = false;
        //hammerRef.current = [];
      // this cleanup code is to prevent updating state on unmounted component
      // for functional component, please refer to https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
    }
  //}
  }, [sysMenuData]);

  //#devrefdrag
  //useEffect(() => {
  //  processedMenuData.current = preprocessMenuData(sysMenuData, MAX_MENU_COUNT);
  //  need_rerender();
  //}, [sysMenuData]);
  //#devrefdrag

  const doTouchAction = (satid, satidx, actionFunc, nodeinput, isSubscription=false, isUserDefined=false) => {
    return (e) => {
            console.log('hammer event target: ', e.target.id, ' handler id: ', satid, ' func:', actionFunc);
            switch (e.target.id) {
            case satid:
            case satid+"-centercontent":
                //e.preventDefault();
                //handleTooltipOpen();
                //const nodeclickmat = {i: true};
                //if (stateRef.current.satnodeinfo === i)
                //e.preventDefault();
                //e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                if (actionFunc) {
                    //if (actionFunc.name === 'satCenterActionFunc') {}
                    if (!isUserDefined) {
                        actionFunc(satidx);
                    }
                    else {
                        //const clickinput$ = from([[`breezyforest-${satid}-click`]]); //.pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
                        //const controlflow$obj = {_stream: clickinput$, _control: {_config: {nodeuuid}}};
                        //const controlflow$obj = {_stream: clickinput$, _config: {nodeuuid}};
                        //const clickoutput$obj = actionFunc([{_stream: clickinput$}], controlflow$obj);
                        //let outbuffer = [];
                        //// TBD: use executeLEAFLogic instead of the following subscribe block
                        //if (clickoutput$obj) {
                        //    const subshandle = clickoutput$obj._stream.subscribe({
                        //        next: x => {
                        //            outbuffer = outbuffer.concat(x);
                        //            console.log('next: ', x);
                        //        },
                        //        error: (err) => { // error
                        //            console.log('Error: ' + err);
                        //        },
                        //        complete: () => {
                        //            console.log(outbuffer);
                        //            //subshandle.unsubscribe();
                        //        },
                        //    });
                        //    console.log(clickoutput$obj);
                        //}
                        console.log(config);
                        //const inputData = {clickref: `breezyforest-${satid}-click`, nodeinput: appprops.inputData, sourcegraph: {domain: domain, appid: appid}}; // appprops.inputData is passed via nodemenu.js from flowereditor/index.js
                        //const inputData = enterDataBus(
                        //    {
                        //        _type: "touchio",
                        //        _command: "i",
                        //        _targetid: e.target.id,
                        //        _refnode: nodeuuid,
                        //        _provenance: {domain, appid, refnodedata, codebase: "sysmenu.js"}
                        //    },
                        //    {}
                        //); // appprops.inputData is passed via nodemenu.js from flowereditor/index.js
                        const touchbottle = doBottle(
                            "touchevent",
                            {
                                _type: "touchio",
                                _command: "i",
                                _targetid: e.target.id,
                                _refnode: nodeuuid,
                                _provenance: {domain, appid, refnodedata, codebase: "sysmenu.js"}
                            },
                            {}
                        );
                        const inputData = nodeinput.length > 0 ? [touchbottle, ...nodeinput] : touchbottle; // appprops.inputData is passed via nodemenu.js from flowereditor/index.js
                        
                        // spark_dev_note: 10/Aug/2023
                        // actionFunc is a LEAF eta function, here associated to a touch action of an interactable visual element,
                        // (eg a gnav satellite orb or a radial menu item).
                        // Its dataflow function can be defined in LEAF using a lambda link, and 
                        // it can get invoked here, as per user interaction, either via a one-off execution (executeLEAFLogic) for a processed result 
                        // or via a subscription (subscribeToLEAFLogic) for a continuous execution stream.
                        if (!isSubscription) {
                            executeLEAFLogic(actionFunc, inputData, {nodeuuid, refnodedata}).then(_ret=>{
                                console.log("sysmenu: exectueLEAFLogic(): ", _ret);
                            }); // the runtimeconfig being passed here reaches the final flow via control$obj._config in the flow
                        } else {
                            const global_id = satid + "-" + satidx.toString()
                            if (!("subscription" in globalThis))
                                globalThis.subscription = {};
                            if (global_id in globalThis?.subscription) {
                                globalThis.subscription[global_id].next("terminate subscription");
                            }

                            globalThis.subscription[global_id] = new ReplaySubject(1);

                            subscribeToLEAFLogic(actionFunc, inputData, {nodeuuid, refnodedata}, globalThis.subscription[global_id]);
                        }
                    }
                }
                break;
            default: // when you don't know what to make out of error handling... ;p
                e.preventDefault();
                //e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                console.warn("WARNING: leaf sysmenu: unknown tab target: ", e); 
            }
        };
    }
    
    const doTouchActionCenter = (satid, satidx, actionFunc, isSubscription=false, isUserDefined=false) => {
        return (e) => {
            console.log('hammer event target: ', e.target.id, ' handler id: ', satid, ' func:', actionFunc);
            switch (e.target.id) {
            case satid+"-centercontent":
            case satid:
                e.preventDefault();
                //handleTooltipOpen();
                //const nodeclickmat = {i: true};
                //if (stateRef.current.satnodeinfo === i)
                //e.preventDefault();
                //e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                if (actionFunc) {
                    //if (actionFunc.name === 'satCenterActionFunc') {}
                    if (!isUserDefined) {
                        actionFunc(satidx, e.type);
                    }
                    else {
                        //const clickinput$ = from([[`breezyforest-${satid}-click`]]).pipe(take(1)); // an arbitrarily chosen string to function as standard issue invocation input data
                        ////const controlflow$obj = {_stream: clickinput$, _control: {_config: {nodeuuid}}};
                        //const controlflow$obj = {_stream: clickinput$, _config: {nodeuuid}};
                        //const clickoutput$obj = actionFunc([{_stream: clickinput$}], controlflow$obj);
                        //let outbuffer = [];
                        //// TBD: use executeLEAFLogic instead of the following subscribe block
                        //if (clickoutput$obj) {
                        //    clickoutput$obj._stream.subscribe({
                        //        next: x => {
                        //            outbuffer = outbuffer.concat(x);
                        //            console.log('next: ', x);
                        //        },
                        //        error: (err) => { // error
                        //            console.log('Error: ' + err);
                        //        },
                        //        complete: () => {
                        //            console.log(outbuffer);
                        //        },
                        //    });
                        //    console.log(clickoutput$obj);
                        //}
                        executeLEAFLogic(actionFunc, `breezyforest-${satid}-click`, {nodeuuid});
                    }
                }
                break;
            default: // when you don't know what to make out of error handling... ;p
                e.preventDefault();
                //e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                console.warn("WARNING: leaf sysmenu: unknown tab target: ", e); 
            }
        };
    }

//  const data = children.map((child, i) => {
//    return {key: child.key}
//  })

  //const HtmlTooltip = withStyles((theme) => ({
  //  tooltip: {
  //    backgroundColor: '#f5f5f9',
  //    color: 'rgba(0, 0, 0, 0.87)',
  //    maxWidth: 220,
  //    fontSize: theme.typography.pxToRem(12),
  //    border: '1px solid #dadde9',
  //  },
  //}))(Tooltip);

  const calcMenuOrbitRadius = (numsats, satradius, baseradius=50) => {
      const orbitcircumference = 2*Math.PI*baseradius;

      if (numsats * satradius * 2 < orbitcircumference) {
          return baseradius;
      }
      else {
          return ((numsats) * satradius) / (Math.PI);
      }
  };

  //const useStyles = makeStyles({
  //  root: {
  //    position: "absolute",
  //    zIndex: '0',
  //  },

  //  planetContent: {
  //    position: "relative",
  //    //zIndex: 1,
  //    zIndex: '0',
  //  },

  //  satCenterNormal: {
  //    position: "absolute",
  //    //zIndex: 1,
  //    zIndex: '0',
  //  },
  //  satCenterPromoted: {
  //    position: "absolute",
  //    //zIndex: 1,
  //    zIndex: '30',
  //  },

  //  satContentNormal: {
  //    position: "absolute",
  //    //zIndex: 1,
  //    zIndex: 5,
  //  },
  //  satContentPromoted: {
  //    position: "absolute",
  //    //zIndex: 1,
  //    zIndex: '-1',
  //  },
  //});
  //const classes = useStyles();
  const sysmenustyles = {
    root: {
      position: "absolute",
      zIndex: '0',
    },

    planetContent: {
      position: "relative",
      //zIndex: 1,
      zIndex: '0',
    },

    satCenterNormal: {
      position: "absolute",
      //zIndex: 1,
      zIndex: '0',
    },
    satCenterPromoted: {
      position: "absolute",
      //zIndex: 1,
      zIndex: '30',
    },

    satContentNormal: {
      position: "absolute",
      //zIndex: 1,
      zIndex: 5,
    },
    satContentPromoted: {
      position: "absolute",
      //zIndex: 1,
      zIndex: '-1',
    },
  };

  const SysMenuPlanet = styled(Planet)(sysmenustyles.root);

  const onDragStart = (event, nodeType, {spellname="", datakey=""}={}) => {
    console.log("dragging ", nodeType);
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('leaduuid', uuid4());
    event.dataTransfer.setData('datakey', datakey);
    event.dataTransfer.setData('leafnodetype', nodeType);
    spellname && event.dataTransfer.setData('spellname', spellname);
    //event.dataTransfer.setData('onChange', )
    event.dataTransfer.effectAllowed = 'move';
  };


  function invertColor(hex, darkfactor=1.0) {
      function padZero(str, len) {
          len = len || 2;
          const zeros = new Array(len).join('0');
          return (zeros + str).slice(-len);
      }

      if (hex.indexOf('#') === 0) {
          hex = hex.slice(1,7);
      }
      // convert 3-digit hex to 6-digits.
      if (hex.length === 3) {
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      if (hex.length !== 6) {
          throw new Error('Invalid HEX color.');
      }
      // invert color components
      const r = parseInt((255 - parseInt(hex.slice(0, 2), 16)) * darkfactor, 10).toString(16),
              g = parseInt((255 - parseInt(hex.slice(2, 4), 16)) * darkfactor, 10).toString(16),
              b = parseInt((255 - parseInt(hex.slice(4, 6), 16)) * darkfactor, 10).toString(16);
      // pad each with zeros and return
      return '#' + padZero(r) + padZero(g) + padZero(b);
  }
  //let coords2d = this.props.graphlabel_lut[this.props.curNodeUUID].getLabelCoords();
  //console.log('rendering sysmenu at position: ', sysMenuPosition());
  //console.log('UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU satnodeinfo: ', stateRef.current.satnodeinfo);
    return (
        <React.Fragment>
            <div
                id={"sysmenu" + nodeuuid}
                style={{
                    //width: '100%',
                    //height: '100%',
                    //top: 750,
                    //left: 250,
                    top: sysMenuPosition ? sysMenuPosition().y - 50 : 0,
                    left: sysMenuPosition ? sysMenuPosition().x - 50 : 0,
                    position: 'absolute',
                    zIndex: '0'
                    //willChange: 'transform, opacity',
                    //transform: interpolate(
                    //  [50, -50],
                    //  (x, y) => `translate3d(${x}px,${y}px, 0)`
                    //)
                }}
            //className={classes.root}
            >
                {
                processedMenuData.current &&
                <Planet
                    style={{position: "absolute", zIndex: '0'}}
                    orbitStyle={(defaultStyle) => ({
                        ...defaultStyle,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: '#fff3fc',
                        position: 'absolute',
                    })}
                    planetStyle={{
                        position: 'absolute',
                        zIndex: '0'
                    }}
                    satStyle={{
                        position: 'absolute',
                        zIndex: '1'
                    }}
                    curSatChosen={stateRef.current.satnodeinfo}
                    orbitId={'sysmenu-center-orbit' + nodeuuid}
                    centerContent={
                        <Tooltip
                            title={
                                <React.Fragment>
                                    <Typography color="inherit">{helpText && helpText.title}</Typography>
                                    {helpText && helpText.text}
                                </React.Fragment>
                            }
                            open={stateRef.current.nodeinfo}
                            placement="top"
                            arrow
                        >
                            <div
                                id={"sysmenu-center" + nodeuuid}
                                //className={classes.planetContent}
                                //#devrefdrag 
                                onMouseDown={
                                    appprops.istooltip &&
                                    doTouchActionCenter("sysmenu-center"+nodeuuid, null, handleTooltipOpen)
                                }
                                //onMouseUp={
                                //    appprops.istooltip &&
                                //    console.log("############# onMouseUp triggered")
                                ////    setTimeout(() => { handleTooltipClose(); }, 2000)
                                //}
                                //#devrefdrag 
                                style={{
                                    height: centerRadius ? centerRadius : "100px",
                                    width: centerRadius ? centerRadius : "100px",
                                    lineHeight: centerRadius ? centerRadius : "100px",
                                    borderRadius: '50%',
                                    backgroundColor: processedMenuData.current.color ? processedMenuData.current.color : '#1da8f4f0',
                                    //zIndex: '0',
                                    position: 'relative',
                                    textAlign: 'center',
                                    fontSize: '20px',
                                    color: invertColor(processedMenuData.current.color ? processedMenuData.current.color : '#1da8f4f0', 0.8),
                                }}
                            >
                                {sysMenuData.name}
                            </div>
                        </Tooltip>
                    }
                    open
                    autoClose={false}
                    orbitRadius={calcMenuOrbitRadius(processedMenuData.current.diamonds.length, 30, centerRadius ? centerRadius : 100)}
                    rotation={0}
                >
                    {
                        processedMenuData.current.diamonds.map(
                            (a_diamond, d_idx) => (
                                <div
                                    key={"sysmenu-satcenter-div-" + nodeuuid + d_idx}//{'satcenter'+a_diamond.key}
                                    style={{
                                        position: 'relative',
                                        //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '30' : '2'
                                        //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '1' : '0'
                                        //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? 3 : 3
                                    }}
                                    data={{obj: a_diamond, idx: d_idx, note: "diamond"}}
                                >
                                    <Planet
                                        //className={(stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? classes.satCenterPromoted : classes.satCenterNormal}
                                        id={"sysmenu-satcenter-" + nodeuuid + d_idx}
                                        key={"sysmenu-satcenter-" + nodeuuid + d_idx}//{'satcenter'+a_diamond.key}
                                        hammerid={"sysmenu-satcenter-" + nodeuuid + d_idx}
                                        style={{position: "absolute", zIndex: '0'}}
                                        //onClick={doTouchAction("sysmenu-sat-"+nodeuuid+diamond_idx+'-'+club_idx, club_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true)}
                                        orbitStyle={(defaultStyle) => ({
                                            ...defaultStyle,
                                            borderWidth: 1,
                                            borderStyle: 'dashed',
                                            borderColor: '#fff3fc',
                                            position: 'absolute',
                                        })}
                                        planetStyle={{
                                            position: 'absolute',
                                            zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? 3 : 1
                                        }}
                                        satStyle={{
                                            position: 'relative',
                                            zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? 4 : 1
                                        }}
                                        orbitId={"sysmenu-satcenter-orbit" + nodeuuid + d_idx}
                                        centerContent={
                                            <div
                                                id={"sysmenu-satcenter-" + nodeuuid + d_idx + "-centercontent"}
                                                //className={(stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? classes.satCenterPromoted : classes.satCenterNormal}
                                                ////#devrefdrag 
                                                //onMouseDown= {
                                                //    a_diamond.clubs.length > 0 ?
                                                //    doTouchActionCenter("sysmenu-satcenter-" + nodeuuid + d_idx, d_idx, satCenterActionFunc) :
                                                //    doTouchAction("sysmenu-satcenter-" + nodeuuid + d_idx, d_idx, a_diamond.lambdas.default ? a_diamond.lambdas[a_diamond.lambdas.default] : undefined, true)
                                                //}
                                                onPointerDown= {
                                                    a_diamond.clubs.length > 0 ?
                                                    doTouchActionCenter("sysmenu-satcenter-" + nodeuuid + d_idx, d_idx, satCenterActionFunc) :
                                                    doTouchAction("sysmenu-satcenter-" + nodeuuid + d_idx, d_idx, a_diamond.lambdas.default ? a_diamond.lambdas[a_diamond.lambdas.default] : undefined, a_diamond.nodeinput, a_diamond.subscription, true)
                                                }
                                                ////#devrefdrag 
                                                style={{
                                                    pointerEvents: "auto",
                                                    position: "absolute",
                                                    top: -25,
                                                    left: -25,
                                                    height: 50,
                                                    width: 50,
                                                    borderRadius: '50%',
                                                    backgroundColor: (a_diamond.clubs.length > 0 ? 
                                                        ((stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? 
                                                            '#1da8f4' : 
                                                            (a_diamond.color ? a_diamond.color : '#1da8a4')
                                                        ) :
                                                        '#a256ad'
                                                    ), // '#a256ad' if the diamond is a leaf node like a club
                                                    textAlign: "center",
                                                    verticalAlign: "middle",
                                                    //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '30' : '0'
                                                    //zIndex: '15'
                                                    //zIndex: '0'
                                                }}
                                            >
                                                <div id={"sysmenu-satcenter-info1" + nodeuuid + d_idx} style={{ pointerEvents: 'none', height: 20 }}>
                                                    <Badge badgeContent={a_diamond.lambdas.badge ? a_diamond.lambdas.badge() : undefined} color="primary">
                                                        <div id={"sysmenu-satcenter-icon" + nodeuuid + d_idx} style={{ height: 20 }}>
                                                            <Icon>
                                                                <img src={a_diamond.svgicon} />
                                                            </Icon>
                                                        </div>
                                                    </Badge>
                                                </div>
                                                <div id={"sysmenu-satcenter-info2" + nodeuuid + d_idx} style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Typography
                                                        variant="caption"
                                                        id={"sysmenu-satcenter-text" + nodeuuid + d_idx}
                                                    >
                                                        {a_diamond.name}
                                                    </Typography>
                                                </div>
                                            </div>
                                        }
                                        open={a_diamond.clubs.length > 0 ? (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) : false}
                                        //autoClose={true}
                                        orbitRadius={a_diamond.clubs.length > 0 ? calcMenuOrbitRadius(a_diamond.clubs.length, 35, 50) : 1}
                                        rotation={180}
                                    >
                                        {
                                            stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx &&
                                            a_diamond.clubs.map(
                                                (a_club, c_idx) => (
                                                    <div
                                                        id={"sysmenu-sat-div-" + nodeuuid + d_idx + '-' + c_idx} //{'sat-'+a_club.key}
                                                        key={"sysmenu-sat-div-" + nodeuuid + d_idx + '-' + c_idx} //{'sat-'+a_club.key}
                                                        style={{
                                                            //position: 'relative',
                                                            //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '300' : '2'
                                                            //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '50' : '3'
                                                        }}
                                                        //onMouseMove={(event) => onDragStart(event, _breezyforeststdlib_name[a_club.name])} 
                                                        //draggable={appprops.isdraggable ? "true" : "false"}
                                                        //data={{obj: a_club, idx: c_idx, note: "club"}}
                                                        //onMouseUp={(event)=> {console.log("dropped")}}
                                                    >
                                                        <Tooltip
                                                            key={"sysmenu-sat-tooltip" + nodeuuid + d_idx + '-' + c_idx} //{'sat-'+a_club.key}
                                                            title={a_club.tooltip ? a_club.tooltip : ''} placement="top" arrow
                                                        >
                                                            <div
                                                                id={"sysmenu-sat-" + nodeuuid + d_idx + '-' + c_idx}
                                                                key={"sysmenu-sat-" + nodeuuid + d_idx + '-' + c_idx}
                                                                draggable={appprops.isdraggable ? "true" : "false"}
                                                                ////#devrefdrag 
                                                                onDragStart={(event) => onDragStart(event, _breezyforeststdlib_name[a_club.name])}
                                                                //onMouseDown={
                                                                //    doTouchAction("sysmenu-sat-" + nodeuuid + d_idx + '-' + c_idx, c_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, true)
                                                                //}
                                                                onPointerDown={
                                                                    doTouchAction("sysmenu-sat-" + nodeuuid + d_idx + '-' + c_idx, c_idx, a_club.lambdas.default ? a_club.lambdas[a_club.lambdas.default] : undefined, a_club.nodeinput, a_club.subscription, true)
                                                                }
                                                                ////#devrefdrag 
                                                                //key={a_club.key}
                                                                //className={(stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? classes.satContentPromoted : classes.satContentNormal}
                                                                style={{
                                                                    pointerEvents: "auto",
                                                                    height: 50,
                                                                    width: 50,
                                                                    borderRadius: '100%',
                                                                    backgroundColor: a_club.color ? a_club.color : '#a256ad',
                                                                    textAlign: "center",
                                                                    verticalAlign: "middle",
                                                                    margin: "auto",
                                                                    position: "relative",
                                                                    fontSize: "14pt",
                                                                    zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '50' : '50'
                                                                    //zIndex: "20"
                                                                }}
                                                                data={{obj: a_club, idx: c_idx, note: "club"}}
                                                            >
                                                                <div id={"sysmenu-sat-info1-" + nodeuuid + d_idx + '-' + c_idx} style={{ pointerEvents: 'none', height: 20 }}>
                                                                    <Badge badgeContent={a_club.lambdas.badge ? a_club.lambdas.badge() : undefined} color="primary">
                                                                        <div id={"sysmenu-sat-icon-" + nodeuuid + d_idx + '-' + c_idx} style={{ height: 20 }}>
                                                                            <Icon>
                                                                                <img src={a_club.svgicon} />
                                                                            </Icon>
                                                                        </div>
                                                                    </Badge>
                                                                </div>
                                                                <div id={"sysmenu-sat-info2-" + nodeuuid + d_idx + '-' + c_idx} style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                    <Typography
                                                                        variant="caption"
                                                                        id={"sysmenu-sat-text-" + nodeuuid + d_idx + '-' + c_idx}
                                                                    >
                                                                        {a_club.name}
                                                                    </Typography>
                                                                </div>
                                                            </div>
                                                        </Tooltip>
                                                    </div>
                                                ))
                                        }
                                    </Planet>
                                </div>
                            )
                        )
                    }
                </Planet>
                }
            </div>
        </React.Fragment>
        ||
        null
    );
};



//storiesOf("Planet", module).add("planetception (planets as satellites)", SystemMenuComponent);
//export default connect()(SystemMenuComponent);
export default SystemMenuComponent;
