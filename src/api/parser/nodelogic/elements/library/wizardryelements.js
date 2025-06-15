import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta';
import { map, withLatestFrom, filter } from 'rxjs/operators';
import { _leafbottle } from '../datautils';
//import { red } from '@mui/material/colors';
import { mergeDataflows } from '../../../utils/leafdataflow';
import { from, of} from 'rxjs';
import { fetchMultiKeyedData } from '../../../utils/fetchnodedata';
import { _leafstdlib_dataflow_api } from '../../../metamodel';
import { v4 as uuid4 } from 'uuid';

const leafgon_url = process.env.LEAFGON_URL;

//const _leafdeckclub = ({logictoggle=false, deckname=''}={}, lambdaFunc=x=>x, graphContextual) => {}
const _leafpagequery = (() => {
    const leaf_apidef = _leafstdlib_dataflow_api("leafpagequery");
    return {
        dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
            // space for node type specific init prior to use
            // check for parsing error conditions
            if (!contextuallambda) { 
                throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                    `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
            }
            if (refnodedata.leaf.logic.args.elementconfig.leafnodename === 'Ingram')
                console.log('time to debug')
            const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

            // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
            // if it supported an array of keys to be unbottled in one go.
            //const filterDataOfInterest = _leafdataUnbottle({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, contextuallambda});
            // lambdactrl.user.leaf.logic.args.bottlekey || lambdadata.lambdaFunc
            const bottleUp = await _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, nodelambda: [], contextuallambda});

            return (flowinput$Arr, controlflow$obj) => {
                const {type, args} = refnodedata.leaf.logic;
                const loopidx = controlflow$obj._config?.loopidx;
                const _defaultLambda = ('_default' in reduced_lambda_obj) ?
                    (input$Arr, _controlflow$obj) => {
                        const clubctrlflow$obj = {..._controlflow$obj};
                        if (loopidx >= 0) // add loopidx ctrl config data to whatever ctrl data being passed in normally via hammer action in sysmenu.js
                            clubctrlflow$obj._config.loopidx = loopidx;
                        clubctrlflow$obj._config.clubrefnode = refnode;
                        return {...reduced_lambda_obj._default(input$Arr, clubctrlflow$obj), _control: clubctrlflow$obj}
                    } :
                    (input$Arr, _controlflow$obj) => {
                        console.log("start debugging");
                        return {...mergeDataflows(input$Arr), _control: _controlflow$obj};
                    };
                if (flowinput$Arr.length > 0) {
                    const flowinput$obj = mergeDataflows(flowinput$Arr);
                    const flowoutput$ = flowinput$obj._stream.pipe(
                        map((_data) => { // a window for debugging
                            if (refnode.split(4) === 'f588')
                                console.log(_data);
                            return _data;
                        }),
                        map(node_input=>{
                            let node_output = null; 
                            //console.log('input$ ' + JSON.stringify(input$));
                            //console.log('a leafdeckclub processed for node ' + deckname + ' with toggle: ' + logictoggle + ', flowinput: ' + node_input);
                            //console.log('input: '+ node_input + ' ' + Date.now() + ' ' + JSON.stringify(node_data)); 
                            // execute node level logic and optionally set node_output here
                            node_output = {
                                type: 'leafdeckclub',
                                uuid: uuid4(), // random uuid 
                                name: fetchMultiKeyedData(leaf_apidef.editorconfig.namedatakey, args),//refnodedata.leaf.logic.args.deckname, // refactor to have deckname concatenated with an index e.g. 'Park1',
                                svgicon: leafgon_url+'/icons/hardware/laptop_mac/materialicons/24px.svg', // refactor to have this set in LEAF
                                description: '{description}', // refactor to have this set in LEAF
                                lambdas: { // a dictionary of lambda functions belonging to the 1st tier node
                                    // refactor to have this set using the argument lambdaFunc
                                    default: 'defaultLambda', // or undefined,
                                    defaultLambda: _defaultLambda,
                                    bro: (input$) => {return input$}, // somehow break down lambdaFunc to have an arbitrary number of lambda functions destructured here
                                },
                            };

                            console.log('node logic executed: ' + JSON.stringify(node_output));
                            return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
                        })
                    );
                    const output$Arr = [{_stream: flowoutput$.pipe(filter(_entry=>_entry))}];
                    return {...bottleUp(output$Arr, controlflow$obj), _control: controlflow$obj}; 
                }
                else {
                    const flowoutput$ = controlflow$obj._stream.pipe(map(
                        controlsignal => {
                            if (controlsignal) {
                                const node_output = {
                                    type: 'leafdeckclub',
                                    uuid: uuid4(), // refactor to have this deterministically generated 
                                    name: fetchMultiKeyedData(leaf_apidef.editorconfig.namedatakey, args), //refnodedata.leaf.logic.args.deckname, // refactor to have deckname concatenated with an index e.g. 'Park1',
                                    svgicon: leafgon_url+'/icons/hardware/laptop_mac/materialicons/24px.svg', // refactor to have this set in LEAF
                                    description: '{description}', // refactor to have this set in LEAF
                                    lambdas: { // a dictionary of lambda functions belonging to the 1st tier node
                                        // refactor to have this set using the argument lambdaFunc
                                        default: 'defaultLambda', // or undefined,
                                        defaultLambda: _defaultLambda,
                                        bro: (input$) => {return input$}, // somehow break down lambdaFunc to have an arbitrary number of lambda functions destructured here
                                    },
                                };
                                return node_output;
                            }
                        }
                    ))
                    //return bottleUp([{_stream: from([node_output])}]);
                    return {...(bottleUp([{_stream: flowoutput$}], controlflow$obj)), _control: controlflow$obj};
                }
            };
        },
        lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
            // space for node type specific init prior to use
            // note the cross over in the roles of nodelambda and contextuallambda 
            const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
            const lambda_lut = {};
            Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
                lambda_lut[key] = (input$Arr) => { // a dataflow-scoped func per key
                    const output$obj = etafunc(input$Arr, controlflow$obj);
                    return {...output$obj, _control: controlflow$obj};
                }
            });
            return lambda_lut;
        },
    };
})();

export { _leafdeckclub };
