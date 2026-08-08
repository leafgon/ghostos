import { map } from "rxjs/operators";
import { of } from "rxjs";
import { mergeDataflows } from "../../../utils/leafdataflow.js";
import { etaReduceLambdaGraphs } from "../../eta.js";
//import { _leafLISPHelpText } from './leaflisphelp';
import { executeLEAFLogic } from "../../leaf.js";

// convert json into leaflisp

//const parseLEAFlispObjToJson = (x) => {
//    const inputtype = typeof(x);
//    return (
//        (inputtype !== 'object' ?
//            x : // base js type
//            (!(x instanceof PLBase) ?
//                (x) : // a non-PLBase js object type
//                ((x instanceof PLHashMap) ?
//                    (
//                        //parseLEAFlispObjToJson(x.toJSON())
//                        x.toJSON()
//                    ) :
//                    (
//                        isPLNumberTypeInstance(x) ?
//                        (x.toJS()) :
//                        ()
//                    )
//                )
//            )
//        )
//    );
//}

/*
 * _leaflisp() is a runtime function for the LEAFgraph node of logic type 'leaflisp'
 * @lispexpression: a LEAFlisp expression in a string
 * @lambdaFunc: currently, the lambda function connected to the current node is always expected to be null
 * as the node-level lambdaFunc is not permitted for this type of node yet.
 * @graphContextual: is NOT to be used for this node type either, hence is always expected to be null.
 */
//const _leaflisp = ({lispexpression=''}={}, lambdaFunc, graphContextual) => {}
const _leafconfig = {
  dataflow:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      //(inputargs) => {}
      //const {
      //    lambdactrl, //: {gos: {subsDirectory}, user: {lispexpression=''}},
      //    lambdadata  //: {lambdaFunc=x=>x, graphContextual}
      //}=inputargs;
      // spark_dev_note: The game plan down the road, possibly part of breezyforest, is to add support
      // for lambdaFunc in LEAFlisp expressions. Need to work on potential usage scenarios first.

      //const refnode_logic = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
      //const runtimeLEAFlisp = processLEAFlisp(refnodedata.leaf.logic.args.lispexpression);
      await etaReduceLambdaGraphs({
        refnode,
        nodelambda,
        contextuallambda,
        etaTree: lambdactrl.gos.etaTree,
      });

      return (flowinput$Arr, controlflow$obj) => {
        const flowinput$obj = mergeDataflows(flowinput$Arr);
        //const flowoutput$ = graphContextual(flowinput$);
        //return flowoutput$;
        if (flowinput$obj && "_stream" in flowinput$obj) {
          const flowoutput$ = flowinput$obj._stream.pipe(
            map((node_input) => {
              // node_input is expected to be an array, the calling function, parseLEAFNode (leaf.js) ensures this
              return node_input;
            }),
          );
          return { _stream: flowoutput$, _control: controlflow$obj };
        } else {
          // if in-flow is undefined then the lisp expression functions as a constant
          return { _stream: of([]), _control: controlflow$obj };
        }
      };
    },
  lambda:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      // space for node type specific init prior to use
      const lambda_lut = {};
      if (nodelambda.length > 0) {
        const reduced_lambda_obj = await etaReduceLambdaGraphs({
          refnode,
          nodelambda,
          contextuallambda,
          etaTree: lambdactrl.gos.etaTree,
        });
        lambda_lut[refnodedata.leaf.logic.type] = { ...reduced_lambda_obj }; // label the eta reduced obj
      } else {
        lambda_lut[refnodedata.leaf.logic.type] = {}; // label an empty object
      }
      return lambda_lut;
      ////const refnode_logic = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
      //console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
      //    `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot `+
      //    'be defined as a lambda-scoped node.');
      //return (input$Arr, controlflow$obj) => {
      //    const input$obj = mergeDataflows(input$Arr);
      //    return {...input$obj, _control: controlflow$obj};
      //}
    },
  methods:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      const reduced_lambda_obj = await etaReduceLambdaGraphs({
        refnode,
        nodelambda,
        contextuallambda,
        etaTree: lambdactrl.gos.etaTree,
      });
      return {
        config: {
          getConfigData: async () => {
            const configDataGen =
              "_default" in reduced_lambda_obj ? reduced_lambda_obj._default : undefined;
            const configData = configDataGen ? await executeLEAFLogic(configDataGen, [], {}) : {};

            return configData;
          },
        },
      };
    },
};

export { _leafconfig };
