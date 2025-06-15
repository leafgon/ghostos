import React, { useState, useEffect, Fragment, useLayoutEffect } from 'react';
import {Vector3, Vector2, Raycaster} from 'three';
import Hammer from '@egjs/hammerjs'
import { connect } from 'react-redux';
//import LEAFUISet from '../leafui/set';
import PropTypes from 'prop-types';
import YouTube from 'react-youtube';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Typography, Tooltip } from '@material-ui/core';

import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

const THREE = {Vector3, Vector2, Raycaster}; // for easy code tracking using the keyword 'THREE'

// _leafjs to carry props for the LEAFjs standard lib, any subsequent others to carry component specific props
//const BGTagComponent = (props={ _leafjs:{}, appprops:{ bgtaglist:[] }}) => { // arguments are react JSX style props of { ...props }
const BGTagYoutube = (props) => { // arguments are react JSX style props of { ...props }

  const {_leafjs, appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
  // define global context in its own world
  const leafjscamera = _leafjs.camera; 
  const tagrectcoord = _leafjs.render.tagrectcoord;

  // mutable states
  const [nodeinfo, setNodeinfo] = useState(true);
  const [isMounted, setIsMounted] = useState(false); // element lifecycle flag
  const [isPaused, setIsPaused] = useState(false); // app specific state
  //const [testdata, setTestdata] = useState({t203: 0});

  const initHammer = (bgTagElement) => {
    const hammer = new Hammer.Manager(bgTagElement, {} ); // initialize hammer 
    let gestures = {};
    gestures['singletap'] = new Hammer.Tap({event: 'singletap'}); // add a singletap gesture 
    gestures['doubletap'] = new Hammer.Tap({event: 'doubletap', 'taps': 2}); // add a doubletap gesture 
    gestures['longpress'] = new Hammer.Tap({event: 'longpress', time:500}); // add a 500ms longpress gesture
    //const spgesture = {...gestures, swipe: new Hammer.Tap({event: 'swipe'})};
    gestures['swipe'] = new Hammer.Tap({event: 'swipe'}); // add a swipe gesture 
    //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
    gestures.doubletap.recognizeWith([gestures.singletap]); // doubletap needs this condition to coexist with singletap
    //let longPress = new Hammer.Press({event: 'longpress', time:500});
    gestures.singletap.requireFailure([gestures.doubletap, gestures.longpress]); // singletap needs this condition to coexist with doubletap and longpress
    //let swipe = new Hammer.Swipe({event: 'swipe'});

    hammer.add(Object.values(gestures)); // register the gestures list to hammer state
    // gesture definitions
    hammer.on("singletap", e => { // singletap event
      if (e.target.id) {
        console.log("HAMMERTIME on BGTagYoutube: SINGLE TAP", e.target.id); // for debugging only
        // track down the tap location based on the app JSX def specific <div> id
        // and handle the event as appropriate. 
        switch (e.target.id) {
        case "bg-tag": 
          handleTooltipOpen();
          break;
        case "pause-icon":
          handlePause();

          break;
        case "play-icon":
          handlePlay();
          break;
        default: // when you don't know what to make out of error handling... ;p
          console.error("BGTagYoutube: unknown tab target: ", e); 
        }
      }
      else { // taps from elements without ids
        console.log("HAMMERTIME on BGTagYoutube: SINGLE TAP", e.target.parentElement.id); // just to see how it works, play around with logs
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

  // the difference btwn useLayoutEffect and useEffect: https://kentcdodds.com/blog/useeffect-vs-uselayouteffect
  //useLayoutEffect(() => {
  //});

  useEffect(() => {
    // element mounted upon reaching here
    /*
    let testdata = {};
    const setTestdata = (data) => {
      testdata = data;
    };
    setTestdata({t203: 0});
    */

    // setup touch interactions on the element
    const bgTagElement = document.getElementById("bg-tag"); // find the element <div> id from the JSX def
    initHammer(bgTagElement);

    // async call to handleTooltipClose delayed by 2000ms 
    setTimeout(() => { handleTooltipClose(); }, 2000);

    // return cleanup code to the hook 
    return () => {
      setIsMounted(false); // mark the component as unmounted
      // this cleanup code is to prevent updating state on unmounted component
      // for functional component, please refer to https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
    }
  }, []);

      
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
        
  const handleTooltipOpen = () => {
    if (isMounted) {
      if (nodeinfo) {
        this.handleTooltipClose(); // only reach here if nodeinfo === true ;p
      }
      else {
        setNodeinfo(true); // flag nodeinfo on
        setTimeout(() => { this.handleTooltipClose(); }, 2000);
      }
    }
  };

  const handleTooltipClose = () => {
    if (isMounted) {
      setNodeinfo(false); // flag nodeinfo off
    }
  };

  const _onEnd = (event) => {
    // access to player in all event handlers via event.target
    event.target.playVideo();
  };

  // react element lifecycle hook
    

  return (
    _leafjs &&
    <div id="bg-tag" style={{zIndex:0, position: "absolute", top: tagrectcoord.y, left: tagrectcoord.x+2.5}}>
      <div style={{position: "absolute", top:0, left:70}}>
        <HighlightOffOutlinedIcon id="close-icon" /> 
      </div>
      <div style={{position: "absolute", top:20, left:0}}> 
        <YouTube  
          opts={{
            height: '54',
            width: '95',
            playerVars: {
              // https://developers.google.com/youtube/player_parameters
              autoplay: 1,
              paused: isPaused,

              controls: 0,
              rel: 0,
              showinfo: 0,
              modestbranding: 1,
            } 
          }}
          videoId='7NOSDKb0HlU' 
          onEnd={_onEnd}
        />
      </div>
      <div style={{position: "absolute", top:75, left:10}}>
        <PlayCircleOutlinedIcon id="play-icon" style={{position:"absolute", left:5}} />
        <PauseCircleOutlinedIcon id="pause-icon" style={{position:"absolute", left:27}} />
        <StopCircleOutlinedIcon style={{position:"absolute", left:47}} />
      </div>
    </div>
  );
        
}

export default BGTagYoutube;
