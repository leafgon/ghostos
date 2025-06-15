import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import Hammer, { defaults } from '@egjs/hammerjs';
import {v4 as uuidv4} from 'uuid';
//import { Typography, Tooltip } from '@material-ui/core';
import { Tooltip, Typography } from '@mui/material';
import { DebugPort } from './porthandle'
//#reactflow #migration
//import { Handle, Position, NodeProps, Connection, Edge } from '../lib/react-flow-renderer';
import { Handle, Position, NodeProps, Connection, Edge } from '../lib/reactflow.11.10.4/core/dist/esm/index.js';
import { debugHandleStyle } from './styles';

import { useLEAFNodeMenu } from './nodemenu';
//import { getMenuGraph } from '../index';
//import { executeLEAFLogic } from '../../../../parser/leaf';
//import { memoize } from 'lodash';

//import { _leafgraph } from '../../../../parser/nodelogic/abstraction/leafgraph';

//const getMenuGraph = async (addrstr) => {
//    const lambdactrl = {
//        gos: {
//            standardSpellbook: {},
//            curatedSpellbook: {},
//            stdlambdalut: {},
//            curatedlambdalut: {},
//            //leafio: leafRuntimeRef.current.leafio,
//            //etaTree: {mnemosyne: mainMnemosyne, domain: host_domain, appid: host_appid}, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
//            leafio: props.etaTree.leafio,
//            etaTree: props.etaTree, // root etaTree
//        }, 
//        user: {
//            spellbook: {},
//            lambdalut: {},
//        }
//    };
//    const {domain, appid} = lambdactrl.gos.etaTree;
//    const leafgraph_args = {graphuuid: '', domain, appid, graphaddrstr: addrstr}; //'breezyforest/editor'
//    const getLEAFGraph = _leafgraph.lambda(lambdactrl)({refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: []});
//    const rt_leafgraph = await getLEAFGraph; //.then((response) =>  // async call to get leafgraph
//
//    console.log(rt_leafgraph);
//
//    return rt_leafgraph;
//};
//
//const debuggerGlobal = {};
//const getMenuGraphM = memoize((graphaddrstr) => {
//    getMenuGraph(graphaddrstr).then(async (_debugmenugraph) => {
//        debuggerGlobal.debugmenu = await executeLEAFLogic(_debugmenugraph.jokermenu._default, [], {});
//    });
//});
//getMenuGraphM('breezyforest/nodejoker');

const useLEAFDebugger = ({data}) => {

    const [hammerInitialized, setHammerInitialized] = useState(false);
    const [renderstate, setRenderState] = useState({render_id: null});
    const stateRef = useRef({debuginfo: false, isMounted: false});
    const debugmenudata = {...data, sysMenuData: data.debugMenuData}; //, isdebug: false};
    const leafNodeDebugMenu = useLEAFNodeMenu({data: debugmenudata, touchconfig: {touchelemid: "debugPort"+data.leaduuid, touchcenterradius: 50}});

    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const requestRender = () => {
        if (stateRef.current.isMounted) 
            setRenderState((otherstate) => {
                return {...otherstate, render_id: uuidv4()};
            });
    };

    useEffect(() => {

        const handleTooltipClose = (event) => {
            try {
            //if (stateRef.current.isMounted) {
                console.log("handleTooltipClose() called");
            //setNodeinfo( false );
                stateRef.current.debuginfo = false;
            //setStateRef( prevState => {return {...prevState, nodeinfo: false}} );
            //setState( prevState => {return {...prevState, ...stateRef.current}}); // force component rerender
                requestRender();
            //isunmounted = false;
            //}
            }
            catch (err) {}
            finally{return event;}
        };
        const handleTooltipOpen = (event) => {
            try {
                console.log("handleTooltipOpen() called");
                event.preventDefault(); 
                if (!stateRef.current.debuginfo) {
                    //setNodeinfo( true );
                    stateRef.current.debuginfo = true;
                    //setStateRef( prevState => {return {...prevState, nodeinfo: true}} );
                    //setState( prevState => {return {...prevState, ...stateRef.current}}); // force component rerender
                    //if (stateRef.current.isMounted) 
                    requestRender();
        
                    //setTimeout(() => { handleTooltipClose(); }, 2000);
                }
            }
            catch (err) {}
            finally{return event;}
        };

        //if (!state.is_hammer_init) {}
        //if (!hammerInitialized) {
        //    if(data.isdebug) {
        //        // debug port hammer action
        //        const ui_element_debugport = document.getElementById('debugPort'+data.leaduuid);
        //        //const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
        //        const mc_debug = new Hammer.Manager(ui_element_debugport);
        
        //            // add tap recognizers
        //        //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
        //        //let debug_singleTap = new Hammer.Tap({event: 'debugsingletap' });
        //        const debug_Press = new Hammer.Press({event: 'press', time:500 });
        //        const debug_PressUp = new Hammer.Press({event: 'pressup' });
        //        const debug_Pan = new Hammer.Pan({event: 'pan'});
        //        //let debug_longPress = new Hammer.Press({event: 'longpress', time:500});
        //        //let swipe = new Hammer.Swipe({event: 'swipe'});
        
        //        //mc_toggletext.add([longPress]);
        //        mc_debug.add([debug_Press]); 
        //        mc_debug.add([debug_PressUp]);
        //        mc_debug.add([debug_Pan]);
        //        mc_debug.on('press', e => {handleTooltipOpen(e);});
        //        mc_debug.on('pressup', e => {handleTooltipClose(e);});
        //        mc_debug.on('pan', e => {handleTooltipClose(e);});
        //    }

        //    //mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
        //    //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
        //    setHammerInitialized(prevVal => true);
        //}
        
        stateRef.current.isMounted = true;

        return function cleanup() {
            stateRef.current.isMounted = false;
        };
    }, [data]);

    return (
        <React.Fragment>
        {
            data.leaduuid &&
            <div>
            <span id={"debugPort"+data.leaduuid} style={{zIndex: 1, pointerEvents: "auto"}} >
                <DebugPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="debug_port" style={debugHandleStyle} >
                {
                    data.isdebug &&
                    leafNodeDebugMenu
        //            <Tooltip 
        //                title={
        //                <React.Fragment>
        //                    <Typography color="inherit">
        //                        {data.leaduuid}
        //                    </Typography>
        //                </React.Fragment>
        //                } 
        //                open={stateRef.current.debuginfo}
        //                placement="top" 
        //                arrow
        //            >
        //                <span id={"debugPort"+data.leaduuid} style={{zIndex: 1, pointerEvents: "auto"}} >
        //                    <DebugPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="debug_port" style={debugHandleStyle} >
        //                    </DebugPort> 
        //                </span>
        //            </Tooltip>
                }
                </DebugPort> 
            </span>
            </div>
        }
        </React.Fragment>
    );
};

export {useLEAFDebugger};