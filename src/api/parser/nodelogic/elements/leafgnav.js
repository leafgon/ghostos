import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter } from 'rxjs/operators';
import { _leafbottle, _leafunbottle } from '../datautils/index.js';
//import { combineInputStreams } from '../../leaf';

/*
 * _leafgnav() is a runtime function for the LEAFgraph node of logic type 'leafgnav.
 * it is used to register a list of navigable nodes passed to the leaf node 
 * via its incoming data flow, for visualization in gnav.js. The data registration involves 
 * inter-componenet data communication via useLEAFIOapi from ghostOS. The leaf node simply
 * handles the preprocessing/filtering of incoming data and transmiting the data over useLEAFIOapi.
 * 
 * @nodeconfig: reserved for configuring the leaf node, currently not in use (26 Feb 2022)
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying data as defined by the lambda component in LEAF. 
 * The lambdaFunc, if defined, represents the 'Model' of the MVI framework, where the user clicking on
 * the corresponding navigable node represents the 'Intent' of MVI. The outcome of executing the lambdaFunc
 * needs to be reflected back to the user somehow, usually by means of gnav.js, whose effect in turn constitutes 
 * the View of MVI.
 * 
 * Upon the leafgnav node logic executing, its effect in the rhelm of gnav.js is expected to take place. 
 * Currently unsure whether it would be useful to have anything returned out of this leaf node post execution.
 * 
 * TBD:
 * @graphContextual: n/a 
 * or
 * @graphContextual: a parsed runtime lambda function connected to the graph of which the current node is a member
 * 
 * bottles the node look out for in the dataflow plane for filtering data of interest: 
 * '_leafdeckspade' & '_leafdeckheart'
 */
const _leafgnav = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});

        const _defaultLambda = ('_default' in reduced_lambda_obj) ?
            (input$) => reduced_lambda_obj._default([input$]) :
            (input$) => input$;

        // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
        // if it supported an array of keys to be unbottled in one go.
        //const filterDataOfInterest = _leafdataUnbottle({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, contextuallambda});
        // lambdactrl.user.leaf.logic.args.bottlekey || lambdadata.lambdaFunc
        //const bottleUp = _leafdataBottle({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, contextuallambda});

        // spark_dev_note: The respective leaf nodes of leafdeckspade and leafdeckheart operate on their own on an individual leaf node basis.
        // this would mean that incoming data arrive in individual bottles in the dataflow plane. 
        // it is therefore imperative that each individual bottle is unbottled and the resulting unbottled content flow
        // be combined accordingly (here using 'zipLatest' leaf combine operator) to produce a single input stream combinedInput$.
        const filterDeckSpadeBottles = _leafunbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckspade'}}}}, nodelambda: [], contextuallambda});
        const filterDeckHeartBottles = _leafunbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckheart'}}}}, nodelambda: [], contextuallambda});
        // _leafpopupview is a leaf standard bottle to carry data for programming the user intent in a radial popup button in 3d-gnav regarding launching a popup window
        // and filterPopupView() filters (in the dataflow plane) any _leafpopupview bottles 
        const filterPopupViewBottles = _leafunbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafpopupview'}}}}, nodelambda: [], contextuallambda});

        // spark_dev_note: some words on what "leaf standard bottle" is:
        // leaf has two data domains (data and lambda) and the data data domain consists of a dataflow plane while 
        // the lambda data domain consists of a control plane and a data plane. the data plane (of lambda domain) carries user-defined lambdaFunc and/or graphContextual
        // the control plane (of lambda domain) carries user-defined node config arguments as well as a gos-defined directory of inter-component comms channels
        // "bottle" is a leaf standard means of carrying data in the dataflow plane. 
        // standard bottles can be instantiated using the leaf logic (i.e. the bottling leaf node) to bottle data, 
        // for example using the standard key '_leafpopupview' or other standard keys all prefixed with '_leaf'.
        // you can input '_leaf' prefixed key names as you would input any other bottle keys in the bottling node. 
        // a drop-down list of standard key names could be made available in bottling nodes down the road.
        // bottles can flow only through the dataflow plane, hence only through the data data domain, 
        // and the flow is represented in leaf editor as going in the direction from left to right. 
        // top to bottom is the representation in leaf editor of the direction of logical flow 
        // in the lambda data domain.
        // (possible future expansion would support auto-layout algorithms that can cater for various user preferences).

        //const nodeInputGnavConfig = {combineOperator: 'zipLatest', isIndexed: false, metamodel: LEAFIOmetamodel.breezyforest}; // get node specific input stream combining config, default is {}
        const nodeInputGnavConfig = {combineOperator: 'zipLatest', isIndexed: false}; // get node specific input stream combining config, default is {}
        //const runtimeLEAFjsFunc = func$LUT[nodeuuid](lambdacomponentRuntimeFunc);
        const combineNodeDataGnavStreams = undefined; //combineInputStreams(nodeInputGnavConfig);

        return (flowinput$) => {
            const incomingSpade$ = filterDeckSpadeBottles(flowinput$);
            const incomingHearts$ = filterDeckHeartBottles(flowinput$);
            const incomingPopupIntents$ = filterPopupViewBottles(flowinput$);

            // work on gnav input dataflow (aka the moon and the orbital)
            const combinedGnavInput$ = combineNodeDataGnavStreams([incomingSpade$, incomingHearts$]); 
            const gnavflowoutput$ = combinedGnavInput$.pipe( 
                map((_data) => { // a window for debugging
                    console.log(_data);
                    return _data;
                }),
                map(node_input=>{
                    let node_output = null; 
                    // execute node level logic and optionally set node_output here

                    // go ahead with inter-component communication via using the dataflowplane/appview channels to communicate with gnav react component's useLEAFIOapi 
                    // spark_dev_note: currently, masterSubsDirectory doesn't get passed down here to this breezyforest node definition
                    // which is essential in establishing the inter-component communication necessary. 

                    console.log('node logic executed: ' + JSON.stringify(node_output));
                    return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
                })
            );

            // work on popup input dataflow (aka popup windows)
            const popupflowoutput$ = incomingPopupIntents$.pipe(
                map((_data) => { // a peephole
                    console.log(_data);
                    return _data;
                }),
                map(node_input => {
                    // go ahead with inter-component communication via using the dataflowplane/appview channels to communicate with gnav react component's useLEAFIOapi 
                })
            );

            return gnavflowoutput$.pipe(filter(_entry=>_entry)); // filter out any null entries in the result array
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$) => { // a dataflow-scoped func per key
                const output$ = etafunc(input$);
                return output$;
            }
        });
        return lambda_lut;
    },
};

export { _leafgnav };