/**
 * Copyright (c) 2019-present, LEA Ltd
 */
import React, { useState, useEffect, useRef, MouseEvent, useCallback } from 'react';
import { ChangeEvent } from 'react';

import {ReactFlow,  
  ReactFlowProvider,
  isEdge,
  useNodesState,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
//  Controls,
  Node,
  FlowElement,
  OnLoadParams,
  Elements,
  Position,
  SnapGrid,
  Connection,
  Edge,
  isNode,
  useReactFlow,
  useEdgesState,
  Controls,
  Background
} from './lib/reactflow.11.10.4/reactflow/dist/esm/index.js';
import './lib/reactflow.11.10.4/reactflow/dist/style.css';
//import {Controls} from './lib/reactflow.11.10.4/controls/dist/esm/index.js'
// from './lib/react-flow-renderer';
//#reactflow #migration

//import {useParams} from 'react-router-dom';

import {v4 as uuidv4, v5 as uuidv5} from 'uuid';
import { encodeUnicode, decodeUnicode } from '../../../utils/leafbase64';
import cloneDeep from 'lodash/cloneDeep';

//import {Utility, LEAFOperatorNode, LEAFDataFilterNode, LEAFDataCombineNode, LEAFNodeContextNode, LEAFEdgeContextNode, LEAFAnchorPointNode, LEAFDeckSpade, LEAFDeckDiamond, LEAFDeckHeart, LEAFDeckClub, LEAFDeckTracker} from './leafnodes';
//import {LEAFEditorCircularNode, LEAFEditorElementNode, LEAFUtility, LEAFSpell, LEAFDataFilter, LEAFDataCombine, LEAFNodeContext, LEAFEdgeContext, LEAFAnchorPoint, LEAFDeckSpade, LEAFDeckDiamond, LEAFDeckHeart, LEAFDeckClub, LEAFDeckTracker} from './leafnodetypes';
import { constructEditorNodeTypes, LEAFEditorCircularNode, LEAFEditorElementNode, LEAFEditorCircularNamedNode, LEAFEditorCircularNamedBooleanNode } from './leafnodetypes';
import { _leafstdlib_dataflow_api, LEAFIOmetamodel } from '../../../metamodel';// '../../ghostos';
import {LEAFEdge, LEAFLambdaEdge, LEAFAnchorEdge} from './leafedge';
import LEAFSidebar from './sidebar';
//import GRAPHQL_CLIENT from './GraphQLSetup';

import { ClientContext } from 'graphql-hooks'
import { useSubscription, useMutation } from 'graphql-hooks';

import { memoize } from 'lodash';
import dagre from 'dagre';
//import SHA256 from 'crypto-js/sha256';
//import Base64 from 'crypto-js/enc-base64';
//import { base64 } from 'sjcl/core/codecBase64';
//import { sha256 } from 'sjcl/core/sha256'
//import sjcl from 'sjcl';

import {mutateUpdateNode, mutateAddNode, mutateDelNode, mutateAddEdge, mutateDelEdge, getLEAFgqlSubs, getLEAFgqlStrAddNode, getLEAFgqlStrUpdateNode, getLEAFgqlStrDelNode, MUT_UPDATENODE, MUT_ADDNODE, MUT_DELNODE} from './leafgql';
import { isNullableType } from 'graphql';

//import createClient from '../../lib/graphql/client';
import { endpoint_subs, websocket_subs, endpoint_qm } from './leafgql';

import { fetchMultiKeyedData, setMultiKeyedData } from '../../../utils/fetchnodedata'; //'../../ghostos/api/utils/fetchnodedata';

import { initializeLEAFlakeGQLClient } from '../../../leafio/leaflake';
import { _edge_handle_dict, _edge_style_dict } from '../../../metamodel';

import { _leafgraph } from '../../../parser/nodelogic/abstraction/leafgraph';
import { useLEAFIOapi } from '../../../leafio/core';
import { driveDataflowByCtrlflow, executeLEAFLogic, parseAddressableGraph } from '../../../parser/leaf';

import { useLEAFPopupMenu } from '../popupmenu';

import './index.css';
import { concatMap, firstValueFrom, ReplaySubject, combineLatest, of, map, withLatestFrom, takeUntil, filter } from "rxjs";
import { doBottle, doUnbottle } from '../../../parser/nodelogic/datautils/bottling';

const leafgon_url = process.env.LEAFGON_URL;
const LEAF_VERSION = 'breezyforest';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 75;
const nodeHeight = 75;

const getLayoutedElements = (elements, direction = 'LR') => {
  const isHorizontal = direction === 'LR'; // isVertical: 'TB'
  dagreGraph.setGraph({ multigraph: true, rankdir: direction });
  //dagreGraph.setGraph({ multigraph: true, ranker: 'tight-tree' });

  editorNodes.current.forEach((el) => {
      dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
  });
  editorEdges.current.forEach((el) => {
      dagreGraph.setEdge(el.source, el.target);
  });

  dagre.layout(dagreGraph);

  return editorNodes.current.map((el) => {
    if (isNode(el)) {
      const nodeWithPosition = dagreGraph.node(el.id);
      //el.targetPosition = isHorizontal ? 'left' : 'top';
      //el.sourcePosition = isHorizontal ? 'right' : 'bottom';

      // unfortunately we need this little hack to pass a slightly different position
      // to notify react flow about the change. Moreover we are shifting the dagre node position
      // (anchor=center center) to the top left so it matches the react flow node anchor point (top left).
      el.position = {
        x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }

    return el;
  });
};

const nodeTypes = constructEditorNodeTypes(_leafstdlib_dataflow_api);
const edgeTypes = {
leafdataedge: LEAFEdge,
leaflambdaedge: LEAFLambdaEdge,
leafanchoredge: LEAFAnchorEdge,
};

const LEAFEditorCore = (props) => {
  const initBgColor = '#6f6e77';

  const { setCenter } = useReactFlow();
  const connectionLineStyle = { stroke: '#fff' };
  const snapGrid = [16, 16];
  /*
  {
    leafutilitynode: LEAFUtility,
    leafspellnode: LEAFSpell,
    leafdatafilternode: LEAFDataFilter,
    leafdatacombinenode: LEAFDataCombine,
    leafnodecontextnode: LEAFNodeContext,
    leafedgecontextnode: LEAFEdgeContext,
    leafanchorpointnode: LEAFAnchorPoint,
    leafdeckspade: LEAFEditorCircularNode(_leafstdlib_dataflow_api('leafelement')), //LEAFDeckSpade,
    leafdeckdiamond: LEAFDeckDiamond,
    leafdeckheart: LEAFDeckHeart,
    leafdeckclub: LEAFDeckClub,
    leafdecktracker: LEAFDeckTracker,
  };
  */

  //const [elements, setElements] = useState([]);
  const editorNodes = useRef([]);
  const editorEdges = useRef([]);
  const selectionstatus = useRef({});
  //const editorElements = useRef(elements);

  //const [RFNodes, setRFNodes, onRFNodesChange] = useNodesState([]);
  //const [RFEdges, setRFEdges, onRFEdgesChange] = useEdgesState([]);

  const [bgColor, setBgColor] = useState(initBgColor);
  const [isSelectable, setIsSelectable] = useState(true);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  //const [isDraggable, setIsDraggable] = useState(false);
  //const [isConnectable, setIsConnectable] = useState(false);
  const reactFlowWrapper = useRef(null);

  const graph_data = useRef({"nodes": []});
  // leafgraph related states
  //const leafRuntimeRef = useRef({leafio: undefined, leaflakeio: undefined, mainEtaFunc: undefined});
  //const mainMnemosyne = useRef({});
  const editorSysMenuData = useRef({});
  const editorCodeEtaTree = useRef(undefined);

  // timestamp of last selection event
  const lastSelectionTimestamp = useRef(Date.now());

  const rt_leafgraph = useRef({});
  const debuggerGlobal = useRef({});

  const [renderid, setRenderid] = useState(undefined);

    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const need_rerender = () => {
        //setRFNodes(editorNodes.current);
        //setRFEdges(editorEdges.current);
        setRenderid(uuidv4());
    };


  //const statePermissions = {leaflake: LEAFIOmetamodel.breezyforest.IOAccessPermission.All, appview: LEAFIOmetamodel.breezyforest.IOAccessPermission.All};
  const editorPermissions = {leaflake: LEAFIOmetamodel.breezyforest.IOAccessPermission.All, osview2: LEAFIOmetamodel.breezyforest.IOAccessPermission.Contributor};
  //const {getCurLEAFIOState, getMasterSubsDir, setNewLEAFIOState, setLEAFIOCallback} = useLEAFIOapi({dirOfSubjects:props.masterSubsDir, permissions:editorPermissions});

  //const mutationRequests = useRef([]); // a buffer of LEAFgql mutation strings to be processed
  //const [mutateUpdateNode] = useMutation(MUT_UPDATENODE, {fetchOptionsOverrides: { method: 'POST', mode: 'no-cors' }});
  //const [mutateAddNode] = useMutation(MUT_ADDNODE, {fetchOptionsOverrides: { method: 'POST' }});

  //const nfilter = '{in_edges: {label: {eq: "Alice39-ala2"}}}'
  //const appid2 = SHA256('www.leafgon.com').toString();
  //const appid = Base64.stringify(SHA256('www.leafgon.com'));
  //const appid = Base64.stringify(SHA256('temporary_test_appid'));
  //const appid = sjcl.codec.base64.fromBits(sjcl.hash.sha256.hash('temporary_test_appid'));
  //const nfilter = `{appid: {eq: "${appid}"}}`
  //const efilter = `{appid: {eq: "${appid}"}}`
  const nfilter = '{}';
  const efilter = '{}';

  /*
  {
    id: 'bc3',
    type: 'leafdatafilternode',
    data: { onChange: onTextChange, leaduuid: 'bc3' },
    style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
    //position: { x: 250, y: 50 },
  }
  { id: 'bc_e3', source: 'bc1', target: '2', sourceHandle: 'out_aux', targetHandle: 'in_aux', type: 'leaflambdaedge', animated: false, style: {stroke: '#8ff', fillOpacity: 0 , }, data: { text: 'e1-2' } },
  */

  //useSubscription(
  //  {
  //    query: getLEAFgqlSubs('temporary_test_appid')
  //  },
  //  handleGraphUpdate
  //);

  /*
  const gql_subs_client = createClient({
    endpoint: endpoint_subs,
    headers: {
      'Content-Type': 'application/json',
    },
    websocket: {
      endpoint: websocket_subs,
      onConnectionSuccess: () => console.log('gql_subs_client: Connected'),
      onConnectionError: () => console.log('gql_subs_client: Connection Error'),
    }
  });

  const subsCallback = (event) => {
    console.log(event);
  };
  const errorSubsCallback = (error) => {
    console.log('Error: ', error);
  };
  try {
    gql_subs_client.subscribe(
      {
        subscription: getLEAFgqlSubs('temporary_test_appid'),
      },
      subsCallback,
      errorSubsCallback
    );
  } catch (error) {
    console.log('Error: ', error);
  }
  */
  //let muts = mutationRequests.current.shift(); // remove the first item of the array
  //while (muts) {
  //  mutateNode();
  //  muts = mutationRequests.current.shift(); // remove the next item of the array if any
  //}

  const randNames = {"data":["Park", "Lim", "Koob", "Oh", "Cho", "Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Garcia","Rodriguez","Wilson","Martinez","Anderson","Taylor","Thomas","Hernandez","Moore","Martin","Jackson","Thompson","White","Lopez","Lee","Gonzalez","Harris","Clark","Lewis","Robinson","Walker","Perez","Hall","Young","Allen","Sanchez","Wright","King","Scott","Green","Baker","Adams","Nelson","Hill","Ramirez","Campbell","Mitchell","Roberts","Carter","Phillips","Evans","Turner","Torres","Parker","Collins","Edwards","Stewart","Flores","Morris","Nguyen","Murphy","Rivera","Cook","Rogers","Morgan","Peterson","Cooper","Reed","Bailey","Bell","Gomez","Kelly","Howard","Ward","Cox","Diaz","Richardson","Wood","Watson","Brooks","Bennett","Gray","James","Reyes","Cruz","Hughes","Price","Myers","Long","Foster","Sanders","Ross","Morales","Powell","Sullivan","Russell","Ortiz","Jenkins","Gutierrez","Perry","Butler","Barnes","Fisher","Henderson","Coleman","Simmons","Patterson","Jordan","Reynolds","Hamilton","Graham","Kim","Gonzales","Alexander","Ramos","Wallace","Griffin","West","Cole","Hayes","Chavez","Gibson","Bryant","Ellis","Stevens","Murray","Ford","Marshall","Owens","Mcdonald","Harrison","Ruiz","Kennedy","Wells","Alvarez","Woods","Mendoza","Castillo","Olson","Webb","Washington","Tucker","Freeman","Burns","Henry","Vasquez","Snyder","Simpson","Crawford","Jimenez","Porter","Mason","Shaw","Gordon","Wagner","Hunter","Romero","Hicks","Dixon","Hunt","Palmer","Robertson","Black","Holmes","Stone","Meyer","Boyd","Mills","Warren","Fox","Rose","Rice","Moreno","Schmidt","Patel","Ferguson","Nichols","Herrera","Medina","Ryan","Fernandez","Weaver","Daniels","Stephens","Gardner","Payne","Kelley","Dunn","Pierce","Arnold","Tran","Spencer","Peters","Hawkins","Grant","Hansen","Castro","Hoffman","Hart","Elliott","Cunningham","Knight","Bradley","Carroll","Hudson","Duncan","Armstrong","Berry","Andrews","Johnston","Ray","Lane","Riley","Carpenter","Perkins","Aguilar","Silva","Richards","Willis","Matthews","Chapman","Lawrence","Garza","Vargas","Watkins","Wheeler","Larson","Carlson","Harper","George","Greene","Burke","Guzman","Morrison","Munoz","Jacobs","Obrien","Lawson","Franklin","Lynch","Bishop","Carr","Salazar","Austin","Mendez","Gilbert","Jensen","Williamson","Montgomery","Harvey","Oliver","Howell","Dean","Hanson","Weber","Garrett","Sims","Burton","Fuller","Soto","Mccoy","Welch","Chen","Schultz","Walters","Reid","Fields","Walsh","Little","Fowler","Bowman","Davidson","May","Day","Schneider","Newman","Brewer","Lucas","Holland","Wong","Banks","Santos","Curtis","Pearson","Delgado","Valdez","Pena","Rios","Douglas","Sandoval","Barrett","Hopkins","Keller","Guerrero","Stanley","Bates","Alvarado","Beck","Ortega","Wade","Estrada","Contreras","Barnett","Caldwell","Santiago","Lambert","Powers","Chambers","Nunez","Craig","Leonard","Lowe","Rhodes","Byrd","Gregory","Shelton","Frazier","Becker","Maldonado","Fleming","Vega","Sutton","Cohen","Jennings","Parks","Mcdaniel","Watts","Barker","Norris","Vaughn","Vazquez","Holt","Schwartz","Steele","Benson","Neal","Dominguez","Horton","Terry","Wolfe","Hale","Lyons","Graves","Haynes","Miles","Park","Warner","Padilla","Bush","Thornton","Mccarthy","Mann","Zimmerman","Erickson","Fletcher","Mckinney","Page","Dawson","Joseph","Marquez","Reeves","Klein","Espinoza","Baldwin","Moran","Love","Robbins","Higgins","Ball","Cortez","Le","Griffith","Bowen","Sharp","Cummings","Ramsey","Hardy","Swanson","Barber","Acosta","Luna","Chandler","Blair","Daniel","Cross","Simon","Dennis","Oconnor","Quinn","Gross","Navarro","Moss","Fitzgerald","Doyle","Mclaughlin","Rojas","Rodgers","Stevenson","Singh","Yang","Figueroa","Harmon","Newton","Paul","Manning","Garner","Mcgee","Reese","Francis","Burgess","Adkins","Goodman","Curry","Brady","Christensen","Potter","Walton","Goodwin","Mullins","Molina","Webster","Fischer","Campos","Avila","Sherman","Todd","Chang","Blake","Malone","Wolf","Hodges","Juarez","Gill","Farmer","Hines","Gallagher","Duran","Hubbard","Cannon","Miranda","Wang","Saunders","Tate","Mack","Hammond","Carrillo","Townsend","Wise","Ingram","Barton","Mejia","Ayala","Schroeder","Hampton","Rowe","Parsons","Frank","Waters","Strickland","Osborne","Maxwell","Chan","Deleon","Norman","Harrington","Casey","Patton","Logan","Bowers","Mueller","Glover","Floyd","Hartman","Buchanan","Cobb","French","Kramer","Mccormick","Clarke","Tyler","Gibbs","Moody","Conner","Sparks","Mcguire","Leon","Bauer","Norton","Pope","Flynn","Hogan","Robles","Salinas","Yates","Lindsey","Lloyd","Marsh","Mcbride","Owen","Solis","Pham","Lang","Pratt","Lara","Brock","Ballard","Trujillo","Shaffer","Drake","Roman","Aguirre","Morton","Stokes","Lamb","Pacheco","Patrick","Cochran","Shepherd","Cain","Burnett","Hess","Li","Cervantes","Olsen","Briggs","Ochoa","Cabrera","Velasquez","Montoya","Roth","Meyers","Cardenas","Fuentes","Weiss","Hoover","Wilkins","Nicholson","Underwood","Short","Carson","Morrow","Colon","Holloway","Summers","Bryan","Petersen","Mckenzie","Serrano","Wilcox","Carey","Clayton","Poole","Calderon","Gallegos","Greer","Rivas","Guerra","Decker","Collier","Wall","Whitaker","Bass","Flowers","Davenport","Conley","Houston","Huff","Copeland","Hood","Monroe","Massey","Roberson","Combs","Franco","Larsen","Pittman","Randall","Skinner","Wilkinson","Kirby","Cameron","Bridges","Anthony","Richard","Kirk","Bruce","Singleton","Mathis","Bradford","Boone","Abbott","Charles","Allison","Sweeney","Atkinson","Horn","Jefferson","Rosales","York","Christian","Phelps","Farrell","Castaneda","Nash","Dickerson","Bond","Wyatt","Foley","Chase","Gates","Vincent","Mathews","Hodge","Garrison","Trevino","Villarreal","Heath","Dalton","Valencia","Callahan","Hensley","Atkins","Huffman","Roy","Boyer","Shields","Lin","Hancock","Grimes","Glenn","Cline","Delacruz","Camacho","Dillon","Parrish","Oneill","Melton","Booth","Kane","Berg","Harrell","Pitts","Savage","Wiggins","Brennan","Salas","Marks","Russo","Sawyer","Baxter","Golden","Hutchinson","Liu","Walter","Mcdowell","Wiley","Rich","Humphrey","Johns","Koch","Suarez","Hobbs","Beard","Gilmore","Ibarra","Keith","Macias","Khan","Andrade","Ware","Stephenson","Henson","Wilkerson","Dyer","Mcclure","Blackwell","Mercado","Tanner","Eaton","Clay","Barron","Beasley","Oneal","Preston","Small","Wu","Zamora","Macdonald","Vance","Snow","Mcclain","Stafford","Orozco","Barry","English","Shannon","Kline","Jacobson","Woodard","Huang","Kemp","Mosley","Prince","Merritt","Hurst","Villanueva","Roach","Nolan","Lam","Yoder","Mccullough","Lester","Santana","Valenzuela","Winters","Barrera","Leach","Orr","Berger","Mckee","Strong","Conway","Stein","Whitehead","Bullock","Escobar","Knox","Meadows","Solomon","Velez","Odonnell","Kerr","Stout","Blankenship","Browning","Kent","Lozano","Bartlett","Pruitt","Buck","Barr","Gaines","Durham","Gentry","Mcintyre","Sloan","Melendez","Rocha","Herman","Sexton","Moon","Hendricks","Rangel","Stark","Lowery","Hardin","Hull","Sellers","Ellison","Calhoun","Gillespie","Mora","Knapp","Mccall","Morse","Dorsey","Weeks","Nielsen","Livingston","Leblanc","Mclean","Bradshaw","Glass","Middleton","Buckley","Schaefer","Frost","Howe","House","Mcintosh","Ho","Pennington","Reilly","Hebert","Mcfarland","Hickman","Noble","Spears","Conrad","Arias","Galvan","Velazquez","Huynh","Frederick","Randolph","Cantu","Fitzpatrick","Mahoney","Peck","Villa","Michael","Donovan","Mcconnell","Walls","Boyle","Mayer","Zuniga","Giles","Pineda","Pace","Hurley","Mays","Mcmillan","Crosby","Ayers","Case","Bentley","Shepard","Everett","Pugh","David","Mcmahon","Dunlap","Bender","Hahn","Harding","Acevedo","Raymond","Blackburn","Duffy","Landry","Dougherty","Bautista","Shah","Potts","Arroyo","Valentine","Meza","Gould","Vaughan","Fry","Rush","Avery","Herring","Dodson","Clements","Sampson","Tapia","Bean","Lynn","Crane","Farley","Cisneros","Benton","Ashley","Mckay","Finley","Best","Blevins","Friedman","Moses","Sosa","Blanchard","Huber","Frye","Krueger","Bernard","Rosario","Rubio","Mullen","Benjamin","Haley","Chung","Moyer","Choi","Horne","Yu","Woodward","Ali","Nixon","Hayden","Rivers","Estes","Mccarty","Richmond","Stuart","Maynard","Brandt","Oconnell","Hanna","Sanford","Sheppard","Church","Burch","Levy","Rasmussen","Coffey","Ponce","Faulkner","Donaldson","Schmitt","Novak","Costa","Montes","Booker","Cordova","Waller","Arellano","Maddox","Mata","Bonilla","Stanton","Compton","Kaufman","Dudley","Mcpherson","Beltran","Dickson","Mccann","Villegas","Proctor","Hester","Cantrell","Daugherty","Cherry","Bray","Davila","Rowland","Levine","Madden","Spence","Good","Irwin","Werner","Krause","Petty","Whitney","Baird","Hooper","Pollard","Zavala","Jarvis","Holden","Haas","Hendrix","Mcgrath","Bird","Lucero","Terrell","Riggs","Joyce","Mercer","Rollins","Galloway","Duke","Odom","Andersen","Downs","Hatfield","Benitez","Archer","Huerta","Travis","Mcneil","Hinton","Zhang","Hays","Mayo","Fritz","Branch","Mooney","Ewing","Ritter","Esparza","Frey","Braun","Gay","Riddle","Haney","Kaiser","Holder","Chaney","Mcknight","Gamble","Vang","Cooley","Carney","Cowan","Forbes","Ferrell","Davies","Barajas","Shea","Osborn","Bright","Cuevas","Bolton","Murillo","Lutz","Duarte","Kidd","Key","Cooke"]};
  const randRadioKeys = {"data":[
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Zeta', 'Eta', 'Theta',  
    'Kappa', 'Sigma', 'Phi', 'Chi', 'Omega',
  ]};
  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    } catch (error) {
      console.error('Unable to fetch data:', error);
    }
  }
  function fetchNames(nameType) {
    return fetchData(`https://www.randomlists.com/data/names-${nameType}.json`);
  }
  async function generateName(gender) {
    try {
      const response = await Promise.all([
        fetchNames(gender || pickRandom(['male', 'female'])),
        fetchNames('surnames')
      ]);
  
      const [firstNames, lastNames] = response;
  
      const firstName = pickRandom(firstNames.data);
      const lastName = pickRandom(lastNames.data);
  
      return `${firstName} ${lastName}`;
    } catch(error) {
      console.error('Unable to generate name:', error);
    }
  }
  const pickRandom = (list) => {
    return list[Math.floor(Math.random() * list.length)];
  }


  const setupNameInvalidityCheck = (leafnodetype, nodetypeapi=undefined) => {
      return (name) => { 
        if (nodetypeapi && ('bannednames' in nodetypeapi.editorconfig && nodetypeapi.editorconfig.bannednames.map(x=>x.toLowerCase()).includes(name.toLowerCase())) ||
            ('allowednames' in nodetypeapi.editorconfig && !nodetypeapi.editorconfig.allowednames.map(x=>x.toLowerCase()).includes(name.toLowerCase()))) 
            // if the nodetype defines a list of banned names in its api and the chosen name is one in that list or
            // a list of allowed names is defined and the chosen name is NOT in that list
          return true; // return as invalid 

        if (nodetypeapi && !nodetypeapi.editorconfig.banduplicatename) // if duplicate names are allowed for the node type
          return false; // return as valid
        const isClash = editorNodes.current.find(e => {
          //const curNodeName = fetchMultiKeyedData(e.leafapi.editorconfig.namedatakey, e.data.leaf.logic.args); // any presence of edge type elements caused error here
          //console.log(e.leafapi.editorconfig.namedatakey, e.data.leaf.logic.args, curNodeName);
          return isNode(e) && (leafnodetype === e.type) && (name.toLowerCase() === fetchMultiKeyedData(e.leafapi.editorconfig.namedatakey, e.data.leaf.logic.args).toLowerCase()); //curNodeName) 
        });

        return isClash;
      };
  };


  const assertSingleNodeType = (leafnodetype) => {
      const isInvalidName = () => { return editorNodes.current.find(e => isNode(e) && (leafnodetype === e.type) )};

      const existingNode = isInvalidName();
      if (existingNode) {
        setCenter(existingNode.position.x + 25, existingNode.position.y + 25); // locate the existing spade in the center of the editor for attention
        //const editorCoords = project(existingSpade.position);
        //setCenter(editorCoords.x, editorCoords.y);
        throw 'LEAF Error: checkDuplicateNodeType(): only a single node element instance can exist in a graph for '+leafnodetype;
      }

      return existingNode; // return undefined for no duplicate
  };

  const pickSpadeElementName = (leafnodetype) => {
    try {
      const rand_name = () => pickRandom(randNames.data);

      const isInvalidName = () => { return editorNodes.current.find(e => isNode(e) && (leafnodetype === e.type) )};

      const existingSpade = isInvalidName();
      if(existingSpade) {
        //const editorCoords = project({x: 25, y: 25}); // the spade node is 50 px wide and 50 px high, and the position is at the top left corner of the icon
        //const editorCoords = {x: 0, y: 0};
        setCenter(existingSpade.position.x + 25, existingSpade.position.y + 25); // locate the existing spade in the center of the editor for attention
        //const editorCoords = project(existingSpade.position);
        //setCenter(editorCoords.x, editorCoords.y);
        throw 'LEAF Error: pickSpadeElementName(): only a single spade element instance can exist in a LEAD';
      }

      const name = rand_name();

      return name;
    }
    catch(err) {
      throw err;
    }
  };
  const pickRandomElementName = (leafnodetype, apidef) => {
    try {
      const rand_name = () => pickRandom(randNames.data);

      const isInvalidName = setupNameInvalidityCheck(leafnodetype, apidef); //(name) => { return elements.find(e => isNode(e) && (leafnodetype === e.type) && (name === e.data.name) )};
      //const eelen = editorElements.current.length;

      let name = rand_name();
      let trial_count = 0;
      const max_trial = 10

      while (isInvalidName(name) && trial_count < max_trial ) {
        trial_count += 1;
        name = rand_name();
        console.debug("new name: ",name, trial_count);
      }

      if (trial_count === max_trial) {
        throw 'LEAF Error: pickRandomElementName() ran out of the random element name pool';
      }
      return {name, isInvalidName};
    }
    catch(err) {
      throw err;
    }
  };

  const pickRandomRadioKey = (leafnodetype, apidef) => {
    try {
      const rand_key = () => pickRandom(randRadioKeys.data);

      const isInvalidName = setupNameInvalidityCheck(leafnodetype, apidef); 

      const findRandKeyCombo = (combolimit, keylenlimit=10) => {
        let keycombo = ''
        const randcombolen = Math.floor(Math.random() * combolimit) + 1; // random integer between 1 and combolimit
        keycombo = [...Array(randcombolen).keys()].map(x=>rand_key());
        while (keycombo.join('').length > keylenlimit)
          keycombo = [...Array(randcombolen).keys()].map(x=>rand_key());

        return keycombo.join('');
      };

      let trial_count = 0;
      const max_trial = 9;
      const combomax = 3;
      let key = findRandKeyCombo(combomax);

      while (isInvalidName(key) && trial_count < max_trial ) {
        trial_count += 1;
        key = findRandKeyCombo(combomax);
        console.debug("new key: ",key, trial_count);
      }

      if (trial_count === max_trial) {
        console.error('LEAF Error: pickRandomRadioKey() failed to find a unique key');
        key = '';
      }
      return {key, isInvalidName};
    }
    catch(err) {
      throw err;
    }
  };

  const onInit = (_reactFlowInstance) => { 
    _reactFlowInstance.fitView();

    //const curViewport = _reactFlowInstance.getViewport();
    //const transViewport = _reactFlowInstance.getViewport();
    //_reactFlowInstance.setCenter(2144, 528, {duration: 3000, zoom: 1.5});
    _reactFlowInstance.fitView();
    setReactFlowInstance(_reactFlowInstance);
    console.log('flow loaded:', _reactFlowInstance);
  }

  const onDragOver = (event) => {
    //const transViewport = reactFlowInstance.getViewport();
    //const position = reactFlowInstance.project({x:2144, y:528});
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  /*
  const onDrop = (event) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    const leaduuid = event.dataTransfer.getData('leaduuid');
    const datakey = event.dataTransfer.getData('datakey');
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const newNode = {
      id: uuidv4(),
      type,
      position,
      data: { label: `${leaduuid} ${type} node`,
              leaduuid: `${leaduuid}`,
              datakey: `${datakey}`, 
            },

      style: { border: '1px solid #777', padding: 2, borderRadius: '5px' }
    };

    setElements((es) => es.concat(newNode));
  };
  */

  /*
  const onTextChange = (event) => { // : ChangeEvent
    setElements((els) =>
      els.map((e) => {
        if (isEdge(e) || e.id !== '2') {
          return e;
        }

        const color = event.target.value;

        setBgColor(color);

        console.debug("data: ", e.data);
        return {
          ...e,
          data: {
            ...e.data,
          },
        };
      })
    );
  };
  */

  //const onColorChange = (event) => { //: ChangeEvent
  //  editorElements.current.map((e) => {
  //    if (isEdge(e) || e.id !== '2') {
  //      return e;
  //    }

  //    const color = event.target.value;

  //    setBgColor(color);

  //    console.log("data: ", e.data);
  //    return {
  //      ...e,
  //      data: {
  //        ...e.data,
  //        color,
  //      },
  //    };
  //  });
  //  setElements(editorElements.current); // component rerendered by this
  //};

  const onDrop = async (event) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    const datakey = event.dataTransfer.getData('datakey');
    const leafnodetype = event.dataTransfer.getData('leafnodetype'); // event.dataTransfer.setData('leafnodetype') in onDragStart in leafui/floweditor/sysmenu.js
    //const leafnodetype = event.dataTransfer.getData('type');
    //setCenter(event.clientX + 25, event.clientY + 25); // set the drop point as the center of the editor for attention
    //console.log(project);
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left - 25,
      y: event.clientY - reactFlowBounds.top - 25,
    });

    const node_uuid = uuidv4();
    //const leaduuid = event.dataTransfer.getData('leaduuid');
    // ignore the supplied leaduuid only used for testing, and assign it a real uuid 
    // spark dev note: 15/July/2021
    // The argument 'data.leaduuid' being passed here is used as nodeId needed by AnchorHandle or other LEAF custom Handles. 
    // In the stock Handle defined by react-flow-renderer library, nodeId is assigned by referring to the runtime context which is not exported, 
    // hence the argument passing
    const leaduuid = node_uuid;
    const apidef = _leafstdlib_dataflow_api(leafnodetype);

    if (apidef) {
      if ('banmultiplenode' in apidef.editorconfig && apidef.editorconfig.banmultiplenode)
        assertSingleNodeType(leafnodetype);

      const node_data = { // leaf node data scaffolding with some defaults, this should be refactored to be migrated to ghostos metadata.js
        leaf: {
          logic: cloneDeep(apidef.leaf.logic), // initialize the scaffold of the leaf node's logic block (carrying the user data) as per the apidef
          api: LEAF_VERSION,
          appdata: {
            position: position
          }
        }
      };

      
      const isInvalidName = setupNameInvalidityCheck(leafnodetype, apidef);
      const data_obj = { // default data for the new editor node object
        //label: `${leaduuid} ${type} node`,
        leaduuid: `${leaduuid}`,
        //justchekin: 'helloworld',
        //datakey: `${datakey}`, 
        //nodeid: node_uuid,
        isInvalidName: isInvalidName,
        ...node_data, // default
      };

      let nodemenu_inputdata = {};

      if (['leafdatafilternode', 'leafdatacombinenode'].includes(leafnodetype)) {
        //data_obj.onChange = onTextChange;  // deprecated
      }
      //else if (['leafutilitynode'].includes(leafnodetype)) {
      //  data_obj.onChange = onColorChange; // deprecated
      //}
      else if (['leafspellnode'].includes(leafnodetype)) {
        //const operatortype = event.dataTransfer.getData('operatortype');
        const spellname = event.dataTransfer.getData('spellname');
        data_obj.spellname = spellname;
        node_data.leaf.logic.args.spellname = spellname;
      }
      else if (['leafdeckheart', 'leafdeckdiamond', 'leafdeckclub'].includes(leafnodetype)) {
        const {name, isInvalidName} = pickRandomElementName(leafnodetype, apidef);
        data_obj.leafnodename = name;
        //data_obj.isInvalidName = isInvalidName; // pass down the clash finding function customized for a single leafnodetype
        node_data.leaf.logic.args = {elementconfig: {leafnodename: name}};
      }
      else if (['leafradioRX'].includes(leafnodetype)) {
        const {key, isInvalidName} = pickRandomRadioKey(leafnodetype, apidef);
        //const isInvalidName = setupNameInvalidityCheck(leafnodetype, apidef);
        //data_obj.isInvalidName = isInvalidName; // pass down the clash finding function customized for a single leafnodetype
        data_obj.leafnodename = key;
        //node_data.leaf.logic.args = {elementconfig: {leafnodename: name}};
        setMultiKeyedData(apidef.editorconfig.namedatakey, node_data.leaf.logic.args, key);
      }
      //else if (['leafradioTX'].includes(leafnodetype)) {
        //const isInvalidName = setupNameInvalidityCheck(leafnodetype, apidef);
      //  data_obj.isInvalidName = isInvalidName; // pass down the clash finding function customized for a single leafnodetype
        //node_data.leaf.logic.args = {elementconfig: {leafnodename: name}};
        //setMultiKeyedData(apidef.editorconfig.namedatakey, node_data.leaf.logic.args, key);
      //}
      else if (['leafdeckspade'].includes(leafnodetype)) {
        const name = pickSpadeElementName(leafnodetype);
        data_obj.leafnodename = name;
        node_data.leaf.logic.args = {elementconfig: {leafnodename: name}};
      }
      //else if (['leafgateflow'].includes(leafnodetype)) {
        //const isInvalidName = setupNameInvalidityCheck(leafnodetype, apidef);
        //data_obj.isInvalidName = isInvalidName; // pass down the clash finding function customized for a single leafnodetype
      //}
      else if (['leaflisp'].includes(leafnodetype)) {
        //const lispexpression = event.dataTransfer.getData('operatortype'); // get the lispexpression string (eg '(lambda (x) x)') from the ui
        const lispexpression = event.dataTransfer.getData('lispexpression'); // get the lispexpression string (eg '(lambda (x) x)') from the ui
        node_data.leaf.logic.args.lispexpression = lispexpression;
        //node_data.leaf.logic.args = {elementconfig: {leafnodename: name}};
      }
      else if (["leafconfig"].includes(leafnodetype)) {
          //const config_methods = await props.etaTree.lookupLEAFNodeMethods(node_uuid);
          //nodemenu_inputdata = await config_methods.config.getConfigData();
          console.log("start debugging");
      }

      data_obj.domain = props.graph.domain;
      data_obj.appid = props.graph.appid;
      data_obj.inputData = nodemenu_inputdata;
      data_obj.isdebug = false; // spark_dev_note: this would make the dropped node display joker only after making a round trip to the server store
      const new_editor_node = {
        id: node_uuid, // a field required by react-flow-renderer, pls do not remove.
        type: leafnodetype,
        leafapi: apidef,
        //leafnodetype,
        position: position,
        //data: { ...parsed_node_data.leaf.logic.args, leaduuid: n.uuid}, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data
        data: data_obj, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data
        style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
        ispersistent: false // spark_dev_note: a placeholder boolean for implementing the feature to vary visualization of the rendered leaf node depending on whether it is stored up in the LEAFlake or is just being added in the LEAFeditor
      };


      //const new_editor_node = {
      //  id: node_uuid,
      //  //leafnodetype: leafnodetype,
      //  type: leafnodetype, // spark_dev_note: choose between leafnodetype or type for storing the leafnodetype string
      //  position: position,
      //  data: data_obj,

      //  style: { border: '1px solid #777', padding: 2, borderRadius: '5px' }
      //};

      //mutationRequests.current.push(getLEAFgqlStrAddNode(new_node));

      //mutateNode({id: node_uuid, data: sjcl.codec.base64.fromBits(JSON.stringify(node_data))});
      // spark dev note: 
      // the principle of organizing node data fields is to put any leafeditor specific data under the 'data' field.
      //mutateAddNode({variables: {uuid: node_uuid, label: '', data: btoa(JSON.stringify(node_data))}});
      //await mutateAddNode({uuid: node_uuid, type: type, position: JSON.stringify(position)});
      await mutateAddNode({variables: {uuid: node_uuid, leafnodetype: leafnodetype, graphdomain: props.graph.domain, graphappid: props.graph.appid, provdomain: LEAF_VERSION, provappid: 'leafeditor', data: encodeUnicode(JSON.stringify(node_data))}});

      editorNodes.current = editorNodes.current.concat(new_editor_node);
      //setElements((es) => es.concat(new_editor_node));
      //setElements(editorElements.current);
      need_rerender();
      //editorGraphUpdateHandler({ graph: {nodes, edges }});
    }
  };

  // spark_dev_note: this is where leaf editor retrieves the menudata needed for rendering the
  // popup radial menu for the nodetype specified in libname
  // by executing a LEAF logic defined for the corresponding nodetype under breezyforest/editor
  const retrieveMenuData = async (_rt_leafgraph, libname, menutype="_default", nodeuuid) => {
      const ctrl_accio_bottle = doBottle('accio', 'ctrl_accio');
      const data_accio_bottle = doBottle('accio', 'data_accio');
      const combinedMenuData = {diamonds: []};
      // do something with the response once the leafgraph is resolved
      if (_rt_leafgraph && libname in _rt_leafgraph && _rt_leafgraph[libname] && menutype in _rt_leafgraph[libname]) {
          if (["leafconfig", "leaflisp", "leafscreenio"].includes(libname))
              console.log("start debugging");
          const menudata$obj = driveDataflowByCtrlflow({_stream: of(ctrl_accio_bottle)}, [{_stream: of(doBottle('nodeuuid', nodeuuid))}], undefined, {codebase: "floweditor/index.js"},
              {
                  leaflogic: (menutype === "_default" ? _rt_leafgraph[libname][menutype] : _rt_leafgraph[libname][menutype]["_default"]),
                  datalogic: {
                      //pre: _datalogic_pre,
                      post: (_data_in) => { // peep hole for debugging
                          const _data_out = doUnbottle("screenio",_data_in); // the leafdeckheart element bottles its output in "screenio" by default, which is unneeded by retrieveMenuData
                          return _data_out;
                      }
                  }
              }
          );
          //const menudata = await executeLEAFLogic(rt_leafgraph[libname][menutype], [], {});
          const menudata = await firstValueFrom(menudata$obj._control._stream.pipe(
              withLatestFrom(menudata$obj._stream),
              map(_combined_in => {
                  return _combined_in[1];
              })
          ));
          if (["leafconfig", "leaflisp", "leafscreenio"].includes(libname))
              console.log("start debugging");
          const doCombine = (_menudata) => {
              if (_menudata && _menudata.type === 'leafdeckheart') {
                  combinedMenuData.diamonds = combinedMenuData.diamonds.concat(_menudata.diamonds);
                  console.log(`the leaf standard menu data for ${libname} popup window have been loaded.`);
              }
              else {
                  console.log(`the leaf standard menu data for ${libname} popup window have zero menu entries.`);
              }
          };
          if (Array.isArray(menudata))
              menudata.map(x => doCombine(x))
          else
              doCombine(menudata)
      }
      else {
          console.warn(`the leaf standard menu data for ${libname} popup window could not be loaded.`);
          return undefined;
      }

      return combinedMenuData;
      //return undefined;
  }
  //const onElementClick = (_: MouseEvent, element: FlowElement) => console.log('click', element);
  const parseGraphNodesToEditorElements = async (nodes) => {
      let el_list = {nodes: [], edges: []};

      // if the node's scope matches what's in the rules, the node's debugmenu defaults to the default menu
      const debugmenu_default_rules = {
          leaflabel: {scope: "dataflow"}
      };
      //// build etaTree for the current leaf graph being loaded to the editor
      //const leafgraph = reconstructLEAFGraph(nodes); //, leafRuntimeRef.current.leafio.getMasterSubsDir());
      //console.log('nodes and edges updated');
      //const leafcomponents = analyzeLEAFGraph(leafgraph);
      //// initialize leaf compiler
      //const etaTree = runtimeEtaTree(props.etaTree.domain, props.etaTree.appid, "", appid, leafgraph, leafcomponents, leafRuntimeRef.current.leafio, mainMnemosyne); // leafRuntimeRef.current.masterSubsDir;
      //editorCodeEtaTree.current = etaTree;

      //const leafgraph_args = {graphuuid: '', domain: 'breezyforest', appid: 'leafeditor', graphaddrstr: 'breezyforest/editor'};
      //const leafgraph_args = {graphuuid: '', domain: 'breezyforest', appid: 'leafeditor', graphaddrstr: 'breezyforest/editor'};
      //const getLEAFGraph = _leafgraph.lambda(lambdactrl)({refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: []});
      // do something with the response once the leafgraph is resolved
      //editorSysMenuData.current = {diamonds: []};
      //if (rt_leafgraph && 'menudata' in rt_leafgraph && '_default' in rt_leafgraph.menudata) {
      //    const menudata = await executeLEAFLogic(rt_leafgraph.menudata._default, []);
      //    if (menudata.length > 0) {
      //        editorSysMenuData.current = menudata[0];
      //        console.log('the leaf standard lib for leafeditor has been loaded.', rt_leafgraph);
      //    }
      //    else {
      //        console.log('the leaf standard lib for leafeditor has been loaded with zero editor menu entries.', rt_leafgraph);
      //    }
      //}
      //else {
      //    console.error('the leaf standard lib for leafeditor could not be loaded.');
      //}

      const menudataLUT = {};
      console.log("parseGraphNodesToEditorElements called with nodes:", nodes);
      await Promise.all(nodes.map( async (n) => {
          if (n.data) {
              //let parsed_node_data = JSON.parse(sjcl.codec.base64.toBits(n.data));
              let parsed_node_data = JSON.parse(decodeUnicode(n.data)); // base64 decode and convert json string to js object
              // spark_dev_note: this is where data.spellname for LEAFSpell is set. the info is supposed to be stored in the node's encoded data field 
              // (4 Mar 2022) currently the info is not stored in the encoded data field, resulting in the loss of spellname string upon dropping the leaf node in the editor
              // (6 Mar 2022) the loss of spellname string issue has been fixed, so the info should be available in the node's encoded data field.
              // however, a different issue arose: due to a refactoring-induced error, leaf node position used by leafeditor is now stored in two different locations.
              // parsed_node.data.leaf.position and parsed_node_data.leaf.appdata.position
              // the leaf.appdata.position is right and leaf.position is wrong. fix it. (6 Mar 2022)
              const apidef = _leafstdlib_dataflow_api(parsed_node_data.leaf.logic.type);
              const isInvalidName = setupNameInvalidityCheck(parsed_node_data.leaf.logic.type, apidef);
              //const apidef = parsed_node_data ? _leafstdlib_dataflow_api(parsed_node_data.leaf.logic.type) : undefined;
              let menudata = undefined;
              let menutype = "_default"
              let nodemenu_inputdata = {};
              if (parsed_node_data.leaf.logic.type === "leafelement") {
                  if (!_.isEmpty(parsed_node_data.leaf.logic.args.elementname))
                      menutype = parsed_node_data.leaf.logic.args.elementname
                  else
                      menutype = undefined;

                  menudata = (menutype !== undefined && menudataLUT.leafelement && menutype in menudataLUT.leafelement) ? menudataLUT.leafelement[menutype] : undefined;

                  if (menudata === undefined && menutype !== undefined) {
                      menudata = await retrieveMenuData(rt_leafgraph.current, parsed_node_data.leaf.logic.type, menutype, n.uuid);
                      menudataLUT.leafelement = menudataLUT.leafelement ? 
                          {...menudataLUT.leafelement, [menutype]: menudata} :
                          {[menutype]: menudata}; // spark_dev_note: this is where node menu data is retrieved
                  }
              }
              else {
                  if (parsed_node_data.leaf.logic.type === "leafscreenio")
                      console.log("start debugging");

                  menudata = (Object.keys(menudataLUT).includes(parsed_node_data.leaf.logic.type) ?
                      menudataLUT[parsed_node_data.leaf.logic.type] : undefined);

                  if (menudata === undefined && menutype !== undefined) {
                      menudataLUT[parsed_node_data.leaf.logic.type] = await retrieveMenuData(rt_leafgraph.current, parsed_node_data.leaf.logic.type, menutype, n.uuid); // spark_dev_note: this is where node menu data is retrieved
                      menudata = menudataLUT[parsed_node_data.leaf.logic.type];
                  }

                  if (["leafconfig", "leaflisp"].includes(parsed_node_data.leaf.logic.type)) {
                      if (parsed_node_data.leaf.logic.type === "leafconfig") {
                          const config_methods = await props.etaTree.lookupLEAFNodeMethods(n.uuid);
                          console.log("start debugging");
                          //nodemenu_inputdata = await config_methods.config.getConfigData();
                      }
                      console.log("start debugging");
                  }
                  if (parsed_node_data.leaf.logic.type === "leafscreenio")
                      console.log("start debugging");
              }

              const _nodetype = parsed_node_data ? parsed_node_data.leaf.logic.type : null;
              const _default_to_default_menu = (_nodetype in debugmenu_default_rules ? 
                  (props.etaTree.graphcomponents.components.lut[n.uuid]?.scope === debugmenu_default_rules[_nodetype].scope) :
                  false
              );
              const a_node = {
                  id: n.uuid, // a field required by react-flow-renderer, pls do not remove.
                  type: _nodetype,
                  leafapi: apidef,
                  //leafnodetype,
                  position: parsed_node_data ? parsed_node_data.leaf.appdata.position : null,
                  //data: { ...parsed_node_data.leaf.logic.args, leaduuid: n.uuid}, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data
                  // spark_dev_note: data here is where sysmenu related data get injected as defined in apidef
                  data: { 
                      ...parsed_node_data, 
                      domain: props.graph.domain,
                      appid: props.graph.appid,
                      leaduuid: n.uuid, 
                      inputData: nodemenu_inputdata,
                      isInvalidName: isInvalidName, 
                      isdebug: props.debug, 
                      sysMenuData: menudata,
                      debugMenuData: debuggerGlobal.current.debugmenu ? ( (_nodetype in debuggerGlobal.current.debugmenu && !_default_to_default_menu) ? {diamonds: debuggerGlobal.current.debugmenu[_nodetype].diamonds} : {diamonds: debuggerGlobal.current.debugmenu._default.diamonds}) : undefined,
                      selected: (n.uuid in selectionstatus.current) ? selectionstatus.current[n.uuid] : false, // a field updated by react-flow-renderer
                  }, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data, this data object gets eventually passed down to leafnodetype (ie. the editor react component representing leaf nodes)
                  style: selectionstatus.current[n.uuid] ? { border: '1px solid #777', padding: 0, borderRadius: '5px' } : { border: '1px solid #777', padding: 2, borderRadius: '5px' },
                  ispersistent: true, // spark_dev_note: a placeholder boolean for implementing the feature to vary visualization of the rendered leaf node depending on whether it is stored up in the LEAFlake or is just being added in the LEAFeditor
              };

              el_list.nodes.push(a_node);
              console.log("el_list node added: ", a_node);
          }

          let edges = n.out_edges;

          edges.map((e) => {
              if (e.data) {
                  let parsed_edge_data = JSON.parse(decodeUnicode(e.data)); // base64 decode edge data from the leaf lake and convert its json string to js object
                  const an_edge = {
                      id: e.uuid,
                      type: parsed_edge_data.leaf.logic.type,
                      //leafnodetype,
                      //data: data_obj,
                      source: e.source.uuid,
                      target: e.target.uuid,
                      ..._edge_handle_dict[parsed_edge_data.leaf.logic.type],
                      style: _edge_style_dict[parsed_edge_data.leaf.logic.type],
                      //style: {fillOpacity: 0 , },
                      //data: { ...parsed_edge_data.leaf.logic.type, isdebug: props.debug},
                      data: { isdebug: props.debug },
                  };

                  el_list.edges.push(an_edge);
                  console.log("el_list edge added: ", an_edge);
              }
              return null;
          });

          return null;
      }));

      return el_list;
  };

  useEffect(() => {
    //const edge_handle_dict = {
    //  'leaflambdaedge': {sourceHandle: 'out_aux', targetHandle: 'in_aux'},
    //  'leafanchoredge': {sourceHandle: 'out_anchor', targetHandle: 'in_anchor'},
    //  'leafdataedge': {sourceHandle: 'out_a', targetHandle: 'in_a'},
    //}
    //const edge_style_dict = {
    //  'leaflambdaedge': {stroke: '#fff', fillOpacity: 0,},
    //  'leafanchoredge': {stroke: '#88f', fillOpacity: 0,},
    //  'leafdataedge': {stroke: '#fff', fillOpacity: 0,},
    //}

    // spark_dev_note: this is where an lut of sysMenuData per node type is built  
    // from the menu node data assembled from parsing the associated leaf logic, 
    // available via the standard leaf spellbook.
    //leafRuntimeRef.current.leafio = props.leafio;
    //{
    //    getCurLEAFIOState, 
    //    getMasterSubsDir,
    //    setNewLEAFIOState, 
    //    setLEAFIOCallback
    //};
    const host_domain = 'breezyforest';
    const host_appid = 'leafeditor';
    const lambdactrl = {
        gos: {
            standardSpellbook: {},
            curatedSpellbook: {},
            stdlambdalut: {},
            curatedlambdalut: {},
            //leafio: leafRuntimeRef.current.leafio,
            //etaTree: {mnemosyne: mainMnemosyne, domain: host_domain, appid: host_appid}, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
            leafio: props.leafio,
            etaTree: props.etaTree, // root etaTree
        }, 
        user: {
            spellbook: {},
            lambdalut: {},
        }
    };


    //const rt_leafgraph = await parseAddressableGraph('breezyforest/editor', props.etaTree, "editor"); // await getLEAFGraph; //.then((response) => {}) // async call to get leafgraph

    const updateNodes = (update) => {
        //const selectionstatus = {};

        const removallist = update.removed.map(_node=>_node.uuid);
        const removalapplied = graph_data.current.nodes.map(_node => {
            if (removallist.includes(_node.uuid)) {
                //if (_node.data.selected)
                //    selectionstatus[_node.uuid] = true;
                return undefined;
            }
            else
                return _node;
        }).filter(_=>_);

        const additionapplied = removalapplied.concat(update.added); 

        return additionapplied;
    };

    const handleGraphUpdate = async ({ data: { graph: {nodes, update }}, errors }) => {
      if (errors && errors.length > 0) {
        console.log(errors[0])
      };

      if (nodes === null && update !== null) {
        nodes = updateNodes(update);
      }
      if (nodes) {
        graph_data.current = {"nodes": nodes};
        console.log('vertice list updated');
        //graph_data.nodes = nodes; // update vertices 
        //setGraphData({"nodes": nodes, "edges": graph_data.edges});
        let el_list = await parseGraphNodesToEditorElements(nodes);
        if (el_list) {
          editorNodes.current = el_list.nodes;
          editorEdges.current = el_list.edges;
          need_rerender();
          //setElements(getLayoutedElements(editorElements.current));
          //setElements(editorElements.current);
          //setElements(el_list);
          //setElements((es) => es.concat(el_list));
        }
      };
      if (edges) { // deprecated
        console.log('edge list updated');
        console.log(edges);
        //graph_data.edges = edges; // update edges
        //setGraphData({"nodes": graph_data.nodes, "edges": edges});
      };
    };
    const subsCallback = (event) => {
      console.log(event);
      handleGraphUpdate(event);
    };
    const errorSubsCallback = (error) => {
        console.log('Error: ', error);
    };

    const editorGraphUpdateHandler = async ({ graph: {nodes, update }}={}) => {
        console.log(nodes);
        if (nodes === null && update !== null) {
            nodes = updateNodes(update);
        }
        if (nodes) {
            graph_data.current = {"nodes": nodes};
            // spark_dev_note: 23/Apr/2024
            // node update happens before etaTree update upstream at App.js propates down here
            // so the parseGraphNodestoEditorElements requiring an updated copy of etaTree should be triggerred later by other useEffect block listening on the etaTree changes
            //let el_list = await parseGraphNodesToEditorElements(nodes);
            //if (el_list) {
            //    editorNodes.current = el_list.nodes;
            //    editorEdges.current = el_list.edges;
            //    need_rerender();
            //    //setElements(editorElements.current);
            //    //setElements(el_list);
            //    //setElements((es) => es.concat(el_list));
            //}
        }
    }

    //const gql_subs_client = createClient({
    //  endpoint: endpoint_subs,
    //  headers: {
    //    'Content-Type': 'application/json',
    //  },
    //  websocket: {
    //    endpoint: websocket_subs,
    //    onConnectionSuccess: () => {
    //      console.log('gql_subs_client: Connected')
    //      try {
    //        gql_subs_client.subscribe(
    //          {
    //            //subscription: getLEAFgqlSubs(props.appid),
    //            subscription: getLEAFgqlSubs(props.graph),
    //            //subscription: getLEAFgqlSubs('temporary_test_appid'),
    //            //onGraphQLData: (data) => { console.log('gql_subs_client: onGraphQLData()', data)},
    //            //onGraphQLError: (data) => { console.log('gql_subs_client: onGraphQLError()', data)},
    //            onGraphQLComplete: (data) => { console.log('gql_subs_client: onGraphQLComplete() called with data:', data)},
    //          },
    //          subsCallback,
    //          errorSubsCallback
    //        );
    //      } catch (error) {
    //        console.log('Error: ', error);
    //      }
    //    },
    //    onConnectionError: () => console.log('gql_subs_client: Connection Error'),
    //  }
    //});
    //const gql_subs_client = initializeLEAFlakeGQLClient({
    //  _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_full,
    //});

    // now initiate a subscription query on a graph (async)
    //gql_subs_client.subs_methods.queryGraph({
    //    _mode: "editor",
    //    _domain: props.graph.domain,
    //    _appid: props.graph.appid,
    //    subsCallback: editorGraphUpdateHandler
    //});
    props.leafRuntime.graph$.pipe(filter(_=>_)).subscribe({
        next: (graph) => {
            editorGraphUpdateHandler(graph);
        }
    });

    const onFocusEventHandler = () => {
      console.log("window focus on");
      //console.log(gql_subs_client);
      // if client websocket is closing or closed
      // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
      //gql_subs_client.subs_methods.reconnect();
      props.leafRuntime.leaflakeio.subs_methods.reconnect();
      //if ([WebSocket.CLOSED,WebSocket.CLOSING].includes(gql_subs_client.clientContext.websocket.client.readyState)) {
      //  console.log("WebSocket currently not open or opening. Re-establishing the connection...");
      //  gql_subs_client.establishWS();
      //}
    }

    const onBlurEventHandler = () => {
      console.log("window focus off");
    }

    window.addEventListener("focus", onFocusEventHandler);
    window.addEventListener("blur", onBlurEventHandler);

    return () => { // the following is a clean up code akin to componentWillUnmount()
      editorNodes.current = [];
      editorEdges.current = [];
      //setElements([]);
      window.removeEventListener("focus", onFocusEventHandler);
      window.removeEventListener("blur", onBlurEventHandler)
    }
  }, []);

  useEffect(() => {
    //const getMenuGraphM = memoize((graphaddrstr) => {
    //    parseAddressableGraph(graphaddrstr, props.etaTree, "editor").then((_debugmenugraph) => {
    //        if (_debugmenugraph && Object.entries(_debugmenugraph).length > 0) {
    //            Object.keys(_debugmenugraph.jokermenu).map(_jokermenutype => {
    //                // spark_dev_note: _jokermenutype of value "_default" should be the default for all nodetypes other than spelldef as of 14 Mar 2024
    //                const _menufunc = (_jokermenutype === "_default") ? _debugmenugraph.jokermenu._default : _debugmenugraph.jokermenu[_jokermenutype]._default
    //                executeLEAFLogic(_menufunc, [], {}).then((_ret) => {
    //                    debuggerGlobal.debugmenu = {...debuggerGlobal.debugmenu, [_jokermenutype]: (doUnbottle("screenio", _ret))};
    //                    console.log("debuggerGlobal.debugmenu updated to include a jokermenutype named ",_jokermenutype);
    //                });
    //            });
    //        }
    //    });
    //});
    //// spark_dev_note: disabling the following line may be needed during debugging the debug menu
    //getMenuGraphM('breezyforest/nodejoker');

    const processEtaTreeChanges = async () => {
        const _debuggerG = {};
        const _debugmenugraph = await parseAddressableGraph("breezyforest/nodejoker", props.etaTree, "editor"); 
        if (_debugmenugraph && Object.entries(_debugmenugraph).length > 0) {
            const _ret_prom_array = Object.keys(_debugmenugraph.jokermenu).map(_jokermenutype => {
                // spark_dev_note: _jokermenutype of value "_default" should be the default for all nodetypes other than spelldef as of 14 Mar 2024
                const _menufunc = (_jokermenutype === "_default") ? _debugmenugraph.jokermenu._default : _debugmenugraph.jokermenu[_jokermenutype]._default
                return [_jokermenutype, executeLEAFLogic(_menufunc, [], {})]; 
            });
            const _ret_keys = _ret_prom_array.map(_=>_[0]);
            const _ret_array = await Promise.all(_ret_prom_array.map(_=>_[1]));
            
            for (let _ret_idx = 0; _ret_idx < _ret_array.length; _ret_idx++) {
                const _jokermenutype = _ret_keys[_ret_idx];
                const _ret = _ret_array[_ret_idx];
                _debuggerG.debugmenu = {..._debuggerG.debugmenu, [_jokermenutype]: (doUnbottle("screenio", _ret))};
                console.log("debuggerGlobal.debugmenu updated to include a jokermenutype named ",_jokermenutype);
            }
        }

        rt_leafgraph.current = await parseAddressableGraph('breezyforest/editor', props.etaTree, "editor"); // await getLEAFGraph; //.then((response) => {}) // async call to get leafgraph

        debuggerGlobal.current = _debuggerG; // update global ref

        //graph_data.current = {"nodes": nodes};
        const nodes = graph_data.current.nodes;
        if (nodes.length > 0) {
        let el_list = await parseGraphNodesToEditorElements(nodes);
        if (el_list) {
            editorNodes.current = el_list.nodes;
            editorEdges.current = el_list.edges;
            need_rerender();
            //setElements(editorElements.current);
            //setElements(el_list);
            //setElements((es) => es.concat(el_list));
        }
        }
    };
    processEtaTreeChanges();
  }, [props.etaTree]);

  useEffect(() => {
    need_rerender();
  }, [props.dimensions]);
    /*
    setElements(getLayoutedElements([
      {
        id: 'bc1',
        type: 'leafdatafilternode',
        data: { onChange: onTextChange, leaduuid: 'bc1' },
        style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
        //position: { x: 250, y: 50 },
      },
      {
        id: '1',
        type: 'input',
        data: { label: 'An input node', leaduuid: '1' },
        //position: { x: 0, y: 50 },
        sourcePosition: Position.Right,
      },
      {
        id: '2',
        type: 'leafutilitynode',
        data: { onChange: onColorChange, color: initBgColor, leaduuid: '2' },
        style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
        //position: { x: 250, y: 50 },
      },
      {
        id: '3',
        type: 'output',
        data: { label: 'Output A', leaduuid: '3' },
        //position: { x: 550, y: 25 },
        targetPosition: Position.Left,
      },
      {
        id: '4',
        type: 'output',
        data: { label: 'Output B', leaduuid: '4' },
        //position: { x: 550, y: 100 },
        targetPosition: Position.Left,
      },
      {
        id: 'bc2',
        type: 'leafdatafilternode',
        leafnodetype: 'leafdatafilternode',
        data: { onChange: onTextChange, leaduuid: 'bc2' },
        style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
        //position: { x: 250, y: 50 },
      },
      {
        id: 'bc3',
        type: 'leafdatafilternode',
        data: { onChange: onTextChange, leaduuid: 'bc3' },
        style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
        //position: { x: 250, y: 50 },
      },
      { id: 'bc_e3', source: 'bc1', target: '2', sourceHandle: 'out_aux', targetHandle: 'in_aux', type: 'leaflambdaedge', animated: false, style: {stroke: '#8ff', fillOpacity: 0 , }, data: { text: 'e1-2' } },
      { id: 'bc_e2', source: 'bc1', target: 'bc3', sourceHandle: 'out_a', targetHandle: 'in_a', type: 'leafdataedge', animated: false, style: {stroke: '#8ff', fillOpacity: 0 , }, data: { text: 'e1-2' } },
      { id: 'bc_e1', source: 'bc1', target: 'bc2', sourceHandle: 'out_anchor', targetHandle: 'in_anchor', type: 'leafanchoredge', animated: false, style: {stroke: '#8ff', fillOpacity: 0 , }, data: { text: 'e1-2' } },
      { id: 'e1-2', source: '1', target: '2', targetHandle: 'in_a', type: 'leafdataedge', animated: false, style: {stroke: '#fff', fillOpacity: 0 , }, data: { text: 'e1-2' } },
      { id: 'e2a-3', source: '2', type: 'leafdataedge', sourceHandle: 'out_a', target: '3', animated: false, style: { stroke: '#fff', fillOpacity: 0 }, data: { text: '' } },
      { id: 'e2b-4', source: '2', type: 'leafdataedge', sourceHandle: 'out_a', target: '4', animated: true, style: { stroke: '#fff', fillOpacity: 0 }, data: { text: '' } },
    ], 'LR'));
    */

  const onTouchStart = (event, node) => {
    //event.preventDefault();
    console.log('touch start', event, node);
    //event.target.dispatchEvent(new event.constructor(event.type, event));
    //event.preventDefault();
    //event.stopPropagation();
  };
  const onNodeDragStart = (event, node) => console.log('drag start', node);
    //const onNodeDragStop = (event, node) => console.log('drag stop', node);
  const onNodeDragStop = async (event, node) => { //(event: MouseEvent, node: Node)
    // here node is of type used and accepted by react-flow-renderer
    console.debug('floweditor/index.js: onNodeDragStop()', node);
    //const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    //const new_position = reactFlowInstance.project({
    //  x: event.clientX - reactFlowBounds.left - event.offsetX,
    //  y: event.clientY - reactFlowBounds.top - event.offsetY,
    //});
    //new_position.x -= event.offsetX;
    //new_position.y -= event.offsetY;
    //const node_data = { 
    //  leaf: {
    //    ...node.data,
    //    appdata: {
    //      position: node.position // screen position of the leafeditor node changed
    //    }
    //  }
    //};
    // converting react-flow-renderer's node data into leaf node data
    //const node_data = { 
    //  leaf: {
    //    ...node.data.leaf,
    //    appdata: {
    //      position: node.position // screen position of the leafeditor node changed
    //    }
    //  }
    //};
    //let json_data = JSON.stringify(node_data).getBytes("UTF-8");
    //let enc_data = sjcl.codec.base64.fromBits(json_data);
    //let dec_data = sjcl.codec.base64.toBits(enc_data);
    //let enc_data = Base64.stringify(json_data);

    // spark dev note: currently it's unclear whether the graphql updateNode mutation can support partial update,
    // that is updating only a portion of the data instead of updating the whole lot. 
    // In the current implementation, it was assumed that "partial update" isn't supported, 
    // hence the smallest unit update here is to replace the entire node data on each update 
    // even if it would only involve partial change in a single field. 
    //node.data.label?node.data.label:
    try {
          // the leaf.appdata.position is right and leaf.position is wrong. fix it. (6 Mar 2022)
      ////node.data.position = node.position; // update local memory to account for the server update delay
      //await mutateUpdateNode({variables: {uuid: node.data.leaduuid, label: '', data: btoa(JSON.stringify(node_data))}})
      console.debug('node.position', JSON.stringify(node.position));
      //setElements(elements.map((el) => {return (el.id === node.id) ? {...node, data: {...node.data, position: node.position}} : el})); // update local copy prior to server update
      //setElements(elements.map((el) => {return (el.id === node.id) ? {...node, position: node.position} : el})); // update local copy prior to server update
      const lead_node_displacement = {x: 0, y: 0};
      const selected_nodes = [];
      // iterate through current nodes, find the x,y displacements of the lead node
      editorNodes.current.map((el) => {
        if (el.id === node.id) { // lead node
            // record the node displacement in the x and y axis
            lead_node_displacement.x = node.position.x - el.position.x;
            lead_node_displacement.y = node.position.y - el.position.y;
            //const node_data = { 
            //    leaf: {
            //        ...node.data.leaf,
            //        appdata: {
            //            position: node.position // screen position of the leafeditor node changed
            //        }
            //    }
            //};
            //selected_nodes.push({uuid: node.data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))})
        }
      });
      // make all selected nodes displaced by the calculated values. 
      // store their updated data to selected_nodes
      editorNodes.current.map((el) => {
        if (el.data.selected) {
            const displaced_el_pos = {x: el.position.x + lead_node_displacement.x, y: el.position.y + lead_node_displacement.y};
            const node_data = { 
                leaf: {
                    ...el.data.leaf,
                    appdata: {
                        position: displaced_el_pos // screen position of the leafeditor node changed
                    }
                }
            };
            selected_nodes.push({uuid: el.data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))})
        }
        //{...node, position: node.position} : el
      });
      //setElements(editorElements.current);
      //need_rerender();
      selected_nodes.map(_node_data => {
        mutateUpdateNode({variables: _node_data});
      })
      //mutateUpdateNode({variables: {uuid: node.data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}})
      //.then(
      //  ({error}) => {
      //    console.log(error);
      //  }
      //);
    } catch (error) {
      console.error(error);
    }

  };
  const onLEAFNodesChange = useCallback((changes) => {
    //  onNodesChange(changes);
//      mutateUpdateNode({variables: {uuid: node.data.leaduuid, label: '', data: btoa(JSON.stringify(node_data))}}).then
    //const curTimestamp = Date.now();
    //const timeElapsedSinceLastSelection = curTimestamp - lastSelectionTimestamp.current;
    //lastSelectionTimestamp.current = curTimestamp;
    //const selectionstatus = {};
    changes.map( (change) => {
        if (change.type === 'remove') {
            mutateDelNode({node_uuid: change.id});
        }
        else if (change.type === 'select')
            selectionstatus.current[change.id] = change.selected;
    });
    //console.log(editorNodes.current);
    //setElements((els) => removeElements(elementsToRemove, els));
    const appliedchanges = applyNodeChanges(changes, editorNodes.current);
    
    // a little hack to pass the 'selected' status down to the leafnodetype/index.js
    const selectionlist = Object.keys(selectionstatus.current);
    const peppered_appliedchanges = appliedchanges.map( (change) => {
        if (selectionlist.includes(change.id)) {
            change.data.selected = selectionstatus.current[change.id];
            if (change.data.selected)
                change.style = {...change.style, padding: 0, borderRadius: '5px'};
            else {
                change.style = {...change.style, padding: 2, borderRadius: '5px'};
                delete selectionstatus.current[change.id];
            }
        }
        return change;
    });
    editorNodes.current = peppered_appliedchanges;

    need_rerender();
    //setElements(editorElements.current);
  }, []);

    function padZero(str, len) {
        len = len || 2;
        const zeros = new Array(len).join('0');
        return (zeros + str).slice(-len);
    }

    function invertColor(hex) {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        // invert color components
        const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
              g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
              b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
        // pad each with zeros and return
        return '#' + padZero(r) + padZero(g) + padZero(b);
    }

  const onEdgesChange = useCallback((changes) => {
//      mutateUpdateNode({variables: {uuid: node.data.leaduuid, label: '', data: btoa(JSON.stringify(node_data))}}).then
    let ischanged = false;
    changes.map(async (change) => {
        if (change.type === 'remove') {
            editorEdges.current = editorEdges.current.filter(el=> el.id !== change.id);
            mutateDelEdge({edge_uuid: change.id});
            ischanged = true;
        }
        else if (change.type === 'select') {
            if (change.selected) { // selected
                editorEdges.current = editorEdges.current.map(el => {
                    if (el.id === change.id) {
                        const defaultcolor = _edge_style_dict[el.type].stroke;
                        const selectedcolor = invertColor(defaultcolor);
                        const adapted_el = {...el, selected: true, style: {...el.style, stroke: selectedcolor}};
                        ischanged = true;
                        return adapted_el;
                    }
                    else {
                        return el;
                    }
                });
            }
            else { // unselected
                editorEdges.current = editorEdges.current.map(el => {
                    if (el.id === change.id) {
                        const defaultcolor = _edge_style_dict[el.type].stroke;
                        const default_el = {...el, selected: false, style: {...el.style, stroke: defaultcolor}};
                        ischanged = true;
                        return default_el;
                    }
                    else {
                        return el;
                    }
                });
            }
        }
    });
    //setElements((els) => removeElements(elementsToRemove, els));
    applyEdgeChanges(changes, editorEdges.current);
    if (ischanged)
        need_rerender();
    //setElements(editorElements.current);
  }, []);

  const addEdgeToScreenList = (edgeuuid, edgetype, sourceuuid, targetuuid) => {
    const an_edge = {
        id: edgeuuid,
        type: edgetype,
        //leafnodetype,
        //data: data_obj,
        source: sourceuuid,
        target: targetuuid,
        ..._edge_handle_dict[edgetype],
        style: _edge_style_dict[edgetype],
        //style: {fillOpacity: 0 , },
        data: {isdebug: props.debug},
    };

    editorEdges.current = editorEdges.current.concat(an_edge);
  };

  const onConnect = async (params) => { //(params: Connection | Edge)
    if (params.source !== params.target) {
      const existingedge = editorEdges.current.filter(el=> el.source === params.source && el.target === params.target);
      if (existingedge.length > 0) {
        console.log("trying to add an edge that already exists");
        return;
      }

      if (params.sourceHandle === 'out_aux' && params.targetHandle === 'in_aux') {
        //const targetlambda = elements.filter(el => el.targetHandle === 'in_aux' && el.target === params.target) 
        const edgetype = 'leaflambdaedge';
        const existingedge = editorEdges.current.filter(el => el.type === edgetype && el.source === params.source && el.target === params.target);
        if (!existingedge[0]) { // this check would limit the number of leaflmabdaedge type edges between the source and the target to 1
          const edge_uuid = uuidv4();
          const edge_data = { 
            leaf: {
              api: LEAF_VERSION,
              logic: {
                type: edgetype,
              }
            }
          };
          addEdgeToScreenList(edge_uuid, edgetype, params.source, params.target);
          await mutateAddEdge({variables: {uuid: edge_uuid, sourceuuid: params.source, targetuuid: params.target, graphdomain: props.graph.domain, graphappid: props.graph.appid, provdomain: LEAF_VERSION, provappid: 'leafeditor', data: encodeUnicode(JSON.stringify(edge_data))}});
          //setElements((els) => addEdge({ ...params, type: edgetype, animated: false, style: { stroke: '#fff', fillOpacity: 0 }, data: { text: '' } }, els));
          addEdge({ ...params, type: edgetype, animated: false, style: { stroke: '#fff', fillOpacity: 0 }, data: { text: '' } }, editorEdges.current);
          need_rerender();
          //setElements(editorElements.current);
        }
      }
      else if (params.sourceHandle === 'out_anchor' && params.targetHandle === 'in_anchor') {
        const edgetype = 'leafanchoredge';
        const targetanchor = editorEdges.current.filter(el => el.targetHandle === 'in_anchor' && el.target === params.target) 
        if (!targetanchor[0]) { // this check would limit the number of in-bound connections into in_anchor to 1
          const edge_uuid = uuidv4();
          const edge_data = { 
            leaf: {
              api: LEAF_VERSION,
              logic: {
                type: edgetype,
              }
            }
          };
          addEdgeToScreenList(edge_uuid, edgetype, params.source, params.target);
          await mutateAddEdge({variables: {uuid: edge_uuid, sourceuuid: params.source, targetuuid: params.target, graphdomain: props.graph.domain, graphappid: props.graph.appid, provdomain: LEAF_VERSION, provappid: 'leafeditor', data: encodeUnicode(JSON.stringify(edge_data))}});
          //setElements((els) => addEdge({ ...params, type: edgetype, animated: false, style: { stroke: '#88f', fillOpacity: 0 }, data: { text: '' } }, els));
          addEdge({ ...params, type: edgetype, animated: false, style: { stroke: '#88f', fillOpacity: 0 }, data: { text: '' } }, editorEdges.current);
          need_rerender();
          //setElements(editorElements.current);
        }
      }
      else if ((params.sourceHandle !== 'out_aux' && params.targetHandle !== 'in_aux') && 
      (params.sourceHandle !== 'out_anchor' && params.targetHandle !== 'in_anchor')) {
        const edgetype = 'leafdataedge';
        const edge_uuid = uuidv4();
        const edge_data = { 
          leaf: {
            api: LEAF_VERSION,
            logic: {
              type: edgetype,
            }
          }
        };
        addEdgeToScreenList(edge_uuid, edgetype, params.source, params.target);
        await mutateAddEdge({variables: {uuid: edge_uuid, sourceuuid: params.source, targetuuid: params.target, graphdomain: props.graph.domain, graphappid: props.graph.appid, provdomain: LEAF_VERSION, provappid: 'leafeditor', data: encodeUnicode(JSON.stringify(edge_data))}});
        //setElements((els) => addEdge({ ...params, type: edgetype, animated: false, style: { stroke: '#fff', fillOpacity: 0 }, data: { text: '' } }, els));
        addEdge({ ...params, type: edgetype, animated: false, style: { stroke: '#fff', fillOpacity: 0 }, data: { text: '' } }, editorEdges.current);
        need_rerender();
        //setElements(editorElements.current);
      }

    }
    else {
      console.log("no self loop allowed")
    }
  }

  /*
      <MiniMap
        nodeStrokeColor={(n: Node): string => {
          if (n.type === 'input') return '#0041d0';
          if (n.type === 'leafnode') return bgColor;
          if (n.type === 'output') return '#ff0072';

          return '#eee';
        }}
        nodeColor={(n: Node): string => {
          if (n.type === 'leafnode') return bgColor;
          if (n.type === 'leafdatafilternode') return '#33f3f0'; // this color determines the minimap appearance
          if (n.type === 'leafdatacombinenode') return '#003fff'; // ditto

          return '#fff';
        }}
      />
  */
  // spark_dev_note: the current behavior of leaf_editor client getting re-connected to LEAF graphql server
  // ensures that up-to-date leaf logic is displayed across multiple client interfaces in the event of 
  // disconnections due to various reasons. 
  // The current implementation relies on window-level onFocus event to triage the need to re-establish the websocket
  // and the graphql subscription needed. This means that the displayed leaf logic might still become stale 
  // if the editor window is left without losing focus. 
  // The JSX return in the following can be modified to have conditional rendering
  // dependent upon the WS connection status, in order to prevent that route of leaf logic going stale. 
  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{height:props.dimensions.height, width: props.dimensions.width, zIndex:0}} >
    <ReactFlow
      //fitView
      //viewport={{x: 2300, y: 500, zoom: 1.5}}
      className="touchdevice-flow"
      nodes={editorNodes.current}
      edges={editorEdges.current}
      elementsSelectable={isSelectable}
      //nodesConnectable={isConnectable}
      //onElementClick={onElementClick}
      // spark_dev_note: dig into using touch related callbacks to make this editor mobile device compliant
      // https://reactflow.dev/docs/examples/interaction/touch-device/
      // https://stackoverflow.com/questions/27837500/drag-and-drop-with-touch-support-for-react-js
      //onTouchMove={onLEAFNodesChange} 
      onNodesChange={onLEAFNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      //onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      //onNodeClick={onTouchStart}
      style={{ background: bgColor }}
      onInit={onInit}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionLineStyle={connectionLineStyle}
      snapToGrid={true}
      snapGrid={snapGrid}
      //defaultZoom={1.5}
    >
      <Controls />
    </ReactFlow>
    </div>
  );
};

//export function LEAFEditor(props) {
//  const { domain, appid } = useParams();
//  return (
//    <ClientContext.Provider value={GRAPHQL_CLIENT}>
//      <ReactFlowProvider>
//        <LEAFEditorCore graph={{domain: domain, appid: appid}} />
//      </ReactFlowProvider>
//    </ClientContext.Provider>
//  );
//}

function LEAFEditor(props) {
  const [renderid, setRenderid] = useState(undefined);
  const editorid = uuidv5(leafgon_url+"/"+props.domain+"/"+props.appid, uuidv5.URL);
  const popupMenu = props.menudata ? useLEAFPopupMenu({data: {isdebug: true, leaduuid: props.nodeuuid, sysMenuData: props.menudata, zIndex: props.zIndex}}) : undefined;


    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const need_rerender = () => {
        setRenderid(uuidv4());
    };
  //const { domain, appid } = useParams();
  useEffect(() => {
      need_rerender();
  }, [props.dimensions, props.etaTree]);
  return (
      <ReactFlowProvider>
        <LEAFEditorCore zIndex={props.zIndex} nodeuuid={editorid} menudata={props.menudata} graph={{domain: props.domain, appid: props.appid}} dimensions={props.dimensions} debug={props.debug} leafRuntime={props.leafRuntime} etaTree={props.etaTree} leafio={props.leafio} masterSubsDir={props.masterSubsDir} />
        <span style={{zIndex: props.zIndex+10, pointerEvents: "none", display: "flex", position: "relative", width: "100%", top: -props.dimensions.height+30, justifyContent: "center"}}>
            <div style={{position: "relative", display: "block"}}>
            {
                popupMenu
            }
            </div>
        </span>
      </ReactFlowProvider>
  );
}

export { LEAFEditor };
