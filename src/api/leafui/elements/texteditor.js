// belated commit message: implemented "interactive mode" in using the texteditor with which a leaflisp node can be used for accepting user input, for instance.
//import ReactDOM from 'react-dom'
//import logo from './logo.svg';
import './texteditor.css';

//import ReactCodeMirror from '@uiw/react-codemirror';
//import CodeMirror from 'rodemirror';
//
//import { useCodeMirror } from '@uiw/react-codemirror';

//import {StreamLanguage} from '@codemirror/stream-parser';
//import {clojure} from "@codemirror/legacy-modes/mode/clojure";
////import {commonLisp} from "@codemirror/legacy-modes/mode/commonlisp";
////import { oneDark } from '@codemirror/theme-one-dark';
//import {basicSetup, EditorView} from "@codemirror/basic-setup";
//
////import {EditorView} from "@codemirror/view";
//import {EditorState, Compartment} from "@codemirror/state";
//import {tags, HighlightStyle} from "@codemirror/highlight"

//import {CodeMirror} from 'codemirror';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import commonlisp from 'codemirror/mode/commonlisp/commonlisp';
import clojure from 'codemirror/mode/clojure/clojure';
import 'codemirror/keymap/vim'; // as per https://stackoverflow.com/questions/15152675/using-codemirror-in-vim-mode
//import js from 'codemirror/mode/javascript/javascript';

import { useMemo, useEffect, useRef, useState } from 'react';

import { vim } from '../lib/texteditor/cm-vim/index.js'; // '../lib/texteditor/cm-vim';
import { setMultiKeyedData, fetchMultiKeyedData } from '../../utils/fetchnodedata';

import { v4 as uuid4 } from 'uuid';
import { SHA1 } from '../../utils/crypto';
import safeStringify from 'fast-safe-stringify';
import { executeLEAFLogic } from '../../parser/leaf';
import { parseJsonToLEAFlisp, runLEAFlispcode } from '../../parser/nodelogic/wizardry/leaflisp';
import { debounce } from 'lodash';
import { of, from, interval, mergeMap, take, map, timeout, catchError } from 'rxjs';
//import { debounce } from '../../utils/leafdataflow';

//const leaflispHighlightStyle = HighlightStyle.define([
//  {tag: tags.keyword, color: "#fc6"},
//  {tag: tags.comment, color: "#f5d", fontStyle: "italic"}
//]);
//const leaflispTheme = EditorView.theme({
//  "&": {
//    color: "white",
//    backgroundColor: "#034"
//  },
//  ".cm-animateFatCursor .cm-selectionBackground .cm-selectionLayer": {
//    color: "green",
//    backgroundColor: "#CCCCCC" 
//  },
//  ".cm-panel .cm-vim-panel .cm-panels .cm-panels-bottom": {
//    caretColor: "white",
//    backgroundColor: "#034"
//  },
//  ".cm-content": {
//    caretColor: "#fe9",
//    backgroundColor: "#977"
//  },
//  "&.cm-focused .cm-cursor": {
//    borderLeftColor: "#0e9"
//  },
//  "&.cm-focused .cm-selectionBackground, ::selection": {
//    backgroundColor: "#07f"
//  },
//  ".cm-gutters": {
//    backgroundColor: "#ffb",
//    color: "#ddd",
//    border: "none"
//  }, 
//}, {dark: true})
//
//const leaflispTheme2 = EditorView.theme({
//  ".cm-content": {
//    caretColor: "#eee",
//    backgroundColor: "#777",
//  },
//}, {dark: true})

//import { vim } from "@replit/codemirror-vim"
//const cm_vim = require('./lib/codemirror-vim');
/*
          <CodeMirror
            value='(def readmefirst (list "hello" "world"))'
            height="200px"
            theme={oneDark}
            extensions={[vim(), StreamLanguage.define(clojure)]} 
            onChange={(value, viewUpdate) => {
              console.log('value: ', value);
            }}
            commands={{save: saveCallback}}
          />
*/

function LEAFTextEditor(props) {
  //const extensions = useMemo(() => [basicSetup, oneDark, vim(), StreamLanguage.define(clojure)], []);
  //const extensions = useMemo(() => [basicSetup, oneDark, StreamLanguage.define(clojure)], []);
  //const extensions = useMemo(() => [vim(), leaflispTheme, leaflispHighlightStyle, StreamLanguage.define(commonLisp), basicSetup], []);
  //const extensions = useMemo(() => [vim(), oneDark, StreamLanguage.define(commonLisp), basicSetup], []);
  //const extensions = useMemo(() => [vim(), oneDark, StreamLanguage.define(commonLisp)], []);

  //console.log(basicSetup);
  const editor = useRef(undefined); 
  const editortext = useRef("");
  const inportdata = useRef(undefined);
  const textsource = useRef(undefined);
  const onsave = useRef(undefined);
  const editorSize = useRef({width: "100%", height: "100%"});
  const methodPromise = useRef(undefined);
  const lambdaLUT = useRef(undefined);
  const is_interactive = useRef(undefined);

  const [renderState, setRenderState] = useState(undefined);

  const renderAgain = () => {
      setRenderState(uuid4());
  };
  const {textsource: sourceoption, lambdarefnodedata, lambdasourceuuid, dataflowinput, graphdomain, graphappid, refnode, nodelambda, contextuallambda,} = props.componentdata; // componentdata from leafelement.js

  useEffect(() => {

    // spark_dev_note: MacOS has some quirky keyboard behavior making a key press hold to repeat an issue in Vim mode.
    // to get around this, run the following command line command on a prompt
    // $ defaults write -g ApplePressAndHoldEnabled -bool false
    const setupCodeMirror = (lambdafuncLUT=undefined) => {
        // now set up codemirror instance
        //fetchMultiKeyedData(editorconfig.current.keypath, editorconfig.current.node_data.leaf.logic.args) : "";
        const DEFAULT_BRACKETS = "()[]{}''\"\"";
        function buildKeymap(pairs) {
            var map = {name : "autoCloseBrackets"};
            for (var i = 0; i < pairs.length; i += 2) (function(left, right) {
                function maybeOverwrite(cm) {
                var cur = cm.getCursor(), ahead = cm.getRange(cur, CodeMirror.Pos(cur.line, cur.ch + 1));
                if (ahead != right) return CodeMirror.Pass;
                else cm.execCommand("goCharRight");
                }
                map["'" + left + "'"] = function(cm) {
                if (left == right && maybeOverwrite(cm) != CodeMirror.Pass) return;
                var cur = cm.getCursor(), ahead = CodeMirror.Pos(cur.line, cur.ch + 1);
                cm.replaceSelection(left + right, {head: ahead, anchor: ahead});
                };
                if (left != right) map["'" + right + "'"] = maybeOverwrite;
            })(pairs.charAt(i), pairs.charAt(i + 1));
            return map;
        };
        CodeMirror.defineOption("autoCloseBrackets", true, function(cm, val, old) {
            var wasOn = old && old != CodeMirror.Init;
            if (val && !wasOn)
                cm.addKeyMap(buildKeymap(typeof val == "string" ? val : DEFAULT_BRACKETS));
            else if (!val && wasOn)
                cm.removeKeyMap("autoCloseBrackets");
        });
        CodeMirror.commands.save = () => {
            const text_to_save = editor.current.getValue();
            console.log("cm save command issued", editortext.current);

            // update lisp expression
            const hash = editortext.current
            const texthash = SHA1(safeStringify(text_to_save));
            if (onsave.current) {
                if (texthash !== editortext.current.hash) // if worth saving by comparing the hash digest
                {
                    //textsource.current.methods.texteditor.setTextSource(text_to_save);
                    onsave.current.savefunc(text_to_save);

                    editortext.current = {
                        text: text_to_save,
                        hash: texthash
                    };
                }
                //const node_data = {
                //    ...editorconfig.current.node_data
                //};
                //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor

                //// keypath = ['lispexpression'] for leaflisp
                //setMultiKeyedData(editorconfig.current.keypath, node_data.leaf.logic.args, editortext.current); 
                //mutateUpdateNode({variables: {uuid: editorconfig.current.node_data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
            }
            else {
                console.warn("LEAF Warning: texteditor: saving text only updated the transient memory without an onsave func.");
                if (texthash !== editortext.current.hash) // if worth saving by comparing the hash digest
                {
                    //textsource.current.methods.texteditor.setTextSource(text_to_save);
                    editortext.current = {
                        text: text_to_save,
                        hash: texthash
                    };
                }
            }
            //let json_data = JSON.stringify(node_data).getBytes("UTF-8");
            //let enc_data = sjcl.codec.base64.fromBits(json_data);
            //let dec_data = sjcl.codec.base64.toBits(enc_data);
            //let enc_data = Base64.stringify(json_data);

            // spark dev note: currently it's unclear whether the graphql updateNode mutation can support partial update,
            // that is updating only a portion of the data instead of updating the whole lot. 
            // In the current implementation, it was assumed that "partial update" isn't supported, 
            // hence the smallest unit update here is to replace the entire node data on each update 
            // even if it would only involve partial change in a single field. 
            //mutateUpdateNode({variables: {uuid: data.leaduuid, label: data.label?data.label:'', data: btoa(JSON.stringify(node_data))}});
        };
        const cmplaceholder= document.getElementById("editorta"+refnode);
        const cm_instance = CodeMirror.fromTextArea(cmplaceholder, 
            {
                mode: 'clojure', 
                lineNumbers: true,
                smartIndent: false,
                autoCloseBrackets: false,
                keyMap: "vim",
                theme: "dracula",
                viewportMargin: Infinity,
                readOnly: false 
            }
        );
        cm_instance.setOption("extraKeys", {
            Tab: function(cm) {
                var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                cm.replaceSelection(spaces);
            },
            "Ctrl-G": function(cm) {
                debounce(() => {
                    // a key combo handler should be called here
                    const lispcode = cm.getValue();
                    console.log('Ctrl-G event: ', lispcode);
                    //const parsedlispcode = JSON.parse(lispcode);
                    editortext.current.text

                    let lispresult;
                    const _gRuntimeLEAFlisp = props.etaTree.hostEtaTree ? props.etaTree.hostEtaTree.gRuntimeLEAFlisp : props.etaTree.gRuntimeLEAFlisp;
                    const _etaTree = props.etaTree.hostEtaTree ? props.etaTree.hostEtaTree : props.etaTree;
                    if (inportdata.current) {
                        const wiredlispcode = `(def inport ${inportdata.current})${lispcode}`;

                        const [errcode, _lispresult] = runLEAFlispcode(wiredlispcode, refnode, _gRuntimeLEAFlisp);
                        lispresult = _lispresult;
                    }
                    else {
                        const [errcode, _lispresult] = runLEAFlispcode(lispcode, refnode, _gRuntimeLEAFlisp);
                        lispresult = _lispresult;
                    }

                    if (!is_interactive.current) {
                        if (lambdafuncLUT && 'gspot' in lambdafuncLUT && '_default' in lambdafuncLUT.gspot) {
                            console.log("executing the logic declared under the gspot with the output of the lispcode!");
                            //const save_ret = executeLEAFLogic(lambdafuncLUT.gspot._default, safeStringify(lispresult));
                            const save_ret = executeLEAFLogic(lambdafuncLUT.gspot._default, lispresult);
                            console.log(save_ret);
                        }
                        else {
                            console.log('LEAFlisp gspot result: ', lispresult);
                        }
                    }
                    else {
                        // generate flow traffic
                        _etaTree.leafio.elementioLUT[lambdasourceuuid].next(lispresult);
                    }
                }, 100)();
            }
        });
        editor.current = cm_instance;
        editor.current.getDoc().setValue(editortext.current.text);
        cm_instance.focus();
    }
    // textsource is either "lambda" | "dataflow"
    // keypath = ['lispexpression'] for leaflisp
    if (sourceoption === "lambda") {
        const lambdafuncLUTPromise = props.etaTree.lookupRuntimeLambdaLUT(graphdomain, graphappid, refnode, nodelambda, contextuallambda);
        methodPromise.current = props.etaTree.lookupLEAFNodeMethods(lambdasourceuuid, lambdarefnodedata);
        from([0]).pipe(
            //take(1),
            map( x => {
                console.log(x);
                return x;
            }),
            mergeMap( x => {
                return Promise.resolve(lambdafuncLUTPromise);
            }),
            mergeMap(async lut => {
                const methods = await Promise.resolve(methodPromise.current);
                is_interactive.current = methods.isinteractive;
                return Promise.resolve({lut, methods: methods});
            }),
            map(input => {
                const _lambdatextsource = {
                    nodeuuid: lambdasourceuuid,
                    methods: input.methods,
                };
                //textsource.current = _lambdatextsource;

                if (_lambdatextsource.methods.texteditor) {
                    onsave.current = {
                        savefunc: async (text_to_save) => {
                            _lambdatextsource.methods.texteditor.setTextSource(text_to_save); // setTextSource defined in the parser/nodelogic of the leafnode id'ed by lambdasourceuuid
                        }
                    };
                    const textatorigin = _lambdatextsource.methods.texteditor.getTextSource(); // getTextSource defined in the parser/nodelogic ... ditto
                    editortext.current = {
                        text: textatorigin,
                        hash: SHA1(safeStringify(textatorigin))
                    };
                }
                else {
                    //textsource.current = undefined;
                    console.warn("LEAF Warning: texteditor is being used without a textsource. Any text edits would not be saved.");
                }
                // now set up codemirror instance
                setupCodeMirror(input.lut);

                renderAgain();
            }),
        ).forEach(x => x);
        //Promise.resolve(methodPromise.current).then((methods) => {
        //    const _lambdatextsource = {
        //        nodeuuid: lambdasourceuuid,
        //        methods: methods,
        //    };
        //    //textsource.current = _lambdatextsource;

        //    if (_lambdatextsource.methods.texteditor) {
        //        onsave.current = {
        //            savefunc: async (text_to_save) => {
        //                _lambdatextsource.methods.texteditor.setTextSource(text_to_save); // setTextSource defined in the parser/nodelogic of the leafnode id'ed by lambdasourceuuid
        //            }
        //        };
        //        const textatorigin = _lambdatextsource.methods.texteditor.getTextSource(); // getTextSource defined in the parser/nodelogic ... ditto
        //        editortext.current = {
        //            text: textatorigin,
        //            hash: SHA1(safeStringify(textatorigin))
        //        };
        //    }
        //    else {
        //        //textsource.current = undefined;
        //        console.warn("LEAF Warning: texteditor is being used without a textsource. Any text edits would not be saved.");
        //    }
        //    // now set up codemirror instance
        //    setupCodeMirror();

        //    renderAgain();
        //});
    }
    else if (sourceoption === "dataflow") {
        //const _lambdatextsource = {
        //    nodeuuid: lambdasourceuuid,
        //    methods: methods,
        //};
        //textsource.current = _lambdatextsource;

        const lambdafuncLUTPromise = props.etaTree.lookupRuntimeLambdaLUT(graphdomain, graphappid, refnode, nodelambda, contextuallambda);
        Promise.resolve(lambdafuncLUTPromise).then((lambdafuncLUT) => {
            //const textatorigin = textsource.current.methods.texteditor.getTextSource(); 
            lambdaLUT.current = lambdafuncLUT;
            let parsed_inputdata;
            if ('json' in lambdafuncLUT) 
                parsed_inputdata = dataflowinput;
            else 
                parsed_inputdata = parseJsonToLEAFlisp(dataflowinput);

            inportdata.current = parsed_inputdata;
            editortext.current = {
                text: parsed_inputdata,
                hash: SHA1(safeStringify(parsed_inputdata))
            };

            if (lambdafuncLUT.onsave && '_default' in lambdafuncLUT.onsave) {
                onsave.current = {
                    savefunc: async (text_to_save) => {
                        //_lambdatextsource.methods.texteditor.setTextSource(text_to_save); // setTextSource defined in the parser/nodelogic of the leafnode id'ed by lambdasourceuuid
                        // need to invoke the onsave leaf lambda func passed in as argument
                        // by parsing the trio of refnode, nodelambda, contextuallambda in the etaTree.
                        // now invoke executeLEAFLogic using the onsave._default along with the text_to_save
                        // in a leafian fashion
                        const save_ret = await executeLEAFLogic(lambdafuncLUT.onsave._default, text_to_save);
                        console.log(save_ret);
                    }
                };

            }
            else {
                onsave.current = undefined;
                console.warn("LEAF Warning: texteditor is being used without an onsave func defined. Any text edits would not be saved.");
            }
            // now set up codemirror instance
            setupCodeMirror(lambdafuncLUT);
            renderAgain();
        });
    }
  }, []);

  //let language = new Compartment;
  //let tabSize = new Compartment;

  //let state = EditorState.create({
  //    extensions: [
  //      basicSetup,
  //      language.of(commonLisp())
  //      //vim(),
  //      //StreamLanguage.define(commonLisp)
  //    ]
  //});
  //let view = new EditorView({
  //  state,
  //  parent: document.getElementById('cmdiv'),
  //});
  //editor.current = view;
//  const { state, setState, view, setView, container, setContainer } = useCodeMirror({
//    container: editor.current,
////    options: {
//////      mode: 'sql',
//////      extraKeys: {
//////          "Ctrl-Space": getSnippets
//////      },
////      lineNumbers: false,
////      lineWrapping: true
////    },
//    height: props.dimensions.height,
//    extensions: extensions,
//  });

  const saveCallback = (editor) => { // CodeMirror's "save" callback function
    const textToWrite = editor.getValue();
    console.log("CM6 saved: ", textToWrite);
  };



  // as per https://devsebastian.medium.com/codemirror-everything-you-need-to-know-about-codemirror-f816f07ce2d3
  //let cmeditor = new CodeMirror.fromTextArea(
  //  document.findElementById("cmeditor"),
  //  {
  //    lineNumbers: false
  //  }
  //);

    useEffect(() => {
        //if (editor.current) {
        //    editor.current.getDoc().setValue(JSON.stringify(props.text));
        //}


        if (editor.current) {
            //Promise.resolve(methodPromise.current).then((methods) => {
            const cmplaceholder= document.getElementById("editorta"+refnode);
            const {offsetWidth, offsetHeight} = cmplaceholder.parentElement.parentElement.parentElement;
            editorSize.current.width = offsetWidth-5;
            editorSize.current.height = offsetHeight -30;
            if (editor.current.getDoc) { // cm instance not finished initializing as yet
                editor.current.setSize(offsetWidth-5, offsetHeight-30);
                //editor.current.setSize("100%", "100%"); //offsetWidth-5, offsetHeight-30;
                editor.current.refresh();
                //editortext.current = props.text;
                //editor.current.getDoc().setValue(editortext.current.text);
                //renderAgain();
            }
            //});
        }
    }, [editor.current, props.renderid, props.dimensions]);

    // spark_dev_note: 22/Mar/2023
    // #bugreport
    // a fault was detected: the HTML element textarea#editortaa50f20ee-66f4-4d61-a58d-9212a9e77cab,
    // locally stored in editor.current, does not have getDoc defined. 
    // This causes the following if block to skip
    // The ramification of such skipping is as yet unknown.
    // (#bugupdate: 22/Mar/2023) 
    //      the lack of getDoc is transient only lasting for subseconds.  
    //      when a CodeMirror instance is instanciated and assigned to editor.current,
    //      this useEffect block runs again to execute the if block, hence display the editor text, as per dataflowinput.
    //      this perhaps is the main cause of the text editor exhibiting the initial flicker before text is shown.
    useEffect(() => {
        if (editor.current.getDoc && sourceoption === "dataflow") {
            let parsed_inputdata;
            if (lambdaLUT.current && 'json' in lambdaLUT.current) 
                parsed_inputdata = dataflowinput;
            else 
                parsed_inputdata = parseJsonToLEAFlisp(dataflowinput);

            const data_hash = SHA1(safeStringify(parsed_inputdata));
            if (data_hash !== editortext.current.hash) {
                editortext.current = {
                    text: parsed_inputdata,
                    hash: data_hash
                };
                editor.current.getDoc().setValue(editortext.current.text);
            }
            else {
                editor.current.getDoc().setValue(editortext.current.text);
            }
        }

    }, [dataflowinput, editor.current]);
  //useEffect(() => {
  //  if (editor.current) {
  //    setContainer(editor.current);
  //    console.log(editor.current);
  //  }
  //}, [editor.current]);

  //useEffect(() => {
  //  if (state) {
  //    console.log(state);
  //    console.log('state useEffect()');
  //  }
  //}, [state]);

  //useEffect(() => {
  //  if (view) {
  //    console.log(view);
  //    console.log('view useEffect()');
  //  }
  //}, [view]);

//  let cminst = ReactDOM.render(
//          <CodeMirror
//            value='(def readmefirst (list "hello" "world"))'
//            height="200px"
//            theme={oneDark}
////            extensions={[vim(), StreamLanguage.define(clojure)]} 
////            onChange={(value, viewUpdate) => {
////              console.log('value: ', value);
////            }}
//          />, cmplaceholder);

//      <div ref={editor} align="left">
//        <textarea id="cmeditor"></textarea>

//  let editor_ta = <textarea ref={editor} id="editorta" defaultValue={editortext.current} />;
//    <div key={"cmdiv"+refnode} id={"cmdiv"+refnode} className="code-editor" theme={"dracular"} align="left" style={{position: "absolute", ...editorSize.current, background: "rgba(55, 55, 55,1)"}}>
//        <textarea key={"editorta"+refnode} ref={editor} id={"editorta"+refnode} defaultValue={editortext.current} />
//    </div>
  return (
    <div id={"cmdiv"+refnode} className="code-editor" theme={"dracular"} align="left" style={{position: "absolute", ...editorSize.current, background: "rgba(55, 55, 55,1)"}}>
        <textarea ref={editor} id={"editorta"+refnode} defaultValue={editortext.current} />
    </div>
  );
}
//            extensions={[basicSetup, StreamLanguage.define(clojure)]} 
//            extensions={[javascript({ jsx: true })]}

//          <ReactCodeMirror
//            value='(def readmefirst (list "hello" "world"))'
//            height="200px"
//            theme={oneDark}
//            extensions={[vim(), StreamLanguage.define(clojure)]} 
//            onChange={(value, viewUpdate) => {
//              console.log('value: ', value);
//            }}
//          />

export default LEAFTextEditor;
