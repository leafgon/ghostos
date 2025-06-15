import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { _leafbottle } from '../datautils/index.js';
import { mergeDataflows } from '../../../utils/leafdataflow.js';

const _leafspelldef = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // do initialize the leafnode logic as per the currently connected leaf graph lambda context 
        //const _lambdacontextlut = nodelambda;
        //const node_setup = lambdajsArgs.default({default: lambdalambdafunc});
        //
        console.error("LEAF Error: leafspelldef does not have any dataflow-plane-scoped functions.")
        return (input$Arr, controlflow$obj) => { // leaf dataflow identity function that does nothing
            return {...mergeDataflows(input$Arr), _control: controlflow$obj}; // do nothing
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // reduce any contextuallambda first
        const lambdalambdalist = nodelambda.filter(_=>lambdactrl.gos.etaTree.graphcomponents.components.lut[_].scope === 'lambda');
        const lambda_default = nodelambda.filter(_=>lambdactrl.gos.etaTree.graphcomponents.components.lut[_].scope === 'dataflow');

        const reduced_lambdalambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: lambdalambdalist, contextuallambda, etaTree: lambdactrl.gos.etaTree, addnodelut: true, metadata: {codebase: "leafspelldef.js", context: "reduced_lambdalambda_obj"}});

        const reduced_defaultlambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: lambda_default, contextuallambda, etaTree: lambdactrl.gos.etaTree, metadata: {codebase: "leafspelldef.js", context: "reduced_defaultlambda_obj", spellname: refnodedata.leaf.logic.args.spellname}});

        //const filtered_lambdalambda_obj = Object.keys(reduced_lambdalambda_obj).reduce((filtered, key) => {
        //    if (key !== 'contextual')
        //},{});
        const filter_nodelut = (obj) => obj ? Object.keys(obj).reduce((filtered, key) => {
            if (key !== '_nodelut') {
                if (typeof obj[key] === 'object')
                    filtered[key] = filter_nodelut(obj[key])
                else // obj should be of type function
                    filtered[key] = obj[key];
            }
            return filtered;
        }, {}) : {};
        let reduced_lambda_obj = {
            ...filter_nodelut(reduced_lambdalambda_obj), 
            ...filter_nodelut(reduced_defaultlambda_obj), 
        };
        return reduced_lambda_obj; //lambda_lut;
    },
    methods: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // reduce any contextuallambda first
        const lambdalambdalist = nodelambda.filter(_=>lambdactrl.gos.etaTree.graphcomponents.components.lut[_].scope === 'lambda');
        const lambda_default = nodelambda.filter(_=>lambdactrl.gos.etaTree.graphcomponents.components.lut[_].scope === 'dataflow');

        //const reduced_contextlambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: [], etaTree: lambdactrl.gos.etaTree, addnodelut: true, metadata: {codebase: "leafspelldef.js", context: "reduced_contextlambda_obj"}});
        const reduced_lambdalambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: lambdalambdalist, contextuallambda, etaTree: lambdactrl.gos.etaTree, addnodelut: true, metadata: {codebase: "leafspelldef.js", context: "reduced_lambdalambda_obj"}});

        const reduced_defaultlambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: lambda_default, contextuallambda, etaTree: lambdactrl.gos.etaTree, metadata: {codebase: "leafspelldef.js", context: "reduced_defaultlambda_obj", spellname: refnodedata.leaf.logic.args.spellname}});

        const filter_nodelut = (obj) => obj ? Object.keys(obj).reduce((filtered, key) => {
            if (key !== '_nodelut') {
                if (typeof obj[key] === 'object')
                    filtered[key] = filter_nodelut(obj[key])
                else // obj should be of type function
                    filtered[key] = obj[key];
            }
            return filtered;
        }, {}) : {};
        let reduced_lambda_obj = {
            ...filter_nodelut(reduced_lambdalambda_obj), 
            ...filter_nodelut(reduced_defaultlambda_obj), 
        };
        return reduced_lambda_obj; //lambda_lut;
    },
};

export { _leafspelldef };
