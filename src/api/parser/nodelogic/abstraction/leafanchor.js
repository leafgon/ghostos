//import { etaReduceLambdaGraphs, etaReduceDataflowComponent, wrapInputStreamArrayHandler, runtimeEtaTree } from '../../eta';

/*
 * _leafanchor() is a placeholder function for the LEAF node of logic type 'leafanchor'.
 * it is used to mark an anchor point to which a leaf graph can be anchored (equivalent to commenting out the graph's logic).
 * it is neither dataflow-plane-scoped nor lambda-plane-scoped, as it only bears meaning during
 * the compilation of a leaf graph
 */
const _leafanchor = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
            `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot `+
            'be defined as a dataflow-scoped node.');
        //return (flowinput$) => { // identify function
        //    return flowinput$; 
        //};
        return undefined;
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
            `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot `+
            'be defined as a lambda-scoped node.');
        //return (flowinput$) => { // identify function
        //    return flowinput$; 
        //};
        return undefined;
    },
};

export { _leafanchor };