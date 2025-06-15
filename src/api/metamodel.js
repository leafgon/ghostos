/************************************ 
 *
 * author: spark@leautomaton.com
 * date: 5th Nov 2021
 * 
 ************************************/

import {map} from 'rxjs/operators';

// LEAF IO message metamodel and its type definition
// {
//     "control": {
//         "provenance": {
//             "stateObjInstanceID": UUID_Type, 
//             "dataOrigin": OriginType
//         }
//     }, 
//     "data": {nodes: [], edges: []}
// }
// test GQL URIs
const leafgon_url = process.env.LEAFGON_URL;
const endpoint_subs = process.env.LEAFGON_ENDPOINT_SUBS; //"http://localhost:10001/sgraphql";
const websocket_subs = process.env.LEAFGON_WEBSOCKET_SUBS; //"ws://localhost:10001/sgraphql";
const endpoint_qm = process.env.LEAFGON_ENDPOINT_QM; // "http://localhost:10001/qmgraphql";
// production GQL URIs
//const endpoint_subs = "https://www.leafgon.com:10001/sgraphql",
//const websocket_subs = "ws://www.leafgon.com:10001/sgraphql",
//const endpoint_qm = "https://www.leafgon.com:10001/qmgraphql",

const LEAFIOmetamodel = {
    breezyforest: {
        _version: "1.0",
        _nickname: "breezyforest",
        scaffold: {
            map: {
                leaf: {
                    logic: {
                        type: '',
                        args: {
                        }
                    },
                    provenance: {
                        api: 'breezyforest',
                        uuid: '', // id of an element (either node or edge), a member of one or many graphs
                        graph: { // information on the graph used to provision this data spark_dev_note: this field may need to be stored elsewhere, not as part of each and every node, as it may vary query to query
                            appuuid: '', // aka graph uuid
                            name: '',
                            version: ''
                        }
                    },
                    appdata: {
                        // spark_dev_note: need to sort out the domain of appdata here
                        // whether it should refer to the leafeditor as versus to the leafapp used in returning the graph
                        // or maybe both 
                        // leafeditor should be able to store/retrieve a 2d coordinate point for each node defined/declared in leaf, for instance.
                    }
                }
            },
            directory: {
                'api': ['leaf', 'api'],
                'logic': ['leaf', 'logic'],
                'type': ['leaf', 'logic', 'type'],
                'args': ['leaf', 'logic', 'args'],
                'provenance': ['leaf', 'provenance'],
                'uuid': ['leaf', 'provenance', 'uuid'],
                'leafapp': ['leaf', 'provenance', 'leafapp'],
                'appdata': ['leaf', 'appdata']
            },
            fetch: (n_e, crawlkey) => { // crawlkey can be either an array or a string
                const fetchDive = (x,y) => {
                    const car = y[0]; // a lispian pun I guess...
                    const cdr = y.slice(1);
                    if (cdr.length === 0)
                        return x[car];

                    // a coding style attempted for tail-call-optimization 
                    // For explanation, pls refer to https://2ality.com/2015/06/tail-call-optimization.html
                    return fetchDive(x[car], cdr); 
                };
                try {
                    return fetchDive(n_e, Array.isArray(crawlkey) ? crawlkey : LEAFIOmetamodel.breezyforest.scaffold.directory[crawlkey]);
                }
                catch (e) { // a catch-all scenario in case things didn't work including crawlkey failing to match
                    return null;
                }
            }
        },
        originType: {"FRONTEND": 1, "BACKEND": 2, "SCREEN": 4},
        subsDirectory: {
            readmefirst: {}, 
            leaflake: { 
                bridges: {
                    gql: 'clientconfig_full' 
                }
            }, 
            appintent: {}, 
            appmodel: {}, 
            appview: {},
            osview: {},
            osview2: {},
            dataflowplane: {},
            appcache: {},
        },
        IOAccessPermission: { // to be used with bitwise operators
            Owner: 0x1, 
            Observer: 0x2, 
            Contributor: 0x4, 
            All: 0x7
        }, 
        IOStateGroundZero: { // to provide a scaffold of memory structures for LEAF app states
            "dirOfSubjects": {}, // stores keyed instances of observable subjects (rxjs BehaviorSubject) (one key, one subject)
            "subsCache": {}, // stores keyed instances of up-to-date observed messages of subjects subscribed (one key, one cache per subject)
            "subscriptions": {}, // stores keyed instance of subscriptions (One key, one subscription per subject)
            "callbacks": {}, // stores keyed callbacks to be called upon the arrival of subscribed messages (One key, one callback per subject)
            // spark_dev_note: The V1.0 implementation of LEAFIOmetamodel (i.e. leafio) allows non-contributing observers to attach 
            // any callbacks as desired. 
            // However, callbacks inducing mutations in any states may end up (undesirably) affecting the global scope of the app state. 
            // Take a closer look at API usage scenarios to better understand any security implications of having this allowed.
            "permissions": {}, // stores keyed permissions to read and/or write about subjects. (One key, one permission per subject) 
        },
        GQLParameters: {
            clientconfig_full: {
                keepGQLConnected: true,
                dburi_subs: endpoint_subs,
                dburi_subs_ws: websocket_subs,
                dburi_qm: endpoint_qm,
            },
            clientconfig_sub: {
                keepGQLConnected: true,
                dburi_subs: endpoint_subs,
                dburi_subs_ws: websocket_subs,
            },
            clientconfig_qm: {
                dburi_qm: endpoint_qm,
            },
            masterquery: `
                {
                    domain
                    appid
                    nodes {
                        uuid
                        out_edges {uuid source {uuid} target {uuid} data}
                        data
                    }
                    update {
                        added {uuid out_edges {uuid source {uuid} target {uuid} data} data} 
                        removed {uuid}
                    }
                }
            `.replace(/\s+/g, ' '), // remove all redundant white spaces in string prior to use, allowing more readable query code to be recorded here
        },
        LEAFdictionary: {
            'map': map
        }
    }
};

const elements_lib = {
    // (11 Mar 2022) refactor and migrate and consolidate the management of all elements to leafelement
    
    'leafgnav': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafelement',
                args: {
                    elementname: 'leafdeckclub',
                    svgicon: {unicode: undefined,
                        url: 'club3.svg',
                        jsx: undefined,
                    },
                    elementconfig: {
                        leafnodename: '',
                    }
                }
            }
        },
        lambdaports: {
            input: undefined,
            output: Object
        },
        dataflow: {
            input: {
                _leafdeckclubinit: Object,
            }, 
            output: {
                _leafdeckclub: Object,
            }
        }
    },
    'leafpopupview': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafelement',
                args: {
                    elementname: 'leafdeckclub',
                    svgicon: {unicode: undefined,
                        url: 'club3.svg',
                        jsx: undefined,
                    },
                    elementconfig: {
                        leafnodename: '',
                    }
                }
            }
        },
        lambdaports: {
            input: undefined,
            output: Object
        },
        dataflow: {
            input: {
                _leafdeckclubinit: Object,
            }, 
            output: {
                _leafdeckclub: Object,
            }
        }
    },    // (11 Mar 2022) refactor and migrate this to leafelement
};

// leafstdlib dataflow js api
const _leafstdlib_dataflow_api = (type) => {
    const _breezyforestapi = {
    'leafradioRX': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafradioRX',
                args: {
                    keyname: '',
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['keyname'],
            bannednames: ['Lambda'],
            banduplicatename: true,
            banmultiplenode: false,
            svgicon: {unicode: undefined,
                url: 'leafradioRX.svg',
                width: 40,
                height: 30,
                bgColor: 'rgba(235,255,35,0.2)',
                jsx: undefined,
            },
        },
        lambdaports: {
            input: undefined,
            output: undefined
        },
        dataflow: {
            input: undefined, 
            output: {
                _leafradiokey: {
                    keyname: '',
                    subsDirectory: Object,
                },
                _leafradiorx: {
                    txkey: '',
                    payload: Object,
                }
            }
        }
    },
    'leafradioTX': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafradioTX',
                args: {
                    keyname: '',
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['keyname'],
            bannednames: ['Lambda'],
            banduplicatename: false,
            banmultiplenode: false,
            svgicon: {
                unicode: undefined,
                url: 'leafradioTX.svg',
                width: 40,
                height: 30,
                bgColor: 'rgba(135,255,135,0.2)',
                jsx: undefined,
            },
        },
        lambdaports: {
            input: undefined,
            output: undefined
        },
        dataflow: {
            input: {
                _leafradiokey: {
                    keyname: '',
                    subsDirectory: Object,
                },
                _leafradiotx: {
                    txkey: '',
                    payload: Object,
                }
            }, 
            output: undefined
        }
    },
    'leafoutflowport': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafoutflowport',
                args: {}
            }
        },
        editorconfig: {
            nodetype: 'tinynode',
//            namedatakey: ['keyname'],
            //allowmultiplenode: true,
            svgicon: {
                unicode: '\u2296', // minus sign in circle /// '\u2A2E', // plus sign in right half circle ⨮
                url: undefined,
                jsx: undefined,
                fgColor: 'rgba(255,255,255,1)',
                bgColor: 'rgba(22,22,55,1)',
            },
        },
        lambdaports: {
            input: undefined,
            output: undefined
        },
        dataflow: {
            input: Object, 
            output: undefined
        }
    }, 
    'leafinflowport': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafinflowport',
                args: {}
            }
        },
        editorconfig: {
            nodetype: 'tinynode',
//            namedatakey: ['keyname'],
            //allowmultiplenode: true,
            svgicon: {
                unicode: '\u2295', // circled plus //// '\u2A2D', // plus sign in left half circle ⨭
                url: undefined,
                jsx: undefined,
                fgColor: 'rgba(255,255,255,1)',
                bgColor: 'rgba(55,22,22,1)',
            },
        },
        lambdaports: {
            input: undefined,
            output: undefined
        },
        dataflow: {
            input: undefined, 
            output: Object
        }
    },
    'leafmemoryio': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafmemoryio',
                args: {
                    //elementname: 'leafdeckheart',
                    elementconfig: {
                        leafnodename: '',
                    },
                    // persistencyref is disregarded for local memoryio, as its use is only for global scoped memoryio.
                    persistencyref: {   // a uuid4 written up in the cloud upon the relevant global memory being written
                        updateref: '',  // changing updateref would trigger graphql data to be updated in gql clients
                        dbref: ''       // dbref is then used as a reference to query the relevant database for the persistent data.
                    }                   
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['elementconfig', 'leafnodename'],
            banduplicatename: false,
            banmultiplenode: false,
            svgicon: {
                iconname: 'memory io',
                unicode: undefined,
                url: 'leafmemoryio.svg',
                jsx: undefined,
                width: 40,
                height: 40,
                bgColor: 'rgba(255,255,255,0.6)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: {
                _leafdeckdiamond: Object,
                _leafdeckclub: Object,
            }, 
            output: {
                _leafdeckheart: Object,
            }
        }
    },
    'leafscreenio': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafscreenio',
                args: {
                    lispexpression: '',
                    //lispnodename: 'leaflisp'
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            //namedatakey: ['lispnodename'],
            banduplicatename: false,
            banmultiplenode: false,
            svgicon: {
                iconname: 'screen io',
                unicode: undefined,
                url: 'leafscreenio.svg',
                jsx: undefined,
                width: 40,
                height: 40,
                bgColor: 'rgba(205,155,215,0.6)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: {
                _leaflisp_in: Object,
            }, 
            output: {
                _leaflisp_out: Object,
            }
        }
    },
    // leaf elements
    'leafdeckspade': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafdeckspade',
                args: {
                    //elementname: 'leafdeckspade',
                    elementconfig: {
                        leafnodename: '',
                    }
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            namedatakey: ['elementconfig','leafnodename'],
            //allowmultiplenode: false,
            banmultiplenode: true,
            //svgicon: {
            //    unicode: undefined,
            //    url: undefined,
            //    jsx: 
            //        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
            //        <path d="M7.184 11.246A3.5 3.5 0 0 1 1 9c0-1.602 1.14-2.633 2.66-4.008C4.986 3.792 6.602 2.33 8 0c1.398 2.33 3.014 3.792 4.34 4.992C13.86 6.367 15 7.398 15 9a3.5 3.5 0 0 1-6.184 2.246 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907z"/>
            //        </svg>
            //},
            svgicon: {
                unicode: undefined,
                url: 'leafspade.svg',
                jsx: undefined,
            },
        },
        lambdaports: {
            input: Object, //undefined,
            output: Object
        },
        dataflow: {
            input: {
                _leafdeckdiamond: Object,
                _leafdeckclub: Object,
            }, 
            output: {
                _leafdeckspade: Object,
            }
        }
    },
    'leafdeckheart': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafdeckheart',
                args: {
                    //elementname: 'leafdeckheart',
                    elementconfig: {
                        leafnodename: '',
                    }
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['elementconfig', 'leafnodename'],
            banduplicatename: true,
            banmultiplenode: false,
            //svgicon: {unicode: undefined,
            //    url: undefined,
            //    jsx: 
            //        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f8f" className="bi bi-suit-spade-fill" viewBox="0 0 16 16">
            //        <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z"/>
            //        </svg>
            //},
            svgicon: {
                unicode: undefined,
                url: 'leafheart.svg',
                jsx: undefined,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: {
                _leafdeckdiamond: Object,
                _leafdeckclub: Object,
            }, 
            output: {
                _leafdeckheart: Object,
            }
        }
    },
    'leafdeckdiamond': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafdeckdiamond',
                args: {
                    //elementname: 'leafdeckdiamond',
                    elementconfig: {
                        leafnodename: '',
                    }
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['elementconfig', 'leafnodename'],
            svgicon: {unicode: undefined,
                url: 'diamond2.svg',
                jsx: undefined,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: {
                _leafdeckclub: Object,
            }, 
            output: {
                _leafdeckdiamond: Object,
            }
        }
    },
    'leafdeckclub': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafdeckclub',
                args: {
                    //elementname: 'leafdeckclub',
                    elementconfig: {
                        leafnodename: '',
                    }
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['elementconfig', 'leafnodename'],
            svgicon: {unicode: undefined,
                url: 'club3.svg',
                jsx: undefined,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: {
                _leafdeckclubinit: Object,
            }, 
            output: {
                _leafdeckclub: Object,
            }
        }
    },
    'leafelement': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafelement',
                args: {
                    elementname: '',
                    svgicon: {unicode: undefined,
                        url: '',
                        jsx: Object,
                    },
                    elementconfig: ''
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            is_committable: true,
            namedatakey: ['elementname'],
            //bannednames: ['Lambda'],
            allowednames: ['gnav', 'popup', 'editor', 'text', 'prompt', 'http', 'href', 'mediaplayer', 'image', 'mediainput', 'midi', 'sound', 'html', 'form', 'directus', 'openai', 'rancher'],
            banduplicatename: false,
            banmultiplenode: false,
            svgicon: {
                unicode: undefined,
                url: 'leafelement.svg', // squaredcircle.svg
                width: 40,
                height: 40,
                bgColor: 'rgba(35,5,15,0.7)',
                fgColor: 'rgba(255,255,255,1)',
                jsx: undefined,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object, 
            output: Object
        }
    }, // shall support a growing list of element types and their UX definitions such as leafgnav, leafpopup, leafeditor, leafimage, leafvideo, leafaudio, leaftext, leafd3, leafgraphics etc.
    // leaf abstraction
    'leafgraph': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafgraph',
                args: {
                    graphuuid: '',
                    domain: '',
                    appid: '',
                    graphaddrstr: '',
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['graphaddrstr'],
            svgicon: {
                unicode: '\u2735', // pinwheel_star symbol ✵
                url: undefined, //'leafgraph.svg',
                jsx: undefined,
                fgColor: 'rgba(255,255,255,1.0)',
                bgColor: 'rgba(220,02,100, 0.5)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },                // completed 5 feb 2022, changed the name from _leafapp to _leafgraph on 9 Mar 2022
    'leaflambdagraph': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leaflambdagraph',
                args: {
                    //lambdanodename: 'lambda graph'
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            //namedatakey: ['lambdanodename'],
            svgicon: {
                iconname: 'contextual lambda',
                unicode: '\u03BB',
                url: undefined,
                jsx: undefined,
                fgColor: 'rgba(255,255,255,1.0)',
                bgColor: 'rgba(0,0,0,0.5)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },    // completed 20 jan 2022
    'leafanchor': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafanchor',
                args: {}
            }
        },
        editorconfig: {
            nodetype: 'tinynode',
            svgicon: {
                unicode: undefined, //'\u2646', // anchor_symbol ♆
                url: 'trident_white.svg', 
                width: 15,
                height: 15,
                jsx: undefined,
                fgColor: 'rgba(255,255,255,1)',
                bgColor: 'rgba(102, 102, 255, 1)',
            },
        },
        lambdaports: {
            input: undefined,
            output: undefined
        },
        dataflow: {
            input: undefined,
            output: undefined,
        }
    },
    'leafspelldef': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafspelldef',
                args: {
                    spellname: '',
                    svgicon: {unicode: undefined,
                        url: '',
                        jsx: Object,
                    },
                }
            }
        },
        editorconfig: {
            //nodetype: 'circularnamednode',
            nodetype: 'rectangularnamednode',
            namedatakey: ['spellname'],
            banduplicatename: true,
            svgicon: {
                iconname: 'spelldef',
                unicode: undefined,
                url: 'leafspell.svg',
                jsx: undefined,
                bgColor: 'rgba(80,80,135,0.8)',
                fgColor: 'rgba(250,250,250,1.0)',
                width: 40,
                height: 30,
            },
        },
        lambdaports: {
            input: Object,
            output: undefined, 
        },
        dataflow: {
            input: undefined,
            output: undefined,
        }
    },  // changed the name from _leafoperator to _leafspelldef and _leafspell on 9 Mar 2022
    'leafspell': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafspell',
                args: {
                    spellname: '',
                }
            }
        },
        editorconfig: {
            //nodetype: 'rectangularnamednode',
            nodetype: 'circularnamednode',
            namedatakey: ['spellname'],
            svgicon: {
                unicode: undefined,
                //url: 'leafspell.svg',
                url: 'leafloopyspell.svg',
                jsx: undefined,
                //bgColor: 'rgba(80,80,135,0.8)',
                //fgColor: 'rgba(250,250,250,1.0)',
                bgColor: 'rgba(80,180,135,0.8)',
                fgColor: 'rgba(250,250,250,1.0)',
                width: 40,
                height: 30,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },         // parsing this type is taken care of separately in three parsing steps involving leaf standard spells, leaf curated spells and user-defined spells
    'leafloopyspell': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafloopyspell',
                args: {
                    //spellname: '',
                }
            }
        },
        editorconfig: {
            nodetype: 'rectangularnode',
            //namedatakey: ['spellname'],
            banduplicatename: true,
            svgicon: {
                iconname: 'loopy spell',
                unicode: undefined,
                url: 'leafloopyspell.svg',
                jsx: undefined,
                bgColor: 'rgba(80,180,135,0.8)',
                fgColor: 'rgba(250,250,250,1.0)',
                width: 40,
                height: 30,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    }, // a new concept consolidating the likes of 'map' among reactive operators, but in a themetically more compatible fashion. 
    // leaf dataflow utils
    'leafsyncflow': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafsyncflow',
                args: {
                    //clockname: 'sync'
                }
            }
        },
        // as in lambdactrl.gos.leaf.fconfig
        fconfig: {
            inputsync: {
                combineOperator: 'combine', // as defined in leaf.js combineOpDictionary, a choice of merge, combine, combineLatest, concat, or race
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            //namedatakey: ['clockname'],
            svgicon: {unicode: undefined,
                iconname: 'sync',
                url: 'leafsyncflow.svg',
                jsx: undefined,
                bgColor: 'rgba(80,200,255,1.0)',
                width: 40,
                height: 40,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },
    'leafchronosflow': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafchronosflow',
                args: {
                    //clockname: 'sync'
                }
            }
        },
        // as in lambdactrl.gos.leaf.fconfig
        fconfig: {
            inputsync: {
                combineOperator: 'combine', // as defined in leaf.js combineOpDictionary, a choice of merge, combine, combineLatest, concat, or race
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            //namedatakey: ['clockname'],
            svgicon: {unicode: undefined,
                iconname: 'Chronos',
                url: 'leafsyncflow.svg',
                jsx: undefined,
                bgColor: 'rgba(80,200,255,1.0)',
                width: 40,
                height: 40,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },
    'leafasyncflow': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafasyncflow',
                args: {
                    //clockname: 'sync'
                }
            }
        },
        // as in lambdactrl.gos.leaf.fconfig
        fconfig: {
            inputsync: {
                combineOperator: 'combine', // as defined in leaf.js combineOpDictionary, a choice of merge, combine, combineLatest, concat, or race
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            //namedatakey: ['clockname'],
            svgicon: {unicode: undefined,
                iconname: 'async',
                url: 'leafsyncflow.svg',
                jsx: undefined,
                bgColor: 'rgba(80,200,255,1.0)',
                width: 40,
                height: 40,
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },
    'leafmixflow': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafmixflow',
                args: {
                    mixOperator: 'merge', // mixing data as in array.zip or .concat 
                    //mixnodename: 'mix',
                }
            }
        },
        // as in lambdactrl.gos.leaf.fconfig
        fconfig: {
            inputsync: undefined
        },
        editorconfig: {
            nodetype: 'circularnode',
            //namedatakey: ['mixnodename'],
            svgicon: {
                iconname: 'mix',
                unicode: undefined,
                url: 'leafmixflow.svg',
                jsx: undefined,
                bgColor: 'rgba(80,150,255,0.8)',
                width: 40,
                height: 40,
            },
        },
        lambdaports: {
            input: Object, // do the mixing if lambdaFunc evaluates true
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },
    'leafgateflow': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafgateflow',
                args: {
                    keyname: '',
                    notgatetoggle: false // true: it is a NOT gate, false: it is a normal gate
                }
            }
        },
        // as in lambdactrl.gos.leaf.fconfig
        fconfig: {
            inputsync: {
                combineOperator: 'merge', // as defined in leaf.js combineOpDictionary, a choice of merge, zip, zipLatest, concat, or race
            }
        },
        editorconfig: {
            nodetype: 'circularnamedboolnode',
            namedatakey: ['keyname'],
            toggledatakey: ['notgatetoggle'],
            svgicon: {
                unicode: undefined,
                //url: 'leafgateflow.svg',
                url: 'leafgate.svg',
                jsx: undefined,
                width: 40,
                height: 30,
                bgColor0: 'rgba(135,55,135,0.2)',
                bgColor1: 'rgba(35,255,135,0.2)',
                toggleSymbol0: '\u229c', // equality symbol
                toggleSymbol1: '\u2260', // inequality symbol
            },
        },
        lambdaports: {
            input: Object, // do the gating if lambdaFunc evaluates true
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },
    'leaflabel': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leaflabel',
                args: {
                    labelstr: '',
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey:['labelstr'],
            svgicon: {
                unicode: undefined,
                url: 'leaflabel.svg',
                jsx: undefined,
                width: 40,
                height: 30,
                bgColor: 'rgba(165,55,185,0.7)',
            },
        },
        lambdaports: {
            input: Object, // do the label in the lambda graph scope
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },        // completed 5 feb 2022 
    'leafdelabel': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafdelabel',
                args: {
                    labelstr: ''
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['labelstr'],
            svgicon: {
                unicode: undefined,
                url: 'leafdelabel.svg',
                jsx: undefined,
                width: 40,
                height: 30,
                bgColor: 'rgba(235,55,135,0.7)',
            },
        },
        lambdaports: {
            input: Object, // do the delabel in the lambda graph scope 
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },    // completed 5 feb 2022
    //                                   // use bottle/unbottle to support structuring/destructuring of json objects, 
    //'leafbottle2json': {
    //    input: {

    //    }, 
    //    output: {

    //    }
    //}, //(spark_dev_note: (11 Mar 2022) use this bottle 2 json converter prior to consumption by leaflisp)
    //'leafjson2bottle': {
    //    input: {

    //    }, 
    //    output: {

    //    }
    //}, //(spark_dev_note: (11 Mar 2022) use this json 2 bottle converter prior to data consumption by any leaf constructs downstream of leaflisp)
    // spark_dev_note: implement these two converters built into _leaflisp
    'leafbottle': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafbottle',
                args: {
                    bottlekey: ''
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['bottlekey'],
            banduplicatename: false,
            banmultiplenode: false,
            svgicon: {unicode: undefined,
                url: 'leafbottle.svg',
                jsx: undefined,
                width: 40,
                height: 30,
                bgColor: 'rgba(135,255,135,0.2)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },      // completed 5 feb 2022
    'leafunbottle': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafunbottle',
                args: {
                    bottlekey: ''
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnamednode',
            namedatakey: ['bottlekey'],
            banduplicatename: false,
            banmultiplenode: false,
            svgicon: {
                unicode: undefined,
                url: 'leafunbottle.svg',
                jsx: undefined,
                width: 40,
                height: 30,
                bgColor: 'rgba(255,155,215,0.4)',
            },
        },
        lambdaports: {
            input: undefined,
            output: Object
        },
        dataflow: {
            input: Object,
            output: Object,
        }
    },  // completed 5 feb 2022
    //'leafbottlecheck': _leafbottlecheck,
    'leafcrate': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafcrate',
                args: {
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            svgicon: {
                iconname: '{crate}',
                unicode: undefined,
                url: 'leafcrate.svg',
                jsx: undefined,
                width: 40,
                height: 40,
                bgColor: 'rgba(155,205,85,0.7)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object, 
            output: Object 
        }
    },  
    'leafconfig': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leafconfig',
                args: {
                }
            }
        },
        editorconfig: {
            nodetype: 'rectangularnode',
            banmultiplenode: true,
            svgicon: {
                iconname: 'config',
                unicode: undefined,
                url: 'leafconfig.svg',
                jsx: undefined,
                width: 40,
                height: 40,
                //bgColor: 'rgba(255,205,85,0.7)',
                bgColor: 'rgba(255,205,85,1.0)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: Object, 
            output: Object 
        }
    },  
    // leaf arcane wizardry 
    'leaflisp': {
        // as in lambdactrl.user.leaf
        leaf: {
            logic: {
                type: 'leaflisp',
                args: {
                    lispexpression: '',
                    //lispnodename: 'leaflisp'
                }
            }
        },
        editorconfig: {
            nodetype: 'circularnode',
            //namedatakey: ['lispexpression'],
            svgicon: {
                iconname: 'leaflisp',
                unicode: undefined,
                url: 'leaflisp.svg',
                jsx: undefined,
                width: 40,
                height: 40,
                bgColor: 'rgba(205,255,215,0.7)',
            },
        },
        lambdaports: {
            input: Object,
            output: Object
        },
        dataflow: {
            input: {
                _leaflisp_in: Object,
            }, 
            output: {
                _leaflisp_out: Object,
            }
        }
    },                  // completed 20 jan 2022
    //'leafmap': _leafmap,
    };

    if (type === undefined)
        return _breezyforestapi;
    else if (type in _breezyforestapi) 
        return _breezyforestapi[type];
    else
        return undefined; // exclude any non-standard types and any spells
};

const _breezyforest_leafelement_hierarchy = {
};

const _breezyforeststdlib_name = {
    'outport': 'leafoutflowport',
    'inport': 'leafinflowport',
    'screenio': 'leafscreenio',
    'memoryio': 'leafmemoryio',
    'spade': 'leafdeckspade',
    'heart': 'leafdeckheart',
    'diamond': 'leafdeckdiamond',
    'club': 'leafdeckclub',
    'element': 'leafelement',
    'anchor': 'leafanchor',
    'leafgraph': 'leafgraph',
    'lambda': 'leaflambdagraph',
    'spelldef': 'leafspelldef',
    'spell': 'leafspell',
    'loopyspell': 'leafloopyspell',
    'label': 'leaflabel',
    'delabel': 'leafdelabel',
    'bottle': 'leafbottle',
    'unbottle': 'leafunbottle',
    'crate': 'leafcrate',
    'config': 'leafconfig',
    'chronos': 'leafchronosflow',
    'async': 'leafasyncflow',
    'sync': 'leafsyncflow',
    'mix': 'leafmixflow',
    'gate': 'leafgateflow',
    'leaflisp': 'leaflisp',
}
const _breezyforeststdlib_hierarchy = {
    /* ********************* LEAF standard library ********************* */
    //'leaftracker': _leaftracker,          // deprecated on 9 Mar 2022, as its function can be supported by leafgraph that allows users to refer to the leafdeckspade of any chosen graph allowable.
    // leaf io
    'io': [
        'leafradioRX',
        'leafradioTX',
        'leafoutflowport',
        'leafinflowport',
        'leafscreenio',
        'leafmemoryio',
    ],
    // leaf elements
    // (11 Mar 2022) refactor and migrate and consolidate the management of all elements to leafelement
    'elements': [
        'leafdeckspade',
        'leafdeckheart',
        'leafdeckdiamond',
        'leafdeckclub',
        'leafelement', // shall support a growing list of element types and their UX definitions of leafgnav, leafpopup, leafeditor, leafimage, leafvideo, leafaudio, leaftext, leafd3, leafgraphics etc.
    ],
    // leaf abstraction
    'abstraction': [
        'leafgraph',                // completed 5 feb 2022, changed the name from _leafapp to _leafgraph on 9 Mar 2022
        'leaflambdagraph',    // completed 20 jan 2022
        'leafspelldef',  // changed the name from _leafoperator to _leafspelldef and _leafspell on 9 Mar 2022
        'leafspell',         // parsing this type is taken care of separately in three parsing steps involving leaf standard spells, leaf curated spells and user-defined spells
        'leafloopyspell', // a new concept consolidating the likes of 'map' among reactive operators, but in a themetically more compatible fashion. 
    ],
    // leaf dataflow utils
    'dataflow': [
        ////'leafsyncflow': _leafsyncflow,
        'leaflabel',        // completed 5 feb 2022 
        'leafdelabel',    // completed 5 feb 2022
        //                                   // use bottle/unbottle to support structuring/destructuring of json objects, 
        //'leafbottle2json': _leafbottle2json, //(spark_dev_note: (11 Mar 2022) use this bottle 2 json converter prior to consumption by leaflisp)
        //'leafjson2bottle': _leafjson2bottle, //(spark_dev_note: (11 Mar 2022) use this json 2 bottle converter prior to data consumption by any leaf constructs downstream of leaflisp)
        // spark_dev_note: implement these two converters built into _leaflisp
        'leafbottle',      // completed 5 feb 2022
        'leafunbottle',  // completed 5 feb 2022
        //'leafbottlecheck': _leafbottlecheck,
        'leafcrate',  
    ],
    // leaf arcane wizardry 
    'arcane': [
        'leaflisp',                  // completed 20 jan 2022
    ]
    //'leafmap': _leafmap,
    };

    const _edge_handle_dict = {
        'leaflambdaedge': {sourceHandle: 'out_aux', targetHandle: 'in_aux'},
        'leafanchoredge': {sourceHandle: 'out_anchor', targetHandle: 'in_anchor'},
        'leafdataedge': {sourceHandle: 'out_a', targetHandle: 'in_a'},
    }
    const _edge_style_dict = {
        'leaflambdaedge': {stroke: '#fff', fillOpacity: 0,},
        'leafanchoredge': {stroke: '#88f', fillOpacity: 0,},
        'leafdataedge': {stroke: '#fff', fillOpacity: 0,},
    }

export {LEAFIOmetamodel, _leafstdlib_dataflow_api, _breezyforeststdlib_hierarchy, _edge_handle_dict, _edge_style_dict, _breezyforeststdlib_name};
