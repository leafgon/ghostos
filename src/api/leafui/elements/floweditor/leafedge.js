import React from 'react';
//#reactflow #migration
//import { getBezierPath, getEdgeCenter, getMarkerEnd } from './lib/react-flow-renderer';
import { BaseEdge, getBezierPath, getEdgeCenter, getMarkerEnd } from './lib/reactflow.11.10.4/core/dist/esm';

const foreignObjectSize = 40;
const onEdgeClick = (event, id) => {
  event.stopPropagation();
  alert(`remove ${id}`);
};

function LEAFEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  arrowHeadType,
  markerEndId,
}) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

//      <path id={id} stroke-width="10" stroke-dasharray="5,5" style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
//      <foreignObject
//        width={foreignObjectSize}
//        height={foreignObjectSize}
//        x={edgeCenterX - foreignObjectSize / 2}
//        y={edgeCenterY - foreignObjectSize / 2}
//        className="edgebutton-foreignobject"
//        requiredExtensions="http://www.w3.org/1999/xhtml"
//      >
//        <body>
//          <button
//            className="edgebutton"
//            onClick={(event) => onEdgeClick(event, id)}
//          >
//            ×
//          </button>
//        </body>
//      </foreignObject>
//      <text>
//        <textPath href={`#${id}`} style={{ fontSize: '12px' }} startOffset="50%" textAnchor="middle">
//          {data.text}
//        </textPath>
//      </text>
  return (
    <>
      <BaseEdge id={id} style={{...style, strokeWidth:"10" }} path={edgePath} markerEnd={markerEnd} />
    </>
  );
}

function LEAFLambdaEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  arrowHeadType,
  markerEndId,
}) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

//      <path id={id} stroke-width="10" stroke-dasharray="5,5" style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
// markerEnd from getMarkerEnd() = 'url(#react-flow__arrow)'
  return (
    <>
      <BaseEdge id={id} style={{...style, strokeWidth:"10", strokeDasharray:"10,5"}} path={edgePath} markerEnd={markerEnd} />
      <g id="UrTavla">
      <circle cx={edgeCenterX} cy={edgeCenterY} fill="#fff" r={6.5} stroke="#222" strokeWidth={0.5} />
      <text
        x={edgeCenterX}
        y={edgeCenterY+5.5}
        textAnchor="middle"
      >
        &lambda;
      </text>
      </g>
    </>
  );
}

function LEAFAnchorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  arrowHeadType,
  markerEndId,
}) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

//      <path id={id} stroke-width="10" stroke-dasharray="5,5" style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
// markerEnd from getMarkerEnd() = 'url(#react-flow__arrow)'
  return (
    <>
      <BaseEdge id={id} style={{...style, strokeWidth:"10", strokeDasharray:"10,5" }} path={edgePath} markerEnd={markerEnd} />
      <div position='relative' style={{zIndex: 2}} >
        <g id="UrTavla">
        <circle cx={sourceX} cy={sourceY} fill="#fff" r={6.5} stroke="#222" strokeWidth={0.5} />
        <text
          x={sourceX}
          y={sourceY+6}
          textAnchor="middle"
        >
          &#x2646;
        </text>
        </g>
      </div>
    </>
  );
}

export {LEAFEdge, LEAFLambdaEdge, LEAFAnchorEdge}