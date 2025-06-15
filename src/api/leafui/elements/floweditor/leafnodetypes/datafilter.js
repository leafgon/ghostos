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

import {mutateUpdateNode} from '../leafgql';

import {targetHandleStyle, targetAuxDataHandleStyle, targetAnchorHandleStyle, sourceHandleStyleA, sourceHandleStyleB, sourceHandleStyle, sourceAuxDataHandleStyle, sourceAnchorHandleStyle, useStyles} from './styles';
import {onConnect} from './uihandlers';

const LEAFDataFilter = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
  //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
  //    </span>
  const classes = useStyles();
  const [state, setState] = useState(() => {return {
    leaduuid: data.leaduuid ? data.leaduuid : null,
    nameEntered: data.leafnodename ? data.leafnodename : '',
    logictoggle: data.logictoggle ? data.logictoggle : false, // false is for equality sign
    nameDefault: data.leafnodename ? data.leafnodename : '',
    //tchandle: null,
    position: data.position,
  }});
  const [hammerInitialized, setHammerInitialized] = useState(false);
  //const [mutateNode] = useMutation(MUT_UPDATENODE);
  //const [mutateUpdateNode] = useMutation(MUT_UPDATENODE, {fetchOptionsOverrides: { method: 'POST' }});
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  const inequality_symbol = '\u2260';
  const equality_symbol = '\u229c'
  const equality_bgcolor = '#882';
  const inequality_bgcolor = '#288';

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
      //edit_text.defaultValue = copy_text.textContent;
      //await navigator.clipboard.readText(); 
      //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
      //useMutation(getLEAFgqlStrUpdateNode(new_node));


      if (leafnodename.value) {
        data.leafnodename = leafnodename.value; // mutation necessary to account for the server delay in updating the data
        setState(prevState => {
          if (leafnodename.value !== state.nameDefault) {
            const node_data = { leafeditor: {
              //leaduuid: `${data.leaduuid}`,
              ...data,
              //type: "leafdatafilternode",
              leafnodename: leafnodename.value, //edit_text.value,
              //position: state.position,
              //nodeid: node_uuid,
            }};
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
            mutateUpdateNode({variables: {uuid: data.leaduuid, data: btoa(JSON.stringify(node_data))}});
          }
          return {...prevState, nameEntered: leafnodename.value, nameDefault: leafnodename.value }
        });
        //setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
      }
      else { // if entered value is empty
        data.leafnodename = state.nameDefault;
        setState(prevState => {return {...prevState, nameEntered: prevState.nameDefault }}); // restore it to what it used to be prior to text change 
      }

    }
    catch (err) {}
    finally{return event;}
  };


  // to support react component lifecycle such as componentDidMount()
  useEffect(() => {
    const handleLogicToggle = async function(event) {
      console.debug("handleLogicToggle(): "+JSON.stringify(data.logictoggle));
      console.debug("handleLogicToggle(): "+JSON.stringify(state.logictoggle));
      try {
        event.preventDefault(); 
        //classes.root.display = 'auto';
        //let copy_text = document.getElementById(data.leaduuid); 
        //setState({...state, equality: !state.equality }); // flip-flop of the equality flag
        //edit_text.defaultValue = copy_text.textContent;
        //await navigator.clipboard.readText(); 
        //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
        //useMutation(getLEAFgqlStrUpdateNode(new_node));

        //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, equality: node_data.leafeditor.logictoggle }}); // flip-flop of the equality flag
        setState((prevState) => {
          const node_data = {
            leafeditor: {
              //leaduuid: `${data.leaduuid}`,
              ...data,
              //type: "leafdatafilternode",
              leafnodename: prevState.nameDefault,
              position: prevState.position,
              logictoggle: !prevState.logictoggle, // save the reverse boolean of the current equality toggle value
              //logictoggle: !data.logictoggle, // save the reverse boolean of the current equality toggle value
              //nodeid: node_uuid,
            }
          };
          //let json_data = JSON.stringify(node_data).getBytes("UTF-8");
          //let enc_data = sjcl.codec.base64.fromBits(json_data);
          //let dec_data = sjcl.codec.base64.toBits(enc_data);
          //let enc_data = Base64.stringify(json_data);
          // spark dev note: currently it's unclear whether the graphql updateNode mutation can support partial update,
          // that is updating only a portion of the data instead of updating the whole lot. 
          // In the current implementation, it was assumed that "partial update" isn't supported, 
          // hence the smallest unit update here is to replace the entire node data on each update 
          // even if it would only involve partial change in a single field. 
          data.logictoggle = node_data.leafeditor.logictoggle;
          console.debug('data.position: ', JSON.stringify(data.position));
          console.debug('prevState.position: ', JSON.stringify(prevState.position));
          mutateUpdateNode({ variables: { uuid: data.leaduuid, data: btoa(JSON.stringify(node_data)) } });
          return { ...prevState, equality: node_data.leafeditor.logictoggle };
        }); // flip-flop of the equality flag
        //data.logictoggle = !data.logictoggle;
        //setState(prevState => {return {...prevState, equality: data.logictoggle }}); // flip-flop of the equality flag
        //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
      }
      catch (err) {}
      finally{return event;}
    };

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
      const ui_element_toggletext = document.getElementById('toggle'+data.leaduuid);
      const ui_element_nodeicon = document.getElementById('node-icon'+data.leaduuid);
      const mc_toggletext = new Hammer.Manager(ui_element_toggletext);
      const mc_icon = new Hammer.Manager(ui_element_nodeicon);

          // add tap recognizers
      //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
      let singleTap = new Hammer.Tap({event: 'singletap' });
      let longPress = new Hammer.Press({event: 'longpress', time:500});
      //let swipe = new Hammer.Swipe({event: 'swipe'});

      mc_toggletext.add([longPress]);
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
      mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
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
      if (data.leafnodename !== prevState.nameDefault) { 
        // this name discrepancy happens when the name update came from the server
        // update the local state to reflect the change
        //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename, position: data.position }});
        server_updated_state.nameEntered = data.leafnodename;
        server_updated_state.nameDefault = data.leafnodename;
        //setState(prevState => {return {...prevState, nameEntered: data.leafnodename, nameDefault: data.leafnodename }});
      }
      if (data.logictoggle !== prevState.logictoggle) {

        server_updated_state.logictoggle = data.logictoggle;
        //setState(prevState => {return {...prevState, equality: data.logictoggle }}); // flip-flop of the equality flag
      }
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

  //const logictoggle = data.logictoggle ? data.logictoggle : state.equality;

  return (
  <React.Fragment>
    <div style={{ background: state.logictoggle ? inequality_bgcolor : equality_bgcolor, border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataPort leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorPort leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorPort> 
      <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%'}} >
      <span data-testid={"toggletest"} id={"toggle"+data.leaduuid} style={{pointerEvents: '', cursor: 'pointer'}} >
        {state.logictoggle ? inequality_symbol : equality_symbol}
      <br/>
      </span>
      <div id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help'}}  >
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="20" fill="#acf" className="bi bi-eyeglasses" viewBox="0 0 16 12">
      <path d="M4 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm2.625.547a3 3 0 0 0-5.584.953H.5a.5.5 0 0 0 0 1h.541A3 3 0 0 0 7 8a1 1 0 0 1 2 0 3 3 0 0 0 5.959.5h.541a.5.5 0 0 0 0-1h-.541a3 3 0 0 0-5.584-.953A1.993 1.993 0 0 0 8 6c-.532 0-1.016.208-1.375.547zM14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
      </svg><br/>
      </div>
      <span id={"label"+data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
        {state.nameEntered}
      </span>
      {(!state.nameEntered && hammerInitialized) && (
      <form className={classes.root} onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
        <TextField autoFocus onBlur={handleTextChange} defaultValue={state.nameDefault} InputProps={{ classes }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "6pt", textAlign: "center"}}  label="name?" />
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

export {LEAFDataFilter};
