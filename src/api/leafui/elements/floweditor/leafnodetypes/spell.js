import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import { ReactDOM } from 'react';
import Hammer from '@egjs/hammerjs';

//#reactflow #migration
//import { Handle, Position, NodeProps, Connection, Edge } from '../lib/react-flow-renderer';
import { Handle, Position, NodeProps, Connection, Edge } from '../lib/reactflow.11.10.4/core/dist/esm/index.js';
import { AnchorPort, DataPort, LambdaPort } from './porthandle'
  
import Draggable from 'react-draggable';

import TextField from '@mui/material/TextField';
//import { TextField, Input } from '@material-ui/core';
//import { withStyles, makeStyles } from '@material-ui/core/styles';
//import { textAlign } from '@material-ui/system';
//import { NoEncryption } from '@material-ui/icons';

import { useMutation } from 'graphql-hooks';
//import { Base64 } from 'crypto-js/enc-base64';
//import sjcl from 'sjcl';

import {targetAuxHandleStyle, sourceAuxHandleStyle, targetHandleStyle, targetAuxDataHandleStyle, targetAnchorHandleStyle, sourceHandleStyleA, sourceHandleStyleB, sourceHandleStyle, sourceAuxDataHandleStyle, sourceAnchorHandleStyle, useStyles} from './styles';
import {onConnect} from './uihandlers';

import { fetchMultiKeyedData, setMultiKeyedData } from '../../../../utils/fetchnodedata'; // '../../../ghostos/api/utils/fetchnodedata';
import {v4 as uuidv4} from 'uuid';
import {mutateUpdateNode} from '../leafgql';
import { encodeUnicode, decodeUnicode } from '../../../../utils/leafbase64'; // '../../../ghostos/api/utils/leafbase64';

const svgfilepath = '/assets/svg/'; // spark_dev_note: this path is for testing only. make sure to change it for production

const LEAFEditorRectangularNamedNode = (apidef) => {
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: true // the neptune/trident chaining port
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#8f23';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#000';

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? <span style={{fontSize:'20pt'}}>{apidef.editorconfig.svgicon.unicode} </span>:
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));
        
    const name_datakey = apidef.editorconfig.namedatakey;
    const banduplicatename = 'banduplicatename' in apidef.editorconfig ? apidef.editorconfig.banduplicatename : true; // default to true

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
        //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
        //    </span>
        const classes = useStyles();
        
        const curNodeName = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
        const [renderstate, setRenderState] = useState(uuidv4());
        const requestRender = () => {
            setRenderState(uuidv4());
        };
        const [state, setState] = useState(() => { return {
            leaduuid: data.leaduuid ? data.leaduuid : null,
            //nameEntered: data.leafnodename ? data.leafnodename : '',
            nameEntered: curNodeName ? curNodeName :  data.leafnodename,
            //logictoggle: data.logictoggle ? data.logictoggle : false, // false is for equality sign
            //nameDefault: data.leafnodename ? data.leafnodename : '',
            nameDefault: curNodeName ? curNodeName : '',
            //tchandle: null,
            position: data.leaf.appdata?.position,
        }});
        const [hammerInitialized, setHammerInitialized] = useState(false);
        //const node_icon_width = (data.spellname.length > 14) ? '135px' : '110px';
        const node_icon_width = (fetchMultiKeyedData(name_datakey, data.leaf.logic.args).length > 14) ? '135px' : '110px';
        //const [mutateNode] = useMutation(MUT_UPDATENODE);
        //const [mutateUpdateNode] = useMutation(MUT_UPDATENODE, {fetchOptionsOverrides: { method: 'POST' }});
    
        // declare useEffect variables for use outside
        
        // for ref share between the in/out of useEffect block.
        //const metaref = useRef();
        
        //setState(prevState => {return {...prevState, equality: data.logictoggle, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        const handleTextChange = async function(event) {
            console.debug("handleTextChange(): "+event);
            try {
                event.preventDefault(); 
                //event.stopPropagation(); 
                //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
                //const copy_text = document.getElementById(data.leaduuid); 
                //let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
                //let leafnodename = data.leafnodename ? data.leafnodename : '';
                let leafnodename = document.getElementById("standard-basic"+data.leaduuid); 
                //checkNameClash() is const findClash = (name) => { return elements.find(e => isNode(e) && (leafnodetype === e.type) && (name === e.data.name) )};
                //edit_text.defaultValue = copy_text.textContent;
                //await navigator.clipboard.readText(); 
                //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
                //useMutation(getLEAFgqlStrUpdateNode(new_node));
        
        
                if (leafnodename.value) {
                    const curNodeName = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
                    if (data.checkNameClash && data.checkNameClash(leafnodename.value)) { // if there is a clash with the new name just given
                        // show a timed popup about the clash
                        // otherwise do nothing here
                        //console.log(data);
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                        }
                        else { // changed name but duplicate detected
                            leafnodename.value = curNodeName;
                        }
                    }
                    else {
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                        }
                        else {
                            //data.leafnodename = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            //data.leaf.logic.args[name_datakey] = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            setMultiKeyedData(name_datakey, data.leaf.logic.args, leafnodename.value); // mutation necessary to account for the server delay in updating the data

                            setState(prevState => {
                                if (leafnodename.value !== state.nameDefault) {
                                    //const node_data = { leafeditor: {
                                        //leaduuid: `${data.leaduuid}`,
                                    //    ...data,
                                        //type: "leafdatafilternode",
                    //                    leafnodename: leafnodename.value, //edit_text.value,
                                        //position: state.position,
                                        //nodeid: node_uuid,
                                    //}};
                                    const node_data = {
                                        ...data
                                    };
                                    delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                                    //node_data.leaf.logic.args[name_datakey] = leafnodename.value;
                                    setMultiKeyedData(name_datakey, node_data.leaf.logic.args, leafnodename.value); 
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
                                    mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                                }
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value }
                            });
                            //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
                        }
                    }
                }
                else { // if entered value is empty
                    //data.leafnodename = state.nameDefault;
                    //data.leaf.logic.args[name_datakey] = state.nameDefault;
                    setMultiKeyedData(name_datakey, data.leaf.logic.args, state.nameDefault);
                    setState(prevState => {return {...prevState, nameEntered: prevState.nameDefault }}); // restore it to what it used to be prior to text change 
                }
        
            }
            catch (err) {}
            finally{return event;}
        };
    
    
        // to support react component lifecycle such as componentDidMount()
        useEffect(() => {
    
        const handleSingleTap = function(event) {
            console.debug("handleSingleTap(): "+event);
            try {
            event.preventDefault(); 
            //event.stopPropagation(); 
            //classes.root.display = 'auto';
            //const copy_text = state.nameEntered; //document.getElementById('label'+data.leaduuid); 
            //setState({...state, nameEntered: '', nameDefault: copy_text });
            //data.leafnodename = '';
            setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
            //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: data.leafnodename }});
            //leafnodenamecache = data.leafnodename;
            //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
            }
            catch (err) {}
            finally{return event;}
        };
    
        
        //if (!state.is_hammer_init) {}
        if (!hammerInitialized) {
            //const ui_element_toggletext = document.getElementById('toggle'+data.leaduuid);
            const ui_element_nodeicon = document.getElementById('node-icon'+data.leaduuid);
            //const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
            const mc_icon = new Hammer.Manager(ui_element_nodeicon);
    
                // add tap recognizers
            //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
            let singleTap = new Hammer.Tap({event: 'singletap' });
            let longPress = new Hammer.Press({event: 'longpress', time:500});
            //let swipe = new Hammer.Swipe({event: 'swipe'});
    
            //mc_toggletext.add([longPress]);
            mc_icon.add([singleTap]);
            // recognizer rules
            //mc.get('doubletap').recognizeWith('singletap');
            //mc.get('singletap').requireFailure('doubletap');
            //doubleTap.recognizeWith([singleTap]);
    
            //singleTap.requireFailure([longPress]);
            //mc_icon.get('longpress').recognizeWith('singletap');
            //mc_icon.get('singletap').requireFailure('longpress');
            //singleTap.recognizeWith(longPress);
            //singleTap.requireFailure(longPress);
    
            //mc_icon.on('singletap', e => {(() => {handleSingleTap(e);})()});
            //mc_toggletext.on('longpress', e => {(() => {handleLogicToggle(e);})()});
            mc_icon.on('singletap', e => {handleSingleTap(e);});
            //mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
            //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
            setHammerInitialized(prevVal => true);
        }
        //setState(prevState => {return {...prevState, leaduuid: data.leaduuid, is_hammer_init: true, tchandle: handleTextChange }});
        // the solution next line as per https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
        // eslint-disable-next-line react-hooks/exhaustive-deps
    
        /*
        let server_updated_state = {};
        if (data.leafnodename !== state.nameDefault) { //|| (JSON.stringify(data.position) !== JSON.stringify(state.position)) {}
            // this name discrepancy happens when the name update came from the server
            // update the local state to reflect the change
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
            server_updated_state.nameEntered = data.leafnodename;
            server_updated_state.nameDefault = data.leafnodename;
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        }
        if (data.logictoggle !== state.equality) {
    
            //server_updated_state.equality = data.logictoggle;
            //setState(prevState => {return {...prevState, equality: data.logictoggle }}); // flip-flop of the equality flag
        }
        if (Object.keys(server_updated_state).length > 0) {
            //setState(prevState => {return {...prevState, ...server_updated_state }}); 
            setState(prevState => {return {...prevState, ...server_updated_state }}); 
        }
        */
        setState((prevState) => {
            let server_updated_state = {};
            const curNodeName = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
            if (curNodeName !== prevState.nameDefault) { 
            // this name discrepancy happens when the name update came from the server
            // update the local state to reflect the change
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
            server_updated_state.nameEntered = curNodeName;
            server_updated_state.nameDefault = curNodeName;
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
            }
            //if (data.logictoggle !== prevState.logictoggle) {
    
            //  server_updated_state.logictoggle = data.logictoggle;
            //}
            if (data.position !== prevState.position) {
            server_updated_state.position = data.position;
            }
            if (Object.keys(server_updated_state).length > 0) {
            return {...prevState, ...server_updated_state };
            }
            else {
            return prevState;
            }
        });
    
        }, [data]);
    
        return (
        <React.Fragment>
        <div style={{ background: iconbgColor, border: '1px solid #777', padding: 2, borderRadius: '5px', width: node_icon_width, height: '35pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%', color: fgColor}} >
              <div id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help', color: fgColor}}  >
                {node_icon} 
              </div>
              <span id={"label"+data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}} >
              {state.nameEntered}
              </span>
              {(!state.nameEntered && hammerInitialized) && (
              <form onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
              <TextField autoFocus onBlur={handleTextChange} defaultValue={state.nameDefault} InputProps={{ className: classes.root }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "4pt", textAlign: "center"}} label="name?" />
              </form>)}
            </div>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        </React.Fragment>
        );
    });
};

const LEAFEditorRectangularNode = (apidef) => {
    const leadconfig = {
        maininput1: (apidef.dataflow.input ? true : false), 
        auxinput1: (apidef.lambdaports.input ? true : false), 
        mainoutput1: (apidef.dataflow.output ? true : false), 
        mainoutput2: false, 
        auxoutput1: (apidef.lambdaports.output ? true : false),
    };

    const iconheight = apidef.editorconfig.svgicon.height ? apidef.editorconfig.svgicon.height : 14;
    const iconwidth = apidef.editorconfig.svgicon.width ? apidef.editorconfig.svgicon.width : 40;
    const iconbgColor = apidef.editorconfig.svgicon.bgColor ? apidef.editorconfig.svgicon.bgColor : '#8f23';
    const fgColor = apidef.editorconfig.svgicon.fgColor ? apidef.editorconfig.svgicon.fgColor : '#000';

    const node_icon =   (apidef.editorconfig.svgicon.unicode ? <span style={{fontSize:'20pt'}}>{apidef.editorconfig.svgicon.unicode} </span>:
                        (apidef.editorconfig.svgicon.url ? <svg height={iconheight} width={iconwidth}><image href={svgfilepath+apidef.editorconfig.svgicon.url} src="yourfallback.png" height={iconheight} width={iconwidth}/></svg> :
                        (apidef.editorconfig.svgicon.jsx ? apidef.editorconfig.svgicon.jsx :
                        undefined)));
        
    const name_datakey = apidef.editorconfig.namedatakey;
    const banduplicatename = 'banduplicatename' in apidef.editorconfig ? apidef.editorconfig.banduplicatename : true; // default to true

    return memo(({ data }) => { // data as in lambdactrl.user.leaf.logic.args plus the node uuid
        // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
        // determined and be reflected in the return construct.
        //const leadconfig = get_lead_config(data.leaduuid)
        //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
        //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
        //    </span>
        const classes = useStyles();
        
        const curNodeName = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
        const [renderstate, setRenderState] = useState(uuidv4());
        const requestRender = () => {
            setRenderState(uuidv4());
        };
        const [state, setState] = useState(() => { return {
            leaduuid: data.leaduuid ? data.leaduuid : null,
            //nameEntered: data.leafnodename ? data.leafnodename : '',
            nameEntered: curNodeName ? curNodeName :  data.leafnodename,
            //logictoggle: data.logictoggle ? data.logictoggle : false, // false is for equality sign
            //nameDefault: data.leafnodename ? data.leafnodename : '',
            nameDefault: curNodeName ? curNodeName : '',
            //tchandle: null,
            position: data.leaf.appdata?.position,
        }});
        const [hammerInitialized, setHammerInitialized] = useState(false);
        //const node_icon_width = (data.spellname.length > 14) ? '135px' : '110px';
        const node_icon_width = (fetchMultiKeyedData(name_datakey, data.leaf.logic.args).length > 14) ? '135px' : '110px';
        //const [mutateNode] = useMutation(MUT_UPDATENODE);
        //const [mutateUpdateNode] = useMutation(MUT_UPDATENODE, {fetchOptionsOverrides: { method: 'POST' }});
    
        // declare useEffect variables for use outside
        
        // for ref share between the in/out of useEffect block.
        //const metaref = useRef();
        
        //setState(prevState => {return {...prevState, equality: data.logictoggle, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        const handleTextChange = async function(event) {
            console.debug("handleTextChange(): "+event);
            try {
                event.preventDefault(); 
                //event.stopPropagation(); 
                //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
                //const copy_text = document.getElementById(data.leaduuid); 
                //let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
                //let leafnodename = data.leafnodename ? data.leafnodename : '';
                let leafnodename = document.getElementById("standard-basic"+data.leaduuid); 
                //checkNameClash() is const findClash = (name) => { return elements.find(e => isNode(e) && (leafnodetype === e.type) && (name === e.data.name) )};
                //edit_text.defaultValue = copy_text.textContent;
                //await navigator.clipboard.readText(); 
                //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
                //useMutation(getLEAFgqlStrUpdateNode(new_node));
        
        
                if (leafnodename.value) {
                    const curNodeName = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
                    if (data.checkNameClash && data.checkNameClash(leafnodename.value)) { // if there is a clash with the new name just given
                        // show a timed popup about the clash
                        // otherwise do nothing here
                        //console.log(data);
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                        }
                        else { // changed name but duplicate detected
                            leafnodename.value = curNodeName;
                        }
                    }
                    else {
                        if (curNodeName === leafnodename.value) { // didn't change name
                            //requestRender();
                            setState(prevState => {
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value} // don't change anything but just rerender
                            });
                        }
                        else {
                            //data.leafnodename = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            //data.leaf.logic.args[name_datakey] = leafnodename.value; // mutation necessary to account for the server delay in updating the data
                            setMultiKeyedData(name_datakey, data.leaf.logic.args, leafnodename.value); // mutation necessary to account for the server delay in updating the data

                            setState(prevState => {
                                if (leafnodename.value !== state.nameDefault) {
                                    //const node_data = { leafeditor: {
                                        //leaduuid: `${data.leaduuid}`,
                                    //    ...data,
                                        //type: "leafdatafilternode",
                    //                    leafnodename: leafnodename.value, //edit_text.value,
                                        //position: state.position,
                                        //nodeid: node_uuid,
                                    //}};
                                    const node_data = {
                                        ...data
                                    };
                                    delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                                    //node_data.leaf.logic.args[name_datakey] = leafnodename.value;
                                    setMultiKeyedData(name_datakey, node_data.leaf.logic.args, leafnodename.value); 
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
                                    mutateUpdateNode({variables: {uuid: data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                                }
                                return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value }
                            });
                            //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
                        }
                    }
                }
                else { // if entered value is empty
                    //data.leafnodename = state.nameDefault;
                    //data.leaf.logic.args[name_datakey] = state.nameDefault;
                    setMultiKeyedData(name_datakey, data.leaf.logic.args, state.nameDefault);
                    setState(prevState => {return {...prevState, nameEntered: prevState.nameDefault }}); // restore it to what it used to be prior to text change 
                }
        
            }
            catch (err) {}
            finally{return event;}
        };
    
    
        // to support react component lifecycle such as componentDidMount()
        useEffect(() => {
    
        const handleSingleTap = function(event) {
            console.debug("handleSingleTap(): "+event);
            try {
            event.preventDefault(); 
            //event.stopPropagation(); 
            //classes.root.display = 'auto';
            //const copy_text = state.nameEntered; //document.getElementById('label'+data.leaduuid); 
            //setState({...state, nameEntered: '', nameDefault: copy_text });
            //data.leafnodename = '';
            setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
            //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: data.leafnodename }});
            //leafnodenamecache = data.leafnodename;
            //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
            }
            catch (err) {}
            finally{return event;}
        };
    
        
        //if (!state.is_hammer_init) {}
        if (!hammerInitialized) {
            //const ui_element_toggletext = document.getElementById('toggle'+data.leaduuid);
            const ui_element_nodeicon = document.getElementById('node-icon'+data.leaduuid);
            //const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
            const mc_icon = new Hammer.Manager(ui_element_nodeicon);
    
                // add tap recognizers
            //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
            let singleTap = new Hammer.Tap({event: 'singletap' });
            let longPress = new Hammer.Press({event: 'longpress', time:500});
            //let swipe = new Hammer.Swipe({event: 'swipe'});
    
            //mc_toggletext.add([longPress]);
            mc_icon.add([singleTap]);
            // recognizer rules
            //mc.get('doubletap').recognizeWith('singletap');
            //mc.get('singletap').requireFailure('doubletap');
            //doubleTap.recognizeWith([singleTap]);
    
            //singleTap.requireFailure([longPress]);
            //mc_icon.get('longpress').recognizeWith('singletap');
            //mc_icon.get('singletap').requireFailure('longpress');
            //singleTap.recognizeWith(longPress);
            //singleTap.requireFailure(longPress);
    
            //mc_icon.on('singletap', e => {(() => {handleSingleTap(e);})()});
            //mc_toggletext.on('longpress', e => {(() => {handleLogicToggle(e);})()});
            mc_icon.on('singletap', e => {handleSingleTap(e);});
            //mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
            //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
            setHammerInitialized(prevVal => true);
        }
        //setState(prevState => {return {...prevState, leaduuid: data.leaduuid, is_hammer_init: true, tchandle: handleTextChange }});
        // the solution next line as per https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
        // eslint-disable-next-line react-hooks/exhaustive-deps
    
        /*
        let server_updated_state = {};
        if (data.leafnodename !== state.nameDefault) { //|| (JSON.stringify(data.position) !== JSON.stringify(state.position)) {}
            // this name discrepancy happens when the name update came from the server
            // update the local state to reflect the change
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
            server_updated_state.nameEntered = data.leafnodename;
            server_updated_state.nameDefault = data.leafnodename;
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
        }
        if (data.logictoggle !== state.equality) {
    
            //server_updated_state.equality = data.logictoggle;
            //setState(prevState => {return {...prevState, equality: data.logictoggle }}); // flip-flop of the equality flag
        }
        if (Object.keys(server_updated_state).length > 0) {
            //setState(prevState => {return {...prevState, ...server_updated_state }}); 
            setState(prevState => {return {...prevState, ...server_updated_state }}); 
        }
        */
        setState((prevState) => {
            let server_updated_state = {};
            const curNodeName = fetchMultiKeyedData(name_datakey, data.leaf.logic.args);
            if (curNodeName !== prevState.nameDefault) { 
            // this name discrepancy happens when the name update came from the server
            // update the local state to reflect the change
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
            server_updated_state.nameEntered = curNodeName;
            server_updated_state.nameDefault = curNodeName;
            //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
            }
            //if (data.logictoggle !== prevState.logictoggle) {
    
            //  server_updated_state.logictoggle = data.logictoggle;
            //}
            if (data.position !== prevState.position) {
            server_updated_state.position = data.position;
            }
            if (Object.keys(server_updated_state).length > 0) {
            return {...prevState, ...server_updated_state };
            }
            else {
            return prevState;
            }
        });
    
        }, [data]);
    
        return (
        <React.Fragment>
        <div style={{ background: iconbgColor, border: '1px solid #777', padding: 2, borderRadius: '5px', width: node_icon_width, height: '35pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
            {leadconfig.maininput1 &&
            <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
            }
            {leadconfig.auxinput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort> 
            <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%', color: fgColor}} >
              <div id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help', color: fgColor}}  >
                {node_icon} 
              </div>
              <span id={"label"+data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: fgColor,}} >
              {state.nameEntered}
              </span>
              {(!state.nameEntered && hammerInitialized) && (
              <form onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
              <TextField autoFocus onBlur={handleTextChange} defaultValue={state.nameDefault} InputProps={{ className: classes.root }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "4pt", textAlign: "center"}} label="name?" />
              </form>)}
            </div>
            {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
            <>
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
            </>
            }
            {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
            }
            {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
            <DataPort leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
            }
            {leadconfig.auxoutput1 &&
            <LambdaPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
            }
            <AnchorPort leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
            </AnchorPort>
        </div>
        </React.Fragment>
        );
    });
};

// deprecated
const LEAFSpell = undefined;
//memo(({ apidef }) => {
//  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be
//  // determined and be reflected in the return construct.
//  //const leadconfig = get_lead_config(data.leaduuid)
//  // <span style={{ position: 'relative', top: '-15px', left: '-8px'}} >{anchor_symbol}</span>
//  //const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
//    const leadconfig = {
//        maininput1: (apidef.dataflow.input ? true : false), 
//        auxinput1: (apidef.lambdaports.input ? true : false), 
//        mainoutput1: (apidef.dataflow.output ? true : false), 
//        mainoutput2: false, 
//        auxoutput1: (apidef.lambdaports.output ? true : false),
//    };
//    //const node_icon_width = !['define ontology'].includes(data.spellname) ? '110px' : '135px'
//    const node_icon_width = (data.spellname.length > 14) ? '135px' : '110px';
//
//    return (
//        <>
//        <div style={{ background: '#a3a', width: node_icon_width, height: '35px', alignItems: 'center', border: '1px solid #777', padding: 2, borderRadius: '5px' }} >
//        {leadconfig.maininput1 &&
//        <DataPort data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
//        }
//        {leadconfig.auxinput1 &&
//        <LambdaPort data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxHandleStyle} onConnect={onConnect} />
//        }
//        <AnchorPort data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
//        </AnchorPort>
//        <div>
//            <div style={{ position:'relative', top: '4pt', width: '100%', alignItems: 'center', textAlign: 'center' }}><strong>{data.spellname}</strong></div>
//        </div>
//        <span style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
//        </span>
//        {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
//        <>
//            <DataPort data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
//            <DataPort data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
//        </>
//        }
//        {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
//        <DataPort data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
//        }
//        {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
//        <DataPort data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
//        }
//        {leadconfig.auxoutput1 &&
//        <LambdaPort data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxHandleStyle} />
//        }
//        <AnchorPort data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
//        </AnchorPort>
//        </div>
//        </>
//    );
//});

export {LEAFSpell};
