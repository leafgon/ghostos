import React, { memo, FC, CSSProperties } from 'react';

import { Handle, Position, NodeProps, Connection, Edge } from './lib/react-flow-renderer';
  
import Draggable from 'react-draggable';

const targetHandleStyle: CSSProperties = { background: '#225' };
const targetAuxHandleStyle: CSSProperties = { background: '#22f', left: '20%' };
const sourceAuxHandleStyle: CSSProperties = { background: '#f25',  left: '80%'};
const sourceHandleStyle: CSSProperties = { ...targetHandleStyle, top: '50%'};
const sourceHandleStyleA: CSSProperties = { ...targetHandleStyle, top: 10 };
const sourceHandleStyleB: CSSProperties = { ...targetHandleStyle, bottom: 10, top: 'auto' };

const onConnect = (params: Connection | Edge) => console.log('handle onConnect', params);

const onHandleTouch = (event: React.MouseEvent): void => {
  console.log("touch down on handle!")
}

const onTouchStart = (event: React.MouseEvent): void => {
  console.log("handle dragging!")
}

const LEAFNode = ({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  const leadconfig = {maininput: true, auxinput: true, mainoutput1: true, mainoutput2: true, auxouput: true}
  return (
    <div style={{ background: '#882', border: '1px solid #777', padding: 2, borderRadius: '5px' }} >
      {leadconfig.maininput &&
      <Handle type="target" position={Position.Left} id="a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput &&
      <Handle type="target" position={Position.Top} id="b" style={targetAuxHandleStyle} onConnect={onConnect} />
      }
      <div>
        Custom Node: <strong>{data.color}</strong>
        {data.leaduuid}
      </div>
      <input className="nodrag" type="color" onChange={data.onChange} defaultValue={data.color} />
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <Handle type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <Handle type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <Handle type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <Handle type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      <Handle type="source" position={Position.Bottom} id="out_aux" style={sourceAuxHandleStyle} />
    </div>
  );
};

export default memo(LEAFNode);
