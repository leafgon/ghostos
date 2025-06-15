import { Subject, BehaviorSubject, combineLatest, firstValueFrom, of, merge } from "rxjs";
import { switchMap, map, withLatestFrom, filter } from 'rxjs/operators';
import Handlebars from "handlebars";

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
//import { exitDataBus } from "../../../../utils/leafdataflow.js";
import { isBottle } from "../../../predicates.js";
import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { doBottle, doUnbottle } from "../../datautils/bottling.js";

//import Form from '@rjsf/core';
//import { createElement } from "react";
//import { createRoot } from 'react-dom/client';


const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in text.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/text.js"}, {});
const cachekeys = {
    TEMPLATE: "_html_template",
};
/*
 * spark_dev_note: 25/Apr/2023
 * all leaflogic and datalogic functions must be designed to conform to the following spec, 
 * in order to make sure of the inter-operability of newly developed leaf elements 
 * in breezyforest.
 * 
 * leaflogic lives in the rx flow domain, hence is an ideal function to deal with
 * any data i/o existing in that domain. Data in the reactive stream domain is accessable via 
 * invoking leaf lambda functions, normally bearing the function argument signature of ([input$Arr, ctrlflow$obj]), 
 * or via calling any functions or rx inline pipe-map that would provide the logic for statically 
 * manipulating data flown through any locally accessable rx streams of interest. 
 * Please note the convention of variable names post-scripted with the dollar sign ($), denoting the handles for 
 * respective data streams.
 * 
 * datalogic lives in the static data domain. How data i/o happens in this domain is not directly compatible with the stream domain.
 * the two optional datalogic functions, pre and post, are used to "statically" work on data, in terms of taking data input, 
 * performing data transformation/read/write operations, and returning data output, at two temporal data points, respectively 
 * coinciding with the time before (pre) and after (post) the incidence of data flowing through the leaflogic stream domain.
 * 
 */
const initElementInterface = (_stream_cache) => {
    const _outflow_data$ = new Subject(); 
    const elementioInput$ = new Subject();
    const template_parse_sync$ = new Subject();

    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    //const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
    //const margingen = (('margin' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.margin)) ? reduced_lambda_obj.margin._default : undefined;
    //const fieldwidthgen = (('fieldwidth' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.fieldwidth)) ? reduced_lambda_obj.fieldwidth._default : undefined;
    //const templategen = (('template' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.template)) ? reduced_lambda_obj.template._default : undefined;
    const templategen = ('_default' in reduced_lambda_obj) ? reduced_lambda_obj._default : undefined;
    const issingle = ('single' in reduced_lambda_obj) ? true : false;

    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/form.js",
        ..._stream_cache
    };

    // handlebars template source stream
    const ctrl_accio_bottle = doBottle('accio', 'ctrl_accio');
    const data_accio_bottle = doBottle('accio', 'data_accio');
    const template$obj =  (templategen ? 
        driveDataflowByCtrlflow(
            {_stream: of(ctrl_accio_bottle)}, [{_stream: of(data_accio_bottle)}], undefined, node_context, 
            {
                leaflogic: templategen,
                datalogic: {post: (_data) => {
                    //_stream_cache[ElemCacheKeyLUT.prompt.UIDEFS] = _data;
                    return _data;
                }}
            }
        ) : 
        {_stream: of(""), _control: {_stream: of(ctrl_accio_bottle)}}
    );
    // compile handlebars template
    _stream_cache[ElemCacheKeyLUT.html.TEMPLATE] = undefined;
    firstValueFrom(template$obj._control._stream.pipe(withLatestFrom(template$obj._stream))).then(_combined_in => {
        const data_type = typeof _combined_in[1];
        if (data_type === "string")
            _stream_cache[ElemCacheKeyLUT.html.TEMPLATE] = {_default: Handlebars.compile(_combined_in[1])};
        else if (data_type === "object") {
            const template_obj = {};
            Object.entries(_combined_in[1]).map(([_key, _val]) => {
                const compiled_str = [_val].flat().map(_curval=>{
                    if (typeof _curval === "string")
                        return _curval; //Handlebars.compile(_curval)
                    return undefined;
                }).filter(_=>_!==undefined).join("\n");
                if (compiled_str !== "")
                    template_obj[_key] = Handlebars.compile(compiled_str);
            });

            if (Object.keys(template_obj).length > 0)
                _stream_cache[ElemCacheKeyLUT.html.TEMPLATE] = template_obj;
        }
        Handlebars.registerHelper('json', function(context) {
            function jsonnum_replace(key, value) {
                const value_type = typeof value;
            
                //console.log("jsonnum_repl: ", key, value, value_type);
            
                if (value_type === "string") {
                    // Extract a real number from a string
                    const numberRegexG = /^\{((?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|))\}$/;
            
                    const re_match = value.match(numberRegexG); // returns ['3.14']
            
                    if (re_match !== null) {
                        const change = Number(re_match[1]);
                        return change;
                    }
                    return value;
                }
                else if (value_type === "object") {
                    if (Array.isArray(value)) {
                        return value.map((_val, _idx) => {return jsonnum_replace(_idx, _val)});
                    }
                    else {
                        const newobj = Object.assign({}, ...(Object.entries(value).map(([_key, _val]) => {
                          //console.log("partial newobj:", _key, _val);
                          return {[_key]: jsonnum_replace(_key, _val)}
                        })));
                        //console.log("newobj:", JSON.stringify(newobj));
                        return newobj;
                    }
                }
            
                return value;
            }
              
            return JSON.stringify(context, jsonnum_replace);
        });
        template_parse_sync$.next();
    });

    // put any static data preprocessing logic applied to all incident data, 
    // flown on each incoming edge stream.
    // data preprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_pre = (data_in) => {
        return data_in;
    };

    const _do_datalogic = (data_in, _template_fn) => {

//        <script src='https://cdnjs.cloudflare.com/ajax/libs/react-jsonschema-form/1.8.1/react-jsonschema-form.min.js'></script>
//        <script crossorigin src='https://unpkg.com/react@18/umd/react.production.min.js'></script>
//        <script crossorigin src='https://unpkg.com/react@18/umd/react.development.js'></script>
//        <script crossorigin src='https://unpkg.com/react@17.0.2/umd/react.development.js'></script>
//        <script crossorigin src='https://unpkg.com/react-dom@17.0.2/umd/react-dom.development.js'></script>
//  <link href='https://leas3.ams3.cdn.digitaloceanspaces.com/static/vendor/bootstrap/css/bootstrap.min.css' rel='stylesheet'>
                //const { norender } = getSubmitButtonOptions(uiSchema);
                //if (norender) {
                //  return null;
                //}
        const form_template_common = (`
        <!-- Bootstrap core CSS -->
        <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' rel='stylesheet' integrity='sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH' crossorigin='anonymous'>
        <script crossorigin src='https://unpkg.com/react@17.0.2/umd/react.development.js'></script>
        <script crossorigin src='https://unpkg.com/react-dom@17.0.2/umd/react-dom.development.js'></script>
        <script src='https://unpkg.com/@babel/standalone@7.23.10/babel.min.js'></script>
        <script src='https://unpkg.com/@rjsf/core@4.2.3/dist/react-jsonschema-form.js'></script>
        `);
        const form_template_style = (`
        <style>
            .unicornbutton {
                background-image: url('https://leas3.ams3.cdn.digitaloceanspaces.com/static/lax/assets/button-bg.jpg');
                width: 250px;
                height: 70px;
                background-size: 160px;
                color: white;
                font-weight: 800;
                text-align: center;
                line-height: 70px;
                font-size: 30px;
                text-decoration: none;
                border-radius: 20px;
                z-index: 100;
                pointer-events: all;
                cursor: pointer;
            }
        </style>
        `);
        const form_template_script = `
        <script type='text/babel'>
            const Form = JSONSchemaForm.default;
            const schema = {
                title: 'react-jsonschema-form demo',
                type: 'object',
                required: ['name', 'email'],
                properties: {
                    name: {type: 'string', minLength: 3},
                    email: {type: 'string'},
                    dob: {type: 'string'},
                    age: {type: 'number'},
                    thing: {type: 'string'},
                    other: {type: 'string'},
                }
            };
            const uiSchema = {
                email: {
                    'ui:options': {
                        inputType: 'email'
                    }
                },
                dob: {
                    'ui:widget': 'alt-date',
                    'ui:options': {
                        yearsRange: [1980, 2030],
                        hideNowButton: true,
                        hideClearButton: true,
                    },
                },
            };
        
            function Tpl(props) {
                const {id, label, required, children} = props;
                return (
                <div className='myfield'>
                    <label htmlFor={id}>{label}{required ? '*' : null}</label>
                    {children}
                </div>
                );
            };

            function dosubmit({ formData }, e) {
                doelementio({_bname: '${_stream_cache[ElemCacheKeyLUT.REFNODE].slice(0,8)}', _content: formData, _label: {refnode: '${_stream_cache[ElemCacheKeyLUT.REFNODE]}'}});
            };

            function SubmitButton(props) {
                const { uiSchema } = props;
                return (
                  <button type='submit'>
                    Yadda
                  </button>
                );
              }
        
            ReactDOM.render(
                (<Form onSubmit={dosubmit} className='row' schema={schema} uiSchema={uiSchema} FieldTemplate={Tpl} liveValidate >
                <div style={{marginBottom: '70px'}}>
                  <button className='unicornbutton' type='submit'>
                    Yadda
                  </button>
                </div>
                </Form>
                ),
                document.getElementById('${_stream_cache[ElemCacheKeyLUT.REFNODE]}')
            );
        </script>
        `;
        const form_template_body = `
        <div id='${_stream_cache[ElemCacheKeyLUT.REFNODE]}'></div>
        `;

        const minifyString = (_str) => _str.replace(/(\r\n|\n|\r)/gm, "").replace(/(\s+)/gm, " ");
        const bname = _stream_cache[ElemCacheKeyLUT.REFNODE].slice(0,8); // name the bottle using first 8 chars of the refnode uuid
        const stylekey = (issingle ? 'form-style' : 'form-style-'+bname );
        const scriptkey = (issingle ? 'form-script' : 'form-script-'+bname );
        const bodykey = (issingle ? 'form-body' : 'form-body-'+bname );
        return doBottle(bname, 
                {
                    'form-common': minifyString(form_template_common), 
                    [stylekey]: minifyString(form_template_style), 
                    [scriptkey]: minifyString(form_template_script), 
                    [bodykey]: minifyString(form_template_body)
                },
                {uuid: _stream_cache[ElemCacheKeyLUT.REFNODE]});

        /*
        //const data_out = data_in;
        if (_template_fn !== undefined) {
            const _data_out = [data_in].flat().sort((a,b)=>{
                const labela=a._label?.tag?.toLowerCase(); 
                const labelb=b._label?.tag?.toLowerCase(); 
                if (labela > labelb)
                    return 1;
                else if (labela < labelb)
                    return -1;
                return 0;
            }).map(_datum_in => {
                if (isBottle(_datum_in)) {
                    const valid_data_in = doUnbottle("*", _datum_in);
                    const valid_data_bname = _datum_in._bname;
                    const concat_data_out = [valid_data_in].flat().map(_valid_data_in => {
                        if (_valid_data_in && valid_data_bname in _template_fn) 
                            return _template_fn[valid_data_bname](_valid_data_in);
                        else if (_valid_data_in && "_default" in _template_fn)
                            return _template_fn["_default"](_valid_data_in);
                        else if (typeof _valid_data_in === "string")
                            return _valid_data_in;
                        return undefined;
                    }).filter(_=>_!==undefined).join("\n");

                    return concat_data_out;
                }
                return undefined; 
            }).filter(_=>_!==undefined);

            const processed_data = _data_out.join("\n").replace(/(\r\n|\n|\r)/gm, "");

            return processed_data; // of type "string"
        }

        return data_in; // unprocessed
        */
    };

    const _leaflogic = (input$objArr, controlflow$obj) => {

        const _ctrl_out$ = controlflow$obj._stream.pipe(
            //withLatestFrom(template$obj._stream),
            withLatestFrom(...input$objArr.map(_input$obj=>_input$obj._stream)),
            switchMap(_combined_in => {
                const relay_ctrl$ = new BehaviorSubject(_combined_in[0]);
                const relay_data$ = new BehaviorSubject(_combined_in[1]);
                return (_stream_cache[ElemCacheKeyLUT.html.TEMPLATE] ? 
                    combineLatest(relay_ctrl$, merge(relay_data$, elementioInput$)) : 
                    template_parse_sync$.pipe(withLatestFrom(relay_ctrl$, merge(relay_data$, elementioInput$)),map(_parse_synced_in=>_parse_synced_in[1]))
                );
            }),
            map(_combined_in => {
                const _template_fn = _stream_cache[ElemCacheKeyLUT.html.TEMPLATE];
                const _data_in = _combined_in[1];
                console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc

                if (isBottle(_data_in) && _data_in._bname === "elementio") {
                    // should _data_in reach here, they must originate from the iframe via the callback function defined below bottled in "screenio"
                    _outflow_data$.next(_data_in); // send them onto the output stream of the html element node.
                    return _combined_in[0]; // relay ctrl signal
                }
                else if (_template_fn !== undefined) {
                    const node_output = _do_datalogic(_data_in, _template_fn);

                    //const node_output = formatElementFlowdata({
                    //    element: {
                    //        nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                    //        type: 'html',
                    //        componentdata: {
                    //            //etaTree: lambdactrl.gos.etaTree,
                    //            innerhtml: processed_html, //Array.isArray(data_in) ? data_in : [data_in],
                    //            callback: (iframe_msg) => {
                    //                elementioInput$.next(doBottle("elementio", iframe_msg));
                    //            },
                    //            //margin: marginval ? marginval[0] : 1,
                    //            //fieldwidth: fieldwidthval ? fieldwidthval[0] : '25ch', 
                    //            ..._stream_cache[ElemCacheKeyLUT.RTCONTEXT],
                    //        },
                    //    }
                    //}, "screenio");
                    _outflow_data$.next(node_output);

                    return _combined_in[0]; // relay ctrl signal
                }

                return undefined;
            }),
            filter(_=>_!==undefined)
        );

        return {_stream: _outflow_data$, _control: {_stream: _ctrl_out$}}
    };

    // put any static data postprocessing logic applied to all incident data, 
    // to be flown on the outgoing edge stream.
    // data postprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_post = (data_in) => {

        //const recognizedLambdaConstants = ['lambda', 'onsave', 'gspot']; // lambda as in "lambda plane"
        //const curLambdaKeys = Object.keys(reduced_lambda_obj);
        //const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));

        //const textsource = 'lambda' in reduced_lambda_obj ? 'lambda' : 'dataflow'; // dataflow as in "dataflow plane"

        //const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
        //const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;

        return data_in;
    };

    return {
        elementio$: elementioInput$,
        leaflogic: _leaflogic,
        datalogic: {
            pre: _datalogic_pre,
            post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props, cachekeys};