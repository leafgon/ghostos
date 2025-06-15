/*
 * The reference js implementation of the LEAF language specification, codenamed breezyforest 
 * This library is a part of the reference js implementation of ghostos
 * to define various common methods that can be programmatically envokable 
 * at runtime with respect to each leaf node. 
 * 
 * author: spark@leautomaton.com
 * date: 8 Jan 2023
 * 
 * copyright: LE Automaton Ltd
 * 
 * 
 */

import { etaReduceLambdaGraphs } from "../eta.js";

const _common_methods = (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
    const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

    return {
        version: "breezyforest",
        nodequery: (flowinput$obj) => {
            const flowoutput$ = flowinput$obj._stream.pipe(
                map(node_input=>{ // node_input is expected to be an array, the calling function, parseLEAFNode (leaf.js) ensures this
                    // do something with node_input
                    // and return output
                    node_output = refnodedata;
                    return node_output;
                })
            );
            return {_stream: flowoutput$, _control: controlflow$obj};
        
            //return {};
        },
        nodemethod: (flowinput$obj) => {
            return {};
        }
    };
};

export {_common_methods};