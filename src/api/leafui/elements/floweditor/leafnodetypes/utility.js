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

import {targetAuxHandleStyle, sourceAuxHandleStyle, targetHandleStyle, targetAuxDataHandleStyle, targetAnchorHandleStyle, sourceHandleStyleA, sourceHandleStyleB, sourceHandleStyle, sourceAuxDataHandleStyle, sourceAnchorHandleStyle, useStyles} from './styles';
import {onConnect} from './uihandlers';

const LEAFUtility = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <span style={{ position: 'relative', top: '-15px', left: '-8px'}} >{anchor_symbol}</span>
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}

  const onColorChange = (event) => { // event : ChangeEvent
    const color = event.target.value;

    //setBgColor(color);
    // the setBgColor() is local to floweditor/index.js and require the event handler be declared externally w.r.t leafnode.js.
    // the new bg color shall need to be saved as part of the node data in the LEAF lake
    // for saving color for persistency
//      <input className="nodrag" type="color" onChange={data.onChange} defaultValue={data.color} />
  };

  return (
    <>
    <div style={{ background: '#8f2', border: '1px solid #777', padding: 2, borderRadius: '5px' }} >
      {leadconfig.maininput1 &&
      <DataPort data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaPort data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxHandleStyle} onConnect={onConnect} />
      }
      <AnchorPort data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorPort>
      <div>
        Custom Node: <strong>{data.color}</strong>
        {data.leaduuid}
      </div>
      <span style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
      <input className="nodrag" type="color" onChange={onColorChange} defaultValue={data.color} />
      </span>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataPort data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataPort data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataPort data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataPort data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaPort data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxHandleStyle} />
      }
      <AnchorPort data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorPort>
    </div>
    </>
  );
});

export {LEAFUtility};
