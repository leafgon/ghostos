import React, { useState, useRef, useEffect, Fragment, useLayoutEffect } from 'react';
import {Vector3, Vector2, Raycaster} from 'three';
import Hammer from '@egjs/hammerjs';
import propagating from 'propagating-hammerjs';
//import { connect } from 'react-redux';
//import LEAFUISet from '../leafui/set';
//import LEAFUIPrompt from '../leafui/prompt';
//import LEAFUIComplexGrid from '../leafui/complexgrid';
//import BasicImageList from '../leafui/imagelist';
//import PropTypes from 'prop-types';
import BGTagYouTube from './bgtagyoutube';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Typography, Tooltip } from '@material-ui/core';

import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
//import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
//import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
//import StopIcon from '@material-ui/icons/Stop';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import FullscreenExitOutlinedIcon from '@mui/icons-material/FullscreenExitOutlined';
import MinimizeOutlinedIcon from '@mui/icons-material/MinimizeOutlined';
import { setupRaycaster, calculateLineSphereIntersection, threeCameraCoordToSphericalCoord, sphericalCoordToTHREECameraCoord } from './gnav';

import { v4 as uuid4 } from 'uuid';

const THREE = {Vector3, Vector2, Raycaster}; // for easy code tracking using the keyword 'THREE'

const BGTagCenterWindow = (props) => {
  const {_leafjs, dimensions, camposition, appprops, children} = props; // rid of the annoyance of adding 'props.' in every prop access
  const {curtag, unmountCallback} = appprops;
  const [isfullscr, setIsfullscr] = useState(false);
  //const [isclosed, setIsclosed] = useState(false);

  useEffect(() => {
    // as per https://css-tricks.com/using-requestanimationframe-with-react-hooks/

    // initialize state space
    setIsfullscr(true);
    //setIsclosed(false);
    //const bgCenterTagElement = document.getElementById("bgtag-center-tab"); // find the element <div> id from the JSX def
    const bgCenterTagElement = document.getElementById("bgtagcenterframe"); // find the element <div> id from the JSX def
    const hammer = propagating(new Hammer.Manager(bgCenterTagElement, {} )); // initialize hammer 

    const initCenterTagHammer = () => {
      //const hammer = new Hammer.Manager(bgCenterTagElement, {} ); // initialize hammer 
      //const hammer = propagating(new Hammer(bgCenterTagElement)); // initialize hammer 
      let gestures = {};
      gestures['singletap'] = new Hammer.Tap({event: 'singletap'}); // add a singletap gesture 
      //gestures['doubletap'] = new Hammer.Tap({event: 'doubletap', 'taps': 2}); // add a doubletap gesture 
      //gestures['longpress'] = new Hammer.Tap({event: 'longpress', time:500}); // add a 500ms longpress gesture
      //const spgesture = {...gestures, swipe: new Hammer.Tap({event: 'swipe'})};
      //gestures['swipe'] = new Hammer.Tap({event: 'swipe'}); // add a swipe gesture 
      //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
      //gestures.doubletap.recognizeWith([gestures.singletap]); // doubletap needs this condition to coexist with singletap
      //let longPress = new Hammer.Press({event: 'longpress', time:500});
      //gestures.singletap.requireFailure([gestures.doubletap, gestures.longpress]); // singletap needs this condition to coexist with doubletap and longpress
      //let swipe = new Hammer.Swipe({event: 'swipe'});

      hammer.add(Object.values(gestures)); // register the gestures list to hammer state
      // gesture definitions
      hammer.on("singletap", e => { // singletap event
	e.stopPropagation();
        let eventElemId = null;
        // spark_dev_note: hammer.js quirks show up as unruly click behaviors on material-ui icons, where clicking on icon "pen drawings" doesn't register e.target.id while e.target.parentElement.id registers instead
        // the following is a quick and dirty solution to get around this quirky hammer.js behavior
        if (e.target.id)
            eventElemId = e.target.id;
        else if (e.target.parentElement.id)
            eventElemId = e.target.parentElement.id;

        if (eventElemId) {
          console.log("HAMMERTIME on tab: SINGLE TAP", e.target.id); // for debugging only
          // track down the tap location based on the app JSX def specific <div> id
          // and handle the event as appropriate. 
          switch (eventElemId) {
          case "bgtag-center-esc": 
            console.log("bgtag-center-esc");
            unmountCallback(); // tell its parent to unmount this component
	        //setIsclosed(true);
            break;
          case "bgtag-center-fullscreen": 
            console.log("bgtag-center-fullscreen");
	    setIsfullscr((prev) => true);
            break;
          case "bgtag-center-fullscreen-esc": 
            console.log("bgtag-center-fullscreen-esc");
	    setIsfullscr((prev) => false);
            break;
          case "bgtag-center-minimize": 
            console.log("bgtag-center-minimize");
            break;
          default: // when you don't know what to make out of error handling... ;p
            console.error("BackgroundTagComponent: unknown tab target: ", e); 
          }
        }
        else { // taps from elements without ids
          console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.parentElement.id); // just to see how it works, play around with logs
        }
      });
    };
    initCenterTagHammer();

    // setup touch interactions on the element
    console.log(_leafjs);
    console.log(appprops);
    //if (_leafjs) {

    //setUpdate();
    // return cleanup code to the hook 
    return () => {
        hammer.off("singletap");
        hammer.destroy();
      //setIsMounted(false); // mark the component as unmounted
      // this cleanup code is to prevent updating state on unmounted component
      // for functional component, please refer to https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
      //cancelAnimationFrame(requestRef.current);
      //if (updateTimer.current) {
      //  clearTimeout(updateTimer.current);
      //}
    }
  //}
  }, [props.appprops.curtag]);

  //const tagunitdist = {x: _leafjs.render.width * 0.1, y: _leafjs.render.height * 0.1}; // tag distance from outter border
  const tagunitdist = {x: dimensions.width * 0.1, y: _leafjs.render.height * 0.1}; // tag distance from outter border
  let tagrectcoord = {x: tagunitdist.x, y: tagunitdist.y};
  let taglinecoord = {x: tagunitdist.x + 50, y: tagunitdist.y + 50};
  let centertagrectcoord = {x: tagunitdist.x, y: tagunitdist.y};
  let centertagrectwidth = 300;
  let centertagrectheight = 200;
  if (_leafjs) {
    //centertagrectcoord.x = (100 + tagunitdist.x) + 100;
    //centertagrectcoord.y = 100 + tagunitdist.y + 100;
    //centertagrectwidth = _leafjs.render.width - (100 + tagunitdist.x)*2 - 200;
    //centertagrectheight = _leafjs.render.height - (100 + tagunitdist.y)*2 - 200;
    if (isfullscr) {
      centertagrectcoord.x = 5;
      centertagrectcoord.y = 5;
      centertagrectwidth = _leafjs.render.width - 10;
      centertagrectheight = _leafjs.render.height - 10;
    } else {
      centertagrectcoord.x = (100 + tagunitdist.x) + 50;
      centertagrectcoord.y = 100 + tagunitdist.y + 50;
      centertagrectwidth = _leafjs.render.width - (100 + tagunitdist.x)*2 - 100;
      centertagrectheight = _leafjs.render.height - (100 + tagunitdist.y)*2 - 100;
    }
  }
  //handleNewBGTag({center: {x: 200, y: 300}});//{x: e.center.x, y: e.center.y} t203
  //console.log("t203: ", testdata);
  //console.log("t203: ", bgtagvectors.length);
  return (
    _leafjs && //!isclosed &&
        <div id="bgtagcenterframe" style={{zIndex:1}}>
            <svg id="bgtagcentersvg" width={_leafjs.render.width} height={_leafjs.render.height} style={{zIndex: _leafjs.render.zIndex, position: "absolute", top: '0px', left: '0px'}}>
            {
                true && 
                <Fragment>
                <rect id="bgtag-center" pointerEvents="fill" width={centertagrectwidth-4} height={centertagrectheight-4} x={centertagrectcoord.x+2} y={centertagrectcoord.y+2} rx="0" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="50%" />
                <clipPath id="centerframeclippath">
                    <rect id="bgtag-center" pointerEvents="fill" width={centertagrectwidth-5} height={centertagrectheight-30} rx="0" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="50%" />
                </clipPath>
                </Fragment>
            }
            </svg>
            { // an icon to escape from displaying the bgtag-center
                true &&
                <div id="bgtagcenterfrontgroup" style={{display: "block", overflow: 'hidden', position: "absolute", bottom: 0, right: 0, margin: "auto", top: centertagrectcoord.y, left: centertagrectcoord.x}}>
                    <div id="bgtag-center-tab">
                        <HighlightOffOutlinedIcon id="bgtag-center-esc" style={{position: 'relative', color: '#a0f0f0', top:2.5, left:2.5}} /> 
                        <MinimizeOutlinedIcon id="bgtag-center-minimize" style={{position: 'relative', color: '#a0f0f0', top:1.0, left:centertagrectwidth-80}} /> 
                    {
                        isfullscr &&
                        <FullscreenExitOutlinedIcon id="bgtag-center-fullscreen-esc" style={{position: 'relative', color: '#a0f0f0', top:2.5, left:centertagrectwidth-77}} /> 
                        ||
                        <FullscreenOutlinedIcon id="bgtag-center-fullscreen" style={{position: 'relative', color: '#a0f0f0', top:2.5, left:centertagrectwidth-77}} /> 
                    }
                    </div>
                    <div style={{clipPath: "url(#centerframeclippath)", overflow: "auto", position: "relative", margin: "auto", height: "100%", width: "100%", left: 5 }}>
                        { children }
                    </div>
                </div>
            }
        </div>
    || null
  );
};

//                    <BasicImageList 
//                    _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: {top: 5, left: 5}, tagrectsize: {width: centertagrectwidth, height: centertagrectheight}}}} 
//                    appprops= {{}} //{{bgtaglist: this.state.bgtaglist}}
//                    />
//                    <div id="bgtag-center-tab">
//                        <HighlightOffIcon id="bgtag-center-esc" style={{position: 'absolute', color: '#a0f0f0', top:2.5, left:2.5}} /> 
//                        <Minimize id="bgtag-center-minimize" style={{position: 'absolute', color: '#a0f0f0', top:1.0, left:centertagrectwidth-50}} /> 
//                    {
//                        isfullscr &&
//                        <FullscreenExit id="bgtag-center-fullscreen-esc" style={{position: 'absolute', color: '#a0f0f0', top:2.5, left:centertagrectwidth-27.5}} /> 
//                        ||
//                        <Fullscreen id="bgtag-center-fullscreen" style={{position: 'absolute', color: '#a0f0f0', top:2.5, left:centertagrectwidth-27.5}} /> 
//                    }
//                    </div>
//                    <div style={{position: "relative", width: "100%", top: centertagrectcoord.y+50, left: centertagrectcoord.x}}>
//                        { children }
//                    <BasicImageList 
//                    _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: {top: 5, left: 5}, tagrectsize: {width: centertagrectwidth, height: centertagrectheight}}}} 
//                    appprops= {{}} //{{bgtaglist: this.state.bgtaglist}}
//                    />
//                    </div>

//        <BasicImageList 
//        _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: {top: 5, left: 5}, tagrectsize: {width: centertagrectwidth, height: centertagrectheight}}}} 
//        appprops= {{}} //{{bgtaglist: this.state.bgtaglist}}
//        />
const BGTag = (props) => {
  const {_leafjs, dimensions, camposition, appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
  const {curtag, setCurbgtag, unmountCallback} = appprops;
  const [isfullscr, setIsfullscr] = useState(false);
  const [isclosed, setIsclosed] = useState(false);
  //const [tagrectcoord, setTagrectcoord] = useState(null);
  //const tagrectcoord = useRef(null);

  useEffect(() => {
    // as per https://css-tricks.com/using-requestanimationframe-with-react-hooks/

    // initialize state space
    setIsfullscr(false);
    setIsclosed(false);
    const bgTagElement = document.getElementById(curtag); // find the element <div> id from the JSX def
    const hammer = propagating(new Hammer.Manager(bgTagElement, {} )); // initialize hammer 

    const initTagHammer = () => {
        //const bgTagElement = document.getElementById(tagid); // find the element <div> id from the JSX def
        //const hammer = propagating(new Hammer.Manager(bgTagElement, {} )); // initialize hammer 
        //const hammer = new Hammer.Manager(bgCenterTagElement, {} ); // initialize hammer 
        //const hammer = propagating(new Hammer(bgCenterTagElement)); // initialize hammer 
        let gestures = {};
        gestures['singletap'] = new Hammer.Tap({event: 'singletap'}); // add a singletap gesture 
        //gestures['doubletap'] = new Hammer.Tap({event: 'doubletap', 'taps': 2}); // add a doubletap gesture 
        //gestures['longpress'] = new Hammer.Tap({event: 'longpress', time:500}); // add a 500ms longpress gesture
        //const spgesture = {...gestures, swipe: new Hammer.Tap({event: 'swipe'})};
        //gestures['swipe'] = new Hammer.Tap({event: 'swipe'}); // add a swipe gesture 
        //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
        //gestures.doubletap.recognizeWith([gestures.singletap]); // doubletap needs this condition to coexist with singletap
        //let longPress = new Hammer.Press({event: 'longpress', time:500});
        //gestures.singletap.requireFailure([gestures.doubletap, gestures.longpress]); // singletap needs this condition to coexist with doubletap and longpress
        //let swipe = new Hammer.Swipe({event: 'swipe'});

        hammer.add(Object.values(gestures)); // register the gestures list to hammer state
        // gesture definitions
        hammer.on("singletap", e => { // singletap event
            e.stopPropagation();
            if (e.target.id) {
            console.log("HAMMERTIME on tab: SINGLE TAP", e.target.id); // for debugging only
            // track down the tap location based on the app JSX def specific <div> id
            // and handle the event as appropriate. 
            const re = /^bgtag-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(.*)$/; // bgtag-<UUID>-<bgtagid>
            const bgtag_id = e.target.id.match(re)[2];
            setCurbgtag(bgtag_id);

            }
            else { // taps from elements without ids
            console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.parentElement.id); // just to see how it works, play around with logs
            }
        });
        return hammer;
    };

    initTagHammer();

    // setup touch interactions on the element
    console.log(_leafjs);
    console.log(appprops);

    //setUpdate();
    // return cleanup code to the hook 
    return () => {
        hammer.destroy();
      //setIsMounted(false); // mark the component as unmounted
      // this cleanup code is to prevent updating state on unmounted component
      // for functional component, please refer to https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
      //cancelAnimationFrame(requestRef.current);
      //if (updateTimer.current) {
      //  clearTimeout(updateTimer.current);
      //}
    }
  }, [curtag]);
  
  //useEffect(() => {
  //  //setTagrectcoord((prev) => { return {x: _leafjs.render.tagrectcoord.x, y: _leafjs.render.tagrectcoord.y}}); // just so re-render happens when needed
  //  tagrectcoord.current = {x: _leafjs.render.tagrectcoord.x, y: _leafjs.render.tagrectcoord.y};
  //}, [_leafjs.render.tagrectcoord]);

  //handleNewBGTag({center: {x: 200, y: 300}});//{x: e.center.x, y: e.center.y} t203
  //console.log("t203: ", testdata);
  //console.log("t203: ", bgtagvectors.length);
  return (
            _leafjs && !isclosed && 
       	//true && 
        <Fragment key={curtag}>
        <div>
            <svg pointerEvents="fill" width="104" height="104" style={{zIndex: 0, position: "absolute", top: _leafjs.render.tagrectcoord.y-2, left: _leafjs.render.tagrectcoord.x-2}}>
            <rect id={curtag} pointerEvents="fill" width="100" height="100" x={2} y={2} rx="15" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="50%" style={{zIndex: 3}}/>
            </svg>
        </div>
        </Fragment>
        || null
  );
};

// _leafjs to carry props for the LEAFjs standard lib, any subsequent others to carry component specific props
//const BGTagComponent = (props={ _leafjs:{}, appprops:{ bgtaglist:[] }}) => { // arguments are react JSX style props of { ...props }
const BGTagComponent = (props) => { // arguments are react JSX style props of { ...props }

  const {_leafjs, nodeuuid, dimensions, camposition, appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
  const {_bgtagvectors, setCurbgtagCallback, checkSpaceCollision} = appprops;
  // define global context in its own world
  const leafjscamera = _leafjs.camera; 

  // mutable states
  const [nodeinfo, setNodeinfo] = useState(true);
  const [isMounted, setIsMounted] = useState(false); // element lifecycle flag
  const [isPaused, setIsPaused] = useState(false); // app specific state
  const [_camposition, setCamposition] = useState(camposition);
  //const [hammer, setHammer] = useState(); // user touch handler state
  //const [gestures, setGestures] = useState({}); // list of gesture definitions
  //const [state, setState] = useState({}); // 
  const [bgtagvectors, setBgtagvectors] = useState(_bgtagvectors);
  const [bgtaglist, setBgtaglist] = useState([]);
  const [curbgtag, setCurbgtag] = useState(null);
  const [rendertimestamp, setRendertimestamp] = useState()
  const [testdata, setTestdata] = useState({t203: 0});

  const updateTimer = React.useRef(null);
  const requestRef = React.useRef();

  function setUpdate() {
    if (updateTimer.current === null) {
      setCamposition(camposition);
      updateTimer.current = setTimeout(() => {
        updateTimer.current = null;
        setCamposition(camposition);
      }, 100);
    }
  }
  const animate = time => {
    // the 'state' will always be the initial value
    requestRef.current = requestAnimationFrame(animate);
    //if (bgtagvectors.length > 0) {

    //setBgtagvectors((prevbgtagvectors) => {
    //  if (prevbgtagvectors) {
    //    //console.log('t203: ', prevbgtagvectors);
    //    setBgtaglist((prevbgtags) => {
    //      const bgtags = findAllBGTags(prevbgtagvectors);
    //      return bgtags;
    //    });
    //  }
    //  return prevbgtagvectors;
    //  //return [...prev, bgvector];
    //});
    
    setBgtaglist((prevbgtags) => {
        const bgtags = findAllBGTags(props.appprops._bgtagvectors);
        return bgtags;
    });
    //}
    //setCamposition(camposition); //(prevposition) => {return prevposition !== camposition ? camposition : prevposition});

  }

  // spark_dev_note: please refer to the LEAF code example of how bgvector calculation
  // can be done with respect to 2D equirectangular image coordinates.
  // "spark/coordmap"
  const handleNewBGTag = (e) => { // handle screen event
    setTestdata({...testdata, t203: 1});
    console.log('t203: ', testdata);
    const screenpoint = e.center // {x: e.center.x, y: e.center.y}
    const raycaster = setupRaycaster(screenpoint, dimensions, leafjscamera);
    //let bgvector = calculateLineSphereIntersection(raycaster.ray, 20000); // I think the radius==20000 is different from other handling of the same radius value using 1000000 I think.
    const bgvector = calculateLineSphereIntersection(raycaster.ray, 1000000); // I think the radius==20000 is different from other handling of the same radius value using 1000000 I think.
    //bgvector = new Vector3(-0.5000000000000012, -0.8660254037844379, 0.0000000000000005053215498074303); // 2000, 750
    const bgvector2 = new Vector3(-0.8090169943749472, -0.5877852522924734, 0.0000000000000005053215498074303); // 1800, 750
    const bgvector3 = new Vector3(-1, 0, 0.0000000000000005053215498074303); // 1500, 750
    //const bgvector4 = new Vector3(0, 0, 1); // 1500, 750
    const bgvector4 = new Vector3(1, 0, 0.0000000000000005053215498074303); // 0, 750
    const bgvector5 = new Vector3(0.5000000000000009, -0.8660254037844382, 0.0000000000000005053215498074303); // 2500, 750
    const bgvector6 = new Vector3(0.5000000000000001, -0.8660254037844382, 0.0000000000000005053215498074303); // 2500, 750
    const bgvector7 = new Vector3(0.0, 1, 0.0000000000000005053215498074303); // 2500, 750
    //let bgvector = calculateLineSphereIntersection(raycaster.ray, 5000); // I think the radius==20000 is different from other handling of the same radius value using 1000000 I think.
    setBgtagvectors((prev) => {
      console.log('t203: ', prev);
      if (prev) {
        return [...prev, {id: uuid4(), coord: threeCameraCoordToSphericalCoord(bgvector)}]; //, bgvector2, bgvector3, bgvector4, bgvector5, bgvector7];
      } else {
        return [bgvector];
      }
    });
  }


  // the difference btwn useLayoutEffect and useEffect: https://kentcdodds.com/blog/useeffect-vs-uselayouteffect
  useLayoutEffect(() => {
    // now the hammer business
    //const bgTagElement = document.getElementById("bgtagframe"); // find the element <div> id from the JSX def
    //handleNewBGTag({center: {x: 200, y: 300}});//{x: e.center.x, y: e.center.y} t203
    //console.log(testdata);
  });


  useEffect(() => {
    // as per https://css-tricks.com/using-requestanimationframe-with-react-hooks/

    const bgTagElement = document.getElementById("bgtagframe"+nodeuuid); // find the element <div> id from the JSX def
    //const bgTagElement = document.getElementById("myElement"); // find the element <div> id from the JSX def
    const hammer = propagating(new Hammer.Manager(bgTagElement, {})); // initialize hammer 
    //const hammer = new Hammer.Manager(bgTagElement, {} ); // initialize hammer 

    const initHammer = () => {
      //const hammer = propagating(new Hammer.Manager(bgTagElement, {} )); // initialize hammer 
      //const hammer_core = new Hammer.Manager(bgTagElement, {});
      //const hammer = hammer_core;
      //const hammer = new Hammer.Manager(bgTagElement, {} ); // initialize hammer 
      //const hammer = new Hammer.Manager(bgTagElement, {} ); // initialize hammer 
      //hammer.options.domEvents = true; // enable dom events (propagation as such)
      let gestures = {};
      gestures['singletap'] = new Hammer.Tap({event: 'singletap'}); // add a singletap gesture 
      //gestures['doubletap'] = new Hammer.Tap({event: 'doubletap', 'taps': 2}); // add a doubletap gesture 
      //gestures['longpress'] = new Hammer.Tap({event: 'longpress', time:500}); // add a 500ms longpress gesture
      //const spgesture = {...gestures, swipe: new Hammer.Tap({event: 'swipe'})};
      //gestures['swipe'] = new Hammer.Tap({event: 'swipe'}); // add a swipe gesture 
      //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
      //gestures.doubletap.recognizeWith([gestures.singletap]); // doubletap needs this condition to coexist with singletap
      //let longPress = new Hammer.Press({event: 'longpress', time:500});
      //gestures.singletap.requireFailure([gestures.doubletap, gestures.longpress]); // singletap needs this condition to coexist with doubletap and longpress
      //let swipe = new Hammer.Swipe({event: 'swipe'});

      hammer.add(Object.values(gestures)); // register the gestures list to hammer state
      // gesture definitions
      hammer.on("singletap", (e) => { // singletap event
	    //e.stopPropagation();
        //e.preventDefault();
        if (e.target.id) {
          console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.id); // for debugging only
          // track down the tap location based on the app JSX def specific <div> id
          // and handle the event as appropriate. 
            if (!checkSpaceCollision(e)) {
                switch (e.target.id) {
                case "bgtagframe"+nodeuuid: 
                    console.log("bgtagframe"+nodeuuid);
                    //handleNewBGTag(e);
                    //e.preventDefault();
	                //e.stopPropagation();
                    break;
                default: // when you don't know what to make out of error handling... ;p
                    console.error("BackgroundTagComponent: unknown tab target: ", e); 
                }
            }
        } else if(e.target.id) { // tap on bgtag-x
            const re = /^bgtag-(\d+)$/;
            const bgtag_idx = e.target.id.match(re)[1];
            setCurbgtag(bgtag_idx);
	    }
        else { // taps from elements without ids
          console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.parentElement.id); // just to see how it works, play around with logs
        }
      });
      // work on 'pinch pan and pinchmove' later as per this codepend 
      // https://codepen.io/bakho/pen/GBzvbB
      /*
      const hammertime = new Hammer(imageContainer);

  hammertime.get('pinch').set({ enable: true });
  hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

  hammertime.on('pan', ev => {  
    displayImageCurrentX = clamp(displayImageX + ev.deltaX, rangeMinX, rangeMaxX);
    displayImageCurrentY = clamp(displayImageY + ev.deltaY, rangeMinY, rangeMaxY);
    updateDisplayImage(displayImageCurrentX, displayImageCurrentY, displayImageScale);
  });

  hammertime.on('pinch pinchmove', ev => {
    displayImageCurrentScale = clampScale(ev.scale * displayImageScale);
    updateRange();
    displayImageCurrentX = clamp(displayImageX + ev.deltaX, rangeMinX, rangeMaxX);
    displayImageCurrentY = clamp(displayImageY + ev.deltaY, rangeMinY, rangeMaxY);
    updateDisplayImage(displayImageCurrentX, displayImageCurrentY, displayImageCurrentScale);
  });

  hammertime.on('panend pancancel pinchend pinchcancel', () => {
    displayImageScale = displayImageCurrentScale;
    displayImageX = displayImageCurrentX;
    displayImageY = displayImageCurrentY;
  });  
      */

    };

    // element mounted upon reaching here
    /*
    let testdata = {};
    const setTestdata = (data) => {
      testdata = data;
    };
    setTestdata({t203: 0});
    */
    initHammer();
    //initCenteTagHammer();

    // setup touch interactions on the element
    console.log(_leafjs);
    console.log(appprops);
    console.log(leafjscamera);
    //if (_leafjs) {

    const handleTooltipOpen = () => {
      if (isMounted) {
        if (nodeinfo) {
          handleTooltipClose(); // only reach here if nodeinfo === true ;p
        }
        else {
          setNodeinfo(true); // flag nodeinfo on
          setTimeout(() => { handleTooltipClose(); }, 2000);
        }
      }
    };

    const handleTooltipClose = () => {
      if (isMounted) {
        setNodeinfo(false); // flag nodeinfo off
      }
    };

    // async call to handleTooltipClose delayed by 2000ms 
    setTimeout(() => { handleTooltipClose(); }, 2000);


    requestRef.current = requestAnimationFrame(animate);
    //setUpdate();
    // return cleanup code to the hook 
    return () => {
      hammer.destroy();
      setIsMounted(false); // mark the component as unmounted
      // this cleanup code is to prevent updating state on unmounted component
      // for functional component, please refer to https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
      cancelAnimationFrame(requestRef.current);
      if (updateTimer.current) {
        clearTimeout(updateTimer.current);
      }
    }
  //}
  }, [props.dimensions, props.renderstate]);

  //useEffect(() => {
  //  setBgtagvectors((prev) => {
  //    //console.log('t203: ', prev);
  //    if (prev) {
  //      return [...prev, ...props.appprops._bgtaglist];
  //    } else {
  //      return [...props.appprops._bgtaglist];
  //    }
  //  });
  //}
  //, [props.appprops._bgtaglist]);

  //const sphericalCoordToTHREECameraCoord = (sp_coord) => {
  //  return new THREE.Vector3(sp_coord.y, sp_coord.z, sp_coord.x);
  //};
  
  //const threeCameraCoordToSphericalCoord = (th_coord) => {
  //  return new THREE.Vector3(th_coord.z, th_coord.x, th_coord.y);
  //};

  const findAllBGTags = (_bgtagvectors) => {
    let bgTags = [];
    let cameradir = new THREE.Vector3(); 
    leafjscamera.getWorldDirection(cameradir);
    //const cameradirvector = new THREE.Vector3(cameradir.z, cameradir.x, cameradir.y);
    const cameradirvector = threeCameraCoordToSphericalCoord(cameradir);

    _bgtagvectors.forEach(
      (tagvec) => {
        const {id: tagid, coord: tagcoord} = tagvec;
        // calculate the small radian angle between the two vectors
        //let dotpro = tagvec.dot(cameradir);
        const theta = Math.acos(tagcoord.dot(cameradirvector)); // assuming the vectors are normalized
        if (theta < 0.3) { // list tags within the perimeter of 0.3*pi from camera center for visualization
          //console.log("theta:", theta, dotpro);
          //const tagloc = tagvec.clone().multiplyScalar(1000000); // find tag location far out in the horizon radius=1000000 away (aka very far)
          // tagvec in spherical cartesian coord where depth is x, screen width is y, and height is z
          // 
          //const tagloc = (new THREE.Vector3(tagvec.y, tagvec.z, tagvec.x)).multiplyScalar(1000000); // find tag location far out in the horizon radius=1000000 away (aka very far)
          const tagloc = sphericalCoordToTHREECameraCoord(tagcoord).multiplyScalar(1000000); // find tag location far out in the horizon radius=1000000 away (aka very far)
          //const tagloc = tagvec.clone().multiplyScalar(5000); // find tag location far out in the horizon radius=1000000 away (aka very far)
          //const scr_coord = projectWorldToScreen(tagloc, leafjscamera) // calculate the screen coordinate
          const scr_coord = projectWorldToScreen(tagloc) // calculate the screen coordinate
          bgTags.push({id: tagid, coord: scr_coord});
        }
      }
    );

    return bgTags;
  };

  const projectWorldToScreen = (position) => {
    //const canvrect = this.renderer.domElement.getBoundingClientRect();
    //camera.updateMatrixWorld();
    let vector = position.clone().project(leafjscamera);
    //vector.x = (vector.x + 1)/2 * (canvrect.right - canvrect.left);
    //vector.y = -(vector.y - 1)/2 * (canvrect.bottom - canvrect.top);
    //vector.x = (vector.x * 0.5 + 0.5) * _leafjs.render.canvrect.width; //(canvrect.right - canvrect.left);
    //vector.y = (vector.y * -0.5 + 0.5) * _leafjs.render.canvrect.height; // - canvrect.height; //(canvrect.bottom - canvrect.top);
    vector.x = (vector.x * 0.5 + 0.5) * dimensions.width; //(canvrect.right - canvrect.left);
    vector.y = (vector.y * -0.5 + 0.5) * dimensions.height; // - canvrect.height; //(canvrect.bottom - canvrect.top);
    return vector;
  };

  //const setupRaycaster = (screenpoint) =>
  //{
  //  const raycaster = new THREE.Raycaster();
  //  let canvaspoint = new THREE.Vector2();
  //  //canvaspoint.x = ((screenpoint.x - _leafjs.render.canvrect.left)/ (_leafjs.render.canvrect.right - _leafjs.render.canvrect.left)) * 2 - 1;
  //  //canvaspoint.y = - ((screenpoint.y - _leafjs.render.canvrect.top)/ (_leafjs.render.canvrect.bottom - _leafjs.render.canvrect.top)) * 2 + 1;
  //  canvaspoint.x = ((screenpoint.x - dimensions.left)/ (dimensions.width)) * 2 - 1;
  //  canvaspoint.y = - ((screenpoint.y - dimensions.top)/ (dimensions.height)) * 2 + 1;
  //  raycaster.setFromCamera(canvaspoint, leafjscamera);

  //  return raycaster;
  //}

  //const calculateLineSphereIntersection = (rayvectors, sphereRadius) =>
  //{
  //  // find out normalized directional vector with respect to the origin (0,0,0) 
  //  // based on (maybe the screen coord?)
  //  const p0 = rayvectors.origin.clone();
  //  //let p1up = p1.unproject(this.camera);
  //  const p1 = p0.clone().add(rayvectors.direction.clone().normalize()); //.normalize());
  //  const c = new THREE.Vector3()
  //  const dp = p0.add(p1.multiplyScalar(-1)).normalize(); // p0 - p1

  //  const c_a = Math.pow(dp.x,2) + Math.pow(dp.y,2) + Math.pow(dp.z,2);
  //  const c_b = 2*dp.x*(p0.x-c.x) + 2*dp.y*(p0.y-c.y) + 2*dp.z*(p0.z-c.z);
  //  const c_c = c.x*c.x + c.y*c.y + c.z*c.z + p0.x*p0.x + p0.y*p0.y + p0.z*p0.z -2*(c.x*p0.x + c.y*p0.y + c.z*p0.z) - sphereRadius*sphereRadius;

  //  //let discABC = c_b*c_b - 4*c_a*c_c;
  //  let c_t = (-c_b - Math.sqrt(c_b*c_b - 4*c_a*c_c))/(2*c_a);

  //  let intersection = new THREE.Vector3(p0.x + c_t*dp.x, p0.y+c_t*dp.y, p0.z+c_t*dp.z);
  //  intersection.normalize(); //.multiplyScalar(9000);
  //  //intersection.multiplyScalar(300);

  //  return intersection;
  //};

      
  // some inter-functional wiring through shared memory needed at least for now. 
  // for defining component specific user interaction... need refactoring to functional programming paradigm later
  const handlePause = () => {
    if (isMounted) {
    }
  };
  const handlePlay = () => {
    if (isMounted) {
    }
  };
        
  const _onEnd = (event) => {
    // access to player in all event handlers via event.target
    event.target.playVideo();
  };

  // react element lifecycle hook
    
  // just to remember that this code was refactored from its former glory of being a class component. ;p
  //forceUpdateHandler(){
  //  this.forceUpdate();
  //}
  //shouldComponentUpdate(nextProps, nextState) {
  //  return true; //nextState.data.completed !== this.state.data.completed;
  //}

  let tagquadcounts = {0: 0, 1: 0, 2: 0, 3: 0};
  let tagquadcounts_rect = {0: 0, 1: 0, 2: 0, 3: 0} // counts for rect rendering
  //const tagunitdist = {x: _leafjs.render.width * 0.1, y: _leafjs.render.height * 0.1}; // tag distance from outter border
  const tagunitdist = {x: dimensions.width * 0.1, y: dimensions.height * 0.1}; // tag distance from outter border
  let tagrectcoord = {x: tagunitdist.x, y: tagunitdist.y};
  let taglinecoord = {x: tagunitdist.x + 50, y: tagunitdist.y + 50};
  let centertagrectcoord = {x: tagunitdist.x, y: tagunitdist.y};
  let centertagrectwidth = 300;
  let centertagrectheight = 200;
  if (_leafjs) {
    //centertagrectcoord.x = (100 + tagunitdist.x) + 100;
    //centertagrectcoord.y = 100 + tagunitdist.y + 100;
    //centertagrectwidth = _leafjs.render.width - (100 + tagunitdist.x)*2 - 200;
    //centertagrectheight = _leafjs.render.height - (100 + tagunitdist.y)*2 - 200;
    centertagrectcoord.x = (100 + tagunitdist.x) + 50;
    centertagrectcoord.y = 100 + tagunitdist.y + 50;
    //centertagrectwidth = _leafjs.render.width - (100 + tagunitdist.x)*2 - 100;
    //centertagrectheight = _leafjs.render.height - (100 + tagunitdist.y)*2 - 100;
    centertagrectwidth = dimensions.width - (100 + tagunitdist.x)*2 - 100;
    centertagrectheight = dimensions.height - (100 + tagunitdist.y)*2 - 100;
  }
  //handleNewBGTag({center: {x: 200, y: 300}});//{x: e.center.x, y: e.center.y} t203
  //console.log("t203: ", testdata);
  //console.log("t203: ", bgtagvectors.length);
//        <svg pointerEvents="fill" width={_leafjs.render.width} height={_leafjs.render.height} style={{zIndex: _leafjs.render.zIndex, position: "absolute", top: '0px', left: '0px'}}></svg>
  return (
    _leafjs &&
    <div>
      <div width={dimensions.width} height={dimensions.height} style={{zIndex: 0, width: "100%", height: "100%", top: '0px', left: '0px' }}>
        <svg id={"bgtagframe"+nodeuuid} pointerEvents="fill" width={dimensions.width} height={dimensions.height} style={{zIndex: 0, position: "absolute", top: '0px', left: '0px'}}>
        {
          bgtaglist.map(
            (tag, i) =>
            {
              // determine screen quadrant to display tag
              tagrectcoord = {x: tagunitdist.x, y: tagunitdist.y}; // initialize
              taglinecoord = {x: tagunitdist.x + 50, y: tagunitdist.y + 50}; // initialize
              let tagquadidx = 0; // defaults to 0 quadrant
              //console.log("bg tag yo",i, tag.coord);
              if (tag.coord.x > dimensions.width / 2) {
                tagrectcoord.x = dimensions.width - 100 - tagunitdist.x;
                taglinecoord.x = dimensions.width - 50 - tagunitdist.x;
                tagquadidx = 1;
              }
              if (tag.coord.y > dimensions.height / 2) {
                tagrectcoord.y = dimensions.height - 100 - tagunitdist.y;
                taglinecoord.y = dimensions.height - 50 - tagunitdist.y;
                tagquadidx = ((tagquadidx > 0) ? 3 : 2);
              }
              tagquadcounts[tagquadidx] = tagquadcounts[tagquadidx] + 1; // increment tag count in the quadrant

              // now move around tagrect coords if tagquadcount > 1
              if (tagquadcounts[tagquadidx] > 1) {
                const tagrectsequence = [[110, 0], [0, 110]]; // even or odd sequence gets moved differently
                const seqidx = tagquadcounts[tagquadidx] % 2;
                const multiplyfactor = Math.floor(tagquadcounts[tagquadidx] / 2); // tagrect placement sequence factor for even and odd idx
                switch(tagquadidx) {
                  case 0:
                    tagrectcoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  case 1:
                    tagrectcoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  case 2:
                    tagrectcoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  case 3:
                    tagrectcoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  default:
                    // shouldn't happen
                    console.error("tagquadidx out of bound");
                }
              }
              
              return (
              <Fragment key={"bgtag-line"+i}>
                <line x1={taglinecoord.x} y1={taglinecoord.y} x2={tag.coord.x} y2={tag.coord.y} stroke="red" strokeWidth="2" strokeOpacity="50%" style={{zIndex: 0}}/>
              </Fragment>
              )
            }
          )
        }
        </svg>
        {
          bgtaglist.map(
            (tag, i) =>
            {
              // determine screen quadrant to display tag
              tagrectcoord = {x: tagunitdist.x, y: tagunitdist.y}; // initialize
              taglinecoord = {x: tagunitdist.x + 50, y: tagunitdist.y + 50}; // initialize
              let tagquadidx = 0; // defaults to 0 quadrant
              //console.log("bg tag yo",i, tag.coord);
              if (tag.coord.x > dimensions.width / 2) {
                tagrectcoord.x = dimensions.width - 100 - tagunitdist.x;
                taglinecoord.x = dimensions.width - 50 - tagunitdist.x;
                tagquadidx = 1;
              }
              if (tag.coord.y > dimensions.height / 2) {
                tagrectcoord.y = dimensions.height - 100 - tagunitdist.y;
                taglinecoord.y = dimensions.height - 50 - tagunitdist.y;
                tagquadidx = ((tagquadidx > 0) ? 3 : 2);
              }
              tagquadcounts_rect[tagquadidx] = tagquadcounts_rect[tagquadidx] + 1; // increment tag count in the quadrant

              // now move around tagrect coords if tagquadcount > 1
              if (tagquadcounts_rect[tagquadidx] > 1) {
                const tagrectsequence = [[110, 0], [0, 110]]; // even or odd sequence gets moved differently
                const seqidx = tagquadcounts_rect[tagquadidx] % 2;
                const multiplyfactor = Math.floor(tagquadcounts_rect[tagquadidx] / 2); // tagrect placement sequence factor for even and odd idx
                switch(tagquadidx) {
                  case 0:
                    tagrectcoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  case 1:
                    tagrectcoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y += tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  case 2:
                    tagrectcoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x += tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  case 3:
                    tagrectcoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    tagrectcoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    taglinecoord.x -= tagrectsequence[seqidx][0] * multiplyfactor;
                    taglinecoord.y -= tagrectsequence[seqidx][1] * multiplyfactor;
                    break;
                  default:
                    // shouldn't happen
                    console.error("tagquadidx out of bound");
                }
              }
              
              return (
              <Fragment key={"bgtag-rect"+i}>
                <BGTag 
                    _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: tagrectcoord}}} 
                    //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist
                    dimensions= {dimensions}
                    appprops= {{curtag: "bgtag-"+nodeuuid+"-"+tag.id, setCurbgtag: (tagid) => {setCurbgtagCallback(tagid)}, unmountCallback: () => {setCurbgtag(null)}}} //{{bgtaglist: this.state.bgtaglist}}
                />
              </Fragment>
              )
            }
          )
        }
      
      </div>
      <div style={{zIndex:0}} >
      </div>

    </div>
    || null
  );
        
}
//      <BGTagYouTube
//        _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: tagrectcoord}}} 
//        //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist
//        appprops= {{}} //{{bgtaglist: this.state.bgtaglist}}
//      />
/*
                <rect id={"bgtag-"+i} pointerEvents="all" width="100" height="100" x={tagrectcoord.x} y={tagrectcoord.y} rx="15" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="50%" style={{zIndex: 2}}/>
                <rect id={"bgtag-rect2-"+i} pointerEvents="all" width="100" height="100" x={tagrectcoord.x} y={tagrectcoord.y} rx="15" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="50%" style={{zIndex: 2}}/>
              //this.tagrectcoord = tagrectcoord;
              //this.pointerevent = 'all';
              //initTagHammer("bgtag-"+i);

//          true && 
//            <Fragment>
//              <rect id="bgtag-center" pointerEvents="fill" width={centertagrectwidth} height={centertagrectheight} x={centertagrectcoord.x} y={centertagrectcoord.y} rx="15" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="50%" />
//            </Fragment>

// an icon to escape from displaying the bgtag-center
//      true &&
//      <div style={{position: "absolute", top: centertagrectcoord.y, left: centertagrectcoord.x}}>
//	<div id="bgtag-center-tab">
//        <HighlightOffIcon id="bgtag-center-esc" style={{position: 'absolute', color: '#a0f0f0', top:2.5, left:2.5}} /> 
//        <Fullscreen id="bgtag-center-fullscreen" style={{position: 'absolute', color: '#a0f0f0', top:2.5, left:centertagrectwidth-27.5}} /> 
//	</div>
//	<BasicImageList 
//        _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: {top: 5, left: 5}, tagrectsize: {width: centertagrectwidth, height: centertagrectheight}}}} 
//        //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist
//        appprops= {{}} //{{bgtaglist: this.state.bgtaglist}}
//      	/>
//      </div>
      <BasicImageList 
        _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: {top: 5, left: 5}, tagrectsize: {width: centertagrectwidth, height: centertagrectheight}}}} 
        //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist}}
        appprops= {{}} //{{bgtaglist: this.state.bgtaglist}}
      />
      <LEAFUIComplexGrid 
        _leafjs= {{..._leafjs, render: {..._leafjs.render, tagrectcoord: centertagrectcoord, tagrectsize: {width: centertagrectwidth, height: centertagrectheight}}}} 
        //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist}}
        appprops= {{}} //{{bgtaglist: this.state.bgtaglist}}
      />
*/

export {BGTagComponent, BGTagCenterWindow };
