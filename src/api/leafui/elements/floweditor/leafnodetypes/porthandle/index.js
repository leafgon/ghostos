import React, { memo, useContext, useCallback, FC, HTMLAttributes, forwardRef } from 'react';
import cc from 'classcat';

import { shallow } from 'zustand/shallow';
//#reactflow #migration
//import { useStore, useStoreApi } from '../../lib/react-flow-renderer'; ///store/hooks'; //.store.hooks';
//import { HandleProps, Connection, ReactFlowState, Position  } from '../../lib/react-flow-renderer'; ///types';
//import { getHostForElement } from '../../lib/react-flow-renderer';
//import NodeIdContext from '../../lib/react-flow-renderer'; ///contexts'; //.contexts';
import { Handle, useStore, useStoreApi, Position, getHostForElement } from '../../lib/reactflow.11.10.4/core/dist/esm'; ///store/hooks'; //.store.hooks';
import '../../lib/reactflow.11.10.4/reactflow/dist/style.css';
//import NodeIdContext from './context'; ///contexts'; //.contexts';

import { onMouseDown, SetSourceIdFunc, SetPosition, checkElementBelowIsValid } from './handler';
import { createContext } from 'react';

const svgfilepath = '/assets/svg/'
const alwaysValid = () => true;

const selector = (s) => ({ // s: ReactFlowState
    onConnectAction: s.onConnect,
    onConnectStart: s.onConnectStart,
    onConnectStop: s.onConnectStop,
    onConnectEnd: s.onConnectEnd,
    connectionMode: s.connectionMode,
    connectionStartHandle: s.connectionStartHandle,
    connectOnClick: s.connectOnClick,
    hasDefaultEdges: s.hasDefaultEdges,
});

const DebugHandle_static = forwardRef(({
  type = 'source',
  position = Position.Top,
  isValidConnection = alwaysValid,
  isConnectable = false,
  id,
  onConnect,
  children,
  className,
  leaduuid,
  ...rest
}, ref) => {
    const store = useStoreApi();
    //const nodeId = useContext(NodeIdContext); // as ElementId;
    const nodeId = leaduuid;
    //const setPosition = useStore((store) => store.setConnectionPosition);
    //const setConnectionNodeId = useStore((store) => store.setConnectionNodeId);
    //const onConnectAction = useStore((store) => store.onConnect);
    //const onConnectStart = useStore((store) => store.onConnectStart);
    //const onConnectStop = useStore((store) => store.onConnectStop);
    //const onConnectEnd = useStore((store) => store.onConnectEnd);
    //const connectionMode = useStore((store) => store.connectionMode);
    const {
        onConnectAction,
        onConnectStart,
        onConnectStop,
        onConnectEnd,
        connectionMode,
        connectionStartHandle,
        connectOnClick,
        hasDefaultEdges,
    } = useStore(selector, shallow); //#reactflow #migration //useStore(selector, shallow);

    const handleId = id || null;
    const isTarget = type === 'target';

    //const anchor_symbol = '\u262e'
    //const debug_symbol = '👾'; // alien monster or space invader
    const debug_symbol = <>&#127183;</>; //'🃏'; // joker face, https://unicode-table.com/en/1F0CF/


    const onConnectExtended = useCallback(
        (params) => { //(params: Connection)
            const { defaultEdgeOptions } = store.getState();
            const edgeParams = {
                ...defaultEdgeOptions,
                ...params,
            };
            if (hasDefaultEdges) {
                const {edges} = store.getState();
                store.setState({ edges: addEdge(edgeParams, edges)});
            }

            onConnectAction?.(edgeParams);
            onConnect?.(edgeParams);
        },
        [hasDefaultEdges, onConnectAction, onConnect]
    );

    const onMouseDownHandler = useCallback(
        (event) => { //(event: React.MouseEvent)
            if (event.button === 0) {
                onMouseDown(
                    event,
                    handleId,
                    nodeId,
                    store.setState,
                    //setConnectionNodeId, //: SetSourceIdFunc,
                    //setPosition, //: SetPosition,
                    onConnectExtended,
                    isTarget,
                    isValidConnection,
                    connectionMode,
                    undefined,
                    undefined,
                    onConnectStart,
                    onConnectStop,
                    onConnectEnd
                );
            }
        },
        [
            handleId,
            nodeId,
            //setConnectionNodeId,
            //setPosition,
            onConnectExtended,
            isTarget,
            isValidConnection,
            connectionMode,
            onConnectStart,
            onConnectStop,
            onConnectEnd,
        ]
    );

    const onClick = useCallback(
        (event) => { // : React.MouseEvent
            if (!connectionStartHandle) {
                onConnectStart?.(event, {nodeId, handleId, handleType});
                store.setState({ connectionStartHandle: {nodeId, type, handleId}})
            }
            else {
                const doc = getHostForElement(event.target); // as HTMLElement
                const { connection, isValid } = checkElementBelowIsValid(
                    event, // as unknown as MouseEvent,
                    connectionMode,
                    connectionStartHandle.type === 'target',
                    connectionStartHandle.nodeId,
                    connectionStartHandle.handleId || null,
                    isValidConnection,
                    doc
                );

                onConnectStop?.(event); // as unknown as MouseEvent

                if (isValid) {
                    onConnectExtended(connection);
                }

                onConnectEnd?.(event); // as unknown as MouseEvent

                store.setState({ connectionStartHandle: null });
            }
        },
        [
            connectionStartHandle,
            onConnectStart,
            onConnectExtended,
            onConnectStop,
            onConnectEnd,
            isTarget,
            nodeId,
            handleId,
            type,
        ]
    );

    const handleClasses = cc([
        'react-flow__handle',
        `react-flow__handle-${position}`,
    //    'nodrag', fixed
        className,
        {
            source: !isTarget,
            target: isTarget,
            connectable: isConnectable,
            connecting:
                connectionStartHandle?.nodeId === nodeId &&
                connectionStartHandle?.handleId === handleId &&
                connectionStartHandle?.type === type,
        },
    ]);

//      <g id="UrTavla">
//      <circle cx={sourceX} cy={sourceY} fill="#fff" r={6.5} stroke="#222" strokeWidth={0.5} />
//      <text
//        x={sourceX}
//        y={sourceY+6}
//        textAnchor="middle"
//      >
//        &#x2646;
//      </text>
//      </g>
//      {anchor_symbol}
//      {children}
// style={{ position: 'relative', top: '-15px', left: '-8px'}} 
//      style={{ position:'relative', top: '-7.1px', left: '-2.1px', pointerEvents: 'none'}} 
//    <span
//      data-handleid={handleId}
//      data-nodeid={nodeId}
//      data-handlepos={position}
//      className={handleClasses}
//      onMouseDown={onMouseDownHandler}
//      {...rest}
//    ></span>
//    <span style={{ position:'relative', top: '-20px', left: '10px', pointerEvents: 'auto', fontSize: '30pt'}} >
//    {debug_symbol}
//    </span>
  return (
    <div
      data-handleid={handleId}
      data-nodeid={nodeId}
      data-handlepos={position}
      className={handleClasses}
      onMouseDown={onMouseDownHandler}
      onClick={connectOnClick ? onClick : undefined }
      ref={ref}
      {...rest}
    >
    <span style={{ position:'relative', top: '-5px', left: '-5px', pointerEvents: 'auto', fontSize: '20pt'}} >
        {debug_symbol}
        <span>
            {children}
        </span>
    </span>
    </div>
  );
});
//    <span style={{ position:'relative', top: '-8px', left: '-3.5px', pointerEvents: 'auto', fontSize: '10pt'}} >

DebugHandle_static.displayName = 'DebugHandle';

//const AnchorHandle: FC<HandleProps & Omit<HTMLAttributes<HTMLDivElement>, 'id'>> = ({
const AnchorHandle_static = forwardRef(({
  type = 'source',
  position = Position.Top,
  isValidConnection = alwaysValid,
  isConnectable = true,
  id,
  onConnect,
  children,
  className,
  leaduuid,
  ...rest
}, ref) => {
    const store = useStoreApi();
    //const nodeId = useContext(NodeIdContext); // as ElementId;
    const nodeId = leaduuid;
    //const setPosition = useStore((store) => store.setConnectionPosition);
    //const setConnectionNodeId = useStore((store) => store.setConnectionNodeId);
    //const onConnectAction = useStore((store) => store.onConnect);
    //const onConnectStart = useStore((store) => store.onConnectStart);
    //const onConnectStop = useStore((store) => store.onConnectStop);
    //const onConnectEnd = useStore((store) => store.onConnectEnd);
    //const connectionMode = useStore((store) => store.connectionMode);
    const {
        onConnectAction,
        onConnectStart,
        onConnectStop,
        onConnectEnd,
        connectionMode,
        connectionStartHandle,
        connectOnClick,
        hasDefaultEdges,
    } = useStore(selector, shallow); //#reactflow #migration //useStore(selector, shallow);

    const handleId = id || null;
    const isTarget = type === 'target';

    //const anchor_symbol = '\u262e'
    //const anchor_symbol = '\u2646' // neptune symbol or the trident
    const iconheight = 20;
    const iconwidth = 20;
    const anchor_symbol = <svg height={iconheight} width={iconwidth}><image href={svgfilepath+'trident.svg'} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg>



    const onConnectExtended = useCallback(
        (params) => { //(params: Connection)
            const { defaultEdgeOptions } = store.getState();
            const edgeParams = {
                ...defaultEdgeOptions,
                ...params,
            };
            if (hasDefaultEdges) {
                const {edges} = store.getState();
                store.setState({ edges: addEdge(edgeParams, edges)});
            }

            onConnectAction?.(edgeParams);
            onConnect?.(edgeParams);
        },
        [hasDefaultEdges, onConnectAction, onConnect]
    );

    const onMouseDownHandler = useCallback(
        (event) => { //(event: React.MouseEvent)
            if (event.button === 0) {
                onMouseDown(
                    event,
                    handleId,
                    nodeId,
                    store.setState,
                    //setConnectionNodeId, //: SetSourceIdFunc,
                    //setPosition, //: SetPosition,
                    onConnectExtended,
                    isTarget,
                    isValidConnection,
                    connectionMode,
                    undefined,
                    undefined,
                    onConnectStart,
                    onConnectStop,
                    onConnectEnd
                );
            }
        },
        [
            handleId,
            nodeId,
            //setConnectionNodeId,
            //setPosition,
            onConnectExtended,
            isTarget,
            isValidConnection,
            connectionMode,
            onConnectStart,
            onConnectStop,
            onConnectEnd,
        ]
    );

    const onClick = useCallback(
        (event) => { // : React.MouseEvent
            if (!connectionStartHandle) {
                onConnectStart?.(event, {nodeId, handleId, handleType});
                store.setState({ connectionStartHandle: {nodeId, type, handleId}})
            }
            else {
                const doc = getHostForElement(event.target); // as HTMLElement
                const { connection, isValid } = checkElementBelowIsValid(
                    event, // as unknown as MouseEvent,
                    connectionMode,
                    connectionStartHandle.type === 'target',
                    connectionStartHandle.nodeId,
                    connectionStartHandle.handleId || null,
                    isValidConnection,
                    doc
                );

                onConnectionStop?.(event); // as unknown as MouseEvent

                if (isValid) {
                    onConnectExtended(connection);
                }

                onConnectEnd?.(event); // as unknown as MouseEvent

                store.setState({ connectionStartHandle: null });
            }
        },
        [
            connectionStartHandle,
            onConnectStart,
            onConnectExtended,
            onConnectStop,
            onConnectEnd,
            isTarget,
            nodeId,
            handleId,
            type,
        ]
    );

    const handleClasses = cc([
        'react-flow__handle',
        `react-flow__handle-${position}`,
        'nodrag',
        className,
        {
            source: !isTarget,
            target: isTarget,
            connectable: isConnectable,
            connecting:
                connectionStartHandle?.nodeId === nodeId &&
                connectionStartHandle?.handleId === handleId &&
                connectionStartHandle?.type === type,
        },
    ]);

//      <g id="UrTavla">
//      <circle cx={sourceX} cy={sourceY} fill="#fff" r={6.5} stroke="#222" strokeWidth={0.5} />
//      <text
//        x={sourceX}
//        y={sourceY+6}
//        textAnchor="middle"
//      >
//        &#x2646;
//      </text>
//      </g>
//      {anchor_symbol}
//      {children}
// style={{ position: 'relative', top: '-15px', left: '-8px'}} 
//      style={{ position:'relative', top: '-7.1px', left: '-2.1px', pointerEvents: 'none'}} 
//    <span
//      data-handleid={handleId}
//      data-nodeid={nodeId}
//      data-handlepos={position}
//      className={handleClasses}
//      onMouseDown={onMouseDownHandler}
//      {...rest}
//    ></span>
//    <span style={{ position:'relative', top: '-20px', left: '10px', pointerEvents: 'auto', fontSize: '30pt'}} >
//    {debug_symbol}
//    </span>
  return (
    <Handle
      data-handleid={handleId}
      data-nodeid={nodeId}
      data-handlepos={position}
      className={handleClasses}
      onMouseDown={onMouseDownHandler}
      onClick={connectOnClick ? onClick : undefined }
      ref={ref}
      {...rest}
    >
    <span 
        style={{ position:'relative', top: '0px', left: '0px', pointerEvents: 'none', fontSize: '10pt'}} 
    >
        {anchor_symbol}
    </span>
    </Handle>
  );
});
//        style={{ position:'relative', top: '-6.1px', left: '-1px', pointerEvents: 'none', fontSize: '10pt'}} 

AnchorHandle_static.displayName = 'AnchorHandle';

const DataHandle_static = forwardRef(({
  type = 'source',
  position = Position.Top,
  isValidConnection = alwaysValid,
  isConnectable = true,
  id,
  onConnect,
  children,
  className,
  leaduuid,
  ...rest
}, ref) => {
    const store = useStoreApi();
    //const nodeId = useContext(NodeIdContext); // as ElementId;
    const nodeId = leaduuid;
    //const setPosition = useStore((store) => store.setConnectionPosition);
    //const setConnectionNodeId = useStore((store) => store.setConnectionNodeId);
    //const onConnectAction = useStore((store) => store.onConnect);
    //const onConnectStart = useStore((store) => store.onConnectStart);
    //const onConnectStop = useStore((store) => store.onConnectStop);
    //const onConnectEnd = useStore((store) => store.onConnectEnd);
    //const connectionMode = useStore((store) => store.connectionMode);
    const {
        onConnectAction,
        onConnectStart,
        onConnectStop,
        onConnectEnd,
        connectionMode,
        connectionStartHandle,
        connectOnClick,
        hasDefaultEdges,
    } = useStore(selector, shallow); //#reactflow #migration // useStore(selector, shallow);

    const handleId = id || null;
    const isTarget = type === 'target';

    const iconheight = 20;
    const iconwidth = 20;
    //const data_symbol = '\u2749' // snowflake asterisk
    //const data_symbol = '\u3267' // ieung in hangul
    const data_symbol = <svg height={iconheight} width={iconwidth}><image href={svgfilepath+'circledcircle.svg'} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg>

    const onConnectExtended = useCallback(
        (params) => { //(params: Connection)
            const { defaultEdgeOptions } = store.getState();
            const edgeParams = {
                ...defaultEdgeOptions,
                ...params,
            };
            if (hasDefaultEdges) {
                const {edges} = store.getState();
                store.setState({ edges: addEdge(edgeParams, edges)});
            }

            onConnectAction?.(edgeParams);
            onConnect?.(edgeParams);
        },
        [hasDefaultEdges, onConnectAction, onConnect]
    );

    const onMouseDownHandler = useCallback(
        (event) => { //(event: React.MouseEvent)
            if (event.button === 0) {
                onMouseDown(
                    event,
                    handleId,
                    nodeId,
                    store.setState,
                    //setConnectionNodeId, //: SetSourceIdFunc,
                    //setPosition, //: SetPosition,
                    onConnectExtended,
                    isTarget,
                    isValidConnection,
                    connectionMode,
                    undefined,
                    undefined,
                    onConnectStart,
                    onConnectStop,
                    onConnectEnd
                );
            }
        },
        [
            handleId,
            nodeId,
            //setConnectionNodeId,
            //setPosition,
            onConnectExtended,
            isTarget,
            isValidConnection,
            connectionMode,
            onConnectStart,
            onConnectStop,
            onConnectEnd,
        ]
    );

    const onClick = useCallback(
        (event) => { // : React.MouseEvent
            if (!connectionStartHandle) {
                onConnectStart?.(event, {nodeId, handleId, handleType});
                store.setState({ connectionStartHandle: {nodeId, type, handleId}})
            }
            else {
                const doc = getHostForElement(event.target); // as HTMLElement
                const { connection, isValid } = checkElementBelowIsValid(
                    event, // as unknown as MouseEvent,
                    connectionMode,
                    connectionStartHandle.type === 'target',
                    connectionStartHandle.nodeId,
                    connectionStartHandle.handleId || null,
                    isValidConnection,
                    doc
                );

                onConnectionStop?.(event); // as unknown as MouseEvent

                if (isValid) {
                    onConnectExtended(connection);
                }

                onConnectEnd?.(event); // as unknown as MouseEvent

                store.setState({ connectionStartHandle: null });
            }
        },
        [
            connectionStartHandle,
            onConnectStart,
            onConnectExtended,
            onConnectStop,
            onConnectEnd,
            isTarget,
            nodeId,
            handleId,
            type,
        ]
    );

    const handleClasses = cc([
        'react-flow__handle',
        `react-flow__handle-${position}`,
        'nodrag',
        className,
        {
            source: !isTarget,
            target: isTarget,
            connectable: isConnectable,
            connecting:
                connectionStartHandle?.nodeId === nodeId &&
                connectionStartHandle?.handleId === handleId &&
                connectionStartHandle?.type === type,
        },
    ]);

//      <g id="UrTavla">
//      <circle cx={sourceX} cy={sourceY} fill="#fff" r={6.5} stroke="#222" strokeWidth={0.5} />
//      <text
//        x={sourceX}
//        y={sourceY+6}
//        textAnchor="middle"
//      >
//        &#x2646;
//      </text>
//      </g>
//      {anchor_symbol}
//      {children}
// style={{ position: 'relative', top: '-15px', left: '-8px'}} 
//      style={{ position:'relative', top: '-7.1px', left: '-2.1px', pointerEvents: 'none'}} 
//    <span
//      data-handleid={handleId}
//      data-nodeid={nodeId}
//      data-handlepos={position}
//      className={handleClasses}
//      onMouseDown={onMouseDownHandler}
//      {...rest}
//    ></span>
//    <span style={{ position:'relative', top: '-20px', left: '10px', pointerEvents: 'auto', fontSize: '30pt'}} >
//    {debug_symbol}
//    </span>
  return (
    <Handle
      data-handleid={handleId}
      data-nodeid={nodeId}
      data-handlepos={position}
      className={handleClasses}
      onMouseDown={onMouseDownHandler}
      onClick={connectOnClick ? onClick : undefined }
      ref={ref}
      {...rest}
    >
    <span 
      style={{ position:'relative', top: '0px', left: '0px', pointerEvents: 'none', fontSize: '10pt'}} 
    >
        {data_symbol}
    </span>
    </Handle>
  );
});
//      style={{ position:'relative', top: '-5px', left: '-0.75px', pointerEvents: 'none', fontSize: '19pt'}} 
//      style={{ position:'relative', top: '-7px', left: '-2.5px', pointerEvents: 'none', fontSize: '10pt'}} 

DataHandle_static.displayName = 'DataHandle';

const LambdaHandle_static = forwardRef(({
  type = 'source',
  position = Position.Top,
  isValidConnection = alwaysValid,
  isConnectable = true,
  id,
  onConnect,
  children,
  className,
  leaduuid,
  ...rest
}, ref) => {
    const store = useStoreApi();
    //const nodeId = useContext(NodeIdContext); // as ElementId;
    const nodeId = leaduuid;
    //const setPosition = useStore((store) => store.setConnectionPosition);
    //const setConnectionNodeId = useStore((store) => store.setConnectionNodeId);
    //const onConnectAction = useStore((store) => store.onConnect);
    //const onConnectStart = useStore((store) => store.onConnectStart);
    //const onConnectStop = useStore((store) => store.onConnectStop);
    //const onConnectEnd = useStore((store) => store.onConnectEnd);
    //const connectionMode = useStore((store) => store.connectionMode);
    const {
        onConnectAction,
        onConnectStart,
        onConnectStop,
        onConnectEnd,
        connectionMode,
        connectionStartHandle,
        connectOnClick,
        hasDefaultEdges,
    } = useStore(selector, shallow); //#reactflow #migration //useStore(selector, shallow);

    const handleId = id || null;
    const isTarget = type === 'target';

    const iconheight = 20;
    const iconwidth = 20;
    //const anchor_symbol = '\u262e'
    //const lambda_symbol = '\u3267'
    //const lambda_symbol = '\u3264' // mieum in hangul
    const lambda_symbol = <svg height={iconheight} width={iconwidth}><image href={svgfilepath+'circledsquare.svg'} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg>

    const onConnectExtended = useCallback(
        (params) => { //(params: Connection)
            const { defaultEdgeOptions } = store.getState();
            const edgeParams = {
                ...defaultEdgeOptions,
                ...params,
            };
            if (hasDefaultEdges) {
                const {edges} = store.getState();
                store.setState({ edges: addEdge(edgeParams, edges)});
            }

            onConnectAction?.(edgeParams);
            onConnect?.(edgeParams);
        },
        [hasDefaultEdges, onConnectAction, onConnect]
    );

    const onMouseDownHandler = useCallback(
        (event) => { //(event: React.MouseEvent)
            if (event.button === 0) {
                onMouseDown(
                    event,
                    handleId,
                    nodeId,
                    store.setState,
                    //setConnectionNodeId, //: SetSourceIdFunc,
                    //setPosition, //: SetPosition,
                    onConnectExtended,
                    isTarget,
                    isValidConnection,
                    connectionMode,
                    undefined,
                    undefined,
                    onConnectStart,
                    onConnectStop,
                    onConnectEnd
                );
            }
        },
        [
            handleId,
            nodeId,
            //setConnectionNodeId,
            //setPosition,
            onConnectExtended,
            isTarget,
            isValidConnection,
            connectionMode,
            onConnectStart,
            onConnectStop,
            onConnectEnd,
        ]
    );

    const onClick = useCallback(
        (event) => { // : React.MouseEvent
            if (!connectionStartHandle) {
                onConnectStart?.(event, {nodeId, handleId, handleType});
                store.setState({ connectionStartHandle: {nodeId, type, handleId}})
            }
            else {
                const doc = getHostForElement(event.target); // as HTMLElement
                const { connection, isValid } = checkElementBelowIsValid(
                    event, // as unknown as MouseEvent,
                    connectionMode,
                    connectionStartHandle.type === 'target',
                    connectionStartHandle.nodeId,
                    connectionStartHandle.handleId || null,
                    isValidConnection,
                    doc
                );

                onConnectionStop?.(event); // as unknown as MouseEvent

                if (isValid) {
                    onConnectExtended(connection);
                }

                onConnectEnd?.(event); // as unknown as MouseEvent

                store.setState({ connectionStartHandle: null });
            }
        },
        [
            connectionStartHandle,
            onConnectStart,
            onConnectExtended,
            onConnectStop,
            onConnectEnd,
            isTarget,
            nodeId,
            handleId,
            type,
        ]
    );

    const handleClasses = cc([
        'react-flow__handle',
        `react-flow__handle-${position}`,
        'nodrag',
        className,
        {
            source: !isTarget,
            target: isTarget,
            connectable: isConnectable,
            connecting:
                connectionStartHandle?.nodeId === nodeId &&
                connectionStartHandle?.handleId === handleId &&
                connectionStartHandle?.type === type,
        },
    ]);

//      <g id="UrTavla">
//      <circle cx={sourceX} cy={sourceY} fill="#fff" r={6.5} stroke="#222" strokeWidth={0.5} />
//      <text
//        x={sourceX}
//        y={sourceY+6}
//        textAnchor="middle"
//      >
//        &#x2646;
//      </text>
//      </g>
//      {anchor_symbol}
//      {children}
// style={{ position: 'relative', top: '-15px', left: '-8px'}} 
//      style={{ position:'relative', top: '-7.1px', left: '-2.1px', pointerEvents: 'none'}} 
//    <span
//      data-handleid={handleId}
//      data-nodeid={nodeId}
//      data-handlepos={position}
//      className={handleClasses}
//      onMouseDown={onMouseDownHandler}
//      {...rest}
//    ></span>
//    <span style={{ position:'relative', top: '-20px', left: '10px', pointerEvents: 'auto', fontSize: '30pt'}} >
//    {debug_symbol}
//    </span>
  return (
    <Handle
      data-handleid={handleId}
      data-nodeid={nodeId}
      data-handlepos={position}
      className={handleClasses}
      onMouseDown={onMouseDownHandler}
      onClick={connectOnClick ? onClick : undefined }
      ref={ref}
      {...rest}
    >
    <span 
      style={{ position:'relative', top: '0px', left: '0px', pointerEvents: 'none', fontSize: '10pt'}} 
    >
        {lambda_symbol}
    </span>
    </Handle>
  );
});
//      style={{ position:'relative', top: '-5.25px', left: '-0.75px', pointerEvents: 'none', fontSize: '19pt'}} 
//      style={{ position:'relative', top: '-7px', left: '-2.5px', pointerEvents: 'none', fontSize: '10pt'}} 

LambdaHandle_static.displayName = 'LambdaHandle';

const AnchorPort = memo(AnchorHandle_static);
const DataPort = memo(DataHandle_static);
const LambdaPort = memo(LambdaHandle_static);
const DebugPort = memo(DebugHandle_static);

export {AnchorPort, DataPort, LambdaPort, DebugPort};
