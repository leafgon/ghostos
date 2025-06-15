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

import {targetHandleStyle, targetAuxDataHandleStyle, targetAnchorHandleStyle, sourceHandleStyleA, sourceHandleStyleB, sourceHandleStyle, sourceAuxDataHandleStyle, sourceAnchorHandleStyle, useStyles} from './styles';
import {onConnect} from './uihandlers';

const LEAFEditorAnchorNode = (apidef) => {
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
                      (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                      (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                      '\u2646'))); // default to unicode anchor symbol
      
  return memo(({ data }) => {
    // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
    // determined and be reflected in the return construct.
    //const leadconfig = get_lead_config(data.leaduuid)
    //const leadconfig = {maininput1: false, auxinput1: false, mainoutput1: false, mainoutput2: false, auxoutput1: false}
    return (
      <div style={{ background: iconbgColor, border: '1px solid #777', padding: 2, borderRadius: '50%', width: '20pt', height: '20pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
        {leadconfig.maininput1 &&
        <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
        }
        {leadconfig.auxinput1 &&
        <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
        }
        <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
        </AnchorPort> 
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

const svgfilepath = '/assets/svg/';
const LEAFAnchorPoint = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  const leadconfig = {maininput1: false, auxinput1: false, mainoutput1: false, mainoutput2: false, auxoutput1: false}
  //const anchor_symbol = '\u2646'
  const iconheight = 20;
  const iconwidth = 20;
  const anchor_symbol = <svg height={iconheight} width={iconwidth}><image href={svgfilepath+'trident.svg'} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg>
  return (
    <div style={{ background: '#66f', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '15pt', height: '15pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorPort> 
      <div style={{width:'100%'}}>
      <span 
            style={{ pointerEvents: 'none', fontSize: '16pt', color: 'white',}} 
          >
        {anchor_symbol}
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

export { LEAFAnchorPoint, LEAFEditorAnchorNode };
