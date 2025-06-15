import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import { ReactDOM } from 'react';
import Hammer from 'hammerjs';
import propagating from 'propagating-hammerjs';

//#reactflow #migration
//import { Handle, Position, NodeProps, Connection, Edge } from './lib/react-flow-renderer';
import { Handle, Position, NodeProps, Connection, Edge } from './lib/reactflow.11.10.4/core/dist/esm/index.js';
import { AnchorHandle, DataHandle, LambdaHandle } from './handle'
  
import Draggable from 'react-draggable';

import { TextField, Input } from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { textAlign } from '@material-ui/system';
import { NoEncryption } from '@material-ui/icons';

import { useMutation } from 'graphql-hooks';
//import { Base64 } from 'crypto-js/enc-base64';
//import sjcl from 'sjcl';

import {mutateUpdateNode} from './leafgql';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      width: '100%',
    },
    //fontSize: '6pt',
    //background: 'linear-gradient(45deg,  #FE6B8B 30%, #FF8E53 90%)',
    //border: 0,
    //borderRadius: 3,
    //boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    //color: 'black',
    padding: '2px 0px',
    style: {alignItems: 'center'},
    width: '100%',
    height: '5',
    // $labeled is a reference to the local "label" styling rules within the same style sheet
    // by using &, we increase the specificity ? # ref https://material-ui.com/customization/components/#overriding-styles-with-classes
    //'&$labeled': {
    //  fontSize: '6pt',
    //},
  },
  //label: {
  //  fontSize: '6pt',
  //},
}));

const LEAFUICircularTextInputNode = withStyles({
  root: {
    '& > *': {
    },
    fontSize: '6pt',
    //background: 'linear-gradient(45deg,  #FE6B8B 30%, #FF8E53 90%)',
    //border: 0,
    //borderRadius: 3,
    //boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    //color: 'black',
    //height: 18,
    //padding: '0 30px',
    width: '100%',
    // $labeled is a reference to the local "label" styling rules within the same style sheet
    // by using &, we increase the specificity ? # ref https://material-ui.com/customization/components/#overriding-styles-with-classes
    //'&$labeled': {
    //  fontSize: '6pt',
    //},
  },
  //label: {
  //  fontSize: '6pt',
  //},
})(TextField);

const targetHandleStyle = { background: '#fff' , top: '50%'}; //: CSSProperties
const targetAuxHandleStyle = { background: '#fff', left: '20%' }; //: CSSProperties
const sourceAuxHandleStyle = { background: '#fff',  left: '80%'}; //: CSSProperties

const targetAuxDataHandleStyle = { background: '#fff', left: '50%' }; //: CSSProperties
const sourceAuxDataHandleStyle = { background: '#fff',  left: '50%'}; //: CSSProperties

const targetAnchorHandleStyle = { background: '#fff', left: '0%', zIndex: 1 }; //: CSSProperties
const sourceAnchorHandleStyle = { background: '#fff',  left: '100%', zIndex: 1 }; //: CSSProperties

const sourceHandleStyle = { ...targetHandleStyle, top: '50%'}; //: CSSProperties
const sourceHandleStyleA = { ...targetHandleStyle, top: 10 }; //: CSSProperties
const sourceHandleStyleB = { ...targetHandleStyle, bottom: 10, top: 'auto' }; //: CSSProperties

//const anchor_symbol = '\u262e';

const onConnect = (params) => console.debug('handle onConnect', params); // params: Connection | Edge 

const onHandleTouch = (event) => { //event: React.MouseEvent
  console.debug("touch down on handle!")
}

const onTouchStart = (event) => { //(event: React.MouseEvent): void
  console.debug("handle dragging!")
}

const LEAFDataFilterNode = memo(({ data }) => {
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
    equality: data.logictoggle,
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
      console.debug("handleLogicToggle(): "+JSON.stringify(state.equality));
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
              logictoggle: !prevState.equality, // save the reverse boolean of the current equality toggle value
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
      //setState(prevState => {return {...prevState, equality: data.loggictoggle }}); // flip-flop of the equality flag
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
      if (data.logictoggle !== prevState.equality) {

        server_updated_state.equality = data.logictoggle;
        //setState(prevState => {return {...prevState, equality: data.loggictoggle }}); // flip-flop of the equality flag
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
    <div style={{ background: state.equality ? equality_bgcolor : inequality_bgcolor, border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%'}} >
      <span data-testid={"toggletest"} id={"toggle"+data.leaduuid} style={{pointerEvents: '', cursor: 'pointer'}} >
        {state.equality ? equality_symbol : inequality_symbol}
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
        <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  </React.Fragment>
  );
});

const LEAFDataCombineNode = memo(({ data }) => {
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
    equality: data.logictoggle,
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
      console.debug("handleLogicToggle(): "+JSON.stringify(state.equality));
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
              logictoggle: !prevState.equality, // save the reverse boolean of the current equality toggle value
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

    //const logictoggle = data.logictoggle ? data.logictoggle : state.equality;
    const handleMouseDown = async function(event) {
      console.debug("handleMouseDown(): "+event);
      try {
        event.preventDefault(); 
        //event.stopPropagation(); 
        //classes.root.display = 'auto';
        let copy_text = document.getElementById(data.leaduuid); 
        //setState({...state, nameEntered: '', nameDefault: copy_text.textContent });
        setState(prevState => {return {...prevState, nameEntered: '', nameDefault: copy_text.textContent }});
        copy_text.textContent = ''; //await navigator.clipboard.readText(); 
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
      //let singleTap = new Hammer.Tap({event: 'singletap' });
      let longPress = new Hammer.Press({event: 'longpress', time:500});
      //let swipe = new Hammer.Swipe({event: 'swipe'});

      mc_icon.add([longPress]);
      //mc_icon.add([singleTap]);
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
      //mc_icon.on('singletap', e => {handleSingleTap(e);});
      //mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
      mc_icon.on('longpress', e => {handleMouseDown(e);});
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
      //setState(prevState => {return {...prevState, equality: data.loggictoggle }}); // flip-flop of the equality flag
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
      if (data.logictoggle !== prevState.equality) {

        server_updated_state.equality = data.logictoggle;
        //setState(prevState => {return {...prevState, equality: data.loggictoggle }}); // flip-flop of the equality flag
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


  return (
    <React.Fragment>
    <div style={{ background: '#28f', border: '1px solid #77f', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle leaduuid={data.leaduuid} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle leaduuid={data.leaduuid} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect} />
      <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%'}} >
      <div id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'copy'}}  >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#faa" className="bi bi-funnel" viewBox="0 0 16 16">
        <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
      </svg>
      </div>
      <br/>
      <span id={data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
        {state.nameEntered}
      </span>
      {!state.nameEntered && (
      <form className={classes.root} onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
        <TextField autoFocus onBlur={handleTextChange} defaultValue={state.nameDefault} InputProps={{ classes }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "6pt", textAlign: "center"}}  label="name?" />
      </form>)}
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle leaduuid={data.leaduuid} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle leaduuid={data.leaduuid} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect} />
    </div>
    </React.Fragment>
  );
});

/*
const LEAFDataCombineNode = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  const classes = useStyles();
  const [state, setState] = useState({
    nameEntered: '',
  })
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  const handleTextChange = async function(event) {
    console.debug("handleTextChange(): "+event);
    try {
      event.preventDefault(); 
      event.stopPropagation(); 
      //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
      //const copy_text = document.getElementById(data.leaduuid); 
      let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
      //edit_text.defaultValue = copy_text.textContent;
      //await navigator.clipboard.readText(); 
      //setState({...state, nameEntered: edit_text.value });
      setState({nameEntered: edit_text.value });
    }
    catch (err) {}
    finally{return event;}
  };
  const handleMouseDown = async function(event) {
    console.debug("handleMouseDown(): "+event);
    try {
      event.preventDefault(); 
      event.stopPropagation(); 
      //classes.root.display = 'auto';
      let copy_text = document.getElementById(data.leaduuid); 
      //setState({...state, nameEntered: '', nameDefault: copy_text.textContent });
      setState({nameEntered: '', nameDefault: copy_text.textContent });
      copy_text.textContent = ''; //await navigator.clipboard.readText(); 
    }
    catch (err) {}
    finally{return event;}
  };
  return (
    <div style={{ background: '#28f', border: '1px solid #77f', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect} />
      <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%'}} >
      <span style={{pointerEvents: 'auto', cursor: 'copy'}} onMouseDown={handleMouseDown} >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#faa" className="bi bi-funnel" viewBox="0 0 16 16">
        <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
      </svg>
      </span><br/>
      <span id={data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
        {state.nameEntered}
      </span>
      {!state.nameEntered && (
      <form className={classes.root} onSubmit={handleTextChange} noValidate autoComplete="off" style={{height: "5"}}>
        <TextField autoFocus onBlur={handleTextChange} defaultValue={state.nameDefault} InputProps={{ classes }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "6pt", textAlign: "center"}}  label="name?" />
      </form>)}
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect} />
    </div>
  );
});
*/


const LEAFUtilityNode = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <span style={{ position: 'relative', top: '-15px', left: '-8px'}} >{anchor_symbol}</span>
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}

  const onColorChange = (event) => { // event : ChangeEvent
    const color = event.target.value;

    //setBgColor(color);
    // the setBgColor() is local to floweditor/index.js and require the event handler be declared externally w.r.t leafnode.js. 
    // the new bg color shall need to be saved as part of the node data in the LEAF lake 
    // for saving color for persistency 
//      <input className="nodrag" type="color" onChange={data.onChange} defaultValue={data.color} />
  };
  
  return (
    <>
    <div style={{ background: '#8f2', border: '1px solid #777', padding: 2, borderRadius: '5px' }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div>
        Custom Node: <strong>{data.color}</strong>
        {data.leaduuid}
      </div>
      <span style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
      <input className="nodrag" type="color" onChange={onColorChange} defaultValue={data.color} />
      </span>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
    </>
  );
});

const LEAFNodeContextNode = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
  //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
  //    </span>
  const classes = useStyles();
  const [state, setState] = useState({
    leaduuid: null,
    nameEntered: '',
    equality: true,
    is_hammer_init: false,
    nameDefault: '',
    tchandle: null,
  });
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  const inequality_symbol = '\u2260';
  const equality_symbol = '\u229c'
  const context_bgcolor = '#88f';
  const context_arm_bgcolor = '#2f8';
  const context_node_symbol = '🜉'; // '\u1F709';
  const context_arm_symbol = '\u220B'; // contains as member  or '∋' //'🝑'; //'\u1F751';

  // declare useEffect variables for use outside
  
  // for ref share between the in/out of useEffect block.
  //const metaref = useRef();

  // to support react component lifecycle such as componentDidMount()
  useEffect(() => {
    const handleTextChange = function(event) {
      console.debug("handleTextChange(): "+event);
      try {
        event.preventDefault(); 
        //event.stopPropagation(); 
        //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
        //const copy_text = document.getElementById(data.leaduuid); 
        let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
        //edit_text.defaultValue = copy_text.textContent;
        //await navigator.clipboard.readText(); 
        //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
        setState(prevState => {return {...prevState, nameEntered: edit_text.value, nameDefault: edit_text.value }});
      }
      catch (err) {}
      finally{return event;}
    };

    const handleLogicToggle = function(event) {
      console.debug("handleLogicToggle(): "+event);
      try {
        event.preventDefault(); 
        //classes.root.display = 'auto';
        //let copy_text = document.getElementById(data.leaduuid); 
        //setState({...state, equality: !state.equality }); // flip-flop of the equality flag
        setState(prevState => {return {...prevState, equality: !prevState.equality }}); // flip-flop of the equality flag
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
        setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
        //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
      }
      catch (err) {}
      finally{return event;}
    };

    //if (!state.is_hammer_init) {
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

    mc_icon.on('singletap', e => {handleSingleTap(e);});
    mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
    //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
    setState(prevState => {return {...prevState, leaduuid: data.leaduuid, is_hammer_init: true, tchandle: handleTextChange }});
    //}
    // the solution next line as per https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
  <React.Fragment>
    <div style={{ background: state.equality ? context_bgcolor : context_arm_bgcolor, border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'80%'}} >
      <span id={"toggle"+data.leaduuid} style={{pointerEvents: '', cursor: 'pointer'}} >
        {state.equality ? context_node_symbol : context_arm_symbol}
      <br/>
      </span>
      <div id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help'}}  >
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="20" fill="#acf" className="bi bi-eyeglasses" viewBox="0 0 16 12">
      <path d="M4 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm2.625.547a3 3 0 0 0-5.584.953H.5a.5.5 0 0 0 0 1h.541A3 3 0 0 0 7 8a1 1 0 0 1 2 0 3 3 0 0 0 5.959.5h.541a.5.5 0 0 0 0-1h-.541a3 3 0 0 0-5.584-.953A1.993 1.993 0 0 0 8 6c-.532 0-1.016.208-1.375.547zM14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
      </svg><br/>
      </div>
      <span id={"label"+data.leaduuid} style={{ alignItems: 'center', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
        {state.nameEntered}
      </span>
      {(!state.nameEntered && state.is_hammer_init) && (
      <form className={classes.root} onSubmit={state.tchandle} noValidate autoComplete="off" style={{height: "5"}}>
        <TextField autoFocus onBlur={state.tchandle} defaultValue={state.nameDefault} InputProps={{ classes }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "6pt", textAlign: "center"}}  label="name?" />
      </form>)}
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  </React.Fragment>
  );
});

const LEAFEdgeContextNode = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  //    <span style={{ pointerEvents: 'auto', fontSize: '8pt', color: 'black',}} >
  //      <input className="nodrag" type="text" size="8" onChange={data.onChange} defaultValue={data.datakey} />
  //    </span>
  const classes = useStyles();
  const [state, setState] = useState({
    leaduuid: null,
    nameEntered: '',
    arrowdirection: true,
    is_hammer_init: false,
    nameDefault: '',
    tchandle: null,
  });
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  const inequality_symbol = '\u2260';
  const equality_symbol = '\u229c'
  const context_default_bgcolor = '#88f';
  const context_alternate_bgcolor = '#2f8';
  const context_leftarrow_symbol = '⇐'; // \u21D0 alternate
  const context_rightarrow_symbol = '⇒'; // \u21D2 default
  const context_arm_symbol = '\u220B'; // contains as member  or '∋' //'🝑'; //'\u1F751';

  // declare useEffect variables for use outside
  
  // for ref share between the in/out of useEffect block.
  //const metaref = useRef();

  // to support react component lifecycle such as componentDidMount()
  useEffect(() => {
    const handleTextChange = function(event) {
      console.debug("handleTextChange(): "+event);
      try {
        event.preventDefault(); 
        //event.stopPropagation(); 
        //classes.root.display = 'none';{"standard-basic"+data.leaduuid}
        //const copy_text = document.getElementById(data.leaduuid); 
        let edit_text = document.getElementById("standard-basic"+data.leaduuid); 
        //edit_text.defaultValue = copy_text.textContent;
        //await navigator.clipboard.readText(); 
        //setState({...state, nameEntered: edit_text.value, nameDefault: edit_text.value });
        setState(prevState => {return {...prevState, nameEntered: edit_text.value, nameDefault: edit_text.value }});
      }
      catch (err) {}
      finally{return event;}
    };

    const handleLogicToggle = function(event) {
      console.debug("handleLogicToggle(): "+event);
      try {
        event.preventDefault(); 
        //classes.root.display = 'auto';
        //let copy_text = document.getElementById(data.leaduuid); 
        //setState({...state, equality: !state.equality }); // flip-flop of the equality flag
        setState(prevState => {return {...prevState, arrowdirection: !prevState.arrowdirection }}); // flip-flop of the arrowdirection flag
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
        setState(prevState => {return {...prevState, nameEntered: '', nameDefault: prevState.nameEntered }});
        //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
      }
      catch (err) {}
      finally{return event;}
    };

    //if (!state.is_hammer_init) {
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

    mc_icon.on('singletap', e => {handleSingleTap(e);});
    mc_toggletext.on('longpress', e => {handleLogicToggle(e);});
    //setState({...state, is_hammer_init: true, tchandle: handleTextChange });
    setState(prevState => {return {...prevState, leaduuid: data.leaduuid, is_hammer_init: true, tchandle: handleTextChange }});
    //}
    // the solution next line as per https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
  <React.Fragment>
    <div style={{ alignItems: 'center', minWidth: '110px', background: state.arrowdirection ? context_default_bgcolor : context_alternate_bgcolor, border: '1px solid #777', padding: 2, borderRadius: '5px', height: '50px', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{pointerEvents: 'auto', width:'100%', alignItems:'center', lineHeight:'50%'}} >
      <span id={"toggle"+data.leaduuid} style={{position: 'relative', top: '5pt', pointerEvents: '', cursor: 'pointer'}} >
        {state.arrowdirection ? context_rightarrow_symbol : context_leftarrow_symbol}
      </span>
      <div min-width='110'>
      <span id={"node-icon"+data.leaduuid} style={{pointerEvents: 'auto', cursor: 'help'}} >
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="20" fill="#acf" className="bi bi-eyeglasses" viewBox="0 0 16 12">
      <path d="M4 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm2.625.547a3 3 0 0 0-5.584.953H.5a.5.5 0 0 0 0 1h.541A3 3 0 0 0 7 8a1 1 0 0 1 2 0 3 3 0 0 0 5.959.5h.541a.5.5 0 0 0 0-1h-.541a3 3 0 0 0-5.584-.953A1.993 1.993 0 0 0 8 6c-.532 0-1.016.208-1.375.547zM14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
      </svg>
      </span>
      </div>
      <span id={"label"+data.leaduuid} style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
        {state.nameEntered}
      </span>
      {(!state.nameEntered && state.is_hammer_init) && (
      <form className={classes.root} onSubmit={state.tchandle} noValidate autoComplete="off" style={{height: "5"}}>
        <TextField autoFocus onBlur={state.tchandle} defaultValue={state.nameDefault} InputProps={{ classes }} id={"standard-basic"+data.leaduuid} style={{ fontSize: "6pt", textAlign: "center"}}  label="name?" />
      </form>)}
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  </React.Fragment>
  );
});

const LEAFOperatorNode = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <span style={{ position: 'relative', top: '-15px', left: '-8px'}} >{anchor_symbol}</span>
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  const node_icon_width = !['define ontology'].includes(data.operatortype) ? '110px' : '135px'

  return (
    <>
    <div style={{ background: '#a3a', width: node_icon_width, height: '35px', alignItems: 'center', border: '1px solid #777', padding: 2, borderRadius: '5px' }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div>
        <div style={{ position:'relative', top: '4pt', width: '100%', alignItems: 'center', textAlign: 'center' }}><strong>{data.operatortype}</strong></div>
      </div>
      <span style={{ pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} >
      </span>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
    </>
  );
});

const LEAFAnchorPointNode = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  const leadconfig = {maininput1: false, auxinput1: false, mainoutput1: false, mainoutput2: false, auxoutput1: false}
  const anchor_symbol = '\u2646'
  return (
    <div style={{ background: '#66f', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '15pt', height: '15pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{width:'100%'}}>
      <span 
            style={{ pointerEvents: 'none', fontSize: '16pt', color: 'white',}} 
          >

        {anchor_symbol}
        </span>
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  );
});


const LEAFDeckSpade = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  return (
    <div style={{ background: '#8f23', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
        <path d="M7.184 11.246A3.5 3.5 0 0 1 1 9c0-1.602 1.14-2.633 2.66-4.008C4.986 3.792 6.602 2.33 8 0c1.398 2.33 3.014 3.792 4.34 4.992C13.86 6.367 15 7.398 15 9a3.5 3.5 0 0 1-6.184 2.246 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907z"/>
</svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
        {data.name}
      </span>
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  );
});

const LEAFDeckDiamond = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  // <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  return (
    <div style={{ background: '#8f23', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2z"/>
      </svg>&nbsp;
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2z"/>
      </svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
        {data.name}
      </span>
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  );
});

const LEAFDeckHeart = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  //      <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  return (
    <div style={{ background: '#8f23', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z"/>
</svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
      {data.name}
      </span>
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  );
});

const LEAFDeckClub = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  //      <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  return (
    <div style={{ background: '#8f23', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z"/>
</svg>&nbsp;
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z"/>
</svg>&nbsp;
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
      <path d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z"/>
</svg><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
        {data.name}
      </span>
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  );
});

const LEAFDeckTracker = memo(({ data }) => {
  // here, depending on data.leaduuid, the number and respective positions of input/output handles will be 
  // determined and be reflected in the return construct.
  //const leadconfig = get_lead_config(data.leaduuid)
  // <path d="M8 0a.5.5 0 0 1 .429.243c1.359 2.265 2.925 3.682 4.25 4.882.096.086.19.17.282.255C14.308 6.604 15.5 7.747 15.5 9.5a4 4 0 0 1-5.406 3.746c.235.39.491.782.722 1.131.434.659-.01 1.623-.856 1.623H6.04c-.845 0-1.29-.964-.856-1.623.263-.397.51-.777.728-1.134A4 4 0 0 1 .5 9.5c0-1.753 1.192-2.896 2.539-4.12l.281-.255c1.326-1.2 2.892-2.617 4.251-4.882A.5.5 0 0 1 8 0zM3.711 6.12C2.308 7.396 1.5 8.253 1.5 9.5a3 3 0 0 0 5.275 1.956.5.5 0 0 1 .868.43c-.094.438-.33.932-.611 1.428a29.247 29.247 0 0 1-1.013 1.614.03.03 0 0 0-.005.018.074.074 0 0 0 .024.054h3.924a.074.074 0 0 0 .024-.054.03.03 0 0 0-.005-.018c-.3-.455-.658-1.005-.96-1.535-.294-.514-.57-1.064-.664-1.507a.5.5 0 0 1 .868-.43A3 3 0 0 0 14.5 9.5c0-1.247-.808-2.104-2.211-3.38L12 5.86c-1.196-1.084-2.668-2.416-4-4.424-1.332 2.008-2.804 3.34-4 4.422l-.289.261z"/>
  // svg icon copied from https://icons.getbootstrap.com/
  //      <input className="nodrag" type="text" size="5" onChange={data.onChange} defaultValue={data.datakey} />
  // onMouseDown: async function paste(e) {try {e.preventDefault(); e.stopPropagation(); let copy_text = document.getElementById(data.leaduuid); copy_text.textContent = await navigator.clipboard.readText(); }catch (err){}finally{return e;}}
  const pinwheel_star_symbol = '\u2735'; // ✵
  const leadconfig = {maininput1: true, auxinput1: true, mainoutput1: true, mainoutput2: false, auxoutput1: true}
  const [state, setState] = useState({
    nameEntered: '',
  });
  const handleMouseDown = async function(event) {
    console.debug("handleMouseDown(): "+event);
    try {
      event.preventDefault(); 
      event.stopPropagation(); 
      //classes.root.display = 'auto';
      //let copy_text = document.getElementById(data.leaduuid); 
      //copy_text.textContent = await navigator.clipboard.readText();
      //setState({...state, nameEntered: '', nameDefault: copy_text.textContent });
      setState({nameEntered: await navigator.clipboard.readText() });
      //copy_text.textContent = ''; //await navigator.clipboard.readText(); 
    }
    catch (err) {}
    finally{return event;}
  };
  return (
    <div style={{ background: '#8f23', border: '1px solid #777', padding: 2, borderRadius: '50%', width: '50pt', height: '50pt', display: 'flex', alignItems: 'center', textAlign: 'center', zIndex: 1 }} >
      {leadconfig.maininput1 &&
      <DataHandle data={data} type="target" position={Position.Left} id="in_a" style={targetHandleStyle} onConnect={onConnect} />
      }
      {leadconfig.auxinput1 &&
      <LambdaHandle data={data} type="target" position={Position.Top} id="in_aux" style={targetAuxDataHandleStyle} onConnect={onConnect} />
      }
      <AnchorHandle data={data} type="target" position={Position.Top} id="in_anchor" style={targetAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle> 
      <div style={{width:'100%', alignItems:'center', lineHeight:'80%'}}>
      <span style={{pointerEvents: 'auto', cursor: (!state.nameEntered ? 'copy' : 'grab'), fontSize: '20pt', color: '#3fff'}} 
      {...(!state.nameEntered && { onMouseDown: handleMouseDown })} >
      {pinwheel_star_symbol}
      </span><br/>
      <span id={data.leaduuid} style={{ cursor: 'alias', pointerEvents: 'auto', fontSize: '9pt', color: 'black',}} 
      onMouseDown={() => {let copy_text = document.getElementById(data.leaduuid); let text_area = document.createElement('textarea'); text_area.value = copy_text.textContent; document.body.appendChild(text_area); text_area.select(); text_area.setSelectionRange(0,99999); document.execCommand('Copy'); text_area.remove(); }} >
      {data.name ? data.name : state.nameEntered}
      </span>
      </div>
      {(leadconfig.mainoutput1 && leadconfig.mainoutput2) &&
      <>
        <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyleA} />
        <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyleB} />
      </>
      }
      {(leadconfig.mainoutput1 && !leadconfig.mainoutput2) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_a" style={sourceHandleStyle} />
      }
      {(leadconfig.mainoutput2 && !leadconfig.mainoutput1) &&
      <DataHandle data={data} type="source" position={Position.Right} id="out_b" style={sourceHandleStyle} />
      }
      {leadconfig.auxoutput1 &&
      <LambdaHandle data={data} type="source" position={Position.Bottom} id="out_aux" style={sourceAuxDataHandleStyle} />
      }
      <AnchorHandle data={data} type="source" position={Position.Bottom} id="out_anchor" style={sourceAnchorHandleStyle} onConnect={onConnect}>
      </AnchorHandle>
    </div>
  );
});

//const LEAFNode = memo(LEAFNode);
//const LEAFDataNode = memo(LEAFDataNode);
export {LEAFUtilityNode, LEAFOperatorNode, LEAFDataFilterNode, LEAFDataCombineNode, LEAFNodeContextNode, LEAFEdgeContextNode, LEAFAnchorPointNode, LEAFDeckSpade, LEAFDeckDiamond, LEAFDeckHeart, LEAFDeckClub, LEAFDeckTracker};
