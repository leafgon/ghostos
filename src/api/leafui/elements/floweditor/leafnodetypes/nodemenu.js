import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import Hammer, { defaults } from '@egjs/hammerjs';
import {v4 as uuidv4} from 'uuid';
import { Typography, Tooltip } from '@mui/material';
import { DebugPort } from './porthandle'
//#reactflow #migration
//import { Handle, Position, NodeProps, Connection, Edge } from '../lib/react-flow-renderer';
import { Handle, Position, NodeProps, Connection, Edge } from '../lib/reactflow.11.10.4/core/dist/esm/index.js';
import { debugHandleStyle } from './styles';
import SystemMenuComponent from '../../sysmenu';

const useLEAFNodeMenu = ({data, touchconfig}) => {

    const [hammerInitialized, setHammerInitialized] = useState(false);
    const [renderstate, setRenderState] = useState({render_id: null});
    const {touchelemid, touchcenterradius} = touchconfig;
    const stateRef = useRef({isSysMenuShown: false, press_isCalled: false, isMounted: false, sysMenuData: {}, debuginfo: false, menuCenterRadius: 50});

    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const requestRender = () => {
        if (stateRef.current.isMounted) 
            setRenderState((otherstate) => {
                return {...otherstate, render_id: uuidv4()};
            });
    };

    useEffect(() => {
        //if (!state.is_hammer_init) {}
        if (!hammerInitialized) {
            //if(data.isdebug) {
            //    // debug port hammer action
            //    const ui_element_menuport = document.getElementById('nodeMenuPort'+data.leaduuid);
            //    const ui_element_debugport = document.getElementById('debugPort'+data.leaduuid);
            //    //const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
            //    const mc_debug = new Hammer.Manager(ui_element_debugport);
            //    const mc_menu = new Hammer.Manager(ui_element_menuport)
        
            //        // add tap recognizers
            //    //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
            //    //let debug_singleTap = new Hammer.Tap({event: 'debugsingletap' });
            //    const menu_Press = new Hammer.Press({event: 'press', time:500 });
            //    const debug_Press = new Hammer.Press({event: 'press', time:500 });
            //    const debug_PressUp = new Hammer.Press({event: 'pressup' });
            //    const debug_Pan = new Hammer.Pan({event: 'pan'});
            //    //let debug_longPress = new Hammer.Press({event: 'longpress', time:500});
            //    //let swipe = new Hammer.Swipe({event: 'swipe'});
        
            //    //mc_toggletext.add([longPress]);
            //    mc_menu.add([menu_Press]); 
            //    mc_debug.add([debug_Press]); 
            //    mc_debug.add([debug_PressUp]);
            //    mc_debug.add([debug_Pan]);
            //    //mc_debug.on('press', e => {handleTooltipOpen(e);});
            //    //mc_debug.on('pressup', e => {handleTooltipClose(e);});
            //    // spark_dev_note: react running in strict mode runs react component codes twice in a row
            //    // for the reasons to assist developers to spot undesirable side-effects, etc.
            //    // this inevitably results in weird dev time behaviors of toggle switches (flip-flops)
            //    // in order to counter this the following rate limit is implemented.
            //    mc_menu.on('press', e => {
            //        console.log('joker pressed:',stateRef.current.press_isCalled); 
            //        if (!stateRef.current.press_isCalled) { // this block rate limits the call to 500ms 
            //            console.log('joker pressed'); 
            //            (!stateRef.current.isSysMenuShown) ? showSystemMenu(e) : hideSystemMenu(e);
            //            stateRef.current.press_isCalled = true;
            //            setTimeout(() => {
            //                stateRef.current.press_isCalled = false;
            //            }, 1000);
            //        }
            //    });
            //    //mc_debug.on('pan', e => {hideSystemMenu(e);});
            //    mc_debug.on('press', e => {handleTooltipOpen(e);});
            //    mc_debug.on('pressup', e => {handleTooltipClose(e);});
            //    mc_debug.on('pan', e => {handleTooltipClose(e);});
            //}

            //mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
            //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
            setHammerInitialized(prevVal => true);
        }
        
    }, []);

    const menu_Press = new Hammer.Press({event: 'press', time:500 });
    useEffect(() => {
        stateRef.current.isMounted = true;
        stateRef.current.sysMenuData = data.sysMenuData; // data.sysMenuData comes from parseGraphNodesToEditorElements in floweditor/index.js

        //if (data.leaf.logic.type === "leafelement")
        //    console.error("nodemenu update", data.isdebug, JSON.stringify(data))
        //if (data.leaduuid.slice(0,4) === "17af")
        //    console.log("start debugging");

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

        const showSystemMenu = (event) => {
            if (!stateRef.current.isSysMenuShown) {
            //  this.graph.mesh_lut.mesh2node[mesh.uuid] = node.uuid; // a look-up table to go from mesh uuid (3D screen reference) to node uuid (backend db reference)
            // retrieve sysMenuData as per the currently selected mesh node (this.state.curNode) 
            //let meshuuid = leafapp_props.current.curNode.uuid;
            //let nodeuuid = graph_props.current.mesh_lut.mesh2node[meshuuid];
            ////this.graph.node_lut[nodeuuid];
    
            //console.log('################>>>>> meshuuid: ', meshuuid, ' nodeuuid: ', nodeuuid);
            //console.log('################>>>>> : ', graph_props.current.mesh_lut);
            //console.log('################>>>>> : ', graph_props.current.node_lut);
    
            //leafapp_props.current.sysMenuData = [{index: 1, title: '1'}, {index: 2, title: '2'}, {index: 3, title: '3'}, {index: 4, title: '4'}];
            //leafapp_props.current.sysMenuData = graph_props.current.node_lut[nodeuuid];
                stateRef.current.isSysMenuShown = true;
                requestRender();
            }
        };
    
        const hideSystemMenu = (event) => {
            if (stateRef.current.isSysMenuShown) {
                //stateRef.current.sysMenuData = [];
                stateRef.current.isSysMenuShown = false;
                requestRender();
            }
        };

        let mc_menu = undefined;
        if(data.isdebug) {
            // debug port hammer action
            console.log(touchelemid, touchcenterradius);
            //const ui_element_menuport = document.getElementById('nodeMenuPort'+data.leaduuid);
            //const ui_element_debugport = document.getElementById('debugPort'+data.leaduuid);

            const ui_element_menuport = document.getElementById(touchelemid);
            if (ui_element_menuport) {
                stateRef.current.menuCenterRadius = touchcenterradius;
                mc_menu = new Hammer.Manager(ui_element_menuport)
                mc_menu.add([menu_Press]); 
                mc_menu.on('press', e => {
                    console.log('joker pressed:',stateRef.current.press_isCalled); 
                    if (!stateRef.current.press_isCalled) { // this block rate limits the call to 500ms 
                        console.log('joker pressed'); 
                        (!stateRef.current.isSysMenuShown) ? showSystemMenu(e) : hideSystemMenu(e);
                        stateRef.current.press_isCalled = true;
                        setTimeout(() => {
                            stateRef.current.press_isCalled = false;
                        }, 1000);
                    }
                });
            }
                // add tap recognizers
            //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
            //let debug_singleTap = new Hammer.Tap({event: 'debugsingletap' });

            //const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
            //if (ui_element_debugport) {
            //    const mc_debug = new Hammer.Manager(ui_element_debugport);
            //    const debug_Press = new Hammer.Press({event: 'press', time:500 });
            //    const debug_PressUp = new Hammer.Press({event: 'pressup' });
            //    const debug_Pan = new Hammer.Pan({event: 'pan'});
            //    //let debug_longPress = new Hammer.Press({event: 'longpress', time:500});
            //    //let swipe = new Hammer.Swipe({event: 'swipe'});
        
            //    //mc_toggletext.add([longPress]);
            //    mc_debug.add([debug_Press]); 
            //    mc_debug.add([debug_PressUp]);
            //    mc_debug.add([debug_Pan]);
            //    //mc_debug.on('press', e => {handleTooltipOpen(e);});
            //    //mc_debug.on('pressup', e => {handleTooltipClose(e);});
            //    // spark_dev_note: react running in strict mode runs react component codes twice in a row
            //    // for the reasons to assist developers to spot undesirable side-effects, etc.
            //    // this inevitably results in weird dev time behaviors of toggle switches (flip-flops)
            //    // in order to counter this the following rate limit is implemented.
            //    //mc_debug.on('pan', e => {hideSystemMenu(e);});
            //    mc_debug.on('press', e => {handleTooltipOpen(e);});
            //    mc_debug.on('pressup', e => {handleTooltipClose(e);});
            //    mc_debug.on('pan', e => {handleTooltipClose(e);});
            //}
        }

        return function cleanup() {
            stateRef.current.isMounted = false;
            if (mc_menu) {
                mc_menu.off("press");
                mc_menu.destroy();
            }
        };
    }, [data.sysMenuData]);

    //if (data.leaduuid.slice(0,4) == "4b8e") {
    //    console.log("start debugging.");
    //}
        
//        <span id={"debugPort"+data.leaduuid} style={{pointerEvents: "auto", background:"#fff"}} >
//            <DebugPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="debug_port" style={debugHandleStyle} >
//            </DebugPort> 
//        </span>
    return (
        <React.Fragment>
        {
        //    data.isdebug &&
        //    <Tooltip 
        //        title={
        //        <React.Fragment>
        //            <Typography color="inherit">
        //                {data.leaduuid}
        //            </Typography>
        //        </React.Fragment>
        //        } 
        //        open={stateRef.current.debuginfo}
        //        placement="top" 
        //        arrow
        //    >
        //        <span id={"debugPort"+data.leaduuid} style={{pointerEvents: "auto", background:"#fff"}} >
        //            <DebugPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="debug_port" style={debugHandleStyle} >
        //            </DebugPort> 
        //        </span>
        //    </Tooltip>
        }
        <div id={"sysmenu-top-"+data.leaduuid} style={{position: "absolute", top: "-12px", left: "-12px", alignItems:'center', lineHeight:'80%' }}>
            {
            //data.isSysMenuShown
            stateRef.current.isSysMenuShown && stateRef.current.sysMenuData &&
            <SystemMenuComponent
                //_leafjs= {{
                //  camera: threejs_props.camera,
                //  render: {canvrect:this.renderer.domElement.getBoundingClientRect(), width: threejs_props.jsx_elements.canvas.offsetWidth, height: threejs_props.jsx_elements.canvas.offsetHeight}
                //}}
                //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist
                key={data.leaduuid}
                appprops= {{
                    domain: data.domain,
                    appid: data.appid,
                    nodeuuid: data.leaduuid,
                    inputData: data.inputData,
                    refnodedata: {leaf: data.leaf}, // this is where the downstream SystemMenuComponent instance to find out about its calling root node such as leaflisp or any others
                    //bgtaglist: leafapp_props.current.bgtaglist,
                    config:{ mass: 10, tension: 60, friction: 100 },
                    centerRadius: stateRef.current.menuCenterRadius,
                    sysMenuData: stateRef.current.sysMenuData,
                    //sysMenuPosition: leafapp_props.current.curNodeScreenPosition,
                    //sysMenuPosition: () => {return {x: appwinwidth/2, y: appwinheight/2}},
                }}
                //curLEAFapp={leafapp_props.current.curLEAFapp} curNodeUUID={leafapp_props.current.curNodeUUID}
            >
            </SystemMenuComponent>
            }
        </div>
        </React.Fragment>
    );
};

export {useLEAFNodeMenu};