import { mergeDataflows } from '../../../utils/leafdataflow.js';
import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';

/*
 * _leaflambdagraph(): is a runtime function for the LEAFgraph node of logic type 'leaflambdagraph'
 * it is used in LEAFgraph for referring to what's connected to the other side of any incoming lambda edge(s) 
 * (therefore the associated upstream lambda logic) of a LEAF graph.  
 * @nodeconfig: to carry any compile time configs for the LEAFgraph node (configs TBD, 29 Jan 2022)
 */
//const _leaflambdagraph = ({nodeconfig={}}={}, lambdaFunc, graphContextual=x=>x) => {}
const _leaflambdagraph = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        //const _leafnode = contextuallambda; // derivative leafnode
        //const _leafnode_logic = contextuallambda.uuid;
        
        // get the refnode w.r.t. the current leaf node
        //const refnode = refnodepath[0]; //leafgraph.graph.lambda.outNeighbors(contextuallambda[0])[0]; 
        //const refnode_logic = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
        //const contextual_lut = refnode ? parseLambdaLUT(contextuallambda, _refnode, _refnode_logic) : undefined;
        // get the refnode w.r.t. the contextuallambda nodes
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) has `+
                `a leaflambdagraph node (${refnode}) referencing an undefined lambda construct.`;
        }
        //if (!('_default' in contextual_lut)) {
        //  throw `LEAF error: the logical construct built using the ${_refnode_logic.type} node `+
        //        `(${_refnode}) called with args (${JSON.stringify(_refnode_logic.args)}) has no `+
        //        `default defined for its lambda, while being referenced by the leaflambdagraph node (${leafnode}). `+
        //        'A default lambda construct is required by the leaflambdagraph node.';
        //}
        
        // for the derivative nodelambda, look up the list of lambda leaf nodes connected to the defualt lambda entry node.
        // for the derivative contextuallambda, use current node's nodelambda.
        //const _nodelambda = leafgraph.edges.lambda.sourcelut[contextual_lut._default.uuid]; 

        //const thecorelogic = await etaReduceLambdaGraphs(contextual_lut._default.uuid, _nodelambda, _contextuallambda, leafgraph, graphcomponents);
        //const thecorelogic = await etaReduceLambdaGraphs({nodelambda: contextuallambda, contextuallambda: nodelambda});
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        return (input$Arr, controlflow$obj) => {
            // use node_setup somehow
            //if ("contextual" in reduced_lambda_obj && '_default' in reduced_lambda_obj.contextual) {}
            if ('_default' in reduced_lambda_obj) {
                const output$obj = reduced_lambda_obj._default(input$Arr, controlflow$obj);
                return {...output$obj, _control: controlflow$obj};
            }
            else {
                if (input$Arr.length > 0) {
                    const merged$obj = mergeDataflows(input$Arr);
                    return {...merged$obj, _control: controlflow$obj};
                }
                else {
                    return undefined; //{_stream: controlflow$obj._stream, _control: controlflow$obj};
                }
            }
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const output$obj = etafunc(input$Arr, controlflow$obj);
                return {...output$obj, _control: controlflow$obj}; // with _control: controlflow$obj pass thru
            }
        });
        return lambda_lut;
    },
};

export { _leaflambdagraph };