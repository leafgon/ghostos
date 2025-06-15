import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import Hammer, { defaults } from '@egjs/hammerjs';
import {v4 as uuidv4} from 'uuid';
import { Typography, Tooltip } from '@material-ui/core';
import SystemMenuComponent from './sysmenu';
import { useParams } from 'react-router-dom';
import { Box, Button } from '@mui/material';

const useLEAFPopupMenu = ({data}) => {
    const { mode, domain, appid } = useParams();
    const menu_symbol = <>&#127183;</>; //'🃏'; // joker face, https://unicode-table.com/en/1F0CF/

    const [hammerInitialized, setHammerInitialized] = useState(false);
    const [renderstate, setRenderState] = useState({render_id: null});
    const stateRef = useRef({isSysMenuShown: false, press_isCalled: false, isMounted: false, sysMenuData: {}});

    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const requestRender = () => {
        if (stateRef.current.isMounted) 
            setRenderState((otherstate) => {
                return {...otherstate, render_id: uuidv4()};
            });
    };

    useEffect(() => {
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

        //if (!state.is_hammer_init) {}
        if (!hammerInitialized) {
            if(data.isdebug) {
                // debug port hammer action
                const ui_element_debugport = document.getElementById('menuPort'+data.leaduuid);
                //const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
                const mc_debug = new Hammer.Manager(ui_element_debugport);
        
                    // add tap recognizers
                //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
                //let debug_singleTap = new Hammer.Tap({event: 'debugsingletap' });
                const debug_Press = new Hammer.Press({event: 'press', time:500 });
                const debug_PressUp = new Hammer.Press({event: 'pressup' });
                const debug_Pan = new Hammer.Pan({event: 'pan'});
                //let debug_longPress = new Hammer.Press({event: 'longpress', time:500});
                //let swipe = new Hammer.Swipe({event: 'swipe'});
        
                //mc_toggletext.add([longPress]);
                mc_debug.add([debug_Press]); 
                mc_debug.add([debug_PressUp]);
                mc_debug.add([debug_Pan]);
                //mc_debug.on('press', e => {handleTooltipOpen(e);});
                //mc_debug.on('pressup', e => {handleTooltipClose(e);});
                // spark_dev_note: react running in strict mode runs react component codes twice in a row
                // for the reasons to assist developers to spot undesirable side-effects, etc.
                // this inevitably results in weird dev time behaviors of toggle switches (flip-flops)
                // in order to counter this the following rate limit is implemented.
                mc_debug.on('press', e => {
                    console.log('joker pressed:',stateRef.current.press_isCalled); 
                    if (!stateRef.current.press_isCalled) { // this block rate limits the call to 500ms 
                        console.log('joker pressed'); 
                        (!stateRef.current.isSysMenuShown) ? showSystemMenu(e) : hideSystemMenu(e);
                        stateRef.current.press_isCalled = true;
                        setTimeout(() => {
                            stateRef.current.press_isCalled = false;
                        }, 500);
                    }
                });
                //mc_debug.on('pan', e => {hideSystemMenu(e);});
            }

            //mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
            //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
            setHammerInitialized(prevVal => true);
        }
    }, []);

    useEffect(() => {
        
        stateRef.current.isMounted = true;
        stateRef.current.sysMenuData = data.sysMenuData;

        return function cleanup() {
            stateRef.current.isMounted = false;
        };
    }, [data]);

    return (
        <React.Fragment>
        <span id={"menuPort"+data.leaduuid} style={{pointerEvents: "auto", fontSize: "30pt"}} >
            {menu_symbol}
        </span>
        <div id={"sysmenu-top-"+data.leaduuid} style={{pointerEvents: "auto", position: "absolute", alignContent: "center", top: "200px", left: "-30px", zIndex: data.zIndex }}>
            {
            //data.isSysMenuShown
            stateRef.current.isSysMenuShown &&
            <SystemMenuComponent
                //_leafjs= {{
                //  camera: threejs_props.camera,
                //  render: {canvrect:this.renderer.domElement.getBoundingClientRect(), width: threejs_props.jsx_elements.canvas.offsetWidth, height: threejs_props.jsx_elements.canvas.offsetHeight}
                //}}
                //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist
                key={data.leaduuid}
                appprops= {{
                    isdraggable: true,
                    istooltip: true,
                    nodeuuid: data.leaduuid,
                    //bgtaglist: leafapp_props.current.bgtaglist,
                    config:{ mass: 10, tension: 60, friction: 100 },
                    centerRadius: 100,
                    sysMenuData: stateRef.current.sysMenuData,
                    helpText: {
                        title: 'What is LEAF?',
                        text: 
                            <div style={{margin: 0, width: 304}}>
                            <Box
                                id='popupmenubox'
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                sx={{
                                    width: 300,
                                    backgroundColor: 'primary.light',
                                    '& .MuiTextField-root': {
                                        m: 1,
                                        width: "25ch", // please refer to https://www.w3schools.com/cssref/css_units.asp for units, default to use 'ch'
                                    },
                                }}
                            >
                                <div style={{margin:5}}>
                                {"LEAF is a programming language for the rest of us, including you. "}
                                {"You can build amazing things just by connecting the dots in LEAF. "}
                                <br /><br />
                                {"About the software:"}
                                <br />
                                {"What you are currently looking at is the reference LEAF editor built for BreezyForest. It is the primary interface with which to construct your LEAF ideas."}
                                {"The radial palette you have just touched has a bunch of core LEAF building blocks (aka the \"dots\", aka the LEAF nodes) that can be drag-and-dropped into the canvas and be connected to your heart's content. "}
                                <br /><br />
                                {"Get ready to set sail and bon voyage!"}
                                <Box 
                                    display="flex"
                                    alignItems="flex-end"
                                    justifyContent="flex-end" 
                                    sx={{
                                        '& .MuiButton-root': {
                                            m: 1,
                                            width: "25ch", // please refer to https://www.w3schools.com/cssref/css_units.asp for units, default to use 'ch'
                                        },
                                    }}
                                >
                                    <Button color="primary" variant="outlined" href={`/nav/${domain}/${appid}`}> 
                                        {"> Let it flow!"}
                                    </Button>
                                </Box>
                                </div>
                            </Box>
                            </div>,
                    }
                                    //href={`https://www.leafgon.com/nav/${domain}/${appid}`}>
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

export {useLEAFPopupMenu};