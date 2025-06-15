import {LEAFDataFilter} from './datafilter';
import {LEAFDataCombine} from './datacombine';
import {LEAFSpell} from './spell';
import {LEAFUtility} from './utility';
import {LEAFNodeContext, LEAFEdgeContext} from './context';
import {LEAFAnchorPoint} from './anchorpoint';
import {LEAFDeckSpade, LEAFDeckDiamond, LEAFDeckHeart, LEAFDeckClub, LEAFDeckTracker} from './deck';

import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
//#reactflow #migration
//import { Handle, Position, NodeProps, Connection, Edge } from '../lib/react-flow-renderer'; //'react-flow-renderer';
//import { useStore, useStoreApi } from '../../lib/react-flow-renderer'; ///store/hooks'; //.store.hooks';
import { Handle, Position, NodeProps, Connection, Edge } from '../lib/reactflow.11.10.4/core/dist/esm/index.js'; ///store/hooks'; //.store.hooks';
import { AnchorPort, DataPort, LambdaPort, DebugPort } from './porthandle'
import {mutateUpdateNode} from '../leafgql';
import { useLEAFDebugger } from './debugger';
import { useLEAFNodeMenu } from './nodemenu';
import { SystemMenuComponent } from '../../sysmenu';
import { throttle } from 'lodash';

import {targetHandleStyle, targetAuxDataHandleStyle, targetAnchorHandleStyle, debugHandleStyle, sourceHandleStyleA, sourceHandleStyleB, sourceHandleStyle, sourceAuxDataHandleStyle, sourceAnchorHandleStyle, useStyles} from './styles';
import {onConnect} from './uihandlers';

import Hammer, { defaults } from '@egjs/hammerjs';
  
import Draggable from 'react-draggable';

import { TextField, Input } from '@material-ui/core';

import { encodeUnicode, decodeUnicode } from '../../../../utils/leafbase64'; // '../../../ghostos/api/utils/leafbase64';
import { fetchMultiKeyedData, setMultiKeyedData } from '../../../../utils/fetchnodedata'; //'../../../ghostos/api/utils/fetchnodedata';
import {v4 as uuidv4} from 'uuid';

import { Typography, Tooltip } from '@material-ui/core';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import cloneDeep from 'lodash/cloneDeep';

const svgfilepath = '/assets/svg/'

const LEAFEditorCircularErrorNode = (apidef, errorMesg) => { // apidef is a leaf node spec as per _leafstdlib_dataflow_api from ghostos/api/metamodel.js
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: (apidef.lambdaports.input ? true : false) 
        // the neptune/trident chaining ports always open
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#8f23';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#000';

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? apidef.editorconfig.svgicon.unicode :
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));

    const name_datakey = apidef.editorconfig.namedatakey;

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
        // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
        const [state, setState] = useState({render_id: null});
        const stateRef = useRef({nodeinfo: true, isMounted: false, satnodeinfo: null});
        // a call to this function updates the state with a random value in useState sense 
        // so a re-render is registered by react.
        const need_rerender = () => {
            if (stateRef.current.isMounted) 
                setState((otherstate) => {
                    return {...otherstate, render_id: uuidv4()};
                });
        };

        const handleTooltipClose = () => {
            //if (stateRef.current.isMounted) {
                console.log("handleTooltipClose() called");
            //setNodeinfo( false );
                stateRef.current.nodeinfo = false;
            //setStateRef( prevState => {return {...prevState, nodeinfo: false}} );
            //setState( prevState => {return {...prevState, ...stateRef.current}}); // force component rerender
                need_rerender();
            //isunmounted = false;
            //}
        };
        const handleTooltipOpen = () => {
            if (stateRef.current.nodeinfo) {
                handleTooltipClose();
            }
            else {
                //setNodeinfo( true );
                stateRef.current.nodeinfo = true;
                //setStateRef( prevState => {return {...prevState, nodeinfo: true}} );
                //setState( prevState => {return {...prevState, ...stateRef.current}}); // force component rerender
                //if (stateRef.current.isMounted) 
                need_rerender();
    
                setTimeout(() => { handleTooltipClose(); }, 2000);
            }
        };

        return (
        <div style={{ background: iconbgColor, border: data.selected ? '3px solid #f77' : '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >

            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
<Tooltip 
                key={"error-tooltip"+uuidv4()} //{'sat-'+a_club.key}
                title={<><ErrorOutlineIcon style={{color:"red", fontSize:"40" }} /><h1 style={{ fontSize: '12pt', color: "lightblue" }}>{errorMesg}</h1></>} placement="top" arrow
>
            <div style={{width:'100%', color: fgColor, alignItems:'center', lineHeight:'80%'}}>
                {node_icon}
            <br/>
            <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}} 
            onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
            {
                //fetchMultiKeyedData(name_datakey, data.leaf.logic.args)
                'Error!'
            }
            </span>
            </div>
</Tooltip>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        );
    });
};

const LEAFEditorCircularNode = (apidef) => { // apidef is a leaf node spec as per _leafstdlib_dataflow_api from ghostos/api/metamodel.js
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: (apidef.lambdaports.output ? true : false) 
        // the neptune/trident chaining ports always open
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#8f23';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#000';
    const iconname = apidef.editorconfig.svgicon.iconname;

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? apidef.editorconfig.svgicon.unicode :
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));

    const name_datakey = apidef.editorconfig.namedatakey;
    

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        //const leafDebugger = useLEAFDebugger({data});
        //const localdatacache = useRef(_.cloneDeep(data));
        const leafNodeMenu = useLEAFNodeMenu({data, touchconfig: {touchelemid: "nodeMenuPort"+data.leaduuid, touchcenterradius: 100}});
        const leafDebugger = useLEAFDebugger({data});
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
        // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
        return (
        <div style={{ background: iconbgColor, border: data.selected ? '3px solid #f77' : '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            <div style={{zIndex: 2}}>
            {
                data.isdebug &&
                leafDebugger
            }
            </div>
            <div id={"nodeMenuPort"+data.leaduuid} style={{zIndex: 1, width:'100%', color: fgColor, alignItems:'center', lineHeight:'80%'}}>
                {
                    data.isdebug &&
                    leafNodeMenu
                }
                {node_icon}
            <br/>
            <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}} 
            onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
            {name_datakey && fetchMultiKeyedData(name_datakey, data.leaf.logic.args)}
            {iconname && iconname}
            </span>
            </div>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        );
    });
};

const LEAFEditorRectangularNode = (apidef) => { // apidef is a leaf node spec as per _leafstdlib_dataflow_api from ghostos/api/metamodel.js
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: (apidef.lambdaports.input ? true : false) 
        // the neptune/trident chaining ports always open
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#8f23';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#000';
    const iconname = apidef.editorconfig.svgicon.iconname;

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? apidef.editorconfig.svgicon.unicode :
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));

    const name_datakey = apidef.editorconfig.namedatakey;
    

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        const leafDebugger = useLEAFDebugger({data});
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
        // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
        return (
        <div style={{ background: iconbgColor, border: data.selected ? '3px solid #f77' : '1px solid #777', padding: 2, borderRadius: '5px', width: '110pt', height: '35pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            {
                data.isdebug &&
                leafDebugger
            }
            <div style={{width:'100%', color: fgColor, alignItems:'center', lineHeight:'80%'}}>
                {node_icon}
            <br/>
            <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}} 
            onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
            {name_datakey && fetchMultiKeyedData(name_datakey, data.leaf.logic.args)}
            {iconname && iconname}
            </span>
            </div>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        );
    });
};

const LEAFEditorElementNode = (apidef) => { // apidef is a leaf node spec as per _leafstdlib_dataflow_api from ghostos/api/metamodel.js
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: true // the neptune/trident chaining port
    };

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? apidef.editorconfig.svgicon.unicode :
                        (apidef.editorconfig.svgicon.url ? <svg width="30"><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" width="30"/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));

    const name_datakey = apidef.editorconfig.namedatakey;

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        const leafDebugger = useLEAFDebugger({data});
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
        // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
        return (
        <div style={{ background: '#8f23', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            {
                data.isdebug &&
                leafDebugger
            }
            <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
                {node_icon}
            <br/>
            <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
            onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
            {fetchMultiKeyedData(name_datakey, data.leaf.logic.args)}
            </span>
            </div>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        );
    });
};

const LEAFEditorCircularNamedNode = (apidef) => {
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: (apidef.lambdaports.output ? true : false),
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#8f23';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#000';

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? <span style={{fontSize:'20pt'}}>{apidef.editorconfig.svgicon.unicode} </span>:
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));
        
    const name_datakey = apidef.editorconfig.namedatakey;
    const is_committable = apidef.editorconfig.is_committable;
    const banduplicatename = 'banduplicatename' in apidef.editorconfig ? apidef.editorconfig.banduplicatename : true; // default to true

    const toTrueVal = (_valstr) => _valstr && _valstr.replace(/(\r\n|\n|\r)/gm, "");
    const toDisplayVal = (_valstr) => _valstr && _valstr.replace(/(\r\n|\n|\r)*\/(\r\n|\n|\r)*/gm, "\n/");
        
    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
        //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
        //    </span>
        const localdatacache = useRef(_.cloneDeep(data));
        const classes = useStyles();
        const leafDebugger = useLEAFDebugger({data: localdatacache.current});

        const cachedNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
        const [isNamed, setIsNamed] = useState(!_.isEmpty(cachedNodeName));
        //let leafNodeMenu = undefined;
        //if (is_committable && isNamed)
        //    leafNodeMenu = useLEAFNodeMenu({data, touchconfig: {touchelemid: "nodeMenuPort"+data.leaduuid, touchcenterradius: 100}});
        const leafNodeMenu = useLEAFNodeMenu({data: localdatacache.current, touchconfig: {touchelemid: "nodeMenuPort"+data.leaduuid, touchcenterradius: 100}});

        //const is_namable = ((is_committable && !isNamed) || (!is_committable));
        const [state, setState] = useState({
            leaduuid: localdatacache.current.leaduuid ? localdatacache.current.leaduuid : null,
            //nameEntered: data.leafnodename ? data.leafnodename : '',
            nameEntered: cachedNodeName ? cachedNodeName :  localdatacache.current.leafnodename,
            //logictoggle: data.logictoggle ? data.logictoggle : false, // false is for equality sign
            //nameDefault: data.leafnodename ? data.leafnodename : '',
            nameDefault: cachedNodeName ? cachedNodeName : '',
            //tchandle: null,
            position: localdatacache.current.leaf.appdata?.position,
        });
        const [hammerInitialized, setHammerInitialized] = useState(false);
        const [renderstate, setRenderState] = useState({render_id: null});
        const [isFocused, setFocus] = useState(false);
        const stateRef = useRef({debuginfo: false, isMounted: false});
        // a call to this function updates the state with a random value in useState sense 
        // so a re-render is registered by react.
        const requestRender = () => {
            if (stateRef.current.isMounted) 
                setRenderState((otherstate) => {
                    return {...otherstate, render_id: uuidv4()};
                });
        };
        const touchDelayRef = useRef();

        //const [mutateNode] = useMutation(MUT_UPDATENODE);
        //const [mutateUpdateNode] = useMutation(MUT_UPDATENODE, {fetchOptionsOverrides: { method: 'POST' }});
    
        // declare useEffect variables for use outside
        
        // for ref share between the in/out of useEffect block.
        //const metaref = useRef();
        
        //setState(prevState => {return {...prevState, equality: data.logictoggle, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        const handleTextChange = async function(event) {
            console.debug("handleTextChange(): "+event);
            try {
                event.preventDefault(); 
                //event.stopPropagation(); 
                //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
                //const copy_text = document.getElementById(data.leaduuid); 
                //let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
                //let leafnodename = data.leafnodename ? data.leafnodename : '';
                let leafnodename = document.getElementById("standard-basic"+localdatacache.current.leaduuid); 
                //isInvalidName() is const findClash = (name) => { return elements.find(e => isNode(e) && (leafnodetype === e.type) && (name === e.data.name) )};
                //edit_text.defaultValue = copy_text.textContent;
                //await navigator.clipboard.readText(); 
                //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
                //useMutation(getLEAFgqlStrUpdateNode(new_node));
        
                if (leafnodename.value) {
                    const cachedNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
                    const cachedTrueName = toTrueVal(cachedNodeName);
                    //const cachedDisplayName = toDisplayVal(cachedNodeName);
                    if (localdatacache.current.isInvalidName && localdatacache.current.isInvalidName(toTrueVal(leafnodename.value))) { // if there is a clash with the new name just given
                        // show a timed popup about the clash
                        // otherwise do nothing here
                        //console.log(data);
                        if (cachedTrueName === toTrueVal(leafnodename.value)) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                //return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                                return {...prevState, nameEntered: cachedTrueName, nameDefault: cachedTrueName} // don't change anything but just rerender
                            });
                        }
                        else { // changed name but duplicate detected
                            leafnodename.value = cachedTrueName;
                        }
                    }
                    else {
                        if (cachedTrueName === toTrueVal(leafnodename.value)) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: cachedTrueName, nameDefault: cachedTrueName} // don't change anything but just rerender
                            });
                        }
                        else {
                            //data.leafnodename = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            //data.leaf.logic.args[name_datakey] = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            delete localdatacache.current.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                            setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, toTrueVal(leafnodename.value)); // mutation necessary to account for the server delay in updating the data
                            mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(localdatacache.current))}});
                            localdatacache.current.isdebug = false;

                            // spark dev note: currently it's unclear whether the graphql updateNode mutation can support partial update,
                            // that is updating only a portion of the data instead of updating the whole lot. 
                            // In the current implementation, it was assumed that "partial update" isn't supported, 
                            // hence the smallest unit update here is to replace the entire node data on each update 
                            // even if it would only involve partial change in a single field. 
                            doSetState();
                        }
                    }
                }
                else { // if entered value is empty
                    //data.leafnodename = state.nameDefault;
                    //data.leaf.logic.args[name_datakey] = state.nameDefault;
                    setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, state.nameDefault);
                    //setState(prevState => {return {...prevState, nameEntered: prevState.nameDefault }}); // restore it to what it used to be prior to text change 
                    doSetState();
                }
        
            }
            catch (err) {}
            finally{return event;}
        };
    
        const handleSingleTap = function(event) {
            //const inputelementid = 'textfield'+event.target.parentElement.parentElement.id.slice(9);
            //const textinputelement = document.getElementById("standard-basic"+data.leaduuid);
            //const testelem = document.getElementById("node-icon"+data.leaduuid);
            //textinputelement.focus();
            console.debug("handleSingleTap(): "+event);
            try {
                setFocus(true);
                event.preventDefault(); 
                //event.stopPropagation(); 
                //classes.root.display = 'auto';
                //const copy_text = state.nameEntered; //document.getElementById('label'+data.leaduuid); 
                //setState({...state, nameEntered: '', nameDefault: copy_text });
                //data.leafnodename = '';
                setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
                //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: data.leafnodename }});
                //leafnodenamecache = data.leafnodename;
                //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
            }
            catch (err) {}
            finally{return event;}
        };
        
        const longpressinms = 1500;
        const onCenterTouch = (e) => {
            // if apidef defines the node is_committable
            if (!is_committable)
                touchDelayRef.current = setTimeout(()=>{handleSingleTap(e)}, longpressinms);
        };
        const onCenterUntouch = (e) => {
            if (!is_committable)
                clearTimeout(touchDelayRef.current);
        };
    
        const doSetState = () => {
            const _cachedNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
            setState((prevState) => {
                let updated_state = {};
                //if (data.leaf.logic.args[name_datakey] !== prevState.nameDefault) {}
                if (_cachedNodeName !== prevState.nameDefault) {
                    // this name discrepancy happens when the name update came from the server or when locally mutated (or edited)
                    // update the local state to reflect the change
                    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
                    updated_state.nameEntered = _cachedNodeName; //data.leaf.logic.args[name_datakey];
                    updated_state.nameDefault = _cachedNodeName; //data.leaf.logic.args[name_datakey];
                    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
                }
                if (localdatacache.current.leaf.appdata.position !== prevState.position) {
                    updated_state.position = localdatacache.current.leaf.appdata.position;
                }
                if (Object.keys(updated_state).length > 0) {
                    //return {...prevState, ...updated_state, hammerlist: hammerlist, node_data: {leaf: {...data.leaf}}}; // update local state based on update from the server
                    return {...prevState, ...updated_state, node_data: {leaf: {...localdatacache.current.leaf}}}; // update local state based on update from the server
                }
                else {
                    return {...prevState, node_data: {leaf: {...localdatacache.current.leaf}}};
                }
            });
        };

        // to support react component lifecycle such as componentDidMount()
        useEffect(() => {
            const _nodeNameInTheLake = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
            const _nodeNameInCache = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
            localdatacache.current = _.cloneDeep(data);

            // handle the boundary condition of when the node is first dropped into the editor, subsequently have the name mutated
            // which would casue two subsequent mutations in the server resulting in two sync requests, making the entered name disappear in between the two syncs
            if (_nodeNameInCache.trim().length > 0 && _nodeNameInTheLake.trim().length == 0)
            {
                setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, _nodeNameInCache); // preserve the node name in between two syncs
            }
                
            doSetState();
            if (is_committable)
                setIsNamed(!_.isEmpty(fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args)));
            
            //if (!state.is_hammer_init) {}
            //if (!hammerInitialized) {
            //    //const ui_element_toggletext = document.getElementById('toggle'+data.leaduuid);
            //    const ui_element_nodeicon = document.getElementById('node-icon'+data.leaduuid);
            //    //const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
            //    let mc_icon = undefined;
            //    if (ui_element_nodeicon)
            //    {
            //        mc_icon = new Hammer.Manager(ui_element_nodeicon);
            
            //            // add tap recognizers
            //        //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
            //        let singleTap = new Hammer.Tap({event: 'singletap' });
            //        let longPress = new Hammer.Press({event: 'longpress', time:500});
            //        //let swipe = new Hammer.Swipe({event: 'swipe'});
            
            //        //mc_toggletext.add([longPress]);
            //        //mc_icon.add([singleTap]);
            //        mc_icon.add([longPress]);
            //        // recognizer rules
            //        //mc.get('doubletap').recognizeWith('singletap');
            //        //mc.get('singletap').requireFailure('doubletap');
            //        //doubleTap.recognizeWith([singleTap]);
            
            //        //singleTap.requireFailure([longPress]);
            //        //mc_icon.get('longpress').recognizeWith('singletap');
            //        //mc_icon.get('singletap').requireFailure('longpress');
            //        //singleTap.recognizeWith(longPress);
            //        //singleTap.requireFailure(longPress);
            
            //        //mc_icon.on('singletap', e => {(() => {handleSingleTap(e);})()});
            //        //mc_toggletext.on('longpress', e => {(() => {handleLogicToggle(e);})()});
            //        //mc_icon.on('singletap', e => {handleSingleTap(e);});
            //        mc_icon.on('longpress', e => {handleSingleTap(e);});

            //        //mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
            //        //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
            //        setHammerInitialized(prevVal => true);
            //    }
            //}
            //setState(prevState => {return {...prevState, leaduuid: data.leaduuid, is_hammer_init: true, tchandle: handleTextChange }});
            // the solution next line as per https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
            // eslint-disable-next-line react-hooks/exhaustive-deps
        
            ///*
            //let server_updated_state = {};
            //if (data.leafnodename !== state.nameDefault) { //|| (JSON.stringify(data.position) !== JSON.stringify(state.position)) {}
            //    // this name discrepancy happens when the name update came from the server
            //    // update the local state to reflect the change
            //    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
            //    server_updated_state.nameEntered = data.leafnodename;
            //    server_updated_state.nameDefault = data.leafnodename;
            //    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
            //}
            //if (data.logictoggle !== state.equality) {
        
            //    //server_updated_state.equality = data.logictoggle;
            //    //setState(prevState => {return {...prevState, equality: data.logictoggle }}); // flip-flop of the equality flag
            //}
            //if (Object.keys(server_updated_state).length > 0) {
            //    //setState(prevState => {return {...prevState, ...server_updated_state }}); 
            //    setState(prevState => {return {...prevState, ...server_updated_state }}); 
            //}
            //*/
            //setState((prevState) => {
            //    let server_updated_state = {};
            //    const curNodeName = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
            //    if (curNodeName !== prevState.nameDefault) { 
            //    // this name discrepancy happens when the name update came from the server
            //    // update the local state to reflect the change
            //    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
            //    server_updated_state.nameEntered = curNodeName;
            //    server_updated_state.nameDefault = curNodeName;
            //    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
            //    }
            //    //if (data.logictoggle !== prevState.logictoggle) {
        
            //    //  server_updated_state.logictoggle = data.logictoggle;
            //    //}
            //    if (data.position !== prevState.position) {
            //    server_updated_state.position = data.position;
            //    }
            //    if (Object.keys(server_updated_state).length > 0) {
            //    return {...prevState, ...server_updated_state };
            //    }
            //    else {
            //    return prevState;
            //    }
            //});
            stateRef.current.isMounted = true;
    
            return function cleanup() {
                stateRef.current.isMounted = false;
                //mc_icon?.destroy();
                //setHammerInitialized(prevVal => false);
            };
        }, [data]);
    
//                <div id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help', color: fgColor}} onMouseDown={onCenterTouch} onMouseUp={onCenterUntouch} onMouseOut={onCenterUntouch} onMouseMove={onCenterUntouch} >
        // class="nodrag" for using custom mousedown event handler as per discussion in
        // https://github.com/xyflow/xyflow/issues/2401
        // https://codesandbox.io/p/sandbox/polished-morning-l67y43?file=%2Fsrc%2FCustomNode.tsx%3A20%2C15-20%2C33
        const namableNode = () => {
            return (
            <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%', color: fgColor}} >
                <div className="nodrag" id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help', color: fgColor}} onMouseDown={onCenterTouch} onMouseUp={onCenterUntouch} onMouseOut={onCenterUntouch} onMouseMove={onCenterUntouch} >
                    {node_icon}
                </div>
                <span id={"label"+data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}} >
                {toDisplayVal(state.nameEntered)}
                </span>
                {(!state.nameEntered) && (
                <form onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
                <TextField 
                InputLabelProps={{shrink: isFocused}}
                autoFocus={isFocused}
                onBlur={(e)=>{setFocus(false); handleTextChange(e)}} defaultValue={toTrueVal(state.nameDefault)} InputProps={{ className: classes.root }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "4pt", textAlign: "center"}} label="name?" 
                />
                </form>)}
            </div>
            )
        };
        const namedNode = () => {
            return (
            <div id={"nodeMenuPort"+data.leaduuid} style={{zIndex: 1, width:'100%', color: fgColor, alignItems:'center', lineHeight:'80%'}}>
                {
                    data.isdebug &&
                    leafNodeMenu
                }
                {node_icon}
                <br/>
                <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}}
                onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
                {name_datakey && fetchMultiKeyedData(name_datakey, data.leaf.logic.args)}
                </span>
            </div>
            )
        };

        return (
        <React.Fragment>
        <div style={{ background: iconbgColor, border: data.selected ? '3px solid #f77' : '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            {
                data.isdebug &&
                leafDebugger
            }
            {(((is_committable && !isNamed) || (!is_committable)) ?
                namableNode() : namedNode()
            )}
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        </React.Fragment>
        );
    });
};

const LEAFEditorRectangularNamedNode = (apidef) => {
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: true // the neptune/trident chaining port
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#8f23';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#000';

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? <span style={{fontSize:'20pt'}}>{apidef.editorconfig.svgicon.unicode} </span>:
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));
        
    const name_datakey = apidef.editorconfig.namedatakey;
    const banduplicatename = 'banduplicatename' in apidef.editorconfig ? apidef.editorconfig.banduplicatename : true; // default to true

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
        //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
        //    </span>
        const localdatacache = useRef(_.cloneDeep(data));
        const [isFocused, setFocus] = useState(false);
        const classes = useStyles();
        const leafDebugger = useLEAFDebugger({data: localdatacache.current});
        
        const curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
        const [renderstate, setRenderState] = useState(uuidv4());
        const requestRender = () => {
            setRenderState(uuidv4());
        };
        const [state, setState] = useState({
            leaduuid: localdatacache.current.leaduuid ? localdatacache.current.leaduuid : null,
            //nameEntered: data.leafnodename ? data.leafnodename : '',
            nameEntered: curNodeName ? curNodeName :  localdatacache.current.leafnodename,
            //logictoggle: data.logictoggle ? data.logictoggle : false, // false is for equality sign
            //nameDefault: data.leafnodename ? data.leafnodename : '',
            nameDefault: curNodeName ? curNodeName : '',
            //tchandle: null,
            position: localdatacache.current.leaf.appdata?.position,
        });
        const [hammerInitialized, setHammerInitialized] = useState(false);
        //const node_icon_width = (data.spellname.length > 14) ? '135px' : '110px';
        const node_icon_width = (fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args).length > 14) ? '135px' : '110px';
        const touchDelayRef = useRef();
        //const [mutateNode] = useMutation(MUT_UPDATENODE);
        //const [mutateUpdateNode] = useMutation(MUT_UPDATENODE, {fetchOptionsOverrides: { method: 'POST' }});
    
        // declare useEffect variables for use outside
        
        // for ref share between the in/out of useEffect block.
        //const metaref = useRef();
        
        //setState(prevState => {return {...prevState, equality: data.logictoggle, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        const handleTextChange = async function(event) {
            console.debug("handleTextChange(): "+event);
            try {
                event.preventDefault(); 
                //event.stopPropagation(); 
                //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
                //const copy_text = document.getElementById(data.leaduuid); 
                //let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
                //let leafnodename = data.leafnodename ? data.leafnodename : '';
                let leafnodename = document.getElementById("standard-basic"+data.leaduuid); 
                //isInvalidName() is const findClash = (name) => { return elements.find(e => isNode(e) && (leafnodetype === e.type) && (name === e.data.name) )};
                //edit_text.defaultValue = copy_text.textContent;
                //await navigator.clipboard.readText(); 
                //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
                //useMutation(getLEAFgqlStrUpdateNode(new_node));
        
        
                if (leafnodename.value) {
                    const curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
                    if (localdatacache.current.isInvalidName && localdatacache.current.isInvalidName(leafnodename.value)) { // if there is a clash with the new name just given
                        // show a timed popup about the clash
                        // otherwise do nothing here
                        //console.log(data);
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                        }
                        else { // changed name but duplicate detected
                            leafnodename.value = curNodeName;
                        }
                    }
                    else {
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                        }
                        else {
                            //data.leafnodename = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            //data.leaf.logic.args[name_datakey] = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            delete localdatacache.current.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                            setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, leafnodename.value); // mutation necessary to account for the server delay in updating the data
                            mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(localdatacache.current))}});

                            localdatacache.current.isdebug = false;
                            doSetState();

                            //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
                        }
                    }
                }
                else { // if entered value is empty
                    //data.leafnodename = state.nameDefault;
                    //data.leaf.logic.args[name_datakey] = state.nameDefault;
                    setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, state.nameDefault);
                    //setState(prevState => {return {...prevState, nameEntered: prevState.nameDefault }}); // restore it to what it used to be prior to text change 
                    doSetState();
                }
        
            }
            catch (err) {}
            finally{return event;}
        };
    
        const handleSingleTap = function(event) {
            console.debug("handleSingleTap(): "+event);
            try {
                setFocus(true);
                event.preventDefault(); 
                //event.stopPropagation(); 
                //classes.root.display = 'auto';
                //const copy_text = state.nameEntered; //document.getElementById('label'+data.leaduuid); 
                //setState({...state, nameEntered: '', nameDefault: copy_text });
                //data.leafnodename = '';
                setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
                //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: data.leafnodename }});
                //leafnodenamecache = data.leafnodename;
                //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
            }
            catch (err) {}
            finally{return event;}
        };

        const longpressinms = 1500;
        const onCenterTouch = (e) => {
            touchDelayRef.current = setTimeout(()=>{handleSingleTap(e)}, longpressinms);
        };
        const onCenterUntouch = (e) => {
            clearTimeout(touchDelayRef.current);
        };
    
        const doSetState = () => {
            const _curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
            setState((prevState) => {
                let updated_state = {};
                //if (data.leaf.logic.args[name_datakey] !== prevState.nameDefault) {}
                if (_curNodeName !== prevState.nameDefault) {
                    // this name discrepancy happens when the name update came from the server or when locally mutated (or edited)
                    // update the local state to reflect the change
                    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
                    updated_state.nameEntered = _curNodeName; //data.leaf.logic.args[name_datakey];
                    updated_state.nameDefault = _curNodeName; //data.leaf.logic.args[name_datakey];
                    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
                }
                if (localdatacache.current.leaf.appdata.position !== prevState.position) {
                    updated_state.position = localdatacache.current.leaf.appdata.position;
                }
                if (Object.keys(updated_state).length > 0) {
                    //return {...prevState, ...updated_state, hammerlist: hammerlist, node_data: {leaf: {...data.leaf}}}; // update local state based on update from the server
                    return {...prevState, ...updated_state, node_data: {leaf: {...localdatacache.current.leaf}}}; // update local state based on update from the server
                }
                else {
                    return {...prevState, node_data: {leaf: {...localdatacache.current.leaf}}};
                }
            });
        };
    
        // to support react component lifecycle such as componentDidMount()
        useEffect(() => {
            
            localdatacache.current = _.cloneDeep(data);
            doSetState();

            //return function cleanup() {
            //    //stateRef.current.isMounted = false;
            //    //setHammerInitialized(prevVal => false);
            //};
    
        }, [data]);
    
        return (
        <React.Fragment>
        <div style={{ background: iconbgColor, border: data.selected ? '3px solid #f77' : '1px solid #777', padding: 2, borderRadius: '5px', width: node_icon_width, height: '35pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            {
                data.isdebug &&
                leafDebugger
            }
            <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%', color: fgColor}} >
              <div className="nodrag" id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help', color: fgColor}} onMouseDown={onCenterTouch} onMouseUp={onCenterUntouch} onMouseOut={onCenterUntouch} onMouseMove={onCenterUntouch} >
                {node_icon} 
              </div>
              <span id={"label"+data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}} >
              {state.nameEntered}
              </span>
              {(!state.nameEntered) && (
              <form onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
              <TextField 
              autoFocus={isFocused}
              onBlur={(e)=>{setFocus(false); handleTextChange(e);}} defaultValue={state.nameDefault} InputProps={{ className: classes.root }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "4pt", textAlign: "center"}} label="name?" />
              </form>)}
            </div>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        </React.Fragment>
        );
    });
};

const LEAFEditorCircularNamedBooleanNode = (apidef) => {
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: (apidef.lambdaports.output ? true : false), 
        // the neptune/trident chaining ports always open
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor0 = apidef.editorconfig.svgicon.bgColor0 ? apidef.editorconfig.svgicon.bgColor0 : '#288';
    const iconbgColor1 = apidef.editorconfig.svgicon.bgColor1 ? apidef.editorconfig.svgicon.bgColor1 : '#882';
    const toggleSymbol0 = apidef.editorconfig.svgicon.bgColor0 ? apidef.editorconfig.svgicon.toggleSymbol0 : '\u2260'; // equality symbol as a default
    const toggleSymbol1 = apidef.editorconfig.svgicon.bgColor1 ? apidef.editorconfig.svgicon.toggleSymbol1 : '\u229c'; // inequality symbol as a default

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? apidef.editorconfig.svgicon.unicode :
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));
        
    const name_datakey = apidef.editorconfig.namedatakey;
    const toggle_datakey = apidef.editorconfig.toggledatakey;

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        const localdatacache = useRef(_.cloneDeep(data));
        const [isFocused, setFocus] = useState(false);
        //const showJoker = useRef(false);
        //localdatacache.current.isdebug = showJoker.current;
        const leafDebugger = useLEAFDebugger({data: localdatacache.current});
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
        //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
        //    </span>

        const classes = useStyles();
        const curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
        const curToggleVal = (_defaultval=false) => {
            const fetcheddata = fetchMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args);
            return (fetcheddata !== undefined) ? fetcheddata : _defaultval;
        };

        if (data.leaduuid.slice(0, 4) === "9f5d")
            console.log("start debugging");
    
        const defaultstate = {
            leaduuid: localdatacache.current.leaduuid ? localdatacache.current.leaduuid : null,
            //nameEntered: data.leafnodename ? data.leafnodename : '',
            nameEntered: curNodeName ? curNodeName : '',
            //logictoggle: toggle_datakey in data.leaf.logic.args ? data.logictoggle : false, // false is for equality sign
            logictoggle: curToggleVal(), // false is for equality sign
            //nameDefault: data.leafnodename ? data.leafnodename : '',
            nameDefault: curNodeName ? curNodeName : '',
            //tchandle: null,
            position: localdatacache.current.leaf.appdata?.position,
            //hammerlist: [],
            node_data: {leaf: {...localdatacache.current.leaf}},
        };
        const [state, setState] = useState(defaultstate);
        const [hammerInitialized, setHammerInitialized] = useState(false);
        const touchDelayRef = useRef();
        //const [mutateNode] = useMutation(MUT_UPDATENODE);
        //const [mutateUpdateNode] = useMutation(MUT_UPDATENODE, {fetchOptionsOverrides: { method: 'POST' }});
    
        // declare useEffect variables for use outside
        
        // for ref share between the in/out of useEffect block.
        //const metaref = useRef();
        
        //setState(prevState => {return {...prevState, equality: data.logictoggle, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        const handleTextChange = async function(event) {
            console.debug("handleTextChange(): "+event);
            try {
                event.preventDefault(); 
                let leafnodename = document.getElementById("standard-basic"+localdatacache.current.leaduuid); 
        
                if (leafnodename.value) {
                    const curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
                    if (localdatacache.current.isInvalidName && localdatacache.current.isInvalidName(leafnodename.value)) { // if there is a clash with the new name just given
                        // show a timed popup about the clash
                        // otherwise do nothing here
                        //console.log(data);
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                            //doSetState();
                        }
                        else { // changed name but duplicate detected
                            leafnodename.value = curNodeName;
                        }
                    }
                    else {
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                            //doSetState();
                        }
                        else {
                            // spark_dev_note: currently there is a super annoying bug in leafeditor toggle and/or text change in this node type.
                            // i suspect that the bug happens when subscription to the server cuts off
                            // leafedtior starts showing temperamental behavior when repeatedly changing the node's text and toggle boolean, and at times does not reflect 
                            // changes made on screen while changes were already reflected on the leaflake, and suddenly it stops working all together. 
                            // will have to come back to this bug later as there are other more important dev to be tended for the time being. (13 Mar 2022)
                            //data.leaf.logic.args[name_datakey] = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            delete localdatacache.current.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                            //setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, leafnodename.value); // mutation necessary to account for the server delay in updating the data
                            setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, leafnodename.value); // mutation necessary to account for the server delay in updating the data
                            mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(localdatacache.current))}});
                            localdatacache.current.isdebug = false;
                            doSetState();
                            //data.leaf.logic.args[toggle_datakey] = state.node_data.leaf.logic.args[toggle_datakey]; // mutation necessary to account for the server delay in updating the data, or unanticipated server subscription cut off
                            //setMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args, fetchMultiKeyedData(toggle_datakey, state.node_data.leaf.logic.args));

                            //setState(prevState => {
                            //    if (leafnodename.value !== prevState.nameDefault) {
                            //        //const node_data = {
                            //        //    ...localdatacache
                            //        //};
                            //        //delete node_data.leaduuid; 
                            //        //setMultiKeyedData(name_datakey, node_data.leaf.logic.args, leafnodename.value); 
                            //        //mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                            //        delete localdatacache.current.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                            //        //setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, leafnodename.value); // mutation necessary to account for the server delay in updating the data
                            //        mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(localdatacache.current))}});
                            //        localdatacache.current.isdebug = false;
                            //    }
                            //    return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value }
                            //    //return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value, logictoggle: curToggleVal(prevState.logictoggle) }
                            //    //return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value, logictoggle: curToggleVal ? curToggleVal : prevState.logictoggle }
                            //});
                            //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
                        }
                    }
                }
                else { // if entered value is empty
                    //data.leafnodename = state.nameDefault;
                    //data.leaf.logic.args[name_datakey] = state.nameDefault;
                    setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, state.nameDefault);
                    //setState(prevState => {return {...prevState, nameEntered: prevState.nameDefault }}); // restore it to what it used to be prior to text change 
                    doSetState();
                }
        
            }
            catch (err) {}
            finally{return event;}
        };   
        const handleTextChange2 = async function(event) {
            console.debug("handleTextChange(): "+event);
            try {
                event.preventDefault(); 
                //event.stopPropagation(); 
                //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
                //const copy_text = document.getElementById(data.leaduuid); 
                //let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
                //let leafnodename = data.leafnodename ? data.leafnodename : '';
                let leafnodename = document.getElementById("standard-basic"+data.leaduuid); 
                //edit_text.defaultValue = copy_text.textContent;
                //await navigator.clipboard.readText(); 
                //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
                //useMutation(getLEAFgqlStrUpdateNode(new_node));
        
        
                if (leafnodename.value) {
                //data.leafnodename = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                // spark_dev_note: currently there is a super annoying bug in leafeditor toggle and/or text change in this node type.
                // i suspect that the bug happens when subscription to the server cuts off
                // leafedtior starts showing temperamental behavior when repeatedly changing the node's text and toggle boolean, and at times does not reflect 
                // changes made on screen while changes were already reflected on the leaflake, and suddenly it stops working all together. 
                // will have to come back to this bug later as there are other more important dev to be tended for the time being. (13 Mar 2022)
                //data.leaf.logic.args[name_datakey] = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, leafnodename.value);
                //data.leaf.logic.args[toggle_datakey] = state.node_data.leaf.logic.args[toggle_datakey]; // mutation necessary to account for the server delay in updating the data, or unanticipated server subscription cut off
                setMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args, fetchMultiKeyedData(toggle_datakey, state.node_data.leaf.logic.args));
                setState(prevState => {
                    if (leafnodename.value !== state.nameDefault) {
                    //const node_data = { leafeditor: {
                        //leaduuid: `${data.leaduuid}`,
                    //    ...data,
                        //type: "leafdatafilternode",
    //                    leafnodename: leafnodename.value, //edit_text.value,
                        //position: state.position,
                        //nodeid: node_uuid,
                    //}};
                    const node_data = {
                        leaf: {...localdatacache.current.leaf}
                        //...prevState.node_data
                    };
                    //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                    //node_data.leaf.logic.args[name_datakey] = leafnodename.value;
                    //node_data.leaf.appdata.position = prevState.position; // in case the node_data position hasn't updated
                    //let json_data = JSON.stringify(node_data).getBytes("UTF-8");
                    //let enc_data = sjcl.codec.base64.fromBits(json_data);
                    //let dec_data = sjcl.codec.base64.toBits(enc_data);
                    //let enc_data = Base64.stringify(json_data);
        
                    // spark dev note: currently it's unclear whether the graphql updateNode mutation can support partial update,
                    // that is updating only a portion of the data instead of updating the whole lot. 
                    // In the current implementation, it was assumed that "partial update" isn't supported, 
                    // hence the smallest unit update here is to replace the entire node data on each update 
                    // even if it would only involve partial change in a single field. 
                    //mutateUpdateNode({variables: {uuid: data.leaduuid, label: data.label?data.label:'', data: btoa(JSON.stringify(node_data))}});
                    mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                    }
                    return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value, logictoggle: curToggleVal(prevState.logictoggle) }
                });
                //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
                }
                else { // if entered value is empty
                //data.leafnodename = state.nameDefault;
                //data.leaf.logic.args[name_datakey] = state.nameDefault;
                setMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args, state.nameDefault);
                setState(prevState => {return {...prevState, nameEntered: prevState.nameDefault }}); // restore it to what it used to be prior to text change 
                }
        
            }
            catch (err) {}
            finally{return event;}
        };

        const handleSingleTap = function(event) {
            console.debug("handleSingleTap(): "+event);
            try {
            setFocus(true);
            event.preventDefault(); 
            //event.stopPropagation(); 
            //classes.root.display = 'auto';
            //const copy_text = state.nameEntered; //document.getElementById('label'+data.leaduuid); 
            //setState({...state, nameEntered: '', nameDefault: copy_text });
            //data.leafnodename = '';
            setState(prevState => {
                return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }
            });
            //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: data.leafnodename }});
            //leafnodenamecache = data.leafnodename;
            //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
            }
            catch (err) {}
            finally{return event;}
        };

        const handleLogicToggle = async function(event) {
            console.debug("handleLogicToggle(): "+fetchMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args));
            //console.debug("handleLogicToggle(): "+JSON.stringify(state.logictoggle));
            try {
                //classes.root.display = 'auto';
                //let copy_text = document.getElementById(data.leaduuid); 
                //setState({...state, equality: !state.equality }); // flip-flop of the equality flag
                //edit_text.defaultValue = copy_text.textContent;
                //await navigator.clipboard.readText(); 
                //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
                //useMutation(getLEAFgqlStrUpdateNode(new_node));
        
                //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, equality: node_data.leafeditor.logictoggle }}); // flip-flop of the equality flag
                delete localdatacache.current.leaduuid;
                //localdatacache.current.leaf.appdata.position = prevState.position; // in case the node_data hasn't updated 
                //const newtoggleval = !fetchMultiKeyedData(toggle_datakey, prevState.node_data.leaf.logic.args);
                const newtoggleval = !fetchMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args);

                setMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args, newtoggleval); // save the reverse boolean of the current equality toggle value
                mutateUpdateNode({ variables: { uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(localdatacache.current)) } });
                localdatacache.current.isdebug = false; // to make the joker handle disappear while the mutation gets synced up in the leaf lake.
                doSetState();
                //setState(prevState => {
                //    
                //    //const node_data = {
                //    //    ...data
                //    //    //...prevState.node_data,
                //    //};
                //    //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                //    delete localdatacache.current.leaduuid;

                //    //node_data.leaf.logic.args[toggle_datakey] = !prevState.logictoggle; // save the reverse boolean of the current equality toggle value
                //    //node_data.leaf.logic.args[toggle_datakey] = !prevState.node_data.leaf.logic.args[toggle_datakey]; // save the reverse boolean of the current equality toggle value
                //    //setMultiKeyedData(toggle_datakey, node_data.leaf.logic.args, !fetchMultiKeyedData(toggle_datakey, prevState.node_data.leaf.logic.args)); // save the reverse boolean of the current equality toggle value
                //    //localdatacache.current.leaf.logic.args = cloneDeep(prevState.node_data.leaf.logic.args);
                //    localdatacache.current.leaf.appdata.position = prevState.position; // in case the node_data hasn't updated 
                //    //const newtoggleval = !fetchMultiKeyedData(toggle_datakey, prevState.node_data.leaf.logic.args);
                //    const newtoggleval = !fetchMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args);

                //    setMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args, newtoggleval); // save the reverse boolean of the current equality toggle value

                //    //console.log('data.position: ', JSON.stringify(data.leaf.appdata.position));
                //    //console.log('prevState.position: ', JSON.stringify(prevState.position));
                //    //let json_data = JSON.stringify(node_data).getBytes("UTF-8");
                //    //let enc_data = sjcl.codec.base64.fromBits(json_data);
                //    //let dec_data = sjcl.codec.base64.toBits(enc_data);
                //    //let enc_data = Base64.stringify(json_data);
                //    // spark dev note: currently it's unclear whether the graphql updateNode mutation can support partial update,
                //    // that is updating only a portion of the data instead of updating the whole lot. 
                //    // In the current implementation, it was assumed that "partial update" isn't supported, 
                //    // hence the smallest unit update here is to replace the entire node data on each update 
                //    // even if it would only involve partial change in a single field. 
                //    //data.leaf.logic.args[toggle_datakey] = node_data.leaf.logic.args[toggle_datakey];
                //    //setMultiKeyedData(toggle_datakey, data.leaf.logic.args, fetchMultiKeyedData(toggle_datakey, node_data.leaf.logic.args));
                //    //setMultiKeyedData(toggle_datakey, localdatacache.current.leaf.logic.args, newtoggleval);
                //    mutateUpdateNode({ variables: { uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(localdatacache.current)) } });
                //    localdatacache.current.isdebug = false; // to make the joker handle disappear while the mutation gets synced up in the leaf lake.
                //    //return { ...prevState, node_data: {leaf: {...data.leaf}} };
                //    //return {...prevState, logictoggle: curToggleVal(prevState.logictoggle) }
                //    //const _curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
                //    const _curNodeName = localdatacache.current.leaf.logic.args.keyname;
                //    return {...prevState, logictoggle: newtoggleval, nameEntered: _curNodeName, nameDefault: _curNodeName };
                //}); // flip-flop of the equality flag
                //data.logictoggle = !data.logictoggle;
                //setState(prevState => {return {...prevState, equality: data.logictoggle }}); // flip-flop of the equality flag
                //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
                event.preventDefault(); 
            }
            catch (err) {}
            finally{return event;}
        };

        const longpressinms = 1500;
        const onToggleTouch = (e) => {
            // throttle
            touchDelayRef.current = setTimeout(()=>{throttle(handleLogicToggle, 1000)(e)}, longpressinms);
        };
        const onToggleUntouch = (e) => {
            clearTimeout(touchDelayRef.current);
        };

        const onCenterTouch = (e) => {
            touchDelayRef.current = setTimeout(()=>{handleSingleTap(e)}, longpressinms);
        };
        const onCenterUntouch = (e) => {
            clearTimeout(touchDelayRef.current);
        };
    
        const doSetState = () => {
            const _curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
            const _curToggleVal = curToggleVal();
            setState((prevState) => {
                let updated_state = {};
                //if (data.leaf.logic.args[name_datakey] !== prevState.nameDefault) {}
                if (_curNodeName !== prevState.nameDefault) { 
                    // this name discrepancy happens when the name update came from the server
                    // update the local state to reflect the change
                    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
                    updated_state.nameEntered = _curNodeName; //data.leaf.logic.args[name_datakey];
                    updated_state.nameDefault = _curNodeName; //data.leaf.logic.args[name_datakey];
                    //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
                }
                if (_curToggleVal !== prevState.logictoggle) {
        
                    updated_state.logictoggle = _curToggleVal; //data.leaf.logic.args[toggle_datakey];
                }
                if (localdatacache.current.leaf.appdata.position !== prevState.position) {
                    updated_state.position = localdatacache.current.leaf.appdata.position;
                }
                if (Object.keys(updated_state).length > 0) {
                    //return {...prevState, ...updated_state, hammerlist: hammerlist, node_data: {leaf: {...data.leaf}}}; // update local state based on update from the server
                    return {...prevState, ...updated_state, node_data: {leaf: {...localdatacache.current.leaf}}}; // update local state based on update from the server
                }
                else {
                    return {...prevState, node_data: {leaf: {...localdatacache.current.leaf}}};
                }
            });
        };

    
        useEffect(() => {
            localdatacache.current = _.cloneDeep(data);
            doSetState();
        },
        [data]);
        // to support react component lifecycle such as componentDidMount()
        //useEffect(() => {
        //    
        //    //if (!state.is_hammer_init) {}
        //    //const hammerlist = state.hammerlist; 
        //    //if (!hammerInitialized) {
        //    //    const ui_element_toggletext = document.getElementById('toggle'+data.leaduuid);
        //    //    const ui_element_nodeicon = document.getElementById('node-icon'+data.leaduuid);
        //    //    const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
        //    //    const mc_icon = new Hammer.Manager(ui_element_nodeicon);
        
        //    //        // add tap recognizers
        //    //    //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
        //    //    let singleTap = new Hammer.Tap({event: 'singletap' });
        //    //    let longPress = new Hammer.Press({event: 'longpress', time:500});
        //    //    //let swipe = new Hammer.Swipe({event: 'swipe'});
        
        //    //    mc_toggletext.add([longPress]);
        //    //    mc_icon.add([singleTap]);
        //    //    // recognizer rules
        //    //    //mc.get('doubletap').recognizeWith('singletap');
        //    //    //mc.get('singletap').requireFailure('doubletap');
        //    //    //doubleTap.recognizeWith([singleTap]);
        
        //    //    //singleTap.requireFailure([longPress]);
        //    //    //mc_icon.get('longpress').recognizeWith('singletap');
        //    //    //mc_icon.get('singletap').requireFailure('longpress');
        //    //    //singleTap.recognizeWith(longPress);
        //    //    //singleTap.requireFailure(longPress);
        
        //    //    //mc_icon.on('singletap', e => {(() => {handleSingleTap(e);})()});
        //    //    //mc_toggletext.on('longpress', e => {(() => {handleLogicToggle(e);})()});
        //    //    mc_icon.on('singletap', e => {handleSingleTap(e);});
        //    //    mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
        //    //    //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
        //    //    hammerlist.push(mc_icon, mc_toggletext);
        //    //    setHammerInitialized(prevVal => true);
        //    //}
        //    //setState(prevState => {return {...prevState, leaduuid: data.leaduuid, is_hammer_init: true, tchandle: handleTextChange }});
        //    // the solution next line as per https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
        //    // eslint-disable-next-line react-hooks/exhaustive-deps
        
        //    /*
        //    let server_updated_state = {};
        //    if (data.leafnodename !== state.nameDefault) { //|| (JSON.stringify(data.position) !== JSON.stringify(state.position)) {}
        //        // this name discrepancy happens when the name update came from the server
        //        // update the local state to reflect the change
        //        //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
        //        server_updated_state.nameEntered = data.leafnodename;
        //        server_updated_state.nameDefault = data.leafnodename;
        //        //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        //    }
        //    if (data.logictoggle !== state.equality) {
        
        //        //server_updated_state.equality = data.logictoggle;
        //        //setState(prevState => {return {...prevState, equality: data.logictoggle }}); // flip-flop of the equality flag
        //    }
        //    if (Object.keys(server_updated_state).length > 0) {
        //        //setState(prevState => {return {...prevState, ...server_updated_state }}); 
        //        setState(prevState => {return {...prevState, ...server_updated_state }}); 
        //    }
        //    */
        //    const _curNodeName = fetchMultiKeyedData(name_datakey, localdatacache.current.leaf.logic.args);
        //    const _curToggleVal = curToggleVal();
        //    setState((prevState) => {
        //        let server_updated_state = {};
        //        //if (data.leaf.logic.args[name_datakey] !== prevState.nameDefault) {}
        //        if (_curNodeName !== prevState.nameDefault) { 
        //            // this name discrepancy happens when the name update came from the server
        //            // update the local state to reflect the change
        //            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
        //            server_updated_state.nameEntered = _curNodeName; //data.leaf.logic.args[name_datakey];
        //            server_updated_state.nameDefault = _curNodeName; //data.leaf.logic.args[name_datakey];
        //            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        //        }
        //        if (_curToggleVal !== prevState.logictoggle) {
        
        //            server_updated_state.logictoggle = _curToggleVal; //data.leaf.logic.args[toggle_datakey];
        //        }
        //        if (localdatacache.current.leaf.appdata.position !== prevState.position) {
        //            server_updated_state.position = localdatacache.current.leaf.appdata.position;
        //        }
        //        if (Object.keys(server_updated_state).length > 0) {
        //            //return {...prevState, ...server_updated_state, hammerlist: hammerlist, node_data: {leaf: {...data.leaf}}}; // update local state based on update from the server
        //            return {...prevState, ...server_updated_state, node_data: {leaf: {...localdatacache.current.leaf}}}; // update local state based on update from the server
        //        }
        //        else {
        //            return {...prevState, node_data: {leaf: {...localdatacache.current.leaf}}};
        //        }
        //    });

        //    //return function cleanup() {
        //    //    //stateRef.current.isMounted = false;
        //    //    setHammerInitialized(prevVal => false);
        //    //};
    
        //}, [localdatacache.current]);
    
        return (
        <React.Fragment>
        <div style={{ background: state.logictoggle ? iconbgColor1 : iconbgColor0, border: data.selected ? '3px solid #f77' : '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            {
                data.isdebug &&
                leafDebugger
            }
            <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%'}} >
            <span className="nodrag" data-testid={"toggletest"} id={"toggle"+data.leaduuid} style={{pointerEvents: '', cursor: 'pointer'}} onMouseDown={onToggleTouch} onMouseUp={onToggleUntouch} onMouseOut={onToggleUntouch} onMouseMove={onToggleUntouch} >
                {state.logictoggle ? toggleSymbol1 : toggleSymbol0}
                <br/>
            </span>
            <div className="nodrag" id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help'}} onMouseDown={onCenterTouch} onMouseUp={onCenterUntouch} onMouseOut={onCenterUntouch} onMouseMove={onCenterUntouch} >
                {node_icon}
            </div>
            <span id={"label"+data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
            {state.nameEntered}
            </span>
            {(!state.nameEntered) && (
            <form className={classes.root} onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
            <TextField 
            autoFocus={isFocused}
            onBlur={(e) => {setFocus(false); handleTextChange(e);}} defaultValue={state.nameDefault} InputProps={{ classes }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "6pt", textAlign: "center"}}  label="name?" />
            </form>)}
            </div>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        </React.Fragment>
        );
    });
};

const LEAFEditorTinyNode = (apidef) => {
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: (apidef.lambdaports.output ? true : false), 
        // two neptune/trident chaining ports are always open
    };
  
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#66f';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#fff';
  
    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 14;
  
    const node_icon =   (apidef.editorconfig.svgicon.unicode ? apidef.editorconfig.svgicon.unicode : 
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        '\u2646'))); // default to unicode anchor symbol
        
    return memo(({ data }) => {
        const leafDebugger = useLEAFDebugger({data});
      // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
      // determined and be reflected in the return construct.
      //const leadconfig = get_lead_config(data.leaduuid)
      //const leadconfig = {maininput1: false, auxinput1: false, mainoutput1: false, mainoutput2: false, auxoutput1: false}
      return (
        <div style={{ background: iconbgColor, border: data.selected ? '3px solid #f77' : '1px solid #777', padding: 2, borderRadius: '50%', width: '20pt', height: '20pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
          {leadconfig.maininput1 &&
          <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
          }
          {leadconfig.auxinput1 &&
          <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
          }
          <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
          </AnchorPort> 
          {
              data.isdebug &&
              leafDebugger
          }
          <div style={{width:'100%'}}>
          <span 
                style={{ pointerEvents: 'none', fontSize: '16pt', color: fgColor,}} 
              >
            {node_icon}
            </span>
          </div>
          {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
          <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
          </>
          }
          {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
          <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
          }
          {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
          <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
          }
          {leadconfig.auxoutput1 &&
          <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
          }
          <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
          </AnchorPort>
        </div>
      );
    });
  };

const constructEditorNodeTypes = (leafapi) => { // leafapi is _leafstdlib_dataflow_api from ghostos/api/metamodel.js
    const editornodetypeLUT = {
        'circularnamednode': LEAFEditorCircularNamedNode,
        'circularnamedboolnode': LEAFEditorCircularNamedBooleanNode,
        'tinynode': LEAFEditorTinyNode,
        'elementnode': LEAFEditorElementNode,
        'circularnode': LEAFEditorCircularNode,
        'rectangularnamednode': LEAFEditorRectangularNamedNode,
        'rectangularnode': LEAFEditorRectangularNode,
        'errornode': LEAFEditorCircularErrorNode,
    }
    const nodeTypes = {};
    Object.entries(leafapi()).map(([apiname, apidef]) => { // iterate over each api function definition carrying info such as i/o scaffolding, icon, etc.
        if (apidef.editorconfig.nodetype in editornodetypeLUT)
            nodeTypes[apiname] = editornodetypeLUT[apidef.editorconfig.nodetype](apidef);
        else {
            const errorMesg = `LEAF Error: constructEditorNodeTypes() encountered an unknown nodetype in the api definition: ${apiname} ${apidef.editorconfig.nodetype}`;
            console.error(errorMesg, apidef);
            nodeTypes[apiname] = editornodetypeLUT['errornode'](apidef, errorMesg);
        }
        //else if (['leafdeckspade', 'leafdeckheart', 'leafdeckdiamond', 'leafdeackclub'].includes(apiname)) {
        //    nodeTypes[apiname] = LEAFEditorCircularNode(apidef);
        //}
        //else if (['leafspell', 'leafspellimprov'].includes(apiname)) {
        //    nodeTypes[apiname] = LEAFEditorCircularNode(apidef); // should refactor this to be LEAFEditorSpellNode(apidef), yet to be implemented.
        //}
        //else { // otherwise go for the default look & feel
        //    nodeTypes[apiname] = LEAFEditorCircularNode(apidef);
        //}
    });

    return nodeTypes;
};


export {LEAFEditorTinyNode, LEAFEditorCircularNode, LEAFEditorElementNode, LEAFEditorCircularNamedNode, LEAFEditorCircularNamedBooleanNode, constructEditorNodeTypes, LEAFUtility, LEAFSpell, LEAFDataFilter, LEAFDataCombine, LEAFNodeContext, LEAFEdgeContext, LEAFAnchorPoint, LEAFDeckSpade, LEAFDeckDiamond, LEAFDeckHeart, LEAFDeckClub, LEAFDeckTracker};
