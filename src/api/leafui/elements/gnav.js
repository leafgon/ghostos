import React, { useState, useEffect, useRef, Fragment, useLayoutEffect, useCallback } from 'react';

import Hammer from '@egjs/hammerjs';
import propagating from 'propagating-hammerjs';
import * as THREE from 'three';
import ProjectedMaterial, { project } from '../lib/ProjectedMaterial';
import TWEEN from '@tweenjs/tween.js';
import assets_manager from '../lib/assets/AssetManager';
import {LEAFWebGLCubeRenderTarget} from '../lib/images/leafwebgl'

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import { ForceDirectedLayout } from "../lib/layouts/force-directed-layout";

import ReactDOM from "react-dom";
import Tooltip from "@material-ui/core/Tooltip";
import Button from "@material-ui/core/Button";
//import { makeStyles } from "@material-ui/core/styles";
//import { makeStyles } from "@mui/styles";
import { styled } from "@mui/system";
import '../styles/App.css';
import LEAFUISet from './set';

//import { connect } from 'react-redux';
import { Provider } from "react-redux";

import GraphLabelComponent from './graphlabel'
import UserPromptComponent from './userprompt'
import SystemMenuComponent from './sysmenu'
import { BGTagComponent } from './bgtag'
//import { PopupCenterWindow } from './leafui/popupwin'
import { PopupCenterWindow } from './popupwin'
//import { OscillatorAnimation } from 'react-spring/dist/addons'
import DynamicScriptLoaderService from '../lib/DynScriptLoader'
import axios from 'axios';
import { v4 as uuid4 } from 'uuid';
//import { filter3DNodes, filter3DEdges } from './leafapp/filters/gnav/3dview';

//import { useLEAFIOapi, LEAFIOmetamodel } from '@lea/gosjs';
import { useLEAFIOapi } from '../../leafio/core';
import { LEAFIOmetamodel } from '../../metamodel';
import Vector3 from '../lib/layouts/Vector3';

import BasicImageList from './imagelist';

import { findAddedJSON, findRemovedJSON } from './stateutils';

//import YouTubeToHtml5 from '@thelevicole/youtube-to-html5-loader';
import ReactPlayer from 'react-player';
import styles from './gnav.module.css';
import { MutatingDots } from 'react-loader-spinner';

const ENV_RADIUS = 2000000
const leafgon_url = process.env.LEAFGON_URL;
//const leafgon_url = 'http://localhost:3000';
//const leafgon_url = 'https://www.leafgon.com';

// as per https://stackoverflow.com/questions/10425310/three-js-full-screen-issue
//        display: flex;
//        overflow: hidden;
const css_style_override = `
  #curLEAFapp, #curLEAFapp>div {
      height: 100%;
  }
  .outter {
        display: block; 
        align-items: center;
        justify-content: center;
        margin: 20px auto;
        width: 100%;
        height: 40px;
        border-width: 0px;
        border-color: red;
        border-style: solid;
      }
  .inner {
        width: 100%;
        height: 100%;
        background-color: black;
      }
  *:focus {
      outline:none !important;
  }`;

const BLOOM_SCENE = 1;
const ENTIRE_SCENE = 0;

//const makegnavStyles = makeStyles((theme) => ({
//    gnavcanvas: {
//      display: 'block', // to remove space at bottom of canvas as per https://stackoverflow.com/questions/10425310/three-js-full-screen-issue
////      display: 'flex',
////      overflow: 'hidden'
//    },
//}));
const GNavCanvas = styled("canvas")({
    display: 'block'    // to remove space at bottom of canvas as per https://stackoverflow.com/questions/10425310/three-js-full-screen-issue
});

// Redux boilerplate function for integrating Redux dispatch calls in React component props
const mapDispatchToProps = (dispatch) => {
    return {
      updateGraphLabels: (graphlabel_lut) => {dispatch({type: 'leat3dnav/updateGraphLabels', payload: {"graphlabel_lut": graphlabel_lut}})},
      updateAGraphLabel: (graphlabel_uuid, graphlabel) => {dispatch({type: 'leat3dnav/updateAGraphLabel', payload: {"uuid": graphlabel_uuid, "graphlabel": graphlabel}})}
    }
}
  
const mapStateToProps = (state) => {
    return {
        state: state
    }
}

const sphericalCoordToTHREECameraCoord = (sp_coord) => {
    return new THREE.Vector3(sp_coord.y, sp_coord.z, sp_coord.x);
};

const threeCameraCoordToSphericalCoord = (th_coord) => {
    return new THREE.Vector3(th_coord.z, th_coord.x, th_coord.y);
};

const setupRaycaster = (screenpoint, dimensions, camera) =>
{
  const raycaster = new THREE.Raycaster();
  let canvaspoint = new THREE.Vector2();
  //canvaspoint.x = ((screenpoint.x - _leafjs.render.canvrect.left)/ (_leafjs.render.canvrect.right - _leafjs.render.canvrect.left)) * 2 - 1;
  //canvaspoint.y = - ((screenpoint.y - _leafjs.render.canvrect.top)/ (_leafjs.render.canvrect.bottom - _leafjs.render.canvrect.top)) * 2 + 1;
  canvaspoint.x = ((screenpoint.x - dimensions.left)/ (dimensions.width)) * 2 - 1;
  canvaspoint.y = - ((screenpoint.y - dimensions.top)/ (dimensions.height)) * 2 + 1;
  raycaster.setFromCamera(canvaspoint, camera);

  return raycaster;
}

const calculateLineSphereIntersection = (rayvectors, sphereRadius) =>
{
  // find out normalized directional vector with respect to the origin (0,0,0) 
  // based on (maybe the screen coord?)
  const p0 = rayvectors.origin.clone();
  //let p1up = p1.unproject(this.camera);
  const p1 = p0.clone().add(rayvectors.direction.clone().normalize()); //.normalize());
  const c = new THREE.Vector3()
  const dp = p0.add(p1.multiplyScalar(-1)).normalize(); // p0 - p1

  const c_a = Math.pow(dp.x,2) + Math.pow(dp.y,2) + Math.pow(dp.z,2);
  const c_b = 2*dp.x*(p0.x-c.x) + 2*dp.y*(p0.y-c.y) + 2*dp.z*(p0.z-c.z);
  const c_c = c.x*c.x + c.y*c.y + c.z*c.z + p0.x*p0.x + p0.y*p0.y + p0.z*p0.z -2*(c.x*p0.x + c.y*p0.y + c.z*p0.z) - sphereRadius*sphereRadius;

  //let discABC = c_b*c_b - 4*c_a*c_c;
  let c_t = (-c_b - Math.sqrt(c_b*c_b - 4*c_a*c_c))/(2*c_a);

  let intersection = new THREE.Vector3(p0.x + c_t*dp.x, p0.y+c_t*dp.y, p0.z+c_t*dp.z);
  intersection.normalize(); //.multiplyScalar(9000);
  //intersection.multiplyScalar(300);

  return intersection;
};

const LEAT3DNavigator = (props) => {
    //const classes = makegnavStyles();
    const cubeWidth = 400;
    const numberOfSpheresPerSide = 6;
    const sphereRadius = ( cubeWidth / numberOfSpheresPerSide / 2 ) * 0.8 * 0.5;

    const statePermissions = {leaflake: LEAFIOmetamodel.breezyforest.IOAccessPermission.All, appview: LEAFIOmetamodel.breezyforest.IOAccessPermission.All};
    //const {getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback} = props.leafio;//useLEAFIOapi({dirOfSubjects:props.dirOfSubjects, permissions:statePermissions});
    const [renderState, setRenderState] = useState({render_id: null});
    //const [dispLoadState, setDispLoadState] = useState({
    //    nodeopacity: 0,
    //    loadingdisplay: 'flex'
    //});
    //const [leafapp_props, setLEAFappProps] = useState({})
    const leafapp_props = useRef({
        curLEAFapp: null,
        curNodeUUID: null,
        isSysMenuShown: false, 
        isAppRunning: true, 
        sysMenuData: [], 
        bgtextureList: [], 
        bgtagvectors: [], 
        bgtaglist: [], 
        bganimrefreshed: false, 
        curbgtexture: -1, 
        curbgtag: null, 
        curNode: null,
        isMounted: false,
        isAssetLoadingCompleted: false,
    });
    const el_renderer = props.el_renderer;

    let is_data_seen = false;
    //const layout = props.graph_options.layout || "3d";
    const show_stats = props.graph_options.showstats || false;
    const show_info = props.graph_options.showinfo || false;
   
    const selection = props.graph_options.selection || false;
    const limit = props.graph_options.limit || 1000;
    const nodes_count = props.graph_options.numnodes || 50;
    const edges_count = props.graph_options.numedges || 10;
    //const layout_options = props.graph_options.graphlayout || {};
    //console.log('LEAT3DNavigator(): props:');
    //this.props = props;
    const [graph_data, setGraphdata] = useState({"nodes": [], "edges": []});
    const [popupComponentList, setPopupComponentList] = useState([]);
    const { width: appwinwidth, height: appwinheight , top: appwintop, left: appwinleft} = props.dimensions;

    //const [scene, setScene] = useState(null);

    const bgtagsRenderID = useRef();
    const threejs_props = useRef({
        camera: null, 
        cameraTarget: null,
        renderer: null,
        //camera_settings: {fieldOfView: 45, nearClippingPane: 1, farClippingPane: 2000001},
        camera_settings: {fieldOfView: 45, nearClippingPane: 1, farClippingPane: ENV_RADIUS+1},
        scene: null,
        orbitcontrols: null,
        mesh_groups: {nodes: null, edges: null},
        //nodegeom: null,
        sysadmin_sprites: {},
        backdrop_mesh: null,
        test_sprites: {},
        _wireglobemesh: {},
        fx_settings: {
            fx_composers: [], 
            outline_effect: null,
            materials: {}, // a temporary materials cache for switching effects
            bloomLayer: null, 
            bloom_params: {
                exposure: 0.1,
                bloomStrength: 1,
                bloomThreshold: 0,
                bloomRadius: 0,
                scene: "Scene with Glow"
            },
            darkMaterial: null
        },
        jsx_elements: { // JSX elements relevant to threejs settings
            canvas: null, canvrect: null, bgcanvas: null, textlabels: [], textlabel_lut: {}, appwinwidth: null, appwinheight: null,
        },
        cogCalculationDone: false,
        modelLoadingDone: false
    });
    // JSX elements relevant to threejs settings
    //const [threejs_elems, setTHREEjsElems] = useState({
    //    canvas: null, canvrect: null, bgcanvas: null, textlabels: [], textlabel_lut: {},
    //});
    //let textlabels = []; // list of <div> textlabels accompanying on-scene meshes
    //let textlabel_lut = {}; // uuid lut of textlabels 

    //let mesh_groups = {}; // of values of type <THREE.Group>
    // camera settings
    //const fieldOfView = 45; //60;
    //const nearClippingPane = 1;
    //this.farClippingPane = 10000;
    //const farClippingPane = 2000001;
    //let sysadmin_sprites = {};
    //let backdrop_mesh = null;
    //let test_sprites = {};
    //let _wireglobemesh = {};
    // Bloom effect setup
    //let fx_composers = [];
    //let bloomLayer = new THREE.Layers();
    //bloomLayer.set( BLOOM_SCENE );
    let bloom_params = {
      exposure: 0.1,
      bloomStrength: 1,
      bloomThreshold: 0,
      bloomRadius: 0,
      scene: "Scene with Glow"
    };
    const darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );

    const [leafapp_scripts, setLEAFappScripts] = useState({
        script_loader_service: null,
    });
    //this.state.userLEAFappLoaded = false;
    //this.script_loader_service = new DynamicScriptLoaderService(() => {this.setUserLEAFappLoaded(true);});
    //const script_loader_service = new DynamicScriptLoaderService(() => {console.log("dyn script loaded")});

    //const [graph_state, setGraphState] = useState({})
    const graph_props = useRef({
        nodes: [], edges: [], edge_keys: [],
        cluster_lut: {},
        mesh_lut: {nodes:{}, edges:{}, uuidlut:{}, mesh2node: {}}, 
        node_lut: {},
        edge_lut: {},
        sim_options: {},
        layout: {},
        layout_options: {
            width: 500,
            height: 500,
            iterations: 10000, // this number dictates how long and fine-grained phyx sim nodes and edges are subject to, could be as small as 300 if a bit tangled up edges are non-issue.
            attraction: 0.13,
            repulsion: 1.72,
            layout: props.graph_options.layout || '3d'
        },
    });

    //console.log("LEAT3DNav constructor():", graph_props.current.layout_options);

    //this.graph_options = props.graph_options;


    // bind this to local functions
    //this.requestCameraUpdateIfNotRequested = this.requestCameraUpdateIfNotRequested.bind(this);
    //this.render2 = this.render2.bind(this);
    //this.onModelLoadingCompleted = this.onModelLoadingCompleted.bind(this);
    //this.onResize = this.onResize.bind(this);
    //this.escFunction = this.escFunction.bind(this);

    //this.LEAFUIUserDataStore = createStore(uiReduxReducerPromptInput);
    //this.LEAFUIUserDataStore.subscribe(this.render);
    //this.reduxDispatch = useDispatch(); // Redux store dispatch ref 
    //this.props = props;
    //this.LEAFUIUserDataStore = props.reduxstore; //createStore(uiReduxReducerPromptInput);
    //this.LEAFUIUserDataStore.subscribe(this.render);
    //this.ReduxGraphLabelComponent = connect(null, mapDispatchToProps, {forwardRef: true})(GraphLabelComponent);
    //console.log(this.reduxtestobj);
    //const assets_manager = assets; // currently referred to as this.assets in the class component definition
    const bgskyprops = {color: {r: 0, g: 0, b: 0, a: 1.0}}; // default to black sky background

    const textureKey = useRef({equirectangular: {}, images: {}});

    const is_deleting_graph = useRef(false);
    const is_anim_enabled = useRef(false);
    const is_tween_animating = useRef(false);
    const camUpdateRequested = useRef(false);
    //const [nodeloader, setNodeloader] = useState(null);
    const nodeloader = useRef(null);

    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const need_rerender = () => {
        if (leafapp_props.current.isMounted)
            setRenderState((otherstate) => {
                return {...otherstate, render_id: uuid4()};
            });
    };

    const refreshBGTags = () => {
        bgtagsRenderID.current = uuid4();
    };

    const preloadAssets = () => {
        const vertexShader = `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        varying vec2 vUv;
        void main()  {
            vUv = vec2( 1.- uv.x, uv.y );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
        `;

        const fragmentShader = `
        precision mediump float;
        uniform samplerCube map;
        varying vec2 vUv;
        #define M_PI 3.1415926535897932384626433832795
        void main()  {
            vec2 uv = vUv;
            float longitude = uv.x * 2. * M_PI - M_PI + M_PI / 2.;
            float latitude = uv.y * M_PI;
            vec3 dir = vec3(
                - sin( longitude ) * sin( latitude ),
                cos( latitude ),
                - cos( longitude ) * sin( latitude )
            );
            normalize( dir );
            gl_FragColor = textureCube( map, dir );
        }
        `;

        const getCubeCamera = function( size, cubeMapSize ) {

            const cur_cubeMapSize = Math.min( cubeMapSize, size );
            const options = { format: THREE.RGBAFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter };
            const renderTarget = new THREE.WebGLCubeRenderTarget( cur_cubeMapSize, options );
            const cubeCamera = new THREE.CubeCamera( .1, 1000, renderTarget );
        
            return cubeCamera;
        
        };

        const setSize = function( width, height, quad, ortho_camera ) {

            quad.scale.set( width, height, 1 );
        
            ortho_camera.left = width / - 2;
            ortho_camera.right = width / 2;
            ortho_camera.top = height / 2;
            ortho_camera.bottom = height / - 2;
        
            ortho_camera.updateProjectionMatrix();
        
            const _output = new THREE.WebGLRenderTarget( width, height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType
            });
        
            //this.canvas.width = width;
            //this.canvas.height = height;
            threejs_props.current.jsx_elements.bgcanvas.width = width; //getSize('width');
            threejs_props.current.jsx_elements.bgcanvas.height = height; //getSize('height');

            return _output;
        }
    
        
        textureKey.current.equirectangular["equi_lea_logo"] = assets_manager.queue({
            //url: 'http://localhost:3000/assets/test/venice_sunset_1k.jpg',
            //url: 'https://www.leafgon.com/assets/test/venice_sunset_1k.jpg',
            //url : leafgon_url+'/assets/test/venice_sunset_1k.jpg',
            url : leafgon_url+'/assets/test/equi_lea_logo.jpg',
            //type: 'env-map',
            //equirectangular: true,
            type: "texture",
        });
        textureKey.current.images['lea_logo'] = assets_manager.queue({
            //url: 'http://localhost:3000/assets/test/venice_sunset_1k.jpg',
            //url: 'https://www.leafgon.com/assets/test/venice_sunset_1k.jpg',
            //url : leafgon_url+'/assets/test/venice_sunset_1k.jpg',
            url : leafgon_url+'/assets/test/lea_logo.jpg',
            //type: 'env-map',
            //equirectangular: true,
            type: "texture",
        });
        //const equi_renderer = new THREE.WebGLRenderer(
        //    {
        //        //canvas: threejs_props.current.jsx_elements.bgcanvas,
        //        //canvas: this.el.nativeElement,
        //        antialias: true,
        //        //alpha: true,
        //    }
        //);
        return assets_manager.load({ renderer: threejs_props.current.renderer });
        
        //assets_manager.load({ renderer: equi_renderer }).then(
        //    async () => {
                // image asset loaded, now do cube texture to equirectangular texture conversions
        //        const texture = assets_manager.get(textureKey.current.images['lea_logo']);
                // Get canvas context
                //let image = new Image(); 
                //let image = bgcrt.mesh.material.uniforms.tEquirect.value.image;
                //let front_image = cubeTexture.image[0];
                //const equirect_width = texture.image.width * 2;
                //const equirect_height = texture.image.height;
                //threejs_props.current.jsx_elements.bgcanvas.width = equirect_width; //getSize('width');
                //threejs_props.current.jsx_elements.bgcanvas.height = equirect_height; //getSize('height');

                //const scene = new THREE.Scene();
                //const material = new THREE.RawShaderMaterial( {
                //    uniforms: {
                //        map: { type: 't', value: null }
                //    },
                //    vertexShader: vertexShader,
                //    fragmentShader: fragmentShader,
                //    side: THREE.FrontSide,
                //    //transparent: true
                //} );

                //const quad = new THREE.Mesh(
                //    new THREE.PlaneBufferGeometry( 1, 1 ),
                //    material
                //);
                //scene.add( quad );
                //const ortho_camera = new THREE.OrthographicCamera( equirect_width / - 2, equirect_width / 2, equirect_height / 2, equirect_height / - 2, -10000, 10000 );

                //const output = setSize(equirect_width, equirect_height, quad, ortho_camera);

                //equi_renderer.setRenderTarget(output);
                ////equi_renderer.setRenderTarget(cube_camera.renderTarget);
                //equi_renderer.render(scene, ortho_camera); //, output, true;

                //const gl = equi_renderer.getContext();
                //const cubeMapSize = gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE )
                //const cube_camera = getCubeCamera( 512, cubeMapSize );
                //cube_camera.renderTarget.texture.image = texture.image;
                //cube_camera.position.copy(ortho_camera.position);
                //cube_camera.update( equi_renderer, scene );
                ////cube_camera.updateCubeMap( equi_renderer, scene );


                //quad.material.uniforms.map.value = cube_camera.renderTarget.texture;

                //const pixels = new Uint8Array( 4 * equirect_width * equirect_height );
                //equi_renderer.readRenderTargetPixels( output, 0, 0, equirect_width, equirect_height, pixels);

                //const equirect_image = await createImageBitmap(new ImageData( new Uint8ClampedArray( pixels ), equirect_width, equirect_height ));

                //const ctx = threejs_props.current.jsx_elements.bgcanvas.getContext('2d');
                // fill the canvas with color
                //ctx.fillStyle = "#"+Math.floor(color.r).toString(16)+Math.floor(color.g).toString(16)+Math.floor(color.b).toString(16); // hex color key in the format of #ff0000 is returned
                //ctx.fillStyle = "#ffffff"; // hex color key in the format of #ff0000 
                //ctx.fillRect(0, 0, threejs_props.current.jsx_elements.bgcanvas.width, threejs_props.current.jsx_elements.bgcanvas.height);
                //ctx.globalAlpha = 0.9;
                //ctx.drawImage(equirect_image, equirect_image.x || 0, equirect_image.y || 0);
                //const imgurl2 = threejs_props.current.jsx_elements.bgcanvas.toDataURL('image/jpeg'); //(, 0.5);

                //textureKey.current.equirectangular["equi_lea_logo_generated"] = assets_manager.queue({
                //    url : imgurl2,
                //    //type: 'env-map',
                //    equirectangular: true,
                //    type: "texture",
                //})
                //assets_manager.load({ renderer: equi_renderer });

                //this.createBackground(imgurl2);

                //const cubeTextureLoader = new THREE.CubeTextureLoader();
                //const cubeTexture = cubeTextureLoader.load(
                //    [
                //        textureuri,
                //        textureuri,
                //        textureuri,
                //        textureuri,
                //        textureuri,
                //        textureuri,
                //    ],
                //    (texture) => { // onLoad, where texture is of THREE.CubeTexture
                //    
                //        // Get canvas context
                //        const ctx = threejs_props.current.jsx_elements.bgcanvas.getContext('2d');
                //        //let image = new Image(); 
                //        //let image = bgcrt.mesh.material.uniforms.tEquirect.value.image;
                //        let image = texture.image;
                //        threejs_props.current.jsx_elements.bgcanvas.width = image.width; //getSize('width');
                //        threejs_props.current.jsx_elements.bgcanvas.height = image.height; //getSize('height');
                //        // fill the canvas with color
                //        ctx.fillStyle = "#"+Math.floor(color.r).toString(16)+Math.floor(color.g).toString(16)+Math.floor(color.b).toString(16); // hex color key in the format of #ff0000 is returned
                //        //ctx.fillStyle = color; // hex color key in the format of #ff0000 
                //        ctx.fillRect(0, 0, threejs_props.current.jsx_elements.bgcanvas.width, threejs_props.current.jsx_elements.bgcanvas.height);
                //        ctx.globalAlpha = 0.9;
                //        ctx.drawImage(image, image.x || 0, image.y || 0);
                //        let imgurl2 = threejs_props.current.jsx_elements.bgcanvas.toDataURL('image/jpeg'); //(, 0.5);
                //        this.createBackground(imgurl2);
                //        //let image2 = new Image(); 
                //        //image2.src = imgurl2;

                //        //bgcrt.mesh.material.uniforms.tEquirect.value.image.src = imgurl2;
                //        /*
                //        bgcrt.mesh.material.uniforms.tEquirect.value.image = image2;
                //        bgcrt.mesh.material.uniformsNeedUpdate = true;
                //        bgcrt.mesh.material.uniforms.tEquirect.value.needsUpdate = true;
                //        bgcrt.mesh.material.needsUpdate = true;
                //        bgcrt.camera.update( this.renderer, bgcrt.mesh );
                //        */
                //        
                //        /*
                //        const backgroundLoader = new THREE.TextureLoader();
                //        //this.renderer.setClearColor(0xff0000, 0.5);
                //        backgroundLoader.premultiplyAlpha = true;
                //        const backgroundTexture = backgroundLoader.load(imgurl2,
                //        (texture) => {
                //        bgcrt.mesh.material.uniforms.tEquirect.value = texture;
                //        bgcrt.camera.update( this.renderer, bgcrt.mesh );
                //        //bgcrt.fromEquirectangularTexture(this.renderer, texture);
                //        //bgcrt.texture.encoding = THREE.sRGBEncoding; // this line is necessary to make the color space dark as intended

                //        {
                //            setfunc && setfunc();
                //        }
                //        // to have a fixed backdrop
                //        //this.scene.background = backgroundTexture;
                //        //this.backgroundSphere = true;
                //        });
                //        */
                //    }
                //);
                
            //}
        //);
    };

    const setBackground = (idx) => {
        leafapp_props.current.curbgtexture = idx;
        //this.state.curbgtexture = idx;
        threejs_props.current.scene.background = leafapp_props.current.bgtextureList[idx].texture;
    };

    const createBackgroundOld = (imgurl, setfunc=null) => {
        //const imglist = this.assets.get(this.hdrKey);
        //this.scene.background = this.assets.get(this.hdrKey);
        //this.scene.environment = this.assets.get(this.hdrKey);
        /*
        const backgroundLoader = new THREE.CubeTextureLoader();
        const backgroundTexture = backgroundLoader.load([
            'http://localhost:3000/assets/test/pos-x.jpg',
            'http://localhost:3000/assets/test/neg-x.jpg',
            'http://localhost:3000/assets/test/pos-y.jpg',
            'http://localhost:3000/assets/test/neg-y.jpg',
            'http://localhost:3000/assets/test/pos-z.jpg',
            'http://localhost:3000/assets/test/neg-z.jpg',
        ]);
        this.scene.background = backgroundTexture;
        */
        //const geometry = new THREE.SphereBufferGeometry(5000, 60, 40);
        //const geometry = new THREE.SphereBufferGeometry(ENV_RADIUS, 60, 40);
        const geometry = new THREE.SphereGeometry(ENV_RADIUS, 120, 80);
        // invert the geometry on the x-axis so that all faces point inward
        geometry.scale(-1, 1, 1);



        const onBackgroundTextureLoadingCompleted = (_backgroundTexture) => {
            _backgroundTexture.encoding = THREE.sRGBEncoding; // this line is necessary to make the color space dark as intended
            const material = new THREE.MeshBasicMaterial({ map: _backgroundTexture });
            material.dithering = true;
            material.toneMapped = false;
            let mesh = new THREE.Mesh( geometry, material );
            //threejs_props.backdrop_mesh = mesh;

            threejs_props.current.scene.add(mesh);
            if (threejs_props.current.backdrop_mesh) {
                threejs_props.current.scene.remove(threejs_props.current.backdrop_mesh);
            }
            threejs_props.current.backdrop_mesh = mesh;
            console.log('#########: backdrop_mesh created!');
        };

        const backgroundLoader = new THREE.TextureLoader();
        //this.renderer.setClearColor(0xff0000, 0.1);
        //backgroundLoader.premultiplyAlpha = true;

        const backgroundTexture = backgroundLoader.load(
            imgurl,
            function(texture) {console.log('TL.load() callback'); onBackgroundTextureLoadingCompleted(texture);} 
        ); //,
        //(texture) => {
        //  this.backgroundcrt = new LEAFWebGLCubeRenderTarget(backgroundTexture.image.height);
        //  this.backgroundcrt.fromEquirectangularTexture(this.renderer, backgroundTexture);
        //  this.backgroundcrt.texture.encoding = THREE.sRGBEncoding; // this line is necessary to make the color space dark as intended
        //  this.state.bgtextureList.push(this.backgroundcrt);
            //this.scene.fog = new THREE.FogExp2(0x03544e, 0.001);
            //this.renderer.setClearColor( this.scene.fog.color );

        //  {
        //    setfunc && setfunc();
        //  }
            // to have a fixed backdrop
            //this.scene.background = backgroundTexture;
            //this.backgroundSphere = true;
        //});
    }

    const createBackground = (bgtexture, setfunc=null) => {
        //const imglist = this.assets.get(this.hdrKey);
        //this.scene.background = this.assets.get(this.hdrKey);
        //this.scene.environment = this.assets.get(this.hdrKey);
        /*
        const backgroundLoader = new THREE.CubeTextureLoader();
        const backgroundTexture = backgroundLoader.load([
            'http://localhost:3000/assets/test/pos-x.jpg',
            'http://localhost:3000/assets/test/neg-x.jpg',
            'http://localhost:3000/assets/test/pos-y.jpg',
            'http://localhost:3000/assets/test/neg-y.jpg',
            'http://localhost:3000/assets/test/pos-z.jpg',
            'http://localhost:3000/assets/test/neg-z.jpg',
        ]);
        this.scene.background = backgroundTexture;
        */
        //const geometry = new THREE.SphereBufferGeometry(5000, 60, 40);
        //const geometry = new THREE.SphereBufferGeometry(ENV_RADIUS, 60, 40);
        const geometry = new THREE.SphereGeometry(ENV_RADIUS, 120, 80);
        // invert the geometry on the x-axis so that all faces point inward
        geometry.scale(-1, 1, 1);

        bgtexture.encoding = THREE.sRGBEncoding; // this line is necessary to make the color space dark as intended
        const material = new THREE.MeshBasicMaterial({ map: bgtexture });
        material.dithering = true;
        material.toneMapped = false;
        let mesh = new THREE.Mesh( geometry, material );
        //threejs_props.backdrop_mesh = mesh;

        threejs_props.current.scene.add(mesh);
        if (threejs_props.current.backdrop_mesh) {
            threejs_props.current.scene.remove(threejs_props.current.backdrop_mesh);
        }
        threejs_props.current.backdrop_mesh = mesh;
        //setfunc();
        console.log('#########: backdrop_mesh created!');
    }

    const loadNewBackground = (color, imgurl, setfunc=null) => {
    // create an imgurl
    const backgroundLoader = new THREE.TextureLoader();
    //this.renderer.setClearColor(0xff0000, 0.5);
    backgroundLoader.premultiplyAlpha = true;
    const backgroundTexture = backgroundLoader.load(imgurl,
    (texture) => {
        {
        setfunc && setfunc();
        }
        // to have a fixed backdrop
        //this.scene.background = backgroundTexture;
        //this.backgroundSphere = true;
    
        // Get canvas context
        const ctx = threejs_props.current.jsx_elements.bgcanvas.getContext('2d');
        //let image = new Image(); 
        //let image = bgcrt.mesh.material.uniforms.tEquirect.value.image;
        let image = texture.image;
        threejs_props.current.jsx_elements.bgcanvas.width = image.width; //getSize('width');
        threejs_props.current.jsx_elements.bgcanvas.height = image.height; //getSize('height');
        // fill the canvas with color
        ctx.fillStyle = "#"+Math.floor(color.r).toString(16)+Math.floor(color.g).toString(16)+Math.floor(color.b).toString(16); // hex color key in the format of #ff0000 is returned
        //ctx.fillStyle = color; // hex color key in the format of #ff0000 
        ctx.fillRect(0, 0, threejs_props.current.jsx_elements.bgcanvas.width, threejs_props.current.jsx_elements.bgcanvas.height);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(image, image.x || 0, image.y || 0);
        let imgurl2 = threejs_props.current.jsx_elements.bgcanvas.toDataURL('image/jpeg'); //(, 0.5);
        createBackgroundOld(imgurl2);
        //let image2 = new Image(); 
        //image2.src = imgurl2;

        //bgcrt.mesh.material.uniforms.tEquirect.value.image.src = imgurl2;
        /*
        bgcrt.mesh.material.uniforms.tEquirect.value.image = image2;
        bgcrt.mesh.material.uniformsNeedUpdate = true;
        bgcrt.mesh.material.uniforms.tEquirect.value.needsUpdate = true;
        bgcrt.mesh.material.needsUpdate = true;
        bgcrt.camera.update( this.renderer, bgcrt.mesh );
        */
        
        /*
        const backgroundLoader = new THREE.TextureLoader();
        //this.renderer.setClearColor(0xff0000, 0.5);
        backgroundLoader.premultiplyAlpha = true;
        const backgroundTexture = backgroundLoader.load(imgurl2,
        (texture) => {
        bgcrt.mesh.material.uniforms.tEquirect.value = texture;
        bgcrt.camera.update( this.renderer, bgcrt.mesh );
        //bgcrt.fromEquirectangularTexture(this.renderer, texture);
        //bgcrt.texture.encoding = THREE.sRGBEncoding; // this line is necessary to make the color space dark as intended

        {
            setfunc && setfunc();
        }
        // to have a fixed backdrop
        //this.scene.background = backgroundTexture;
        //this.backgroundSphere = true;
        });
        */
    });
    
    };

    // the difference btwn useLayoutEffect and useEffect: https://kentcdodds.com/blog/useeffect-vs-uselayouteffect
    useLayoutEffect(() => {
        const leafgon_url_regex = new RegExp('^(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
                                            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string'
                                            '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator /gi;
        const full_url_regex = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
                                        '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
                                        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
                                        '(\\:\\d+)?(\\/[-a-zA-Z\!\\d%_.~+]*)*'+ // validate port and path, modified to accomodate exclamation char in url paths
                                        '(\\?[;&a-zA-Z\\d%_.~+=-]*)?'+ // validate query string
                                        '(\\#[-a-zA-Z\\d_]*)?$','i'); // validate fragment locator

        console.log("backdrop_url: ", props.data.backdrop_url);
        const _backdrop_url = props.data.backdrop_url.match(full_url_regex) ? props.data.backdrop_url :
            (props.data.backdrop_url.match(leafgon_url_regex) ? leafgon_url+props.data.backdrop_url : 
            leafgon_url+'/assets/test/hubbleinfrared_dark2.jpg');

        const _moontexture_url = leafgon_url+"/assets/texture/moon_1024.jpg";

        textureKey.current.images['backdrop'] = assets_manager.queue({
            //url: 'http://localhost:3000/assets/test/venice_sunset_1k.jpg',
            //url: 'https://www.leafgon.com/assets/test/venice_sunset_1k.jpg',
            //url : leafgon_url+'/assets/test/venice_sunset_1k.jpg',
            url : _backdrop_url,
            //type: 'env-map',
            //equirectangular: true,
            type: "texture",
        });
        textureKey.current.images['moon'] = assets_manager.queue({
            //url: 'http://localhost:3000/assets/test/venice_sunset_1k.jpg',
            //url: 'https://www.leafgon.com/assets/test/venice_sunset_1k.jpg',
            //url : leafgon_url+'/assets/test/venice_sunset_1k.jpg',
            url : _moontexture_url,
            //type: 'env-map',
            //equirectangular: true,
            type: "texture",
        });
        prepareRendering(true).then(() => {
            leafapp_props.current.isAssetLoadingCompleted = true;
            //const logotexture = assets_manager.get(textureKey.current.images['lea_logo']);
            if ('graph_data' in props.data) { // calling for update in the gnav 3D orbitals and the moon
                const moontexture = assets_manager.get(textureKey.current.images['moon']);
                // do update appview channel data
                if (moontexture) {
                    actUponOrbitalGraph(props.data);
                    is_data_seen = true;
                }
            }
            const backdroptexture = assets_manager.get(textureKey.current.images['backdrop']);

            //const backdropvideo = document.getElementById("gnav-backdropvideo");
            ////const backdropvideo_controller = new YouTubeToHtml5({
            ////    autoload: false
            ////});
            //const backdropvidtexture = new THREE.VideoTexture(backdropvideo);

            ////createBackground(backdroptexture, ()=>{setBackground(0)});
            //createBackground(backdropvidtexture, ()=>{setBackground(0)});
            //createBackground(leafgon_url+'/assets/test/hubbleinfrared_sr_fiji2.3.jpg', ()=>{setBackground(0)});
            //this.createBackground('http://localhost:3000/assets/test/jpegPIA15482.jpg', ()=>{this.setBackground(0)});
            //this.createBackground('http://localhost:3000/assets/test/standardstudios.jpg', ()=>{this.setBackground(0)});

            initBloomSpheres();

            // load the graph data and initialize their force field simulation
            //const fetchGraphData = async () => {
            //    //this.graph_data = await this.graph_data;
            //    console.log('GGGGGGGGGGGGGGGGGGGGG>>>>>>>>>>> ', graph_data);
            //    console.log('LEAT3DNavigator(): props2:');
            //    //this.reloadGraph(this.nodeloader, this.graph_data.currentValue);
            //    //this.reloadGraph(this.nodeloader, this.graph_data);
            //    /////////////////createGraph(loader, graph_data);
            //    //initGraphState();
            //    initPhyxSim(true);
            //    //this.initPhyxSim();
            //    
            //};
            //fetchGraphData();

            // load the graph data and initialize their force field simulation
            const fetchGraphData = async () => {
                //this.graph_data = await this.graph_data;
                console.log('GGGGGGGGGGGGGGGGGGGGG>>>>>>>>>>> ', graph_data);
                console.log('LEAT3DNavigator(): props2:');
                //this.reloadGraph(this.nodeloader, this.graph_data.currentValue);
                //this.reloadGraph(this.nodeloader, this.graph_data);
                /////////////////createGraph(loader, graph_data);
                //initGraphState();
                initPhyxSim(true);
                //this.initPhyxSim();
                

                // now things are ready to run, go render
                //let camcontrol = this.controls;
                //setDispLoadState({
                //    ...dispLoadState,
                //    nodeopacity: 1,
                //    loadingdisplay: 'none'
                //});
                if (props.data.loader_callback)
                    props.data.loader_callback();

                enableAnimation();
                if (leafapp_props.current.isMounted) {
                    threejs_props.current.modelLoadingDone = true; // spark_dev_note: artifact of synchronizing jest test sequences
                    need_rerender();
                }
            };
            fetchGraphData();
        });

        const onModelLoadingCompleted = (loader) => {
            console.log('model loading completed');
            //const url_regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
            //const url_regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
            const leafgon_url_regex = new RegExp('^(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
                                                 '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string'
                                                 '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator /gi;
            const full_url_regex = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
                                              '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
                                              '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
                                              '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
                                              '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
                                              '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator

            console.log("backdrop_url: ", props.data.backdrop_url);
            const _backdrop_url = props.data.backdrop_url.match(full_url_regex) ? props.data.backdrop_url :
                (props.data.backdrop_url.match(leafgon_url_regex) ? leafgon_url+props.data.backdrop_url : 
                leafgon_url+'/assets/test/hubbleinfrared_dark2.jpg');

            //this.preloadAssets();
            //this.createBackground('http://localhost:3000/assets/test/hubbleinfrared.jpg');
            //this.createBackground('http://localhost:3000/assets/test/standardstudios.jpg', ()=>{this.setBackground(0); this.setSkyColorTween()});
            /*
            this.createBackground('http://localhost:3000/assets/test/hubbleinfrared.jpg');
            this.createBackground('http://localhost:3000/assets/test/hubbleinfrared2.jpg');
            this.createBackground('http://localhost:3000/assets/test/hubbleinfrared3.jpg');
            this.createBackground('http://localhost:3000/assets/test/hubbleinfrared4.jpg');
            this.createBackground('http://localhost:3000/assets/test/hubbleinfrared5.jpg');
            this.createBackground('http://localhost:3000/assets/test/hubbleinfrared6.jpg');
            //this.createBackground('http://localhost:3000/assets/test/hubbleinfrared7.jpg', ()=>{this.setBackground(0); this.setSkyColorTween()});
            */
            //createBackground('http://localhost:3000/assets/test/hubbleinfrared.jpg', ()=>{setBackground(0)});
            //createBackground('https://www.leafgon.com/assets/test/hubbleinfrared.jpg', ()=>{setBackground(0)});
            //createBackground('http://localhost:3000/assets/texture/earth_land_ocean_ice_8192.jpg', ()=>{setBackground(0)});
            //createBackground('http://localhost:3000/assets/texture/nasa_starmap_8k.jpg', ()=>{setBackground(0)});
            //createBackground('http://localhost:3000/assets/texture/nasa_celestial_grid.png', ()=>{setBackground(0)});
            //createBackground('http://localhost:3000/assets/texture/nasa_constellation_figures.png', ()=>{setBackground(0)});
            //createBackground(leafgon_url+'/assets/texture/nasa_constellation_figures.png', ()=>{setBackground(0)});
            //"http://localhost:3000/assets/texture/earth_land_ocean_ice_2048.jpg", 
            //createBackground(leafgon_url+'/assets/texture/earth_land_ocean_ice_8192.jpg', ()=>{setBackground(0)});
            //createBackground(leafgon_url+'/assets/test/hubbleinfrared_dark2.jpg', ()=>{setBackground(0)});
            createBackgroundOld(_backdrop_url, ()=>{setBackground(0)});
            //createBackground(leafgon_url+'/assets/test/hubbleinfrared_sr_fiji2.3.jpg', ()=>{setBackground(0)});
            //this.createBackground('http://localhost:3000/assets/test/jpegPIA15482.jpg', ()=>{this.setBackground(0)});
            //this.createBackground('http://localhost:3000/assets/test/standardstudios.jpg', ()=>{this.setBackground(0)});

            initBloomSpheres();

            // load the graph data and initialize their force field simulation
            const fetchGraphData = async () => {
                //this.graph_data = await this.graph_data;
                console.log('GGGGGGGGGGGGGGGGGGGGG>>>>>>>>>>> ', graph_data);
                console.log('LEAT3DNavigator(): props2:');
                //this.reloadGraph(this.nodeloader, this.graph_data.currentValue);
                //this.reloadGraph(this.nodeloader, this.graph_data);
                /////////////////createGraph(loader, graph_data);
                //initGraphState();
                initPhyxSim(true);
                //this.initPhyxSim();
                

                // now things are ready to run, go render
                //let camcontrol = this.controls;
                enableAnimation();
                if (leafapp_props.current.isMounted) {
                    threejs_props.current.modelLoadingDone = true; // spark_dev_note: artifact of synchronizing jest test sequences
                    need_rerender();
                }
            };
            fetchGraphData();
        };

        ////this.nodeloader = new THREE.TextureLoader().load("assets/texture/moon_1024.jpg", function(texture) {console.log('TL.load() callback'); that.onModelLoadingCompleted(texture);}, undefined, function(err){console.log( 'Could not load moon_1024.jpg: ', err );});
        ////setNodeloader(new THREE.TextureLoader().load())
        //nodeloader.current = new THREE.TextureLoader().load(
        //    //"http://localhost:3000/assets/texture/moon_1024.jpg", 
        //    leafgon_url+"/assets/texture/moon_1024.jpg",
        //    //"https://www.leafgon.com/assets/texture/moon_1024.jpg", 
        //    //"http://localhost:3000/assets/texture/earth_land_ocean_ice_2048.jpg", 
        //    function(texture) {console.log('TL.load() callback'); onModelLoadingCompleted(texture);}, 
        //    undefined, 
        //    function(err){console.log( 'Could not load jpg texture: ', err );}
        //);
        //console.log('nodeloader: ', nodeloader.current);

    }, []);

    const leafgon_url_regex = new RegExp('^(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string'
            '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator /gi;
    const full_url_regex = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
        '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-zA-Z\!\\d%_.~+]*)*'+ // validate port and path, modified to accomodate exclamation char in url paths
        '(\\?[;&a-zA-Z\\d%_.~+=-]*)?'+ // validate query string
        '(\\#[-a-zA-Z\\d_]*)?$','i'); // validate fragment locator
    useEffect(() => {
        //if(leafapp_props.current.isAssetLoadingCompleted) {}

        const _loadnewbackground = async () => {
            console.log("backdrop_url: ", props.data.backdrop_url);
            const _backdrop_url = props.data.backdrop_url.match(full_url_regex) ? props.data.backdrop_url :
            (props.data.backdrop_url.match(leafgon_url_regex) ? leafgon_url+props.data.backdrop_url : 
            leafgon_url+'/assets/test/hubbleinfrared_dark2.jpg');

            const _moontexture_url = leafgon_url+"/assets/texture/moon_1024.jpg";

            textureKey.current.images['backdrop'] = await assets_manager.loadSingle({
                renderer: threejs_props.current.renderer, 
                //url: 'http://localhost:3000/assets/test/venice_sunset_1k.jpg',
                //url: 'https://www.leafgon.com/assets/test/venice_sunset_1k.jpg',
                //url : leafgon_url+'/assets/test/venice_sunset_1k.jpg',
                url : _backdrop_url,
                //type: 'env-map',
                //equirectangular: true,
                type: "texture",
            });

            const backdroptexture = assets_manager.get(textureKey.current.images['backdrop']);
            const backdropvideo = document.getElementById("gnav-backdropvideo");
            const backdropvidtexture = new THREE.VideoTexture(backdropvideo);
            //const backdropvideo_controller = new YouTubeToHtml5();

            createBackground(backdroptexture, ()=>{setBackground(0)});
            //createBackground(backdropvidtexture, ()=>{setBackground(0)});
        };
        _loadnewbackground();
        
        //const backdropvideo = document.getElementById("gnav-backdropvideo");
        // spark_dev_note: 20/Jun/2023
        // #videobackdrop
        // disabled play, currently only testing
        //backdropvideo.play();
        //const backdropvidtexture = new THREE.VideoTexture(backdropvideo);
        //createBackground(backdropvidtexture, ()=>{setBackground(0)});

        ////backdropvideo.onload = () => {
        ////    const backdropvideo_controller = new YouTubeToHtml5();
        ////};
        ////const backdropvideo_controller = new YouTubeToHtml5({
        ////    autoload: false
        ////});
        ////const backdropvideo_controller = new YouTubeToHtml5({});

        //createBackground(backdroptexture, ()=>{setBackground(0)});
    }, [props.data.backdrop_url]);

    const actUponOrbitalGraph = (data) => {
        setGraphdata((prevgd) => {
            // do update appview channel data
            const added_nodes = findAddedJSON(prevgd.nodes, data.graph_data.nodes); // find out if new nodes added as per the difference
            const removed_nodes = findRemovedJSON(prevgd.nodes, data.graph_data.nodes);
            const added_edges = findAddedJSON(prevgd.edges, data.graph_data.edges);
            const removed_edges = findRemovedJSON(prevgd.edges, data.graph_data.edges);
            let issetnewgraph = false;
            // e.g.: added_nodes[0]: {uuid: 'cd023a85-0792-429d-939c-e99ea31d05ef', label: 'ala2', out_edges: Array(0), in_edges: Array(0)}
            // [{index: 1, title: '1'}, {index: 2, title: '2'}, {index: 3, title: '3'}, {index: 4, title: '4'}]
            if (added_nodes.length > 0) {
                console.log('############################ >>>: ', added_nodes.length, added_nodes);
                asyncUpdateAddNodeData(added_nodes);
                //updateAddNodeData(added_nodes);
                issetnewgraph = true;
            };

            if (removed_nodes.length > 0) {
                asyncUpdateRemoveNodeData(removed_nodes);
                //updateRemoveNodeData(removed_nodes);
                issetnewgraph = true;
            }

            if (added_edges.length > 0) {
                asyncUpdateAddEdgeData(added_edges);
                //updateAddEdgeData(added_edges);
                issetnewgraph = true;
            }

            if (removed_edges.length > 0) {
                asyncUpdateRemoveEdgeData(removed_edges);
                //updateRemoveEdgeData(removed_edges);
                issetnewgraph = true;
            }

            //if (!issetnewgraph)
            //    initPhyxSim();

            return data.graph_data; // update graph_data for the next round

            // calling preprocessGraph() should take place here or prior to calling downstream update functions
            // spark_dev_note: the conundrum here in terms of refactoring the code to accept preprocessedGraph data from breezyforest graph data
            // is that the code here incrementally accepts partial nodes and edges data, making it difficult to preprocess partial
            // graph data to be integrated retrospectively
            // a possible solution is to maintain a local copy of breezyforest graph data to/from which any incremental changes get updated, 
            // and to run preprocessGraph() against the whole breezyforest graph to generate navigable graph data for downstream consumption.

        });
    };

    /*
     * callbackOnLEAFIOAppView() is the first point of entry into the gnav leaf element 
     * (usually triggering perceivable differences as far as UX goes) from the rhelm of
     * leaf graph logic. This is where the messages from the rhelm of leaf graph logic gets
     * read and acted upon; the shrine of messages so to speak without the praying of course. ;) 
     * (20 Mar 2022)
     */
    const callbackOnLEAFIOAppView = ({control, data}) => {
        // do some interesting stuff here in association with the relevant callback event (the event to do with 'leaflake' here for example).
        console.log("GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgnav callbackOnAppView: " + JSON.stringify(data));

        if ('graph_data' in data) { // calling for update in the gnav 3D orbitals and the moon
            // do update appview channel data
            actUponOrbitalGraph(data);
        }

        if ('popup' in data) { // calling for update in the popup components
            setPopupComponentList((prevPopups) => {
                return prevPopups.concat(data.popup); // update popupComponentList
            });
        }
    };

    // setting up event listners once and once only upon rendering
    //useEffect(() => {
    //    // now things are ready to run, go render
    //    //let camcontrol = this.controls;

    //    if (leafapp_props.current.isAssetLoadingCompleted && leafapp_props.current.isMounted) {
    //        enableAnimation();
    //        threejs_props.current.modelLoadingDone = true; // spark_dev_note: artifact of synchronizing jest test sequences
    //        need_rerender();
    //    }
    //    //prepareRendering(true);
    //}, [leafapp_props.current.isAssetLoadingCompleted, leafapp_props.current.isMounted]);

    useEffect(() => {
        // refresh bgtagvectors by calling the LEAF lambda function 'tagvectors'
        // spark_dev_note: 11/May/2023
        // #cheapbuteffective #improvelater
        // bgtagvectors has a boundary condition for no vectors being set by library users
        // resulting in a amnesia memoryio for any arbitrary memoryio expecting empty array.
        // currently, not the neatest of all ideas but it works, this boundary condition is
        // catched by LEAFlisp returning the following error:
        // 'LEAFlisp error: 8bc39fd6-ebee-4521-9d25-a115613b98b2: Invalid number: ""'
        // please note the nodeuuid changes depending on where it came from.
        props.data.bgtagvectors().then((_tagvectors) => {
            try {
                leafapp_props.current.bgtagvectors = 
                _tagvectors.map((_coord)=>{return {id: _coord.id, coord: new THREE.Vector3(..._coord.coord)};});
            }
            catch(err) {
                leafapp_props.current.bgtagvectors = [];
            } 
            need_rerender();
        });
        //leafapp_props.current.bgtagvectors = props.data.bgtagvectors.map((_coord)=>{return {id: _coord.id, coord: new THREE.Vector3(..._coord.coord)};});
    }, [bgtagsRenderID.current]);

    //useEffect(() => {
    //    const leafgon_url_regex = new RegExp('^(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    //                                            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string'
    //                                            '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator /gi;
    //    const full_url_regex = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    //                                        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    //                                        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    //                                        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    //                                        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    //                                        '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator

    //    console.log("backdrop_url: ", props.data.backdrop_url);
    //    const _backdrop_url = props.data.backdrop_url.match(full_url_regex) ? props.data.backdrop_url :
    //        (props.data.backdrop_url.match(leafgon_url_regex) ? leafgon_url+props.data.backdrop_url : 
    //        leafgon_url+'/assets/test/hubbleinfrared_dark2.jpg');

    //    //loadNewBackground(bgskyprops.color, _backdrop_url);
    //    createBackground(_backdrop_url, ()=>{setBackground(0)});
    //    //need_rerender(); // force re-render

    //}, [props.data.backdrop_url]);

    useEffect(() => {
        //if (leafapp_props.current.isMounted) {
        //console.log('GGGGGGGGGGGGGGGGGGGGGGGGGGG useEffect() setLEAFIOCallback being called: ', props.dirOfSubjects);

        //}

        /* EVENT handlers */
        const onSingleTap = (e) => {
            e.preventDefault();
            console.log("onSingleTap: ", e, threejs_props.current.scene, nodeloader.current);
            //this.refreshGraphLabels();


            if (typeof threejs_props.current.scene !== "undefined") // sanity check
            {
            console.log('camera position: ', threejs_props.current.camera.position);
            hideSystemMenu();
            if (!threejs_props.current.orbitcontrols.enabled) {
                threejs_props.current.orbitcontrols.enabled = true;
                // Set position and look at
                threejs_props.current.camera.position.set(0,400,500);
                threejs_props.current.orbitcontrols.update();
            }
            const canvrect = threejs_props.current.renderer.domElement.getBoundingClientRect();

            // Example of mesh selection/pick:
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            mouse.x = ((e.center.x - canvrect.left)/ (canvrect.right - canvrect.left)) * 2 - 1;
            mouse.y = - ((e.center.y - canvrect.top)/ (canvrect.bottom - canvrect.top)) * 2 + 1;
            raycaster.setFromCamera(mouse, threejs_props.current.camera);

            var obj = []; // obj: THREE.Object3D[]
            findAllObjects(obj, threejs_props.current.scene);
            var intersects = raycaster.intersectObjects(obj);
            let hitit = false;
            intersects.forEach((i) => {
                console.log('clicked object: ', i.object); // do what you want to do with object
                hitit = true;
            });

            if (hitit) {
                if (intersects.filter(x=>x.object.type === 'Mesh')[0].object.uuid === threejs_props.current.backdrop_mesh.uuid) {
                // exclude the hit operation for sysadmin mesh (i.e. the center globe)
                hitit = false;
                }
                //Object.keys(this.sysadmin_sprites).forEach( (sysadmin_uuid) => {
                //  if (intersects[0].object.uuid === sysadmin_uuid) { // exclude the hit operation for sysadmin mesh (i.e. the center globe)
                    //hitit = false;
                //    console.debug("sysadmin node clicked");
                //  }
                //});
            }
            let dirvector= new THREE.Vector3();
            enterNodeInfoMode(null);
            if (hitit) {
                //clearWireGlobe();
                hitit = false;
                focusNode(intersects.filter(x=>x.object.type === 'Mesh')[0].object);
                //let distToTarget = this.state.curNode.position.distanceTo(threejs_props.camera.position);
                let distToTarget = leafapp_props.current.curNode.position.distanceTo(threejs_props.current.cameraTarget);
                //if ( distToTarget < 1 )
                //{
                //  this.showSystemMenu(); 
                //}
            }
            else {
                unfocusNode();
                //threejs_props.camera.getWorldDirection(dirvector);
                //dirvector = threejs_props.camera.position.clone().normalize();
                //dirvector = threejs_props.camera.direction.clone().unproject(threejs_props.camera);
                //this.drawTestLine(raycaster.ray);
                //let bgvector = calculateLineSphereIntersection(raycaster.ray, 20000);

                //leafapp_props.current.bgtagvectors = [...leafapp_props.current.bgtagvectors, bgvector];

                //let bgvector = dirvector.multiply(raycaster.ray.direction);
                //let bgvector = raycaster.ray.direction.clone();
                //bgvector.multiply(raycaster.ray.direction);
                //bgvector.multiplyScalar(9000);

                //this.createTestNode(this.nodeloader, bgvector);

                //console.log('camera is looking at: ' + (dirvector.x) + ',' + (dirvector.y) + ',' + (dirvector.z));
                //if (Object.keys(threejs_props.current.sysadmin_sprites).length === 0) {
                //    removeSysAdminSprites();
                //    createSysAdminSprite(nodeloader.current, graph_props.current.layout.center_of_gravity);
                //}
                //else {
                //Object.values(threejs_props.current.sysadmin_sprites).forEach((obj) => {
                //    obj.x = graph_props.current.layout.center_of_gravity.x;
                //    obj.y = graph_props.current.layout.center_of_gravity.y;
                //    obj.z = graph_props.current.layout.center_of_gravity.z;
                //});
                //}
                //this.createTestNode(this.nodeloader, );
                //this.createWireGlobe(this.nodeloader);
                let lookat_tween = new TWEEN.Tween(threejs_props.current.cameraTarget);

                let objposition = graph_props.current.layout.center_of_gravity.clone();
                lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
                let that = this;
                //lookat_tween.onComplete( function() {
                //  console.log("cur cam is looking at: ", that.cameraTarget);
                //});
                is_tween_animating.current = true; // set flag
                lookat_tween.onComplete( function() {
                    //console.log("HHHHHHHHHHHHHHHHHHHHH cur cam is looking at: ", that.cameraTarget);
                    is_tween_animating.current = false; // reset flag
                });
                lookat_tween.start();
            }

            }
        };

        const enterNodeInfoMode = (uuid) => {
            threejs_props.current.jsx_elements.textlabels.map((tlabel) => {tlabel.hidden = true}); // hide all
            if(uuid) {
            let textlabel = threejs_props.current.jsx_elements.textlabel_lut[uuid]; // find the textlabel
            textlabel.hidden = false; // show
            }
            //props.updateGraphLabels(threejs_props.current.jsx_elements.textlabel_lut); // update redux store
        };

        const onDoubleTap = (e) => {
            console.log("onDoubleTap: ", e, threejs_props.current.scene, nodeloader.current);

            //this.refreshGraphLabels();

            if (typeof threejs_props.current.scene !== "undefined") // sanity check
            {
            if (!this.controls.enabled) {
                this.controls.enabled = true;
                // Set position and look at
                threejs_props.current.camera.position.set(0,400,500);
                this.controls.update();
            }
            let canvrect = threejs_props.current.renderer.domElement.getBoundingClientRect();

            // Example of mesh selection/pick:
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            mouse.x = ((e.center.x - canvrect.left)/ (canvrect.right - canvrect.left)) * 2 - 1;
            mouse.y = - ((e.center.y - canvrect.top)/ (canvrect.bottom - canvrect.top)) * 2 + 1;
            raycaster.setFromCamera(mouse, threejs_props.current.camera);

            var obj = []; // obj: THREE.Object3D[]
            this.findAllObjects(obj, threejs_props.current.scene);
            var intersects = raycaster.intersectObjects(obj);
            let hitit = false;
            intersects.forEach((i) => {
                console.log('clicked object: ', i.object); // do what you want to do with object
                hitit = true;
            });

            if (hitit) {
                Object.keys(threejs_props.current.sysadmin_sprites).forEach( (sysadmin_uuid) => {
                if (intersects[0].object.uuid === sysadmin_uuid) { // exclude the hit operation for sysadmin mesh (i.e. the center globe)
                    hitit = false;
                }
                });
            }
            let dirvector= new THREE.Vector3();
            if (hitit) {
                hitit = false;
                //this.curNodeUUID = intersects[0].object.uuid;
                setLEAFappScripts((otherprops) => {return {...otherprops, curNodeUUID: intersects[0].object.uuid}});
                // placeholder for experiments
                let newposition = intersects[0].object.position.clone();
                let objposition = intersects[0].object.position.clone();
                console.log('clicked mesh object: ', intersects[0].object); // do what you want to do with object
                this.enterNodeInfoMode(intersects[0].object.uuid);
                dirvector.subVectors(newposition, graph_props.current.layout.center_of_gravity).normalize()
                console.log("dirvector: ", dirvector);
                console.log("obj position: ", objposition);
                console.log("obj dist: ", newposition.distanceTo(graph_props.current.layout.center_of_gravity));

                newposition.add(dirvector.multiplyScalar(200));
                console.log("new cam dist: ", newposition.distanceTo(graph_props.current.layout.center_of_gravity));
                // get a directional unit vector btw center and the hit obj
                // let tween = new TWEEN.Tween(intersects[0].object.position);
                let motion_tween = new TWEEN.Tween(threejs_props.current.camera.position);
                let lookat_tween = new TWEEN.Tween(threejs_props.current.cameraTarget);

                console.log('tween: ', motion_tween);
                console.log('anim loop: ', is_anim_enabled.current);
                motion_tween.to({x: newposition.x, y: newposition.y, z: newposition.z}, 1000);
                lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
                let that = this;

                motion_tween.onComplete( function() {
                    console.log("cur tween stat: ", is_tween_animating.current);
                    is_tween_animating.current = false; // reset flag
                    console.log("cur tween stat: ", is_tween_animating.current);
                });
                lookat_tween.chain(motion_tween);
                is_tween_animating.current = true; // set flag
                lookat_tween.start();
            }
            else {
                //loadNewBackground(bgskyprops.color, 'http://localhost:3000/assets/test/standardstudios.jpg');
                //loadNewBackground(bgskyprops.color, 'https://www.leafgon.com/assets/test/standardstudios.jpg');
                loadNewBackground(bgskyprops.color, leafgon_url+'/assets/test/standardstudios.jpg');
                //const nextidx = (this.state.curbgtexture + 1)%this.state.bgtextureList.length;
                //this.setBackground(nextidx);
                enterNodeInfoMode(null);
                threejs_props.current.camera.getWorldDirection(dirvector);
                //console.log('camera is looking at: ' + (dirvector.x) + ',' + (dirvector.y) + ',' + (dirvector.z));
                //removeSysAdminSprites();
                //createSysAdminSprite(nodeloader.current, graph_props.current.layout.center_of_gravity);
                let lookat_tween = new TWEEN.Tween(threejs_props.current.cameraTarget);

                let objposition = graph_props.current.layout.center_of_gravity.clone();
                lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
                //let that = this;
                //lookat_tween.onComplete( function() {
                //  console.log("cur cam is looking at: ", that.cameraTarget);
                //});
                is_tween_animating.current = true; // set flag
                lookat_tween.onComplete( function() {
                //  console.log("cur cam is looking at: ", that.cameraTarget);
                is_tween_animating.current = false; // reset flag
                });
                lookat_tween.start();
            }

            }
        };

        const onLongPress = (e) => {
            console.log("onLongPress: ", e, threejs_props.current.scene, nodeloader.current);

            //this.refreshGraphLabels();

            if (typeof threejs_props.current.scene !== "undefined") // sanity check
            {
            if (!this.controls.enabled) {
                this.controls.enabled = true;
                // Set position and look at
                threejs_props.current.camera.position.set(0,400,500);
                this.controls.update();
            }
            let canvrect = threejs_props.current.renderer.domElement.getBoundingClientRect();

            // Example of mesh selection/pick:
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            mouse.x = ((e.center.x - canvrect.left)/ (canvrect.right - canvrect.left)) * 2 - 1;
            mouse.y = - ((e.center.y - canvrect.top)/ (canvrect.bottom - canvrect.top)) * 2 + 1;
            raycaster.setFromCamera(mouse, threejs_props.current.camera);

            var obj = []; //: THREE.Object3D[]
            this.findAllObjects(obj, threejs_props.current.scene);
            var intersects = raycaster.intersectObjects(obj);
            let hitit = false;
            intersects.forEach((i) => {
                console.log('clicked object: ', i.object); // do what you want to do with object
                hitit = true;
            });

            if (hitit) {
                Object.keys(threejs_props.current.sysadmin_sprites).forEach( (sysadmin_uuid) => {
                if (intersects[0].object.uuid === sysadmin_uuid) { // exclude the hit operation for sysadmin mesh (i.e. the center globe)
                    hitit = false;
                }
                });
            }
            let dirvector= new THREE.Vector3();
            if (hitit) {
                hitit = false;
                //this.curNodeUUID = intersects[0].object.uuid;
                setLEAFappScripts((otherprops) => {return {...otherprops, curNodeUUID: intersects[0].object.uuid}});
                // placeholder for experiments
                let newposition = intersects[0].object.position.clone();
                let objposition = intersects[0].object.position.clone();
                console.log('clicked mesh object: ', intersects[0].object); // do what you want to do with object
                //this.enterNodeInfoMode(intersects[0].object.uuid);
                dirvector.subVectors(newposition, graph_props.current.layout.center_of_gravity).normalize()
                console.log("dirvector: ", dirvector);
                console.log("obj position: ", objposition);
                console.log("obj dist: ", newposition.distanceTo(graph_props.current.layout.center_of_gravity));

                newposition.add(dirvector.multiplyScalar(200));
                console.log("new cam dist: ", newposition.distanceTo(graph_props.current.layout.center_of_gravity));
                // get a directional unit vector btw center and the hit obj
                // let tween = new TWEEN.Tween(intersects[0].object.position);
                let motion_tween = new TWEEN.Tween(threejs_props.current.camera.position);
                let lookat_tween = new TWEEN.Tween(this.cameraTarget);

                console.log('tween: ', motion_tween);
                console.log('anim loop: ', is_anim_enabled.current);
                motion_tween.to({x: newposition.x, y: newposition.y, z: newposition.z}, 1000);
                lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
                let that = this;

                motion_tween.onComplete( function() {
                    console.log("cur tween stat: ", is_tween_animating.current);
                    is_tween_animating.current = false; // reset flag
                    console.log("cur tween stat: ", is_tween_animating.current);
                    if (leafapp_props.current.curNode) {
                        leafapp_props.current.curNodeScreenPosition = () => {return projectWorldToScreen(leafapp_props.current.curNode.position, threejs_props.current.camera)};
                        showSystemMenu(); 
                        //need_rerender(); // force re-render
                    }
                });
                lookat_tween.chain(motion_tween);
                is_tween_animating.current = true; // set flag
                lookat_tween.start();

                // load runtime scripts
                //if (!this.is_runtimeleaf_loaded) {
                //  this.disableAnimation();
                //  //this.curNodeUUID = this.controls.target;
                //  this.loadRuntimeModules();
                //  this.is_runtimeleaf_loaded = true;
                //}
            }
            else {
                this.enterNodeInfoMode(null);
                threejs_props.current.camera.getWorldDirection(dirvector);
                //console.log('camera is looking at: ' + (dirvector.x) + ',' + (dirvector.y) + ',' + (dirvector.z));
                //this.removeSysAdminSprites();
                //this.createSysAdminSprite(nodeloader.current, graph_props.current.layout.center_of_gravity);
                let lookat_tween = new TWEEN.Tween(this.cameraTarget);

                let objposition = graph_props.current.layout.center_of_gravity.clone();
                lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
                let that = this;
                //lookat_tween.onComplete( function() {
                //  console.log("cur cam is looking at: ", that.cameraTarget);
                //});
                is_tween_animating.current = true; // set flag
                lookat_tween.onComplete( function() {
                    //  console.log("cur cam is looking at: ", that.cameraTarget);
                    is_tween_animating.current = false; // reset flag
                });
                lookat_tween.start();
            }

            }
        };

        const onResize = (e) => {
            fitCanvas(true, threejs_props.current);
            need_rerender();
        };

        const escFunction = ( e ) => {
            if (e.keyCode === 27) { // escape key 
            console.log("ESC pressed");
            hideSystemMenu();
            //if (this.is_runtimeleaf_loaded) {
            //  //this.enableAnimation();
            //  this.unloadRuntimeModules();
            //  this.is_runtimeleaf_loaded = false;
            //  this.renderer.setClearColor(0xffffff, 0); // set to be transparent
            //}
            }
        };
        
        const viewerImage = document.getElementById("myElement"+props.nodeuuid);
        //const viewerImage = document.getElementById("myCanvas"+props.nodeuuid);
        //const viewerImage = document.getElementById("myCanvasDiv")

        const hammer = propagating(new Hammer.Manager(viewerImage, {} )); // initialize hammer 
        //const hammer = new Hammer.Manager(viewerImage, {} ); // initialize hammer 
        //hammer.options.domEvents = true; // enable dom events (propagation as such)
        const singleTap = new Hammer.Tap({event: 'singletap'});
        const doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
        const longPress = new Hammer.Press({event: 'longpress', time:500});
        const swipe = new Hammer.Swipe({event: 'swipe'});

        hammer.add([doubleTap, singleTap, swipe, longPress]);

        doubleTap.recognizeWith([singleTap]);
        singleTap.requireFailure([doubleTap, longPress]);
        
        hammer.on("singletap", e => {
            //console.log("HAMMERTIME: SINGLE TAP")
            //e.target.uuid = "myCanvas";

            //if (e.target.uuid == "myCanvas") {}
            //if (e.target.id == 'myElement') {} // && (!this.state.curNode) {}
            //if (e.target.id == 'bgtagframe') {} // && (!this.state.curNode) {}
            //if (e.target.id == 'myCanvasDiv') {} // && (!this.state.curNode) {}
            console.log("HAMMERTIME: SINGLE TAP")
            //e.preventDefault();
            onSingleTap(e);
            //e.stopPropagation();
        });
        hammer.on("doubletap", e => {
        if (e.target.id == '') {
            console.log("HAMMERTIME: DOUBLE TAP")
            onDoubleTap(e);
        }
        });
        hammer.on("swipe", e => {
        if (e.target.id == '') {
            console.log("HAMMERTIME: Swipe", e);
        }
        });
        hammer.on("longpress", e => {
        if (e.target.id == '') {
            console.log("HAMMERTIME: Long press", e);
            onLongPress(e);
        }
        });
        /*
        const hammertime = new Hammer(viewerImage);
        hammertime.on("singletap", e => {
            console.log("HAMMERTIME: SINGLE TAP")
            this.onSingleTap(e);
        });
        hammertime.on("doubletap", e => {
        console.log("HAMMERTIME: DOUBLE TAP")
        this.onDoubleTap(e);
        });
        hammertime.on("swipe", e => {
            console.log("HAMMERTIME: Swipe", e)
        });
        */
        

        // register resize event handler
        window.addEventListener("resize", onResize);
        document.addEventListener("keydown", escFunction, false);

        //actUponOrbitalGraph() depends on nodeloader.current being initialized
        //if ('graph_data' in props.data) { // calling for update in the gnav 3D orbitals and the moon
        //    // do update appview channel data
        //    actUponOrbitalGraph(props.data);
        //}

        console.log('useEffect() finished running:');

        leafapp_props.current.isMounted = true;
        // return cleanup code to the hook 
        return (() => {
            console.log('cleaning up after useEffect()');
            window.removeEventListener("resize", onResize);
            document.removeEventListener("keydown.escape", escFunction, false);
            leafapp_props.current.isMounted = false;
        });

    }, []);

    useEffect(() => {
        fitCanvas(true, threejs_props.current);
        //const scalestr = 'scale(1)';
        //document.body.style.webkitTransform = scalestr; // Chrome, Opera, Safari
        //document.body.style.transform = "scale(1)";
        //document.body.style.zoom = "1";
        //document.querySelector('meta[name="viewport"]')?.remove();
        //const viewport = document.createElement('meta');
        //viewport.name = "viewport";
        //document.getElementsByTagName('head')[0].appendChild(viewport);
        //document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no');
        need_rerender();
    }, [props.dimensions]);

    useEffect(() => {
        //document.addEventListener('gestureend', function(e) 
        document.addEventListener('wheel', function(e) {
            if (window.visualViewport.scale == 1.0) {
                if (!threejs_props.current.orbitcontrols.enableZoom) {
                    threejs_props.current.orbitcontrols.enableZoom = true;
                    need_rerender();
                }
            } else {
                //e.preventDefault();
                if (threejs_props.current.orbitcontrols.enableZoom) {
                    threejs_props.current.orbitcontrols.enableZoom = false;
                    need_rerender();
                }
            }
          }, false);
          document.addEventListener('gestureend', function(e) {
            if (window.visualViewport.scale == 1.0) {
                if (!threejs_props.current.orbitcontrols.enableZoom) {
                    threejs_props.current.orbitcontrols.enableZoom = true;
                    need_rerender();
                }
            } else {
                //e.preventDefault();
                if (threejs_props.current.orbitcontrols.enableZoom) {
                    threejs_props.current.orbitcontrols.enableZoom = false;
                    need_rerender();
                }
            }
          }, false);
        //if (window.visualViewport.scale == 1)
        //{
        //    threejs_props.current.orbitcontrols.enableZoom = true;
        //}
        //else
        //{
        //    threejs_props.current.orbitcontrols.enableZoom = false;
        //}
    }, []);

    const initGraphState = () => {
        //const graph_layout = new ForceDirectedLayout(graph_props.current, graph_props.current.layout_options);
        //graph_layout.init();
        const graph_layout = new ForceDirectedLayout(graph_props.current, graph_props.current.layout_options);
        graph_layout.init();
        //graph_props.current.layout = graph_layout;

        graph_props.current = {
            ...graph_props.current,
            nodes: [], edges: [], edge_keys: [],
            mesh_lut: {nodes:{}, edges:{}, uuidlut:{}, mesh2node: {}}, 
            node_lut: {},
            edge_lut: {},
            sim_options: {},
            layout: graph_layout,
        };
        need_rerender();
    };

    const initPhyxSim = (isFirst=false) => {
        console.log('entered initPhyxSim');
    
        //graph_state.layout = new ForceDirectedLayout(graph_state, this.layout_options);
        //graph_state.layout.init();
        //if (graph_props.current.nodes.length > 0) {
            const graph_layout = new ForceDirectedLayout(graph_props.current, graph_props.current.layout_options, cogCallback, doneCallback);
            graph_layout.init();
            graph_props.current = {
                ...graph_props.current,
                layout: graph_layout,
            };
            // spark_dev_note: limiting graph_layout to non-zero node length solved the safari blackout issue 13/Dec/2022
            if (isFirst || graph_props.current.nodes.length == 0)
                graph_layout.finished = true;
            else
                need_rerender();
        //}
    };

    const asyncUpdateAddNodeData = useCallback(
        async (added_nodes) => {
            updateNodes(nodeloader.current, added_nodes);
            initPhyxSim();
        },
        [] // this functional const would get reassigned if defined, here, as [some_var] and some_var changes
    );
    const updateAddNodeData = (added_nodes) => {
        updateNodes(nodeloader.current, added_nodes);
        initPhyxSim();
    };

    
    const asyncUpdateRemoveNodeData = useCallback(
        async (removed_nodes) => {
            destroyPartialGraph({nodes: removed_nodes, edges: {}});
            initPhyxSim();
        },
        [] // this functional const would get reassigned if defined, here, as [some_var] and some_var changes
    );
    const updateRemoveNodeData = (removed_nodes) => {
        destroyPartialGraph({nodes: removed_nodes, edges: {}});
        initPhyxSim();
    };

    const asyncUpdateAddEdgeData = useCallback(
        async (added_edges) => {
            updateEdges(nodeloader.current, added_edges);
            initPhyxSim();
        },
        [] // this functional const would get reassigned if defined, here, as [some_var] and some_var changes
    );
    const updateAddEdgeData = (added_edges) => {
        updateEdges(nodeloader.current, added_edges);
        initPhyxSim();
    };
    
    const asyncUpdateRemoveEdgeData = useCallback(
        async (removed_edges) => {
            destroyPartialGraph({nodes: {}, edges: removed_edges});
            initPhyxSim();
        },
        [] // this functional const would get reassigned if defined, here, as [some_var] and some_var changes
    );
    const updateRemoveEdgeData = (removed_edges) => {
        destroyPartialGraph({nodes: {}, edges: removed_edges});
        initPhyxSim();
    };

    // this effect would run everytime props.graph_data changes
    useEffect(() => {
        if ('graph_data' in props.data) { // calling for update in the gnav 3D orbitals and the moon
            const moontexture = assets_manager.get(textureKey.current.images['moon']);
            // do update appview channel data
            if (moontexture && !is_data_seen) 
                actUponOrbitalGraph(props.data);
        }

        // now return a clean up function
        return () => {
            // TBD: do all the clean up here
            //setGraphdata({"nodes": [], "edges": []})
        
            console.log("gnav: cleaning up graphdata done.");
        }
    }, [props.data, props.data.render_id]); // 

    //useEffect(() => {
    //    let added_nodes = null; // init
    //    let removed_nodes = null;
    //    let added_edges = null;
    //    let removed_edges = null;
    //    
    //    setGraphdata((prevgd) => {

    //        added_nodes = findAddedJSON(prevgd.nodes, props.graph_data.nodes); // find out if new nodes added as per the difference
    //        removed_nodes = findRemovedJSON(prevgd.nodes, props.graph_data.nodes);
    //        added_edges = findAddedJSON(prevgd.edges, props.graph_data.edges);
    //        removed_edges = findRemovedJSON(prevgd.edges, props.graph_data.edges);

    //        // calling preprocessGraph() should take place here or prior to calling downstream update functions
    //        // spark_dev_note: the conundrum here in terms of refactoring the code to accept preprocessedGraph data from breezyforest graph data
    //        // is that the code here incrementally accepts partial nodes and edges data, making it difficult to preprocess partial
    //        // graph data to be integrated retrospectively
    //        // a possible solution is to maintain a local copy of breezyforest graph data to/from which any incremental changes get updated, 
    //        // and to run preprocessGraph() against the whole breezyforest graph to generate navigable graph data for downstream consumption.

    //        // e.g.: added_nodes[0]: {uuid: 'cd023a85-0792-429d-939c-e99ea31d05ef', label: 'ala2', out_edges: Array(0), in_edges: Array(0)}
    //        // [{index: 1, title: '1'}, {index: 2, title: '2'}, {index: 3, title: '3'}, {index: 4, title: '4'}]
    //        if (Object.keys(added_nodes).length > 0) {
    //            console.log('############################ >>>: ', added_nodes.length, added_nodes);
    //            asyncUpdateAddNodeData(added_nodes);
    //            //updateAddNodeData(added_nodes);
    //        };

    //        if (Object.keys(removed_nodes).length > 0) {
    //            asyncUpdateRemoveNodeData(removed_nodes);
    //            //updateRemoveNodeData(removed_nodes);
    //        }

    //        if (Object.keys(added_edges).length > 0) {
    //            asyncUpdateAddEdgeData(added_edges);
    //            //updateAddEdgeData(added_edges);
    //        }

    //        if (Object.keys(removed_edges).length > 0) {
    //            asyncUpdateRemoveEdgeData(removed_edges);
    //            //updateRemoveEdgeData(removed_edges);
    //        }

    //        return props.graph_data; // update graph_data for the next round
    //    });

    //    // return cleanup code to the hook
    //    //return (() => {
    //    //});

    //}, [props.data, props.data.render_id]);


    const enterAnimationLoop = () => {
        // enter anim loop
        //let component = this;
        (function animate_step(now, xrframe) {
          if (is_anim_enabled.current) {
            requestAnimationFrame(animate_step);
            TWEEN.update(now);
            update();
            requestCameraUpdateIfNotRequested(); // in lieu of calling camcontrol.update();
    
            render2();
            if (camUpdateRequested.current) 
              camUpdateRequested.current = false; // toggle
    
            animateBGTexture();
          }
        }() );
    };

    const enterLEAFjsAnimLoop = () => {
        // enter anim loop
        let component = this;

        (function animate_step(now, xrframe) {
            if (is_anim_enabled.current) {
            requestAnimationFrame(animate_step);
            }
        }() );

    };

    const enableAnimation = () => {
        if (!is_anim_enabled.current) {
            is_anim_enabled.current = true;
            enterAnimationLoop();
        }
    };

    const disableAnimation = () => {
        is_anim_enabled.current = false;
    };

    // this function has max calling frequency as determined by the timeout interval
    const animateBGTexture = async () => {
        if (leafapp_props.current.curbgtexture > -1) {
            if (!leafapp_props.current.bganimrefreshed) {
            // the following block of code will be called every timeout
            if (bgskyprops.color !== {r: 0, g: 0, b: 0, a: 1.0}) { // poor design, used for quick testing of concept
                leafapp_props.current.bganimrefreshed = true;

                const nextidx = (leafapp_props.current.curbgtexture + 1)%leafapp_props.current.bgtextureList.length;
                //let bgcrt = this.state.bgtextureList[nextidx]
                //this.loadNewBackground(bgcrt, this.bgskyprops.color, 'http://localhost:3000/assets/test/standardstudios.jpg');
                //await colorImages(['http://localhost:3000/assets/test/hubbleinfrared.jpg'], [0.5], this.bgskyprops.color);
                //.then( imgurl => this.loadNewBackground(bgcrt, imgurl) );
                // bgcrt.mesh.material.uniforms.tEquirect.value = texture;
                //bgcrt.mesh.material.uniforms.tEquirect.value.image.currentSrc = url;
                //if (nextidx === 0) {
                //  bgcrt.mesh.material.uniforms.tEquirect.value.image.currentSrc = 'http://localhost:3000/assets/test/standardstudios.jpg';
                //}

                //let that = this;
                setTimeout(() => {
                    //if (that.state.bgtagvectors.length > 0) {
                    //  that.setState({bgtaglist: that.findAllBGTags()});
                    //}
                    setBackground(nextidx);
                    leafapp_props.current.bganimrefreshed = false;
                }, 100);
            }
            }
        }
    };

    const updateSplineOutline = () => {
        let edge_meshlut = graph_props.current.mesh_lut.edges;
        let node_meshlut = graph_props.current.mesh_lut.nodes;
        let edge_lut = graph_props.current.edge_lut;
        //console.log('$$$$$$$$$$$$$$$$ updateSplineOutline() edge_meshlut y node_meshlut: ', edge_meshlut, node_meshlut);
        Object.keys(edge_meshlut).forEach( function(key) {
            const edgeobj = edge_meshlut[key]; // get a hold of the curve object
            //let nodeid_pair = JSON.parse(key);
            //let nodeid_pair = {'source': edge_lut[key].source.uuid, 'target': edge_lut[key].target.uuid};
            const nodeid_pair = edge_lut[key];

            // copy node pair's new locations to the edge points
            //console.log(edgeobj);
            //console.log(node_lut[nodeid_pair.source]);
            //console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ updateSplineOutline(): ', edgeobj, nodeid_pair, node_meshlut);
            if (edgeobj.geometry.attributes.position.count === 2) {
            if (nodeid_pair.source.uuid in node_meshlut && nodeid_pair.target.uuid in node_meshlut) {
                let new_points = [];
                new_points.push(node_meshlut[nodeid_pair.source.uuid].position);
                new_points.push(node_meshlut[nodeid_pair.target.uuid].position);
                edgeobj.geometry.setFromPoints(new_points);
            }
            //edgeobj.points[0].copy(node_lut[nodeid_pair.source].position);
            //edgeobj.points[1].copy(node_lut[nodeid_pair.target].position);
            }
            else {
            console.log(nodeid_pair);
            }

        });
        
        // update flags for edge position change
        threejs_props.current.mesh_groups.edges.children.forEach( function(edge_mesh) {
            edge_mesh['geometry'].verticesNeedUpdate = true;
        });
    };

    // Generate random numbers
    const randomFromTo = (from, to) => {
        return Math.floor(Math.random() * (to - from + 1) + from);
    };

    /*
    const preprocessGraphData = (graph_data) => {
        console.log('preprocessGraphData(): logging graph data')
        console.log(graph_data)

        // initialize the node bookkeeping data structure
        for( let i in graph_data.nodes) {
            //let node = graph_data.nodes[i]['data'];
            let node = graph_data.nodes[i];
            console.log('preprocessing a graph node: ', node);
            // add following properties to the node json
            //node['edge_count'] = 0; // initialize
            node['mesh_uuid'] = null; // initialize
            graph_props.current.node_lut[node.uuid] = node;
            console.log('preprocessing a graph node before push: ', graph_props.current.nodes);
            graph_props.current.nodes.push(node);
            console.log('preprocessing a graph node after push: ', graph_props.current.nodes);
        }

        // get edge_count tallies for all nodes
        for( let i in graph_data.edges) {
            //let edge = graph_data.edges[i]['data'];
            let edge = graph_data.edges[i];
            if (edge.source.uuid !== edge.target.uuid) { // dropping edges with the same source and target (or self-loops) seems to be a rationale choice for now
            //this.graph.node_lut[edge.source.uuid].edge_count++;
            //this.graph.node_lut[edge.target.uuid].edge_count++;

            // make an edge lut key from the source and target IDs
            //let edge_key = JSON.stringify({'source':edge.source.uuid, 'target':edge.target.uuid});
            let edge_key = edge.uuid; //JSON.stringify({'source':edge.source.uuid, 'target':edge.target.uuid});
            graph_props.current.edge_keys.push(edge_key);
            }
        }
    };
    */

    /*
     * preprocessGraphData() converts the input graph data (breezyforest nodes and edges) into the data format
     * required by LEAT3DNavigator.updateNodes and LEAT3DNavigator.updateEdges
     * @graph_data: an object consisting of a nodes list and a edges list, where each node or edge data
     * follows the breezyforest format  
     */
    const preprocessGraphData = (graph_data) => {
        console.log('preprocessGraphData(): logging graph data')
        console.log(graph_data)

        // initialize the node bookkeeping data structure
        for( let i in graph_data.nodes) {
            //let node = graph_data.nodes[i]['data'];
            let node = graph_data.nodes[i];
            console.log('preprocessing a graph node: ', node);
            // add following properties to the node json
            //node['edge_count'] = 0; // initialize
            node['mesh_uuid'] = null; // initialize
            graph_props.current.node_lut[node.uuid] = node; // this LUT is used for setting sysMemuData upon user interaction on a navigable node
            console.log('preprocessing a graph node before push: ', graph_props.current.nodes);
            graph_props.current.nodes.push(node);
            console.log('preprocessing a graph node after push: ', graph_props.current.nodes);
        }

        // get edge_count tallies for all nodes
        for( let i in graph_data.edges) {
            //let edge = graph_data.edges[i]['data'];
            let edge = graph_data.edges[i];
            if (edge.source.uuid !== edge.target.uuid) { // dropping edges with the same source and target (or self-loops) seems to be a rationale choice for now
            //this.graph.node_lut[edge.source.uuid].edge_count++;
            //this.graph.node_lut[edge.target.uuid].edge_count++;

            // make an edge lut key from the source and target IDs
            //let edge_key = JSON.stringify({'source':edge.source.uuid, 'target':edge.target.uuid});
            let edge_key = edge.uuid; //JSON.stringify({'source':edge.source.uuid, 'target':edge.target.uuid});
            graph_props.current.edge_keys.push(edge_key);
            }
        }
    };

    const filterLUT = (lut, filter_id_list) => {
    let removal_lut = Object.keys(lut)
        .filter(key => filter_id_list.includes(key))
        .reduce((obj, key) => {
        obj[key] = lut[key];
        return obj;
        },{}); // return filtered obj lut

        return removal_lut;
    };

    const destroyPartialGraph = ({nodes, edges}) => {
        is_deleting_graph.current = true; // flag edntering critical section
        let destroyObject = function func(obj) {
            for (let prop in obj) {
            obj[prop] = 'undefined';
            //delete obj[prop];
            }
        }
        let destroyTHREEGroupObjects = function func(obj) {
            for (let prop in obj.children) {
            obj.remove(obj[prop]);
            }
        }

        let lookupTextlabelElement = function func(objs, nodemesh) {
            return Object.values(objs).forEach((obj) => {if (obj.parent === nodemesh){return obj.element;}});
        }

        let node_mesh_lut = graph_props.current.mesh_lut.nodes;
        let mesh2node_lut = graph_props.current.mesh_lut.mesh2node;
        let edge_mesh_lut = graph_props.current.mesh_lut.edges;
        //let nodes_group = threejs_props.mesh_groups.nodes;
        //let edges_group = threejs_props.mesh_groups.edges;
        //let scene = this.scene;

        let filtered_nodeid_list = []; 
        Object.values(nodes).forEach( (node) => {filtered_nodeid_list.push(node.uuid)});
        if (filtered_nodeid_list) {
            let removal_lut = filterLUT(node_mesh_lut, filtered_nodeid_list); // return filtered obj lut
            let node_lut = graph_props.current.node_lut;

            Object.keys(removal_lut).forEach( (node_key) => {
            let node = removal_lut[node_key];
            let labelElement = lookupTextlabelElement(threejs_props.current.jsx_elements.textlabels, node);
            if (props.el_renderer) {
                props.el_renderer.removeChild(props.el.nativeElement, labelElement); // remove ref to DOM text label
            }
            threejs_props.current.scene.remove(node);
            delete mesh2node_lut[node_mesh_lut[node_key]];
            delete node_mesh_lut[node_key];
            delete node_lut[node_key];
            //destroyObject(this.graph.mesh_lut.uuidlut[node.uuid]);
            delete graph_props.current.mesh_lut.uuidlut[node.uuid];
            threejs_props.current.mesh_groups.nodes.remove(node);
            node.geometry.dispose();
            node.material.dispose();
            });
        }

        let filtered_edgeid_list = []; 
        Object.values(edges).forEach( (edge) => {filtered_edgeid_list.push(edge.uuid)});
        if (filtered_edgeid_list) {
            let removal_lut = filterLUT(edge_mesh_lut, filtered_edgeid_list); // return filtered obj lut
            let edge_lut = graph_props.current.edge_lut;

            Object.keys(removal_lut).forEach( (edge_key) => {
            let edge = removal_lut[edge_key];
            threejs_props.current.mesh_groups.edges.remove(edge);
            threejs_props.current.scene.remove(edge);
            delete edge_mesh_lut[edge_key];
            delete edge_lut[edge_key];
            if (edge.mesh) {
                edge.mesh.geometry.dispose();
                edge.mesh.material.dispose();
            }
            else {
                edge.geometry.dispose();
                edge.material.dispose();
            }
            });
        }

        /*
        for (let i in this.textlabels) {
            let label = this.textlabels[i];
            if (this.el_renderer) {
            this.el_renderer.removeChild(this.el.nativeElement, label.element);
            }
        }
        */

        /*
        console.log('destroying graph objects');
        destroyObject(graph_state.mesh_lut.uuidlut);
        destroyObject(graph_state.mesh_lut.nodes);
        destroyObject(graph_state.mesh_lut.edges);
        destroyObject(graph_state.sim_options);
        destroyObject(graph_state.nodes);
        destroyObject(graph_state.edge_keys);
        destroyObject(this.textlabels);
        destroyTHREEGroupObjects(this.mesh_groups['nodes']);
        destroyTHREEGroupObjects(this.mesh_groups['edges']);
        graph_state.layout.graph = null;
        graph_state = {};
        this.textlabels = [];
        */
        is_deleting_graph.current = false; // flag exiting critical section
    };

    const destroyGraph = () => {
        is_deleting_graph.current = true; // flag edntering critical section
        let destroyObject = function func(obj) {
            for (let prop in obj) {
            obj[prop] = 'undefined';
            delete obj[prop];
            }
        }
        let destroyTHREEGroupObjects = function func(obj) {
            for (let prop in obj.children) {
            obj.remove(obj[prop]);
            }
        }

        let node_mesh_lut = graph_props.current.mesh_lut.nodes;
        let edge_mesh_lut = graph_props.current.mesh_lut.edges;
        //let nodes_group = threejs_props.mesh_groups.nodes;
        //let edges_group = threejs_props.mesh_groups.edges;
        //let scene = this.scene;

        Object.values(node_mesh_lut).forEach( (node) => {
            threejs_props.current.mesh_groups.nodes.remove(node);
            threejs_props.scene.current.remove(node);
            node.geometry.dispose();
            node.material.dispose();
        });
        Object.values(edge_mesh_lut).forEach( (edge) => {
            threejs_props.current.mesh_groups.edges.remove(edge);
            threejs_props.current.scene.remove(edge);
            if (edge.mesh) {
            edge.mesh.geometry.dispose();
            edge.mesh.material.dispose();
            }
            else {
            edge.geometry.dispose();
            edge.material.dispose();
            }
        });
        for (let i in threejs_props.current.jsx_elements.textlabels) {
            let label = threejs_props.current.jsx_elements.textlabels[i];
            if (props.el_renderer) {
            props.el_renderer.removeChild(props.el.nativeElement, label.element);
            }
        }

        console.log('destroying graph objects');
        destroyObject(graph_props.current.mesh_lut.uuidlut);
        destroyObject(graph_props.current.mesh_lut.nodes);
        destroyObject(graph_props.current.mesh_lut.edges);
        destroyObject(graph_props.current.mesh_lut.mesh2node); /////// add code for deleting removed mesh in destroyPartialGraph()
        destroyObject(graph_props.current.sim_options);
        destroyObject(graph_props.current.nodes);
        destroyObject(graph_props.current.edges);
        destroyObject(graph_props.current.edge_keys);
        destroyObject(threejs_props.current.jsx_elements.textlabels);
        destroyObject(threejs_props.current.jsx_elements.textlabel_lut);
        destroyTHREEGroupObjects(threejs_props.current.mesh_groups['nodes']);
        destroyTHREEGroupObjects(threejs_props.current.mesh_groups['edges']);
        graph_props.current.layout.graph = null;
        // reset graph_state
        graph_props.current = {
            nodes: [], edges: [], edge_keys: [],
            mesh_lut: {nodes:{}, edges:{}, uuidlut:{}, mesh2node: {}}, 
            node_lut: {},
            edge_lut: {},
            sim_options: {},
            layout: null,
        };

        //this.textlabels = [];
        is_deleting_graph.current = false; // flag exiting critical section
    };

    /*
    // reloadGraph currently NOT used
    const reloadGraph = (loader, graph_data) => {
        // remove any old node/edge mesh objects in the scene
        destroyGraph();

        // load the graph data and initialize their force field simulation
        console.log('reloadGraph entered');
        const fetchGraphData = async () => {
            //this.graph_data = await this.graph_data;
            console.log(props.graph_data);
            console.log('LEAT3DNavigator(): props2:');
            //this.reloadGraph(this.nodeloader, this.props.graph_data.currentValue);
            //this.reloadGraph(this.nodeloader, this.graph_data);
            this.createGraph(loader, props.graph_data);
            this.initPhyxSim();
        };
        fetchGraphData();
    };
    */

    const removeSysAdminSprites = () => {
        //let that = this;
        Object.keys(threejs_props.current.sysadmin_sprites).forEach( (uuid) => {
            let node = threejs_props.current.sysadmin_sprites[uuid];
            threejs_props.current.scene.remove(node);
            node.geometry.dispose();
            node.material.dispose();
            delete threejs_props.current.sysadmin_sprites[uuid];
        });
    };

    // a callback function called when ForceDirectedLayout's center of gravity (cog) is settled
    const doneCallback = () => {
        // cogCalculationDone status is used in cypress testing to wait for cog calculation before proceeding with click test
        console.log('HHHHHHHHHHHHHHHHHHH doneCallback()');
        threejs_props.current.cogCalculationDone = true; // spark_dev_note: artifact of synchronizing jest test sequences
        if (leafapp_props.current.isMounted)
            need_rerender();
    };

    // a callback function called as per ForceDirectedLayout's changing center of gravity (cog)
    const cogCallback = (position) => {

        // update camera target as per changing cog
        threejs_props.current.cameraTarget.x = position.x;
        threejs_props.current.cameraTarget.y = position.y;
        threejs_props.current.cameraTarget.z = position.z;

        // update moon position as per changing cog
        Object.values(threejs_props.current.sysadmin_sprites).map((mesh) => {
                // set the initial position to be rendered in the scene
                mesh.position.x = position.x;
                mesh.position.y = position.y;
                mesh.position.z = position.z;
            }
        );
    };

    const createSysAdminSprite = (loader, position) => {
        let imgTexture = loader;
        imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
        imgTexture.encoding = THREE.sRGBEncoding;
        imgTexture.anisotropy = 16;
        
        // work with HSL color space for node visualization
        let rand_alpha = Math.random(); // 0 <= random val <= 1.0
        let alpha = rand_alpha;
        let specularShininess = Math.pow( 2, rand_alpha * 10 );

        // now set the values for 'beta' and 'gamma' as per graph data or metadata
        // use defaults for now
        let beta = 0.5;
        let gamma = 0.5;

        let specularColor = new THREE.Color( beta * 0.2, beta * 0.2, beta * 0.2 );

        // basic monochromatic energy preservation
        let diffuseColor = new THREE.Color().setHSL( alpha, 0.5, gamma * 0.5 + 0.1 ).multiplyScalar( 1 - beta * 0.2 );

        let bumpScale = 1;
        // each node has a different material in this case
        let material = new THREE.MeshToonMaterial( {
            map: imgTexture,
            bumpMap: imgTexture,
            bumpScale: bumpScale,
            color: diffuseColor,
            //specular: specularColor,
            //shininess: specularShininess,
        });

        // work on node creation
        const nodegeom = new THREE.SphereGeometry( sphereRadius, 32, 16 );
        // create mesh based on the geometry and the material, aka the visualized object for the node
        let mesh = new THREE.Mesh( nodegeom, material );

        // set the initial position to be rendered in the scene
        mesh.position.x = position.x;
        mesh.position.y = position.y;
        mesh.position.z = position.z;

        //threejs_props.sysadmin_sprites[mesh.uuid] = mesh;
        threejs_props.current.sysadmin_sprites[mesh.uuid] = mesh;
        threejs_props.current.scene.add(mesh);
        // in case adding a new mesh needs rerendering
        //spark_dev_note: debugging Safari blackout on browser refresh 23/Nov/2022
        //need_rerender();

        /*
        node = {};
        node['mesh_uuid'] = null; // initialize
        node['is_center'] = true;
        node.uuid = uuid4();
        this.graph.node_lut[node.uuid] = node;
        this.graph.nodes.push(node)
        */
       return mesh.uuid;
    };

    const clearWireGlobe = () => {
        //let that = this;
        Object.keys(threejs_props.current._wireglobemesh).forEach( (uuid) => {
            let node = threejs_props.current._wireglobemesh[uuid];
            threejs_props.current.scene.remove(node);
            node.geometry.dispose();
            node.material.dispose();
            delete threejs_props.current._wireglobemesh[uuid];
        });
    };

    const createWireGlobe = (loader) => {
        this.clearWireGlobe(); // to only allow one wire globe at any given moment
        const radius = 40;
        const segments = 10;
        const rings = 10;

        const geometry = new THREE.SphereGeometry(radius, segments, rings);
        const geometry2 = new THREE.SphereGeometry(9000, segments, rings);

        const material = new THREE.MeshBasicMaterial({
            color: 0xF3A2B0,
            wireframe: true
        });

        let globemesh = new THREE.Mesh(geometry, material);
        let globemesh2 = new THREE.Mesh(geometry2, material);
        threejs_props.current.scene.add(globemesh);
        threejs_props.current.scene.add(globemesh2);
        //this._wireglobemesh[globemesh.uuid] = globemesh;
        //this._wireglobemesh[globemesh2.uuid] = globemesh2;
        threejs_props.current._wireglobemesh[globemesh.uuid] = globemesh;
        threejs_props.current._wireglobemesh[globemesh2.uuid] = globemesh2;
        // in case adding a new mesh needs rerendering
        need_rerender();
    };

    const clearTestNodes = () => {
        //let that = this;
        Object.keys(threejs_props.current.test_sprites).forEach( (uuid) => {
            let node = threejs_props.current.test_sprites[uuid];
            threejs_props.current.scene.remove(node);
            node.geometry.dispose();
            node.material.dispose();
            delete threejs_props.current.test_sprites[uuid];
        });
    };

    const createTestNode = (loader, position) => {
        let imgTexture = loader;
        imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
        imgTexture.encoding = THREE.sRGBEncoding;
        imgTexture.anisotropy = 16;
        
        // work with HSL color space for node visualization
        let rand_alpha = Math.random(); // 0 <= random val <= 1.0
        let alpha = rand_alpha;
        let specularShininess = Math.pow( 2, rand_alpha * 10 );

        // now set the values for 'beta' and 'gamma' as per graph data or metadata
        // use defaults for now
        let beta = 0.5;
        let gamma = 0.5;

        let specularColor = new THREE.Color( beta * 0.2, beta * 0.2, beta * 0.2 );

        // basic monochromatic energy preservation
        let diffuseColor = new THREE.Color().setHSL( alpha, 0.5, gamma * 0.5 + 0.1 ).multiplyScalar( 1 - beta * 0.2 );

        let bumpScale = 1;
        // each node has a different material in this case
        let material = new THREE.MeshToonMaterial( {
            map: imgTexture,
            bumpMap: imgTexture,
            bumpScale: bumpScale,
            color: diffuseColor,
            //specular: specularColor,
            //shininess: specularShininess,
        });

        // work on node creation
        const nodegeom = new THREE.SphereGeometry( sphereRadius, 32, 16 );
        // create mesh based on the geometry and the material, aka the visualized object for the node
        let mesh = new THREE.Mesh( nodegeom, material );

        // set the initial position to be rendered in the scene
        mesh.position.x = position.x;
        mesh.position.y = position.y;
        mesh.position.z = position.z;

        //threejs_props.test_sprites[mesh.uuid] = mesh;
        threejs_props.current.test_sprites[mesh.uuid] = mesh;
        threejs_props.current.scene.add(mesh);
        // in case adding a new mesh needs rerendering
        need_rerender();

    };

    /*
     * this function creates and renders into scene any navigable nodes (ie leaf nodes of type 'leafdeckheart') other than the central moon node (ie leaf node of type leafdeckspade)
     */
    const createOrbitingNodes = (loader, nodes) => {
        const bumpScale = 1;
        //let cubeWidth = 400;
        //let numberOfSpheresPerSide = 6;
        //let sphereRadius = ( cubeWidth / numberOfSpheresPerSide / 2 ) * 0.8 * 0.5;

        // work on node creation
        //const nodegeom = new THREE.SphereBufferGeometry( sphereRadius, 32, 16 );
        //const node_shellgeom = new THREE.SphereBufferGeometry( sphereRadius+1, 32, 16 );
        const nodegeom = new THREE.IcosahedronGeometry( sphereRadius, 8 );
        //const node_shellgeom = new THREE.IcosahedronGeometry( sphereRadius+1, 8 );

        //let imgTexture = loader;
        // when using an equirectangular image as texture
        //let imgTexture = assets_manager.get(textureKey.current.equirectangular["equi_lea_logo"]);
        //imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
        //imgTexture.encoding = THREE.sRGBEncoding;
        //imgTexture.anisotropy = 16;
        ////imgTexture = null; // assign null to drop the texture as needed, comment out if assigning a texture
        // when using a sinle logo as texture
        //const imgTexture = assets_manager.get(textureKey.current.images["lea_logo"]);
        const imgTexture = (new THREE.TextureLoader()).load("/assets/test/lea_logo.jpg");
        imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
        imgTexture.encoding = THREE.sRGBEncoding;
        //imgTexture.anisotropy = 16;
        imgTexture.offset.set( 0, 0 );
        imgTexture.repeat.set( 2, 1 );
        //1imgTexture.userData = {
        //1    fitTo : 1
        //1};

        Object.values(nodes).forEach( (node) => {
            // work with HSL color space for node visualization
            let rand_alpha = Math.random(); // 0 <= random val <= 1.0
            let alpha = rand_alpha;
            let specularShininess = Math.pow( 2, rand_alpha * 10 );

            // now set the values for 'beta' and 'gamma' as per graph data or metadata
            // use defaults for now
            let beta = 0.5;
            let gamma = 0.5;

            let specularColor = new THREE.Color( beta * 0.2, beta * 0.2, beta * 0.2 );

            // basic monochromatic energy preservation
            let diffuseColor = new THREE.Color().setHSL( alpha, 0.5, gamma * 0.5 + 0.1 ).multiplyScalar( 1 - beta * 0.2 );

            // each node has a different material in this case
            const toonmaterial = new THREE.MeshToonMaterial( {
            map: imgTexture,
            bumpMap: imgTexture,
            //camera: threejs_props.current.projector_camera,
            //texture: assets_manager.get(textureKey.current),
            //map: assets_manager.get(textureKey.current),
            //bumpScale: bumpScale,
            color: diffuseColor,
            //color: '#3149D5',
            //specular: specularColor,
            //shininess: specularShininess,
            } );

            const material = new THREE.MeshBasicMaterial({map: imgTexture, side: THREE.FrontSide, color: diffuseColor, transparent: true, opacity: 0.9, roughness: 0.05, metalness: 1});
            //const outershell_material = new THREE.MeshStandardMaterial( {
            //    roughness: 0.1,
            //    metalness: 0,
            //    opacity: 0.5,
            //    color: diffuseColor,
            //    transparent: true
            //} );

            // create mesh based on the geometry and the material, aka the visualize object for the node
            const mesh = new THREE.Mesh( nodegeom, material );
            //const outershell_mesh = new THREE.Mesh( node_shellgeom, outershell_material );
            //const orbital_node_grp = new THREE.Object3D();
            //orbital_node_grp.add(mesh);
            //orbital_node_grp.add(outershell_mesh);
            const orbital_node_grp = mesh;

            // set the initial position to be rendered in the scene
            orbital_node_grp.position.x = Math.random() * 400 - 200;
            orbital_node_grp.position.y = Math.random() * 400 - 200;
            orbital_node_grp.position.z = Math.random() * 400 - 200;

            //console.log('######################### mesh position:', JSON.stringify(mesh.position));
            // randomly set any visual effects (aka shaders) for post-processing, for fun for now
            // interesting shaders are good for demo but are too slow in reality, at least for now
            if ( Math.random() < 0.25 ) orbital_node_grp.layers.enable( BLOOM_SCENE );

            node['mesh_uuid'] = orbital_node_grp.uuid; // register the mesh uuid in the lut, enabling node id to mesh lookup
            node['position'] = orbital_node_grp.position; ////// object referencew or a copy?
            node['radius'] = sphereRadius;
            // add node mesh to lut
            graph_props.current.mesh_lut.nodes[node.uuid] = orbital_node_grp; //mesh; // the third point of in-memory reference for mesh /////// determine if this linei s necessaryt
            graph_props.current.mesh_lut.uuidlut[orbital_node_grp.uuid] = orbital_node_grp; //mesh; // the primary point of in-memory reference for mesh
            graph_props.current.mesh_lut.mesh2node[orbital_node_grp.uuid] = node.uuid; // a look-up table to go from mesh uuid (3D screen reference) to node uuid (backend db reference)
            // add node mesh to the 'nodes' group for easy management
            threejs_props.current.mesh_groups.nodes.add( orbital_node_grp ); // the second point of in-memory reference for mesh
            // text label to follow each node mesh
            //let meshtext = this.createTextLabel();
            let meshtext = createTextDisplay();
            /////meshtext.setHTML(node['label']);
            meshtext.setParent(orbital_node_grp);
            meshtext.nodeinfo = graph_props.current.node_lut[node.uuid];
            threejs_props.current.jsx_elements.textlabels.push(meshtext);
            threejs_props.current.jsx_elements.textlabel_lut[orbital_node_grp.uuid] = meshtext;
            //this.el_renderer.appendChild(this.el.nativeElement, meshtext.element);

            // it seems the in-memory reference count tottal is three for each node or edge mesh.

            //project(mesh);
            // add node mesh to the scene for rendering
            threejs_props.current.scene.add(orbital_node_grp);
        });
    }

    const updateNodes = (loader, nodes) => {
        const newOrbitingNodes = [];
        // initialize the node bookkeeping data structure
        for( let i in nodes) {
            //let node = graph_data.nodes[i]['data'];
            let node = nodes[i];
            console.log('updating a node: ', node);
            //const node_data = JSON.parse(atob(node.data));
            //console.log('########## updateNodes() covering a gnav node: ', node);
            //if (['leafdeckheart', 'leafdeckdiamond', 'leafdeckclub'].includes(node.type))
            // nodes of type 'leafdeckdiamond' or 'leafdeckclub' shall be processed as pop up radial menu entries, hence omitted here 
            if (['leafdeckheart'].includes(node.type)) 
            {
                // add following properties to the node json
                //node['edge_count'] = (node.uuid in this.graph.node_lut) ? this.graph.node_lut[node.uuid]['edge_count'] : 0; // initialize
                node['mesh_uuid'] = null; // initialize
                node['is_center'] = false;
                graph_props.current.node_lut[node.uuid] = node;
                graph_props.current.nodes.push(node);
                newOrbitingNodes.push(node);
            }
            else if (node.type === 'leafdeckspade') // leafapp system menu
            {

                const moontexture = assets_manager.get(textureKey.current.images['moon']);
                //const meshuuid = createSysAdminSprite(loader, new THREE.Vector3(0,0,0));
                const meshuuid = createSysAdminSprite(moontexture, new THREE.Vector3(0,0,0));
                graph_props.current.node_lut[node.uuid] = node;
                graph_props.current.mesh_lut.mesh2node[meshuuid] = node.uuid;
            }
        }

        if (newOrbitingNodes.length > 0)
            createOrbitingNodes(loader, newOrbitingNodes);

        //if (nodes.length > 0)
        //    need_rerender();

    };

    const updateEdges = (loader, edges) => {
        let bumpScale = 1;
        //let cubeWidth = 400;
        //let numberOfSpheresPerSide = 6;
        //let sphereRadius = ( cubeWidth / numberOfSpheresPerSide / 2 ) * 0.8 * 0.5;
        // get edge_count tallies for all nodes
        console.log('updateEdges() ###################: ', edges);
        for( let i in edges) {
            //let edge = graph_data.edges[i]['data'];
            let edge = edges[i];
            if (edge.source.uuid !== edge.target.uuid) { // dropping edges with the same source and target (or self-loops) seems to be a rationale choice for now
            //(edge.source.uuid in this.graph.node_lut) ? this.graph.node_lut[edge.source.uuid].edge_count++ : (this.graph.node_lut[edge.source.uuid] = {'edge_count': 1});
            //(edge.target.uuid in this.graph.node_lut) ? this.graph.node_lut[edge.target.uuid].edge_count++ : (this.graph.node_lut[edge.target.uuid] = {'edge_count': 1});
            //this.graph.node_lut[edge.target.uuid].edge_count++;

            // make an edge lut key from the source and target IDs
            //let edge_key = JSON.stringify({'source':edge.source.uuid, 'target':edge.target.uuid});
            const edge_key = edge.uuid;
            graph_props.current.edge_lut[edge_key] = edge;
            graph_props.current.edge_keys.push(edge_key);
            }
        }
        // work on edge creation
        Object.values(edges).forEach( (edge) => {
            //let edge = JSON.parse(edge_key); // key is in fact edge info JSON stringified
            //let edge_key = JSON.stringify({'source':edge.source.uuid, 'target':edge.target.uuid});
            const edge_key = edge.uuid; //JSON.stringify({'source':edge.source.uuid, 'target':edge.target.uuid});
            // reconstruction of nodes and edges connections data to suit the need of the Layout handler
            //this.graph.edges.push({"source":this.graph.node_lut[edge.source.uuid], "target": this.graph.node_lut[edge.target.uuid]});
            //graph_props.current.edges.push({"source":edge.source, "target": edge.target});
            graph_props.current.edges.push(edge);

            // create spline curves
            let node_lut = graph_props.current.node_lut;
            let mesh_uuidlut = graph_props.current.mesh_lut.uuidlut;
            let segment_positions = graph_props.current.nodes.filter(
            function(node) {
                if ( [edge.source.uuid, edge.target.uuid].includes(node.uuid) )
                {
                return node_lut[node.uuid];
                }
                else
                {
                return null;
                }
            }
            ).map( (node) => {if(node) {return (mesh_uuidlut[ node_lut[ node.uuid ].mesh_uuid ].position)}});

            console.log('seg pos');
            console.log(segment_positions);
            // having zero segment positions for edges happens when nodes load later than edges, so just assign arbitrary vector points at origins
            if (segment_positions.length === 0) {
            segment_positions = [new THREE.Vector3(), new THREE.Vector3()];
            }
            if (segment_positions.length === 2)
            {
            let line_geometry = new THREE.BufferGeometry().setFromPoints(segment_positions);
            //line_geometry.vertices.push(segment_positions[0]);
            //line_geometry.vertices.push(segment_positions[1]);

            //let curve = new THREE.CatmullRomCurve3( segment_positions );
            //curve.curveTytpe = 'catmullrom'; // choices include centripetal, chordal, or catmullrom
            //curve.mesh = new THREE.Line( line_geometry, new THREE.LineBasicMaterial( {color:0xfff000, opacity:0.05} ));
            let line = new THREE.Line( line_geometry, new THREE.LineBasicMaterial( {color:0xfff000, opacity:0.05} ));
            // add edge mesh to the 'edges' group for easy management
            threejs_props.current.mesh_groups.edges.add( line ); // the second point of in-memory reference for mesh
            // add curve mesh to the scene and save the geometry in the list
            //threejs_props.scene.add(curve.mesh);
            //curve.mesh.frustumCulled = false;

            // add edge mesh to lut
            // I think line mesh should be used here and elsewhere directly
            //this.graph.mesh_lut['edges'][edge_key] = line; // the third point of in-memory reference for mesh
            //this.graph.mesh_lut['uuidlut'][line.uuid] = line; // the primary point of in-memory reference for mesh
            graph_props.current.mesh_lut.edges[edge_key] = line; // the third point of in-memory reference for mesh
            graph_props.current.mesh_lut.uuidlut[line.uuid] = line; // the primary point of in-memory reference for mesh

            // add line to the scene for rendering
            threejs_props.current.scene.add(line);
            }
        });
    };


    // spark_dev_note: createGraph() currently NOT used, as the component relies on updateNodes() for creating new nodes in a graph
    // consider removing entirely or find some other use
    const createGraph = (loader, _graph_data) => {
        console.log('entered createGraph');
    
        let bumpScale = 1;
        //let cubeWidth = 400;
        //let numberOfSpheresPerSide = 6;
        //let sphereRadius = ( cubeWidth / numberOfSpheresPerSide / 2 ) * 0.8 * 0.5;
        let stepSize = 1.0 / numberOfSpheresPerSide;
    
        //preprocessGraphData(_graph_data);
    
        // work on node creation
        const nodegeom = new THREE.SphereGeometry( sphereRadius, 32, 16 );
    
        let imgTexture = loader;
        imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
        imgTexture.encoding = THREE.sRGBEncoding;
        imgTexture.anisotropy = 16;
        imgTexture = null; // assign null to drop the texture as needed, comment out if assigning a texture
    
        console.log('#######>>>>>>>>>>>>>>>: ', graph_props.current.node_lut);
        Object.values(graph_props.current.node_lut).forEach( (node) => {
          // work with HSL color space for node visualization
          const rand_alpha = Math.random(); // 0 <= random val <= 1.0
          const alpha = rand_alpha;
          const specularShininess = Math.pow( 2, rand_alpha * 10 );
    
          // now set the values for 'beta' and 'gamma' as per graph data or metadata
          // use defaults for now
          const beta = 0.5;
          const gamma = 0.5;
    
          const specularColor = new THREE.Color( beta * 0.2, beta * 0.2, beta * 0.2 );
    
          // basic monochromatic energy preservation
          const diffuseColor = new THREE.Color().setHSL( alpha, 0.5, gamma * 0.5 + 0.1 ).multiplyScalar( 1 - beta * 0.2 );
    
          // each node has a different material in this case
          const material = new THREE.MeshToonMaterial( {
            map: imgTexture,
            bumpMap: imgTexture,
            bumpScale: bumpScale,
            color: diffuseColor,
            //specular: specularColor,
            //shininess: specularShininess,
          } );
    
          // create mesh based on the geometry and the material, aka the visualize object for the node
          let mesh = new THREE.Mesh( nodegeom, material );
    
          // set the initial position to be rendered in the scene
          mesh.position.x = Math.random() * 400 - 200;
          mesh.position.y = Math.random() * 400 - 200;
          mesh.position.z = Math.random() * 400 - 200;
    
          // randomly set any visual effects (aka shaders) for post-processing, for fun for now
          // interesting shaders are good for demo but are too slow in reality, at least for now
          if ( Math.random() < 0.25 ) mesh.layers.enable( BLOOM_SCENE );
    
          node['mesh_uuid'] = mesh.uuid; // register the mesh uuid in the lut, enabling node id to mesh lookup
          node['position'] = mesh.position; ////// object referencew or a copy?
          node['radius'] = sphereRadius;
          // add node mesh to lut
          //this.graph.mesh_lut['nodes'][node['id']] = mesh; // the third point of in-memory reference for mesh /////// determine if this linei s necessaryt
          graph_props.current.mesh_lut.nodes[node.uuid] = mesh; // the third point of in-memory reference for mesh /////// determine if this linei s necessaryt
          graph_props.current.mesh_lut.uuidlut[mesh.uuid] = mesh; // the primary point of in-memory reference for mesh
          // add node mesh to the 'nodes' group for easy management
          threejs_props.current.mesh_groups.nodes.add( mesh ); // the second point of in-memory reference for mesh
          // text label to follow each node mesh
          //let meshtext = this.createTextLabel();
          let meshtext = createTextDisplay();
          /////meshtext.setHTML(node['label']);
          meshtext.setParent(mesh);
          meshtext.nodeinfo = graph_props.current.node_lut[node.uuid];
          threejs_props.current.jsx_elements.textlabels.push(meshtext);
          threejs_props.current.jsx_elements.textlabel_lut[mesh.uuid] = meshtext;
          //this.el_renderer.appendChild(this.el.nativeElement, meshtext.element);
    
          // it seems the in-memory reference count tottal is three for each node or edge mesh.
        });
        // create label react components as per the textlabels just created
        ////this.graphlabel_el = React.createElement(GraphLabelComponent, {'textlabels': this.textlabels }, null);
        ////ReactDOM.render(this.graphlabel_el, document.getElementById('graphlabels'));
        //reduxDispatch({ type: 'leat3dnav/updateGraphLabels', payload: {"graphlabel_lut": this.textlabel_lut}}); // store the date in Redux store
        //if (this.textlabel_lut)
        //props.updateGraphLabels(threejs_props.current.jsx_elements.textlabel_lut);
        //this.createGraphLabels();
    
        // work on edge creation
        graph_props.current.edge_keys.forEach( (edge_key) => {
          console.log('############ edge_key: ', edge_key);
          //const edge = JSON.parse(edge_key); // key is in fact edge info JSON stringified
          const edge = graph_props.current.edge_lut[edge_key];
          // reconstruction of nodes and edges connections data to suit the need of the Layout handler
          //this.graph.edges.push({"source":this.graph.node_lut[edge.source.uuid], "target": this.graph.node_lut[edge.target.uuid]});
          graph_props.current.edges.push({"source":edge.source, "target": edge.target});
    
          // create spline curves
          let node_lut = graph_props.current.node_lut;
          let mesh_uuidlut = graph_props.current.mesh_lut.uuidlut;
          let segment_positions = graph_props.current.nodes.filter(
            function(node) {
              if ( [edge.source.uuid, edge.target.uuid].includes(node.uuid) )
              {
                return node_lut[node.uuid];
              }
              else
              {
                return null;
              }
            }
          ).map( (node) => (mesh_uuidlut[ node_lut[ node.uuid ].mesh_uuid ].position));
    
          console.log('seg pos');
          console.log(segment_positions);
          if (segment_positions.length === 2)
          {
            const line_geometry = new THREE.BufferGeometry().setFromPoints(segment_positions);
            //line_geometry.vertices.push(segment_positions[0]);
            //line_geometry.vertices.push(segment_positions[1]);
    
            //let curve = new THREE.CatmullRomCurve3( segment_positions );
            //curve.curveTytpe = 'catmullrom'; // choices include centripetal, chordal, or catmullrom
            //curve.mesh = new THREE.Line( line_geometry, new THREE.LineBasicMaterial( {color:0xfff000, opacity:0.05} ));
            const line = new THREE.Line( line_geometry, new THREE.LineBasicMaterial( {color:0xfff000, opacity:0.05} ));
            // add edge mesh to the 'edges' group for easy management
            threejs_props.current.mesh_groups.edges.add( line ); // the second point of in-memory reference for mesh
            // add curve mesh to the scene and save the geometry in the list
            //threejs_props.scene.add(curve.mesh);
            //curve.mesh.frustumCulled = false;
    
            // add edge mesh to lut
            // I think line mesh should be used here and elsewhere directly
            graph_props.current.mesh_lut.edges[edge_key] = line; // the third point of in-memory reference for mesh
            graph_props.current.mesh_lut.uuidlut[line.uuid] = line; // the primary point of in-memory reference for mesh
          }
    
        });
    
        threejs_props.current.scene.add(threejs_props.current.mesh_groups.nodes);
        threejs_props.current.scene.add(threejs_props.current.mesh_groups.edges);
        console.log('mesh groups added to the scene');
    
        // initialize graph_props
        graph_props.current.layout_options.width = graph_props.current.layout_options.width || 500;
        graph_props.current.layout_options.height = graph_props.current.layout_options.height || 500;
        graph_props.current.layout_options.iterations = graph_props.current.layout_options.iterations || 100000;
        graph_props.current.layout_options.attraction = graph_props.current.layout_options.attraction || 0.01;
        graph_props.current.layout_options.repulsion = graph_props.current.layout_options.repulsion || 1.7;
        graph_props.current.layout_options.layout = graph_props.current.layout_options.layout || '3d';
        const graph_layout = new ForceDirectedLayout(graph_props.current, graph_props.current.layout_options);
        graph_layout.init();
        graph_props.current.layout = graph_layout;
    };
    
    /**
     * Create a graph with random nodes and edges.
     * Number of nodes and edges can be set with numNodes and numEdges
     * adopted from https://github.com/davidpiegza/Graph-Visualization/blob/master/examples/simple_graph/simple_graph.js$
     */
    const createRandGraph = (loader) => {
        let id_idx = 0;
        let bumpScale = 1;
        //let cubeWidth = 400;
        //let numberOfSpheresPerSide = 6;
        //const sphereRadius = ( cubeWidth / numberOfSpheresPerSide / 2 ) * 0.8 * 0.5;
        let stepSize = 1.0 / numberOfSpheresPerSide;
    
        console.log("createRandGraph(): ", sphereRadius);
    
        let imgTexture = loader;
        imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
        imgTexture.encoding = THREE.sRGBEncoding;
        imgTexture.anisotropy = 16;
        imgTexture = null; // null to drop the texture, comment out if imgTexture is needed
    
        // initialize
        this.graph['nodes'] = [];
        this.graph['edges'] = [];
        this.graph['mesh_lut'] = {'nodes':{}, 'edges':{}, 'uuidlut':{}};
        this.graph['node_lut'] = {};
        this.graph['edge_lut'] = {};
        this.graph['sim_options'] = {};
    
        const nodegeom = new THREE.SphereGeometry( sphereRadius, 32, 16 );
    
        // work on nodes
        for ( var alpha = 0, alphaIndex = 0; alpha <= 1.0; alpha += stepSize, alphaIndex ++ ) {
          var specularShininess = Math.pow( 2, alpha * 10 );
          for ( var beta = 0; beta <= 1.0; beta += stepSize ) {
            var specularColor = new THREE.Color( beta * 0.2, beta * 0.2, beta * 0.2 );
            for ( var gamma = 0; gamma <= 1.0; gamma += stepSize ) {
              // basic monochromatic energy preservation
              var diffuseColor = new THREE.Color().setHSL( alpha, 0.5, gamma * 0.5 + 0.1 ).multiplyScalar( 1 - beta * 0.2 );
              var material = new THREE.MeshToonMaterial( {
                map: imgTexture,
                bumpMap: imgTexture,
                bumpScale: bumpScale,
                color: diffuseColor,
                //specular: specularColor,
                //shininess: specularShininess,
              } );
    
              var mesh = new THREE.Mesh( nodegeom, material );
              mesh.position.x = Math.random() * 600 - 200;
              mesh.position.y = Math.random() * 600 - 200;
              mesh.position.z = Math.random() * 600 - 200;
    
              if ( Math.random() < 0.25 ) mesh.layers.enable( BLOOM_SCENE );
    
              //let node = {"id": id_idx.toString(), "edge_count": 0, "data": {"title": "This is node "+id_idx.toString()}};
              let node = {"id": id_idx.toString(), "data": {"title": "This is node "+id_idx.toString()}};
              node['mesh_uuid'] = mesh.uuid;
              node['position'] = mesh.position;
              node['radius'] = sphereRadius;
    
              // add node mesh to lut
              this.graph.mesh_lut['nodes'][id_idx.toString()] = mesh;
              this.graph.mesh_lut['uuidlut'][mesh.uuid] = mesh;
    
              threejs_props.current.mesh_groups.nodes.add(mesh);
    
              let meshtext = this.createTextLabel();
              /////meshtext.setHTML(node['label']);
              meshtext.setParent(mesh);
              threejs_props.current.jsx_elements.textlabels.push(meshtext);
              threejs_props.current.jsx_elements.textlabel_lut[mesh.uuid] = meshtext;
              //this.el_renderer.appendChild(this.el.nativeElement, meshtext.element);
    
              // add node to node lut and nodes list
              this.graph.node_lut[id_idx.toString()] = node;
              this.graph.nodes.push(node);
    
              id_idx++;
    
            }
          }
        }
    
        // work on edges
        for (let cur_idx = 0; cur_idx < id_idx; cur_idx++)
        {
          if (Math.random() < 0.3)
            continue;
          let rand_target_id = Math.floor(Math.random() * id_idx); // possible to have self target?
          this.graph.edges.push({"source":this.graph.node_lut[cur_idx.toString()], "target": this.graph.node_lut[rand_target_id.toString()]});
    
          // create spline curves
          let node_lut = this.graph.node_lut;
          let mesh_uuidlut = this.graph.mesh_lut.uuidlut;
          let segment_positions = this.graph.nodes.filter(
            function(node) {
              if( [cur_idx.toString(), rand_target_id.toString()].includes(node.uuid) )
              {
                return node_lut[node.uuid];
              }
              else
              {
                return null;
              }
            }
          ).map((node) => (mesh_uuidlut[ node_lut[ node.uuid ].mesh_uuid ].position));
    
          if (segment_positions.length === 2)
          {
            let line_geometry = new THREE.BufferGeometry();
            line_geometry.vertices.push(segment_positions[0]);
            line_geometry.vertices.push(segment_positions[1]);
    
            let curve = new THREE.CatmullRomCurve3( segment_positions );
            curve.curveType = 'catmullrom'; // choices include centripetal, chordal, or catmullrom
            curve.mesh = new THREE.Line( line_geometry, new THREE.LineBasicMaterial( { color: 0xfff000, opacity: 0.05 } ));
            curve.mesh.catShadow = true;
            // add curve mesh to the scene and save the geometry in the list
            //threejs_props.scene.add((curve as any).mesh);
            threejs_props.current.mesh_groups.edges.add( curve.mesh );
    
            curve.mesh.frustumCulled = false;
    
            // add edge mesh to lut
            // make an edge lut key from the source and target IDs
            let edge_key = JSON.stringify({'source':cur_idx.toString(),'target':rand_target_id.toString()});
            this.graph.mesh_lut['edges'][edge_key] = curve;
            this.graph.mesh_lut['uuidlut'][curve.mesh.uuid] = curve;
          }
        }
    
        threejs_props.current.scene.add(threejs_props.current.mesh_groups.nodes);
        threejs_props.current.scene.add(threejs_props.current.mesh_groups.edges);
    
        // initialize graph_props
        graph_props.current.layout_options.width = graph_props.current.layout_options.width || 500;
        graph_props.current.layout_options.height = graph_props.current.layout_options.height || 500;
        graph_props.current.layout_options.iterations = graph_props.current.layout_options.iterations || 100000;
        graph_props.current.layout_options.attraction = graph_props.current.layout_options.attraction || 0.01;
        graph_props.current.layout_options.repulsion = graph_props.current.layout_options.repulsion || 1.7;
        graph_props.current.layout_options.layout = graph_props.current.layout_options.layout || '3d';
        const graph_layout = new ForceDirectedLayout(graph_props.current, graph_props.current.layout_options);
        graph_layout.init();
        graph_props.current.layout = graph_layout;
    
    };
    
    const createTextDisplay = () => {
        //let div_el = this.el_renderer.createElement('div');
        //let div_el = React.createElement('div', {'className': 'text-label', 'style': {'position': 'absolute', 'width':'200px', 'height':'100px', 'top':-1000, 'left':-1000}}, 'hello world!');
        //let div_el = this.el_renderer.createElement('div', {'className': 'text-label', 'style': {'position': 'absolute', 'width':'200px', 'height':'100px', 'top':-1000, 'left':-1000}}, 'hello world!');
        //const labelContainerElem = document.querySelector('#graphlabels');
        //let elem = document.createElement('div');
        /*
        const DisplayComponent = React.forwardRef(function DisplayComponent(props, ref) {
          //  Spread the props to the underlying DOM element.
          return <Button {...props} ref={ref}></Button>
        });
        */
        //function VerticeInfo(props) {
    
        //  return React.createElement('Button', {'hidden': props.hidden}, `Hello world`);
          
        //}
        //customElements.define('labelcomponent', LabelComponent);
        //customElements.define('button', Button);
        //let tooltip_button = React.createElement(VerticeInfo, {hidden: true}, "help");
        //let elem = React.createElement('Tooltip', {"title": "yeah"}, [tooltip_button]); //document.createElement('Tooltip');
        //elem.setAttribute("title", "Yeah");
        //elem.title = "Yeah";
        //let tooltip_button = document.createElement('Button');
        //tooltip_button.setAttribute('textContent', "help");
        //tooltip_button.textContent = "help";
        //elem.appendChild(tooltip_button);
    
        /*
        elem.textContent = 'hello world';
        elem.style.color = "white";
        elem.style.zIndex = "1";
        elem.className = "text-label";
        */
        //labelContainerElem.appendChild(elem);
        //let graphlabel_el = React.createElement(GraphLabelComponent, {'textlabels': this.textlabels }, null);
        //ReactDOM.render(graphlabel_el, document.getElementById('graphlabels'));
    
        let that = this;
        //ReactDOM.render(div_el, document.getElementById('root'));
    
        return {
          //element: div_el,
          //element: elem,
          //element: tooltip_button,
          //tooltip_elem: elem,
          parent: false,
          hidden: true,
          nodeinfo: null,
          position: new THREE.Vector3(0,0,0),
          setHTML: function(html) {
            //if (div_el.element) {
            //div_el.element.innerHTML = html;
            //}
            //div_el.dangerouslySetInnerHTML ={{ __html: html }};
            //return <div className='text-label' style="position: absolute, width:200px, height:100px, top:-1000, left:-1000"> hello world </div>;
          },
          getLabelCoords: function() {
            return this.get2DCoords(this.position, that.camera);
          },
          genHTML: function() {
            //if (div_el.element) {
            //div_el.element.innerHTML = html;
            //}
            //div_el.dangerouslySetInnerHTML ={{ __html: html }};
            //return <div className='text-label' style="position: absolute; width:200px; height:100px; top:-1000; left:-1000"> hello world </div>;
            //return <div className='text-label' style={{fontSize:"11px", color:"red", background: "#0f0"}}><p> hello world </p></div>;
            if (!this.hidden)
            {
    
              //const props = {"data":{"btn1text": "hi five"}, "leafuidef":null, "nextuiref":null, "serverref":null};
              //const prompt2ref = () => { return React.createElement(LEAFUIPrompt,{"data":{"btn1text": "hi five"}, "leafuidef":null, "nextuiref":null, "serverref":null}) };
    
              //const prompt2 = React.createElement(LEAFUIPrompt,{"data":{"btn1text": "hi five"}, "leafuidef":null, "nextuiref":null, "serverref":null});
              //const prompt1 = React.createElement(LEAFUIPrompt, {"data":{"btn1text": "hello 1"}, "leafuidef":null, "nextuiref":prompt2, "serverref":null});
              //const uiset = LEAFUISet()
              let coords2d = this.get2DCoords(this.position, that.camera);
              //return <div><Tooltip style={{fontSize:"11px", color:"red", background: "#0f0", transform: `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`}} title={`${this.nodeinfo.name}`}><Button> help </Button></Tooltip></div>;
              return (
                <div id="leafui" style={{fontSize:"11px", color: "white", backgroundColor: "#999", transform: `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`}}>
                  <LEAFUISet></LEAFUISet>
                </div>
              );
            }
            else {
              return <div></div>;
            }
          },
          setParent: function(threejsobj) {
            this.parent = threejsobj;
            //this.element.textContent = this.parent.uuid;
            //this.tooltip_elem.title = this.parent.uuid;
            //this.tooltip_elem.state.title = this.parent.uuid;
          },
          updatePosition: function() {
            if(this.parent) {
              this.parent.updateWorldMatrix(true, false);
              this.parent.getWorldPosition(this.position);
              //this.position.setFromMatrixPosition(this.parent.matrixWorld);
            }
    
            /*
            if (that.camera.position.distanceTo(this.position) < 250) {
              //let coords2d = this.get2DCoords(this.position, that.camera);
              //that.el_renderer.setProperty(this.element.style, 'left', coords2d.x + 'px');
              //that.el_renderer.setProperty(this.element.style, 'top', coords2d.y + 'px');
              //that.canvas.style.left = coords2d.x+"px";
              //that.canvas.style.top = coords2d.y+"px";
              //if (div_el.props) {
              //  div_el.props.style.hidden = false;
              //}
              //this.element.style = `left=${coords2d.x}px;top=${coords2d.y}px`;
              //this.element.style.transform = `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.style.transform = `translate(300px,-200px)`;
              //this.element.style.transform = `translate(0px,0px)`;
              //this.element.style.left = `100px`;
              //this.element.style.top = `100px`;
              //this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              ////this.element.props.hidden = false;
              this.hidden = false;
            }
            else {
              //if (div_el.props) {
              //  div_el.props.style.hidden = true;
              //}
              //this.element.hidden = true;
              //let coords2d = this.get2DCoords(this.position, that.camera);
              //this.element.style.transform = `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.state.hidden = true;
              ////this.element.props.hidden = true;
              this.hidden = true;
            }
            */
          },
          get2DCoords: function(position, camera) {
            let canvrect = that.renderer.domElement.getBoundingClientRect();
            //camera.updateMatrixWorld();
            let vector = position.project(camera);
            //vector.x = (vector.x + 1)/2 * (canvrect.right - canvrect.left);
            //vector.y = -(vector.y - 1)/2 * (canvrect.bottom - canvrect.top);
            vector.x = (vector.x * 0.5 + 0.3) * canvrect.width; //(canvrect.right - canvrect.left);
            vector.y = (vector.y * -0.5 + 0.3) * canvrect.height - canvrect.height; //(canvrect.bottom - canvrect.top);
            return vector;
          }
        };
    };
    
    const createTextLabel = () => {
        //let div_el = this.el_renderer.createElement('div');
        //let div_el = React.createElement('div', {'className': 'text-label', 'style': {'position': 'absolute', 'width':'200px', 'height':'100px', 'top':-1000, 'left':-1000}}, 'hello world!');
        //let div_el = this.el_renderer.createElement('div', {'className': 'text-label', 'style': {'position': 'absolute', 'width':'200px', 'height':'100px', 'top':-1000, 'left':-1000}}, 'hello world!');
        //const labelContainerElem = document.querySelector('#graphlabels');
        //let elem = document.createElement('div');
        //const LabelComponent = React.forwardRef(function LabelComponent(props, ref) {
          //  Spread the props to the underlying DOM element.
        //  return <Tooltip {...props} ref={ref} Expand></Tooltip>
        //});
        //customElements.define('labelcomponent', LabelComponent);
        //customElements.define('button', Button);
        //let elem = document.createElement('Tooltip'); //document.createElement('Tooltip');
        //elem.setAttribute("title", "Yeah");
        //elem.title = "Yeah";
        //let tooltip_button = document.createElement('Button');
        //tooltip_button.textContent = "help";
        //elem.appendChild(tooltip_button);
    
        /*
        elem.textContent = 'hello world';
        elem.style.color = "white";
        elem.style.zIndex = "1";
        elem.className = "text-label";
        */
        //labelContainerElem.appendChild(elem);
    
        let that = this;
        //ReactDOM.render(div_el, document.getElementById('root'));
    
        return {
          //element: div_el,
          //element: elem,
          //element: tooltip_button,
          //tooltip_elem: elem,
          parent: false,
          hidden: true,
          position: new THREE.Vector3(0,0,0),
          setHTML: function(html) {
            //if (div_el.element) {
            //div_el.element.innerHTML = html;
            //}
            //div_el.dangerouslySetInnerHTML ={{ __html: html }};
            //return <div className='text-label' style="position: absolute, width:200px, height:100px, top:-1000, left:-1000"> hello world </div>;
          },
          genHTML: function() {
            //if (div_el.element) {
            //div_el.element.innerHTML = html;
            //}
            //div_el.dangerouslySetInnerHTML ={{ __html: html }};
            //return <div className='text-label' style="position: absolute; width:200px; height:100px; top:-1000; left:-1000"> hello world </div>;
            if (!this.hidden)
            {
              return <Tooltip className='text-label' style={{fontSize:"11px", color:"red", background: "#0f0"}}><Button> hello world </Button></Tooltip>;
            }
            else {
              return null;
            }
          },
          setParent: function(threejsobj) {
            this.parent = threejsobj;
            //this.element.textContent = this.parent.uuid;
            //this.tooltip_elem.title = this.parent.uuid;
          },
          updatePosition: function() {
            if(this.parent) {
              this.parent.updateWorldMatrix(true, false);
              this.parent.getWorldPosition(this.position);
              //this.position.setFromMatrixPosition(this.parent.matrixWorld);
            }
    
            /*
            if (that.camera.position.distanceTo(this.position) < 250) {
              let coords2d = this.get2DCoords(this.position, that.camera);
              //that.el_renderer.setProperty(this.element.style, 'left', coords2d.x + 'px');
              //that.el_renderer.setProperty(this.element.style, 'top', coords2d.y + 'px');
              //that.canvas.style.left = coords2d.x+"px";
              //that.canvas.style.top = coords2d.y+"px";
              //if (div_el.props) {
              //  div_el.props.style.hidden = false;
              //}
              //this.element.style = `left=${coords2d.x}px;top=${coords2d.y}px`;
              //this.element.style.transform = `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`;
              this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.style.transform = `translate(300px,-200px)`;
              //this.element.style.transform = `translate(0px,0px)`;
              //this.element.style.left = `100px`;
              //this.element.style.top = `100px`;
              //this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              this.element.hidden = false;
              //this.hidden = false;
            }
            else {
              //if (div_el.props) {
              //  div_el.props.style.hidden = true;
              //}
              //this.element.hidden = true;
              //let coords2d = this.get2DCoords(this.position, that.camera);
              //this.element.style.transform = `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`;
              //this.element.style.transform = `translate(${coords2d.x}px,${coords2d.y}px)`;
              this.element.hidden = true;
              //this.hidden = true;
            }
            */
          },
          get2DCoords: function(position, camera) {
            let canvrect = that.renderer.domElement.getBoundingClientRect();
            //camera.updateMatrixWorld();
            let vector = position.project(camera);
            //vector.x = (vector.x + 1)/2 * (canvrect.right - canvrect.left);
            //vector.y = -(vector.y - 1)/2 * (canvrect.bottom - canvrect.top);
            vector.x = (vector.x * 0.5 + 0.3) * canvrect.width; //(canvrect.right - canvrect.left);
            vector.y = (vector.y * -0.5 + 0.3) * canvrect.height - canvrect.height; //(canvrect.bottom - canvrect.top);
            return vector;
          }
        };
    };
    
    const createLight = (_props) => {
        // add a particle light
        //this.particle_light = new THREE.Mesh(
        //  new THREE.SphereBufferGeometry(4, 8, 8),
        //  new THREE.MeshBasicMaterial( { color: 0xffffff } )
        //);
        //threejs_props.scene.add(this.particle_light);
    
        // add an ambient light
        threejs_props.current.scene.add( new THREE.AmbientLight( 0xffffff ) );
        //threejs_props.scene.add( new THREE.AmbientLight( 0x991111 ) );
    
        let directional_light = new THREE.DirectionalLight( 0xffffff, 1 );
        directional_light.position.set( 1, 1, 1000 ).normalize();
        //directional_light.target = new THREE.Vector3( 0, 0, 0 );
        threejs_props.current.scene.add( directional_light );
    
        //let point_light = new THREE.PointLight( 0xffffff, 1, 800 );
        //this.particle_light.add( point_light );
        return _props;
    };
    
    const createCamera = (_props) => {
        let aspectRatio = getAspectRatio(_props);
        const camera = new THREE.PerspectiveCamera(
          _props.camera_settings.fieldOfView,
          aspectRatio,
          _props.camera_settings.nearClippingPane,
          _props.camera_settings.farClippingPane
        );

        // Set position and look at
        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 2000;
        //camera.position.z = 500;
        _props.cameraTarget = new THREE.Vector3(0,0,-15);
        //camera.lookAt(_props.cameraTarget);

        //setTHREEjsProps((otherprops) => { return {...otherprops, camera: camera}});
        _props.camera = camera;

        return _props;
    };

    const createProjectorCamera = (_props) => {
        const fov = 45;
        const near = 0.01;
        const far = 100;
        const projector_camera = new THREE.PerspectiveCamera(
            fov, 1, near, far
        );

        // Set position and look at
        projector_camera.position.fromArray(_props.orbitcontrols.position0);
        projector_camera.lookAt(new THREE.Vector3().fromArray(_props.orbitcontrols.target))

        _props.projector_camera = projector_camera;

        return _props;
    };
    
    const getAspectRatio = (_props) => {
        //let height = threejs_props.jsx_elements.canvas.nativeElement.offsetHeight;
        let height = _props.jsx_elements.canvas.offsetHeight;
        if (height === 0) {
          return 0;
        }
        return _props.jsx_elements.canvas.offsetWidth / height;
    };
    
    const fitCanvas = (is_resize, _props) => {
        //const { innerWidth: appwinwidth, innerHeight: appwinheight } = window;
        _props.renderer.setPixelRatio(devicePixelRatio);
        // size to fit the canvas to window
        //_props.jsx_elements.canvas.style.width = appwinwidth;
        //_props.jsx_elements.canvas.style.height = appwinheight;
        console.debug("fitCanvas(): ", appwinwidth, appwinheight);
        _props.jsx_elements.appwinwidth = appwinwidth;
        _props.jsx_elements.appwinheight = appwinheight;
        _props.jsx_elements.canvas.style.zIndex = "-1";
        //_props.jsx_elements.canvas.width = _props.jsx_elements.canvas.offsetWidth; 
        //_props.jsx_elements.canvas.height = _props.jsx_elements.canvas.offsetHeight; 
        _props.jsx_elements.canvas.width = appwinwidth; 
        _props.jsx_elements.canvas.height = appwinheight; 
    
        const canvrect = _props.renderer.domElement.getBoundingClientRect(); // initialize canvrect
        //setTHREEjsProps((otherprops) => {return {...otherprops, jsx_elements: {...otherprops.jsx_elements, canvrect: canvrect}}});
        _props.jsx_elements.canvrect = canvrect;
    
        // size the renderer to fit the new resolution
        if (is_resize)
        {
          _props.renderer.setSize(appwinwidth, appwinheight);
          _props.camera.aspect = getAspectRatio(_props);
          _props.camera.updateProjectionMatrix();
          //if ( this.leaf_userapp || null ) {
          //  this.leaf_userapp.webgl.resize({width : _props.jsx_elements.canvas.offsetWidth, height: _props.jsx_elements.canvas.offsetHeight });
          //}
          //_props.renderer.setSize(appwinheight*_props.camera.aspect, appwinheight);
        }
        else {
          _props.renderer.setSize(appwinwidth, appwinheight);
        }
        //this.renderer.setSize(threejs_props.jsx_elements.canvas.nativeElement.width, threejs_props.jsx_elements.canvas.nativeElement.height);
        //_props.renderer.setSize(_props.jsx_elements.canvas.width, _props.jsx_elements.canvas.height);
        //_props.renderer.setSize(window.innerWidth, window.innerHeight);
    
        // size the FX composers to fit the new resolution
        _props.fx_settings.fx_composers.forEach( (fx) => {
          fx.composer.setSize( _props.jsx_elements.canvas.height*_props.camera.aspect, _props.jsx_elements.canvas.height );
        });
    
        // if curNode selected, calculate and store as state the node's world coord to screen coord
        if (leafapp_props.current.curNode) {
          leafapp_props.current.curNodeScreenPosition = () => {return projectWorldToScreen(leafapp_props.current.curNode.position, _props.camera)};
        }

        return _props;
    };

    const initializeTHREEjsProps = (is_new) => {
        const canvas = document.getElementById("myCanvas"+props.nodeuuid);
        const bgcanvas = document.createElement('canvas'); // canvas for behind the scene image manipulation
        let loadasset_promise = undefined;

        threejs_props.current.jsx_elements.canvas = canvas;
        threejs_props.current.jsx_elements.bgcanvas = bgcanvas;
        // initialize three.js renderer, mesh groups, and some effects
        threejs_props.current.mesh_groups.nodes = new THREE.Group();
        threejs_props.current.mesh_groups.edges = new THREE.Group();
        //setTHREEjsProps((otherprops) => {
        //    let mutatedprops = {...otherprops}; // clone for mutation

        if (is_new) {
            const three_renderer = new THREE.WebGLRenderer({
                canvas: threejs_props.current.jsx_elements.canvas,
                //canvas: this.el.nativeElement,
                antialias: true,
                alpha: true,
            });
            three_renderer.outputEncoding = THREE.sRGBEncoding;
            //this.renderer.gammerOutput = true;
            //this.gammaFactor = 2.2;
            three_renderer.shadowMap.enabled = true;
            three_renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            three_renderer.setClearColor(0xffffff, 0); // transparent
            //three_renderer.setClearColor(0xffffff, 1); // white color
            three_renderer.autoClear = true;
            three_renderer.outputEncoding = THREE.sRGBEncoding;
            threejs_props.current.renderer = three_renderer;

            loadasset_promise = preloadAssets();
        }

        // create the main THREE.js scene
        console.log('creating scene');
        //setScene(new THREE.Scene());
        //threejs_props.scene = new THREE.Scene();
        threejs_props.current.scene = new THREE.Scene();

        const outline_effect = new OutlineEffect( threejs_props.current.renderer, 
        { 
            defaultColor: [0.02, 0.02, 0.02],
            defaultThickness: 0.001,
            defaultAlpha: 0.8,
        } );
        //this.toonpass = new ShaderPass( ToonShader2 );

        // create mesh rendering groups
        //this.mesh_groups['nodes'] = new THREE.Group();
        //this.mesh_groups['edges'] = new THREE.Group();
        console.log('creating bloom shader...');
        createBloomShader( threejs_props.scene, threejs_props.camera );

        let bloomLayer = new THREE.Layers();
        bloomLayer.set( BLOOM_SCENE );

        //mutatedprops.mesh_groups =  {nodes: new THREE.Group(), edges: new THREE.Group()};
        threejs_props.current.fx_settings = {
            ...threejs_props.current.fx_settings, 
            outline_effect: outline_effect,
            bloomLayer: bloomLayer,
            darkMaterial: new THREE.MeshBasicMaterial( { color: "black" } ),
        };

        createCamera(threejs_props.current);
        fitCanvas(false, threejs_props.current);
        createLight(threejs_props.current);
        addControls(threejs_props.current);
        createProjectorCamera(threejs_props.current);

        //    return mutatedprops;
        //});
        return loadasset_promise;
    }
    
    const prepareRendering = (is_new) => {
        console.log('prepareRendering()');
        // init threejs_props
        const assetload_promise = initializeTHREEjsProps(is_new);
    
        // initialize script loader
        setLEAFappScripts(() => {
            return {
                //script_loader_service: new DynamicScriptLoaderService(() => {setUserLEAFappLoaded(true);}),
                script_loader_service: new DynamicScriptLoaderService(() => {console.log("dyn script loaded")}),
            }
        });

        return assetload_promise;
    };
    
    const update = () => {
        if (!is_deleting_graph.current && Object.keys(graph_props.current.layout).length > 0) {
          if (!graph_props.current.layout.finished) {
            graph_props.current.layout.generate();
            //console.log('$$$$$$$$$$$$$$$$$$$$$$$ calling updateSplineOutline()');
            updateSplineOutline();
          }
          pointCamera(threejs_props.current.cameraTarget);
          // update text label positions
          for(let i=0; i<threejs_props.current.jsx_elements.textlabels.length; i++) {
            threejs_props.current.jsx_elements.textlabels[i].updatePosition();
          }
    
          //this.state = this.props.reduxstore.getState();
          //this.refreshGraphLabels();
          //ReactDOM.render(this.graphlabel_el, document.getElementById('graphlabels'));
          //if (this.graphlabel_comp) {
          //  this.graphlabel_comp.forceUpdate();
          //}
    
        }
    };
    
    
    const render2 = () => {
        // for Graph layout
        //let i, length, node;
    
        // for animation
        let timer = Date.now() * 0.00025;
        // particle light bee flying motion
        //this.particle_light.position.x = Math.sin( timer * 7 ) * 300;
        //this.particle_light.position.y = Math.cos( timer * 5 ) * 400;
        //this.particle_light.position.z = Math.cos( timer * 3 ) * 300;
    
        //if (this.camera) {
        //if (threejs_props.current.fx_settings.outline_effect) {
        threejs_props.current.fx_settings.outline_effect.render(threejs_props.current.scene, threejs_props.current.camera);
        //}
    
        //}
    
        /****************** temporarily disabled bloom effects
        // render all post-processing effects
        if(leafapp_props.current.isMounted) {
            for (let k in threejs_props.current.fx_settings.fx_composers)
            {
            let fx = threejs_props.current.fx_settings.fx_composers[k]; // such a quark! i hate this style of programming - spark
            if (fx.name === 'bloomComposer' ) // has a special render func
                renderBloom( fx.composer, true );
            else
                fx.composer.render();
            }
        }
        */
    };
    
    const pointCamera = (coord) => {
        threejs_props.current.orbitcontrols.enabled = false;
        threejs_props.current.orbitcontrols.target.set(coord.x,coord.y,coord.z);
        threejs_props.current.orbitcontrols.enabled = true;
    };
    
    const requestCameraUpdateIfNotRequested = () => {
        if (!camUpdateRequested.current && threejs_props.current.orbitcontrols) {
          camUpdateRequested.current = true; // toggle 
          threejs_props.current.orbitcontrols.update();
          checkIfCameraEnteredCenter();
          updateCameraGazing();
    
          // please use this space to put any code that needs update upon cam moving
          /*
          if (!this.state.bganimrefreshed) {
            // the following block of code will be called every timeout
            this.setState({bganimrefreshed: true});
            let that = this;
            setTimeout(() => {
              if (that.state.bgtagvectors.length > 0) {
                that.setState({bgtaglist: that.findAllBGTags()});
              }
              that.setState({bganimrefreshed: false});
            }, 100);
          }
          */
          //if (leafapp_props.current.bgtagvectors.length > 0) {
          //  leafapp_props.current.bgtaglist = findAllBGTags();
          //}
        }
    };
    
    const setSkyColorTween = () => {
        //let sky_tween = new TWEEN.Tween(this.bgskyprops).to({...this.bgskyprops, color: 0xff0000}, 5000);//.dynamic(true);//.dynamic(true);
        let sky_tween = new TWEEN.Tween(this.bgskyprops.color).to({r: 255, g: 0, b: 0, a: 1.0}, 5000);//.dynamic(true);//.dynamic(true);
        let that = this;
        //sky_tween.onComplete( function() {
            //console.log("cur tween stat: ", that.is_tween_animating);
            //console.log("cur tween obj: ", motion_tween, curposition);
            //that.is_tween_animating = false; // reset flag
            //console.log("cur tween stat: ", that.is_tween_animating);
        //    that.bgskyprops.color = 0x000000; //"#000000";
        //});
        sky_tween.start();
        sky_tween.repeat(1); //Infinity);
    };

    const isCameraReadyToShowMenu = () => {
        if (leafapp_props.current.curNode && 
            leafapp_props.current.curNode.position.distanceTo(threejs_props.current.cameraTarget) <= 2) {
            const distToTarget = leafapp_props.current.curNode.position.distanceTo(threejs_props.current.camera.position);
            if (distToTarget <= 500) // && distToTarget >= 30)
                return true;
            else
                return false;
        }
        else
            return false;
    }
    
    const updateCameraGazing = () => {
        if (threejs_props.current.camera && leafapp_props.current.curNode) {
            //let curNodeUUID = this.state.curNode.uuid;
            // placeholder for experiments
            //let newposition = intersects[0].object.position.clone();
          if (!is_tween_animating.current) {
            let distToTarget = leafapp_props.current.curNode.position.distanceTo(threejs_props.current.camera.position);
            const isMoonNode = Object.keys(threejs_props.current.sysadmin_sprites).includes(leafapp_props.current.curNode.uuid);
            if ( distToTarget > 500 || distToTarget < 50 )
            {
              let dirvector= new THREE.Vector3();
              let moondir = new THREE.Vector3();
              let newposition = leafapp_props.current.curNode.position.clone();
              let cog = graph_props.current.layout.center_of_gravity.clone();
              //console.log("####################### cog:", JSON.stringify({dirvector, newposition, cog}));
              //dirvector.subVectors(newposition, cog).normalize()
              //dirvector.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/9); // rotate 20 degrees around y axis so the center is always visible
              //console.log("dirvector: ", dirvector);
              //console.log("obj dist: ", newposition.distanceTo(cog));
    
              //newposition.add(dirvector.multiplyScalar(200));


              

              //https://math.stackexchange.com/questions/4386389/how-to-rotate-a-vector-through-another-vector-in-the-same-direction
              //dirvector.subVectors(newposition, cog).normalize()
              dirvector.subVectors(threejs_props.current.camera.position, newposition); //.normalize();
              moondir.subVectors(dirvector, cog); //.normalize();

              //const dotpro = dirvector.dot(moondir);
              //const gazetheta = Math.acos(dotpro); // radian angle between moon and the selected node
              //const radmaxdeg = Math.PI/12;
              const dirvecmag = 150; //dirvector.length();
              const radmindeg = Math.PI/12;

              dirvector.normalize();
              moondir.normalize();

              if (!isMoonNode) { // && Math.abs(gazetheta) < radmindeg || Math.abs(gazetheta) > radmaxdeg) 
                //const rotationrad = (gazetheta > 0) ? (radmindeg - gazetheta) : (-1.0*(radmindeg + gazetheta));
                //dirvector.applyAxisAngle(new THREE.Vector3(0,1,0), -rotationrad ); // rotate min 20 degrees around y axis so the center is always visible
                
                dirvector = dirvector.multiplyScalar(-1*dirvecmag * Math.cos(radmindeg)).add( moondir.multiplyScalar(-1*dirvecmag * Math.sin(radmindeg)) );
              }
              console.log("dirvector: ", dirvector);
              console.log("obj dist: ", newposition.distanceTo(cog));
    
              //newposition.add(dirvector.addScalar(1).multiplyScalar(100));
              //if (distToTarget === 0)
              //  dirvector.z = 1;
              //dirvector.multiplyScalar(-110);
              newposition.add(dirvector);



              
              //let scalaroffset = dirvector.multiplyScalar(200);
              //console.log("new cam dist: ", newposition.distanceTo(this.graph.layout.center_of_gravity));
              // get a directional unit vector btw center and the hit obj
              // let tween = new TWEEN.Tween(intersects[0].object.position);
              //let offsetVector = dirvector.multiplyScalar(200);
              //let offset_tween = new TWEEN.Tween(this.camera.position).to({x: "+"+offsetVector.x, y: "+"+offsetVector.y, z: "+"+offsetVector.z}, 1000);//.dynamic(true);//.dynamic(true);
              let motion_tween = new TWEEN.Tween(threejs_props.current.camera.position).to(newposition, 1000);//.dynamic(true);//.dynamic(true);
              //let that = this;
    
              //motion_tween.onUpdate( () => {
              //  let curposition = intersects[0].object.position.clone();
              //  if (curposition.distanceTo(objposition) > 5)
              //  {
                  //newposition = intersects[0].object.position.clone();
                  //objposition = intersects[0].object.position.clone();
                  //dirvector.subVectors(newposition, this.graph.layout.center_of_gravity).normalize()
                  //newposition.add(dirvector.multiplyScalar(200));
              //    let update_tween = new TWEEN.Tween(this.camera.position);
              //    let curposition = intersects[0].object.position.clone();
              //    dirvector= new THREE.Vector3();
              //    dirvector.subVectors(curposition, that.graph.layout.center_of_gravity).normalize()
              //    curposition.add(dirvector.multiplyScalar(200));
              //    lookat_tween.stop();
              //    lookat_tween = new TWEEN.Tween(this.cameraTarget);
              //    update_tween.to({x: curposition.x, y: curposition.y, z: curposition.z}, 1000);
              //    lookat_tween.to({x: curposition.x, y: curposition.y, z: curposition.z}, 1000);
              //    lookat_tween.chain(update_tween);
              //    lookat_tween.start();
              //    //lookat_tween.to({x: curposition.x, y: curposition.y, z: curposition.z}, 1000);
              //  }
              //} );
    
              if (leafapp_props.current.curNode.position.distanceTo(threejs_props.current.camera.position) > 500) {
                let objposition = leafapp_props.current.curNode.position.clone();
                // *** LEA coding style note ***
                // Event cascade ref: offcoursedilemma
                // note that the objposition is scalar-added by 2 to deliberately lead the tween to a slightly off course 
                // to the actual target. 
                // This is done so to have the final positional correction  picked up and done by the subsequent 
                // "else if" block.
                // This perhaps is a bad coding style as it'd be very difficult to grasp the programmer's intention, let alone
                // the forgetfulness of the programmer oneself. Till a better solution emerges, we'll stick to this.
                // #############################
                let lookat_tween = new TWEEN.Tween(threejs_props.current.cameraTarget).to(objposition.addScalar(2), 500); //.dynamic(true);
                lookat_tween.chain(motion_tween);

                lookat_tween.onComplete( function() {
                    console.log("cur tween stat: ", is_tween_animating.current);
                    //console.log("cur tween obj: ", motion_tween, curposition);
                    is_tween_animating.current = false; // reset flag
                    console.log("cur tween stat: ", is_tween_animating.current);
                    if (isCameraReadyToShowMenu()) {
                        //leafapp_props.current.curNodeScreenPosition = () => {return projectWorldToScreen(leafapp_props.current.curNode.position, threejs_props.current.camera)};
                        showSystemMenu(); 
                        //need_rerender(); // force re-render
                    }
                });
              
                is_tween_animating.current = true;
                lookat_tween.start();
              }
              else {
                motion_tween.onComplete( function() {
                    console.log("cur tween stat: ", is_tween_animating.current);
                    //console.log("cur tween obj: ", motion_tween, curposition);
                    is_tween_animating.current = false; // reset flag
                    console.log("cur tween stat: ", is_tween_animating.current);
                    if (isCameraReadyToShowMenu()) {
                        //leafapp_props.current.curNodeScreenPosition = () => {return projectWorldToScreen(leafapp_props.current.curNode.position, threejs_props.current.camera)};
                        showSystemMenu(); 
                        //need_rerender(); // force re-render
                    }
                });
              
                //lookat_tween.chain(motion_tween);
                is_tween_animating.current = true; // reset flag
                motion_tween.start();
              }
            }
            else if (leafapp_props.current.curNode.position.distanceTo(threejs_props.current.cameraTarget) > 2 ) {
              let objposition = leafapp_props.current.curNode.position.clone();
              let lookat_tween = new TWEEN.Tween(threejs_props.current.cameraTarget).to(objposition, 500); //.dynamic(true);
              console.log("obj position: ", objposition);
    
              //let that = this; // this might be totally unnecessary for use in onComplete, needs a check
              lookat_tween.onComplete( function() {
                  console.log("cur tween stat: ", is_tween_animating.current); //, that.state.curNode.position.distanceTo(that.cameraTarget));
                  //console.log("cur tween obj: ", motion_tween, curposition);
                  is_tween_animating.current = false; // reset flag
                  console.log("cur tween stat: ", is_tween_animating.current);
                  // *** LEA coding style note ***
                  // Event cascade ref: radialdilemma
                  // Event cascade ref: offcoursedilemma
                  // The following if {} block sets the coordniate in state and show the radial menu, if a curNode target is selected.
                  // The value of that.state.curNode is set remotely when hammer picks up user interactions.
                  // Perhaps a bad coding practice... Then again, we will settle until a more intuitive coding style comes up.
                  // #############################
                  if (isCameraReadyToShowMenu()) {
                    //leafapp_props.current.curNodeScreenPosition = () => {return projectWorldToScreen(leafapp_props.current.curNode.position, threejs_props.current.camera)};
                    //spark_dev_note: 12nov2022 
                    showSystemMenu(); 
                    //need_rerender(); // force re-render
                  }
              });
              //console.log('tween: ', motion_tween);
              //console.log('anim loop: ', this.is_anim_enabled);
              //motion_tween.to({x: newposition.x, y: newposition.y, z: newposition.z}, 1000);
              //motion_tween.to(newposition, 1000); //lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
              //motion_tween.to(newposition+dirvector.multiplyScalar(200), 1000).dynamic(true); //lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
              //motion_tween.to(newposition, 1000).dynamic(true); //lookat_tween.to({x: objposition.x, y: objposition.y, z: objposition.z}, 1000);
              //lookat_tween.to(newposition, 1000).dynamic(true);
              is_tween_animating.current = true; // set flag
              lookat_tween.start();
            }
            else {
              if (!leafapp_props.current.isSysMenuShown && isCameraReadyToShowMenu()) {
                  //leafapp_props.current.curNodeScreenPosition = () => {return projectWorldToScreen(leafapp_props.current.curNode.position, threejs_props.current.camera)};
                  showSystemMenu(); 
                  //need_rerender();
              }
            }
          }
        }
    };
    
    const checkIfCameraEnteredCenter = () => {
        if (threejs_props.current.camera) {
          //let dist_to_center = this.camera.position.clone().distanceTo(this.controls.target);
    
          if (!is_tween_animating.current && Object.keys(threejs_props.current.sysadmin_sprites).length !== 0 && ( leafapp_props.current.curNode && Object.keys(threejs_props.current.sysadmin_sprites).includes(leafapp_props.current.curNode.uuid))) { 
            //let distToTarget = this.state.curNode.position.distanceTo(this.camera.position);
            let cog = graph_props.current.layout.center_of_gravity.clone();
            //let dist_to_center = this.camera.position.clone().distanceTo(this.controls.target);
            let dist_to_center = threejs_props.current.camera.position.clone().distanceTo(cog);
            if ( dist_to_center < 100 )
            {
              is_tween_animating.current = true; // reset flag
              let dirvector= new THREE.Vector3();
              let newposition = threejs_props.current.orbitcontrols.target.clone();
              //let newposition = cog.clone();
              //let cog = this.graph.layout.center_of_gravity.clone();
              //dirvector.subVectors(newposition, cog).normalize()
              dirvector.subVectors(threejs_props.current.camera.position, newposition).normalize();
              console.log("dirvector: ", dirvector);
              console.log("obj dist: ", newposition.distanceTo(cog));
    
              //newposition.add(dirvector.addScalar(1).multiplyScalar(100));
              if (dist_to_center === 0)
                dirvector.z = 1;
              dirvector.multiplyScalar(110);
              newposition.add(dirvector);
              
              //let scalaroffset = dirvector.multiplyScalar(200);
              //console.log("new cam dist: ", newposition.distanceTo(this.graph.layout.center_of_gravity));
              // get a directional unit vector btw center and the hit obj
              // let tween = new TWEEN.Tween(intersects[0].object.position);
              //let offsetVector = dirvector.multiplyScalar(200);
              //let offset_tween = new TWEEN.Tween(this.camera.position).to({x: "+"+offsetVector.x, y: "+"+offsetVector.y, z: "+"+offsetVector.z}, 1000);//.dynamic(true);//.dynamic(true);
              let motion_tween = new TWEEN.Tween(threejs_props.current.camera.position).to(newposition, 1000);//.dynamic(true);//.dynamic(true);
              //let that = this;
    
              //motion_tween.onUpdate( () => {
              //  let curposition = intersects[0].object.position.clone();
              //  if (curposition.distanceTo(objposition) > 5)
              //  {
                  //newposition = intersects[0].object.position.clone();
                  //objposition = intersects[0].object.position.clone();
                  //dirvector.subVectors(newposition, this.graph.layout.center_of_gravity).normalize()
                  //newposition.add(dirvector.multiplyScalar(200));
              //    let update_tween = new TWEEN.Tween(this.camera.position);
              //    let curposition = intersects[0].object.position.clone();
              //    dirvector= new THREE.Vector3();
              //    dirvector.subVectors(curposition, that.graph.layout.center_of_gravity).normalize()
              //    curposition.add(dirvector.multiplyScalar(200));
              //    lookat_tween.stop();
              //    lookat_tween = new TWEEN.Tween(this.cameraTarget);
              //    update_tween.to({x: curposition.x, y: curposition.y, z: curposition.z}, 1000);
              //    lookat_tween.to({x: curposition.x, y: curposition.y, z: curposition.z}, 1000);
              //    lookat_tween.chain(update_tween);
              //    lookat_tween.start();
              //    //lookat_tween.to({x: curposition.x, y: curposition.y, z: curposition.z}, 1000);
              //  }
              //} );
    
              motion_tween.onComplete( function() {
                  console.log("cur tween stat: ", is_tween_animating.current);
                  //console.log("cur tween obj: ", motion_tween, curposition);
                  is_tween_animating.current = false; // reset flag
                  console.log("cur tween stat: ", is_tween_animating.current);
                  //if (leafapp_props.current.curNode) {
                  //    leafapp_props.current.curNodeScreenPosition = () => {return projectWorldToScreen(leafapp_props.current.curNode.position, threejs_props.current.camera)};
                  //    showSystemMenu(); 
                  //    need_rerender(); // force re-render
                  //}
              });
              
              //lookat_tween.chain(motion_tween);
              motion_tween.start();
            }
          }
    
          //if (dist_to_center < 10 && !this.is_tween_animating) {
          //  this.controls.enabled = false;
            // load runtime scripts
            //if (!this.is_runtimeleaf_loaded) {
            //  this.disableAnimation();
            //  //this.curNodeUUID = this.controls.target;
            //  this.loadRuntimeModules();
            //  this.is_runtimeleaf_loaded = true;
            //}
          //}
          //else
          //{
            //this.is_runtimeleaf_enabled = false;
            //this.disableLEAFjsAnim();
          //}
        }
    };
    
    /*
    // could be used as an entrypoint by a LEAFjs loaded via appendChild of a <script> tag, NOT being used for now
    const startLEAFjs = () => {
        console.log('showing em wug');
        window.LEAFmain.show_em_wug_list.forEach( (a_leaf ) => {
          console.log('befo show_em_wug');
          a_leaf.show_em_wug_run(window.LEAFmain);
          console.log('after show_em_wug');
        });
        //window.LEAFmain.enableLEAFjsAnim();
    };
    
    const enableLEAFjsAnim = () => {
        if (!window.LEAFmain.is_anim_enabled) {
          window.LEAFmain.is_runtimeleaf_enabled = true;
          window.LEAFmain.enterLEAFjsAnimLoop();
        }
    };
    
    const disableLEAFjsAnim = () => {
        window.LEAFmain.is_runtimeleaf_enabled = false;
    };
    */
    
    const addControls = (_props) => {
        console.log('entered addControls()');
        //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        _props.orbitcontrols = new OrbitControls(_props.camera, document.getElementById("myElement"+props.nodeuuid));//this.renderer.domElement);
        //this.controls = new OrbitControls(threejs_props.camera, threejs_props.renderer.domElement);
        _props.orbitcontrols.enabled = true; // default
        _props.orbitcontrols.autoRotateSpeed = 0.1;
        _props.orbitcontrols.rotateSpeed = 2;
        _props.orbitcontrols.zoomSpeed = 1.2;
        _props.orbitcontrols.maxDistance = 2000.0; // works with PerspectiveCamera
        _props.orbitcontrols.minDistance = 100.0; // works with PerspectiveCamera
        _props.orbitcontrols.autoRotate = true;
        _props.orbitcontrols.enableDamping = true;
        _props.orbitcontrols.minPolarAngle = -2*Math.PI;

        return _props;
    };
    
    /* Special FX */
    const initBloomSpheres = () => {
    };
    
    const createBloomShader = ( scene, camera ) => {
        let renderScene = new RenderPass( scene, camera );
        let bloomPass = new UnrealBloomPass( new THREE.Vector2( threejs_props.current.renderer.domElement.width, threejs_props.current.renderer.domElement.height ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = bloom_params.bloomThreshold;
        bloomPass.strength = bloom_params.bloomStrength;
        bloomPass.radius = bloom_params.bloomRadius;
    
        let bloomComposer = new EffectComposer( threejs_props.current.renderer );
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass( renderScene );
        bloomComposer.addPass( bloomPass );
    
        bloomComposer.renderToScreen = false; // true if rendering only the BLOOM_SCENE to screen, false for mixed scene rendering
    
        threejs_props.current.fx_settings.fx_composers.push({'composer': bloomComposer, 'name': 'bloomComposer', 'renderfunc': null, 'funcargs': null});
    
        let finalPass = new ShaderPass(
          new THREE.ShaderMaterial( {
            uniforms: {
              baseTexture: { value: null },
              bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            vertexShader:
              (function() {
                return `varying vec2 vUv; 
                  void main() { 
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                  }`;
              })(),
            fragmentShader:
              (function() {
                 return `
                 uniform sampler2D baseTexture;
                 uniform sampler2D bloomTexture;
                 varying vec2 vUv;
                 vec4 getTexture( sampler2D texelToLinearTexture ) {
                   return mapTexelToLinear( texture2D( texelToLinearTexture , vUv ) );
                 }
                 void main() {
                   gl_FragColor = ( getTexture( baseTexture ) + vec4( 1.0 ) * getTexture( bloomTexture ) );
                 }`;
              })(),
            defines: {}
          } ), "baseTexture"
        );
        finalPass.needsSwap = true;
    
        console.log('finalPass initialized');
    
        let finalComposer = new EffectComposer( threejs_props.current.renderer );
        finalComposer.addPass( renderScene );
        finalComposer.addPass( finalPass );
    
        threejs_props.current.fx_settings.fx_composers.push({'composer':finalComposer, 'name': 'finalComposer', 'renderfunc':null, 'funcargs':null});
    };
    
    //const renderBloom = ( composer, mask = true, that ) => {} //( composer: EffectComposer, mask: boolean = true, that )
    const renderBloom = ( composer, mask = true ) => { //( composer: EffectComposer, mask: boolean = true, that )
        if ( mask === true ) { // bloom and non-bloom together
          threejs_props.current.scene.traverse( darkenNonBloomed( threejs_props.current.fx_settings.bloomLayer, threejs_props.current.fx_settings.materials, threejs_props.current.fx_settings.darkMaterial ) );
          composer.render(); //threejs_props.current.scene, threejs_props.current.camera);
          threejs_props.current.scene.traverse( restoreMaterial(threejs_props.current.fx_settings.materials) );
        } else { // only bloom
          threejs_props.current.camera.layers.set( BLOOM_SCENE );
          composer.render();
          threejs_props.current.camera.layers.set( ENTIRE_SCENE );
        }
    };
    
    const darkenNonBloomed = (arg1, arg2, arg3) => {
        let bloomLayer = arg1;
        let materials = arg2;
        let darkMaterial = arg3;
    
        return (function (obj) {
          if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
            materials[ obj.uuid ] = obj.material;
            obj.material = darkMaterial;
          }
        });
    };
    
    const restoreMaterial = ( arg1 ) => {
        let materials = arg1;
    
        return (function ( obj ) {
          if ( materials[ obj.uuid ] ) {
            obj.material = materials[ obj.uuid ];
            delete materials[ obj.uuid ];
          }
        });
    };
    
    const createDynamicUserLEAFjs = (urls) => {
        //let that = this;
        leafapp_scripts.script_loader_service.setScriptUrlList(urls);
        //this.script_loader_service.load('test', 'applib', 'vendorlib', 'runtimelib').then(data => {}
        leafapp_scripts.script_loader_service.load('test', 'applib', 'runtimelib').then(data => {
          console.log('instantiating LEAF user app: ', data);
          //this.leaf_userapp = new LEAFjs.LEAFjsUserApp(threejs_props.jsx_elements.canvas);
          console.log('document ref to LEAF user app: ', window.LEAFjs.LEAFjsUserApp);
          //this.leaf_userapp = new window.LEAFjs.LEAFjsUserApp(threejs_props.jsx_elements.canvas);
          //this.leaf_userapp.show_em_wug(this); // invoke the leaf userapp access point
    
          // create React component instance from the currently loaded LEAFapp
          //this.setState({curLEAFapp: React.createElement(window.LEAFjs.LEAFjsUserApp, { 'curNodeUUID': leafapp_props.curNodeUUID }, null)});
          setLEAFappScripts((otherprops) => {
              return {
                ...otherprops, 
                curLEAFapp: React.createElement(window.LEAFjs.LEAFjsUserApp, { 'curNodeUUID': leafapp_props.curNodeUUID }, null),
              }
          });

          //this.graphlabel_el = React.createElement(GraphLabelComponent, {...this.props, 'textlabels': this.textlabels }, null);
    
          // render the current LEAFapp to the dom element by id 'curLEAFapp'
          //ReactDOM.render(<div>{this.curLEAFapp}</div>, document.getElementById('curLEAFapp'));
    
          // Script loaded successfully
        });
    };
    
      /*
      createUserLEAFjs(url) {
        let div_el = this.el_renderer.createElement('script');
        this.el_renderer.setProperty(div_el, 'src', url);
        this.el_renderer.setProperty(div_el, 'id', Math.floor(Math.random() * 100));
        this.el_renderer.setProperty(div_el, 'type', 'module');
    
        let that = this;
    
        return {
          element: div_el,
          show_em_wug: function(obj) {
            show_em_wug_run(obj);
          },
          parent: false,
          setHTML: function(html) {
            this.element.innerHTML = html;
          },
          setParent: function(threejsobj) {
            this.parent = threejsobj;
          },
          updatePosition: function() {
            if(parent) {
              this.position.setFromMatrixPosition(this.parent.matrixWorld);
            }
            if (that.camera.position.distanceTo(this.position) < 100) {
              let coords2d = this.get2DCoords(this.position, that.camera);
              that.el_renderer.setProperty(this.element.style, 'top', coords2d.y + 'px');
              this.element.hidden = false;
            }
            else {
              this.element.hidden = true;
            }
          },
          get2DCoords: function(position, camera) {
            let canvrect = that.renderer.domElement.getBoundingClientRect();
            let vector = position.project(camera);
            vector.x = (vector.x + 1)/2 * (canvrect.right - canvrect.left);
            vector.y = -(vector.y - 1)/2 * (canvrect.bottom - canvrect.top);
            return vector;
          }
        };
      }
      */
    
    const createGraphLabels = () => {
        this.graphlabel_el = React.createElement(GraphLabelComponent, {...this.props, textlabels: threejs_props.current.jsx_elements.textlabels }, null);
        this.refreshGraphLabels();
    };
    
      // currently NOT being used
    const refreshGraphLabels = () => {
        ReactDOM.render(<Provider store={this.LEAFUIUserDataStore} >{this.graphlabel_el}</Provider>, document.getElementById('graphlabels'+props.nodeuuid));
    };
    
    const focusNode = (nodeobj) => {
        // *** LEA coding style note ***
        // The following setState() call initiates a cascade of other asynchronous events scattered around,
        // eventually leading to the radial menu shown for the selected curNode. 
        // Event cascade ref: radialdilemma
        // This perhaps is a bad coding style as it'd be very difficult to grasp the programmer's intention, let alone
        // the forgetfulness of the programmer oneself. Till a better solution emerges, we'll stick to this.
        // #############################
        leafapp_props.current.curNode = nodeobj;
    };
    
    const projectWorldToScreen = (position, camera) => {
        //let canvrect = this.renderer.domElement.getBoundingClientRect();
        //camera.updateMatrixWorld();
        let vector = position.clone().project(camera);
        //vector.x = (vector.x + 1)/2 * (canvrect.right - canvrect.left);
        //vector.y = -(vector.y - 1)/2 * (canvrect.bottom - canvrect.top);
        vector.x = (vector.x * 0.5 + 0.5) * threejs_props.current.jsx_elements.canvrect.width; //(canvrect.right - canvrect.left);
        vector.y = (vector.y * -0.5 + 0.5) * threejs_props.current.jsx_elements.canvrect.height; // - canvrect.height; //(canvrect.bottom - canvrect.top);
        return vector;
    };
    
    const unfocusNode = () => {
        // *** LEA coding style note ***
        // Event cascade ref: radialdilemma
        leafapp_props.current.curNode = null;
    };
    
    const drawTestLine = (rayvectors) => {
        const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        const points = [];
        let p0 = rayvectors.origin.clone();
        //let p0 = new THREE.Vector3(0,0,0);
        //let p1 = p0.clone().add(rayvectors.direction.clone().normalize().multiplyScalar(100));
        let p1 = p0.clone().add(rayvectors.direction.clone().normalize());
        points.push( p0 );
        points.push( p1 );
    
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        const line = new THREE.Line( geometry, material );
        threejs_props.current.scene.add(line);
        //this.createTestNode(this.nodeloader, p1);
    };
    
    //const calculateLineSphereIntersection = (rayvectors, sphereRadius) => {
    //    let p0 = rayvectors.origin.clone();
    //    //let p1up = p1.unproject(threejs_props.camera);
    //    let p1 = p0.clone().add(rayvectors.direction.clone().normalize()); //.normalize());
    //    let c = new THREE.Vector3()
    //    let dp = p0.add(p1.multiplyScalar(-1)).normalize(); // p0 - p1
    
    //    let c_a = Math.pow(dp.x,2) + Math.pow(dp.y,2) + Math.pow(dp.z,2);
    //    let c_b = 2*dp.x*(p0.x-c.x) + 2*dp.y*(p0.y-c.y) + 2*dp.z*(p0.z-c.z);
    //    let c_c = c.x*c.x + c.y*c.y + c.z*c.z + p0.x*p0.x + p0.y*p0.y + p0.z*p0.z -2*(c.x*p0.x + c.y*p0.y + c.z*p0.z) - sphereRadius*sphereRadius;
    
    //    let discABC = c_b*c_b - 4*c_a*c_c;
    //    let t = (-c_b - Math.sqrt(c_b*c_b - 4*c_a*c_c))/(2*c_a);
    
    //    let intersection = new THREE.Vector3(p0.x + t*dp.x, p0.y+t*dp.y, p0.z+t*dp.z);
    //    intersection.normalize(); //.multiplyScalar(9000);
    //    //intersection.multiplyScalar(300);
    
    //    return intersection;
    //};
    
    const checkSpaceCollision = (e) => {
        let hitit = false;
        console.log("onSingleTap: ", e, threejs_props.current.scene, nodeloader.current);
        //this.refreshGraphLabels();
    
        if (typeof threejs_props.current.scene !== "undefined") // sanity check
        {
            console.log('camera position: ', threejs_props.current.camera.position);
            hideSystemMenu();
            if (!threejs_props.current.orbitcontrols.enabled) {
                threejs_props.current.orbitcontrols.enabled = true;
                // Set position and look at
                threejs_props.current.camera.position.set(0,400,500);
                threejs_props.current.orbitcontrols.update();
            }
            //let canvrect = this.renderer.domElement.getBoundingClientRect();
    
            // Example of mesh selection/pick:
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            mouse.x = ((e.center.x - threejs_props.current.jsx_elements.canvrect.left)/ (threejs_props.current.jsx_elements.canvrect.right - threejs_props.current.jsx_elements.canvrect.left)) * 2 - 1;
            mouse.y = - ((e.center.y - threejs_props.current.jsx_elements.canvrect.top)/ (threejs_props.current.jsx_elements.canvrect.bottom - threejs_props.current.jsx_elements.canvrect.top)) * 2 + 1;
            raycaster.setFromCamera(mouse, threejs_props.current.camera);
    
            var obj = []; // obj: THREE.Object3D[]
            findAllObjects(obj, threejs_props.current.scene);
            var intersects = raycaster.intersectObjects(obj);
            intersects.forEach((i) => {
            console.log('clicked object: ', i.object); // do what you want to do with object
            hitit = true;
            });
    
            if (hitit) {
                console.log('######: ', threejs_props.current.backdrop_mesh.uuid)
                if (intersects[0].object.uuid === threejs_props.current.backdrop_mesh.uuid) {
                    // exclude the hit operation for sysadmin mesh (i.e. the center globe)
                    hitit = false;
                }
            //Object.keys(this.sysadmin_sprites).forEach( (sysadmin_uuid) => {
            //  if (intersects[0].object.uuid === sysadmin_uuid) { // exclude the hit operation for sysadmin mesh (i.e. the center globe)
                //hitit = false;
            //    console.debug("sysadmin node clicked");
            //  }
            //});
            }
        }

        return hitit;
    };

    const showSystemMenu = () => {
        if (!leafapp_props.current.isSysMenuShown) {
        //  this.graph.mesh_lut.mesh2node[mesh.uuid] = node.uuid; // a look-up table to go from mesh uuid (3D screen reference) to node uuid (backend db reference)
        // retrieve sysMenuData as per the currently selected mesh node (this.state.curNode) 
        let meshuuid = leafapp_props.current.curNode.uuid;
        let nodeuuid = graph_props.current.mesh_lut.mesh2node[meshuuid];
        //this.graph.node_lut[nodeuuid];

        console.log('################>>>>> meshuuid: ', meshuuid, ' nodeuuid: ', nodeuuid);
        console.log('################>>>>> : ', graph_props.current.mesh_lut);
        console.log('################>>>>> : ', graph_props.current.node_lut);

        //leafapp_props.current.sysMenuData = [{index: 1, title: '1'}, {index: 2, title: '2'}, {index: 3, title: '3'}, {index: 4, title: '4'}];
        leafapp_props.current.sysMenuData = graph_props.current.node_lut[nodeuuid];
        leafapp_props.current.isSysMenuShown = true;
        need_rerender();
        }
    };

    const hideSystemMenu = () => {
        if (leafapp_props.current.isSysMenuShown) {
            leafapp_props.current.sysMenuData = [];
            leafapp_props.current.isSysMenuShown = false;
            need_rerender();
        }
    };

    const findAllObjects = (pred, parent) => {
        // NOTE: Better to keep separate array of selected objects
        if (parent.children.length > 0) {
          parent.children.forEach((i) => {
            pred.push(i);
            findAllObjects(pred, i);
          });
        }
    };
    
    const findAllBGTags = () => {
        let bgTags = [];
        let cameradir = new THREE.Vector3(); 
        threejs_props.current.camera.getWorldDirection(cameradir);
    
        let that = this;
        leafapp_props.current.bgtagvectors.forEach(
          (tagvec) => {
            // calculate the small radian angle between the two vectors
            let dotpro = tagvec.dot(cameradir);
            let theta = Math.acos(tagvec.dot(cameradir)); // assuming the vectors are normalized
            if (theta < 0.3) { // list tags within the perimeter of 0.3*pi from camera center for visualization
              //console.log("theta:", theta, dotpro);
              //let tagloc = tagvec.clone().multiplyScalar(1000000); // find tag location far out in the horizon radius=1000000 away (aka very far), this was used with equirectangular backdrop
              let tagloc = tagvec.clone().multiplyScalar(ENV_RADIUS); // find tag location far out in the horizon radius=1000000 away (aka very far), this was used with equirectangular backdrop
              //let tagloc = tagvec.clone().multiplyScalar(5000); // the backdrop sphere radius === 5000, find tag location far out in the horizon radius=5000 away (aka very far)
              let scr_coord = projectWorldToScreen(tagloc, threejs_props.current.camera) // calculate the screen coordinate
              bgTags.push({coord: scr_coord});
            }
          }
        );
    
        return bgTags;
    };

    /*
            <div id="graphlabels">
                <GraphLabelComponent {...props} graphlabel_lut={props.state.leat3dnavReducer.graphlabel_lut} ></GraphLabelComponent>
            </div>
            <div id="userprompt">
                <UserPromptComponent {...props} curLEAFapp={leafapp_props.curLEAFapp} curNodeUUID={leafapp_props.curNodeUUID} graphlabel_lut={props.state.leat3dnavReducer.graphlabel_lut} ></UserPromptComponent>
            </div>
        <style dangerouslySetInnerHTML={{__html: css_style_override}}/>
        <div id="myElement" className="outter" style={{height: threejs_props.current.jsx_elements.appwinheight, width: threejs_props.current.jsx_elements.appwinwidth, margin: 0}}>
    */
    //console.log('HHHHHHHHHHHHHHHHHHHHHHHHHHHHh isMounted: ', leafapp_props.current.isMounted);
    return (
        <React.Fragment>
        <div id={"curLEAFapp"+props.nodeuuid} style={{height: "100%"}}>
            <div id={"myElement"+props.nodeuuid} className={styles.outter} style={{height: appwinheight, width: appwinwidth, margin: 0}}>
                <div className={styles.inner} style={{height: "100%"}} >
                    <div id="myCanvasDiv" className={styles.outter} style={{height: "100%", width: "100%", margin: 0}}>
                        <GNavCanvas id={"myCanvas"+props.nodeuuid} style={{height: "100%", margin: 0}}></GNavCanvas>
                    </div>
                </div>
                <div id="bg-tag-top" style={{}}>
                    {
                    threejs_props.current.camera && threejs_props.current.jsx_elements.canvas && leafapp_props.current.isAppRunning &&// this.ragrectcoord && // temporarily diaable for debugging
                    <BGTagComponent 
                    key={props.nodeuuid}
                    nodeuuid={props.nodeuuid}
                    renderstate={renderState}
                    _leafjs= {{
                        camera: threejs_props.current.camera,
                        //render: {canvrect:this.renderer.domElement.getBoundingClientRect(), width: canvas.offsetWidth, height: canvas.offsetHeight}
                        render: {canvrect:threejs_props.current.jsx_elements.canvrect, width: threejs_props.current.jsx_elements.canvas.offsetWidth, height: threejs_props.current.jsx_elements.canvas.offsetHeight}
                    }}
                    camposition= {threejs_props.current.camera.position}
                    //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist
                    dimensions={props.dimensions}
                    appprops= {{
                        _bgtagvectors: leafapp_props.current.bgtagvectors, 
                        setCurbgtagCallback: (bgtagid) => {
                            props.data.tagaction(bgtagid);
                            //leafapp_props.current.curbgtag = bgtagid; need_rerender();
                        },
                        unmountCallback: () => {leafapp_props.current.isAppRunning = false},
                        checkSpaceCollision: (e) => {
                            const hitsomething = checkSpaceCollision(e)

                            if (!hitsomething) { // blank background space clicked
                                // do something accordingly
                                const screenpoint = e.center // {x: e.center.x, y: e.center.y}
                                const raycaster = setupRaycaster(screenpoint, props.dimensions, threejs_props.current.camera); 
                                const bgvector = calculateLineSphereIntersection(raycaster.ray, ENV_RADIUS);
                                //threeCameraCoordToSphericalCoord, sphericalCoordToTHREECameraCoord
                                props.data.blankaction(threeCameraCoordToSphericalCoord(bgvector)).then(() => {
                                    refreshBGTags();
                                });
                            }

                            return hitsomething;
                        },
                    }}
                    />
                    }
                </div>
                {
                    (window.visualViewport.scale !== 1) &&
                    // width: appwinwidth, height: appwinheight
                    <div id={"pinchzoompanel"+props.nodeuuid} style={{position: "absolute", top: '0', zIndex: '0', overflow: "hidden", width: "100%", height: "100%", backgroundColor:"rgba(0,0,0,0.5)"}}></div>
                }
            </div>
            <div id="sysmenu-top" style={{}}>
                {
                leafapp_props.current.isSysMenuShown && leafapp_props.current.sysMenuData &&
                <SystemMenuComponent
                    //_leafjs= {{
                    //  camera: threejs_props.camera,
                    //  render: {canvrect:this.renderer.domElement.getBoundingClientRect(), width: threejs_props.jsx_elements.canvas.offsetWidth, height: threejs_props.jsx_elements.canvas.offsetHeight}
                    //}}
                    //appprops= {{bgtaglist: this.findAllBGTags()}} //this.state.bgtaglist
                    key={props.nodeuuid}
                    appprops= {{
                        nodeuuid: props.nodeuuid,
                        //bgtaglist: leafapp_props.current.bgtaglist,
                        config:{ mass: 10, tension: 60, friction: 100 },
                        sysMenuData: leafapp_props.current.sysMenuData,
                        //sysMenuPosition: leafapp_props.current.curNodeScreenPosition,
                        sysMenuPosition: () => {return {x: appwinwidth/2, y: appwinheight/2}},
                    }}
                    //curLEAFapp={leafapp_props.current.curLEAFapp} curNodeUUID={leafapp_props.current.curNodeUUID}
                >
                </SystemMenuComponent>
                }
            </div>

            <div id="bg-tag-center" >
                {
                    popupComponentList.map(
                        (a_popup_comp, comp_idx) => (
                            <div 
                                key={"popup-comp-"+comp_idx}
                                style={{
                                    position: 'relative',
                                    //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '30' : '2'
                                    //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? '1' : '0'
                                    //zIndex: (stateRef.current.satnodeinfo !== null && stateRef.current.satnodeinfo === d_idx) ? 3 : 3
                                }}
                            >
                                {a_popup_comp}
                            </div>
                        )
                    )
                }
                
            </div>

            {
                threejs_props.current.cogCalculationDone && 
                <div id="cog-calculation-done"></div>
            }
            {
                threejs_props.current.modelLoadingDone && 
                <div id="model-loading-done"></div>
            }
        </div>
        <div style={{zIndex: '0', overflow: "hidden", width: "100%", height: "100%", backgroundColor:"rgba(0,0,0,0.5)"}}>
            <video id="gnav-backdropvideo" loop playsInline style={{display: 'none'}} src={leafgon_url+"/assets/texture/standardstudios_voice.mp4"}></video>
        </div>
        </React.Fragment>
    );
};


            // https://www.youtube.com/embed/5crNt55rpyM
            //<ReactPlayer 
            //    id="gnav-backdropvideo" url="https://www.youtube.com/embed/5crNt55rpyM?autoplay=1&mute=1" 
            //    controls={true}
            //    style={{position:'relative', marginLeft: 'auto', marginRight: 'auto', marginTop: 'auto', marginBottom: 'auto'}}
            //    width='auto'
            //    height='auto'
            ///>
            //<video id="gnav-backdropvideo" loop muted playsInline style={{display: 'none'}} src="https://www.youtube.com/watch?v=5crNt55rpyM" type="video/mp4"></video>
            //<video id="gnav-backdropvideo" loop muted playsInline style={{display: 'none'}} src={leafgon_url+"/assets/texture/20230216_220010_229.mp4"}></video>
            //<video id="gnav-backdropvideo" data-yt2html5="https://www.youtube.com/embed/5crNt55rpyM" controls loop muted autoPlay></video>
            //<script>
            //    new YouTubeToHtml5();
            //    alert()
            //</script>
//            <div id={"graphlabels"+props.nodeuuid}>
//                <GraphLabelComponent {...props} graphlabel_lut={{}} ></GraphLabelComponent>
//            </div>
//            <div id="userprompt">
//                <UserPromptComponent {...props} curLEAFapp={leafapp_props.curLEAFapp} curNodeUUID={leafapp_props.curNodeUUID} graphlabel_lut={{}} ></UserPromptComponent>
//            </div>

const leafElementgnavLambda = () => {

    const graph_options = {
        'layout': '3d'
    };

    return (props) => <LEAT3DNavigator {...props} graph_options={{...graph_options}} />;
};

//export default connect(mapStateToProps, mapDispatchToProps)(LEAT3DNavigator);
export { LEAT3DNavigator, leafElementgnavLambda, setupRaycaster, calculateLineSphereIntersection, threeCameraCoordToSphericalCoord, sphericalCoordToTHREECameraCoord } ;
