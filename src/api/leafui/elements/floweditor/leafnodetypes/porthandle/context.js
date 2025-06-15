import { createContext } from 'react';

//#reactflow #migration
//import { ElementId } from '../../lib/react-flow-renderer';

//type ContextProps = ElementId | null;

export const NodeIdContext = createContext(null);
export const Provider = NodeIdContext.Provider;
export const Consumer = NodeIdContext.Consumer;

export default NodeIdContext;
