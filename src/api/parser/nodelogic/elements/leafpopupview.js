import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter } from 'rxjs/operators';
import { _leafbottle, _leafunbottle } from '../datautils/index.js';

const leafgon_url = process.env.LEAFGON_URL;

//const _leafpopupview = ({logictoggle=false, deckname=''}={}, lambdaFunc=x=>x, graphContextual) => {}
const _leafpopupview = {
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

        //const filterDataOfInterest = _leafdataUnbottle({bottlekey:'_leafdeck'});
        const bottleUp = _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafpopupview'}}}}, nodelambda: [], contextuallambda});

        return (flowinput$Arr) => {
            const flowoutput$ = flowinput$Arr.pipe( 
                map((_data) => { // a window for debugging
                    console.log(_data);
                    return _data;
                }),
                map(node_input=>{
                    let node_output = null; 
                    //console.log('input$ ' + JSON.stringify(input$));
                    //console.log('a leafpopupview processed for node ' + deckname + ' with toggle: ' + logictoggle + ', flowinput: ' + node_input);
                    //console.log('input: '+ node_input + ' ' + Date.now() + ' ' + JSON.stringify(node_data)); 
                    // execute node level logic and optionally set node_output here
                    // put together a data object as required by gnav's popup view to function.

                    // for test node_output only, however much of what it's supposed to do is meaningless here, as it was copied over from _leafdeckheart() {
                    node_output = {
                        type: 'leafpopupview',
                        uuid: '308bd84f-3af2-478e-ae35-b2842a9bd3a1', // refactor to have this deterministically generated 
                        //name: deckname, // refactor to have deckname concatenated with an index e.g. 'Park1',
                        svgicon: leafgon_url+'/icons/hardware/laptop_mac/materialicons/24px.svg', // refactor to have this set in LEAF
                        description: 'coolest popupview in LEAF', // refactor to have this set in LEAF
                        lambdas: { // a dictionary of lambda functions belonging to the 1st tier node
                            // refactor to have this set using the argument lambdaFunc
                            default: 'defaultLambda', // or undefined,
                            defaultLambda: _defaultLambda,
                            bro: (input$) => {return input$}, // somehow break down lambdaFunc to have an arbitrary number of lambda functions destructured here
                        },
                    };
                    // end of test }

                    console.log('node logic executed: ' + JSON.stringify(node_output));
                    return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
                })
            );
            return bottleUp(flowoutput$.pipe(filter(_entry=>_entry))); // filter out any null entries in the result array
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

export { _leafpopupview };