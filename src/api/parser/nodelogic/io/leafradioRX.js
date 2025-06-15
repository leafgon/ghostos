import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta';
import { map, withLatestFrom, filter } from 'rxjs/operators';
import { _leafbottle, _leafunbottle } from '../datautils';
import { mergeDataflows } from '../../../utils/leafdataflow';
import { from } from 'rxjs';

/*
 * _leafradioRX() is a dataflow-plane-scoped function for the LEAF node of logic type 'leafradioRX'.
 * it is used to declare a wireless dataflow communication receiver in a dataflow-scoped leaf component graph.
 */
const _leafradioRX = {
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
        //if (!contextuallambda) { 
        //    throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
        //        `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        //}
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
        //const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda});
        const bottleUp = _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_radioRX'}}}}, nodelambda: [], contextuallambda: contextuallambda});
        return (flowinput$Arr, controlflow$obj) => { // constant function
            // put together a radio setup data
            const radiosetup = {};
            return {...bottleUp([from([radiosetup])], controlflow$obj), _control: controlflow$obj};
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
            `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot `+
            'be defined as a lambda-scoped node.');
        return (flowinput$Arr, controlflow$obj) => { // identify function
            return {...(mergeDataflows(flowinput$Arr)), _control: controlflow$obj}; 
        };
    },
};

export { _leafradioRX };

