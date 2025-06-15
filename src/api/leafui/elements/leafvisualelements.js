import React, { Component, Fragment, useState, useEffect, useRef, useLayoutEffect }  from 'react';
import { LEAT3DNavigator } from './gnav';
import { PopupCenterWindow } from './popupwin';
import BasicImageList from './imagelist';
import LEAFTextEditor from './texteditor';
import LEAFUITextPrompt from './textprompt';
import { LEAFEditor } from './floweditor';
import { cloneElement } from 'react';
import safeStringify from 'fast-safe-stringify';
import { findAddedJSON, findRemovedJSON } from './stateutils';
import Hammer from '@egjs/hammerjs';
import propagating from 'propagating-hammerjs';

import { v4 as uuid4 } from 'uuid';

import { _leafgraph } from '../../parser/nodelogic/abstraction';
import { _leafelement } from '../../parser/nodelogic/elements';
import { executeLEAFLogic } from '../../parser/leaf';
import { etaTreeForest } from '../../parser/etatreeforest';

import ReactPlayer from 'react-player';
import LEAFImageDropzone from './dropzone';
import { doUnbottle } from '../../parser/nodelogic/datautils/bottling';
import { IFrame } from './iframe';
import { LEAFDisplayLoadSpinner } from './loadspinner';
import { Subject } from 'rxjs';

import { ErrorBoundary } from "react-error-boundary";

//import parse from 'html-react-parser';

const LEAFVisualElements = (props) => {
    const componentsRef = useRef([]); // {<nodeuuid>:{component<from cloneElement or jsx declaration>: {key:<nodeuuid>, props: {nodeuuid, dimensions, zIndex, data} }, elementtype, parent:<parent-nodeuuid> }}
    const [renderState, setRenderState] = useState(undefined);
    const curPopupOfInterest = useRef(null);
    const propsData = useRef([]);
    const propsDimensions = useRef(props.dimensions);
    const _loader_channel = useRef(props.loader_channel ? {...props.loader_channel, isgnav: undefined} : {sig$: undefined, callcount: undefined, isgnav: undefined});

    const renderAgain = () => {
        setRenderState(uuid4());
    };

    const calculatePopupSizeAndLocation = (dimensions, poprect, isfullscr=true) => {
        const tagunitdist = {x: dimensions.width * 0.1, y: dimensions.height * 0.1}; // tag distance from outter border
        let tagrectcoord = {x: tagunitdist.x, y: tagunitdist.y};
        let taglinecoord = {x: tagunitdist.x + 50, y: tagunitdist.y + 50};
        let rectcoord = {x: tagunitdist.x, y: tagunitdist.y};
        let rectwidth = 300;
        let rectheight = 200;

        if (isfullscr) {
            rectcoord.x = 0;
            rectcoord.y = 0;
            rectwidth = dimensions.width;
            rectheight = dimensions.height;
        }
        else {
            if (typeof poprect === 'string') {
                switch(poprect) {
                    case 'left':
                        rectcoord.x = 0;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width/2;
                        rectheight = dimensions.height;
                        break;
                    case 'll': // leftleft
                        rectcoord.x = 0;
                        rectcoord.y = dimensions.height/4;
                        rectwidth = dimensions.width/4;
                        rectheight = dimensions.height/2;
                        break;
                    case 'right':
                        rectcoord.x = dimensions.width/2;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width/2;
                        rectheight = dimensions.height;
                        break;
                    case 'rr': // rightright
                        rectcoord.x = dimensions.width/4;
                        rectcoord.y = dimensions.height/4;
                        rectwidth = dimensions.width/4;
                        rectheight = dimensions.height/2;
                        break;
                    case 'top':
                        rectcoord.x = 0;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width;
                        rectheight = dimensions.height/2;
                        break;
                    case 'tt':
                        rectcoord.x = 0;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width;
                        rectheight = dimensions.height/4;
                        break;
                    case 'bottom':
                        rectcoord.x = 0;
                        rectcoord.y = dimensions.height/2;
                        rectwidth = dimensions.width;
                        rectheight = dimensions.height/2;
                        break;
                    case 'bb': // bottombottom
                        rectcoord.x = 0;
                        rectcoord.y = 3*dimensions.height/4;
                        rectwidth = dimensions.width;
                        rectheight = dimensions.height/4;
                        break;
                    case 'topleft':
                        rectcoord.x = 0;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width/2;
                        rectheight = dimensions.height/2;
                        break;
                    case 'ttll': //toptopleftleft
                        rectcoord.x = 0;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width/4;
                        rectheight = dimensions.height/4;
                        break;
                    case 'topright':
                        rectcoord.x = dimensions.width/2;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width/2;
                        rectheight = dimensions.height/2;
                        break;
                    case 'ttrr': // toptoprightright
                        rectcoord.x = 3*dimensions.width/4;
                        rectcoord.y = 0;
                        rectwidth = dimensions.width/4;
                        rectheight = dimensions.height/4;
                        break;
                    case 'bottomleft':
                        rectcoord.x = 0;
                        rectcoord.y = dimensions.height/2;
                        rectwidth = dimensions.width/2;
                        rectheight = dimensions.height/2;
                        break;
                    case 'bbll': //bottombottomleftleft
                        rectcoord.x = 0;
                        rectcoord.y = 3*dimensions.height/4;
                        rectwidth = dimensions.width/4;
                        rectheight = dimensions.height/4;
                        break;
                    case 'bottomright':
                        rectcoord.x = dimensions.width/2;
                        rectcoord.y = dimensions.height/2;
                        rectwidth = dimensions.width/2;
                        rectheight = dimensions.height/2;
                        break;
                    case 'bbrr':
                        rectcoord.x = 3*dimensions.width/4;
                        rectcoord.y = 3*dimensions.height/4;
                        rectwidth = dimensions.width/4;
                        rectheight = dimensions.height/4;
                        break;
                    case 'center':
                        rectcoord.x = dimensions.width/4;
                        rectcoord.y = dimensions.height/4;
                        rectwidth = dimensions.width/2;
                        rectheight = dimensions.height/2;
                        break;
                }
            }
            else {
                //const {width, height, top, left} = poprect;

                // poprect defaults to the 'center' setup
                rectcoord.x = dimensions.width/4;
                rectcoord.y = dimensions.height/4;
                rectwidth = dimensions.width/2;
                rectheight = dimensions.height/2;
                //rectcoord.x = dimensions.width*(left/12); //(100 + tagunitdist.x) + 50;
                //rectcoord.y = dimensions.height*(top/12); //dimensions.height/2; //100 + tagunitdist.y + 50;
                ////rectwidth = dimensions.width - (100 + tagunitdist.x)*2 - 100;
                ////rectheight = dimensions.height - (100 + tagunitdist.y)*2 - 100;
                //rectwidth = dimensions.width*(width/12);
                //rectheight = dimensions.height*(height/12);
            }
        }
        //rectcoord.x = (100 + tagunitdist.x) + 100;
        //rectcoord.y = 100 + tagunitdist.y + 100;
        //rectwidth = _leafjs.render.width - (100 + tagunitdist.x)*2 - 200;
        //rectheight = _leafjs.render.height - (100 + tagunitdist.y)*2 - 200;
        //else {
        //    //rectcoord.x = (100 + tagunitdist.x) + 50;
        //    //rectcoord.y = 100 + tagunitdist.y + 50;
        //    //rectwidth = dimensions.width - (100 + tagunitdist.x)*2 - 100;
        //    //rectheight = dimensions.height - (100 + tagunitdist.y)*2 - 100;
        //    rectcoord.x = 0; //(100 + tagunitdist.x) + 50;
        //    rectcoord.y = 0; //dimensions.height/2; //100 + tagunitdist.y + 50;
        //    rectwidth = dimensions.width - (100 + tagunitdist.x)*2 - 100;
        //    rectheight = dimensions.height - (100 + tagunitdist.y)*2 - 100;
        //}

        return {rectcoord, rectwidth, rectheight};
    };

    const updateComponentProp = (compelement, compprop, childcompprop=undefined) => {
        const children = compelement?.props?.children;

        //// debug
        //if (compelement.props.nodeuuid.slice(-4) === 'f537')
        //    console.log(children);
        //// end of debug
        const react_instance = (children !== undefined ? 
            cloneElement(
                compelement,
                compprop,
                [children].flat().map(child => {
                    const _child_instance = ((typeof child === "string") ? child : updateComponentProp(child, childcompprop ? childcompprop : compprop));
                    return _child_instance;
                })
            ) :
            cloneElement(
                compelement,
                compprop
            )
        );

        return react_instance;
    };

    const refreshZIndexOrder = (popupofinterest, isrenderagain=true) => {
        curPopupOfInterest.current = popupofinterest;

        // reset zIndex to props.zRange.min for previous popupofinterest 
        componentsRef.current = componentsRef.current.map((compobj) => {
            if (compobj.props.zIndex > props.zRange.min) {
                return updateComponentProp(compobj, {zIndex: props.zRange.min});
            }
            else
                return compobj;
        });

        // set zIndex to props.zRange.max for current popupofinterest
        componentsRef.current = componentsRef.current.map(x => {
            if (x.props.nodeuuid === popupofinterest)
                return updateComponentProp(x, {zIndex: props.zRange.max})
            else
                return x;
        });

        //componentList.current = Object.entries(componentsRef.current).map(([compkey, compobj]) => {
        //    if (!parent) // if NOT a child
        //        return compobj.component;
        //});

        if (isrenderagain)
            renderAgain();
    };

    const retrieveMenuData = async (nodeuuid) => {
        const lambdactrl = {
            gos: {
                standardSpellbook: {},
                curatedSpellbook: {},
                stdlambdalut: {},
                curatedlambdalut: {},
                //leafio: leafRuntimeRef.current.leafio,
                //etaTree: {mnemosyne: mainMnemosyne, domain: host_domain, appid: host_appid}, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
                leafio: props.etaTree.leafio,
                etaTree: props.etaTree, // root etaTree
            }, 
            user: {
                spellbook: {},
                lambdalut: {},
            }
        };
        const combinedMenuData = {diamonds: []};
        const {domain, appid} = lambdactrl.gos.etaTree;
        const leafgraph_args = {graphuuid: '', domain, appid, graphaddrstr: 'breezyforest/editormenu'};
        const getLEAFGraph = _leafgraph.lambda(lambdactrl)({refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: ["leafvisualelements"]});
        const rt_leafgraph = await getLEAFGraph; //.then((response) =>  // async call to get leafgraph
        // do something with the response once the leafgraph is resolved
        if (rt_leafgraph && 'menudata' in rt_leafgraph && '_default' in rt_leafgraph.menudata) {
            let menudata = await executeLEAFLogic(rt_leafgraph.menudata._default, []);
            menudata = doUnbottle("screenio", menudata);
            if (menudata && menudata.type === "leafdeckheart") {
                combinedMenuData.diamonds = combinedMenuData.diamonds.concat(menudata.diamonds);
                console.log('the leaf standard menu data for popup window have been loaded.', rt_leafgraph);
            }
            else {
                console.log('the leaf standard menu data for popup window have zero menu entries.', rt_leafgraph);
            }
        }
        else {
            console.warn('the leaf standard menu data for popup window could not be loaded.');
        }

        // now work on user defined menu data for the popup window
        const elementMethodsLUT = await _leafelement.methods(lambdactrl)({refnode: nodeuuid, nodelambda: [], contextuallambda: []});
        const elementLambdaLUT = await elementMethodsLUT.general.getLambdaLUT();

        if (elementLambdaLUT && 'menudata' in elementLambdaLUT && '_default' in elementLambdaLUT.menudata) {
            const menudata = await executeLEAFLogic(elementLambdaLUT.menudata._default, []);
            if (menudata.type === "leafdeckheart" > 0) {
                combinedMenuData.diamonds = combinedMenuData.diamonds.concat(menudata.diamonds);
                console.log('the user-defined menu data for the popup window have been loaded.');
            }
            else {
                console.log('the user-defined menu data for the popup window have zero menu entries.');
            }
        }

        return combinedMenuData;
        //return undefined;
    }

    const reconstructVisuals = async (elementbase=componentsRef.current, data, _props=undefined) => {
        // data as produced by leafelement.js
        // dynamic prop reloading by cloneElement as per https://stackoverflow.com/questions/40192882/set-components-props-dynamically
        if (!(typeof data === 'object' && 'element' in data)) { // error condition
            console.error("LEAF Error: reconstructVisuals(): invalid visual data passed in:", data);
            return undefined;
        }

        const element_dimensions = _props ? {width: _props.rectwidth, height: _props.rectheight, top: _props.rectcoord.top, left: _props.rectcoord.left} : propsDimensions.current;
        if ('gnav' === data.element.type) { // calling for reconstruction of the gnav 3D orbitals and the moon based on data props
            // expect data to be in {element: {nodeuuid, type, componentdata: {graph_data, graph_options}}}
            const render_id = uuid4();
            const {graph_data: _graph_data, backdrop_url: _backdrop_url, bgtagvectors: _bgtagvectors, tagaction: _tagaction, blankaction: _blankaction, graph_options: _graph_options} = data.element.componentdata;
            const elementref = elementbase.filter(x=> x.props.nodeuuid === data.element.nodeuuid);
            if (elementref.length > 0) {
                
                const react_instance = cloneElement(
                    elementref[0],
                    {dimensions: element_dimensions, data: {graph_data: _graph_data, backdrop_url: _backdrop_url, bgtagvectors: _bgtagvectors, tagaction: _tagaction, blankaction: _blankaction, render_id: render_id}, zIndex: _props ? _props.zIndex : props.zRange.min}
                );
                //elementbase[data.element.nodeuuid] = {component: react_instance, elementtype: 'gnav', parent: parentid};
                return react_instance;
            }
            else {
                //const _core_instance_prom = (async () =>
                //    <LEAT3DNavigator key={data.element.nodeuuid} nodeuuid={data.element.nodeuuid} dimensions={element_dimensions} 
                //        data={{
                //            graph_data: _graph_data, 
                //            backdrop_url: _backdrop_url, 
                //            bgtagvectors: _bgtagvectors, 
                //            tagaction: _tagaction, 
                //            blankaction: _blankaction, 
                //            render_id: render_id,
                //            loader_callback: () => {
                //                if (_loader_channel.current.callcount === 0) {
                //                    _loader_channel.current.sig$.next('LEAT3DNavigator loaded');
                //                    _loader_channel.current.callcount = _loader_channel.current.callcount + 1;
                //                }
                //            }
                //        }} 
                //        leafio={undefined} graph_options={_graph_options} 
                //        zIndex={_props ? _props.zIndex : props.zRange.min} 
                //    />
                //)(); // instance promise loading asynchronously, so we can display the spinner asap
                //const react_instance = (<LEAFDisplayLoadSpinner _signal$={_loader_sig$} elemkey={data.element.nodeuuid+"-wrapper"} childprom={_core_instance_prom}></LEAFDisplayLoadSpinner>);
                ////elementbase[data.element.nodeuuid] = {component: react_instance, elementtype: 'gnav', parent: parentid};
                //return react_instance;

                const react_instance = (<LEAT3DNavigator key={data.element.nodeuuid} nodeuuid={data.element.nodeuuid} dimensions={element_dimensions} 
                    data={{
                        graph_data: _graph_data, 
                        backdrop_url: _backdrop_url, 
                        bgtagvectors: _bgtagvectors, 
                        tagaction: _tagaction, 
                        blankaction: _blankaction, 
                        render_id: render_id,
                        loader_callback: () => {
                            if (_loader_channel.current.callcount === 0) {
                                _loader_channel.current.sig$.next('LEAT3DNavigator loaded');
                                _loader_channel.current.callcount = _loader_channel.current.callcount + 1;
                            }
                        }
                    }} 
                    leafio={undefined} graph_options={_graph_options} 
                    zIndex={_props ? _props.zIndex : props.zRange.min} 
                />)
                _loader_channel.current.isgnav = true;
                return react_instance;
            }
        }
        else if ('popup' === data.element.type) {
            // expect data to be in {element: {nodeuuid, type, componentdata: {unmountCallback, children}}}
            const {children, unmountCallback, poprect, ismenu, headless, graphdomain, graphappid, nodelambda, contextuallambda} = data.element.componentdata; // componentdata as put together in leafelement.js
            const refnode = data.element.nodeuuid;
            const componentdata = data.element.componentdata; // componentdata as put together in leafelement.js
            const etaTree = await etaTreeForest(props.etaTree).getEtaTree(graphdomain, graphappid);

            const lambdafuncLUTPromise = etaTree.lookupRuntimeLambdaLUT(graphdomain, graphappid, refnode, nodelambda, contextuallambda);
            const lambda_lut = await lambdafuncLUTPromise;
            const render_id = uuid4();
            const getCurElementPropState = () => {
                const cur_el = componentsRef.current.filter(_cur_el => {
                    if(_cur_el.props.nodeuuid === data.element.nodeuuid)
                        return _cur_el.props;
                });
                if (cur_el.length === 1)
                    return cur_el[0].props;
                if (cur_el.length === 0)
                    return undefined;
                // otherwise length > 1 and this shouldn't happen, and be considered as an error
                console.error("LEAF client error: LEAF elements with a clashing nodeuuid found.")
            };
            const curelemprops = getCurElementPropState();
            const curisfullscr = curelemprops ? curelemprops.isfullscr : (poprect ? false : true);
            //spark_dev_note: the current coding practice to support the local state persistency across 
            // multiple rendering situations isn't too straightforward to understand
            // currently, the state of a popup element wrt the screen size (i.e. fullscreen or not)
            // is handled such that "fullscreen" is a special case compared to "not in fullscreen" 
            // in terms of how the popup size and location are calculated.
            // the fullscreen mode is the default, hence is lacking the "fullscreen" lambda label option.
            // and a popup element's fullscreen-ness is actively determined based on user interaction
            // therefore a rudimentary caching mechanism is employed to enable the screen size and location
            // to persist between different rendering occasions once a popup is spawned.
            const {rectcoord, rectwidth, rectheight} = calculatePopupSizeAndLocation(propsDimensions.current, poprect, curisfullscr);
            const curZIndex = data.element.nodeuuid === curPopupOfInterest.current ? props.zRange.max : props.zRange.min;
            const curElemRef = [];
            const setFullscrCallback = (isfullscr) => {
                const sizeandloc  = calculatePopupSizeAndLocation(propsDimensions.current, poprect, isfullscr);
                //const compobj = curElemRef.filter(x=> x.props.nodeuuid === data.element.nodeuuid)[0]; //elementbase[data.element.nodeuuid];

                const _dimensions = {height: sizeandloc.rectheight, width: sizeandloc.rectwidth, top: sizeandloc.rectcoord.y, left: sizeandloc.rectcoord.x};
                componentsRef.current = componentsRef.current.map(x => {
                    if (x.props.nodeuuid === data.element.nodeuuid)
                        return updateComponentProp(x, {dimensions: _dimensions, ...sizeandloc, isfullscr});
                    else
                        return x;
                }); 
                refreshZIndexOrder(data.element.nodeuuid, false);
                //if (data.element.nodeuuid !== curPopupOfInterest.current)

                //componentList.current = Object.entries(elementbase).map( ([compkey, compobj]) => {
                //    if (!compobj.parent) // if parent === undefined, or the component is NOT a child
                //        return compobj.component;
                //});
                renderAgain();
            };
            const elementref = elementbase.filter(x=> x.props.nodeuuid === data.element.nodeuuid);
            const popupMenuData = await retrieveMenuData(data.element.nodeuuid);
            if (elementref.length > 0) {
                //() => {
                //    delete componentsRef.current[data.element.nodeuuid];
                //};
                // spark_dev_note: TBD: this is where leafgraph queries take place to retrieve any LEAF logic
                // for producing data to be passed downstream to the SystemMenuComponent + DebugPort
                // this kind of querying construct/logic to weld the respective logic of leafgraph and 
                // javascript at runtime needs to be modularized as a util. pls look at other similar 
                // use cases including the use of _leafgraph in parseGraphNodesToEditorElements() of floweditor/index.js
                // and in leafdeckspade.js
                // each child component should 
                const _dimensions = {height: rectheight, width: rectwidth, top: rectcoord.y, left: rectcoord.x};
                const children_visuals = await Promise.all(children.map(child => {return reconstructVisuals(elementref[0].props.children, child, {curZIndex, rectcoord, rectwidth, rectheight})}));
                const react_instance = cloneElement(
                    elementref[0],
                    {dimensions: _dimensions, headless: headless, menudata: popupMenuData, ismenu, rectcoord, rectwidth, rectheight, appprops: {lambda_lut, unmountCallback, setFullscrCallback}, render_id: render_id, zIndex: curZIndex},
                    children_visuals
                );
                //elementbase[data.element.nodeuuid] = {component: react_instance, elementtype: 'popup', parent: parentid};
                curElemRef.push(react_instance);
                return react_instance;
            }
            else {
                const children_visuals = (await Promise.all(children.map(child => {return reconstructVisuals([], child, {curZIndex, rectcoord, rectwidth, rectheight})}))).filter(_=>_!==undefined);
                const _dimensions = {height: rectheight, width: rectwidth, top: rectcoord.y, left: rectcoord.x};
                const react_instance = <PopupCenterWindow key={data.element.nodeuuid} headless={headless} menudata={popupMenuData} ismenu={ismenu} zIndex={curZIndex} nodeuuid={data.element.nodeuuid} dimensions={_dimensions} rectcoord={rectcoord} rectwidth={rectwidth} rectheight={rectheight} appprops={{lambda_lut, unmountCallback, setFullscrCallback}} isfullscr={curisfullscr} >
                    {children_visuals}
                </PopupCenterWindow>;
                //elementbase[data.element.nodeuuid] = {component: react_instance, elementtype: 'popup', parent: parentid};
                curElemRef.push(react_instance);
                return react_instance;
            }
        }
        else if ('image' === data.element.type) {
            //const {image_data: _image_data} = data.element.componentdata;
            const {imagelist: _image_data} = data.element.componentdata;
            //const react_instance = <BasicImageList key={data.element.nodeuuid} zIndex={zIndex} data={{image_data: _image_data}} />
            const react_instance = <BasicImageList key={data.element.nodeuuid} data={{image_data: _image_data, dimensions: propsDimensions.current}} />

            return react_instance;
        }
        else if ('mediainput' === data.element.type) {
            const {mediatype: _mediatype, nodeinput: _nodeinput, callbacks: _callbacks} = data.element.componentdata;

            if (_mediatype === 'image') {
                return <LEAFImageDropzone key={data.element.nodeuuid} data={{nodeuuid: data.element.nodeuuid, dimensions: propsDimensions.current, nodeinput: _nodeinput}} callbacks={{..._callbacks}} />
            }
            // need to define elements to handle mediatype of audio and video

            return undefined;
        }
        else if ('editor' === data.element.type) {
            if (_props) {
                const {domain, appid} = data.element.componentdata;
                const react_instance = <LEAFEditor key={data.element.nodeuuid} dimensions={{width: _props.rectwidth, height: _props.rectheight}} domain={domain} appid={appid} debug={true} leafRuntime={props.leafRuntime} etaTree={props.etaTree} leafio={props.leafio} masterSubsDir={props.masterSubsDir} />;

                return react_instance;
            }
            else { // a standalone editor
                const popupMenuData = await retrieveMenuData(data.element.nodeuuid);
                const {domain, appid} = data.element.componentdata;
                const react_instance = <LEAFEditor key={data.element.nodeuuid} zIndex={props.zRange.min} menudata={popupMenuData} dimensions={props.dimensions} domain={domain} appid={appid} debug={true} leafRuntime={props.leafRuntime} etaTree={props.etaTree} leafio={props.leafio} masterSubsDir={props.masterSubsDir} />;
                //const react_instance = <LEAFEditor key={data.element.nodeuuid} dimensions={props.dimensions} domain={domain} appid={appid} debug={true} etaTree={props.etaTree} leafio={props.leafio} masterSubsDir={props.masterSubsDir} />;

                return react_instance;
            }
        }
        else if ('text' === data.element.type) {
            //const {textsource, lambdasourceuuid, dataflowinput} = data.element.componentdata; // componentdata as put together in leafelement.js
            const componentdata = data.element.componentdata; // componentdata as put together in leafelement.js
            const {graphdomain, graphappid} = componentdata;
            const etaTree = await etaTreeForest(props.etaTree).getEtaTree(graphdomain, graphappid);
            const react_instance = <LEAFTextEditor key={data.element.nodeuuid} renderid={props.renderid} componentdata={componentdata} etaTree={etaTree} dimensions={props.dimensions} />;

            return react_instance;
        }
        else if ('prompt' === data.element.type) {
            const {uidefs, margin, fieldwidth, graphdomain, graphappid, refnode, nodelambda, contextuallambda} = data.element.componentdata;
            const promptprops = {uidefs, margin, fieldwidth, refnode, nodelambda, contextuallambda};
            const etaTree = await etaTreeForest(props.etaTree).getEtaTree(graphdomain, graphappid);
            const react_instance = <LEAFUITextPrompt key={data.element.nodeuuid} {...data.element.componentdata} etaTree={etaTree} dimensions={element_dimensions} />

            return react_instance;
        }
        else if ('mediaplayer' === data.element.type) {
            const {uri, margin, fieldwidth, graphdomain, graphappid, refnode, nodelambda, contextuallambda} = data.element.componentdata;
            const promptprops = {uri, margin, fieldwidth, refnode, nodelambda, contextuallambda};
            //const etaTree = await etaTreeForest(props.etaTree).getEtaTree(graphdomain, graphappid);
            const cur_aspectratio = props.dimensions.width / (props.dimensions.height-60);

            const lambdafuncLUTPromise = props.etaTree.lookupRuntimeLambdaLUT(graphdomain, graphappid, refnode, nodelambda, contextuallambda);
            const lambdafuncLUT = await lambdafuncLUTPromise;

            const onProgressCallback = (playerstate) => {
                const {played, playedSeconds, loaded, loadedSeconds} = playerstate;
                console.log("start debugging");
                if ('onProgress' in lambdafuncLUT && lambdafuncLUT.onProgress._default)
                    executeLEAFLogic(lambdafuncLUT.onProgress._default, playerstate);
            };
            
            let aspectratioval = 1.77;
            if (cur_aspectratio > 1.77) {
                aspectratioval = cur_aspectratio; //cur_aspectratio
            }
            const react_instance = 
            //<span pointerEvents='none' width='auto' height='auto' style={{position:'relative', aspectRatio: aspectratioval, marginLeft: '2px', marginRight: '6px', marginBottom: '10px'}}>
            <ReactPlayer 
                key={data.element.nodeuuid} url={uri} 
                controls={true}
                style={{position:'relative', aspectRatio: aspectratioval, marginLeft: 'auto', marginRight: 'auto', marginTop: 'auto', marginBottom: 'auto'}}
                width='auto'
                height='auto'
                onProgress={onProgressCallback}
            />
            //</span>

            return react_instance;
        }
        else if ('html' === data.element.type) {
            //const {image_data: _image_data} = data.element.componentdata;
            const {innerhtml: _innerhtml, callback: _callback} = data.element.componentdata;
            //const react_instance = <BasicImageList key={data.element.nodeuuid} zIndex={zIndex} data={{image_data: _image_data}} />
            // as per https://stackoverflow.com/questions/37337289/react-js-set-innerhtml-vs-dangerouslysetinnerhtml
                //<html dangerouslySetInnerHTML={{__html: _innerhtml}}></html>
            // as per https://www.npmjs.com/package/html-react-parser
            const isValidUrl = urlString=> {
                const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
                '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
                return !!urlPattern.test(urlString);
            };

            const is_url_str = isValidUrl(_innerhtml);

            const _anchorpoint = globalThis.location.hash.slice(1);

            //const innercomponents = parse(_innerhtml).filter(_=>_?.$$typeof);
            const react_instance = (is_url_str ? (<IFrame id={"iframe-"+data.element.nodeuuid} anchorpoint={_anchorpoint} key={data.element.nodeuuid} src={_innerhtml} msgcallback={_callback}>
                </IFrame>) :
                <IFrame id={"iframe-"+data.element.nodeuuid} anchorpoint={_anchorpoint} key={data.element.nodeuuid} srcDoc={_innerhtml} msgcallback={_callback}></IFrame>
                //(<IFrame>
                //    {parse(_innerhtml).filter(_=>_?.$$typeof)}
                //</IFrame>)
            ); 
            //<BasicImageList key={data.element.nodeuuid} data={{image_data: _image_data, dimensions: propsDimensions.current}} />

            return react_instance;
        }
    };
    
    useLayoutEffect(() => {
    }, []);

    useEffect(() => {

        if (props.data[0] !== 'accio') 
        // spark_dev_note: the word 'accio' originates from App.js
        // TBD: this check was introduced as a hack to get around a nasty bug of accidentally making a
        // leaf construct the main graph by connecting inport/outport causing a damaging change to the
        // visual, usually end up blacking out the whole scene. 
        // might be a sane solution. give it some thought.
        {
            // check for removed elements
            const curElementList = componentsRef.current.map(x => {return {uuid: x.props.nodeuuid}});
            props.data.flat().filter(_=>_).map(_=>{
                if (_?.element?.nodeuuid)
                    return _;
                else
                    console.log("start debugging");
            });
            const newElementList = props.data.flat().filter(_=>_).map(x => {return {uuid: x.element.nodeuuid}});
            //const added_elements = findAddedJSON(curElementList, props.data.map(x => x.nodeuuid)); 
            const removed_elements = findRemovedJSON(curElementList, newElementList).map(x => x.uuid);

            // remove the local reference for garbage collection
            componentsRef.current = componentsRef.current.filter(x => !removed_elements.includes(x.props.nodeuuid));

            // iterate through visual elements data and reconstruct/update React components
            propsData.current = props.data.flat();
            propsDimensions.current = props.dimensions;
            Promise.all(props.data.flat().map((_data)=> {
                if ('element' in _data) {
                    const react_instance = reconstructVisuals(componentsRef.current, _data);
                    return react_instance;
                }
            })).then((resolved_visuals) => {
                componentsRef.current = resolved_visuals;
                renderAgain();
                if (resolved_visuals.length > 0 && !_loader_channel.current.isgnav && _loader_channel.current.sig$) {
                    _loader_channel.current.sig$.next('LEAT3DNavigator loaded');
                    _loader_channel.current.callcount = _loader_channel.current.callcount + 1;
                }
            });
        }

        // now return a clean up function
        return () => {
            // TBD: do all the clean up here
            propsData.current = [];
            //componentsRef.current = []; 
            console.log("leafvisualelements: cleaning up done.");
        }
    }, [props.data, props.etaTree, props.dimensions]);

    //useEffect(() => {
    //    console.error("leafvisualelement.js: useEffect block for props.etaTree entered");
    //    Promise.all(props.data.flat().map((_data)=> {
    //        if ('element' in _data) {
    //            const react_instance = reconstructVisuals(componentsRef.current, _data);
    //            return react_instance;
    //        }
    //    })).then((resolved_visuals) => {
    //        componentsRef.current = resolved_visuals;
    //        console.error("leafvisualelement.js: useEffect block for props.etaTree being done");
    //        renderAgain();
    //        if (resolved_visuals.length > 0 && !_loader_channel.current.isgnav && _loader_channel.current.sig$) {
    //            _loader_channel.current.sig$.next('LEAT3DNavigator loaded');
    //            _loader_channel.current.callcount = _loader_channel.current.callcount + 1;
    //        }
    //        console.error("leafvisualelement.js: useEffect block for props.etaTree done");
    //    });
    //}, [props.etaTree]);

    useEffect(() => {
        const trackPopupOfInterest = (element) => {
            if (element.id === 'leafvisualelement') { // reached upper boundary without hitting the popup element of interest, aborting the mission
                return undefined;
            }
            const target_re = /bgtagcenterframe([\w\-]+)/;
            const re_match = element.id.match(target_re);
            const match_str = (re_match && re_match.length > 0) ? re_match[1] : undefined;
            if (match_str) {
                return match_str;
            }
            else {
                return trackPopupOfInterest(element.parentElement);
            }
        }

        const visualElement = document.getElementById("leafvisualelement"); // find the element <div> id from the JSX def
        //const hammer = propagating(new Hammer.Manager(visualElement, {} )); // initialize hammer 
        const hammer = new Hammer.Manager(visualElement, {} ); // initialize hammer 
        const initHammer = () => {
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
      
              const popupofinterest = trackPopupOfInterest(e.target);
              if (popupofinterest) {
                    refreshZIndexOrder(popupofinterest);
              }

              //if (eventElemId) {
              //  console.log("HAMMERTIME on tab: SINGLE TAP", e.target.id); // for debugging only
              //  // track down the tap location based on the app JSX def specific <div> id
              //  // and handle the event as appropriate. 
              //  switch (eventElemId) {
              //  case "bgtag-center-esc": 
              //      //e.stopPropagation();
              //      console.log("bgtag-center-esc");
              //      unmountCallback(); // tell its parent to unmount this component
              //      //setIsclosed(true);
              //      break;
              //  case "bgtag-center-fullscreen": 
              //      //e.stopPropagation();
              //      console.log("bgtag-center-fullscreen");
              //      setIsfullscr((prev) => true);
              //      break;
              //  case "bgtag-center-fullscreen-esc": 
              //      //e.stopPropagation();
              //      console.log("bgtag-center-fullscreen-esc");
              //      setIsfullscr((prev) => false);
              //      break;
              //  case "bgtag-center-minimize": 
              //      //e.stopPropagation();
              //      console.log("bgtag-center-minimize");
              //      break;
              //  default: // when you don't know what to make out of error handling... ;p
              //    console.log("BackgroundTagComponent: unknown tab target: ", e); 
              //  }
              //}
              //else { // taps from elements without ids
              //  console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.parentElement.id); // just to see how it works, play around with logs
              //}
            });
        };
        initHammer();

        // now return a clean up function
        return () => {
            // TBD: do all the clean up here
            hammer.destroy();
            console.log("leafvisualelements: cleaning up hammer done.");
        }
    }, []);
                    

    const logError = (error , info) => {
        // Do something with the error, e.g. log to an external API
        console.error('Error occurred within the ErrorBoundary of LEAFVisualElements: ', error.message);
        console.error(info.componentStack);
        // otherwise do nothibng
    };
    return(
        <React.Fragment>
          <ErrorBoundary onError={logError}>
            <div id='leafvisualelement'>
            {
                componentsRef.current
            }
            </div>
          </ErrorBoundary>
        </React.Fragment>
    );
};

export { LEAFVisualElements };
