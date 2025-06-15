import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import { ReactDOM } from 'react';
import Hammer from '@egjs/hammerjs';

//#reactflow #migration
//import { Handle, Position, NodeProps, Connection, Edge } from '../lib/react-flow-renderer';
import { Handle, Position, NodeProps, Connection, Edge } from '../lib/reactflow.11.10.4/core/dist/esm/index.js';
import { AnchorPort, DataPort, LambdaPort } from './porthandle'
  
import Draggable from 'react-draggable';

//import { TextField, Input } from '@material-ui/core';
//import { withStyles, makeStyles } from '@material-ui/core/styles';
//import { textAlign } from '@material-ui/system';
//import { NoEncryption } from '@material-ui/icons';

import { useMutation } from 'graphql-hooks';
//import { Base64 } from 'crypto-js/enc-base64';
//import sjcl from 'sjcl';

import {mutateUpdateNode} from '../leafgql';

import {targetHandleStyle, targetAuxDataHandleStyle, targetAnchorHandleStyle, sourceHandleStyleA, sourceHandleStyleB, sourceHandleStyle, sourceAuxDataHandleStyle, sourceAnchorHandleStyle, useStyles} from './styles';
import {onConnect} from './uihandlers';

const LEAFDeckSpade = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
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
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
        <path d="M7.184 11.246A3.5 3.5 0 0 1 1 9c0-1.602 1.14-2.633 2.66-4.008C4.986 3.792 6.602 2.33 8 0c1.398 2.33 3.014 3.792 4.34 4.992C13.86 6.367 15 7.398 15 9a3.5 3.5 0 0 1-6.184 2.246 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907z"/>
</svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
        {data.leafnodename}
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

const LEAFDeckDiamond = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
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
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2z"/>
      </svg>&nbsp;
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2z"/>
      </svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
        {data.leafnodename}
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

const LEAFDeckHeart = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  //      <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
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
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z"/>
</svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
      {data.leafnodename}
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

const LEAFDeckClub = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  //      <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
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
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z"/>
</svg>&nbsp;
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z"/>
</svg>&nbsp;
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z"/>
</svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
        {data.leafnodename}
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

const LEAFDeckTracker = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  //      <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  // onMouseDown: async function paste(e) {try {e.preventDefault(); e.stopPropagation(); let copy_text = document.getElementById(data.leaduuid); copy_text.textContent = await navigator.clipboard.readText(); }catch (err){}finally{return e;}}
  const pinwheel_star_symbol = '\u2735';
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  const [state, setState] = useState({
    nameEntered: '',
  });
  const handleMouseDown = async function(event) {
    console.debug("handleMouseDown(): "+event);
    try {
      event.preventDefault(); 
      event.stopPropagation(); 
      //classes.root.display = 'auto';
      //let copy_text = document.getElementById(data.leaduuid); 
      //copy_text.textContent = await navigator.clipboard.readText();
      //setState({...state, nameEntered: '', nameDefault: copy_text.textContent });

      setState(async (prevState) => {
        //if (leafnodename.value !== state.nameDefault) {
          const clipboardtext = await navigator.clipboard.readText();
          const node_data = { leafeditor: {
            //leaduuid: `${data.leaduuid}`,
            ...data,
            //type: "leafdatafilternode",
            leafnodename: clipboardtext, //edit_text.value,
            //position: state.position,
            //nodeid: node_uuid,
          }};
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
          mutateUpdateNode({variables: {uuid: data.leaduuid, data: btoa(JSON.stringify(node_data))}});
        //}
        return {...prevState, nameEntered: clipboardtext };
      });
      //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
    }
    catch (err) {}
    finally{return event;}
  };
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
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <span style={{pointerEvents: 'auto', cursor: (!state.nameEntered ? 'copy' : 'grab'), fontSize: '20pt', color: '#3fff'}} 
      {...(!state.nameEntered && { onMouseDown: handleMouseDown })} >
      {pinwheel_star_symbol}
      </span><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
      {data.leafnodename ? data.leafnodename : state.nameEntered}
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

export {LEAFDeckSpade, LEAFDeckDiamond, LEAFDeckHeart, LEAFDeckClub, LEAFDeckTracker};
