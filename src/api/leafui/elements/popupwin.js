import React, { useState, useRef, useEffect, Fragment, useLayoutEffect, isValidElement, cloneElement } from 'react';
import Hammer from '@egjs/hammerjs';
import propagating from 'propagating-hammerjs';
import { withStyles, makeStyles } from '@mui/material/styles';

import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import StopIcon from '@mui/icons-material/Stop';
import HighlightOffIcon from '@mui/icons-material/HighlightOffRounded';
import Fullscreen from '@mui/icons-material/Fullscreen';
import FullscreenExit from '@mui/icons-material/FullscreenExit';
import Minimize from '@mui/icons-material/Minimize'

import { of } from 'rxjs';

import { useLEAFPopupMenu } from './popupmenu';
import { executeLEAFLogic } from '../../parser/leaf';

const PopupCenterWindow = (props) => {
    const popupcontentHeight = useRef(0);
    const {dimensions, poprect, ismenu, camposition, appprops, isfullscr, headless} = props; // rid of the annoyance of adding 'props.' in every prop access
    const {curtag, lambda_lut, unmountCallback, setFullscrCallback} = appprops;
    //const {graphdomain, graphappid, refnode, nodelambda, contextuallambda,} = props.componentdata;
    //const [isfullscr, setIsfullscr] = useState(false);
    //const [isclosed, setIsclosed] = useState(false);
    const popupMenu = (ismenu && props.menudata) ? useLEAFPopupMenu({data: {isdebug: true, leaduuid: props.nodeuuid, sysMenuData: props.menudata, zIndex: props.zIndex}}) : undefined;
  
    useEffect(() => {
        setFullscrCallback(isfullscr);
    }, [isfullscr]);

    useEffect(() => {
      // as per https://css-tricks.com/using-requestanimationframe-with-react-hooks/
  
      // initialize state space
      //setIsfullscr(true);
      //setIsclosed(false);
      //const bgCenterTagElement = document.getElementById("bgtag-center-tab"); // find the element <div> id from the JSX def
      const bgCenterTagElement = document.getElementById("bgtagcenterframe"+props.nodeuuid); // find the element <div> id from the JSX def
      //const hammer = propagating(new Hammer.Manager(bgCenterTagElement, {} )); // initialize hammer 
      const hammer = new Hammer.Manager(bgCenterTagElement, {} ); // initialize hammer 
  
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
      //e.stopPropagation();
            let eventElemId = null;
            // spark_dev_note: hammer.js quirks show up as unruly click behaviors on mui icons, where clicking on icon "pen drawings" doesn't register e.target.id while e.target.parentElement.id registers instead
            // the following is a quick and dirty solution to get around this quirky hammer.js behavior
            if (e.target.id)
                eventElemId = e.target.id;
            else if (e.target.parentElement.id)
                eventElemId = e.target.parentElement.id;
  
            e.preventDefault();
            if (eventElemId) {
                console.log("HAMMERTIME on tab: SINGLE TAP", e.target.id); // for debugging only
                // track down the tap location based on the app JSX def specific <div> id
                // and handle the event as appropriate. 
                switch (eventElemId) {
                case "bgtag-center-esc"+props.nodeuuid: 
                    console.log("bgtag-center-esc");
                    // spark_dev_note: TBD: currently popupwin gets passed parsed LEAF functions through the props
                    // refactor this to receive the trio of noderef, nodelambda, contextuallambda instead and to
                    // have popwin parse them to respective LEAF functions of interest locally and to run the callbacks
                    // using executeLEAFLogic. pls refer to texteditor.js for a working example of this usage pattern.
                    // pls also note that the arguments being passed to unmountCallback() is currently skipping
                    // the second mandatory argument, (namely the controlflow$obj in line#256 in eta.js). 
                    //
                    // also, skipping the second argument makes it necessary to have an inport node where the construct would not necessarily require it
                    // in the flow (e.g. when the lambda is a constant function not requiring a dataflow inport). 
                    // fix it. 8/May/2022
                    //const output$obj = unmountCallback([{_stream: of([])}]); // tell its parent to unmount this component
                    //if (output$obj) {
                    //    output$obj._stream.subscribe({
                    //        next: x => {
                    //            console.log(x);
                    //        },
                    //        error: err => {
                    //            console.log(err);
                    //        },
                    //        complete: x => {
                    //            console.log(x);
                    //        }
                    //    });
                    //}
                    //executeLEAFLogic(lambda_lut.onclose._default, [], {});
                    unmountCallback();
                    //e.stopPropagation();
                    //setIsclosed(true);
                    break;
                case "bgtag-center-fullscreen"+props.nodeuuid: 
                    console.log("bgtag-center-fullscreen");
                    setFullscrCallback(true);
                    //setIsfullscr((prev) => true);
                    //e.stopPropagation();
                    break;
                case "bgtag-center-fullscreen-esc"+props.nodeuuid: 
                    console.log("bgtag-center-fullscreen-esc");
                    setFullscrCallback(false);
                    //setIsfullscr((prev) => false);
                    //e.stopPropagation();
                    break;
                case "bgtag-center-minimize"+props.nodeuuid: 
                    console.log("bgtag-center-minimize");
                    //e.stopPropagation();
                    break;
                default: // when you don't know what to make out of error handling... ;p
                    console.log("BackgroundTagComponent: unknown tab target: ", e); 
                    //e.stopPropagation();
                }
            }
            else { // taps from elements without ids
                console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.parentElement.id); // just to see how it works, play around with logs
            }
        });
      };
      initCenterTagHammer();
  
      // setup touch interactions on the element
      console.log(appprops);
      //if (_leafjs) {
  
      const popupcontentelem = document.getElementById("popupwin"+props.nodeuuid);
      //console.log(popupcontentelem);
      popupcontentHeight.current = popupcontentelem.clientHeight;
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
    }, [props.appprops]);
  
    //handleNewBGTag({center: {x: 200, y: 300}});//{x: e.center.x, y: e.center.y} t203
    //console.log("t203: ", testdata);
    //console.log("t203: ", bgtagvectors.length);
    //let rectcoord = {};
    //let rectwidth;
    //let rectheight;
    //if (isfullscr) {
    //    rectcoord.x = 0;
    //    rectcoord.y = 0;
    //    rectwidth = dimensions.width;
    //    rectheight = dimensions.height;
    //} 
    //else {
    //    rectcoord.x = poprect.rectcoord.x;
    //    rectcoord.y = poprect.rectcoord.y;
    //    rectwidth = poprect.rectwidth;
    //    rectheight = poprect.rectheight;
    //}

    const headerdisplay = headless ? {visibility: "hidden"} : {};
    return (
        <div id={"bgtagcenterframe"+props.nodeuuid} style={{zIndex: props.zIndex, overflow: "hidden", width: "100%", height: "100%"}}>
            { // an icon to escape from displaying the bgtag-center
                true &&
                <div id={"bgtagcenterfrontgroup"+props.nodeuuid} style={{zIndex: props.zIndex, display: "block", overflow: 'hidden', position: "absolute", width: props.rectwidth, height: props.rectheight, top: props.rectcoord.y, left: props.rectcoord.x, fillOpacity: '100%'}}>
                    {
                        !headless &&
                    <div id={"bgtag-center-tab"+props.nodeuuid} style={{...headerdisplay, position: "inherit", top: 0, width: props.rectwidth, height: 30, zIndex: props.zIndex}} >
                        {
                            lambda_lut.onclose && <HighlightOffIcon id={"bgtag-center-esc"+props.nodeuuid} style={{position: 'relative', color: '#a0f0f0', top: 2.5, left:2.5}} />
                        }
                        <Minimize id={"bgtag-center-minimize"+props.nodeuuid} style={{position: 'relative', color: '#a0f0f0', top:1.0, left:props.rectwidth-80}} /> 
                        {
                            isfullscr &&
                            <FullscreenExit id={"bgtag-center-fullscreen-esc"+props.nodeuuid} style={{position: 'relative', color: '#a0f0f0', top:2.5, left:props.rectwidth-75}} /> 
                            ||
                            <Fullscreen id={"bgtag-center-fullscreen"+props.nodeuuid} style={{position: 'relative', color: '#a0f0f0', top:2.5, left:props.rectwidth-75}} /> 
                        }
                    </div>
                    }
                    <div id={"popupwin"+props.nodeuuid} style={{zIndex: props.zIndex, clipPath: "url(#centerframeclippath)", position: "inherit", top: 30, verticalAlign: "bottom", width: props.rectwidth, height: props.rectheight, marginLeft: 2.5 }}>
                        {
                            props.children
                        }
                    </div>
                    <div style={{zIndex: props.zIndex, pointerEvents: "none", display: "flex", position: "inherit", width: "100%", top: -popupcontentHeight.current-30, justifyContent: "center"}}>
                        <div style={{position: "relative", display: "block"}}>
                    {
                        popupMenu
                    }
                        </div>
                    </div>
                </div>
            }
            <svg pointerEvents='none' id={"bgtagcentersvg"+props.nodeuuid} width={props.rectwidth} height={props.rectheight} style={{pointerEvents:'none', zIndex: props.zIndex, position: "absolute", top: props.rectcoord.y, left: props.rectcoord.x}}>
            {
                true && 
                <Fragment>
                <rect id={"bgtag-center"+props.nodeuuid} pointerEvents="none" width={props.rectwidth-4} height={props.rectheight-4} x={2} y={2} rx="0" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="0%" />
                <clipPath id={"centerframeclippath"+props.nodeuuid}>
                    <rect id={"bgtag-center"+props.nodeuuid} pointerEvents="none" width={props.rectwidth-6} height={props.rectheight-30} x={0.5} rx="0" stroke="#a1f0ff" strokeWidth="2" strokeOpacity="50%" fillOpacity="0%" />
                </clipPath>
                </Fragment>
            }
            </svg>
        </div>
    );
  };
//                        { children.map((child) => {
//                            if (isValidElement(child)) {
//                                const childWithProps = cloneElement(child, {dimensions: {width: props.rectwidth-5, height: props.rectheight-30, top: 30, left: 2.5}, zIndex: props.zIndex});
//                                return childWithProps;
//                            }
//                        }) }

  const leafElementPopupCenterWindowLambda = () => {

    return (props) => <PopupCenterWindow {...props} />;
  };

  export { PopupCenterWindow, leafElementPopupCenterWindowLambda };