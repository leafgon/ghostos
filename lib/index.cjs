"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/*! For license information please see index.core.js.LICENSE.txt */
(function () {
  "use strict";

  var e = {
      d: function d(t, n) {
        for (var r in n) e.o(n, r) && !e.o(t, r) && Object.defineProperty(t, r, {
          enumerable: !0,
          get: n[r]
        });
      },
      o: function o(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      },
      r: function r(e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
          value: "Module"
        }), Object.defineProperty(e, "__esModule", {
          value: !0
        });
      }
    },
    t = {};
  e.r(t), e.d(t, {
    LEAFIOmetamodel: function LEAFIOmetamodel() {
      return u;
    },
    SHA1: function SHA1() {
      return we;
    },
    _breezyforeststdlib_hierarchy: function _breezyforeststdlib_hierarchy() {
      return f;
    },
    _breezyforeststdlib_name: function _breezyforeststdlib_name() {
      return l;
    },
    _edge_handle_dict: function _edge_handle_dict() {
      return s;
    },
    _edge_style_dict: function _edge_style_dict() {
      return d;
    },
    _leafelement: function _leafelement() {
      return hs;
    },
    _leafgraph: function _leafgraph() {
      return Xd;
    },
    _leafstdlib_dataflow_api: function _leafstdlib_dataflow_api() {
      return c;
    },
    analyzeLEAFGraph: function analyzeLEAFGraph() {
      return bp;
    },
    createGQLClient: function createGQLClient() {
      return Lp;
    },
    decodeUnicode: function decodeUnicode() {
      return io;
    },
    destroySoundStageNode: function destroySoundStageNode() {
      return qc;
    },
    doBottle: function doBottle() {
      return re;
    },
    doUnbottle: function doUnbottle() {
      return oe;
    },
    driveDataflowByCtrlflow: function driveDataflowByCtrlflow() {
      return jp;
    },
    encodeUnicode: function encodeUnicode() {
      return ao;
    },
    etaReduceDataflowComponent: function etaReduceDataflowComponent() {
      return Rs;
    },
    etaTreeForest: function etaTreeForest() {
      return Le;
    },
    executeLEAFLogic: function executeLEAFLogic() {
      return gp;
    },
    executeLEAFLogicInSync: function executeLEAFLogicInSync() {
      return wp;
    },
    fetchMultiKeyedData: function fetchMultiKeyedData() {
      return _ge;
    },
    getLEAFgqlEndpoints: function getLEAFgqlEndpoints() {
      return fb;
    },
    initLEAFIOapi: function initLEAFIOapi() {
      return Yp;
    },
    init_gRuntimeLEAFlisp: function init_gRuntimeLEAFlisp() {
      return Fo;
    },
    initializeLEAFlakeGQLClient: function initializeLEAFlakeGQLClient() {
      return Hp;
    },
    initializeMasterSubsDirectory: function initializeMasterSubsDirectory() {
      return tb;
    },
    initializeSoundStage: function initializeSoundStage() {
      return Rc;
    },
    initializeSubsMain: function initializeSubsMain() {
      return eb;
    },
    mutateAddEdge: function mutateAddEdge() {
      return mb;
    },
    mutateAddNode: function mutateAddNode() {
      return db;
    },
    mutateDelEdge: function mutateDelEdge() {
      return yb;
    },
    mutateDelNode: function mutateDelNode() {
      return pb;
    },
    mutateUpdateNode: function mutateUpdateNode() {
      return bb;
    },
    parseAddressableGraph: function parseAddressableGraph() {
      return Sp;
    },
    parseJsonToLEAFlisp: function parseJsonToLEAFlisp() {
      return _Ao;
    },
    reconstructLEAFGraph: function reconstructLEAFGraph() {
      return pp;
    },
    runLEAFlispcode: function runLEAFlispcode() {
      return Io;
    },
    runtimeEtaTree: function runtimeEtaTree() {
      return Js;
    },
    setLEAFgqlEndpoints: function setLEAFgqlEndpoints() {
      return sb;
    },
    setMultiKeyedData: function setMultiKeyedData() {
      return _ve;
    },
    subscribeToLEAFLogic: function subscribeToLEAFLogic() {
      return hp;
    }
  });
  var n = require("rxjs/operators"),
    r = require("rxjs");
  var o = process.env.LEAFGON_ENDPOINT_SUBS,
    a = process.env.LEAFGON_WEBSOCKET_SUBS,
    i = process.env.LEAFGON_ENDPOINT_QM,
    u = {
      breezyforest: {
        _version: "1.0",
        _nickname: "breezyforest",
        scaffold: {
          map: {
            leaf: {
              logic: {
                type: "",
                args: {}
              },
              provenance: {
                api: "breezyforest",
                uuid: "",
                graph: {
                  appuuid: "",
                  name: "",
                  version: ""
                }
              },
              appdata: {}
            }
          },
          directory: {
            api: ["leaf", "api"],
            logic: ["leaf", "logic"],
            type: ["leaf", "logic", "type"],
            args: ["leaf", "logic", "args"],
            provenance: ["leaf", "provenance"],
            uuid: ["leaf", "provenance", "uuid"],
            leafapp: ["leaf", "provenance", "leafapp"],
            appdata: ["leaf", "appdata"]
          },
          fetch: function fetch(e, t) {
            var _n2 = function n(e, t) {
              var r = t[0],
                o = t.slice(1);
              return 0 === o.length ? e[r] : _n2(e[r], o);
            };
            try {
              return _n2(e, Array.isArray(t) ? t : u.breezyforest.scaffold.directory[t]);
            } catch (e) {
              return null;
            }
          }
        },
        originType: {
          FRONTEND: 1,
          BACKEND: 2,
          SCREEN: 4
        },
        subsDirectory: {
          readmefirst: {},
          leaflake: {
            bridges: {
              gql: "clientconfig_full"
            }
          },
          appintent: {},
          appmodel: {},
          appview: {},
          osview: {},
          osview2: {},
          dataflowplane: {},
          appcache: {}
        },
        IOAccessPermission: {
          Owner: 1,
          Observer: 2,
          Contributor: 4,
          All: 7
        },
        IOStateGroundZero: {
          dirOfSubjects: {},
          subsCache: {},
          subscriptions: {},
          callbacks: {},
          permissions: {}
        },
        GQLParameters: {
          clientconfig_full: {
            keepGQLConnected: !0,
            dburi_subs: o,
            dburi_subs_ws: a,
            dburi_qm: i
          },
          clientconfig_sub: {
            keepGQLConnected: !0,
            dburi_subs: o,
            dburi_subs_ws: a
          },
          clientconfig_qm: {
            dburi_qm: i
          },
          masterquery: "\n                {\n                    domain\n                    appid\n                    nodes {\n                        uuid\n                        out_edges {uuid source {uuid} target {uuid} data}\n                        data\n                    }\n                    update {\n                        added {uuid out_edges {uuid source {uuid} target {uuid} data} data} \n                        removed {uuid}\n                    }\n                }\n            ".replace(/\s+/g, " ")
        },
        LEAFdictionary: {
          map: n.map
        }
      }
    },
    c = function c(e) {
      var t = {
        leafradioRX: {
          leaf: {
            logic: {
              type: "leafradioRX",
              args: {
                keyname: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["keyname"],
            bannednames: ["Lambda"],
            banduplicatename: !0,
            banmultiplenode: !1,
            svgicon: {
              unicode: void 0,
              url: "leafradioRX.svg",
              width: 40,
              height: 30,
              bgColor: "rgba(235,255,35,0.2)",
              jsx: void 0
            }
          },
          lambdaports: {
            input: void 0,
            output: void 0
          },
          dataflow: {
            input: void 0,
            output: {
              _leafradiokey: {
                keyname: "",
                subsDirectory: Object
              },
              _leafradiorx: {
                txkey: "",
                payload: Object
              }
            }
          }
        },
        leafradioTX: {
          leaf: {
            logic: {
              type: "leafradioTX",
              args: {
                keyname: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["keyname"],
            bannednames: ["Lambda"],
            banduplicatename: !1,
            banmultiplenode: !1,
            svgicon: {
              unicode: void 0,
              url: "leafradioTX.svg",
              width: 40,
              height: 30,
              bgColor: "rgba(135,255,135,0.2)",
              jsx: void 0
            }
          },
          lambdaports: {
            input: void 0,
            output: void 0
          },
          dataflow: {
            input: {
              _leafradiokey: {
                keyname: "",
                subsDirectory: Object
              },
              _leafradiotx: {
                txkey: "",
                payload: Object
              }
            },
            output: void 0
          }
        },
        leafoutflowport: {
          leaf: {
            logic: {
              type: "leafoutflowport",
              args: {}
            }
          },
          editorconfig: {
            nodetype: "tinynode",
            svgicon: {
              unicode: "⊖",
              url: void 0,
              jsx: void 0,
              fgColor: "rgba(255,255,255,1)",
              bgColor: "rgba(22,22,55,1)"
            }
          },
          lambdaports: {
            input: void 0,
            output: void 0
          },
          dataflow: {
            input: Object,
            output: void 0
          }
        },
        leafinflowport: {
          leaf: {
            logic: {
              type: "leafinflowport",
              args: {}
            }
          },
          editorconfig: {
            nodetype: "tinynode",
            svgicon: {
              unicode: "⊕",
              url: void 0,
              jsx: void 0,
              fgColor: "rgba(255,255,255,1)",
              bgColor: "rgba(55,22,22,1)"
            }
          },
          lambdaports: {
            input: void 0,
            output: void 0
          },
          dataflow: {
            input: void 0,
            output: Object
          }
        },
        leafmemoryio: {
          leaf: {
            logic: {
              type: "leafmemoryio",
              args: {
                elementconfig: {
                  leafnodename: ""
                },
                persistencyref: {
                  updateref: "",
                  dbref: ""
                }
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["elementconfig", "leafnodename"],
            banduplicatename: !1,
            banmultiplenode: !1,
            svgicon: {
              iconname: "memory io",
              unicode: void 0,
              url: "leafmemoryio.svg",
              jsx: void 0,
              width: 40,
              height: 40,
              bgColor: "rgba(255,255,255,0.6)"
            }
          },
          lambdaports: {
            input: Object,
            output: Object
          },
          dataflow: {
            input: {
              _leafdeckdiamond: Object,
              _leafdeckclub: Object
            },
            output: {
              _leafdeckheart: Object
            }
          }
        },
        leafscreenio: {
          leaf: {
            logic: {
              type: "leafscreenio",
              args: {
                lispexpression: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            banduplicatename: !1,
            banmultiplenode: !1,
            svgicon: {
              iconname: "screen io",
              unicode: void 0,
              url: "leafscreenio.svg",
              jsx: void 0,
              width: 40,
              height: 40,
              bgColor: "rgba(205,155,215,0.6)"
            }
          },
          lambdaports: {
            input: Object,
            output: Object
          },
          dataflow: {
            input: {
              _leaflisp_in: Object
            },
            output: {
              _leaflisp_out: Object
            }
          }
        },
        leafdeckspade: {
          leaf: {
            logic: {
              type: "leafdeckspade",
              args: {
                elementconfig: {
                  leafnodename: ""
                }
              }
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            namedatakey: ["elementconfig", "leafnodename"],
            banmultiplenode: !0,
            svgicon: {
              unicode: void 0,
              url: "leafspade.svg",
              jsx: void 0
            }
          },
          lambdaports: {
            input: Object,
            output: Object
          },
          dataflow: {
            input: {
              _leafdeckdiamond: Object,
              _leafdeckclub: Object
            },
            output: {
              _leafdeckspade: Object
            }
          }
        },
        leafdeckheart: {
          leaf: {
            logic: {
              type: "leafdeckheart",
              args: {
                elementconfig: {
                  leafnodename: ""
                }
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["elementconfig", "leafnodename"],
            banduplicatename: !0,
            banmultiplenode: !1,
            svgicon: {
              unicode: void 0,
              url: "leafheart.svg",
              jsx: void 0
            }
          },
          lambdaports: {
            input: Object,
            output: Object
          },
          dataflow: {
            input: {
              _leafdeckdiamond: Object,
              _leafdeckclub: Object
            },
            output: {
              _leafdeckheart: Object
            }
          }
        },
        leafdeckdiamond: {
          leaf: {
            logic: {
              type: "leafdeckdiamond",
              args: {
                elementconfig: {
                  leafnodename: ""
                }
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["elementconfig", "leafnodename"],
            svgicon: {
              unicode: void 0,
              url: "diamond2.svg",
              jsx: void 0
            }
          },
          lambdaports: {
            input: Object,
            output: Object
          },
          dataflow: {
            input: {
              _leafdeckclub: Object
            },
            output: {
              _leafdeckdiamond: Object
            }
          }
        },
        leafdeckclub: {
          leaf: {
            logic: {
              type: "leafdeckclub",
              args: {
                elementconfig: {
                  leafnodename: ""
                }
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["elementconfig", "leafnodename"],
            svgicon: {
              unicode: void 0,
              url: "club3.svg",
              jsx: void 0
            }
          },
          lambdaports: {
            input: Object,
            output: Object
          },
          dataflow: {
            input: {
              _leafdeckclubinit: Object
            },
            output: {
              _leafdeckclub: Object
            }
          }
        },
        leafelement: {
          leaf: {
            logic: {
              type: "leafelement",
              args: {
                elementname: "",
                svgicon: {
                  unicode: void 0,
                  url: "",
                  jsx: Object
                },
                elementconfig: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            is_committable: !0,
            namedatakey: ["elementname"],
            allowednames: ["gnav", "popup", "editor", "text", "prompt", "http", "href", "mediaplayer", "image", "mediainput", "midi", "sound", "html", "form", "directus", "openai", "rancher", "hermes"],
            banduplicatename: !1,
            banmultiplenode: !1,
            svgicon: {
              unicode: void 0,
              url: "leafelement.svg",
              width: 40,
              height: 40,
              bgColor: "rgba(35,5,15,0.7)",
              fgColor: "rgba(255,255,255,1)",
              jsx: void 0
            }
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
        leafgraph: {
          leaf: {
            logic: {
              type: "leafgraph",
              args: {
                graphuuid: "",
                domain: "",
                appid: "",
                graphaddrstr: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["graphaddrstr"],
            svgicon: {
              unicode: "✵",
              url: void 0,
              jsx: void 0,
              fgColor: "rgba(255,255,255,1.0)",
              bgColor: "rgba(220,02,100, 0.5)"
            }
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
        leaflambdagraph: {
          leaf: {
            logic: {
              type: "leaflambdagraph",
              args: {}
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            svgicon: {
              iconname: "contextual lambda",
              unicode: "λ",
              url: void 0,
              jsx: void 0,
              fgColor: "rgba(255,255,255,1.0)",
              bgColor: "rgba(0,0,0,0.5)"
            }
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
        leafanchor: {
          leaf: {
            logic: {
              type: "leafanchor",
              args: {}
            }
          },
          editorconfig: {
            nodetype: "tinynode",
            svgicon: {
              unicode: void 0,
              url: "trident_white.svg",
              width: 15,
              height: 15,
              jsx: void 0,
              fgColor: "rgba(255,255,255,1)",
              bgColor: "rgba(102, 102, 255, 1)"
            }
          },
          lambdaports: {
            input: void 0,
            output: void 0
          },
          dataflow: {
            input: void 0,
            output: void 0
          }
        },
        leafspelldef: {
          leaf: {
            logic: {
              type: "leafspelldef",
              args: {
                spellname: "",
                svgicon: {
                  unicode: void 0,
                  url: "",
                  jsx: Object
                }
              }
            }
          },
          editorconfig: {
            nodetype: "rectangularnamednode",
            namedatakey: ["spellname"],
            banduplicatename: !0,
            svgicon: {
              iconname: "spelldef",
              unicode: void 0,
              url: "leafspell.svg",
              jsx: void 0,
              bgColor: "rgba(80,80,135,0.8)",
              fgColor: "rgba(250,250,250,1.0)",
              width: 40,
              height: 30
            }
          },
          lambdaports: {
            input: Object,
            output: void 0
          },
          dataflow: {
            input: void 0,
            output: void 0
          }
        },
        leafspell: {
          leaf: {
            logic: {
              type: "leafspell",
              args: {
                spellname: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["spellname"],
            svgicon: {
              unicode: void 0,
              url: "leafloopyspell.svg",
              jsx: void 0,
              bgColor: "rgba(80,180,135,0.8)",
              fgColor: "rgba(250,250,250,1.0)",
              width: 40,
              height: 30
            }
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
        leafloopyspell: {
          leaf: {
            logic: {
              type: "leafloopyspell",
              args: {}
            }
          },
          editorconfig: {
            nodetype: "rectangularnode",
            banduplicatename: !0,
            svgicon: {
              iconname: "loopy spell",
              unicode: void 0,
              url: "leafloopyspell.svg",
              jsx: void 0,
              bgColor: "rgba(80,180,135,0.8)",
              fgColor: "rgba(250,250,250,1.0)",
              width: 40,
              height: 30
            }
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
        leafsyncflow: {
          leaf: {
            logic: {
              type: "leafsyncflow",
              args: {}
            }
          },
          fconfig: {
            inputsync: {
              combineOperator: "combine"
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            svgicon: {
              unicode: void 0,
              iconname: "sync",
              url: "leafsyncflow.svg",
              jsx: void 0,
              bgColor: "rgba(80,200,255,1.0)",
              width: 40,
              height: 40
            }
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
        leafchronosflow: {
          leaf: {
            logic: {
              type: "leafchronosflow",
              args: {}
            }
          },
          fconfig: {
            inputsync: {
              combineOperator: "combine"
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            svgicon: {
              unicode: void 0,
              iconname: "Chronos",
              url: "leafsyncflow.svg",
              jsx: void 0,
              bgColor: "rgba(80,200,255,1.0)",
              width: 40,
              height: 40
            }
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
        leafasyncflow: {
          leaf: {
            logic: {
              type: "leafasyncflow",
              args: {}
            }
          },
          fconfig: {
            inputsync: {
              combineOperator: "combine"
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            svgicon: {
              unicode: void 0,
              iconname: "async",
              url: "leafsyncflow.svg",
              jsx: void 0,
              bgColor: "rgba(80,200,255,1.0)",
              width: 40,
              height: 40
            }
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
        leafmixflow: {
          leaf: {
            logic: {
              type: "leafmixflow",
              args: {
                mixOperator: "merge"
              }
            }
          },
          fconfig: {
            inputsync: void 0
          },
          editorconfig: {
            nodetype: "circularnode",
            svgicon: {
              iconname: "mix",
              unicode: void 0,
              url: "leafmixflow.svg",
              jsx: void 0,
              bgColor: "rgba(80,150,255,0.8)",
              width: 40,
              height: 40
            }
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
        leafgateflow: {
          leaf: {
            logic: {
              type: "leafgateflow",
              args: {
                keyname: "",
                notgatetoggle: !1
              }
            }
          },
          fconfig: {
            inputsync: {
              combineOperator: "merge"
            }
          },
          editorconfig: {
            nodetype: "circularnamedboolnode",
            namedatakey: ["keyname"],
            toggledatakey: ["notgatetoggle"],
            svgicon: {
              unicode: void 0,
              url: "leafgate.svg",
              jsx: void 0,
              width: 40,
              height: 30,
              bgColor0: "rgba(135,55,135,0.2)",
              bgColor1: "rgba(35,255,135,0.2)",
              toggleSymbol0: "⊜",
              toggleSymbol1: "≠"
            }
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
        leaflabel: {
          leaf: {
            logic: {
              type: "leaflabel",
              args: {
                labelstr: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["labelstr"],
            svgicon: {
              unicode: void 0,
              url: "leaflabel.svg",
              jsx: void 0,
              width: 40,
              height: 30,
              bgColor: "rgba(165,55,185,0.7)"
            }
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
        leafdelabel: {
          leaf: {
            logic: {
              type: "leafdelabel",
              args: {
                labelstr: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["labelstr"],
            svgicon: {
              unicode: void 0,
              url: "leafdelabel.svg",
              jsx: void 0,
              width: 40,
              height: 30,
              bgColor: "rgba(235,55,135,0.7)"
            }
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
        leafbottle: {
          leaf: {
            logic: {
              type: "leafbottle",
              args: {
                bottlekey: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["bottlekey"],
            banduplicatename: !1,
            banmultiplenode: !1,
            svgicon: {
              unicode: void 0,
              url: "leafbottle.svg",
              jsx: void 0,
              width: 40,
              height: 30,
              bgColor: "rgba(135,255,135,0.2)"
            }
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
        leafunbottle: {
          leaf: {
            logic: {
              type: "leafunbottle",
              args: {
                bottlekey: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnamednode",
            namedatakey: ["bottlekey"],
            banduplicatename: !1,
            banmultiplenode: !1,
            svgicon: {
              unicode: void 0,
              url: "leafunbottle.svg",
              jsx: void 0,
              width: 40,
              height: 30,
              bgColor: "rgba(255,155,215,0.4)"
            }
          },
          lambdaports: {
            input: void 0,
            output: Object
          },
          dataflow: {
            input: Object,
            output: Object
          }
        },
        leafcrate: {
          leaf: {
            logic: {
              type: "leafcrate",
              args: {}
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            svgicon: {
              iconname: "{crate}",
              unicode: void 0,
              url: "leafcrate.svg",
              jsx: void 0,
              width: 40,
              height: 40,
              bgColor: "rgba(155,205,85,0.7)"
            }
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
        leafconfig: {
          leaf: {
            logic: {
              type: "leafconfig",
              args: {}
            }
          },
          editorconfig: {
            nodetype: "rectangularnode",
            banmultiplenode: !0,
            svgicon: {
              iconname: "config",
              unicode: void 0,
              url: "leafconfig.svg",
              jsx: void 0,
              width: 40,
              height: 40,
              bgColor: "rgba(255,205,85,1.0)"
            }
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
        leaflisp: {
          leaf: {
            logic: {
              type: "leaflisp",
              args: {
                lispexpression: ""
              }
            }
          },
          editorconfig: {
            nodetype: "circularnode",
            svgicon: {
              iconname: "leaflisp",
              unicode: void 0,
              url: "leaflisp.svg",
              jsx: void 0,
              width: 40,
              height: 40,
              bgColor: "rgba(205,255,215,0.7)"
            }
          },
          lambdaports: {
            input: Object,
            output: Object
          },
          dataflow: {
            input: {
              _leaflisp_in: Object
            },
            output: {
              _leaflisp_out: Object
            }
          }
        }
      };
      return void 0 === e ? t : e in t ? t[e] : void 0;
    },
    l = {
      outport: "leafoutflowport",
      inport: "leafinflowport",
      screenio: "leafscreenio",
      memoryio: "leafmemoryio",
      spade: "leafdeckspade",
      heart: "leafdeckheart",
      diamond: "leafdeckdiamond",
      club: "leafdeckclub",
      element: "leafelement",
      anchor: "leafanchor",
      leafgraph: "leafgraph",
      lambda: "leaflambdagraph",
      spelldef: "leafspelldef",
      spell: "leafspell",
      loopyspell: "leafloopyspell",
      label: "leaflabel",
      delabel: "leafdelabel",
      bottle: "leafbottle",
      unbottle: "leafunbottle",
      crate: "leafcrate",
      config: "leafconfig",
      chronos: "leafchronosflow",
      async: "leafasyncflow",
      sync: "leafsyncflow",
      mix: "leafmixflow",
      gate: "leafgateflow",
      leaflisp: "leaflisp"
    },
    f = {
      io: ["leafradioRX", "leafradioTX", "leafoutflowport", "leafinflowport", "leafscreenio", "leafmemoryio"],
      elements: ["leafdeckspade", "leafdeckheart", "leafdeckdiamond", "leafdeckclub", "leafelement"],
      abstraction: ["leafgraph", "leaflambdagraph", "leafspelldef", "leafspell", "leafloopyspell"],
      dataflow: ["leaflabel", "leafdelabel", "leafbottle", "leafunbottle", "leafcrate"],
      arcane: ["leaflisp"]
    },
    s = {
      leaflambdaedge: {
        sourceHandle: "out_aux",
        targetHandle: "in_aux"
      },
      leafanchoredge: {
        sourceHandle: "out_anchor",
        targetHandle: "in_anchor"
      },
      leafdataedge: {
        sourceHandle: "out_a",
        targetHandle: "in_a"
      }
    },
    d = {
      leaflambdaedge: {
        stroke: "#fff",
        fillOpacity: 0
      },
      leafanchoredge: {
        stroke: "#88f",
        fillOpacity: 0
      },
      leafdataedge: {
        stroke: "#fff",
        fillOpacity: 0
      }
    };
  var p = require("graphology");
  function b(e, t) {
    for (var n = 0; n < t.length; n++) {
      var r = t[n];
      r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, m(r.key), r);
    }
  }
  function m(e) {
    var t = function (e) {
      if ("object" != y(e) || !e) return e;
      var t = e[Symbol.toPrimitive];
      if (void 0 !== t) {
        var n = t.call(e, "string");
        if ("object" != y(n)) return n;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return String(e);
    }(e);
    return "symbol" == y(t) ? t : t + "";
  }
  function y(e) {
    return y = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, y(e);
  }
  var g = function () {
    return e = function e(t) {
      !function (e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
      }(this, e), this.graph = t, this.stack = new Array(t.order), this.seen = new Set(), this.size = 0;
    }, (t = [{
      key: "hasAlreadySeenEverything",
      value: function value() {
        return this.seen.size === this.graph.order;
      }
    }, {
      key: "countUnseenNodes",
      value: function value() {
        return this.graph.order - this.seen.size;
      }
    }, {
      key: "forEachNodeYetUnseen",
      value: function value(e) {
        var t = this.seen,
          n = this.graph;
        n.someNode(function (r, o) {
          return t.size === n.order || !t.has(r) && !!e(r, o);
        });
      }
    }, {
      key: "has",
      value: function value(e) {
        return this.seen.has(e);
      }
    }, {
      key: "push",
      value: function value(e) {
        var t = this.seen.size;
        return this.seen.add(e), t !== this.seen.size && (this.stack[this.size++] = e, !0);
      }
    }, {
      key: "pop",
      value: function value() {
        if (0 !== this.size) return this.stack[--this.size];
      }
    }]) && b(e.prototype, t), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
    var e, t;
  }();
  function v(e) {
    return v = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, v(e);
  }
  var h = function h(e) {
      return "object" === v(e) && !Array.isArray(e) && null !== e && "_bname" in e;
    },
    w = function w(e) {
      return "object" === v(e) && !Array.isArray(e) && null !== e && "_crate" in e;
    },
    O = function O(e) {
      return h(e) && ("empty_bottle" === e._bname && "empty_data" === e._content || void 0 === e._content);
    };
  var _ = require("buffer"),
    j = require("uuid");
  function S(e) {
    return S = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, S(e);
  }
  function k(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function T(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? k(Object(n), !0).forEach(function (t) {
        E(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : k(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function E(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != S(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != S(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == S(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function P(e) {
    return function (e) {
      if (Array.isArray(e)) return x(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || A(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function A(e, t) {
    if (e) {
      if ("string" == typeof e) return x(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? x(e, t) : void 0;
    }
  }
  function x(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var N = function N(e) {
      return Array.isArray(e) ? e.flatMap(function (e) {
        return e;
      }) : e;
    },
    F = function F(e, t) {
      var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
        o = arguments.length > 3 && void 0 !== arguments[3] && arguments[3],
        a = arguments.length > 4 && void 0 !== arguments[4] && arguments[4];
      "etaTree" in (arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : {}) || console.log("start debugging");
      var i = t.filter(function (e) {
        return e;
      });
      if (i.length > 1) {
        var u = {
          _stream: (0, r.of)("ctrl_nudge").pipe((0, r.concatMap)(function (o) {
            return (0, r.combineLatest)(t.map(function (e) {
              return e._stream;
            })).pipe((0, r.map)(function (t) {
              "9857" === (null == e ? void 0 : e.slice(0, 4)) && console.log("combineDataflows() stream content:", t, n);
              var r = a ? function () {
                  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
                    t = e._bus,
                    n = e._cond,
                    r = void 0 === n ? function (e) {
                      return !0;
                    } : n,
                    o = e._flatten;
                  return void 0 !== o && o ? Array.isArray(t) ? t.map(function (e) {
                    return h(e) && "_databus" === e._bname && r(e) ? e._content : e;
                  }).flat().filter(function (e) {
                    return e;
                  }) : h(t) && "_databus" === t._bname && r(t) ? t._content : t : Array.isArray(t) ? t.map(function (e) {
                    return h(e) && "_databus" === e._bname && r(e) ? e._content : e;
                  }).filter(function (e) {
                    return e;
                  }) : h(t) && "_databus" === t._bname && r(t) ? t._content : t;
                }({
                  _bus: t,
                  _flatten: n
                }) : t,
                o = !a && n && Array.isArray(r) ? r.filter(function (e) {
                  return e;
                }).flat() : r;
              return o;
            }));
          }))
        };
        return o && (u._control = {
          _stream: (0, r.of)("ctrl_nudge").pipe((0, r.concatMap)(function (e) {
            return (0, r.combineLatest)(t.map(function (e) {
              var t;
              return null == e || null === (t = e._control) || void 0 === t ? void 0 : t._stream;
            }).filter(function (e) {
              return e;
            })).pipe((0, r.map)(function (e) {
              return Array.isArray(e) ? e.flat() : e;
            }));
          }))
        }), u;
      }
      return i.length > 0 ? T(T({}, i[0]), {}, {
        _stream: i[0]._stream.pipe((0, r.map)(function (t) {
          return "9857" === (null == e ? void 0 : e.slice(0, 4)) && console.log("combineDataflows() stream content:", t, n), t;
        }))
      }) : void 0;
    },
    I = function I(e, t) {
      var n = e.filter(function (e) {
          return t.some(function (t) {
            return t in e;
          });
        }),
        o = e.filter(function (e) {
          return t.every(function (t) {
            return !(t in e);
          });
        }),
        _a2 = function a(e, t) {
          if (h(e)) return T(T({}, e), {}, {
            _content: _a2(e._content, t)
          });
          if (w(e)) return T(T({}, e), {}, {
            _crate: e._crate.map(function (e) {
              return _a2(e, t);
            })
          });
          if (Array.isArray(e)) return e.map(function (e) {
            return _a2(e, t);
          });
          var n;
          if ("object" === S(e)) return Object.assign.apply(Object, [{}].concat(P(Object.entries(e).map(function (e) {
            var n,
              r,
              o = (r = 2, function (e) {
                if (Array.isArray(e)) return e;
              }(n = e) || function (e, t) {
                var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                if (null != n) {
                  var r,
                    o,
                    a,
                    i,
                    u = [],
                    c = !0,
                    l = !1;
                  try {
                    if (a = (n = n.call(e)).next, 0 === t) {
                      if (Object(n) !== n) return;
                      c = !1;
                    } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                  } catch (e) {
                    l = !0, o = e;
                  } finally {
                    try {
                      if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                    } finally {
                      if (l) throw o;
                    }
                  }
                  return u;
                }
              }(n, r) || A(n, r) || function () {
                throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()),
              i = o[0],
              u = o[1];
            return E({}, i, _a2(u, t));
          }))));
          if ("string" == typeof e) {
            var r = (n = t, e.replace(/\{([\w\s]+)\}/g, function (e, t) {
              return n[t];
            }));
            return console.log("inter:", JSON.stringify(r)), r;
          }
          return e;
        };
      return {
        _stream: D(o)._stream.pipe((0, r.bufferTime)(200, 100, 100), (0, r.map)(function (e) {
          return console.log(e), e;
        }), (0, r.map)(function (e) {
          return N(e);
        }), r.withLatestFrom.apply(void 0, P(n.map(function (e) {
          return e._stream.pipe((0, r.bufferTime)(200, 100, 100), (0, r.map)(function (e) {
            return N(e);
          }));
        }))), (0, r.map)(function (e) {
          return console.log(e), e;
        })).pipe((0, r.map)(function (e) {
          console.log(e);
          var t = N(e[0]),
            n = N(e.slice(1)).filter(function (e) {
              return !Array.isArray(e) && "object" === S(e);
            }),
            r = Object.assign.apply(Object, [{}].concat(P(n))),
            o = _a2(t, r);
          return console.log(o), o;
        }))
      };
    },
    L = function L(e) {
      var t = e.filter(function (e) {
        return e;
      });
      return t.length > 1 ? {
        _stream: t.map(function (e) {
          return e._stream;
        }).pipe((0, r.concatAll)())
      } : t.length > 0 ? t[0] : void 0;
    },
    D = function D(e) {
      var t = e.filter(function (e) {
        return e;
      });
      return t.length > 1 ? {
        _stream: r.merge.apply(void 0, P(t.map(function (e) {
          return e._stream.pipe((0, r.map)(function (e) {
            return console.log(e), e;
          }));
        })))
      } : t.length > 0 ? t[0] : void 0;
    };
  var G = require("lodash");
  function C(e) {
    return C = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, C(e);
  }
  function M() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _R(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d2 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d2.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d2.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d2.v = r, _d2.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d2.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d2.n = -1), p(u, c)) : _d2.n = c : _d2.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d2.n < 0) ? c : n.call(r, _d2)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_R(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _R(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _R(s, "constructor", l), _R(l, "constructor", c), c.displayName = "GeneratorFunction", _R(l, o, "GeneratorFunction"), _R(s), _R(s, o, "Generator"), _R(s, r, function () {
      return this;
    }), _R(s, "toString", function () {
      return "[object Generator]";
    }), (M = function M() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _R(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _R = function R(e, t, n, r) {
      function a(t, n) {
        _R(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _R(e, t, n, r);
  }
  function q(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function J(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? q(Object(n), !0).forEach(function (t) {
        $(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : q(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function $(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != C(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != C(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == C(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function U(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function B(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function z(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          B(a, r, o, i, u, "next", e);
        }
        function u(e) {
          B(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var H = {
    dataflow: function dataflow(e) {
      return z(M().m(function t() {
        var o,
          a,
          i,
          u = arguments;
        return M().w(function (t) {
          for (;;) if (0 === t.n) return a = (o = u.length > 0 && void 0 !== u[0] ? u[0] : {}).refnode, o.refnodedata, o.nodelambda, o.contextuallambda, i = {
            codebase: "leafinflowport.js",
            refnode: a,
            leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
          }, t.a(2, function (e, t) {
            return jp(t, e, void 0, J(J({}, i), {}, {
              metastep: "leaf inflow"
            }), {
              leaflogic: function leaflogic(e, t) {
                console.log("start debugging");
                var o,
                  a = new r.Subject(),
                  i = t._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                    if (Array.isArray(e)) return U(e);
                  }(o = e.map(function (e) {
                    return e._stream;
                  })) || function (e) {
                    if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                  }(o) || function (e, t) {
                    if (e) {
                      if ("string" == typeof e) return U(e, t);
                      var n = {}.toString.call(e).slice(8, -1);
                      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? U(e, t) : void 0;
                    }
                  }(o) || function () {
                    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()), (0, n.map)(function (e) {
                    return a.next(e[1]), e[0];
                  }), (0, n.share)());
                return {
                  _stream: a,
                  _control: J(J({}, t), {}, {
                    _stream: i
                  })
                };
              },
              datalogic: {
                pre: function pre(e) {
                  return "9c55bbea-7980-4e71-b722-a0d32d332633" === i.refnode && console.log("start debugging"), e;
                }
              }
            });
          });
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return z(M().m(function e() {
        var t,
          n,
          r,
          o = arguments;
        return M().w(function (e) {
          for (;;) if (0 === e.n) return n = (t = o.length > 0 && void 0 !== o[0] ? o[0] : {}).refnode, r = t.refnodedata, t.nodelambda, t.contextuallambda, console.error("LEAF error: the logical construct built using the ".concat(r.leaf.logic.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(r.leaf.logic.args), ") cannot ") + "be defined as a lambda-scoped node."), e.a(2, function (e, t) {
            return J(J({}, F(n, e)), {}, {
              _control: t
            });
          });
        }, e);
      }));
    }
  };
  function V(e) {
    return V = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, V(e);
  }
  function W() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Q(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d3 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d3.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d3.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d3.v = r, _d3.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d3.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d3.n = -1), p(u, c)) : _d3.n = c : _d3.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d3.n < 0) ? c : n.call(r, _d3)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Q(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Q(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Q(s, "constructor", l), _Q(l, "constructor", c), c.displayName = "GeneratorFunction", _Q(l, o, "GeneratorFunction"), _Q(s), _Q(s, o, "Generator"), _Q(s, r, function () {
      return this;
    }), _Q(s, "toString", function () {
      return "[object Generator]";
    }), (W = function W() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Q(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Q = function Q(e, t, n, r) {
      function a(t, n) {
        _Q(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Q(e, t, n, r);
  }
  function K(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function X(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? K(Object(n), !0).forEach(function (t) {
        Z(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : K(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Z(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != V(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != V(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == V(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Y(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function ee(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function te(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ee(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ee(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var ne = {
      dataflow: function dataflow(e) {
        return te(W().m(function t() {
          var o,
            a,
            i,
            u = arguments;
          return W().w(function (t) {
            for (;;) if (0 === t.n) return a = (o = u.length > 0 && void 0 !== u[0] ? u[0] : {}).refnode, o.refnodedata, o.nodelambda, o.contextuallambda, i = {
              codebase: "leafoutflowport.js",
              refnode: a,
              leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
            }, t.a(2, function (e, t) {
              return jp(t, e, void 0, X(X({}, i), {}, {
                metastep: "leaf outflow"
              }), {
                leaflogic: function leaflogic(e, t) {
                  console.log("start debugging");
                  var o,
                    a = new r.Subject(),
                    i = t._stream.pipe((0, n.map)(function (e) {
                      return e;
                    }), n.withLatestFrom.apply(void 0, function (e) {
                      if (Array.isArray(e)) return Y(e);
                    }(o = e.map(function (e) {
                      return e._stream;
                    })) || function (e) {
                      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                    }(o) || function (e, t) {
                      if (e) {
                        if ("string" == typeof e) return Y(e, t);
                        var n = {}.toString.call(e).slice(8, -1);
                        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Y(e, t) : void 0;
                      }
                    }(o) || function () {
                      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()), (0, n.map)(function (e) {
                      return a.next(e[1]), e[0];
                    }), (0, n.share)());
                  return {
                    _stream: a,
                    _control: X(X({}, t), {}, {
                      _stream: i
                    })
                  };
                },
                datalogic: {
                  pre: function pre(e) {
                    return e;
                  }
                }
              });
            });
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return te(W().m(function e() {
          var t,
            n,
            r,
            o = arguments;
          return W().w(function (e) {
            for (;;) if (0 === e.n) return n = (t = o.length > 0 && void 0 !== o[0] ? o[0] : {}).refnode, r = t.refnodedata, t.nodelambda, t.contextuallambda, console.error("LEAF error: the logical construct built using the ".concat(r.leaf.logic.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(r.leaf.logic.args), ") cannot ") + "be defined as a lambda-scoped node."), e.a(2, function (e, t) {
              return X(X({}, D(e)), {}, {
                _control: t
              });
            });
          }, e);
        }));
      }
    },
    re = function re(e, t) {
      return {
        _bname: e,
        _content: t,
        _label: arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}
      };
    },
    oe = function oe(e, t) {
      return h(t) && (void 0 === e || e.includes(t._bname) || "*" === e) ? t._content : void 0;
    },
    ae = re("empty_bottle", "empty_data");
  function ie(e) {
    return ie = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, ie(e);
  }
  function ue() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _ce(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d4 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d4.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d4.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d4.v = r, _d4.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d4.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d4.n = -1), p(u, c)) : _d4.n = c : _d4.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d4.n < 0) ? c : n.call(r, _d4)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_ce(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _ce(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _ce(s, "constructor", l), _ce(l, "constructor", c), c.displayName = "GeneratorFunction", _ce(l, o, "GeneratorFunction"), _ce(s), _ce(s, o, "Generator"), _ce(s, r, function () {
      return this;
    }), _ce(s, "toString", function () {
      return "[object Generator]";
    }), (ue = function ue() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _ce(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _ce = function ce(e, t, n, r) {
      function a(t, n) {
        _ce(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _ce(e, t, n, r);
  }
  function le(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function fe(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? le(Object(n), !0).forEach(function (t) {
        se(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : le(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function se(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != ie(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != ie(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == ie(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function de(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function pe(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function be(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          pe(a, r, o, i, u, "next", e);
        }
        function u(e) {
          pe(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var me = function me(e) {
      if (!e) return "appview";
      var t = Object.keys(e).filter(function (e) {
        return "osview" === e || "osview2" === e;
      });
      return t.length > 0 ? t[0] : "appview";
    },
    ye = {
      dataflow: function dataflow(e) {
        return be(ue().m(function t() {
          var o,
            a,
            i,
            u,
            c,
            l,
            f,
            s = arguments;
          return ue().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return a = (o = s.length > 0 && void 0 !== s[0] ? s[0] : {}).refnode, o.refnodedata, i = o.nodelambda, u = o.contextuallambda, t.n = 1, qs({
                  refnode: a,
                  nodelambda: i,
                  contextuallambda: u,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return c = t.v, l = me(c), f = {
                  codebase: "leafscreenio.js",
                  refnode: a,
                  leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
                }, t.a(2, function (t, o) {
                  return jp(o, t, void 0, fe(fe({}, f), {}, {
                    metastep: "invoking screenio"
                  }), {
                    leaflogic: function leaflogic(e, t) {
                      console.log("start debugging");
                      var o,
                        a = new r.Subject(),
                        i = t._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                          if (Array.isArray(e)) return de(e);
                        }(o = e.map(function (e) {
                          return e._stream;
                        })) || function (e) {
                          if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                        }(o) || function (e, t) {
                          if (e) {
                            if ("string" == typeof e) return de(e, t);
                            var n = {}.toString.call(e).slice(8, -1);
                            return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? de(e, t) : void 0;
                          }
                        }(o) || function () {
                          throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                        }()), (0, n.switchMap)(function (e) {
                          var t = e.slice(1).filter(function (e) {
                            return void 0 !== e;
                          });
                          return 1 === t.length ? a.next(t[0]) : t.length > 1 && a.next(t), (0, r.of)(e[0]);
                        }), (0, n.share)());
                      return {
                        _stream: a,
                        _control: fe(fe({}, t), {}, {
                          _stream: i
                        })
                      };
                    },
                    datalogic: {
                      post: function post(t) {
                        var n = (Array.isArray(t) ? t : [t]).map(function (e) {
                          return oe("screenio", e);
                        }).filter(function (e) {
                          return e;
                        });
                        return console.log("screenio:", n), void 0 !== n && e.gos.leafio.getMasterSubsDir()[l].main.doWrite({
                          control: {},
                          data: n
                        }), re("screenio", "written");
                      }
                    }
                  });
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return be(ue().m(function e() {
          var t,
            n,
            r,
            o = arguments;
          return ue().w(function (e) {
            for (;;) if (0 === e.n) return n = (t = o.length > 0 && void 0 !== o[0] ? o[0] : {}).refnode, r = t.refnodedata, t.nodelambda, t.contextuallambda, console.error("LEAF error: the logical construct built using the ".concat(r.leaf.logic.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(r.leaf.logic.args), ") cannot ") + "be defined as a lambda-scoped node."), e.a(2, function (e, t) {
              return fe(fe({}, D(e)), {}, {
                _control: t
              });
            });
          }, e);
        }));
      }
    },
    _ge = function ge(e, t) {
      if (e.length > 0 && e[0] in t) return 1 === e.length ? t[e[0]] : _ge(e.slice(1), t[e[0]]);
    },
    _ve = function ve(e, t, n) {
      e.length > 0 && e[0] in t && (1 === e.length ? t[e[0]] = n : _ve(e.slice(1), t[e[0]], n));
    };
  var he = require("fast-safe-stringify");
  function we(e) {
    function t(e, t) {
      return e << t | e >>> 32 - t;
    }
    function n(e) {
      var t,
        n = "";
      for (t = 7; t >= 0; t--) n += (e >>> 4 * t & 15).toString(16);
      return n;
    }
    var r,
      o,
      a,
      i = [];
    i.length = 80;
    var u,
      c,
      l,
      f,
      s,
      d,
      p = 1732584193,
      b = 4023233417,
      m = 2562383102,
      y = 271733878,
      g = 3285377520,
      v = (e = function (e) {
        e = e.replace(/\r\n/g, "\n");
        for (var t = "", n = 0; n < e.length; n++) {
          var r = e.charCodeAt(n);
          r < 128 ? t += String.fromCharCode(r) : r > 127 && r < 2048 ? (t += String.fromCharCode(r >> 6 | 192), t += String.fromCharCode(63 & r | 128)) : (t += String.fromCharCode(r >> 12 | 224), t += String.fromCharCode(r >> 6 & 63 | 128), t += String.fromCharCode(63 & r | 128));
        }
        return t;
      }(e)).length,
      h = [];
    for (o = 0; o < v - 3; o += 4) a = e.charCodeAt(o) << 24 | e.charCodeAt(o + 1) << 16 | e.charCodeAt(o + 2) << 8 | e.charCodeAt(o + 3), h.push(a);
    switch (v % 4) {
      case 0:
        o = 2147483648;
        break;
      case 1:
        o = e.charCodeAt(v - 1) << 24 | 8388608;
        break;
      case 2:
        o = e.charCodeAt(v - 2) << 24 | e.charCodeAt(v - 1) << 16 | 32768;
        break;
      case 3:
        o = e.charCodeAt(v - 3) << 24 | e.charCodeAt(v - 2) << 16 | e.charCodeAt(v - 1) << 8 | 128;
    }
    for (h.push(o); h.length % 16 != 14;) h.push(0);
    for (h.push(v >>> 29), h.push(v << 3 & 4294967295), r = 0; r < h.length; r += 16) {
      for (o = 0; o < 16; o++) i[o] = h[r + o];
      for (o = 16; o <= 79; o++) i[o] = t(i[o - 3] ^ i[o - 8] ^ i[o - 14] ^ i[o - 16], 1);
      for (u = p, c = b, l = m, f = y, s = g, o = 0; o <= 19; o++) d = t(u, 5) + (c & l | ~c & f) + s + i[o] + 1518500249 & 4294967295, s = f, f = l, l = t(c, 30), c = u, u = d;
      for (o = 20; o <= 39; o++) d = t(u, 5) + (c ^ l ^ f) + s + i[o] + 1859775393 & 4294967295, s = f, f = l, l = t(c, 30), c = u, u = d;
      for (o = 40; o <= 59; o++) d = t(u, 5) + (c & l | c & f | l & f) + s + i[o] + 2400959708 & 4294967295, s = f, f = l, l = t(c, 30), c = u, u = d;
      for (o = 60; o <= 79; o++) d = t(u, 5) + (c ^ l ^ f) + s + i[o] + 3395469782 & 4294967295, s = f, f = l, l = t(c, 30), c = u, u = d;
      p = p + u & 4294967295, b = b + c & 4294967295, m = m + l & 4294967295, y = y + f & 4294967295, g = g + s & 4294967295;
    }
    return (n(p) + n(b) + n(m) + n(y) + n(g)).toLowerCase();
  }
  function Oe() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _e2(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d5 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d5.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d5.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d5.v = r, _d5.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d5.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d5.n = -1), p(u, c)) : _d5.n = c : _d5.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d5.n < 0) ? c : n.call(r, _d5)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_e2(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _e2(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _e2(s, "constructor", l), _e2(l, "constructor", c), c.displayName = "GeneratorFunction", _e2(l, o, "GeneratorFunction"), _e2(s), _e2(s, o, "Generator"), _e2(s, r, function () {
      return this;
    }), _e2(s, "toString", function () {
      return "[object Generator]";
    }), (Oe = function Oe() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _e2(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _e2 = function _e(e, t, n, r) {
      function a(t, n) {
        _e2(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _e2(e, t, n, r);
  }
  function je(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Se(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          je(a, r, o, i, u, "next", e);
        }
        function u(e) {
          je(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function ke(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || function (e, t) {
      if (e) {
        if ("string" == typeof e) return Te(e, t);
        var n = {}.toString.call(e).slice(8, -1);
        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Te(e, t) : void 0;
      }
    }(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Te(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var Ee = "github",
    Pe = function Pe(e) {
      if ("string" != typeof e) return e;
      var t = e.indexOf("?");
      if (-1 === t) return e;
      var n = e.slice(0, t),
        r = e.slice(t + 1);
      if (0 === r.length) return "".concat(n, "?");
      var o = r.split("&").map(function (e) {
        if (!e) return e;
        var t = ke(e.split("="), 1)[0];
        return t ? "".concat(t, "=REDACTED") : "REDACTED";
      }).join("&");
      return "".concat(n, "?").concat(o);
    },
    Ae = function Ae(e, t) {
      return "".concat(e, "/").concat(Pe(t));
    },
    xe = function xe(e) {
      var t, n;
      return e ? null !== (t = e.graph) && void 0 !== t && t.nodes ? e.graph.nodes : null !== (n = e.data) && void 0 !== n && null !== (n = n.graph) && void 0 !== n && n.nodes ? e.data.graph.nodes : e.nodes ? e.nodes : [] : [];
    },
    Ne = function Ne(e) {
      var t,
        n = ke(e.split("?"), 2),
        r = n[0],
        o = n[1],
        a = r.split("/");
      if ((null === (t = a[0]) || void 0 === t ? void 0 : t.toLowerCase()) === Ee && a.shift(), a.length < 3) return null;
      var i = a.shift(),
        u = a.shift();
      if (!i || !u) return null;
      var c = u.split("@"),
        l = c[0],
        f = c[1] || "main",
        s = a.join("/");
      return l && s ? (s.endsWith(".json") || (s = "".concat(s, ".json")), {
        user: i,
        repo: l,
        ref: f,
        path: s,
        query: o
      }) : null;
    },
    Fe = function Fe(e, t) {
      if ("string" == typeof e && e.toLowerCase() === Ee) return !0;
      if ("string" != typeof t) return !1;
      var n = t.toLowerCase();
      return n.startsWith("".concat(Ee, "/")) && n.includes("/");
    },
    Ie = function () {
      var e = Se(Oe().m(function e(t, n) {
        var r, o, a, i, u, c, l, f, s, d;
        return Oe().w(function (e) {
          for (;;) switch (e.n) {
            case 0:
              if (r = Ne(n)) {
                e.n = 1;
                break;
              }
              throw new Error("Invalid GitHub graph reference: ".concat(Pe(n)));
            case 1:
              if (globalThis.fetch) {
                e.n = 2;
                break;
              }
              throw new Error("GitHub graph fetch requires global fetch.");
            case 2:
              return o = r.user, a = r.repo, i = r.ref, u = r.path, c = r.query, l = "https://raw.githubusercontent.com/".concat(o, "/").concat(a, "/refs/heads/").concat(i, "/").concat(u).concat(c ? "?".concat(c) : ""), e.n = 3, globalThis.fetch(l);
            case 3:
              if ((f = e.v).ok) {
                e.n = 4;
                break;
              }
              throw new Error("Failed to fetch GitHub graph ".concat(Ae(t, n), ": ").concat(f.status));
            case 4:
              return e.n = 5, f.json();
            case 5:
              return s = e.v, d = xe(s), e.a(2, {
                graph: {
                  nodes: d
                }
              });
          }
        }, e);
      }));
      return function (t, n) {
        return e.apply(this, arguments);
      };
    }(),
    Le = function Le(e) {
      var t,
        n,
        _r2 = function r(e) {
          return e.hostEtaTree ? _r2(e.hostEtaTree) : e;
        },
        o = _r2(e),
        a = o.appmode,
        i = o.domain,
        u = o.appid,
        c = "https://www.leafgon.com/".concat(i, "/").concat(u, "/_etaTreeForest"),
        l = (0, j.v5)(c, j.v5.URL),
        f = o.mnemosyne.current[l],
        s = {
          initEtaTreeForest: function initEtaTreeForest() {
            l in o.mnemosyne.current ? console.error("LEAF Error: an attempt to initialize an already initialized instance of etaTreeForest detected. This is likely due to a bug in eta tree handling.") : o.mnemosyne.current[l] = {};
          },
          getEtaTree: (n = Se(Oe().m(function e(t, n) {
            var r, a;
            return Oe().w(function (e) {
              for (;;) switch (e.n) {
                case 0:
                  if (!((r = t + "/" + n) in f)) {
                    e.n = 1;
                    break;
                  }
                  return e.a(2, o.mnemosyne.current[l][r].tree);
                case 1:
                  return e.n = 2, s.parseGraphEtaTree(t, n);
                case 2:
                  return a = e.v, e.a(2, a);
                case 3:
                  return e.a(2);
              }
            }, e);
          })), function (e, t) {
            return n.apply(this, arguments);
          }),
          setEtaTree: function setEtaTree(e, t, n, r) {
            var a = e + "/" + t;
            o.mnemosyne.current[l][a] = {
              tree: n,
              parent: r
            };
          },
          removeEtaBush: function removeEtaBush(e, t) {
            var n = e + "/" + t,
              r = Object.entries(f).filter(function (e) {
                var t = ke(e, 2),
                  r = t[0],
                  o = t[1];
                return r !== n && o.parent !== n;
              }).reduce(function (e, t) {
                return e[t[0]] = t[1], e;
              }, {});
            o.mnemosyne.current[l] = r;
          },
          parseGraphEtaTree: (t = Se(Oe().m(function e(t, n) {
            var r, c, l, f, d, p, b, m, y, g, v, h, w, O;
            return Oe().w(function (e) {
              for (;;) switch (e.n) {
                case 0:
                  if (r = i, c = u, l = Ae(t, n), console.log("parseGraphEtaTree(): ", l, "parsing..."), null !== globalThis && void 0 !== globalThis && globalThis.DEBUG && (f = l, globalThis.trace[f] ? globalThis.trace[f].push("parsing") : globalThis.trace[f] = ["parsing"]), !Fe(t, n)) {
                    e.n = 2;
                    break;
                  }
                  return e.n = 1, Ie(t, n);
                case 1:
                  O = e.v, e.n = 4;
                  break;
                case 2:
                  return e.n = 3, o.leaflakeio.qm_methods.queryGraph({
                    _appmode: a,
                    _hostdomain: i,
                    _hostappid: u,
                    _domain: t,
                    _appid: n
                  });
                case 3:
                  O = e.v;
                case 4:
                  return (d = O) == {
                    graph: null
                  } && console.error("start debugging"), p = d.graph ? d.graph : {
                    nodes: []
                  }, b = p.nodes, m = pp(b), y = bp(m), v = Js(a, r, c, t, n, m, y, (g = o).leafio, g.leaflakeio, g.mnemosyne, g), h = g ? r + "/" + c : void 0, s.setEtaTree(t, n, v, h), console.log("parseGraphEtaTree(): ", l, "parsed"), null !== globalThis && void 0 !== globalThis && globalThis.DEBUG && (w = l, globalThis.trace[w] ? globalThis.trace[w].push("parsed") : globalThis.trace[w] = ["parsed"]), e.a(2, v);
              }
            }, e);
          })), function (e, n) {
            return t.apply(this, arguments);
          })
        };
      return s;
    };
  function De(e) {
    return De = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, De(e);
  }
  function Ge() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Ce(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d6 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d6.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d6.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d6.v = r, _d6.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d6.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d6.n = -1), p(u, c)) : _d6.n = c : _d6.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d6.n < 0) ? c : n.call(r, _d6)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Ce(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Ce(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Ce(s, "constructor", l), _Ce(l, "constructor", c), c.displayName = "GeneratorFunction", _Ce(l, o, "GeneratorFunction"), _Ce(s), _Ce(s, o, "Generator"), _Ce(s, r, function () {
      return this;
    }), _Ce(s, "toString", function () {
      return "[object Generator]";
    }), (Ge = function Ge() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Ce(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Ce = function Ce(e, t, n, r) {
      function a(t, n) {
        _Ce(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Ce(e, t, n, r);
  }
  function Me(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Re(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function qe(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Re(Object(n), !0).forEach(function (t) {
        Je(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Re(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Je(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != De(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != De(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == De(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function $e(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Ue(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          $e(a, r, o, i, u, "next", e);
        }
        function u(e) {
          $e(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Be = c("leafmemoryio"),
    ze = function ze(e, t, n, r) {
      return !!Object.keys(r).includes(e);
    },
    He = {
      dataflow: function dataflow(e) {
        return Ue(Ge().m(function t() {
          var o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y,
            g,
            v,
            w,
            O,
            _,
            S,
            k,
            T,
            E,
            P = arguments;
          return Ge().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return u = (i = P.length > 0 && void 0 !== P[0] ? P[0] : {}).refnode, c = i.refnodedata, l = i.nodelambda, f = i.contextuallambda, t.n = 1, qs({
                  refnode: u,
                  nodelambda: l,
                  contextuallambda: f,
                  etaTree: e.gos.etaTree
                });
              case 1:
                if (s = t.v, d = c.leaf.logic.args, p = _ge(Be.editorconfig.namedatakey, d), b = e.gos.etaTree, m = b.domain, y = b.appid, g = "www.leafgon.com/mnemosyne/".concat(m, "/").concat(y, "/").concat(p), v = (0, j.v5)(g, j.v5.URL), w = "global" in s, O = "on-tap" in s, _ = "proxy" in s, !(S = null === (o = e.gos.etaTree.leafgraph.thespade) || void 0 === o ? void 0 : o.uuid) || !w) {
                  t.n = 3;
                  break;
                }
                return t.n = 2, e.gos.etaTree.lookupRuntimeLambdaLUT("breezyforest", "main", S, e.gos.etaTree.leafgraph.edges.lambda.sourcelut[S], []);
              case 2:
                E = t.v, t.n = 4;
                break;
              case 3:
                E = void 0;
              case 4:
                return k = E, "4d34" === u.slice(0, 4) && console.log("start debugging"), w && ze(p, 0, 0, k), T = {
                  codebase: "leafmemoryio.js",
                  refnode: u,
                  leafnode: "jest" !== u && (null === (a = e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(u)) || void 0 === a ? void 0 : a.leafnode.data)
                }, t.a(2, function (t, o) {
                  "userinput1" === p && console.log(p), "details" === p && console.log(v);
                  var a = function a(t) {
                    var n = (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0) || v;
                    if (void 0 === t || function (e) {
                      return !!h(e) && ("empty_bottle" === e._bname || "nothing" === e._bname);
                    }(t)) {
                      if ("backdrop" === p && console.log("start debugging"), n in e.gos.etaTree.mnemosyne.current) {
                        var r = e.gos.etaTree.mnemosyne.current[n];
                        return O ? r.raw : re(p, r.raw, {
                          _type: "memoryio",
                          _command: "o",
                          _memoryname: p,
                          _refnode: u,
                          _nodelocation: {
                            domain: e.gos.etaTree.domain,
                            appid: e.gos.etaTree.appid
                          }
                        });
                      }
                      var o = O ? re("nothing", null, {
                        _type: "memoryio",
                        _command: "forget",
                        _memoryname: p,
                        _refnode: u,
                        _nodelocation: {
                          domain: e.gos.etaTree.domain,
                          appid: e.gos.etaTree.appid
                        }
                      }) : null;
                      return O ? o : re(p, o, {
                        _type: "memoryio",
                        _command: "forget",
                        _memoryname: p,
                        _refnode: u,
                        _nodelocation: {
                          domain: e.gos.etaTree.domain,
                          appid: e.gos.etaTree.appid
                        }
                      });
                    }
                    if ("captionwin" === p && console.log(p), "main" === p && "188d" === u.slice(0, 4) && console.log(p), h(l = t) && void 0 !== l._bname && "memoryio" === l._label._type && "forget" === l._label._command) {
                      var a = O ? re("nothing", null, {
                          _type: "memoryio",
                          _command: "io",
                          _memoryname: p,
                          _refnode: u,
                          _nodelocation: {
                            domain: e.gos.etaTree.domain,
                            appid: e.gos.etaTree.appid
                          }
                        }) : null,
                        i = he(a),
                        c = {
                          signature: we(i),
                          payload: i,
                          raw: a
                        };
                      return e.gos.etaTree.mnemosyne.current = qe(qe({}, e.gos.etaTree.mnemosyne.current), {}, Je({}, n, c)), O ? a : re(p, a, {
                        _type: "memoryio",
                        _command: "io",
                        _memoryname: p,
                        _refnode: u,
                        _nodelocation: {
                          domain: e.gos.etaTree.domain,
                          appid: e.gos.etaTree.appid
                        }
                      });
                    }
                    var l,
                      f = t,
                      s = he(f),
                      d = {
                        signature: we(s),
                        payload: s,
                        raw: f
                      };
                    return e.gos.etaTree.mnemosyne.current = qe(qe({}, e.gos.etaTree.mnemosyne.current), {}, Je({}, n, d)), O ? f : re(p, f, {
                      _type: "memoryio",
                      _command: "io",
                      _memoryname: p,
                      _refnode: u,
                      _nodelocation: {
                        domain: e.gos.etaTree.domain,
                        appid: e.gos.etaTree.appid
                      }
                    });
                  };
                  return jp(o, t, void 0, qe(qe({}, T), {}, {
                    metastep: "memory io " + p
                  }), {
                    leaflogic: function leaflogic(e, t) {
                      console.log("start debugging");
                      var o,
                        i = new r.Subject(),
                        u = t._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                          if (Array.isArray(e)) return Me(e);
                        }(o = e.map(function (e) {
                          return e._stream;
                        })) || function (e) {
                          if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                        }(o) || function (e, t) {
                          if (e) {
                            if ("string" == typeof e) return Me(e, t);
                            var n = {}.toString.call(e).slice(8, -1);
                            return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Me(e, t) : void 0;
                          }
                        }(o) || function () {
                          throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                        }()), (0, n.map)(function (e) {
                          if (_) {
                            var t = e[0].sid.slice(-1).pop(),
                              n = "www.leafgon.com/mnemosyne/".concat(m, "/").concat(y, "/").concat(p, "/").concat(t),
                              r = (0, j.v5)(n, j.v5.URL),
                              o = a(e[1], r);
                            i.next(o);
                          } else {
                            var u = a(e[1]);
                            i.next(u);
                          }
                          return e[0];
                        }), (0, n.share)());
                      return {
                        _stream: i,
                        _control: qe(qe({}, t), {}, {
                          _stream: u
                        })
                      };
                    },
                    datalogic: {
                      pre: function pre(e) {
                        return e;
                      }
                    }
                  });
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return Ue(Ge().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p = arguments;
          return Ge().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (o = (r = p.length > 0 && void 0 !== p[0] ? p[0] : {}).refnode, a = r.refnodedata, i = r.nodelambda, u = r.contextuallambda, c = {}, !(l = null === (n = e.gos.etaTree.leafgraph.thespade) || void 0 === n ? void 0 : n.uuid) || !e.gos.etaTree.leafgraph.edges.lambda.sourcelut[l].includes(o)) {
                  t.n = 4;
                  break;
                }
                if (f = a.leaf.logic.args, s = _ge(Be.editorconfig.namedatakey, f), !(i.length > 0)) {
                  t.n = 2;
                  break;
                }
                return t.n = 1, qs({
                  refnode: o,
                  nodelambda: i,
                  contextuallambda: u,
                  etaTree: e.gos.etaTree
                });
              case 1:
                d = t.v, c[s] = qe({}, d), t.n = 3;
                break;
              case 2:
                c[s] = {};
              case 3:
                return t.a(2, c);
              case 4:
                return console.error("LEAF error: the logical construct built using the ".concat(a.leaf.logic.type, " node ") + "(".concat(o, ") called with args (").concat(JSON.stringify(a.leaf.logic.args), ") cannot ") + "be defined as a lambda-scoped node."), t.a(2, c);
              case 5:
                return t.a(2);
            }
          }, t);
        }));
      },
      methods: function methods(e) {
        return function () {
          var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            n = (t.refnode, t.refnodedata, t.nodelambda, t.contextuallambda, function (e) {
              return e.hostEtaTree ? n(e.hostEtaTree) : e;
            }),
            r = n(e.gos.etaTree);
          return {
            etatreeforest: Le(r),
            general: {
              setMasterMemory: function setMasterMemory(t, n) {
                var o = e.gos.etaTree,
                  a = o.domain,
                  i = o.appid,
                  u = "www.leafgon.com/mnemosyne/".concat(a, "/").concat(i, "/").concat(t),
                  c = (0, j.v5)(u, j.v5.URL);
                return r.mnemosyne.current[c] = n, n;
              },
              getMasterMemory: function getMasterMemory(t) {
                var n = e.gos.etaTree,
                  o = n.domain,
                  a = n.appid,
                  i = "www.leafgon.com/mnemosyne/".concat(o, "/").concat(a, "/").concat(t),
                  u = (0, j.v5)(i, j.v5.URL);
                return r.mnemosyne.current[u];
              }
            }
          };
        };
      }
    };
  function Ve() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _We(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d7 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d7.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d7.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d7.v = r, _d7.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d7.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d7.n = -1), p(u, c)) : _d7.n = c : _d7.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d7.n < 0) ? c : n.call(r, _d7)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_We(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _We(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _We(s, "constructor", l), _We(l, "constructor", c), c.displayName = "GeneratorFunction", _We(l, o, "GeneratorFunction"), _We(s), _We(s, o, "Generator"), _We(s, r, function () {
      return this;
    }), _We(s, "toString", function () {
      return "[object Generator]";
    }), (Ve = function Ve() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _We(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _We = function We(e, t, n, r) {
      function a(t, n) {
        _We(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _We(e, t, n, r);
  }
  function Qe(e, t) {
    var _n3 = "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
    if (!_n3) {
      if (Array.isArray(e) || (_n3 = tt(e)) || t && e && "number" == typeof e.length) {
        _n3 && (e = _n3);
        var r = 0,
          o = function o() {};
        return {
          s: o,
          n: function n() {
            return r >= e.length ? {
              done: !0
            } : {
              done: !1,
              value: e[r++]
            };
          },
          e: function e(_e3) {
            throw _e3;
          },
          f: o
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var a,
      i = !0,
      u = !1;
    return {
      s: function s() {
        _n3 = _n3.call(e);
      },
      n: function n() {
        var e = _n3.next();
        return i = e.done, e;
      },
      e: function e(_e4) {
        u = !0, a = _e4;
      },
      f: function f() {
        try {
          i || null == _n3["return"] || _n3["return"]();
        } finally {
          if (u) throw a;
        }
      }
    };
  }
  function Ke(e) {
    return Ye(e) || nt(e) || tt(e) || Ze();
  }
  function Xe(e, t) {
    return Ye(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || tt(e, t) || Ze();
  }
  function Ze() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function Ye(e) {
    if (Array.isArray(e)) return e;
  }
  function et(e) {
    return function (e) {
      if (Array.isArray(e)) return rt(e);
    }(e) || nt(e) || tt(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function tt(e, t) {
    if (e) {
      if ("string" == typeof e) return rt(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? rt(e, t) : void 0;
    }
  }
  function nt(e) {
    if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
  }
  function rt(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function ot(e, t, n) {
    return t = lt(t), function (e, t) {
      if (t && ("object" == ft(t) || "function" == typeof t)) return t;
      if (void 0 !== t) throw new TypeError("Derived constructors may only return object or undefined");
      return at(e);
    }(e, ut() ? Reflect.construct(t, n || [], lt(e).constructor) : t.apply(e, n));
  }
  function at(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
  }
  function it(e) {
    var t = "function" == typeof Map ? new Map() : void 0;
    return it = function it(e) {
      if (null === e || !function (e) {
        try {
          return -1 !== Function.toString.call(e).indexOf("[native code]");
        } catch (t) {
          return "function" == typeof e;
        }
      }(e)) return e;
      if ("function" != typeof e) throw new TypeError("Super expression must either be null or a function");
      if (void 0 !== t) {
        if (t.has(e)) return t.get(e);
        t.set(e, n);
      }
      function n() {
        return function (e, t, n) {
          if (ut()) return Reflect.construct.apply(null, arguments);
          var r = [null];
          r.push.apply(r, t);
          var o = new (e.bind.apply(e, r))();
          return n && ct(o, n.prototype), o;
        }(e, arguments, lt(this).constructor);
      }
      return n.prototype = Object.create(e.prototype, {
        constructor: {
          value: n,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), ct(n, e);
    }, it(e);
  }
  function ut() {
    try {
      var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    } catch (e) {}
    return (ut = function ut() {
      return !!e;
    })();
  }
  function ct(e, t) {
    return ct = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (e, t) {
      return e.__proto__ = t, e;
    }, ct(e, t);
  }
  function lt(e) {
    return lt = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (e) {
      return e.__proto__ || Object.getPrototypeOf(e);
    }, lt(e);
  }
  function ft(e) {
    return ft = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, ft(e);
  }
  function st(e, t) {
    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
  }
  function dt(e, t) {
    for (var n = 0; n < t.length; n++) {
      var r = t[n];
      r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, bt(r.key), r);
    }
  }
  function pt(e, t, n) {
    return t && dt(e.prototype, t), n && dt(e, n), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function bt(e) {
    var t = function (e) {
      if ("object" != ft(e) || !e) return e;
      var t = e[Symbol.toPrimitive];
      if (void 0 !== t) {
        var n = t.call(e, "string");
        if ("object" != ft(n)) return n;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return String(e);
    }(e);
    return "symbol" == ft(t) ? t : t + "";
  }
  var mt,
    yt = function yt(e) {
      return void 0 !== e && e >= "0" && e <= "9";
    },
    gt = function gt(e) {
      return e >= "a" && e <= "z" || e >= "A" && e <= "Z" || "_" == e || "." == e || "-" == e;
    },
    vt = function vt(e) {
      return e >= "a" && e <= "z" || e >= "A" && e <= "Z" || "_" == e || "." == e || "-" == e || ":" == e;
    },
    ht = function ht(e) {
      return "=+-*/\\&%$_!<>?".includes(e);
    },
    wt = function () {
      return pt(function e(t, n, r, o) {
        st(this, e), this.source = t, this.startIndex = n, this.endIndex = r, this.line = o, this.offset = void 0;
      }, [{
        key: "start",
        get: function get() {
          return this.startIndex - (this.line <= 1 ? 0 : this.getLineOffset());
        }
      }, {
        key: "end",
        get: function get() {
          return this.endIndex - (this.line <= 1 ? 0 : this.getLineOffset());
        }
      }, {
        key: "length",
        get: function get() {
          return this.endIndex - this.startIndex;
        }
      }, {
        key: "getLineOffset",
        value: function value() {
          var e;
          if (void 0 === this.offset) {
            for (var t = new RegExp("(\n)", "mg"), n = null, r = 1; r < this.line; r++) n = t.exec(this.source);
            this.offset = null !== (e = null == n ? void 0 : n.index) && void 0 !== e ? e : 0;
          }
          return this.offset;
        }
      }]);
    }();
  wt.unknown = new wt("", -1, -1, -1), function (e) {
    e[e.Init = 0] = "Init", e[e.LeftParen = 1] = "LeftParen", e[e.RightParen = 2] = "RightParen", e[e.LeftBrace = 3] = "LeftBrace", e[e.RightBrace = 4] = "RightBrace", e[e.LeftSquare = 5] = "LeftSquare", e[e.RightSquare = 6] = "RightSquare", e[e.Dispatch = 7] = "Dispatch", e[e.True = 8] = "True", e[e.False = 9] = "False", e[e.Identifier = 10] = "Identifier", e[e.Keyword = 11] = "Keyword", e[e.String = 12] = "String", e[e.Integer = 13] = "Integer", e[e.Float = 14] = "Float", e[e.FractionNumber = 15] = "FractionNumber", e[e.Error = 16] = "Error", e[e.EOF = 17] = "EOF", e[e.Nothing = 18] = "Nothing";
  }(mt || (mt = {}));
  var Ot = pt(function e(t, n, r) {
    st(this, e), this.type = t, this.value = n, this.position = r;
  });
  Ot.INIT = new Ot(mt.Init, "", new wt("", 0, 0, 0));
  var _t,
    jt = function () {
      return pt(function e(t) {
        st(this, e), this.source = t, this.start = 0, this.current = 0, this.line = 1;
      }, [{
        key: "isEnd",
        value: function value() {
          return this.source.length === this.current;
        }
      }, {
        key: "advance",
        value: function value() {
          return this.current += 1, this.source[this.current - 1];
        }
      }, {
        key: "peek",
        value: function value() {
          return this.source[this.current];
        }
      }, {
        key: "peekNext",
        value: function value() {
          return this.source[this.current + 1];
        }
      }, {
        key: "makeToken",
        value: function value(e) {
          var t = this.start,
            n = this.line,
            r = this.current,
            o = this.source,
            a = e === mt.Keyword,
            i = o.substring(a ? t + 1 : t, r);
          return new Ot(e, i, new wt(o, t, r, n));
        }
      }, {
        key: "makeStringToken",
        value: function value() {
          var e = this.start,
            t = this.line,
            n = this.current,
            r = this.source,
            o = r.substring(e + 1, n - 1).replace(/\\n/g, "\n").replace(/\\\\/g, "\\").replace(/\\"/g, '"');
          return new Ot(mt.String, o, new wt(r, e, n, t));
        }
      }, {
        key: "errorToken",
        value: function value(e) {
          var t = this.start,
            n = this.line,
            r = this.current,
            o = this.source;
          return new Ot(mt.Error, e, new wt(o, t, r, n));
        }
      }, {
        key: "identifier",
        value: function value() {
          for (;;) {
            var e = this.peek();
            if (!e || !(gt(e) || yt(e) || ht(e))) break;
            this.advance();
          }
          return this.makeIdentifierToken();
        }
      }, {
        key: "makeIdentifierToken",
        value: function value() {
          var e = this.start,
            t = this.current;
          switch (this.source.substring(e, t)) {
            case "true":
              return this.makeToken(mt.True);
            case "false":
              return this.makeToken(mt.False);
            case "null":
              return this.makeToken(mt.Nothing);
            default:
              return this.makeToken(mt.Identifier);
          }
        }
      }, {
        key: "keyword",
        value: function value() {
          if (!vt(this.peek()) && !yt(this.peek())) return this.makeToken(mt.Identifier);
          for (; vt(this.peek()) || yt(this.peek());) this.advance();
          return this.makeToken(mt.Keyword);
        }
      }, {
        key: "number",
        value: function value() {
          for (; yt(this.peek());) this.advance();
          if ("." === this.peek() && yt(this.peekNext())) {
            for (this.advance(); yt(this.peek());) this.advance();
            return this.makeToken(mt.Float);
          }
          if ("/" === this.peek()) {
            if (!yt(this.peekNext())) return this.errorToken("Unterminated fraction number");
            for (this.advance(); yt(this.peek());) this.advance();
            return this.makeToken(mt.FractionNumber);
          }
          return this.makeToken(mt.Integer);
        }
      }, {
        key: "string",
        value: function value() {
          for (; '"' !== this.peek() && !this.isEnd();) "\n" === this.peek() && (this.line += 1), "\\" === this.peek() && this.advance(), this.advance();
          return this.isEnd() ? this.errorToken("Unterminated string") : (this.advance(), this.makeStringToken());
        }
      }, {
        key: "skipWhitespace",
        value: function value() {
          for (var e = 0;;) {
            switch (this.peek()) {
              case " ":
              case "\r":
              case "\t":
              case ",":
                this.advance();
                break;
              case "\n":
                this.line += 1, this.advance();
                break;
              case ";":
                if ("#" === this.peekNext()) {
                  for (this.advance(), this.advance(); "#" !== this.peek() && ";" !== this.peekNext() && !this.isEnd();) "\n" === this.peek() && (this.line += 1), this.advance();
                  this.advance(), this.advance();
                } else for (; "\n" !== this.peek() && !this.isEnd();) this.advance();
                break;
              default:
                return;
            }
            e += 1;
          }
          return e;
        }
      }, {
        key: "scanToken",
        value: function value() {
          if (this.skipWhitespace(), this.start = this.current, this.isEnd()) return this.makeToken(mt.EOF);
          var e = this.advance();
          if (yt(e) || "-" === e && yt(this.peek())) return this.number();
          if ((gt(e) || ht(e)) && !yt(e)) return this.identifier();
          switch (e) {
            case "(":
              return this.makeToken(mt.LeftParen);
            case ")":
              return this.makeToken(mt.RightParen);
            case "{":
              return this.makeToken(mt.LeftBrace);
            case "}":
              return this.makeToken(mt.RightBrace);
            case "[":
              return this.makeToken(mt.LeftSquare);
            case "]":
              return this.makeToken(mt.RightSquare);
            case "#":
              return this.makeToken(mt.Dispatch);
            case ":":
              return this.keyword();
            case '"':
              return this.string();
          }
          return this.errorToken("Unexpected character '".concat(e, "'."));
        }
      }, {
        key: "scanAllToken",
        value: function value() {
          for (var e = []; !this.isEnd();) e.push(this.scanToken());
          return e;
        }
      }]);
    }();
  !function (e) {
    e.Boolean = "bool", e.Integer = "int", e.Float = "float", e.FractionNumber = "fractionNumber", e.String = "string", e.Keyword = "keyword", e.Identifier = "identifier", e.List = "list", e.Nothing = "null";
  }(_t || (_t = {}));
  var St = pt(function e(t, n, r) {
      st(this, e), this.kind = t, this.value = n, this.position = r;
    }),
    kt = function (e) {
      function t(e, n) {
        var r;
        return st(this, t), "string" == typeof e ? r = ot(this, t, [e]) : (r = ot(this, t, [e.message])).stack = e.stack, r._position = n, at(r);
      }
      return function (e, t) {
        if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function");
        e.prototype = Object.create(t && t.prototype, {
          constructor: {
            value: e,
            writable: !0,
            configurable: !0
          }
        }), Object.defineProperty(e, "prototype", {
          writable: !1
        }), t && ct(e, t);
      }(t, e), pt(t, [{
        key: "position",
        get: function get() {
          return this._position;
        }
      }]);
    }(it(Error));
  kt.kind = "RuntimeError";
  var Tt = function Tt(e) {
      return e;
    },
    Et = function Et(e, t) {
      if (e) throw new kt(t);
      return !0;
    },
    Pt = function Pt(e, t, n) {
      return Et(e.length !== t, n || "Expected ".concat(t, " argument").concat(t > 1 ? "s" : "", ", but got ").concat(e.length, "."));
    },
    At = function At(e) {
      for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
      return Et(void 0 === n.find(function (t) {
        return t === e.kind;
      }), "Invalid function parameter, actual: '".concat(e.kind, "', expected: '").concat(n.join(" or "), "'."));
    },
    xt = function xt(e) {
      return function () {
        throw new kt("".concat(e, " is not implemented."));
      };
    },
    Nt = function Nt(e) {
      return {
        parser: function parser() {
          throw new kt("".concat(e, " is not implemented."));
        },
        factory: xt(e)
      };
    },
    Ft = {
      Bool: {
        parser: function parser(e) {
          return "true" === e;
        },
        factory: Boolean
      },
      Nothing: {
        parser: function parser(e) {
          return "null" == e;
        },
        factory: xt("NULL")
      },
      Int: {
        parser: function parser(e) {
          return parseInt(e, 10);
        },
        factory: Number
      },
      Float: {
        parser: parseFloat,
        factory: Number
      },
      String: {
        parser: function parser(e) {
          return e;
        },
        factory: String
      },
      FractionNumber: {
        parser: function parser(e) {
          return e;
        },
        factory: xt("FractionNumber")
      },
      Vector: Nt("Vector"),
      HashMap: Nt("HashMap")
    },
    It = "Vector",
    Lt = "HashMap",
    Dt = function () {
      return pt(function e(t) {
        var n = this,
          r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Ft;
        st(this, e), this.scanner = t, this.literals = r, this.hadError = !1, this.panicMode = !1, this.current = Ot.INIT, this._program = [], this._errors = [], this.dispatchMode = !1, this.missingParser = function (e) {
          n.errorAtCurrent("Missing parser '".concat(e, "'."));
        };
      }, [{
        key: "parse",
        value: function value() {
          try {
            for (this.checkLiteralParsers(), this.advance(); !this.isEnd();) {
              var e = this.expression();
              e && this._program.push(e);
            }
            this.consume(mt.EOF, "Expect end of program.");
          } finally {
            return {
              hasError: this.hadError,
              program: this.program,
              errors: this.errors
            };
          }
        }
      }, {
        key: "program",
        get: function get() {
          return this._program;
        }
      }, {
        key: "errors",
        get: function get() {
          return this._errors;
        }
      }, {
        key: "advance",
        value: function value() {
          for (; this.current = this.scanner.scanToken(), this.current.type === mt.Error;) this.errorAtCurrent(this.current.value);
        }
      }, {
        key: "consume",
        value: function value(e, t) {
          this.current.type != e ? this.errorAtCurrent(t) : this.advance();
        }
      }, {
        key: "errorAtCurrent",
        value: function value(e) {
          this.errorAt(this.current, e);
        }
      }, {
        key: "errorAt",
        value: function value(e, t) {
          if (!this.panicMode) throw this._errors.push({
            position: e.position,
            message: t
          }), this.hadError = !0, new Error(t);
        }
      }, {
        key: "isEnd",
        value: function value() {
          return this.peek().type === mt.EOF;
        }
      }, {
        key: "peek",
        value: function value() {
          return this.current;
        }
      }, {
        key: "expression",
        value: function value() {
          var e = this.current,
            t = this.literals,
            n = t.Bool,
            r = t.FractionNumber,
            o = t.Int,
            a = t.Float,
            i = t.String,
            u = t.Nothing;
          switch (e.type) {
            case mt.True:
            case mt.False:
              return this.makeLiteral(_t.Boolean, n.parser, e);
            case mt.Nothing:
              return this.makeLiteral(_t.Nothing, u.parser, e);
            case mt.Integer:
              return this.makeLiteral(_t.Integer, o.parser, e);
            case mt.Float:
              return this.makeLiteral(_t.Float, a.parser, e);
            case mt.FractionNumber:
              return this.makeLiteral(_t.FractionNumber, r.parser, e);
            case mt.String:
              return this.makeLiteral(_t.String, i.parser, e);
            case mt.Identifier:
              return this.makeLiteral(_t.Identifier, Tt, e);
            case mt.Keyword:
              return this.makeLiteral(_t.Keyword, i.parser, e);
            case mt.LeftParen:
              return new St(_t.List, this.advanceUntil(mt.RightParen), e.position);
            case mt.LeftSquare:
              return new St(_t.List, [new St(_t.Identifier, It, e.position)].concat(et(this.advanceUntil(mt.RightSquare))), e.position);
            case mt.LeftBrace:
              return new St(_t.List, [new St(_t.Identifier, Lt, e.position)].concat(et(this.advanceUntil(mt.RightBrace))), e.position);
            case mt.Dispatch:
              return this.formatDispatch();
            default:
              return void this.errorAtCurrent("Unknown token: '".concat(e.value, "'."));
          }
        }
      }, {
        key: "makeLiteral",
        value: function value(e, t, n) {
          var r = new St(e, t(this.current.value), n.position);
          return this.advance(), r;
        }
      }, {
        key: "advanceUntil",
        value: function value(e) {
          var t = [];
          for (this.advance(); this.current.type !== e && !this.isEnd();) {
            var n = this.expression();
            t.push(n);
          }
          return this.consume(e, "Expected '".concat(this.closeParentheses(e), "'.")), t;
        }
      }, {
        key: "formatDispatch",
        value: function value() {
          this.advance(), this.dispatchMode && this.errorAtCurrent("Nested dispatch expression not allowed."), this.dispatchMode = !0;
          var e = this.expression();
          e && e.kind === _t.List || this.errorAtCurrent("List expression expected after dispatch, but get '".concat(e && e.kind, "'."));
          var t = e,
            n = t;
          switch (t.value[0].value) {
            case Lt:
              this.errorAtCurrent("Invalid dispatch: #{...}.");
              break;
            case It:
              this.errorAtCurrent("Invalid dispatch: #[...].");
              break;
            default:
              n = this.anonymousFunction(t);
          }
          return this.dispatchMode = !1, n;
        }
      }, {
        key: "anonymousFunction",
        value: function value(e) {
          var t = function (e, t) {
              var n = [],
                _r3 = function r(e) {
                  switch (e.kind) {
                    case _t.Boolean:
                    case _t.Nothing:
                    case _t.Integer:
                    case _t.Float:
                    case _t.FractionNumber:
                    case _t.String:
                    case _t.Keyword:
                    case _t.Identifier:
                      return n = t(n, e);
                    case _t.List:
                      return e.value.map(_r3), n = t(n, e);
                  }
                };
              return _r3(e), n;
            }(e, function (e, t) {
              if (t.kind === _t.Identifier) {
                var n = t;
                /^%\d+$/.test(n.value) && e.push(parseInt(n.value.substr(1)));
              }
              return e;
            }).sort(function (e, t) {
              return e - t;
            }).reverse()[0],
            n = Array.from({
              length: t
            }, function (t, n) {
              return new St(_t.Identifier, "%".concat(n + 1), e.position);
            }),
            r = new St(_t.List, [new St(_t.Identifier, It, e.position)].concat(n), e.position);
          return new St(_t.List, [new St(_t.Identifier, "fn", e.position), r, e], e.position);
        }
      }, {
        key: "closeParentheses",
        value: function value(e) {
          switch (e) {
            case mt.RightParen:
              return ")";
            case mt.RightBrace:
              return "}";
            case mt.RightSquare:
              return "]";
          }
        }
      }, {
        key: "checkLiteralParsers",
        value: function value() {
          var e = this.literals,
            t = e.Bool,
            n = e.FractionNumber,
            r = e.Int,
            o = e.Float,
            a = e.String,
            i = e.Nothing;
          t.parser || this.missingParser("Bool"), r.parser || this.missingParser("Int"), o.parser || this.missingParser("Float"), n.parser || this.missingParser("FractionNumber"), a.parser || this.missingParser("String"), i.parser || this.missingParser("Nothing");
        }
      }]);
    }(),
    Gt = "<native function>",
    Ct = function () {
      function e(t, n) {
        var r = !(arguments.length > 2 && void 0 !== arguments[2]) || arguments[2],
          o = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : Gt;
        st(this, e), this._fn = t, this._arity = n, this._resolveIds = r, this._toString = o;
      }
      return pt(e, [{
        key: "call",
        value: function value(t, n, r) {
          var o = this,
            a = this.arity - r.length,
            i = this._resolveIds ? r.map(function (e) {
              return e.kind === _t.Identifier ? t.execLiteral(e, n) : e;
            }) : r;
          if (-1 === this.arity || 0 === a) return this._fn(t, n, i);
          if (a > 0) return new e(function (e, t, n) {
            return o._fn(e, t, [].concat(et(i), et(n)));
          }, a, this._resolveIds, this.toString());
          var u = this._fn(t, n, i.slice(0, this.arity));
          return u instanceof e ? u.call(t, n, i.slice(this.arity)) : Et(!0, "Expected ".concat(this.arity, " argument").concat(this.arity > 1 ? "s" : "", ", but got ").concat(r.length, "."));
        }
      }, {
        key: "arity",
        get: function get() {
          return this._arity;
        }
      }, {
        key: "toString",
        value: function value() {
          return this._toString === Gt ? Gt : "<".concat(this._toString, " function>");
        }
      }, {
        key: "toJS",
        value: function value() {
          return this.toString();
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return e.kind;
        }
      }]);
    }();
  Ct.kind = "Function";
  var Mt,
    Rt = function Rt(e) {
      var t;
      return new Ct(e.fn, e.arity, null === (t = e.resolveArgsIdentifiers) || void 0 === t || t, e.name || e.fn.name);
    },
    qt = function qt(e, t) {
      return Rt({
        name: e.name,
        arity: null != t ? t : e.length,
        fn: function fn(t, n, r) {
          var o = r.map(function (e) {
            return t.execLiteral(e, n);
          }, t);
          return e.apply(t, o);
        },
        resolveArgsIdentifiers: !0
      });
    },
    Jt = Rt({
      name: "const",
      arity: 1,
      fn: function fn(e, t, n) {
        Et(1 !== n.length, "Const expected 1 argument, but got ".concat(n.length, "."));
        var r = Xe(n, 1)[0];
        return Rt({
          name: "const",
          arity: -1,
          fn: function fn(e, t) {
            return e.execLiteral(r, t);
          }
        });
      }
    }),
    $t = Rt({
      name: "def",
      arity: 2,
      resolveArgsIdentifiers: !1,
      fn: function fn(e, t, n) {
        Pt(n, 2);
        var r = Xe(n, 2),
          o = r[0],
          a = r[1];
        At(o, _t.Identifier);
        var i = e.execLiteral(a, t);
        return t.define(o.value, i), i;
      }
    }),
    Ut = Rt({
      name: "defn",
      arity: -1,
      resolveArgsIdentifiers: !1,
      fn: function fn(e, t, n) {
        Pt(n, 3);
        var r = Xe(n, 3),
          o = r[0],
          a = r[1],
          i = r[2];
        return t.get("def").call(e, t, [o, new St(_t.List, [new St(_t.Identifier, "fn", wt.unknown), a, i], wt.unknown)]);
      }
    }),
    Bt = Rt({
      name: "if",
      arity: 3,
      fn: function fn(e, t, n) {
        Pt(n, 3);
        var r = Xe(n, 3),
          o = r[0],
          a = r[1],
          i = r[2],
          u = e.execLiteral(o, t),
          c = e.options.utils.unboxing(u);
        if (!0 === c) return e.execLiteral(a, t);
        if (!1 === c) return e.execLiteral(i, t);
        throw new kt("Expected boolean value in the if condition, but get '".concat(c, "'"));
      }
    }),
    zt = Rt({
      arity: -1,
      name: "case",
      fn: function fn(e, t, n) {
        Et(n.length < 2, "Case expected at least 2 argument, but got ".concat(n.length, "."));
        var r,
          o = Ke(n),
          a = o[0],
          i = rt(o).slice(1),
          u = e.execLiteral(a, t),
          c = Qe(i);
        try {
          for (c.s(); !(r = c.n()).done;) {
            var l = r.value;
            At(l, _t.List);
            var f = l.value;
            Pt(f, 2, "Case branch expected list with ".concat(2, " items, but got ", f.length));
            var s = Xe(f, 2),
              d = s[0],
              p = s[1],
              b = e.execLiteral(d, t),
              m = e.options.utils.unboxing(b);
            Et(!("else" === m || b instanceof Ct), "Case branch must start with a function or :else.");
            var y = !1;
            if ("else" === m) y = !0;else {
              var g = e.evalFn(b, [u]),
                v = e.options.utils.unboxing(g);
              Et(!("boolean" == typeof v), "Case branch function must return with Bool."), y = v;
            }
            if (y) return e.execLiteral(p, t);
          }
        } catch (e) {
          c.e(e);
        } finally {
          c.f();
        }
        Et(!0, "At least one of the case branch must match with the condition: ".concat(u));
      }
    }),
    Ht = function () {
      return pt(function e() {
        var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null;
        st(this, e), this.enclosing = t, this.values = Object.create(null), this.locked = Object.create(null);
      }, [{
        key: "define",
        value: function value(e, t) {
          var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
          if (this.locked[e]) throw new kt("'".concat(e, "' is locked and it is not re-definable."));
          this.values[e] = t, n && (this.locked[e] = !0);
        }
      }, {
        key: "get",
        value: function value(e) {
          if (this.values[e]) return this.values[e];
          if (null !== this.enclosing) return this.enclosing.get(e);
          throw new kt("Undefined identifier: '".concat(e, "'."));
        }
      }, {
        key: "assign",
        value: function value(e, t) {
          if (!this.values[e]) {
            if (null !== this.enclosing) return this.enclosing.assign(e, t);
            throw new kt("Undefined identifier: '".concat(e, "'."));
          }
          this.values[e] = t;
        }
      }, {
        key: "getNames",
        value: function value() {
          return Object.keys(this.values);
        }
      }, {
        key: "parent",
        get: function get() {
          return this.enclosing;
        }
      }]);
    }(),
    Vt = Rt({
      name: "fn",
      arity: -1,
      resolveArgsIdentifiers: !1,
      fn: function fn(e, t, n) {
        Pt(n, 2);
        var r = Xe(n, 2),
          o = r[0],
          a = r[1];
        At(o, _t.List);
        var i = o.value.slice(1);
        return i.map(function (e) {
          return At(e, _t.Identifier);
        }), Rt({
          name: "lambda",
          arity: i.length,
          fn: function fn(e, n, r) {
            Pt(r, i.length);
            var o = new Ht(t);
            i.forEach(function (t, a) {
              var i = e.execLiteral(r[a], n);
              o.define(t.value, i);
            });
            var u = e.execLiteral(a, o);
            return e.clearEnv(), u;
          }
        });
      }
    }),
    Wt = Rt({
      name: "do",
      arity: -1,
      fn: function fn(e, t, n) {
        return Et(n.length < 1, "Expected at least 1 argument, but got ".concat(n.length, ".")), n.map(function (n) {
          return e.execLiteral(n, t);
        }).pop();
      }
    }),
    Qt = Rt({
      name: "side-effect",
      arity: -1,
      fn: function fn(e, t, n) {
        Et(n.length < 1, "Eff expected at least 1 argument, but got ".concat(n.length, "."));
        var r = Ke(n),
          o = r[0],
          a = rt(r).slice(1),
          i = e.execLiteral(o, t);
        return Et(!(i instanceof Ct), "Eff first parameter must be a function."), Rt({
          name: "side-effect",
          arity: -1,
          fn: function fn(e) {
            return e.evalFn(i, a);
          }
        });
      }
    }),
    Kt = {
      stdout: void 0,
      lockedGlobals: !0,
      globals: {},
      utils: {
        unboxing: Tt
      }
    },
    Xt = [It, Lt],
    Zt = function () {
      return pt(function e(t, n) {
        var r = this;
        st(this, e), this.globals = new Ht(), this.currentEnv = this.globals, this.lastLiteral = void 0, this.lastPrint = void 0, this.execLiteral = function (e, t) {
          switch (r.currentEnv = t, r.lastLiteral = e, e.kind) {
            case _t.Boolean:
            case _t.Integer:
            case _t.Float:
            case _t.FractionNumber:
            case _t.String:
            case _t.Keyword:
            case _t.Nothing:
              return e.value;
            case _t.Identifier:
              return t.get(e.value);
            case _t.List:
              return r.execList(e, t);
            default:
              return e;
          }
        }, this.options = Object.assign(Object.assign({}, Kt), t);
        var o = this.options,
          a = o.stdout,
          i = o.globals,
          u = o.lockedGlobals,
          c = Object.assign(Object.assign({}, Ft), n);
        Object.keys(c).forEach(function (e) {
          var t = c[e].factory,
            n = Xt.includes(e) ? -1 : t.length;
          r.globals.define(e, qt(t, n));
        }), this.globals.define("print", qt(function (e) {
          var t;
          return (a || console.log)(e, null === (t = r.lastPrint) || void 0 === t ? void 0 : t.position);
        }, -1)), this.globals.define("const", Jt), this.globals.define("def", $t), this.globals.define("defn", Ut), this.globals.define("if", Bt), this.globals.define("case", zt), this.globals.define("fn", Vt), this.globals.define("do", Wt), this.globals.define("side-effect", Qt), Object.keys(i).forEach(function (e) {
          var t = i[e],
            n = t;
          "function" == typeof t && t.toString() !== Gt && (n = qt(t)), r.globals.define(e, n, u);
        });
      }, [{
        key: "interpret",
        value: function value(e) {
          var t = void 0;
          this.lastLiteral = e[0];
          try {
            var n,
              r = Qe(e);
            try {
              for (r.s(); !(n = r.n()).done;) {
                var o = n.value;
                this.lastLiteral = o, t = this.execLiteral(o, this.globals);
              }
            } catch (e) {
              r.e(e);
            } finally {
              r.f();
            }
          } catch (e) {
            throw e.king === kt.kind ? e : new kt(e, this.lastLiteral.position);
          }
          return t;
        }
      }, {
        key: "evalFn",
        value: function value(e, t) {
          return e.call(this, this.currentEnv, t);
        }
      }, {
        key: "execList",
        value: function value(e, t) {
          var n = Ke(e.value),
            r = n[0],
            o = rt(n).slice(1);
          "print" === r.value && (this.lastPrint = r);
          var a = this.execLiteral(r, t);
          if ("function" == typeof a.call) return a.call(this, t, o);
          throw new kt("'".concat(a, "' is not a function"), e.position);
        }
      }, {
        key: "getGlobalNames",
        value: function value() {
          return this.globals.getNames();
        }
      }, {
        key: "clearEnv",
        value: function value() {
          null !== this.currentEnv.parent && (this.currentEnv = this.currentEnv.parent);
        }
      }]);
    }();
  !function (e) {
    e.Parser = "Parser", e.Runtime = "Runtime";
  }(Mt || (Mt = {}));
  var Yt = function () {
    return pt(function e(t, n) {
      st(this, e), this.literals = n, this.interpreter = new Zt(t, n);
    }, [{
      key: "insituexecute",
      value: function value(e) {
        var t = new jt(e),
          n = new Dt(t, this.literals).parse();
        if (n.hasError) throw {
          type: Mt.Parser,
          errors: n.errors
        };
        try {
          return this.interpreter.interpret(n.program);
        } catch (e) {
          throw {
            type: Mt.Runtime,
            errors: [{
              message: e.message,
              position: e.position
            }]
          };
        }
      }
    }, {
      key: "execute",
      value: function value(e) {
        return t = this, n = void 0, r = void 0, o = Ve().m(function t() {
          var n, r, o, a;
          return Ve().w(function (t) {
            for (;;) switch (t.p = t.n) {
              case 0:
                if (n = new jt(e), r = new Dt(n, this.literals), !(o = r.parse()).hasError) {
                  t.n = 1;
                  break;
                }
                throw {
                  type: Mt.Parser,
                  errors: o.errors
                };
              case 1:
                t.p = 1, this.interpreter.interpret(o.program), t.n = 3;
                break;
              case 2:
                throw t.p = 2, a = t.v, {
                  type: Mt.Runtime,
                  errors: [{
                    message: a.message,
                    position: a.position
                  }]
                };
              case 3:
                return t.a(2);
            }
          }, t, this, [[1, 2]]);
        }), new (r || (r = Promise))(function (e, a) {
          function i(e) {
            try {
              c(o.next(e));
            } catch (e) {
              a(e);
            }
          }
          function u(e) {
            try {
              c(o["throw"](e));
            } catch (e) {
              a(e);
            }
          }
          function c(t) {
            var n;
            t.done ? e(t.value) : (n = t.value, n instanceof r ? n : new r(function (e) {
              e(n);
            })).then(i, u);
          }
          c((o = o.apply(t, n || [])).next());
        });
        var t, n, r, o;
      }
    }, {
      key: "evalFn",
      value: function value(e, t) {
        return this.interpreter.evalFn(e, t);
      }
    }]);
  }();
  function en(e) {
    return en = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, en(e);
  }
  function tn(e, t, n) {
    return (t = ln(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function nn(e) {
    return function (e) {
      if (Array.isArray(e)) return an(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || on(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function rn(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || on(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function on(e, t) {
    if (e) {
      if ("string" == typeof e) return an(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? an(e, t) : void 0;
    }
  }
  function an(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function un(e, t) {
    for (var n = 0; n < t.length; n++) {
      var r = t[n];
      r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, ln(r.key), r);
    }
  }
  function cn(e, t, n) {
    return t && un(e.prototype, t), n && un(e, n), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function ln(e) {
    var t = function (e) {
      if ("object" != en(e) || !e) return e;
      var t = e[Symbol.toPrimitive];
      if (void 0 !== t) {
        var n = t.call(e, "string");
        if ("object" != en(n)) return n;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return String(e);
    }(e);
    return "symbol" == en(t) ? t : t + "";
  }
  function fn(e, t) {
    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
  }
  function sn(e, t, n) {
    return t = yn(t), function (e, t) {
      if (t && ("object" == en(t) || "function" == typeof t)) return t;
      if (void 0 !== t) throw new TypeError("Derived constructors may only return object or undefined");
      return dn(e);
    }(e, bn() ? Reflect.construct(t, n || [], yn(e).constructor) : t.apply(e, n));
  }
  function dn(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
  }
  function pn(e) {
    var t = "function" == typeof Map ? new Map() : void 0;
    return pn = function pn(e) {
      if (null === e || !function (e) {
        try {
          return -1 !== Function.toString.call(e).indexOf("[native code]");
        } catch (t) {
          return "function" == typeof e;
        }
      }(e)) return e;
      if ("function" != typeof e) throw new TypeError("Super expression must either be null or a function");
      if (void 0 !== t) {
        if (t.has(e)) return t.get(e);
        t.set(e, n);
      }
      function n() {
        return function (e, t, n) {
          if (bn()) return Reflect.construct.apply(null, arguments);
          var r = [null];
          r.push.apply(r, t);
          var o = new (e.bind.apply(e, r))();
          return n && mn(o, n.prototype), o;
        }(e, arguments, yn(this).constructor);
      }
      return n.prototype = Object.create(e.prototype, {
        constructor: {
          value: n,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), mn(n, e);
    }, pn(e);
  }
  function bn() {
    try {
      var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    } catch (e) {}
    return (bn = function bn() {
      return !!e;
    })();
  }
  function mn(e, t) {
    return mn = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (e, t) {
      return e.__proto__ = t, e;
    }, mn(e, t);
  }
  function yn(e) {
    return yn = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (e) {
      return e.__proto__ || Object.getPrototypeOf(e);
    }, yn(e);
  }
  var gn,
    vn = function (e) {
      function t(e) {
        var n;
        return fn(this, t), "string" == typeof e ? n = sn(this, t, [e]) : (n = sn(this, t, [e.message])).stack = e.stack, dn(n);
      }
      return function (e, t) {
        if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function");
        e.prototype = Object.create(t && t.prototype, {
          constructor: {
            value: e,
            writable: !0,
            configurable: !0
          }
        }), Object.defineProperty(e, "prototype", {
          writable: !1
        }), t && mn(e, t);
      }(t, e), cn(t);
    }(pn(Error));
  !function (e) {
    e[e.Less = 0] = "Less", e[e.Equal = 1] = "Equal", e[e.Greater = 2] = "Greater";
  }(gn || (gn = {}));
  var hn = function () {
    function e(t) {
      fn(this, e), this._value = t;
    }
    return cn(e, [{
      key: "value",
      get: function get() {
        return this._value;
      }
    }, {
      key: "not",
      value: function value() {
        return new e(!this._value);
      }
    }, {
      key: "and",
      value: function value(t) {
        return new e(this._value && t._value);
      }
    }, {
      key: "or",
      value: function value(t) {
        return new e(this._value || t._value);
      }
    }, {
      key: "equals",
      value: function value(t) {
        return new e(this._value === t._value);
      }
    }, {
      key: "partialCmp",
      value: function value(e) {
        return this.value === e.value ? gn.Equal : this.value ? gn.Greater : gn.Less;
      }
    }, {
      key: "copy",
      value: function value() {
        return new e(this._value);
      }
    }, {
      key: "toString",
      value: function value() {
        return this._value ? "true" : "false";
      }
    }, {
      key: "toJS",
      value: function value() {
        return this._value;
      }
    }, {
      key: "toJSON",
      value: function value() {
        return this.toJS();
      }
    }, {
      key: "debugTypeOf",
      value: function value() {
        return _n(e.kind);
      }
    }], [{
      key: "fromJS",
      value: function value(t) {
        return new e(t);
      }
    }, {
      key: "fromStr",
      value: function value(t) {
        switch (t.value) {
          case "true":
            return new e(!0);
          case "false":
            return new e(!1);
          default:
            throw new vn('Invalid boolean: "'.concat(t.value, '".'));
        }
      }
    }]);
  }();
  hn.kind = "Bool";
  var wn = function wn(e) {
      return new hn(e);
    },
    On = function () {
      function e(t) {
        fn(this, e), this._value = t;
      }
      return cn(e, [{
        key: "value",
        get: function get() {
          return this._value;
        }
      }, {
        key: "add",
        value: function value(t) {
          return new e(this._value + t.value);
        }
      }, {
        key: "index",
        value: function value(t) {
          var n;
          return Number.isInteger(t.value) ? new e(null !== (n = this._value.charAt(t.value)) && void 0 !== n ? n : "") : new e("");
        }
      }, {
        key: "slice",
        value: function value(t, n) {
          return new e(this.value.slice(t.value, n.value));
        }
      }, {
        key: "equals",
        value: function value(e) {
          return wn(this._value === e.value);
        }
      }, {
        key: "partialCmp",
        value: function value(e) {
          var t = this._value.localeCompare(e.value);
          return t < 0 ? gn.Less : 0 === t ? gn.Equal : gn.Greater;
        }
      }, {
        key: "copy",
        value: function value() {
          return new e(this._value);
        }
      }, {
        key: "toJS",
        value: function value() {
          return this._value;
        }
      }, {
        key: "toJSON",
        value: function value() {
          return this.toJS();
        }
      }, {
        key: "toString",
        value: function value() {
          return "".concat(this._value);
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return new e(e.kind);
        }
      }, {
        key: "contains",
        value: function value(e) {
          return wn(this.value.indexOf(e.value) > -1);
        }
      }, {
        key: "count",
        value: function value() {
          return Ln(this.value.length);
        }
      }], [{
        key: "fromJS",
        value: function value(t) {
          return new e(t);
        }
      }, {
        key: "fromStr",
        value: function value(e) {
          return e.copy();
        }
      }]);
    }();
  On.kind = "String";
  var _n = function _n() {
      return new On(arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "");
    },
    jn = function () {
      function e() {
        fn(this, e), this._value = null;
      }
      return cn(e, [{
        key: "value",
        get: function get() {
          return null;
        }
      }, {
        key: "equals",
        value: function value(e) {
          return wn(this._value == e._value);
        }
      }, {
        key: "not",
        value: function value() {
          return wn(!0);
        }
      }, {
        key: "toJS",
        value: function value() {
          return null;
        }
      }, {
        key: "toJSON",
        value: function value() {
          return null;
        }
      }, {
        key: "toString",
        value: function value() {
          return "null";
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return _n(e.kind);
        }
      }], [{
        key: "fromStr",
        value: function value(t) {
          switch (t.value) {
            case "undefined":
            case "nil":
            case "null":
              return new e();
            default:
              throw new vn('Invalid Nothing literal: "'.concat(t.value, '".'));
          }
        }
      }]);
    }();
  jn.kind = "null";
  var Sn = new jn(),
    kn = function kn(e) {
      return ~~e;
    },
    Tn = function Tn(e) {
      return null == e || null == e || e == Sn;
    },
    En = function En(e, t) {
      if (e) throw new vn(t);
      return !0;
    },
    Pn = function Pn(e, t) {
      return En(e.constructor !== t.constructor, "Type Error! Expected '".concat(In(e), "', but got '").concat(In(t), "'"));
    },
    An = function An(e, t) {
      var n;
      return En(e !== t.constructor, "Expected '".concat(null !== (n = e.kind) && void 0 !== n ? n : e.name, "', but got '").concat(In(t), "'."));
    },
    xn = function xn(e, t) {
      return En(!e[t], '"'.concat(t.toString(), '" is not defined on ').concat(e));
    },
    Nn = function Nn(e) {
      return En(!Number.isInteger(e), "Expected integer number', but got '".concat(e, "'."));
    },
    Fn = function Fn(e, t) {
      return En(Tn(e), t), e;
    },
    In = function In(e) {
      var t, n, r, o;
      return null !== (o = null !== (n = null === (t = null == e ? void 0 : e.constructor) || void 0 === t ? void 0 : t.kind) && void 0 !== n ? n : null === (r = null == e ? void 0 : e.constructor) || void 0 === r ? void 0 : r.name) && void 0 !== o ? o : "unknown";
    };
  function Ln(e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
    if ("string" == typeof e) {
      Dn(e);
      var n = Gn(e) ? Cn(e) : Mn(e);
      return Ln(n.intValue, n.decimals);
    }
    return Number.isInteger(e) || 0 !== t ? (Nn(e), Nn(t), new Un(e, t)) : Ln(e.toString());
  }
  function Dn(e) {
    return En("" === e || isNaN(Number(e)), 'Invalid number: "'.concat(e, '"'));
  }
  function Gn(e) {
    return e.startsWith("0") ? /^0[eE]0$/.test(e) : /^[-+]?[1-9](\.\d+)?[eE][-+]?\d+$/.test(e);
  }
  function Cn(e) {
    En(!Gn(e), 'Input is not in scientific form: "'.concat(e, '"'));
    var t = e.split(/[eE]/),
      n = Mn(t[0]),
      r = parseInt(t[1]);
    return n.decimals > r ? n.decimals -= r : (n.intValue *= Math.pow(10, r - n.decimals), n.decimals = 0), n;
  }
  function Mn(e) {
    var t;
    Dn(e);
    var n = rn(e.split("."), 2)[1],
      r = null !== (t = null == n ? void 0 : n.length) && void 0 !== t ? t : 0;
    return {
      intValue: parseInt(e.replace(".", "")),
      decimals: r
    };
  }
  function Rn(e, t) {
    var n = Math.max(e.decimals, t.decimals);
    return {
      maxDecimal: n,
      intValue1: e.intValue * Math.pow(10, n - e.decimals),
      intValue2: t.intValue * Math.pow(10, n - t.decimals)
    };
  }
  var qn = {
      modulo: function modulo(e, t) {
        var n = e.value,
          r = t.value;
        return Nn(n), Nn(r), En(r < 1, "Modulo (".concat(r, ") must be positive.")), En(n < 0, "Number (".concat(n, ") cannot be negative.")), Ln(n % r);
      }
    },
    _Jn = function Jn(e, t) {
      return e !== t && e ? t ? _Jn(t, e % t) : e : t;
    },
    $n = function $n(e) {
      return Math.abs(e) <= Number.EPSILON;
    },
    Un = function () {
      function e(t) {
        var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
        fn(this, e);
        var r = function (e, t) {
          if (0 === e) return {
            intValue: 0,
            decimals: 0
          };
          for (; e > Number.MAX_SAFE_INTEGER || e % 10 == 0 && t > 0;) {
            var n = e.toString();
            e = parseInt(n.substring(0, n.length - 1)), t -= 1;
          }
          return {
            intValue: e,
            decimals: t
          };
        }(t, n);
        this._decimals = r.decimals, this._intValue = r.intValue;
      }
      return cn(e, [{
        key: "intValue",
        get: function get() {
          return this._intValue;
        }
      }, {
        key: "decimals",
        get: function get() {
          return this._decimals;
        }
      }, {
        key: "value",
        get: function get() {
          return this._intValue * Math.pow(10, -this._decimals);
        }
      }, {
        key: "equals",
        value: function value(e) {
          return wn((t = this.value, n = e.value, $n(t - n)));
          var t, n;
        }
      }, {
        key: "negate",
        value: function value() {
          return new e(-this.intValue, this.decimals);
        }
      }, {
        key: "add",
        value: function value(t) {
          var n = Rn(this, t);
          return new e(n.intValue1 + n.intValue2, n.maxDecimal);
        }
      }, {
        key: "subtract",
        value: function value(t) {
          var n = Rn(this, t);
          return new e(n.intValue1 - n.intValue2, n.maxDecimal);
        }
      }, {
        key: "multiply",
        value: function value(t) {
          return new e(this.intValue * t.intValue, this.decimals + t.decimals);
        }
      }, {
        key: "divide",
        value: function value(t) {
          if (0 === t.intValue) throw new vn("Cannot divide by zero!");
          var n = Rn(this, t);
          return new e(Math.round(n.intValue1 / n.intValue2 * Math.pow(10, 12)), 12);
        }
      }, {
        key: "partialCmp",
        value: function value(e) {
          var t = Rn(this, e);
          return t.intValue1 < t.intValue2 ? gn.Less : t.intValue1 > t.intValue2 ? gn.Greater : gn.Equal;
        }
      }, {
        key: "toJS",
        value: function value() {
          return this.intValue / Math.pow(10, this.decimals);
        }
      }, {
        key: "toString",
        value: function value() {
          return "".concat((e = this.intValue, t = this.decimals, (e / Math.pow(10, t)).toFixed(t)));
          var e, t;
        }
      }, {
        key: "copy",
        value: function value() {
          return new e(this.intValue, this.decimals);
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return _n(e.kind);
        }
      }, {
        key: "isInteger",
        value: function value() {
          return wn(0 === this.decimals);
        }
      }, {
        key: "toJSON",
        value: function value() {
          return this.toString();
        }
      }]);
    }();
  Un.kind = "Number";
  var Bn = function Bn(e) {
      return function (t) {
        An(Un, t);
        try {
          return Ln(e(t.value));
        } catch (n) {
          throw new vn("Invalid argument for ".concat(e.name, ": ").concat(t.value));
        }
      };
    },
    zn = function zn(e) {
      return function (t, n) {
        return An(Un, t), An(Un, n), Ln(e(t.value, n.value));
      };
    },
    Hn = Ln(Math.E),
    Vn = Ln(Math.LN2),
    Wn = Ln(Math.LN10),
    Qn = Ln(Math.LOG2E),
    Kn = Ln(Math.LOG10E),
    Xn = Ln(Math.PI),
    Zn = Ln(Math.SQRT1_2),
    Yn = Ln(Math.SQRT2),
    er = Bn(Math.abs),
    tr = Bn(Math.sign),
    nr = zn(function (e, t) {
      return Math.min(e, t);
    }),
    rr = zn(function (e, t) {
      return Math.max(e, t);
    }),
    or = Bn(Math.floor),
    ar = Bn(Math.round),
    ir = Bn(Math.ceil),
    ur = Bn(Math.trunc),
    cr = Bn(Math.cbrt),
    lr = Bn(Math.sqrt),
    fr = Bn(Math.exp),
    sr = zn(Math.pow),
    dr = Bn(Math.log),
    pr = Bn(Math.log2),
    br = Bn(Math.log10),
    mr = Math.PI / 180,
    yr = Bn(function (e) {
      var t = e % Math.PI;
      return $n(t) || $n(t - Math.PI) ? 0 : Math.sin(e);
    }),
    gr = Bn(Math.asin),
    vr = Bn(Math.asinh),
    hr = Bn(Math.cos),
    wr = Bn(Math.acos),
    Or = Bn(Math.acosh),
    _r = Bn(Math.tan),
    jr = Bn(Math.atan),
    Sr = zn(Math.atan2),
    kr = Bn(Math.atanh),
    Tr = Object.freeze({
      __proto__: null,
      E: Hn,
      LN2: Vn,
      LN10: Wn,
      LOG2E: Qn,
      LOG10E: Kn,
      PI: Xn,
      SQRT1_2: Zn,
      SQRT2: Yn,
      abs: er,
      sign: tr,
      min: nr,
      max: rr,
      floor: or,
      round: ar,
      ceil: ir,
      trunc: ur,
      cbrt: cr,
      sqrt: lr,
      exp: fr,
      pow: sr,
      log: dr,
      log2: pr,
      log10: br,
      deg2rad: function deg2rad(e) {
        return e.multiply(Ln(mr));
      },
      rad2deg: function rad2deg(e) {
        return e.divide(Ln(mr));
      },
      sin: yr,
      asin: gr,
      asinh: vr,
      cos: hr,
      acos: wr,
      acosh: Or,
      tan: _r,
      atan: jr,
      atan2: Sr,
      atanh: kr
    }),
    Er = function Er(e) {
      return xn(e, "copy"), e.copy();
    },
    Pr = {
      "typeof": function _typeof(e) {
        var t = e.debugTypeOf ? e.debugTypeOf() : _n("<unknown>");
        return t instanceof String ? _n(t) : t;
      },
      copy: Er,
      "deep-copy": function deepCopy(e) {
        var t;
        return xn(e, "copy"), e.deepCopy ? null === (t = e.deepCopy) || void 0 === t ? void 0 : t.call(e) : Er(e);
      },
      str: function str(e) {
        return _n(e.toString());
      },
      "to-json": function toJson(e) {
        var t = null;
        return "function" == typeof e.toJSON ? t = e.toJSON() : "function" == typeof e.toJS && (t = e.toJS()), _n(JSON.stringify(t));
      }
    },
    Ar = function Ar(e, t) {
      return e.constructor !== t.constructor ? wn(!1) : e.equals(t);
    },
    xr = function xr(e, t) {
      Pn(e, t);
      var n = e.lt;
      return "function" == typeof n ? n(t) : wn(e.partialCmp(t) === gn.Less);
    },
    Nr = function Nr(e, t) {
      Pn(e, t);
      var n = e.gt;
      return "function" == typeof n ? n(t) : wn(e.partialCmp(t) === gn.Greater);
    },
    Fr = {
      "==": Ar,
      "!=": function _(e, t) {
        return Ar(e, t).not();
      },
      "<": xr,
      "<=": function _(e, t) {
        return wn(Ar(e, t).value || xr(e, t).value);
      },
      ">": Nr,
      ">=": function _(e, t) {
        return wn(Ar(e, t).value || Nr(e, t).value);
      }
    },
    Ir = function Ir(e, t) {
      return Pn(e, t), e.add(t);
    },
    Lr = function Lr(e, t) {
      return Pn(e, t), e.multiply(t);
    },
    Dr = {
      negate: function negate(e) {
        return e.negate();
      },
      not: function not(e) {
        return e.not();
      },
      and: function and(e, t) {
        return e.and(t);
      },
      or: function or(e, t) {
        return e.or(t);
      },
      "+": Ir,
      "-": function _(e, t) {
        return Pn(e, t), e.subtract(t);
      },
      "*": Lr,
      "/": function _(e, t) {
        return Pn(e, t), e.divide(t);
      },
      get: function get(e, t) {
        return e.index(t);
      }
    },
    Gr = function () {
      function e(t) {
        fn(this, e), t.map(function (e) {
          return Pn(t[0], e);
        }), this._value = t;
      }
      return cn(e, [{
        key: "value",
        get: function get() {
          return this._value;
        }
      }, {
        key: "contains",
        value: function value(e) {
          return wn(void 0 !== this.value.find(function (t) {
            return Ar(t, e).value;
          }));
        }
      }, {
        key: "add",
        value: function value(t) {
          return new e(this._value.concat(t.value));
        }
      }, {
        key: "count",
        value: function value() {
          var e;
          return new Un(null !== (e = this._value.length) && void 0 !== e ? e : 0);
        }
      }, {
        key: "map",
        value: function value(t) {
          return new e(this.value.map(function (e) {
            return t(e);
          }));
        }
      }, {
        key: "filter",
        value: function value(t) {
          return new e(this.value.filter(function (e) {
            return t(e).toJS();
          }));
        }
      }, {
        key: "reverse",
        value: function value() {
          return new e(this.value.reverse());
        }
      }, {
        key: "reduce",
        value: function value(e, t) {
          return this.value.reduce(t, e);
        }
      }, {
        key: "intersperse",
        value: function value(t) {
          var n = this.value.length - 1;
          return new e(this.value.reduce(function (e, r, o) {
            return e.push(r), o < n && e.push(t), e;
          }, []));
        }
      }, {
        key: "toJS",
        value: function value() {
          return this.value.map(function (e) {
            return e.toJS();
          });
        }
      }, {
        key: "toJSON",
        value: function value() {
          return this.value.map(function (e) {
            return e.toJSON();
          });
        }
      }, {
        key: "toString",
        value: function value() {
          return "[".concat(this._value.map(function (e) {
            return e.toString();
          }).join(","), "]");
        }
      }, {
        key: "index",
        value: function value(e) {
          return An(Un, e), Fn(this.value[e.value], "Vector index ".concat(e.toString(), " is not defined"));
        }
      }, {
        key: "slice",
        value: function value(t, n) {
          return An(Un, t), An(Un, n), new e(this.value.slice(t.value, n.value));
        }
      }, {
        key: "copy",
        value: function value() {
          return new e(nn(this._value));
        }
      }, {
        key: "deepCopy",
        value: function value() {
          return new e(this._value.map(function (e) {
            return Er(e);
          }));
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return _n(e.kind);
        }
      }]);
    }();
  function Cr() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
    return new Gr(t);
  }
  Gr.kind = "Vector";
  var Mr = {
      sum: function sum(e) {
        return An(Gr, e), e.reduce(Ln(0), Ir);
      },
      prod: function prod(e) {
        return An(Gr, e), e.reduce(Ln(1), Lr);
      },
      intersperse: function intersperse(e, t) {
        return An(Gr, t), t.intersperse(e);
      },
      join: function join(e) {
        return An(Gr, e), e.reduce(_n(""), Ir);
      },
      "join-with": function joinWith(e, t) {
        return An(Gr, t), t.intersperse(e).reduce(_n(""), Ir);
      },
      "num-list": function numList(e, t) {
        return An(Gr, t), t.map(function (e) {
          return _n(e.toString());
        }).intersperse(e).reduce(_n(""), Ir);
      },
      head: function head(e) {
        return An(Gr, e), Fn(e.value[0], "Vector is empty");
      },
      reverse: function reverse(e) {
        return An(Gr, e), Cr.apply(void 0, nn(e.value.reverse()));
      },
      slice: function slice(e, t, n) {
        return An(Gr, e), An(Un, n), An(Un, t), Fn(e.value.length, "Vector is not defined correctly"), Cr.apply(void 0, nn(e.value.slice(t.value, n.value)));
      },
      tail: function tail(e) {
        return An(Gr, e), Fn(e.value.length, "Vector is not defined correctly"), Cr.apply(void 0, nn(e.value.slice(1)));
      }
    },
    Rr = Math.random,
    qr = Object.freeze({
      __proto__: null,
      random: function random() {
        return Ln(Rr());
      },
      randomInt: function randomInt(e, t) {
        var n = kn(e.value),
          r = kn(t.value);
        return Ln(kn(n + Rr() * (r - n)));
      },
      shuffle: function shuffle(e) {
        var t,
          n,
          r,
          o = nn(e.value);
        for (r = o.length - 1; r > 0; r--) t = Math.floor(Math.random() * (r + 1)), n = o[r], o[r] = o[t], o[t] = n;
        return Cr.apply(void 0, nn(o));
      },
      range: function range(e, t, n) {
        for (var r = e.value, o = n.value, a = kn(t.value), i = r, u = [], c = 0; c < a; c++) u.push(Ln(i)), i += o;
        return Cr.apply(void 0, u);
      },
      range0: function range0(e) {
        var t = kn(e.value);
        return Cr.apply(void 0, nn(Array.from({
          length: t
        }, function (e, t) {
          return Ln(t);
        })));
      }
    }),
    Jr = function () {
      function e(t) {
        fn(this, e), this._value = t;
      }
      return cn(e, [{
        key: "value",
        get: function get() {
          return this._value;
        }
      }, {
        key: "toJS",
        value: function value() {
          var e, t;
          return null === (t = null === (e = this._value) || void 0 === e ? void 0 : e.toJS) || void 0 === t ? void 0 : t.call(e);
        }
      }, {
        key: "toJSON",
        value: function value() {
          return this.toJS();
        }
      }, {
        key: "toString",
        value: function value() {
          return "Just(".concat(this._value.toString(), ")");
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return _n(e.kind);
        }
      }]);
    }();
  Jr.kind = "Just";
  var $r = function () {
    function e() {
      var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      if (fn(this, e), t.length % 2 != 0) throw new vn("Invalid hash map definition.\nDefinition must contains key value pairs");
      var n = function (e) {
        for (var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 2, n = [], r = e.length, o = 0; o < r; o += t) n.push(e.slice(o, o + t));
        return n;
      }(t).map(function (e) {
        var t = rn(e, 2),
          n = t[0],
          r = t[1];
        if (On !== n.constructor) throw new vn("Invalid hash map definition.\n Keys are must be string or keyword");
        return [n.value, r];
      });
      this._value = new Map(n);
    }
    return cn(e, [{
      key: "value",
      get: function get() {
        return this._value;
      }
    }, {
      key: "toJS",
      value: function value() {
        return new Map(Array.from(this._value.entries()).map(function (e) {
          var t = rn(e, 2),
            n = t[0],
            r = t[1];
          return [n, r instanceof Un ? r.toString() : r.toJS()];
        }));
      }
    }, {
      key: "toJSON",
      value: function value() {
        return Array.from(this._value.entries()).reduce(function (e, t) {
          var n = rn(t, 2),
            r = n[0],
            o = n[1];
          return e[r] = o.toJSON(), e;
        }, {});
      }
    }, {
      key: "toString",
      value: function value() {
        return "{".concat(Array.from(this._value.entries()).map(function (e) {
          var t = rn(e, 2),
            n = t[0],
            r = t[1];
          return "".concat(n.toString(), " -> ").concat(r.toString());
        }).join(", "), "}");
      }
    }, {
      key: "debugTypeOf",
      value: function value() {
        return _n(e.kind);
      }
    }, {
      key: "index",
      value: function value(e) {
        An(On, e);
        try {
          var t = this._value.get(e.value);
          return Tn(t) ? new jn() : t;
        } catch (e) {
          return new jn();
        }
      }
    }]);
  }();
  $r.kind = "HashMap";
  var Ur = function Ur() {
      for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
      return new $r(t);
    },
    Br = {
      keys: function keys(e) {
        return An($r, e), Cr.apply(void 0, nn(Array.from(e.value.keys()).map(function (e) {
          return _n(e);
        })));
      },
      values: function values(e) {
        return An($r, e), Cr.apply(void 0, nn(Array.from(e.value.values())));
      },
      "hash-map": Ur
    },
    zr = function () {
      function e(t) {
        fn(this, e);
        var n = t.value;
        n.map(function (e) {
          return Pn(n[0], e);
        }), this._value = n.reduce(function (e, t) {
          return e.find(function (e) {
            return Ar(e, t).value;
          }) || e.push(t), e;
        }, []);
      }
      return cn(e, [{
        key: "value",
        get: function get() {
          return this._value;
        }
      }, {
        key: "contains",
        value: function value(e) {
          return wn(void 0 !== this.value.find(function (t) {
            return Ar(t, e).value;
          }));
        }
      }, {
        key: "union",
        value: function value(t) {
          return new e(Cr.apply(void 0, nn(this._value.concat(t.value))));
        }
      }, {
        key: "difference",
        value: function value(t) {
          return new e(Cr.apply(void 0, nn(this.value.filter(function (e) {
            return !t.contains(e).value;
          }))));
        }
      }, {
        key: "intersection",
        value: function value(t) {
          var n = this;
          return new e(Cr.apply(void 0, nn(this.value.concat(t.value).filter(function (e) {
            return t.contains(e).value && n.contains(e).value;
          }))));
        }
      }, {
        key: "symmetricDifference",
        value: function value(t) {
          var n = this;
          return new e(Cr.apply(void 0, nn(this.value.concat(t.value).filter(function (e) {
            return !(t.contains(e).value && n.contains(e).value);
          }))));
        }
      }, {
        key: "count",
        value: function value() {
          var e;
          return new Un(null !== (e = this._value.length) && void 0 !== e ? e : 0);
        }
      }, {
        key: "map",
        value: function value(t) {
          return new e(Cr.apply(void 0, nn(this.value.map(t))));
        }
      }, {
        key: "filter",
        value: function value(t) {
          return new e(Cr.apply(void 0, nn(this.value.filter(function (e) {
            return t(e).toJS();
          }))));
        }
      }, {
        key: "reduce",
        value: function value(e, t) {
          return this.value.reduce(t, e);
        }
      }, {
        key: "toJS",
        value: function value() {
          return this.value.map(function (e) {
            return e.toJS();
          });
        }
      }, {
        key: "toJSON",
        value: function value() {
          return this.value.map(function (e) {
            return e.toJSON();
          });
        }
      }, {
        key: "toString",
        value: function value() {
          return "[".concat(this.value.map(function (e) {
            return e.toString();
          }).join(","), "]");
        }
      }, {
        key: "copy",
        value: function value() {
          return new e(Cr.apply(void 0, nn(this.value)));
        }
      }, {
        key: "deepCopy",
        value: function value() {
          return new e(Cr.apply(void 0, nn(this.value.map(function (e) {
            return Er(e);
          }))));
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return _n(e.kind);
        }
      }]);
    }();
  zr.kind = "Set";
  var Hr = {
      Set: function Set(e) {
        return new zr(e);
      },
      "set-2-list": function set2List(e) {
        return Cr.apply(void 0, nn(e.value));
      },
      "set-union": function setUnion(e, t) {
        return e.union(t);
      },
      "set-diff": function setDiff(e, t) {
        return e.difference(t);
      },
      "set-intersection": function setIntersection(e, t) {
        return e.intersection(t);
      },
      "set-symmetric-difference": function setSymmetricDifference(e, t) {
        return e.symmetricDifference(t);
      }
    },
    Vr = function Vr(e, t) {
      return Number.isInteger(e) && Number.isInteger(t) && 0 !== t;
    },
    Wr = function () {
      function e(t, n) {
        if (fn(this, e), !Vr(t, n)) throw new vn("Invalid fraction number parameters!");
        n < 0 && (t *= -1, n *= -1);
        var r = _Jn(Math.abs(t), Math.abs(n));
        this._n = t / r, this._d = n / r;
      }
      return cn(e, [{
        key: "numerator",
        get: function get() {
          return this._n;
        }
      }, {
        key: "denominator",
        get: function get() {
          return this._d;
        }
      }, {
        key: "equals",
        value: function value(e) {
          return wn(this.numerator === e.numerator && this.denominator === e.denominator);
        }
      }, {
        key: "negate",
        value: function value() {
          return new e(-this._n, this._d);
        }
      }, {
        key: "add",
        value: function value(t) {
          return new e(this.numerator * t.denominator + this.denominator * t.numerator, this.denominator * t.denominator);
        }
      }, {
        key: "subtract",
        value: function value(t) {
          return new e(this.numerator * t.denominator - this.denominator * t.numerator, this.denominator * t.denominator);
        }
      }, {
        key: "multiply",
        value: function value(t) {
          return new e(this.numerator * t.numerator, this.denominator * t.denominator);
        }
      }, {
        key: "divide",
        value: function value(t) {
          return new e(this.numerator * t.denominator, this.denominator * t.numerator);
        }
      }, {
        key: "partialCmp",
        value: function value(e) {
          var t = this._d * e._d / _Jn(this._d, e._d),
            n = this._n * t / this._d,
            r = e._n * t / e._d;
          return n < r ? gn.Less : n > r ? gn.Greater : gn.Equal;
        }
      }, {
        key: "toJS",
        value: function value() {
          return {
            numerator: this._n,
            denominator: this._d
          };
        }
      }, {
        key: "toJSON",
        value: function value() {
          return this.toString();
        }
      }, {
        key: "toString",
        value: function value() {
          return "".concat(this._n, "/").concat(this._d);
        }
      }, {
        key: "copy",
        value: function value() {
          return new e(this._n, this._d);
        }
      }, {
        key: "debugTypeOf",
        value: function value() {
          return _n(e.kind);
        }
      }]);
    }();
  Wr.kind = "Fraction";
  var Qr = function Qr(e, t) {
      return new Wr(e, t);
    },
    Kr = tn(tn(tn({}, "number-2-fraction", function (e, t) {
      var n = e.value;
      En(n < 1 || !Number.isInteger(n), "Accuracy must be a positive integer number instead of ".concat(n));
      var r = t.value,
        o = Math.pow(10, n);
      return Qr(Math.round(r * o), o);
    }), "fraction-2-number", function (e) {
      return Ln(e.numerator).divide(Ln(e.denominator));
    }), "reciprocal", function (e) {
      return An(Wr, e), Qr(e.denominator, e.numerator);
    }),
    Xr = function Xr(e) {
      return e;
    },
    Zr = {
      Bool: {
        parser: function parser(e) {
          return hn.fromStr(_n(e));
        },
        factory: function factory(e) {
          return An(hn, e), e;
        }
      },
      Nothing: {
        parser: function parser(e) {
          return jn.fromStr(_n(e));
        },
        factory: function factory(e) {
          return An(jn, e), e;
        }
      },
      Int: {
        parser: Ln,
        factory: function factory(e) {
          return An(Un, e), En(!e.isInteger().value, "Expected integer, but got float number."), e;
        }
      },
      Float: {
        parser: Ln,
        factory: function factory(e) {
          return An(Un, e), e;
        }
      },
      FractionNumber: {
        parser: function parser(e) {
          var t = rn(e.split("/").map(parseFloat), 2),
            n = t[0],
            r = t[1];
          if (Vr(n, r)) return new Wr(n, r);
          throw new vn("Invalid fraction number: ".concat(e, "."));
        },
        factory: function factory(e, t) {
          return En(!e.isInteger().value, "Numerator must be integer"), En(!t.isInteger().value, "Denominator must be integer"), new Wr(e.toJS(), t.toJS());
        }
      },
      String: {
        parser: _n,
        factory: function factory(e) {
          return An(On, e), e;
        }
      },
      Vector: {
        parser: Xr,
        factory: Cr
      },
      HashMap: {
        parser: Xr,
        factory: Ur
      }
    },
    Yr = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, Pr), Fr), {
      count: function count(e) {
        return e.count();
      },
      contains: function contains(e, t) {
        return t.contains(e);
      },
      map: function map(e, t) {
        var n = this;
        return t.map(function (t) {
          return n.evalFn(e, [t]);
        });
      },
      filter: function filter(e, t) {
        var n = this;
        return t.filter(function (t) {
          return n.evalFn(e, [t]);
        });
      },
      reduce: function reduce(e, t, n) {
        var r = this;
        return n.reduce(e, function (e, n) {
          return r.evalFn(t, [e, n]);
        });
      },
      slice: function slice(e, t, n) {
        return n.slice(e, t);
      }
    }), Dr), {
      "const": function _const(e) {
        return function () {
          return e;
        };
      }
    }), Tr), qn), Kr), Mr), Br), Hr), qr), {
      maybe: function maybe(e) {
        return Tn(e) ? Sn : new Jr(e);
      },
      Nothing: Sn
    }),
    eo = {
      unboxing: function unboxing(e) {
        return e.toJS();
      }
    },
    to = "undefined" != typeof globalThis && "function" == typeof globalThis.btoa,
    no = "undefined" != typeof globalThis && "function" == typeof globalThis.atob,
    ro = to ? globalThis.btoa.bind(globalThis) : function (e) {
      return globalThis.Buffer.from(e, "binary").toString("base64");
    },
    oo = no ? globalThis.atob.bind(globalThis) : function (e) {
      return globalThis.Buffer.from(e, "base64").toString("binary");
    };
  function ao(e) {
    return ro(encodeURIComponent(e).replace(/%([0-9A-F]{2})/g, function (e, t) {
      return String.fromCharCode("0x" + t);
    }));
  }
  function io(e) {
    return decodeURIComponent(oo(e).split("").map(function (e) {
      return "%" + ("00" + e.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
  }
  function uo() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _co(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d8 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d8.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d8.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d8.v = r, _d8.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d8.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d8.n = -1), p(u, c)) : _d8.n = c : _d8.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d8.n < 0) ? c : n.call(r, _d8)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_co(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _co(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _co(s, "constructor", l), _co(l, "constructor", c), c.displayName = "GeneratorFunction", _co(l, o, "GeneratorFunction"), _co(s), _co(s, o, "Generator"), _co(s, r, function () {
      return this;
    }), _co(s, "toString", function () {
      return "[object Generator]";
    }), (uo = function uo() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _co(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _co = function co(e, t, n, r) {
      function a(t, n) {
        _co(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _co(e, t, n, r);
  }
  function lo(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function fo(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          lo(a, r, o, i, u, "next", e);
        }
        function u(e) {
          lo(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var so = function so(e) {
    return fo(uo().m(function e() {
      var t,
        n = arguments;
      return uo().w(function (e) {
        for (;;) if (0 === e.n) return (t = n.length > 0 && void 0 !== n[0] ? n[0] : {}).refnode, t.refnodedata, t.nodelambda, t.contextuallambda, e.a(2, {
          version: "breezyforest",
          nodequery: function nodequery(e) {
            return e;
          },
          nodemethod: function nodemethod(e) {
            return {};
          }
        });
      }, e);
    }));
  };
  function po() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _bo(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d9 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d9.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d9.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d9.v = r, _d9.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d9.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d9.n = -1), p(u, c)) : _d9.n = c : _d9.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d9.n < 0) ? c : n.call(r, _d9)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_bo(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _bo(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _bo(s, "constructor", l), _bo(l, "constructor", c), c.displayName = "GeneratorFunction", _bo(l, o, "GeneratorFunction"), _bo(s), _bo(s, o, "Generator"), _bo(s, r, function () {
      return this;
    }), _bo(s, "toString", function () {
      return "[object Generator]";
    }), (po = function po() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _bo(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _bo = function bo(e, t, n, r) {
      function a(t, n) {
        _bo(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _bo(e, t, n, r);
  }
  function mo(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function yo(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          mo(a, r, o, i, u, "next", e);
        }
        function u(e) {
          mo(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function go(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function vo(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? go(Object(n), !0).forEach(function (t) {
        ho(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : go(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function ho(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != So(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != So(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == So(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function wo(e) {
    return function (e) {
      if (Array.isArray(e)) return jo(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || _o(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Oo(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || _o(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function _o(e, t) {
    if (e) {
      if ("string" == typeof e) return jo(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? jo(e, t) : void 0;
    }
  }
  function jo(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function So(e) {
    return So = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, So(e);
  }
  var ko = process.env.LEAFGON_ENV_TYPE,
    To = function To(e) {
      return e > 0 ? "  ".repeat(e) : "";
    },
    Eo = function Eo(e) {
      var t, n, r, o;
      return null !== (t = null !== (n = null == e || null === (r = e.constructor) || void 0 === r ? void 0 : r.kind) && void 0 !== n ? n : null == e || null === (o = e.constructor) || void 0 === o ? void 0 : o.name) && void 0 !== t ? t : "unknown";
    },
    Po = {
      trace: [],
      probe: []
    },
    _Ao = function Ao(e) {
      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
        n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
        r = So(e),
        o = To(t),
        a = To(t + 1);
      return "string" === r ? (n ? "" : o) + '"'.concat(e.replace(/\\/g, "\\\\").replace(/"/g, '\\"'), '"\n') : "object" === r ? Array.isArray(e) ? (n ? "" : o) + "[\n" + "".concat(e.map(function (e) {
        return _Ao(e, t + 1);
      }).join("")) + o + "]\n" : [null, void 0].includes(e) ? (n ? "" : o) + "null\n" : (n ? "" : o) + "{\n" + "".concat(Object.entries(e).map(function (e) {
        var n = Oo(e, 2),
          r = n[0],
          o = n[1];
        return a + ":" + r + " " + _Ao(o, t + 1, !0);
      }).join("")) + o + "}\n" : "boolean" === r ? (n ? "" : o) + (e ? "true\n" : "false\n") : "number" === r ? (n ? "" : o) + String(e) + "\n" : (n ? "" : o) + "null\n";
    },
    _xo = function xo(e) {
      if (null == e) return Yr.Nothing;
      var t = So(e);
      return "string" === t ? _n(e) : "object" === t ? Array.isArray(e) ? Cr.apply(void 0, wo(e.filter(function (e) {
        return e;
      }).map(function (e) {
        return _xo(e, !1);
      }))) : [null, void 0].includes(e) ? Yr.Nothing : Ur.apply(void 0, wo(Object.entries(e).map(function (e) {
        var t = Oo(e, 2),
          n = t[0],
          r = t[1];
        return [_n(n), _xo(r, !1)];
      }).flat())) : "boolean" === t ? wn(e) : "number" === t ? Ln(e.toString().includes("e") ? function (e) {
        var t = "";
        "-" == (e += "").charAt(0) && (e = e.substring(1), t = "-");
        var n = e.split(/[e]/gi);
        if (n.length < 2) return t + e;
        var r = .1.toLocaleString().substr(1, 1),
          o = n[0],
          a = +n[1],
          i = (o = o.replace(/^0+/, "")).replace(r, ""),
          u = o.split(r)[1] ? o.indexOf(r) + a : i.length + a,
          c = u - i.length,
          l = "" + BigInt(i);
        return (0 == (c = (i = a >= 0 ? c >= 0 ? l + "0".repeat(c) : f() : u <= 0 ? "0" + r + "0".repeat(Math.abs(u)) + l : f()).split(r))[0] && 0 == c[1] || 0 == +i && 0 == +l) && (i = 0), t + i;
        function f() {
          return i.replace(new RegExp("^(.{".concat(u, "})(.)")), "$1".concat(r, "$2"));
        }
      }(e) : e) : Yr.Nothing;
    },
    No = function No() {
      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        t = e._probefunc,
        n = e._tracefunc;
      return {
        "return": function _return(e) {
          return e;
        },
        outport: function outport(e) {
          return e;
        },
        undefined: Yr.Nothing,
        nil: Yr.Nothing,
        "null": Yr.Nothing,
        trace: function trace(e) {
          var t = e.toJSON();
          try {
            n && n(t);
          } catch (t) {
            return console.log(t), e;
          }
          return e;
        },
        probe: function probe(e) {
          var n = e.toJSON();
          try {
            t && t(n);
          } catch (t) {
            return console.log(t), e;
          }
          return e;
        },
        format: function format(e, t) {
          var n,
            r,
            o = t.toJSON(),
            a = e.toJS().replace(/\$\{([^{}]*)\}/gm, function (e, t) {
              var n = t.replace(/\s*/g, "");
              return "${this.".concat(n, "}");
            });
          return _n((n = a.replace(/"/g, '\\"'), r = new Proxy(o, {
            get: function get(e, t) {
              var n = e[t];
              return "object" === So(n) && null !== n ? JSON.stringify(n).replace(/"/g, '\\"') : n;
            }
          }), new Function("return `" + n + "`;").call(r)));
        },
        isnil: function isnil(e) {
          return wn("null" == e || e.constructor == Yr.Nothing.constructor);
        },
        isbottle: function isbottle(e) {
          var t = e.toJSON();
          return wn(h(t));
        },
        islist: function islist(e) {
          var t = e.toJSON();
          return wn(Array.isArray(t));
        },
        flatten: function flatten(e) {
          var t = e.toJSON();
          return _xo(t.flat().filter(function (e) {
            return e;
          }), !1);
        },
        join: function join(e, t) {
          var n = e.toJSON();
          return _n(n.join(t));
        },
        bottle: function bottle(e, t) {
          var n;
          if (e.constructor !== On) throw new vn("Expected '".concat(null !== (n = On.kind) && void 0 !== n ? n : On.name, "', but got '").concat(Eo(e.value), "'."));
          var r = e.toJSON(),
            o = t.toJSON(),
            a = "object" === So(o) && !Array.isArray(o) && "_content" in o && "_label" in o ? {
              _bname: r,
              _content: o._content,
              _label: o._label
            } : {
              _bname: r,
              _content: o,
              _label: {}
            };
          return _xo(a);
        },
        getbottle: function getbottle(e, t) {
          var n;
          if (e.constructor !== Gr) throw new vn("Expected '".concat(null !== (n = Gr.kind) && void 0 !== n ? n : Gr.name, "', but got '").concat(Eo(e.value), "'."));
          var r = e.value.filter(function (e) {
            return e.value.get("_bname").value === t.value;
          });
          return 1 === r.length ? r[0] : r.length > 1 ? r : void 0;
        },
        unbottle: function unbottle(e) {
          var t;
          if (e.constructor !== $r) throw new vn("Expected '".concat(null !== (t = $r.kind) && void 0 !== t ? t : $r.name, "', but got '").concat(Eo(e.value), "'."));
          return e.value.get("_content");
        },
        regexp: function regexp(e, t) {
          var n = t.toJSON().match(/\/(.*)\/(.*)/),
            r = new RegExp(n[1], n[2]),
            o = e.toJSON(),
            a = "string" === So(o) ? o.match(r) : [];
          return _xo(a || []);
        },
        min: function min(e) {
          var t;
          if (e.constructor !== Gr) throw new vn("Expected '".concat(null !== (t = Gr.kind) && void 0 !== t ? t : Gr.name, "', but got '").concat(Eo(e.value), "'."));
          var n = e.value.map(function (e) {
            return e.value;
          });
          return Ln(Math.min.apply(Math, wo(n)));
        },
        max: function max(e) {
          var t;
          if (e.constructor !== Gr) throw new vn("Expected '".concat(null !== (t = Gr.kind) && void 0 !== t ? t : Gr.name, "', but got '").concat(Eo(e.value), "'."));
          var n = e.value.map(function (e) {
            return e.value;
          });
          return Ln(Math.max.apply(Math, wo(n)));
        },
        parse: function parse(e) {
          var t,
            n = e.toJSON();
          return Dn(n), 0 === (t = Gn(n) ? Cn(n) : Mn(n)).decimals ? Ln(t.intValue) : Ln(t.intValue, t.decimals);
        },
        "merge-dict": function mergeDict(e, t) {
          var n, r;
          if (e.constructor !== $r) throw new vn("Expected '".concat(null !== (n = $r.kind) && void 0 !== n ? n : $r.name, "', but got '").concat(Eo(e.value), "'."));
          if (t.constructor !== $r) throw new vn("Expected '".concat(null !== (r = $r.kind) && void 0 !== r ? r : $r.name, "', but got '").concat(Eo(t.value), "'."));
          var o = e.toJSON(),
            a = t.toJSON(),
            i = vo(vo({}, o), a);
          return _xo(i);
        },
        "make-dict": function makeDict(e, t) {
          var n, r;
          if (e.constructor !== Gr) throw new vn("Expected '".concat(null !== (n = Gr.kind) && void 0 !== n ? n : Gr.name, "', but got '").concat(Eo(e.value), "'."));
          if (t.constructor !== Gr) throw new vn("Expected '".concat(null !== (r = Gr.kind) && void 0 !== r ? r : Gr.name, "', but got '").concat(Eo(t.value), "'."));
          var o = e.toJSON(),
            a = t.toJSON(),
            i = wo(Array(o.length).keys()).reduce(function (e, t) {
              return vo(vo({}, e), {}, ho({}, o[t], a[t]));
            }, {});
          return _xo(i);
        },
        concat: function concat(e, t) {
          var n, r;
          if (e.constructor !== Gr) throw new vn("Expected '".concat(null !== (n = Gr.kind) && void 0 !== n ? n : Gr.name, "', but got '").concat(Eo(e.value), "'."));
          if (t.constructor !== Gr) throw new vn("Expected '".concat(null !== (r = Gr.kind) && void 0 !== r ? r : Gr.name, "', but got '").concat(Eo(t.value), "'."));
          return console.log(e, t), Cr.apply(void 0, wo(e.value.concat(t.value)));
        },
        uuid4: function uuid4() {
          return _n((0, j.v4)());
        },
        uuid5: function uuid5(e) {
          var t = (0, j.v5)(e.toString(), j.v5.URL);
          return _n(t);
        },
        "*": function _(e, t) {
          return Ln(e * t);
        },
        "/": function _(e, t) {
          return Ln(e / t);
        },
        "+": function _(e, t) {
          return isNaN(e.value) || isNaN(t.value) ? e.add(t) : Ln(e.value + t.value);
        },
        "-": function _(e, t) {
          return Ln(e - t);
        },
        tofixed: function tofixed(e, t) {
          return _n(Number(e).toFixed(t));
        }
      };
    },
    Fo = function Fo(e, t) {
      var n = function () {
          var n = yo(po().m(function n() {
            var r, o, a, i, u, c;
            return po().w(function (n) {
              for (;;) switch (n.n) {
                case 0:
                  return r = {
                    gos: {
                      standardSpellbook: {},
                      curatedSpellbook: {},
                      stdlambdalut: {},
                      curatedlambdalut: {},
                      leafio: e.leafio,
                      etaTree: e
                    },
                    user: {
                      spellbook: e.graphcomponents.spelldefs,
                      lambdalut: e.leafgraph.edges.lambda.sourcelut
                    }
                  }, o = {
                    graphuuid: "",
                    domain: "breezyforest",
                    appid: "leaflisp-help",
                    graphaddrstr: "breezyforest/leaflisp-help"
                  }, a = Xd.lambda(r)({
                    refnode: "leaflisp_runtime",
                    refnodedata: {
                      leaf: {
                        logic: {
                          args: o
                        }
                      }
                    },
                    nodelambda: [],
                    contextuallambda: []
                  }), n.n = 1, a;
                case 1:
                  if (null == (i = n.v) || !i.cheatsheet) {
                    n.n = 3;
                    break;
                  }
                  return n.n = 2, gp(i.cheatsheet._default, t.data, {});
                case 2:
                  c = n.v, n.n = 4;
                  break;
                case 3:
                  c = [];
                case 4:
                  return u = c, n.a(2, u);
              }
            }, n);
          }));
          return function () {
            return n.apply(this, arguments);
          };
        }(),
        r = {};
      n().then(function (e) {
        r.cheatsheet = e;
      });
      var o = {
        cheat: function cheat() {
          var e = {
            help: "-LEAFlisp help text----------------------------------------------\n--------------------------------------------------------------------------\n"
          };
          return Object.keys(r.cheatsheet).map(function (t) {
            e[t] = t in r.cheatsheet ? r.cheatsheet[t] : "LEAFlisp error: no help is available for an unknown command ".concat(t, ".");
          }), _xo(e);
        },
        help: function help(e) {
          var t = {},
            n = e.toJSON();
          return n.length > 0 ? (t.help = "-LEAFlisp help text----------------------------------------------\n--------------------------------------------------------------------------\n", n.map(function (e) {
            t[e] = e in r.cheatsheet ? r.cheatsheet[e] : "LEAFlisp error: no help is available for an unknown command ".concat(e, ".");
          }), _xo(t)) : (t.help = "-LEAFlisp help text----------------------------------------------\n--------------------------------------------------------------------------\n", Object.keys(r.cheatsheet).map(function (e) {
            t[e] = e in r.cheatsheet ? r.cheatsheet[e] : "LEAFlisp error: no help is available for an unknown command ".concat(e, ".");
          }), _xo(t));
        }
      };
      return new Yt({
        globals: vo(vo(vo({}, Yr), No({})), o),
        utils: eo
      }, Zr);
    },
    Io = function Io(e, t, n, r) {
      var o = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : 0;
      try {
        "1f5b" === (null == t ? void 0 : t.slice(0, 4)) && console.log("start debugging");
        var a = n.insituexecute(e);
        try {
          return [0, a.toJSON()];
        } catch (e) {
          return [0, null];
        }
      } catch (e) {
        var i = [];
        if ("errors" in e) {
          var u,
            c = function (e) {
              var t = "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
              if (!t) {
                if (Array.isArray(e) || (t = _o(e))) {
                  t && (e = t);
                  var _n4 = 0,
                    r = function r() {};
                  return {
                    s: r,
                    n: function n() {
                      return _n4 >= e.length ? {
                        done: !0
                      } : {
                        done: !1,
                        value: e[_n4++]
                      };
                    },
                    e: function e(_e5) {
                      throw _e5;
                    },
                    f: r
                  };
                }
                throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }
              var o,
                a = !0,
                i = !1;
              return {
                s: function s() {
                  t = t.call(e);
                },
                n: function n() {
                  var e = t.next();
                  return a = e.done, e;
                },
                e: function e(_e6) {
                  i = !0, o = _e6;
                },
                f: function f() {
                  try {
                    a || null == t["return"] || t["return"]();
                  } finally {
                    if (i) throw o;
                  }
                }
              };
            }(e.errors);
          try {
            for (c.s(); !(u = c.n()).done;) {
              var l,
                f = u.value,
                s = "Parser" === e.type ? "line: ".concat(f.line - o, " - ").concat(f.message) : "line: ".concat((null === (l = f.position) || void 0 === l ? void 0 : l.line) - o, " - ").concat(f.message),
                d = "LEAFlisp error: {refnode: ".concat(t, "}: ").concat(s);
              console.error(d), i.push(re("error", {
                address: r,
                refnode: t,
                message: d
              }));
            }
          } catch (f) {
            c.e(f);
          } finally {
            c.f();
          }
        } else i.push("LEAFlisp error: ".concat(t, ": unidentified execution failure. please check your leaflisp code for anomalies. exception: ").concat(e.message));
        return [-1, i];
      }
    },
    Lo = function Lo(e) {
      var t = /(.*)(https?):\/\/(www\.)?([-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(.*)/,
        n = e.match(/((https?):\/\/(www\.)?([-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/g);
      return n ? n.reduce(function (e, n) {
        var r = n.match(t),
          o = n;
        return r && "leafgon.com" === r[4] && (o = r[1] + "http://localhost" + r[5] + r[6]), e.replaceAll(n, o);
      }, e) : e;
    },
    Do = {},
    Go = {
      dataflow: function dataflow(e) {
        return yo(po().m(function t() {
          var o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y,
            g,
            v,
            w,
            O,
            _,
            j,
            S,
            k,
            T = arguments;
          return po().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return a = (o = T.length > 0 && void 0 !== T[0] ? T[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda, f = void 0, s = G.memoize(yo(po().m(function t() {
                  var n;
                  return po().w(function (t) {
                    for (;;) switch (t.n) {
                      case 0:
                        return t.n = 1, Sp("breezyforest/probe", e.gos.etaTree, "leaflisp");
                      case 1:
                        return n = t.v, t.a(2, n);
                    }
                  }, t);
                }))), d = e.gos.etaTree.domain + "/" + e.gos.etaTree.appid, p = function p(e) {
                  var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : a,
                    n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
                  s().then(function (r) {
                    Object.entries(r).length > 0 ? (n > 0 && Po.trace.length === n && Po.trace.shift(), Po.trace.push({
                      timestamp: Date.now(),
                      address: d,
                      refnode: a,
                      trace: e
                    }), gp(r.probe._default, Po.trace, {}, t).then(function (e) {
                      console.log("LEAFlisp debug: a debugger probe launched with traces: ", e);
                    })) : console.error("LEAFlisp error: a debugger probe graph unavailable or not parsed successfully, error traces would not be shown: ");
                  });
                }, b = function b(e) {
                  var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : a,
                    n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1;
                  s().then(function (r) {
                    Object.entries(r).length > 0 ? (n > 0 && Po.probe.length === n && Po.probe.shift(), Po.probe.push({
                      timestamp: Date.now(),
                      address: d,
                      refnode: a,
                      trace: e
                    }), gp(r.probe._default, Po.probe, {}, t).then(function (e) {
                      console.log("LEAFlisp debug: a debugger probe launched with traces: ", e);
                    })) : console.error("LEAFlisp error: a debugger probe graph unavailable or not parsed successfully, error traces would not be shown: ");
                  });
                }, t.n = 1, qs({
                  refnode: a,
                  nodelambda: u,
                  contextuallambda: c,
                  etaTree: e.gos.etaTree
                });
              case 1:
                if (m = t.v, Do[a] = "interactive" in m, y = Do[a], g = "development" === ko ? Lo(i.leaf.logic.args.lispexpression) : i.leaf.logic.args.lispexpression, l = "global" in m ? e.gos.etaTree.gRuntimeLEAFlisp : new Yt({
                  globals: vo(vo({}, Yr), No({
                    _probefunc: b,
                    _tracefunc: p
                  })),
                  utils: eo
                }, Zr), v = "rewrite" in m, w = "bottle" in m, "59fe" == a.slice(0, 4) && console.log("start debugging."), O = {
                  codebase: "leaflisp.js",
                  refnode: a,
                  leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data,
                  leafaddress: e.gos.etaTree.domain + "/" + e.gos.etaTree.appid
                }, _ = new r.Subject(), !y) {
                  t.n = 3;
                  break;
                }
                return e.gos.etaTree.leafio.elementioLUT[a] = _, j = {
                  graphuuid: "",
                  domain: "breezyforest",
                  appid: "leaflisp",
                  graphaddrstr: "breezyforest/leaflisp"
                }, S = Xd.lambda(e)({
                  refnode: "leaflisp_runtime_interactive",
                  refnodedata: {
                    leaf: {
                      logic: {
                        args: j
                      }
                    }
                  },
                  nodelambda: [],
                  contextuallambda: []
                }), t.n = 2, S;
              case 2:
                k = t.v, f = function f() {
                  var t = re("dataevent", {
                    _refnode: a,
                    _provenance: {
                      domain: e.gos.etaTree.domain,
                      appid: e.gos.etaTree.appid,
                      refnodedata: O.leafnode,
                      codebase: "leaflisp.js"
                    }
                  }, {});
                  gp(k.vim._default, t, {});
                };
              case 3:
                return t.a(2, function (t, o) {
                  var u, c;
                  "59fe" == a.slice(0, 4) && console.log("start debugging.");
                  var s = null == o || null === (u = o._config) || void 0 === u ? void 0 : u.loopidx,
                    d = null == o || null === (c = o._config) || void 0 === c ? void 0 : c.clubrefnode,
                    p = function p(e) {
                      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : g;
                      "6212" == a.slice(0, 4) && console.log("start debugging.");
                      var n = _Ao(null == e ? [] : e),
                        r = "(def inport ".concat(n, ")");
                      s >= 0 && (r += "(def loopyindex ".concat(s, ")")), d && (r += '(def clubref "'.concat(d, '")'));
                      var o = r.split(/\r\n|\r|\n/).length;
                      r += "".concat(t);
                      try {
                        var i = Oo(Io(r, a, l, O.leafaddress, o), 2),
                          u = i[0],
                          c = i[1];
                        return -1 === u && (console.log("LEAFlisp execution:", c[0]), b(c, a)), c;
                      } catch (e) {
                        throw new vn("LEAFlisp Error: ".concat(e));
                      }
                    };
                  return "a3f0a480-0054-40f3-888c-8910c0230900" === a && console.log("start debugging"), jp(o, t, void 0, vo(vo({}, O), {}, {
                    metastep: "invoking leaflisp"
                  }), {
                    leaflogic: y ? function (e, t) {
                      var o = new r.Subject(),
                        a = !1,
                        i = t._stream.pipe((0, n.map)(function (e) {
                          return f && f(), e;
                        }), n.withLatestFrom.apply(void 0, wo(e.map(function (e) {
                          return e._stream;
                        }))), (0, n.switchMap)(function (e) {
                          var t = new r.BehaviorSubject(e[0]);
                          return (0, r.combineLatest)(t, _);
                        }), (0, n.map)(function (e) {
                          var t = e[1];
                          return a = !0, o.next(t), e[0];
                        }), (0, n.share)());
                      return {
                        _stream: o.pipe((0, n.filter)(function (e) {
                          return a;
                        }), (0, n.map)(function (e) {
                          return console.log(e), e;
                        }), (0, n.share)()),
                        _control: vo(vo({}, t), {}, {
                          _stream: i
                        })
                      };
                    } : function (t, o) {
                      var u = new r.Subject(),
                        c = !1,
                        l = v ? o._stream.pipe((0, n.map)(function (e) {
                          return e;
                        }), n.withLatestFrom.apply(void 0, wo(t.map(function (e) {
                          return e._stream;
                        }))), (0, n.map)(function (t) {
                          var n = t[1];
                          if (h(n) && "rewrite" === n._bname) {
                            var r = oe("*", n),
                              o = vo({}, i),
                              l = _Ao(null == r ? [] : r);
                            o.leaf.logic.args.lispexpression = l, i.leaf.logic.args.lispexpression = l, e.gos.etaTree.leaflakeio.qm_methods.updateNode({
                              variables: {
                                uuid: a,
                                data: ao(JSON.stringify(o))
                              }
                            }), n = void 0;
                          }
                          if (null != n) {
                            c = !0;
                            var f = p(n);
                            return u.next(f), t[0];
                          }
                        }), (0, n.filter)(function (e) {
                          return void 0 !== e;
                        }), (0, n.share)()) : w ? o._stream.pipe((0, n.map)(function (e) {
                          return e;
                        }), n.withLatestFrom.apply(void 0, wo(t.map(function (e) {
                          return e._stream;
                        }))), (0, n.map)(function (e) {
                          var t = e[1];
                          if (h(t) && "codebottle" === t._bname) {
                            var n = oe("*", t);
                            c = !0;
                            var r = n.data,
                              o = n.code,
                              a = p(r, o);
                            return u.next(a), e[0];
                          }
                        }), (0, n.filter)(function (e) {
                          return void 0 !== e;
                        }), (0, n.share)()) : o._stream.pipe((0, n.map)(function (e) {
                          return e;
                        }), n.withLatestFrom.apply(void 0, wo(t.map(function (e) {
                          return e._stream;
                        }))), (0, n.map)(function (e) {
                          var t = e[1];
                          "f71edebb-85b4-452b-b39a-99ecf3c50ca3" !== a && "1f5b9eaa-cabd-4059-9574-3f0bda95a2ad" !== a || console.log("start debugging"), c = !0;
                          var n = p(t);
                          return u.next(n), e[0];
                        }), (0, n.share)());
                      return {
                        _stream: u.pipe((0, n.filter)(function (e) {
                          return c;
                        }), (0, n.map)(function (e) {
                          return console.log(e), e;
                        }), (0, n.share)()),
                        _control: vo(vo({}, o), {}, {
                          _stream: l
                        })
                      };
                    },
                    datalogic: {
                      pre: function pre(e) {
                        return "5e6f52db-0af5-4e04-84ce-3e9af504a3d3" === a && console.log("start debugging"), e;
                      }
                    }
                  });
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return yo(po().m(function t() {
          var n,
            r,
            o,
            a = arguments;
          return po().w(function (t) {
            for (;;) if (0 === t.n) return r = (n = a.length > 0 && void 0 !== a[0] ? a[0] : {}).refnode, o = n.refnodedata, n.nodelambda, n.contextuallambda, console.error("LEAF error: the logical construct built using the ".concat(o.leaf.logic.type, " node ") + "(".concat(r, ") called with args (").concat(JSON.stringify(o.leaf.logic.args), ") cannot ") + "be defined as a lambda-scoped node."), t.a(2, function (t, n) {
              return vo(vo({}, F(r, t, !1, !1, !1, {
                provenance: "leaflisp.js lambda",
                refnode: r,
                etaTree: e.gos.etaTree
              })), {}, {
                _control: n
              });
            });
          }, t);
        }));
      },
      methods: function methods(e) {
        return yo(po().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l,
            f = arguments;
          return po().w(function (t) {
            for (;;) if (0 === t.n) return r = (n = f.length > 0 && void 0 !== f[0] ? f[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, u = {
              lispcode: ""
            }, c = so()({
              refnode: r,
              refnodedata: o,
              nodelambda: a,
              contextuallambda: i
            }), l = Do[r], "4c73462c-724e-4e77-9a94-596709ab62f0" === r && console.log("start debugging"), t.a(2, vo(vo({}, c), {}, {
              isinteractive: l,
              texteditor: {
                setTextSource: function setTextSource(t) {
                  u.lispcode = t;
                  var n = vo({}, o);
                  n.leaf.logic.args.lispexpression = t, l || e.gos.etaTree.leaflakeio.qm_methods.updateNode({
                    variables: {
                      uuid: r,
                      data: ao(JSON.stringify(n))
                    }
                  });
                },
                getTextSource: function getTextSource() {
                  return o.leaf.logic.args.lispexpression;
                }
              },
              general: {
                getNodeData: function getNodeData() {
                  return o;
                }
              }
            }));
          }, t);
        }));
      }
    };
  function Co(e) {
    return Co = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Co(e);
  }
  function Mo() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Ro(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d0 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d0.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d0.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d0.v = r, _d0.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d0.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d0.n = -1), p(u, c)) : _d0.n = c : _d0.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d0.n < 0) ? c : n.call(r, _d0)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Ro(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Ro(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Ro(s, "constructor", l), _Ro(l, "constructor", c), c.displayName = "GeneratorFunction", _Ro(l, o, "GeneratorFunction"), _Ro(s), _Ro(s, o, "Generator"), _Ro(s, r, function () {
      return this;
    }), _Ro(s, "toString", function () {
      return "[object Generator]";
    }), (Mo = function Mo() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Ro(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Ro = function Ro(e, t, n, r) {
      function a(t, n) {
        _Ro(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Ro(e, t, n, r);
  }
  function qo(e, t) {
    if (e) {
      if ("string" == typeof e) return Jo(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Jo(e, t) : void 0;
    }
  }
  function Jo(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function $o(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Uo(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? $o(Object(n), !0).forEach(function (t) {
        Bo(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : $o(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Bo(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Co(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Co(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Co(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function zo(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Ho(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          zo(a, r, o, i, u, "next", e);
        }
        function u(e) {
          zo(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Vo = {
    dataflow: function dataflow(e) {
      return Ho(Mo().m(function t() {
        var o,
          a,
          i,
          u,
          c,
          l,
          f,
          s,
          d = arguments;
        return Mo().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (a = (o = d.length > 0 && void 0 !== d[0] ? d[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: a,
                nodelambda: u,
                contextuallambda: c,
                etaTree: e.gos.etaTree
              });
            case 2:
              return l = t.v, f = {
                codebase: "leafchronosflow.js",
                refnode: a,
                leafnode: a && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
              }, s = "_default" in l ? function (e, t) {
                return l._default(e, t);
              } : function (e, t) {
                var o = new r.Subject(),
                  a = e[0]._stream,
                  i = t._stream.pipe((0, n.map)(function (e) {
                    return e;
                  }), (0, n.withLatestFrom)(a), (0, n.map)(function (e) {
                    return o.next(e[1]), e[0];
                  }), (0, n.share)());
                return {
                  _stream: o.pipe((0, n.map)(function (e) {
                    return e;
                  }), (0, n.share)()),
                  _control: Uo(Uo({}, t), {}, {
                    _stream: i.pipe((0, n.map)(function (e) {
                      return e;
                    }), (0, n.share)())
                  })
                };
              }, t.a(2, function (e, t) {
                if (e.length > 1) {
                  var o = r.merge.apply(void 0, function (e) {
                    if (Array.isArray(e)) return Jo(e);
                  }(c = e.map(function (e, t) {
                    return e._stream.pipe((0, n.map)(function (e) {
                      return e;
                    }), (0, n.share)());
                  })) || function (e) {
                    if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                  }(c) || qo(c) || function () {
                    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }());
                  if ("concat" in l) return Uo(Uo({}, L(e)), {}, {
                    _control: t
                  });
                  if ("merge" in l) return Uo(Uo({}, D(e)), {}, {
                    _control: t
                  });
                  if ("combine" in l) return Uo(Uo({}, F(a, e)), {}, {
                    _control: t
                  });
                  if ("substitute" in l) {
                    var i = Object.keys(l.substitute);
                    return Uo(Uo({}, I(e, i)), {}, {
                      _control: t
                    });
                  }
                  var u = t._stream.pipe((0, n.map)(function (e) {
                    return e;
                  }));
                  return jp({
                    _stream: u
                  }, [{
                    _stream: o
                  }], void 0, Uo(Uo({}, f), {}, {
                    metastep: "executing leafchronosflow "
                  }), {
                    leaflogic: s,
                    datalogic: {
                      pre: function pre(e) {
                        return e;
                      }
                    }
                  });
                }
                var c;
                if (1 === e.length) return Uo(Uo({}, e[0]), {}, {
                  _control: t
                });
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return Ho(Mo().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return Mo().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t,
                  n,
                  r = (n = 2, function (e) {
                    if (Array.isArray(e)) return e;
                  }(t = e) || function (e, t) {
                    var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                    if (null != n) {
                      var r,
                        o,
                        a,
                        i,
                        u = [],
                        c = !0,
                        l = !1;
                      try {
                        if (a = (n = n.call(e)).next, 0 === t) {
                          if (Object(n) !== n) return;
                          c = !1;
                        } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                      } catch (e) {
                        l = !0, o = e;
                      } finally {
                        try {
                          if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                        } finally {
                          if (l) throw o;
                        }
                      }
                      return u;
                    }
                  }(t, n) || qo(t, n) || function () {
                    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()),
                  o = r[0],
                  a = r[1];
                u[o] = function (e, t) {
                  return Uo(Uo({}, a(e)), {}, {
                    _control: t
                  });
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    }
  };
  function Wo(e) {
    return Wo = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Wo(e);
  }
  function Qo() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Ko(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d1 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d1.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d1.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d1.v = r, _d1.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d1.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d1.n = -1), p(u, c)) : _d1.n = c : _d1.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d1.n < 0) ? c : n.call(r, _d1)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Ko(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Ko(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Ko(s, "constructor", l), _Ko(l, "constructor", c), c.displayName = "GeneratorFunction", _Ko(l, o, "GeneratorFunction"), _Ko(s), _Ko(s, o, "Generator"), _Ko(s, r, function () {
      return this;
    }), _Ko(s, "toString", function () {
      return "[object Generator]";
    }), (Qo = function Qo() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Ko(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Ko = function Ko(e, t, n, r) {
      function a(t, n) {
        _Ko(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Ko(e, t, n, r);
  }
  function Xo(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Zo(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Xo(Object(n), !0).forEach(function (t) {
        Yo(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Xo(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Yo(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Wo(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Wo(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Wo(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function ea(e) {
    return function (e) {
      if (Array.isArray(e)) return na(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || ta(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function ta(e, t) {
    if (e) {
      if ("string" == typeof e) return na(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? na(e, t) : void 0;
    }
  }
  function na(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function ra(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function oa(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ra(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ra(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var aa = {
    dataflow: function dataflow(e) {
      return oa(Qo().m(function t() {
        var o,
          a,
          i,
          u,
          c,
          l,
          f,
          s,
          d = arguments;
        return Qo().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (a = (o = d.length > 0 && void 0 !== d[0] ? d[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: a,
                nodelambda: u,
                contextuallambda: c,
                etaTree: e.gos.etaTree
              });
            case 2:
              return l = t.v, f = {
                codebase: "leafmixflow.js",
                refnode: a,
                leafnode: a && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
              }, s = "_default" in l ? function (e, t) {
                return l._default(e, t);
              } : function (e, t) {
                console.log("start debugging");
                var o = new r.Subject(),
                  i = t._stream.pipe(n.withLatestFrom.apply(void 0, ea(e.map(function (e) {
                    return e._stream;
                  }))), (0, n.switchMap)(function (e) {
                    var t = "bottle" in l,
                      n = "flatten" in l,
                      i = "parfait" in l,
                      u = "crate" in l,
                      c = "dictionary" in l,
                      f = "raw" in l;
                    "5bf0fb01-3c2c-4d85-bfea-4ebef3e8ab3b" === a && console.log("start debugging");
                    var s = void 0;
                    return n ? (s = Array.isArray(e[1]) ? e[1].flat() : e[1], o.next(t ? re("mix", s) : s)) : i && !c ? (s = [e[1]].flat().map(function (e) {
                      return h(e) ? oe("*", e) : void 0;
                    }).filter(function (e) {
                      return e && "empty_data" !== e;
                    }), f || (s = ea(new Set(s.flat()))), o.next(t ? re("mix", s) : s)) : u && !c ? (s = [e[1]].flat().map(function (e) {
                      return h(e) ? e : void 0;
                    }).filter(function (e) {
                      return void 0 !== e && !O(e);
                    }), f || (s = ea(new Set(s.flat()))), 1 === s.length ? o.next(t ? re("mix", s[0]) : s[0]) : o.next(t ? re("mix", s) : s)) : (s = {}, [e[1]].flat().filter(function (e) {
                      return h(e) && !O(e);
                    }).map(function (e) {
                      if (h(e)) return s = function (t) {
                        var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                          r = t._bname;
                        return Zo(Zo({}, n), {}, Yo({}, r, oe("*", e)));
                      }(e, s), e;
                    }), o.next(t ? re("mix", s) : s)), (0, r.of)(e[0]);
                  }), (0, n.share)());
                return {
                  _stream: o.pipe((0, n.map)(function (e) {
                    return e;
                  }), (0, n.share)()),
                  _control: Zo(Zo({}, t), {}, {
                    _stream: i
                  })
                };
              }, t.a(2, function (e, t) {
                if (e.length > 1) {
                  if ("concat" in l) return Zo(Zo({}, L(e)), {}, {
                    _control: t
                  });
                  if ("merge" in l) return Zo(Zo({}, D(e)), {}, {
                    _control: t
                  });
                  if ("combine" in l) return Zo(Zo({}, F(a, e)), {}, {
                    _control: t
                  });
                  if ("substitute" in l) {
                    var n = Object.keys(l.substitute);
                    return Zo(Zo({}, I(e, n)), {}, {
                      _control: t
                    });
                  }
                  var r = t._stream;
                  return jp({
                    _stream: r
                  }, e, void 0, Zo(Zo({}, f), {}, {
                    metastep: "executing leafmixflow "
                  }), {
                    leaflogic: s,
                    datalogic: {
                      pre: function pre(e) {
                        return e;
                      }
                    }
                  });
                }
                if (1 === e.length) {
                  var o = t._stream;
                  return jp({
                    _stream: o
                  }, e, void 0, Zo(Zo({}, f), {}, {
                    metastep: "executing leafmixflow "
                  }), {
                    leaflogic: s,
                    datalogic: {
                      pre: function pre(e) {
                        return e;
                      }
                    }
                  });
                }
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return oa(Qo().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return Qo().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t,
                  n,
                  r = (n = 2, function (e) {
                    if (Array.isArray(e)) return e;
                  }(t = e) || function (e, t) {
                    var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                    if (null != n) {
                      var r,
                        o,
                        a,
                        i,
                        u = [],
                        c = !0,
                        l = !1;
                      try {
                        if (a = (n = n.call(e)).next, 0 === t) {
                          if (Object(n) !== n) return;
                          c = !1;
                        } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                      } catch (e) {
                        l = !0, o = e;
                      } finally {
                        try {
                          if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                        } finally {
                          if (l) throw o;
                        }
                      }
                      return u;
                    }
                  }(t, n) || ta(t, n) || function () {
                    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()),
                  o = r[0],
                  a = r[1];
                u[o] = function (e, t) {
                  return Zo(Zo({}, a(e)), {}, {
                    _control: t
                  });
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    }
  };
  function ia() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _ua(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d10 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d10.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d10.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d10.v = r, _d10.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d10.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d10.n = -1), p(u, c)) : _d10.n = c : _d10.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d10.n < 0) ? c : n.call(r, _d10)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_ua(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _ua(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _ua(s, "constructor", l), _ua(l, "constructor", c), c.displayName = "GeneratorFunction", _ua(l, o, "GeneratorFunction"), _ua(s), _ua(s, o, "Generator"), _ua(s, r, function () {
      return this;
    }), _ua(s, "toString", function () {
      return "[object Generator]";
    }), (ia = function ia() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _ua(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _ua = function ua(e, t, n, r) {
      function a(t, n) {
        _ua(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _ua(e, t, n, r);
  }
  function ca(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function la(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? ca(Object(n), !0).forEach(function (t) {
        fa(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ca(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function fa(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != pa(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != pa(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == pa(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function sa(e, t) {
    if (e) {
      if ("string" == typeof e) return da(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? da(e, t) : void 0;
    }
  }
  function da(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function pa(e) {
    return pa = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, pa(e);
  }
  function ba(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function ma(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ba(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ba(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var ya = c("leafgateflow"),
    ga = {
      dataflow: function dataflow(e) {
        return ma(ia().m(function t() {
          var o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m = arguments;
          return ia().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (a = (o = m.length > 0 && void 0 !== m[0] ? m[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
              case 1:
                return t.n = 2, qs({
                  refnode: a,
                  nodelambda: u,
                  contextuallambda: c,
                  etaTree: e.gos.etaTree
                });
              case 2:
                return l = t.v, f = i.leaf.logic.args, s = _ge(ya.editorconfig.namedatakey, f).toLowerCase(), d = _ge(ya.editorconfig.toggledatakey, f), p = function () {
                  var e = Object.keys(l).filter(function (e) {
                    return 0 === Object.keys(l[e]).length;
                  });
                  return e.length > 0 ? e.sort().join(";") : void 0;
                }(), b = {
                  codebase: "leafgateflow.js",
                  refnode: a,
                  leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
                }, t.a(2, function (e, t) {
                  return jp(t, e, void 0, la(la({}, b), {}, {
                    metastep: "gateflow " + (d ? "NOT gate, " : "normal gate, ") + s
                  }), {
                    leaflogic: function leaflogic(e, t) {
                      console.log("start debugging");
                      var o,
                        a = new r.Subject(),
                        i = t._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                          if (Array.isArray(e)) return da(e);
                        }(o = e.map(function (e) {
                          return e._stream;
                        })) || function (e) {
                          if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                        }(o) || sa(o) || function () {
                          throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                        }()), (0, n.map)(function (e) {
                          var t = e[1],
                            n = function n(e) {
                              var t, n;
                              return h(e) ? !d && (null === (t = e._bname) || void 0 === t ? void 0 : t.toLowerCase()) === s || d && (null === (n = e._bname) || void 0 === n ? void 0 : n.toLowerCase()) !== s ? e : void 0 : "{crate}" === s ? !d && e._cratelabel ? "uncrate" === p ? Object.keys(e).filter(function (e) {
                                return "_cratelabel" !== e;
                              }).map(function (t) {
                                return e[t];
                              }).flat() : e : d && !e._cratelabel ? e : void 0 : function (e, t) {
                                var n = e ? Object.entries(e).map(function (e) {
                                  return e[0] + "=" + ("object" === pa(e[1]) ? JSON.stringify(e[1]) : e[1]);
                                }) : [];
                                if (t ? !n.includes(s) : n.includes(s)) return e;
                              }(e, d);
                            },
                            r = Array.isArray(t),
                            o = r ? t.map(function (e) {
                              return n(e);
                            }).filter(function (e) {
                              return void 0 !== e;
                            }) : n(t);
                          if ((null == o ? void 0 : o.length) > 0 || !r && void 0 !== o) return a.next(o), e[0];
                        }), (0, n.filter)(function (e) {
                          return void 0 !== e;
                        }), (0, n.share)());
                      return {
                        _stream: a.pipe((0, n.map)(function (e) {
                          return e;
                        }), (0, n.share)()),
                        _control: la(la({}, t), {}, {
                          _stream: i.pipe((0, n.map)(function (e) {
                            return e;
                          }), (0, n.share)())
                        })
                      };
                    },
                    datalogic: {
                      post: function post(e) {
                        return e;
                      }
                    }
                  });
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return ma(ia().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return ia().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: o,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return i = t.v, u = {}, Object.entries(i).map(function (e) {
                  var t,
                    n,
                    r = (n = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(t = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(t, n) || sa(t, n) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    o = r[0],
                    a = r[1];
                  u[o] = function (e, t) {
                    return la(la({}, a(e)), {}, {
                      _control: t
                    });
                  };
                }), t.a(2, u);
            }
          }, t);
        }));
      }
    };
  function va(e) {
    return va = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, va(e);
  }
  function ha(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function wa(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Oa(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? wa(Object(n), !0).forEach(function (t) {
        _a(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : wa(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function _a(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != va(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != va(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == va(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function ja() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Sa(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d11 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d11.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d11.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d11.v = r, _d11.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d11.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d11.n = -1), p(u, c)) : _d11.n = c : _d11.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d11.n < 0) ? c : n.call(r, _d11)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Sa(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Sa(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Sa(s, "constructor", l), _Sa(l, "constructor", c), c.displayName = "GeneratorFunction", _Sa(l, o, "GeneratorFunction"), _Sa(s), _Sa(s, o, "Generator"), _Sa(s, r, function () {
      return this;
    }), _Sa(s, "toString", function () {
      return "[object Generator]";
    }), (ja = function ja() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Sa(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Sa = function Sa(e, t, n, r) {
      function a(t, n) {
        _Sa(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Sa(e, t, n, r);
  }
  function ka(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Ta(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ka(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ka(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Ea = re("error", {
      type: "critical",
      message: "LEAF core error: race condition detected in leaflabel.js",
      codebase: "/src/ghostos/api/parser/nodelogic/datautils/leaflabel.js"
    }, {}),
    Pa = {
      dataflow: function dataflow(e) {
        return Ta(ja().m(function t() {
          var o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d = arguments;
          return ja().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (a = (o = d.length > 0 && void 0 !== d[0] ? d[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
              case 1:
                return t.n = 2, qs({
                  refnode: a,
                  nodelambda: c,
                  contextuallambda: u,
                  etaTree: e.gos.etaTree
                });
              case 2:
                return l = t.v, f = function () {
                  var e = Ta(ja().m(function e(t) {
                    var n,
                      r,
                      o,
                      i,
                      u,
                      c,
                      l,
                      f,
                      s,
                      d,
                      p = arguments;
                    return ja().w(function (e) {
                      for (;;) switch (e.n) {
                        case 0:
                          if (r = /^\\(.*)$/, o = /^\?([A-Za-z0-9-]*)$/, !(i = (n = p.length > 1 && void 0 !== p[1] ? p[1] : "").match(r))) {
                            e.n = 3;
                            break;
                          }
                          if (!((u = i[1]) in t)) {
                            e.n = 2;
                            break;
                          }
                          return e.n = 1, gp(t(u)._default, a);
                        case 1:
                          return c = e.v, e.a(2, c);
                        case 2:
                          return e.a(2, "");
                        case 3:
                          if (!(i = n.match(o))) {
                            e.n = 4;
                            break;
                          }
                          return l = i[1], f = window.location.search, s = new Proxy(new URLSearchParams(f), {
                            get: function get(e, t) {
                              return e.get(t);
                            }
                          }), d = {}, s[l] && (d[l] = s[l]), console.log(d), e.a(2, l in d ? d : void 0);
                        case 4:
                          return e.a(2, n);
                      }
                    }, e);
                  }));
                  return function (t) {
                    return e.apply(this, arguments);
                  };
                }(), s = {
                  codebase: "leaflabel.js",
                  refnode: a,
                  leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
                }, t.a(2, function (t, o) {
                  return jp(o, t, void 0, Oa(Oa({}, s), {}, {
                    metastep: "leaflabel " + a
                  }), {
                    leaflogic: function leaflogic(o, u) {
                      var c = new r.BehaviorSubject(Oa(Oa({}, Ea), {}, {
                          _label: Oa({}, s)
                        })),
                        d = function (t) {
                          if ("8b5b7162-5a06-40da-ba43-5c404986aa36" === a && console.log("start debugging"), e.gos.etaTree.leafgraph.edges.data.targets.has(a)) return i.leaf.logic.args.labelstr ? (console.error("debug"), t.map(function (e) {
                            return e._stream;
                          })) : t.map(function (e) {
                            return e._stream;
                          });
                          if (i.leaf.logic.args.labelstr) {
                            var n = f(l, i.leaf.logic.args.labelstr);
                            return [Promise.resolve(n)];
                          }
                          return t.map(function (e) {
                            return e._stream;
                          });
                        }(o);
                      console.log(t);
                      var p = o.length > 0 ? u._stream.pipe((0, n.switchMap)(function (e) {
                        return console.log(d), (0, r.combineLatest)([(0, r.of)(e)].concat(function (e) {
                          if (Array.isArray(e)) return ha(e);
                        }(t = d) || function (e) {
                          if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                        }(t) || function (e, t) {
                          if (e) {
                            if ("string" == typeof e) return ha(e, t);
                            var n = {}.toString.call(e).slice(8, -1);
                            return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ha(e, t) : void 0;
                          }
                        }(t) || function () {
                          throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                        }()));
                        var t;
                      }), (0, n.map)(function (e) {
                        return console.log(e.slice(1)), 2 == e.length ? c.next(e[1]) : c.next(e.slice(1)), e[0];
                      }), (0, n.filter)(function (e) {
                        return e;
                      }), (0, n.share)()) : u._stream;
                      return {
                        _stream: c,
                        _control: Oa(Oa({}, u), {}, {
                          _stream: p
                        })
                      };
                    },
                    datalogic: {}
                  });
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return Ta(ja().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l = arguments;
          return ja().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (r = (n = l.length > 0 && void 0 !== l[0] ? l[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, u = {}, !(a.length > 0)) {
                  t.n = 2;
                  break;
                }
                return t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: i,
                  etaTree: e.gos.etaTree
                });
              case 1:
                c = t.v, u[o.leaf.logic.args.labelstr] = Oa({}, c), t.n = 3;
                break;
              case 2:
                u[o.leaf.logic.args.labelstr] = {};
              case 3:
                return t.a(2, u);
            }
          }, t);
        }));
      },
      methods: function methods(e) {
        return Ta(ja().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return ja().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, !(o.length > 0)) {
                  t.n = 2;
                  break;
                }
                return t.n = 1, qs({
                  refnode: r,
                  nodelambda: o,
                  contextuallambda: a,
                  etaTree: e.gos.etaTree
                });
              case 1:
                u = t.v, i = Oa({}, u), t.n = 3;
                break;
              case 2:
                i = {};
              case 3:
                return t.a(2, i);
            }
          }, t);
        }));
      }
    };
  function Aa(e) {
    return Aa = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Aa(e);
  }
  function xa() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Na(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d12 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d12.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d12.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d12.v = r, _d12.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d12.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d12.n = -1), p(u, c)) : _d12.n = c : _d12.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d12.n < 0) ? c : n.call(r, _d12)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Na(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Na(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Na(s, "constructor", l), _Na(l, "constructor", c), c.displayName = "GeneratorFunction", _Na(l, o, "GeneratorFunction"), _Na(s), _Na(s, o, "Generator"), _Na(s, r, function () {
      return this;
    }), _Na(s, "toString", function () {
      return "[object Generator]";
    }), (xa = function xa() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Na(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Na = function Na(e, t, n, r) {
      function a(t, n) {
        _Na(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Na(e, t, n, r);
  }
  function Fa(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Ia(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Fa(Object(n), !0).forEach(function (t) {
        La(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Fa(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function La(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Aa(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Aa(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Aa(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Da(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || function (e, t) {
      if (e) {
        if ("string" == typeof e) return Ga(e, t);
        var n = {}.toString.call(e).slice(8, -1);
        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ga(e, t) : void 0;
      }
    }(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Ga(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Ca(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Ma(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Ca(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Ca(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Ra = {
    dataflow: function dataflow(e) {
      return Ma(xa().m(function t() {
        var o,
          a,
          i,
          u,
          c,
          l,
          f,
          s = arguments;
        return xa().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (a = (o = s.length > 0 && void 0 !== s[0] ? s[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: a,
                nodelambda: c,
                contextuallambda: u,
                etaTree: e.gos.etaTree
              });
            case 2:
              return l = t.v, f = function f(e, t) {
                return e in t._label && (t._label[e] -= 1), 0 === t._label[e] && delete t._label[e], t;
              }, t.a(2, function (e, t) {
                if (i.leaf.logic.args.label || "label" in l) {
                  var o = l.label ? l.label(e) : {
                      _stream: (0, r.of)([i.leaf.logic.args.label])
                    },
                    a = D(e)._stream.pipe((0, n.withLatestFrom)(o._stream), (0, n.map)(function (e) {
                      return console.log(e), e;
                    }), (0, n.filter)(function (e) {
                      var t = Da(e, 2),
                        n = t[0];
                      return t[1], n.every(function (e) {
                        return h(e) || w(e) && e._crate.every(h);
                      });
                    }), (0, n.map)(function () {
                      var e = Da(arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [], 2),
                        t = e[0],
                        n = e[1],
                        r = 1 === n.length ? t.map(function (e) {
                          return [e, n[0]];
                        }) : t.length === n.length ? t.map(function (e, t) {
                          return [e, n[t]];
                        }) : [],
                        o = function o(e) {
                          return Ia(Ia({}, e), {}, {
                            _label: Ia({}, e._label)
                          });
                        },
                        a = r.reduce(function (e) {
                          var t = Da(arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [], 2),
                            n = t[0],
                            r = t[1];
                          return h(n) ? e.push(f(r, o(n))) : w(n) && e.push(Ia(Ia({}, n), {}, {
                            _crate: n._crate.map(function (e) {
                              return f(r, o(e));
                            })
                          })), e;
                        }, []);
                      if (a.length > 0) return a;
                    }), (0, n.filter)(function (e) {
                      return e;
                    }));
                  return {
                    _stream: a,
                    _control: t
                  };
                }
                throw "LEAF Error: flow data cannot be labelled without a label, at _leafdataDelabel()";
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return Ma(xa().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c,
          l = arguments;
        return xa().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = l.length > 0 && void 0 !== l[0] ? l[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: i,
                etaTree: e.gos.etaTree
              });
            case 1:
              if (u = t.v, c = o.leaf.logic.args.labelstr, !u || !(c in u)) {
                t.n = 2;
                break;
              }
              return t.a(2, Ia({}, u[c]));
            case 2:
              return t.a(2, {});
            case 3:
              return t.a(2);
          }
        }, t);
      }));
    }
  };
  function qa(e) {
    return qa = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, qa(e);
  }
  function Ja(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function $a() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Ua(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d13 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d13.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d13.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d13.v = r, _d13.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d13.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d13.n = -1), p(u, c)) : _d13.n = c : _d13.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d13.n < 0) ? c : n.call(r, _d13)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Ua(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Ua(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Ua(s, "constructor", l), _Ua(l, "constructor", c), c.displayName = "GeneratorFunction", _Ua(l, o, "GeneratorFunction"), _Ua(s), _Ua(s, o, "Generator"), _Ua(s, r, function () {
      return this;
    }), _Ua(s, "toString", function () {
      return "[object Generator]";
    }), ($a = function $a() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Ua(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Ua = function Ua(e, t, n, r) {
      function a(t, n) {
        _Ua(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Ua(e, t, n, r);
  }
  function Ba(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function za(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Ba(Object(n), !0).forEach(function (t) {
        Ha(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ba(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Ha(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != qa(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != qa(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == qa(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Va(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Wa(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Va(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Va(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Qa = {
    dataflow: function dataflow(e) {
      return Wa($a().m(function t() {
        var o,
          a,
          i,
          u,
          c,
          l,
          f,
          s,
          d = arguments;
        return $a().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (a = (o = d.length > 0 && void 0 !== d[0] ? d[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: a,
                nodelambda: u,
                contextuallambda: c,
                etaTree: e.gos.etaTree
              });
            case 2:
              return l = t.v, f = function () {
                var e = Object.keys(l).filter(function (e) {
                  return 0 === Object.keys(l[e]).length;
                });
                return e.length > 0 ? e.sort().join(";") : void 0;
              }(), s = {
                codebase: "leafbottle.js",
                refnode: a,
                leafnode: a && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
              }, t.a(2, function (e, t) {
                var o = void 0,
                  a = void 0,
                  u = l.name ? l.name._default(e, t) : {
                    _stream: (0, r.of)(i.leaf.logic.args.bottlekey),
                    _control: t
                  },
                  c = t._stream.pipe((0, n.concatMap)(function (e) {
                    return o = e, u._stream;
                  }), (0, n.map)(function (e) {
                    return a = e, o;
                  }));
                return jp({
                  _stream: c
                }, e, void 0, za(za({}, s), {}, {
                  metastep: "executing bottle with key " + a
                }), {
                  datalogic: {
                    pre: function pre(e) {
                      return void 0 === f ? re(a, e) : re(a, e, {
                        tag: f
                      });
                    }
                  }
                });
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return Wa($a().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return $a().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t,
                  n,
                  o = (n = 2, function (e) {
                    if (Array.isArray(e)) return e;
                  }(t = e) || function (e, t) {
                    var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                    if (null != n) {
                      var r,
                        o,
                        a,
                        i,
                        u = [],
                        c = !0,
                        l = !1;
                      try {
                        if (a = (n = n.call(e)).next, 0 === t) {
                          if (Object(n) !== n) return;
                          c = !1;
                        } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                      } catch (e) {
                        l = !0, o = e;
                      } finally {
                        try {
                          if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                        } finally {
                          if (l) throw o;
                        }
                      }
                      return u;
                    }
                  }(t, n) || function (e, t) {
                    if (e) {
                      if ("string" == typeof e) return Ja(e, t);
                      var n = {}.toString.call(e).slice(8, -1);
                      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ja(e, t) : void 0;
                    }
                  }(t, n) || function () {
                    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()),
                  a = o[0],
                  i = o[1];
                u[a] = function (e, t) {
                  var n = F(r, e);
                  return za(za({}, i([n], t)), {}, {
                    _control: t
                  });
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    }
  };
  function Ka(e) {
    return Ka = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Ka(e);
  }
  function Xa() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Za(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d14 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d14.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d14.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d14.v = r, _d14.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d14.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d14.n = -1), p(u, c)) : _d14.n = c : _d14.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d14.n < 0) ? c : n.call(r, _d14)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Za(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Za(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Za(s, "constructor", l), _Za(l, "constructor", c), c.displayName = "GeneratorFunction", _Za(l, o, "GeneratorFunction"), _Za(s), _Za(s, o, "Generator"), _Za(s, r, function () {
      return this;
    }), _Za(s, "toString", function () {
      return "[object Generator]";
    }), (Xa = function Xa() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Za(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Za = function Za(e, t, n, r) {
      function a(t, n) {
        _Za(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Za(e, t, n, r);
  }
  function Ya(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function ei(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Ya(Object(n), !0).forEach(function (t) {
        ti(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ya(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function ti(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Ka(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Ka(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Ka(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function ni(e, t) {
    if (e) {
      if ("string" == typeof e) return ri(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ri(e, t) : void 0;
    }
  }
  function ri(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function oi(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function ai(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          oi(a, r, o, i, u, "next", e);
        }
        function u(e) {
          oi(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var ii = {
    dataflow: function dataflow(e) {
      return ai(Xa().m(function t() {
        var o,
          a,
          i,
          u,
          c,
          l,
          f,
          s = arguments;
        return Xa().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (a = (o = s.length > 0 && void 0 !== s[0] ? s[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: a,
                nodelambda: u,
                contextuallambda: c,
                etaTree: e.gos.etaTree
              });
            case 2:
              return l = t.v, f = {
                codebase: "leafunbottle.js",
                refnode: a,
                leafnode: a && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
              }, t.a(2, function (e, t) {
                if (i.leaf.logic.args.bottlekey || "bottlekey" in l) {
                  var o = l.label ? l.label._default(e, t) : {
                      _stream: (0, r.of)([i.leaf.logic.args.bottlekey]),
                      _control: t
                    },
                    u = void 0,
                    c = t._stream.pipe((0, n.withLatestFrom)(o._stream), (0, n.map)(function (e) {
                      "20421ab4-c222-4a0b-8d43-1f505a6193c9" === a && console.log("start debugging");
                      var t = e[1];
                      return u = t, e[0];
                    }), (0, n.share)());
                  return jp({
                    _stream: c
                  }, e, void 0, ei(ei({}, f), {}, {
                    metastep: "executing unbottle with key " + u
                  }), {
                    leaflogic: function leaflogic(e, t) {
                      console.log("start debugging");
                      var o,
                        a = new r.Subject(),
                        i = t._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                          if (Array.isArray(e)) return ri(e);
                        }(o = e.map(function (e) {
                          return e._stream;
                        })) || function (e) {
                          if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                        }(o) || ni(o) || function () {
                          throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                        }()), (0, n.map)(function (e) {
                          var t = e[1],
                            n = function n(e) {
                              var t = [e].flat().map(function (e) {
                                return h(e) && u.includes(e._bname) ? e._content : void 0;
                              }).filter(function (e) {
                                return e;
                              });
                              if (t.length > 0) return 1 === t.length ? t[0] : t;
                            },
                            r = Array.isArray(t),
                            o = r ? t.map(function (e) {
                              return n(e);
                            }).filter(function (e) {
                              return void 0 !== e;
                            }) : n(t);
                          if ((null == o ? void 0 : o.length) > 0 || !r && void 0 !== o) return a.next(o), e[0];
                        }), (0, n.filter)(function (e) {
                          return void 0 !== e;
                        }), (0, n.share)());
                      return {
                        _stream: a.pipe((0, n.map)(function (e) {
                          return e;
                        }), (0, n.share)()),
                        _control: ei(ei({}, t), {}, {
                          _stream: i.pipe((0, n.map)(function (e) {
                            return e;
                          }), (0, n.share)())
                        })
                      };
                    },
                    datalogic: {
                      post: function post(e) {
                        return e;
                      }
                    }
                  });
                }
                throw "LEAF Error: flow data cannot be unbottled without a bottlekey, at _leafdataUnbottle()";
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return ai(Xa().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return Xa().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t,
                  n,
                  r = (n = 2, function (e) {
                    if (Array.isArray(e)) return e;
                  }(t = e) || function (e, t) {
                    var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                    if (null != n) {
                      var r,
                        o,
                        a,
                        i,
                        u = [],
                        c = !0,
                        l = !1;
                      try {
                        if (a = (n = n.call(e)).next, 0 === t) {
                          if (Object(n) !== n) return;
                          c = !1;
                        } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                      } catch (e) {
                        l = !0, o = e;
                      } finally {
                        try {
                          if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                        } finally {
                          if (l) throw o;
                        }
                      }
                      return u;
                    }
                  }(t, n) || ni(t, n) || function () {
                    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()),
                  o = r[0],
                  a = r[1];
                u[o] = function (e, t) {
                  return ei(ei({}, a(e, t)), {}, {
                    _control: t
                  });
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    }
  };
  function ui(e) {
    return ui = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, ui(e);
  }
  function ci() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _li(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d15 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d15.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d15.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d15.v = r, _d15.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d15.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d15.n = -1), p(u, c)) : _d15.n = c : _d15.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d15.n < 0) ? c : n.call(r, _d15)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_li(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _li(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _li(s, "constructor", l), _li(l, "constructor", c), c.displayName = "GeneratorFunction", _li(l, o, "GeneratorFunction"), _li(s), _li(s, o, "Generator"), _li(s, r, function () {
      return this;
    }), _li(s, "toString", function () {
      return "[object Generator]";
    }), (ci = function ci() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _li(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _li = function li(e, t, n, r) {
      function a(t, n) {
        _li(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _li(e, t, n, r);
  }
  function fi(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function si(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? fi(Object(n), !0).forEach(function (t) {
        di(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : fi(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function di(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != ui(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != ui(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == ui(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function pi(e) {
    return function (e) {
      if (Array.isArray(e)) return mi(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || bi(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function bi(e, t) {
    if (e) {
      if ("string" == typeof e) return mi(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? mi(e, t) : void 0;
    }
  }
  function mi(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function yi(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function gi(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          yi(a, r, o, i, u, "next", e);
        }
        function u(e) {
          yi(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var vi = {
    dataflow: function dataflow(e) {
      return gi(ci().m(function t() {
        var o,
          a,
          i,
          u,
          c,
          l,
          f,
          s = arguments;
        return ci().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (a = (o = s.length > 0 && void 0 !== s[0] ? s[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: a,
                nodelambda: u,
                contextuallambda: c,
                etaTree: e.gos.etaTree
              });
            case 2:
              return l = t.v, f = function () {
                var e = Object.keys(l).filter(function (e) {
                  return 0 === Object.keys(l[e]).length;
                });
                return e.length > 0 ? e.sort().join(";") : void 0;
              }(), t.a(2, function (e, t) {
                var o = new r.Subject(),
                  a = t._stream.pipe(n.withLatestFrom.apply(void 0, pi(e.map(function (e) {
                    return e._stream;
                  }))), (0, n.map)(function (e) {
                    var t = {
                      _cratelabel: f ? {
                        tag: f
                      } : {}
                    };
                    if ((Array.isArray(e[1]) ? e[1] : [e[1]]).flat().map(function (e) {
                      return h(e) && e._label.tag && "string" == typeof e._label.tag ? e : void 0;
                    }).filter(function (e) {
                      return void 0 !== e;
                    }).map(function (e) {
                      t[e._bname] = e._bname in t ? [].concat(pi(t[e._bname]), [e]) : [e];
                    }), Object.keys(t).length > 1) return o.next(t), e[0];
                  }), (0, n.filter)(function (e) {
                    return void 0 !== e;
                  }), (0, n.share)());
                return {
                  _stream: o.pipe((0, n.map)(function (e) {
                    return e;
                  }), (0, n.share)()),
                  _control: si(si({}, t), {}, {
                    _stream: a
                  })
                };
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return gi(ci().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return ci().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t,
                  n,
                  r = (n = 2, function (e) {
                    if (Array.isArray(e)) return e;
                  }(t = e) || function (e, t) {
                    var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                    if (null != n) {
                      var r,
                        o,
                        a,
                        i,
                        u = [],
                        c = !0,
                        l = !1;
                      try {
                        if (a = (n = n.call(e)).next, 0 === t) {
                          if (Object(n) !== n) return;
                          c = !1;
                        } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                      } catch (e) {
                        l = !0, o = e;
                      } finally {
                        try {
                          if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                        } finally {
                          if (l) throw o;
                        }
                      }
                      return u;
                    }
                  }(t, n) || bi(t, n) || function () {
                    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()),
                  o = r[0],
                  a = r[1];
                u[o] = function (e, t) {
                  return si(si({}, a(e, t)), {}, {
                    _control: t
                  });
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    }
  };
  function hi(e) {
    return hi = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, hi(e);
  }
  function wi(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Oi(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? wi(Object(n), !0).forEach(function (t) {
        _i(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : wi(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function _i(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != hi(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != hi(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == hi(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function ji() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Si(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d16 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d16.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d16.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d16.v = r, _d16.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d16.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d16.n = -1), p(u, c)) : _d16.n = c : _d16.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d16.n < 0) ? c : n.call(r, _d16)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Si(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Si(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Si(s, "constructor", l), _Si(l, "constructor", c), c.displayName = "GeneratorFunction", _Si(l, o, "GeneratorFunction"), _Si(s), _Si(s, o, "Generator"), _Si(s, r, function () {
      return this;
    }), _Si(s, "toString", function () {
      return "[object Generator]";
    }), (ji = function ji() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Si(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Si = function Si(e, t, n, r) {
      function a(t, n) {
        _Si(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Si(e, t, n, r);
  }
  function ki(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Ti(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ki(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ki(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Ei = {
    dataflow: function dataflow(e) {
      return Ti(ji().m(function t() {
        var o,
          a,
          i,
          u,
          c = arguments;
        return ji().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return a = (o = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, o.refnodedata, i = o.nodelambda, u = o.contextuallambda, t.n = 1, qs({
                refnode: a,
                nodelambda: i,
                contextuallambda: u,
                etaTree: e.gos.etaTree
              });
            case 1:
              return t.a(2, function (e, t) {
                var o = D(e);
                return o && "_stream" in o ? {
                  _stream: o._stream.pipe((0, n.map)(function (e) {
                    return e;
                  })),
                  _control: t
                } : {
                  _stream: (0, r.of)([]),
                  _control: t
                };
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return Ti(ji().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c,
          l = arguments;
        return ji().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (r = (n = l.length > 0 && void 0 !== l[0] ? l[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, u = {}, !(a.length > 0)) {
                t.n = 2;
                break;
              }
              return t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: i,
                etaTree: e.gos.etaTree
              });
            case 1:
              c = t.v, u[o.leaf.logic.type] = Oi({}, c), t.n = 3;
              break;
            case 2:
              u[o.leaf.logic.type] = {};
            case 3:
              return t.a(2, u);
          }
        }, t);
      }));
    },
    methods: function methods(e) {
      return Ti(ji().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u = arguments;
        return ji().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = u.length > 0 && void 0 !== u[0] ? u[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: o,
                contextuallambda: a,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, t.a(2, {
                config: {
                  getConfigData: function () {
                    var e = Ti(ji().m(function e() {
                      var t, n, r;
                      return ji().w(function (e) {
                        for (;;) switch (e.n) {
                          case 0:
                            if (!(t = "_default" in i ? i._default : void 0)) {
                              e.n = 2;
                              break;
                            }
                            return e.n = 1, gp(t, [], {});
                          case 1:
                            r = e.v, e.n = 3;
                            break;
                          case 2:
                            r = {};
                          case 3:
                            return n = r, e.a(2, n);
                        }
                      }, e);
                    }));
                    return function () {
                      return e.apply(this, arguments);
                    };
                  }()
                }
              });
          }
        }, t);
      }));
    }
  };
  function Pi(e) {
    return Pi = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Pi(e);
  }
  function Ai(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function xi() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Ni(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d17 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d17.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d17.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d17.v = r, _d17.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d17.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d17.n = -1), p(u, c)) : _d17.n = c : _d17.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d17.n < 0) ? c : n.call(r, _d17)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Ni(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Ni(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Ni(s, "constructor", l), _Ni(l, "constructor", c), c.displayName = "GeneratorFunction", _Ni(l, o, "GeneratorFunction"), _Ni(s), _Ni(s, o, "Generator"), _Ni(s, r, function () {
      return this;
    }), _Ni(s, "toString", function () {
      return "[object Generator]";
    }), (xi = function xi() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Ni(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Ni = function Ni(e, t, n, r) {
      function a(t, n) {
        _Ni(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Ni(e, t, n, r);
  }
  function Fi(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Ii(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Fi(Object(n), !0).forEach(function (t) {
        Li(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Fi(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Li(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Pi(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Pi(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Pi(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Di(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Gi(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Di(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Di(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Ci = c("leafdeckspade"),
    Mi = {
      dataflow: function dataflow(e) {
        return Gi(xi().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l = arguments;
          return xi().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (r = (n = l.length > 0 && void 0 !== l[0] ? l[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(o.leaf.logic.type, " node ") + "(".concat(r, ") called with args (").concat(JSON.stringify(o.leaf.logic.args), ").");
              case 1:
                return console.log(i), t.n = 2, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: i,
                  etaTree: e.gos.etaTree
                });
              case 2:
                return u = t.v, t.n = 3, aa.dataflow(e)({
                  refnodedata: {
                    leaf: {
                      logic: {
                        args: {}
                      }
                    }
                  },
                  nodelambda: [],
                  contextuallambda: i
                });
              case 3:
                return c = {
                  codebase: "leafdeckspade.js",
                  refnode: r,
                  leafnode: r && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(r).leafnode.data
                }, t.a(2, function (e, t) {
                  var n,
                    a = ["_leafdeckdiamond"],
                    i = null === (n = t._config) || void 0 === n ? void 0 : n.loopidx,
                    l = o.leaf.logic.args,
                    f = "_default" in u ? function (e, t) {
                      var n = Ii({}, t);
                      return i >= 0 && (n._config.loopidx = i), n._config.clubrefnode = r, u._default(e, n);
                    } : function (e, t) {
                      return console.log("start debugging"), Ii(Ii({}, D(e)), {}, {
                        _control: t
                      });
                    },
                    s = t._stream;
                  return jp({
                    _stream: s
                  }, e, void 0, Ii(Ii({}, c), {}, {
                    metastep: "creating a leafdeckspade element"
                  }), {
                    datalogic: {
                      pre: function pre(e) {
                        return Array.isArray(e) ? e.map(function (e) {
                          return oe(a, e);
                        }).filter(function (e) {
                          return e;
                        }) : oe(a, e);
                      },
                      post: function post(e) {
                        var t = Array.isArray(e) ? e : [e],
                          n = {
                            type: "leafdeckspade",
                            uuid: (0, j.v4)(),
                            name: _ge(Ci.editorconfig.namedatakey, l),
                            description: "{description}",
                            lambdas: {
                              "default": "defaultLambda",
                              defaultLambda: f,
                              bro: function bro(e) {
                                return e;
                              }
                            },
                            diamonds: t
                          };
                        return console.log("node logic executed: " + JSON.stringify(n)), re("screenio", n);
                      }
                    }
                  });
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return Gi(xi().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return xi().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: o,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return i = t.v, u = {}, Object.entries(i).map(function (e) {
                  var t,
                    n,
                    r = (n = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(t = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(t, n) || function (e, t) {
                      if (e) {
                        if ("string" == typeof e) return Ai(e, t);
                        var n = {}.toString.call(e).slice(8, -1);
                        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ai(e, t) : void 0;
                      }
                    }(t, n) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    o = r[0],
                    a = r[1];
                  u[o] = function (e, t) {
                    return Ii(Ii({}, a(e, t)), {}, {
                      _control: t
                    });
                  };
                }), t.a(2, u);
            }
          }, t);
        }));
      }
    };
  function Ri(e) {
    return Ri = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Ri(e);
  }
  function qi(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Ji() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _$i(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d18 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d18.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d18.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d18.v = r, _d18.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d18.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d18.n = -1), p(u, c)) : _d18.n = c : _d18.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d18.n < 0) ? c : n.call(r, _d18)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_$i(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _$i(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _$i(s, "constructor", l), _$i(l, "constructor", c), c.displayName = "GeneratorFunction", _$i(l, o, "GeneratorFunction"), _$i(s), _$i(s, o, "Generator"), _$i(s, r, function () {
      return this;
    }), _$i(s, "toString", function () {
      return "[object Generator]";
    }), (Ji = function Ji() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _$i(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _$i = function $i(e, t, n, r) {
      function a(t, n) {
        _$i(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _$i(e, t, n, r);
  }
  function Ui(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Bi(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Ui(Object(n), !0).forEach(function (t) {
        zi(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ui(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function zi(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Ri(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Ri(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Ri(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Hi(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Vi(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Hi(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Hi(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Wi = c("leafdeckheart"),
    Qi = {
      dataflow: function dataflow(e) {
        return Vi(Ji().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l = arguments;
          return Ji().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (r = (n = l.length > 0 && void 0 !== l[0] ? l[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(o.leaf.logic.type, " node ") + "(".concat(r, ") called with args (").concat(JSON.stringify(o.leaf.logic.args), ").");
              case 1:
                return t.n = 2, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: i,
                  etaTree: e.gos.etaTree
                });
              case 2:
                return u = t.v, t.n = 3, aa.dataflow(e)({
                  refnodedata: {
                    leaf: {
                      logic: {
                        args: {}
                      }
                    }
                  },
                  nodelambda: [],
                  contextuallambda: i
                });
              case 3:
                return t.n = 4, Qa.dataflow(e)({
                  refnodedata: {
                    leaf: {
                      logic: {
                        args: {
                          bottlekey: "_leafdeckheart"
                        }
                      }
                    }
                  },
                  nodelambda: [],
                  contextuallambda: i
                });
              case 4:
                return c = {
                  codebase: "leafdeckheart.js",
                  refnode: r,
                  leafnode: r && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(r).leafnode.data
                }, t.a(2, function (e, t) {
                  var n,
                    a = ["_leafdeckdiamond"],
                    i = null === (n = t._config) || void 0 === n ? void 0 : n.loopidx,
                    l = o.leaf.logic.args,
                    f = "_default" in u ? function (e, t) {
                      var n = Bi({}, t);
                      return i >= 0 && (n._config.loopidx = i), n._config.clubrefnode = r, u._default(e, n);
                    } : function (e, t) {
                      return console.log("start debugging"), Bi(Bi({}, D(e)), {}, {
                        _control: t
                      });
                    },
                    s = t._stream;
                  return jp({
                    _stream: s
                  }, e, void 0, Bi(Bi({}, c), {}, {
                    metastep: "creating a leafdeckheart element"
                  }), {
                    datalogic: {
                      pre: function pre(e) {
                        return "02dda89a-6816-4e63-86eb-071b39d5fd51" === c.refnode && console.log("start debugging"), Array.isArray(e) ? e.map(function (e) {
                          return oe(a, e);
                        }).filter(function (e) {
                          return e;
                        }) : oe(a, e);
                      },
                      post: function post(e) {
                        var t = Array.isArray(e) ? e : [e],
                          n = {
                            type: "leafdeckheart",
                            uuid: (0, j.v4)(),
                            name: _ge(Wi.editorconfig.namedatakey, l),
                            description: "{description}",
                            lambdas: {
                              "default": "defaultLambda",
                              defaultLambda: f,
                              bro: function bro(e) {
                                return e;
                              }
                            },
                            diamonds: t
                          };
                        return console.log("node logic executed: " + JSON.stringify(n)), re("screenio", n);
                      }
                    }
                  });
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return Vi(Ji().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return Ji().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: o,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return i = t.v, u = {}, Object.entries(i).map(function (e) {
                  var t,
                    n,
                    r = (n = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(t = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(t, n) || function (e, t) {
                      if (e) {
                        if ("string" == typeof e) return qi(e, t);
                        var n = {}.toString.call(e).slice(8, -1);
                        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? qi(e, t) : void 0;
                      }
                    }(t, n) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    o = r[0],
                    a = r[1];
                  u[o] = function (e, t) {
                    return Bi(Bi({}, a(e, t)), {}, {
                      _control: t
                    });
                  };
                }), t.a(2, u);
            }
          }, t);
        }));
      }
    };
  function Ki(e) {
    return Ki = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Ki(e);
  }
  function Xi(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Zi() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Yi(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d19 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d19.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d19.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d19.v = r, _d19.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d19.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d19.n = -1), p(u, c)) : _d19.n = c : _d19.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d19.n < 0) ? c : n.call(r, _d19)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Yi(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Yi(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Yi(s, "constructor", l), _Yi(l, "constructor", c), c.displayName = "GeneratorFunction", _Yi(l, o, "GeneratorFunction"), _Yi(s), _Yi(s, o, "Generator"), _Yi(s, r, function () {
      return this;
    }), _Yi(s, "toString", function () {
      return "[object Generator]";
    }), (Zi = function Zi() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Yi(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Yi = function Yi(e, t, n, r) {
      function a(t, n) {
        _Yi(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Yi(e, t, n, r);
  }
  function eu(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function tu(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? eu(Object(n), !0).forEach(function (t) {
        nu(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : eu(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function nu(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Ki(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Ki(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Ki(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function ru(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function ou(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ru(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ru(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var au = process.env.LEAFGON_URL,
    iu = c("leafdeckdiamond"),
    uu = {
      dataflow: function dataflow(e) {
        return ou(Zi().m(function t() {
          var r,
            o,
            a,
            i,
            u,
            c,
            l,
            f = arguments;
          return Zi().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (o = (r = f.length > 0 && void 0 !== f[0] ? f[0] : {}).refnode, a = r.refnodedata, i = r.nodelambda, u = r.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(a.leaf.logic.type, " node ") + "(".concat(o, ") called with args (").concat(JSON.stringify(a.leaf.logic.args), ").");
              case 1:
                return t.n = 2, qs({
                  refnode: o,
                  nodelambda: i,
                  contextuallambda: u,
                  etaTree: e.gos.etaTree
                });
              case 2:
                return c = t.v, t.n = 3, aa.dataflow(e)({
                  refnodedata: {
                    leaf: {
                      logic: {
                        args: {}
                      }
                    }
                  },
                  nodelambda: [],
                  contextuallambda: u
                });
              case 3:
                return l = {
                  codebase: "leafdeckdiamond.js",
                  refnode: o,
                  leafnode: o && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(o).leafnode.data
                }, t.a(2, function (e, t) {
                  var r,
                    i = ["_leafdeckclub"],
                    u = null === (r = t._config) || void 0 === r ? void 0 : r.loopidx,
                    f = a.leaf.logic.args,
                    s = "_default" in c ? function (e, t) {
                      var r = {
                        _stream: t._stream.pipe((0, n.map)(function (e) {
                          return e;
                        })),
                        _config: tu({}, t._config)
                      };
                      u >= 0 && (r._config.loopidx = u), r._config.clubrefnode = o;
                      var a = c._default(e, t);
                      return {
                        _stream: a._stream.pipe((0, n.map)(function (e) {
                          return e;
                        })),
                        _control: {
                          _stream: a._control._stream.pipe((0, n.map)(function (e) {
                            return e;
                          }))
                        }
                      };
                    } : "href" in c && "_default" in c.href ? function (e, t) {
                      var r = c.href._default(e, t);
                      return {
                        _stream: r._stream.pipe((0, n.map)(function (e) {
                          return console.log("redirecting"), window.location.href.slice(-e.length) !== e && (window.location.href = e), e;
                        })),
                        _control: tu(tu({}, t._control), {}, {
                          _stream: r._control._stream.pipe((0, n.map)(function (e) {
                            return e;
                          }))
                        })
                      };
                    } : function (e, t) {
                      return console.log("start debugging"), tu(tu({}, D(e)), {}, {
                        _control: t
                      });
                    },
                    d = t._stream,
                    p = jp({
                      _stream: d
                    }, e, void 0, tu(tu({}, l), {}, {
                      metastep: "creating a leafdeckdiamond element"
                    }), {
                      datalogic: {
                        pre: function pre(e) {
                          var t = Array.isArray(e) ? e : [e],
                            n = {
                              clubs: [],
                              nodeinput: []
                            };
                          return t.map(function (e) {
                            h(e) && (e._bname === i[0] ? n.clubs.push(oe(i, e)) : "nodeinput" === e._bname && n.nodeinput.push(oe("nodeinput", e)));
                          }), n;
                        },
                        post: function post(e) {
                          e.clubs || console.log("start debugging");
                          var t = e.clubs.filter(function (e) {
                              return e;
                            }),
                            n = "subscribe" in c && 0 === t.length,
                            r = {
                              type: "leafdeckdiamond",
                              uuid: (0, j.v4)(),
                              nodeuuid: o,
                              name: _ge(iu.editorconfig.namedatakey, f),
                              svgicon: au + "/icons/hardware/laptop_mac/materialicons/24px.svg",
                              description: "{description}",
                              nodeinput: e.nodeinput,
                              lambdas: {
                                "default": "defaultLambda",
                                defaultLambda: s,
                                bro: function bro(e) {
                                  return e;
                                }
                              },
                              subscription: n,
                              clubs: t
                            };
                          return console.log("node logic executed: " + JSON.stringify(r)), re("_leafdeckdiamond", r);
                        }
                      }
                    });
                  return {
                    _stream: p._stream.pipe((0, n.map)(function (e) {
                      return console.log(e), e;
                    })),
                    _control: p._control
                  };
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return ou(Zi().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return Zi().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: o,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return i = t.v, u = {}, Object.entries(i).map(function (e) {
                  var t,
                    n,
                    r = (n = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(t = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(t, n) || function (e, t) {
                      if (e) {
                        if ("string" == typeof e) return Xi(e, t);
                        var n = {}.toString.call(e).slice(8, -1);
                        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Xi(e, t) : void 0;
                      }
                    }(t, n) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    o = r[0],
                    a = r[1];
                  u[o] = function (e, t) {
                    return {
                      _stream: a(e, t),
                      _control: t
                    };
                  };
                }), t.a(2, u);
            }
          }, t);
        }));
      }
    };
  function cu(e) {
    return cu = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, cu(e);
  }
  function lu(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function fu() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _su(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d20 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d20.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d20.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d20.v = r, _d20.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d20.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d20.n = -1), p(u, c)) : _d20.n = c : _d20.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d20.n < 0) ? c : n.call(r, _d20)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_su(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _su(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _su(s, "constructor", l), _su(l, "constructor", c), c.displayName = "GeneratorFunction", _su(l, o, "GeneratorFunction"), _su(s), _su(s, o, "Generator"), _su(s, r, function () {
      return this;
    }), _su(s, "toString", function () {
      return "[object Generator]";
    }), (fu = function fu() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _su(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _su = function su(e, t, n, r) {
      function a(t, n) {
        _su(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _su(e, t, n, r);
  }
  function du(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function pu(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? du(Object(n), !0).forEach(function (t) {
        bu(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : du(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function bu(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != cu(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != cu(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == cu(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function mu(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function yu(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          mu(a, r, o, i, u, "next", e);
        }
        function u(e) {
          mu(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var gu = process.env.LEAFGON_URL,
    vu = c("leafdeckclub"),
    hu = {
      dataflow: function dataflow(e) {
        return yu(fu().m(function t() {
          var r,
            o,
            a,
            i,
            u,
            c,
            l,
            f = arguments;
          return fu().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (o = (r = f.length > 0 && void 0 !== f[0] ? f[0] : {}).refnode, a = r.refnodedata, i = r.nodelambda, u = r.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(a.leaf.logic.type, " node ") + "(".concat(o, ") called with args (").concat(JSON.stringify(a.leaf.logic.args), ").");
              case 1:
                return t.n = 2, qs({
                  refnode: o,
                  nodelambda: i,
                  contextuallambda: u,
                  etaTree: e.gos.etaTree
                });
              case 2:
                return c = t.v, l = {
                  codebase: "leafdeckclub.js",
                  refnode: o,
                  leafnode: o && e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(o).leafnode.data
                }, t.a(2, function (e, t) {
                  var r,
                    i = null === (r = t._config) || void 0 === r ? void 0 : r.loopidx,
                    u = a.leaf.logic.args,
                    f = "_default" in c ? function (e, t) {
                      var n = pu({}, t);
                      return i >= 0 && (n._config.loopidx = i), n._config.clubrefnode = o, c._default(e, n);
                    } : function (e, t) {
                      return console.log("start debugging"), pu(pu({}, D(e)), {}, {
                        _control: t
                      });
                    },
                    s = t._stream.pipe((0, n.map)(function (e) {
                      return e;
                    })),
                    d = jp({
                      _stream: s
                    }, e, void 0, pu(pu({}, l), {}, {
                      metastep: "creating a leafdeckclub element"
                    }), {
                      datalogic: {
                        pre: function pre(e) {
                          var t = Array.isArray(e) ? e : [e],
                            n = {
                              nodeinput: []
                            };
                          return t.map(function (e) {
                            h(e) && "nodeinput" === e._bname && n.nodeinput.push(oe("nodeinput", e));
                          }), n;
                        },
                        post: function post(e) {
                          var t = "subscribe" in c,
                            n = {
                              type: "leafdeckclub",
                              uuid: (0, j.v4)(),
                              nodeuuid: o,
                              name: _ge(vu.editorconfig.namedatakey, u),
                              svgicon: gu + "/icons/hardware/laptop_mac/materialicons/24px.svg",
                              description: "{description}",
                              nodeinput: e.nodeinput,
                              lambdas: {
                                "default": "defaultLambda",
                                defaultLambda: f,
                                bro: function bro(e) {
                                  return e;
                                }
                              },
                              subscription: t
                            };
                          return console.log("node logic executed: " + JSON.stringify(n)), re("_leafdeckclub", n);
                        }
                      }
                    });
                  return {
                    _stream: d._stream.pipe((0, n.map)(function (e) {
                      return console.log(e), e;
                    })),
                    _control: d._control
                  };
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return yu(fu().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return fu().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: o,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return i = t.v, u = {}, Object.entries(i).map(function (e) {
                  var t,
                    n,
                    r = (n = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(t = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(t, n) || function (e, t) {
                      if (e) {
                        if ("string" == typeof e) return lu(e, t);
                        var n = {}.toString.call(e).slice(8, -1);
                        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? lu(e, t) : void 0;
                      }
                    }(t, n) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    o = r[0],
                    a = r[1];
                  u[o] = function (e, t) {
                    return pu(pu({}, a(e, t)), {}, {
                      _control: t
                    });
                  };
                }), t.a(2, u);
            }
          }, t);
        }));
      }
    };
  function wu(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Ou() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _u2(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d21 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d21.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d21.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d21.v = r, _d21.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d21.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d21.n = -1), p(u, c)) : _d21.n = c : _d21.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d21.n < 0) ? c : n.call(r, _d21)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_u2(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _u2(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _u2(s, "constructor", l), _u2(l, "constructor", c), c.displayName = "GeneratorFunction", _u2(l, o, "GeneratorFunction"), _u2(s), _u2(s, o, "Generator"), _u2(s, r, function () {
      return this;
    }), _u2(s, "toString", function () {
      return "[object Generator]";
    }), (Ou = function Ou() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _u2(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _u2 = function _u(e, t, n, r) {
      function a(t, n) {
        _u2(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _u2(e, t, n, r);
  }
  function ju(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Su(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ju(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ju(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var ku = {
    dataflow: function dataflow(e) {
      return Su(Ou().m(function t() {
        var r,
          o,
          a,
          i,
          u,
          c,
          l,
          f = arguments;
        return Ou().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (o = (r = f.length > 0 && void 0 !== f[0] ? f[0] : {}).refnode, a = r.refnodedata, i = r.nodelambda, u = r.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(a.leaf.logic.type, " node ") + "(".concat(o, ") called with args (").concat(JSON.stringify(a.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: o,
                nodelambda: u,
                contextuallambda: i,
                etaTree: e.gos.etaTree
              });
            case 2:
              return c = ii.dataflow(e)({
                refnodedata: {
                  leaf: {
                    logic: {
                      args: {
                        bottlekey: "_leafdeckspade"
                      }
                    }
                  }
                },
                nodelambda: [],
                contextuallambda: u
              }), l = ii.dataflow(e)({
                refnodedata: {
                  leaf: {
                    logic: {
                      args: {
                        bottlekey: "_leafdeckheart"
                      }
                    }
                  }
                },
                nodelambda: [],
                contextuallambda: u
              }), t.a(2, function (e) {
                return (void 0)([c(e), l(e)]).pipe((0, n.map)(function (e) {
                  return console.log(e), e;
                }), (0, n.map)(function (e) {
                  return console.log("node logic executed: " + JSON.stringify(null)), e;
                })).pipe((0, n.filter)(function (e) {
                  return e;
                }));
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return Su(Ou().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return Ou().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t,
                  n,
                  r = (n = 2, function (e) {
                    if (Array.isArray(e)) return e;
                  }(t = e) || function (e, t) {
                    var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                    if (null != n) {
                      var r,
                        o,
                        a,
                        i,
                        u = [],
                        c = !0,
                        l = !1;
                      try {
                        if (a = (n = n.call(e)).next, 0 === t) {
                          if (Object(n) !== n) return;
                          c = !1;
                        } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                      } catch (e) {
                        l = !0, o = e;
                      } finally {
                        try {
                          if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                        } finally {
                          if (l) throw o;
                        }
                      }
                      return u;
                    }
                  }(t, n) || function (e, t) {
                    if (e) {
                      if ("string" == typeof e) return wu(e, t);
                      var n = {}.toString.call(e).slice(8, -1);
                      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? wu(e, t) : void 0;
                    }
                  }(t, n) || function () {
                    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()),
                  o = r[0],
                  a = r[1];
                u[o] = function (e) {
                  return a(e);
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    }
  };
  function Tu(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Eu() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Pu(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d22 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d22.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d22.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d22.v = r, _d22.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d22.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d22.n = -1), p(u, c)) : _d22.n = c : _d22.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d22.n < 0) ? c : n.call(r, _d22)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Pu(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Pu(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Pu(s, "constructor", l), _Pu(l, "constructor", c), c.displayName = "GeneratorFunction", _Pu(l, o, "GeneratorFunction"), _Pu(s), _Pu(s, o, "Generator"), _Pu(s, r, function () {
      return this;
    }), _Pu(s, "toString", function () {
      return "[object Generator]";
    }), (Eu = function Eu() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Pu(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Pu = function Pu(e, t, n, r) {
      function a(t, n) {
        _Pu(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Pu(e, t, n, r);
  }
  function Au(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function xu(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Au(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Au(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Nu = process.env.LEAFGON_URL,
    Fu = {
      dataflow: function dataflow(e) {
        return xu(Eu().m(function t() {
          var r,
            o,
            a,
            i,
            u,
            c,
            l,
            f,
            s = arguments;
          return Eu().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (o = (r = s.length > 0 && void 0 !== s[0] ? s[0] : {}).refnode, a = r.refnodedata, i = r.nodelambda, u = r.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(a.leaf.logic.type, " node ") + "(".concat(o, ") called with args (").concat(JSON.stringify(a.leaf.logic.args), ").");
              case 1:
                return t.n = 2, qs({
                  refnode: o,
                  nodelambda: u,
                  contextuallambda: i,
                  etaTree: e.gos.etaTree
                });
              case 2:
                return c = t.v, l = "_default" in c ? function (e) {
                  return c._default([e]);
                } : function (e) {
                  return e;
                }, f = Qa.dataflow(e)({
                  refnodedata: {
                    leaf: {
                      logic: {
                        args: {
                          bottlekey: "_leafpopupview"
                        }
                      }
                    }
                  },
                  nodelambda: [],
                  contextuallambda: u
                }), t.a(2, function (e) {
                  var t = e.pipe((0, n.map)(function (e) {
                    return console.log(e), e;
                  }), (0, n.map)(function (e) {
                    var t;
                    return t = {
                      type: "leafpopupview",
                      uuid: "308bd84f-3af2-478e-ae35-b2842a9bd3a1",
                      svgicon: Nu + "/icons/hardware/laptop_mac/materialicons/24px.svg",
                      description: "coolest popupview in LEAF",
                      lambdas: {
                        "default": "defaultLambda",
                        defaultLambda: l,
                        bro: function bro(e) {
                          return e;
                        }
                      }
                    }, console.log("node logic executed: " + JSON.stringify(t)), t || e;
                  }));
                  return f(t.pipe((0, n.filter)(function (e) {
                    return e;
                  })));
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return xu(Eu().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return Eu().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: o,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return i = t.v, u = {}, Object.entries(i).map(function (e) {
                  var t,
                    n,
                    r = (n = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(t = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(t, n) || function (e, t) {
                      if (e) {
                        if ("string" == typeof e) return Tu(e, t);
                        var n = {}.toString.call(e).slice(8, -1);
                        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Tu(e, t) : void 0;
                      }
                    }(t, n) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    o = r[0],
                    a = r[1];
                  u[o] = function (e) {
                    return a(e);
                  };
                }), t.a(2, u);
            }
          }, t);
        }));
      }
    };
  var Iu = require("axios");
  function Lu(e) {
    return Lu = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Lu(e);
  }
  function Du(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Gu(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Du(Object(n), !0).forEach(function (t) {
        Cu(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Du(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Cu(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Lu(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Lu(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Lu(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Mu(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var Ru = re("error", {
    type: "critical",
    message: "LEAF core error: race condition detected in mediaplayer.js",
    codebase: "/src/ghostos/api/parser/nodelogic/elements/library/mediaplayer.js"
  }, {});
  function qu(e) {
    return qu = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, qu(e);
  }
  function Ju(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function $u(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Ju(Object(n), !0).forEach(function (t) {
        Uu(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ju(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Uu(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != qu(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != qu(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == qu(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  var Bu = re("error", {
    type: "critical",
    message: "LEAF core error: race condition detected in prompt.js",
    codebase: "/src/ghostos/api/parser/nodelogic/elements/library/prompt.js"
  }, {});
  function zu(e) {
    return zu = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, zu(e);
  }
  function Hu() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Vu(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d23 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d23.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d23.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d23.v = r, _d23.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d23.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d23.n = -1), p(u, c)) : _d23.n = c : _d23.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d23.n < 0) ? c : n.call(r, _d23)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Vu(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Vu(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Vu(s, "constructor", l), _Vu(l, "constructor", c), c.displayName = "GeneratorFunction", _Vu(l, o, "GeneratorFunction"), _Vu(s), _Vu(s, o, "Generator"), _Vu(s, r, function () {
      return this;
    }), _Vu(s, "toString", function () {
      return "[object Generator]";
    }), (Hu = function Hu() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Vu(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Vu = function Vu(e, t, n, r) {
      function a(t, n) {
        _Vu(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Vu(e, t, n, r);
  }
  function Wu(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Qu(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Ku(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Qu(Object(n), !0).forEach(function (t) {
        Xu(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Qu(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Xu(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != zu(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != zu(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == zu(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Zu(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var Yu = re("error", {
    type: "critical",
    message: "LEAF core error: race condition detected in popup.js",
    codebase: "/src/ghostos/api/parser/nodelogic/elements/library/popup.js"
  }, {});
  function ec(e) {
    return ec = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, ec(e);
  }
  function tc(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function nc(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? tc(Object(n), !0).forEach(function (t) {
        rc(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : tc(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function rc(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != ec(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != ec(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == ec(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function oc(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var ac = re("error", {
    type: "critical",
    message: "LEAF core error: race condition detected in editor.js",
    codebase: "/src/ghostos/api/parser/nodelogic/elements/editor.js"
  }, {});
  function ic(e) {
    return ic = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, ic(e);
  }
  function uc(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function cc(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? uc(Object(n), !0).forEach(function (t) {
        lc(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : uc(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function lc(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != ic(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != ic(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == ic(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function fc(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function sc(e) {
    return sc = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, sc(e);
  }
  function dc(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function pc(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? dc(Object(n), !0).forEach(function (t) {
        bc(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : dc(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function bc(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != sc(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != sc(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == sc(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function mc(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function yc() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _gc(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d24 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d24.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d24.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d24.v = r, _d24.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d24.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d24.n = -1), p(u, c)) : _d24.n = c : _d24.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d24.n < 0) ? c : n.call(r, _d24)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_gc(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _gc(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _gc(s, "constructor", l), _gc(l, "constructor", c), c.displayName = "GeneratorFunction", _gc(l, o, "GeneratorFunction"), _gc(s), _gc(s, o, "Generator"), _gc(s, r, function () {
      return this;
    }), _gc(s, "toString", function () {
      return "[object Generator]";
    }), (yc = function yc() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _gc(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _gc = function gc(e, t, n, r) {
      function a(t, n) {
        _gc(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _gc(e, t, n, r);
  }
  function vc(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function hc(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function wc(e, t) {
    if (e) {
      if ("string" == typeof e) return Oc(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Oc(e, t) : void 0;
    }
  }
  function Oc(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var _c = require("jzz").JZZ;
  var jc = require("tone"),
    Sc = require("tone/build/esm/instrument/Synth.js"),
    kc = require("tone/build/esm/instrument/AMSynth.js"),
    Tc = require("tone/build/esm/instrument/DuoSynth.js"),
    Ec = require("tone/build/esm/instrument/FMSynth.js"),
    Pc = require("tone/build/esm/instrument/MembraneSynth.js"),
    Ac = require("tone/build/esm/instrument/MetalSynth.js"),
    xc = require("tone/build/esm/instrument/MonoSynth.js"),
    Nc = require("tone/build/esm/instrument/NoiseSynth.js"),
    Fc = require("tone/build/esm/instrument/PluckSynth.js"),
    Ic = require("tone/build/esm/instrument/PolySynth.js"),
    Lc = require("tone/build/esm/instrument/Sampler.js");
  var Dc = {
      synth: {
        "new": function _new(e) {
          return new Sc.Synth(e);
        }
      },
      amsynth: {
        "new": function _new(e) {
          return new kc.AMSynth(e);
        }
      },
      duosynth: {
        "new": function _new(e) {
          return new Tc.DuoSynth(e);
        }
      },
      fmsynth: {
        "new": function _new(e) {
          return new Ec.FMSynth(e);
        }
      },
      membranesynth: {
        "new": function _new(e) {
          return new Pc.MembraneSynth(e);
        }
      },
      metalsynth: {
        "new": function _new(e) {
          return new Ac.MetalSynth(e);
        }
      },
      monosynth: {
        "new": function _new(e) {
          return new xc.MonoSynth(e);
        }
      },
      noisesynth: {
        "new": function _new(e) {
          return new Nc.NoiseSynth(e);
        }
      },
      plucksynth: {
        "new": function _new(e) {
          return new Fc.PluckSynth(e);
        }
      },
      polysynth: {
        "new": function _new(e, t) {
          return new Ic.PolySynth(e, t);
        }
      },
      sampler: {
        "new": function _new(e) {
          return new Lc.Sampler(e);
        }
      }
    },
    Gc = {
      synth: Sc.Synth,
      monosynth: xc.MonoSynth,
      fmsynth: Ec.FMSynth,
      duosyntho: Tc.DuoSynth,
      amsynth: kc.AMSynth
    },
    Cc = {
      autofilter: {
        "new": function _new(e) {
          return new jc.AutoFilter(e);
        }
      },
      bitcrusher: {
        "new": function _new(e) {
          return new jc.BitCrusher(e);
        }
      },
      chebyshev: {
        "new": function _new(e) {
          return new jc.Chebyshev(e);
        }
      },
      pitchshift: {
        "new": function _new(e) {
          return new jc.PitchShift(e);
        }
      }
    },
    Mc = function Mc(e, t) {
      var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
      try {
        var r;
        if (null != t && t.effect) return n ? (globalThis.sound[e].set(t.effect.options), globalThis.sound[e]) : null === (r = Cc[t.effect.type]) || void 0 === r ? void 0 : r["new"](t.effect.options);
        throw "effect is not defined in the config";
      } catch (e) {
        return void console.error("LEAF Error: a leafsound element `${refnode}` could not be configured, returning error:", e);
      }
    },
    Rc = function Rc() {
      globalThis.sound = {};
    },
    qc = function qc(e) {
      globalThis.sound[e] && (globalThis.sound[e].dispose(), delete globalThis.sound[e]);
    };
  function Jc(e) {
    return Jc = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Jc(e);
  }
  function $c(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Uc(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Bc(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Uc(Object(n), !0).forEach(function (t) {
        zc(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Uc(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function zc(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Jc(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Jc(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Jc(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  var Hc = {
      24: ["C"],
      25: ["C#", "Db"],
      26: ["D"],
      27: ["D#", "Eb"],
      28: ["E"],
      29: ["F"],
      30: ["F#", "Gb"],
      31: ["G"],
      32: ["G#", "Ab"],
      33: ["A"],
      34: ["A#", "Bb"],
      35: ["B"]
    },
    Vc = function Vc(e) {
      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
        n = 1 + Math.floor((e - 24) / 12);
      return Hc[e - 12 * (n - 1)][t] + String(n);
    };
  function Wc(e) {
    return Wc = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Wc(e);
  }
  function Qc() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Kc(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d25 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d25.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d25.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d25.v = r, _d25.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d25.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d25.n = -1), p(u, c)) : _d25.n = c : _d25.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d25.n < 0) ? c : n.call(r, _d25)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Kc(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Kc(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Kc(s, "constructor", l), _Kc(l, "constructor", c), c.displayName = "GeneratorFunction", _Kc(l, o, "GeneratorFunction"), _Kc(s), _Kc(s, o, "Generator"), _Kc(s, r, function () {
      return this;
    }), _Kc(s, "toString", function () {
      return "[object Generator]";
    }), (Qc = function Qc() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Kc(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Kc = function Kc(e, t, n, r) {
      function a(t, n) {
        _Kc(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Kc(e, t, n, r);
  }
  function Xc(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Zc(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Xc(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Xc(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function Yc(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function el(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Yc(Object(n), !0).forEach(function (t) {
        tl(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Yc(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function tl(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Wc(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Wc(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Wc(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function nl(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var rl = re("error", {
    type: "critical",
    message: "LEAF core error: race condition detected in gnav.js",
    codebase: "/src/ghostos/api/parser/nodelogic/elements/library/gnav.js"
  }, {});
  function ol(e, t) {
    if (e) {
      if ("string" == typeof e) return al(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? al(e, t) : void 0;
    }
  }
  function al(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function il() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _ul(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d26 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d26.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d26.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d26.v = r, _d26.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d26.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d26.n = -1), p(u, c)) : _d26.n = c : _d26.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d26.n < 0) ? c : n.call(r, _d26)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_ul(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _ul(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _ul(s, "constructor", l), _ul(l, "constructor", c), c.displayName = "GeneratorFunction", _ul(l, o, "GeneratorFunction"), _ul(s), _ul(s, o, "Generator"), _ul(s, r, function () {
      return this;
    }), _ul(s, "toString", function () {
      return "[object Generator]";
    }), (il = function il() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _ul(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _ul = function ul(e, t, n, r) {
      function a(t, n) {
        _ul(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _ul(e, t, n, r);
  }
  function cl(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function ll(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? cl(Object(n), !0).forEach(function (t) {
        fl(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : cl(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function fl(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != sl(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != sl(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == sl(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function sl(e) {
    return sl = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, sl(e);
  }
  function dl(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function pl(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          dl(a, r, o, i, u, "next", e);
        }
        function u(e) {
          dl(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function bl(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function ml() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _yl(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d27 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d27.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d27.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d27.v = r, _d27.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d27.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d27.n = -1), p(u, c)) : _d27.n = c : _d27.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d27.n < 0) ? c : n.call(r, _d27)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_yl(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _yl(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _yl(s, "constructor", l), _yl(l, "constructor", c), c.displayName = "GeneratorFunction", _yl(l, o, "GeneratorFunction"), _yl(s), _yl(s, o, "Generator"), _yl(s, r, function () {
      return this;
    }), _yl(s, "toString", function () {
      return "[object Generator]";
    }), (ml = function ml() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _yl(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _yl = function yl(e, t, n, r) {
      function a(t, n) {
        _yl(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _yl(e, t, n, r);
  }
  function gl(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function vl(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          gl(a, r, o, i, u, "next", e);
        }
        function u(e) {
          gl(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var hl = require("handlebars");
  function wl(e) {
    return function (e) {
      if (Array.isArray(e)) return jl(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || _l(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Ol(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || _l(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function _l(e, t) {
    if (e) {
      if ("string" == typeof e) return jl(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? jl(e, t) : void 0;
    }
  }
  function jl(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Sl(e) {
    return Sl = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Sl(e);
  }
  function kl(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Tl(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? kl(Object(n), !0).forEach(function (t) {
        El(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : kl(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function El(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Sl(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Sl(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Sl(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Pl(e) {
    return function (e) {
      if (Array.isArray(e)) return Nl(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || xl(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Al(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || xl(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function xl(e, t) {
    if (e) {
      if ("string" == typeof e) return Nl(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Nl(e, t) : void 0;
    }
  }
  function Nl(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Fl(e) {
    return Fl = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Fl(e);
  }
  function Il(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Ll(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Fl(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Fl(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Fl(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Dl(e) {
    return Dl = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Dl(e);
  }
  function Gl(e, t) {
    if (e) {
      if ("string" == typeof e) return Cl(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Cl(e, t) : void 0;
    }
  }
  function Cl(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Ml() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Rl(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d28 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d28.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d28.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d28.v = r, _d28.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d28.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d28.n = -1), p(u, c)) : _d28.n = c : _d28.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d28.n < 0) ? c : n.call(r, _d28)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Rl(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Rl(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Rl(s, "constructor", l), _Rl(l, "constructor", c), c.displayName = "GeneratorFunction", _Rl(l, o, "GeneratorFunction"), _Rl(s), _Rl(s, o, "Generator"), _Rl(s, r, function () {
      return this;
    }), _Rl(s, "toString", function () {
      return "[object Generator]";
    }), (Ml = function Ml() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Rl(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Rl = function Rl(e, t, n, r) {
      function a(t, n) {
        _Rl(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Rl(e, t, n, r);
  }
  function ql(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Jl(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ql(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ql(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function $l(e) {
    return function (e) {
      if (Array.isArray(e)) return Zl(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || Xl(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Ul() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Bl(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d29 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d29.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d29.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d29.v = r, _d29.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d29.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d29.n = -1), p(u, c)) : _d29.n = c : _d29.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d29.n < 0) ? c : n.call(r, _d29)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Bl(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Bl(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Bl(s, "constructor", l), _Bl(l, "constructor", c), c.displayName = "GeneratorFunction", _Bl(l, o, "GeneratorFunction"), _Bl(s), _Bl(s, o, "Generator"), _Bl(s, r, function () {
      return this;
    }), _Bl(s, "toString", function () {
      return "[object Generator]";
    }), (Ul = function Ul() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Bl(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Bl = function Bl(e, t, n, r) {
      function a(t, n) {
        _Bl(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Bl(e, t, n, r);
  }
  function zl(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Hl(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          zl(a, r, o, i, u, "next", e);
        }
        function u(e) {
          zl(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function Vl(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Wl(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Vl(Object(n), !0).forEach(function (t) {
        Ql(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Vl(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Ql(e, t, n) {
    return (t = tf(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Kl(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || Xl(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Xl(e, t) {
    if (e) {
      if ("string" == typeof e) return Zl(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Zl(e, t) : void 0;
    }
  }
  function Zl(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Yl(e, t) {
    for (var n = 0; n < t.length; n++) {
      var r = t[n];
      r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, tf(r.key), r);
    }
  }
  function ef(e, t, n) {
    return t && Yl(e.prototype, t), n && Yl(e, n), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function tf(e) {
    var t = function (e) {
      if ("object" != ff(e) || !e) return e;
      var t = e[Symbol.toPrimitive];
      if (void 0 !== t) {
        var n = t.call(e, "string");
        if ("object" != ff(n)) return n;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return String(e);
    }(e);
    return "symbol" == ff(t) ? t : t + "";
  }
  function nf(e, t) {
    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
  }
  function rf(e, t, n) {
    return t = lf(t), function (e, t) {
      if (t && ("object" == ff(t) || "function" == typeof t)) return t;
      if (void 0 !== t) throw new TypeError("Derived constructors may only return object or undefined");
      return function (e) {
        if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return e;
      }(e);
    }(e, uf() ? Reflect.construct(t, n || [], lf(e).constructor) : t.apply(e, n));
  }
  function of(e, t) {
    if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function");
    e.prototype = Object.create(t && t.prototype, {
      constructor: {
        value: e,
        writable: !0,
        configurable: !0
      }
    }), Object.defineProperty(e, "prototype", {
      writable: !1
    }), t && cf(e, t);
  }
  function af(e) {
    var t = "function" == typeof Map ? new Map() : void 0;
    return af = function af(e) {
      if (null === e || !function (e) {
        try {
          return -1 !== Function.toString.call(e).indexOf("[native code]");
        } catch (t) {
          return "function" == typeof e;
        }
      }(e)) return e;
      if ("function" != typeof e) throw new TypeError("Super expression must either be null or a function");
      if (void 0 !== t) {
        if (t.has(e)) return t.get(e);
        t.set(e, n);
      }
      function n() {
        return function (e, t, n) {
          if (uf()) return Reflect.construct.apply(null, arguments);
          var r = [null];
          r.push.apply(r, t);
          var o = new (e.bind.apply(e, r))();
          return n && cf(o, n.prototype), o;
        }(e, arguments, lf(this).constructor);
      }
      return n.prototype = Object.create(e.prototype, {
        constructor: {
          value: n,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), cf(n, e);
    }, af(e);
  }
  function uf() {
    try {
      var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    } catch (e) {}
    return (uf = function uf() {
      return !!e;
    })();
  }
  function cf(e, t) {
    return cf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (e, t) {
      return e.__proto__ = t, e;
    }, cf(e, t);
  }
  function lf(e) {
    return lf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (e) {
      return e.__proto__ || Object.getPrototypeOf(e);
    }, lf(e);
  }
  function ff(e) {
    return ff = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, ff(e);
  }
  var sf = {
      CONFIG: "_hermes_config",
      CURSOR: "_hermes_cursor",
      LAST_READ_AT: "_hermes_last_read_at",
      READ_STREAM: "_hermes_read_stream"
    },
    df = "ghostos/api/parser/nodelogic/elements/library/hermes.js",
    pf = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    bf = /^\d{17,20}$/,
    mf = /(authorization|token|cookie|secret|password|api[-_]?key)/i,
    yf = function yf(e) {
      return "object" === ff(e) && null !== e && !Array.isArray(e) && e.constructor === Object;
    },
    gf = function (e) {
      function t(e) {
        var n,
          r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
        return nf(this, t), (n = rf(this, t, [e])).name = "HermesConfigError", n.code = "validation_failed", n.status = 500, n.details = r, n;
      }
      return of(t, e), ef(t);
    }(af(Error)),
    vf = function (e) {
      function t(e, n) {
        var r,
          o = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
          a = o.status,
          i = void 0 === a ? 400 : a,
          u = o.details,
          c = void 0 === u ? {} : u;
        return nf(this, t), (r = rf(this, t, [n])).name = "HermesDomainError", r.code = e, r.status = i, r.details = c, r;
      }
      return of(t, e), ef(t);
    }(af(Error)),
    _hf = function hf(e) {
      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : new WeakSet();
      return Array.isArray(e) ? e.map(function (e) {
        return _hf(e, t);
      }) : yf(e) ? t.has(e) ? "[circular]" : (t.add(e), Object.fromEntries(Object.entries(e).map(function (e) {
        var n = Kl(e, 2),
          r = n[0],
          o = n[1];
        return mf.test(r) ? [r, "[redacted]"] : [r, _hf(o, t)];
      }))) : e;
    },
    wf = function wf(e) {
      return "string" == typeof e ? e.trim() : "";
    },
    Of = function Of(e) {
      if ("string" == typeof e) {
        var t = e.trim();
        return t.length > 0 ? t : void 0;
      }
    },
    _f = function _f(e) {
      var t = e.value,
        n = e.field,
        r = e.fallback,
        o = e.min,
        a = void 0 === o ? 1 : o,
        i = e.max,
        u = void 0 === i ? Number.MAX_SAFE_INTEGER : i;
      if (null == t || "" === t) return r;
      var c = Number.parseInt("".concat(t), 10);
      if (!Number.isFinite(c) || Number.isNaN(c) || c < a || c > u) throw new gf("".concat(n, " must be an integer between ").concat(a, " and ").concat(u, "."), {
        field: n
      });
      return c;
    },
    jf = function jf(e, t) {
      var n,
        r,
        o,
        a,
        i,
        u,
        c,
        l,
        f,
        s,
        d,
        p,
        b,
        m,
        y,
        g = function (e) {
          var t = h(e) ? e._content : e;
          if (null == t || "" === t) return {};
          if ("string" == typeof t) try {
            return JSON.parse(t);
          } catch (e) {
            throw new gf("Hermes _default config must be valid JSON.", {
              field: "_default"
            });
          }
          if (!yf(t)) throw new gf("Hermes _default config must resolve to an object.", {
            field: "_default"
          });
          return Wl({}, t);
        }(e),
        v = function (e) {
          var t = "".concat(null != e ? e : "write").trim().toLowerCase();
          if (["write", "read", "both"].includes(t)) return t;
          throw new gf("Hermes config mode must be one of: write, read, both.", {
            field: "mode"
          });
        }(g.mode),
        w = wf(null !== (n = null !== (r = null !== (o = g.baseUrl) && void 0 !== o ? o : g.apiBaseUrl) && void 0 !== r ? r : g.hermesBaseUrl) && void 0 !== n ? n : ""),
        O = wf(null !== (a = null !== (i = g.readPath) && void 0 !== i ? i : g.integrationEventsPath) && void 0 !== a ? a : "/api/hermes/integration/events"),
        _ = wf(null !== (u = null !== (c = g.readStreamPath) && void 0 !== c ? c : g.integrationEventsStreamPath) && void 0 !== u ? u : "/api/hermes/integration/events/stream"),
        j = wf(null !== (l = null !== (f = g.writePath) && void 0 !== f ? f : g.egressCommandsPath) && void 0 !== l ? l : "/api/hermes/egress-commands"),
        S = function (e) {
          var t = "".concat(null != e ? e : "auto").trim().toLowerCase();
          if (["poll", "sse", "auto"].includes(t)) return t;
          throw new gf("Hermes readTransport must be one of: poll, sse, auto.", {
            field: "readTransport"
          });
        }(null !== (s = null !== (d = g.readTransport) && void 0 !== d ? d : g.transport) && void 0 !== s ? s : "auto"),
        k = wf(null !== (p = g.instanceId) && void 0 !== p ? p : ""),
        T = wf(null !== (b = g.guildId) && void 0 !== b ? b : ""),
        E = wf(null !== (m = g.channelId) && void 0 !== m ? m : ""),
        P = Of(g.cursor),
        A = Of(g.sinceEventId),
        x = function (e) {
          if (null == e) return {};
          if (!yf(e)) throw new gf("Hermes config headers must be an object.", {
            field: "headers"
          });
          return Wl({}, e);
        }(null !== (y = g.headers) && void 0 !== y ? y : g.requestHeaders),
        N = function (e) {
          var t = "string" == typeof e.credentials ? e.credentials.trim() : !1 === e.includeCredentials ? "same-origin" : "include";
          if (!["omit", "same-origin", "include"].includes(t)) throw new gf("Hermes config credentials must be omit|same-origin|include.", {
            field: "credentials"
          });
          return t;
        }(g),
        F = _f({
          value: g.limit,
          field: "limit",
          fallback: 100,
          min: 1,
          max: 500
        }),
        I = _f({
          value: g.timeoutMs,
          field: "timeoutMs",
          fallback: 15e3,
          min: 1,
          max: 12e4
        }),
        L = _f({
          value: g.pollIntervalMs,
          field: "pollIntervalMs",
          fallback: 1e3,
          min: 0,
          max: 3e5
        }),
        D = "function" == typeof g.fetch ? g.fetch : globalThis.fetch,
        G = function (e) {
          if ("function" == typeof e.eventSourceFactory) return e.eventSourceFactory;
          var t = "function" == typeof e.eventSource ? e.eventSource : "function" == typeof globalThis.EventSource ? globalThis.EventSource : void 0;
          return "function" == typeof t ? function (e) {
            return new t(e, arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {});
          } : void 0;
        }(g);
      if ("function" != typeof D) throw new gf("Hermes runtime requires a fetch implementation.", {
        field: "fetch"
      });
      if (!O) throw new gf("Hermes readPath must be configured.", {
        field: "readPath"
      });
      if (!_) throw new gf("Hermes readStreamPath must be configured.", {
        field: "readStreamPath"
      });
      if (!j) throw new gf("Hermes writePath must be configured.", {
        field: "writePath"
      });
      if (P && A) throw new gf("Exactly one of cursor or sinceEventId may be configured.", {
        cursor: P,
        sinceEventId: A
      });
      if (["read", "both"].includes(v) && !k) throw new gf("Hermes config instanceId is required for read mode.", {
        field: "instanceId",
        mode: v
      });
      if (["read", "both"].includes(v) && "sse" === S && "function" != typeof G) throw new gf("Hermes readTransport=sse requires an EventSource implementation.", {
        field: "eventSourceFactory"
      });
      return {
        mode: v,
        baseUrl: w,
        readPath: O,
        readStreamPath: _,
        writePath: j,
        readTransport: S,
        instanceId: k,
        guildId: T,
        channelId: E,
        cursor: null != P ? P : Of(t[sf.CURSOR]),
        sinceEventId: A,
        requestHeaders: x,
        credentials: N,
        limit: F,
        timeoutMs: I,
        pollIntervalMs: L,
        fetchImpl: D,
        eventSourceFactory: G
      };
    },
    Sf = function Sf(e, t) {
      var n = wf(e),
        r = new Date(n);
      if (!n || Number.isNaN(r.getTime())) throw new vf("validation_failed", "".concat(t, " must be RFC3339 UTC."), {
        status: 400,
        details: {
          field: t
        }
      });
      return r.toISOString().replace(".000Z", "Z");
    },
    kf = function kf(e, t) {
      var n = wf(e);
      if (!pf.test(n)) throw new vf("validation_failed", "".concat(t, " must be a UUID string."), {
        status: 400,
        details: {
          field: t
        }
      });
      return n;
    },
    Tf = function Tf(e, t) {
      var n = wf(e);
      if (!n) throw new vf("validation_failed", "".concat(t, " is required."), {
        status: 400,
        details: {
          field: t
        }
      });
      return n;
    },
    Ef = function Ef(e, t) {
      var n = wf(e);
      if (!bf.test(n)) throw new vf("validation_failed", "".concat(t, " must be a Discord snowflake string."), {
        status: 400,
        details: {
          field: t
        }
      });
      return n;
    },
    Pf = function Pf(e) {
      var t,
        n = e;
      if (Array.isArray(n) && 1 === n.length && (n = n[0]), !h(n)) return !1;
      var r = "".concat(null !== (t = n._bname) && void 0 !== t ? t : "").trim().toLowerCase();
      if ("empty_bottle" !== r && "empty" !== r) return !1;
      var o = n._content;
      return "empty_data" === o || null == o;
    },
    Af = function Af(e) {
      var t = h(e) ? e._content : e;
      return Array.isArray(t) && 1 === t.length && (t = t[0]), h(t) && (t = t._content), yf(t) && yf(t.command) && (t = t.command), t;
    },
    xf = function xf(e) {
      var t = e.payload,
        n = e.config;
      if (!yf(t)) throw new vf("validation_failed", "Hermes write payload must be an object.", {
        status: 400,
        details: {
          field: "payload"
        }
      });
      var r = Wl({}, t);
      if (r.schemaVersion || (r.schemaVersion = "v1"), !r.instanceId && n.instanceId && (r.instanceId = n.instanceId), !r.guildId && n.guildId && (r.guildId = n.guildId), !r.channelId && n.channelId && (r.channelId = n.channelId), "v1" !== "".concat(r.schemaVersion).trim()) throw new vf("validation_failed", "schemaVersion must be 'v1'.", {
        status: 400,
        details: {
          field: "schemaVersion"
        }
      });
      var o = kf(r.commandId, "commandId"),
        a = Tf(r.correlationId, "correlationId"),
        i = Tf(r.producerId, "producerId"),
        u = kf(r.instanceId, "instanceId"),
        c = Ef(r.guildId, "guildId"),
        l = Ef(r.channelId, "channelId"),
        f = Tf(r.type, "type");
      if (!["send_message", "reply_message"].includes(f)) throw new vf("validation_failed", "type must be one of: send_message, reply_message.", {
        status: 400,
        details: {
          field: "type"
        }
      });
      if (!yf(r.payload)) throw new vf("validation_failed", "payload must be an object.", {
        status: 400,
        details: {
          field: "payload"
        }
      });
      var s = Wl({}, r.payload),
        d = Of(s.replyToMessageId);
      if ("send_message" === f) {
        if (void 0 !== d) throw new vf("validation_failed", "replyToMessageId must be null/absent for send_message.", {
          status: 400,
          details: {
            field: "payload.replyToMessageId"
          }
        });
        s.replyToMessageId = null;
      } else {
        if (!d || !bf.test(d)) throw new vf("validation_failed", "replyToMessageId must be a Discord snowflake for reply_message.", {
          status: 400,
          details: {
            field: "payload.replyToMessageId"
          }
        });
        s.replyToMessageId = d;
      }
      var p = Sf(r.issuedAt, "issuedAt"),
        b = Sf(r.expiresAt, "expiresAt");
      if (new Date(p) > new Date(b)) throw new vf("validation_failed", "issuedAt must be <= expiresAt.", {
        status: 400,
        details: {
          field: "issuedAt"
        }
      });
      return {
        schemaVersion: "v1",
        commandId: o,
        correlationId: a,
        producerId: i,
        instanceId: u,
        guildId: c,
        channelId: l,
        type: f,
        payload: s,
        issuedAt: p,
        expiresAt: b
      };
    },
    Nf = function Nf(e) {
      var t = e.path,
        n = e.baseUrl,
        r = e.query,
        o = void 0 === r ? {} : r;
      if (!t) throw new gf("Hermes endpoint path must not be empty.", {
        field: "path"
      });
      var a = /^https?:\/\//i.test(t),
        i = "".concat(t).trim(),
        u = wf(null != n ? n : ""),
        c = a ? i : u ? "".concat(u.replace(/\/+$/, ""), "/").concat(i.replace(/^\/+/, "")) : i,
        l = Object.entries(o).filter(function (e) {
          var t = Kl(e, 2),
            n = (t[0], t[1]);
          return null != n && "".concat(n).trim().length > 0;
        }).map(function (e) {
          var t = Kl(e, 2),
            n = t[0],
            r = t[1];
          return "".concat(encodeURIComponent(n), "=").concat(encodeURIComponent("".concat(r).trim()));
        });
      return 0 === l.length ? c : "".concat(c).concat(c.includes("?") ? "&" : "?").concat(l.join("&"));
    },
    Ff = function () {
      var e = Hl(Ul().m(function e(t) {
        var n;
        return Ul().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return e.p = 0, e.n = 1, t.json();
            case 1:
              return e.a(2, e.v);
            case 2:
              return e.p = 2, e.v, e.p = 3, e.n = 4, t.text();
            case 4:
              if (n = e.v) {
                e.n = 5;
                break;
              }
              return e.a(2, {});
            case 5:
              return e.a(2, JSON.parse(n));
            case 6:
              return e.p = 6, e.v, e.a(2, {});
          }
        }, e, null, [[3, 6], [0, 2]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }(),
    If = function () {
      var e = Hl(Ul().m(function e(t, n, r, o) {
        var a, i;
        return Ul().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return a = new AbortController(), i = setTimeout(function () {
                a.abort();
              }, o), e.p = 1, e.n = 2, t(n, Wl(Wl({}, r), {}, {
                signal: a.signal
              }));
            case 2:
              return e.a(2, e.v);
            case 3:
              return e.p = 3, clearTimeout(i), e.f(3);
            case 4:
              return e.a(2);
          }
        }, e, null, [[1,, 3, 4]]);
      }));
      return function (t, n, r, o) {
        return e.apply(this, arguments);
      };
    }(),
    Lf = function Lf(e) {
      return 400 === e ? "validation_failed" : 401 === e ? "auth_unauthorized" : 403 === e ? "auth_forbidden_scope" : 409 === e ? "validation_failed" : 413 === e ? "payload_too_large" : 429 === e ? "rate_limited" : e >= 500 ? "upstream_unavailable" : "execution_failed";
    },
    Df = function Df(e) {
      var t = e.statusCode,
        n = e.payload,
        r = e.fallbackMessage,
        o = yf(null == n ? void 0 : n.error) ? n.error : void 0,
        a = void 0 !== (null == o ? void 0 : o.details) ? o.details : void 0 !== (null == n ? void 0 : n.details) ? n.details : void 0;
      return {
        code: "string" == typeof (null == o ? void 0 : o.code) && o.code.trim().length > 0 ? o.code.trim() : Lf(t),
        message: "string" == typeof (null == o ? void 0 : o.message) && o.message.trim().length > 0 ? o.message.trim() : r,
        status: t,
        details: void 0 !== a ? _hf(a) : void 0
      };
    },
    Gf = new Set(["schemaVersion", "requestId", "nextCursor", "cursor", "hasMore", "events", "data", "instance"]),
    Cf = function Cf(e) {
      return yf(e) && Object.keys(e).length > 0;
    },
    Mf = function Mf(e) {
      if (Array.isArray(e.events)) return e.events.filter(function (e) {
        return Cf(e);
      });
      if (Array.isArray(e.data)) {
        var t = e.data.filter(function (e) {
          return Cf(e);
        });
        if (t.length > 0) return t;
      }
      return Cf(e.data) ? [e.data] : Cf(e.instance) ? [e.instance] : yf(n = e) && Object.keys(n).some(function (e) {
        return !Gf.has(e);
      }) ? [e] : [];
      var n;
    },
    Rf = function Rf(e) {
      var t = e.mode,
        n = e.data,
        r = e.meta,
        o = void 0 === r ? {} : r;
      return {
        element: "hermes",
        mode: t,
        ok: !0,
        data: _hf(n),
        meta: _hf(o)
      };
    },
    qf = function qf(e) {
      var t,
        n,
        r = e.mode,
        o = e.error,
        a = e.meta,
        i = void 0 === a ? {} : a;
      return {
        element: "hermes",
        mode: r,
        ok: !1,
        error: {
          code: null !== (t = o.code) && void 0 !== t ? t : "execution_failed",
          message: null !== (n = o.message) && void 0 !== n ? n : "Hermes operation failed.",
          status: Number.isInteger(o.status) ? o.status : void 0,
          details: void 0 !== o.details ? _hf(o.details) : void 0
        },
        meta: _hf(i)
      };
    },
    Jf = function Jf(e) {
      var t,
        n,
        r = null !== (t = null == e ? void 0 : e.code) && void 0 !== t ? t : "execution_failed",
        o = Number.isInteger(null == e ? void 0 : e.status) ? e.status : 500,
        a = "string" == typeof (null == e ? void 0 : e.message) && e.message.trim().length > 0 ? e.message.trim() : "Unexpected Hermes runtime failure.";
      return re("error", {
        type: "critical",
        element: "hermes",
        code: r,
        message: a,
        status: o,
        details: _hf(null !== (n = null == e ? void 0 : e.details) && void 0 !== n ? n : {}),
        codebase: df
      }, {});
    },
    $f = function $f(e) {
      yf(e) && Array.isArray(e.detachFns) && (e.detachFns.forEach(function (e) {
        if ("function" == typeof e) try {
          e();
        } catch (e) {}
      }), e.detachFns = []);
    },
    Uf = function Uf(e) {
      var t,
        n = e[sf.READ_STREAM];
      if (yf(n)) {
        if ($f(n), "function" == typeof (null === (t = n.source) || void 0 === t ? void 0 : t.close)) try {
          n.source.close();
        } catch (e) {}
        delete e[sf.READ_STREAM];
      } else delete e[sf.READ_STREAM];
    },
    Bf = function Bf(e) {
      var t = e[sf.READ_STREAM];
      if (!yf(t) || !Array.isArray(t.pendingOutputs)) return [];
      if (0 === t.pendingOutputs.length) return [];
      var n = t.pendingOutputs;
      return t.pendingOutputs = [], n;
    },
    zf = function zf(e) {
      var t = e.config,
        n = e._stream_cache,
        r = e.includeLimit,
        o = function (e) {
          var t,
            n = e.config;
          return null !== (t = Of(e._stream_cache[sf.CURSOR])) && void 0 !== t ? t : n.cursor;
        }({
          config: t,
          _stream_cache: n
        });
      return {
        instanceId: t.instanceId,
        guildId: t.guildId || void 0,
        channelId: t.channelId || void 0,
        cursor: null != o ? o : void 0,
        sinceEventId: o ? void 0 : t.sinceEventId,
        limit: r ? t.limit : void 0
      };
    },
    Hf = function Hf(e) {
      var t = e.config,
        n = e._stream_cache;
      return Nf({
        path: t.readPath,
        baseUrl: t.baseUrl,
        query: zf({
          config: t,
          _stream_cache: n,
          includeLimit: !0
        })
      });
    },
    Vf = function Vf(e) {
      if (yf(e)) return e;
      if ("string" == typeof e) {
        var t = e.trim();
        if (t) try {
          var n = JSON.parse(t);
          return yf(n) ? n : void 0;
        } catch (e) {
          return;
        }
      }
    },
    Wf = function Wf(e, t, n) {
      if ("function" == typeof (null == e ? void 0 : e.addEventListener)) return e.addEventListener(t, n), function () {
        "function" == typeof (null == e ? void 0 : e.removeEventListener) && e.removeEventListener(t, n);
      };
      if (null === e || "object" !== ff(e) && "function" != typeof e || !("hermes.event" === t && "onmessage" in e || "error" === t && "onerror" in e)) return function () {};
      var r = "error" === t ? "onerror" : "onmessage",
        o = e[r];
      return e[r] = n, function () {
        e[r] === n && (e[r] = o);
      };
    },
    Qf = function Qf(e) {
      var t = e.config,
        n = e.reason,
        r = e.message,
        o = e.status,
        a = void 0 === o ? 503 : o,
        i = e.code;
      return qf({
        mode: "read",
        error: {
          code: void 0 === i ? "upstream_unavailable" : i,
          message: r,
          status: a,
          details: {
            reason: n
          }
        },
        meta: {
          instanceId: t.instanceId
        }
      });
    },
    Kf = function Kf(e) {
      var t = e.config,
        n = e._stream_cache,
        r = function (e) {
          var t,
            n = Object.entries(null !== (t = e.requestHeaders) && void 0 !== t ? t : {}).sort(function (e, t) {
              var n = Kl(e, 1)[0],
                r = Kl(t, 1)[0];
              return n.localeCompare(r);
            });
          return JSON.stringify({
            baseUrl: e.baseUrl,
            readStreamPath: e.readStreamPath,
            readTransport: e.readTransport,
            instanceId: e.instanceId,
            guildId: e.guildId || "",
            channelId: e.channelId || "",
            credentials: e.credentials,
            requestHeaders: n
          });
        }(t),
        o = n[sf.READ_STREAM];
      if (yf(o) && o.identityKey === r && (!0 === o.fallbackToPoll || o.source)) return {
        usePollFallback: !0 === o.fallbackToPoll,
        outputs: []
      };
      Uf(n);
      var a = function a() {
        var e = {
          identityKey: r,
          source: void 0,
          pendingOutputs: [],
          detachFns: [],
          fallbackToPoll: !0
        };
        return n[sf.READ_STREAM] = e, {
          usePollFallback: !0,
          outputs: []
        };
      };
      if ("function" != typeof t.eventSourceFactory) return "auto" === t.readTransport ? a() : {
        usePollFallback: !1,
        outputs: [Qf({
          config: t,
          reason: "event_source_unavailable",
          message: "Hermes SSE transport is unavailable in this runtime.",
          status: 500,
          code: "execution_failed"
        })]
      };
      var i,
        u = function (e) {
          var t = e.config,
            n = e._stream_cache;
          return Nf({
            path: t.readStreamPath,
            baseUrl: t.baseUrl,
            query: zf({
              config: t,
              _stream_cache: n,
              includeLimit: !1
            })
          });
        }({
          config: t,
          _stream_cache: n
        }),
        c = void 0;
      try {
        c = t.eventSourceFactory(u, {
          withCredentials: "include" === t.credentials,
          headers: Wl({}, t.requestHeaders)
        });
      } catch (e) {
        return "auto" === t.readTransport ? a() : {
          usePollFallback: !1,
          outputs: [Qf({
            config: t,
            reason: "stream_open_failed",
            message: "Hermes SSE stream failed to open.",
            code: "execution_failed"
          })]
        };
      }
      if (null === c || "object" !== ff(c) && "function" != typeof c || "function" != typeof c.addEventListener && !("onmessage" in c) && !("onerror" in c)) return "function" == typeof (null === (i = c) || void 0 === i ? void 0 : i.close) && c.close(), "auto" === t.readTransport ? a() : {
        usePollFallback: !1,
        outputs: [Qf({
          config: t,
          reason: "invalid_event_source",
          message: "Hermes SSE stream implementation is invalid.",
          status: 500,
          code: "execution_failed"
        })]
      };
      var l = {
        identityKey: r,
        source: c,
        pendingOutputs: [],
        detachFns: [],
        fallbackToPoll: !1,
        emittedStreamError: !1
      };
      n[sf.READ_STREAM] = l;
      var f = function f(e) {
        l.pendingOutputs.push(e);
      };
      return l.detachFns = [Wf(l.source, "hermes.event", function (e) {
        var r = Vf(null == e ? void 0 : e.data);
        if (Cf(r)) {
          var o = Of(r.cursor);
          o && (n[sf.CURSOR] = o), f(Rf({
            mode: "read",
            data: {
              schemaVersion: "string" == typeof r.schemaVersion ? r.schemaVersion : "v1",
              event: r,
              cursor: o,
              hasMore: !1
            },
            meta: {
              instanceId: t.instanceId
            }
          }));
        } else f(Qf({
          config: t,
          reason: "invalid_stream_event_payload",
          message: "Hermes SSE event payload must be a JSON object.",
          status: 502,
          code: "validation_failed"
        }));
      }), Wf(l.source, "hermes.heartbeat", function (e) {
        var t = Vf(null == e ? void 0 : e.data);
        if (yf(t)) {
          var r = Of(t.cursor);
          r && (n[sf.CURSOR] = r);
        }
      }), Wf(l.source, "error", function () {
        var e;
        if ($f(l), "function" == typeof (null === (e = l.source) || void 0 === e ? void 0 : e.close)) try {
          l.source.close();
        } catch (e) {}
        l.source = void 0, "auto" !== t.readTransport ? l.emittedStreamError || (l.emittedStreamError = !0, f(Qf({
          config: t,
          reason: "stream_disconnected",
          message: "Hermes SSE stream disconnected."
        }))) : l.fallbackToPoll = !0;
      })], {
        usePollFallback: !1,
        outputs: []
      };
    },
    Xf = function () {
      var e = Hl(Ul().m(function e(t) {
        var n, r, o, a, i, u, c, l, f;
        return Ul().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              if (n = t.config, r = t._stream_cache, o = t.data_in, null != (a = Af(o))) {
                e.n = 1;
                break;
              }
              return e.a(2, []);
            case 1:
              return i = xf({
                payload: a,
                config: n
              }), u = Nf({
                path: n.writePath,
                baseUrl: n.baseUrl
              }), c = void 0, e.p = 2, e.n = 3, If(n.fetchImpl, u, {
                method: "POST",
                headers: Wl({
                  Accept: "application/json",
                  "Content-Type": "application/json"
                }, n.requestHeaders),
                credentials: n.credentials,
                body: JSON.stringify(i)
              }, n.timeoutMs);
            case 3:
              c = e.v, e.n = 5;
              break;
            case 4:
              return e.p = 4, f = e.v, e.a(2, [qf({
                mode: "write",
                error: {
                  code: "upstream_unavailable",
                  message: "Hermes write endpoint unavailable.",
                  status: 503,
                  details: {
                    reason: "AbortError" === (null == f ? void 0 : f.name) ? "timeout" : "network_error"
                  }
                },
                meta: {
                  instanceId: i.instanceId,
                  commandId: i.commandId
                }
              })]);
            case 5:
              return e.n = 6, Ff(c);
            case 6:
              if (l = e.v, c.ok) {
                e.n = 7;
                break;
              }
              return e.a(2, [qf({
                mode: "write",
                error: Df({
                  statusCode: c.status,
                  payload: l,
                  fallbackMessage: "Hermes write request failed with status ".concat(c.status, ".")
                }),
                meta: {
                  instanceId: i.instanceId,
                  commandId: i.commandId,
                  requestId: null == l ? void 0 : l.requestId
                }
              })]);
            case 7:
              return r[sf.CONFIG] = n, e.a(2, [Rf({
                mode: "write",
                data: {
                  status: "string" == typeof (null == l ? void 0 : l.status) && l.status.trim().length > 0 ? l.status.trim() : "accepted",
                  requestId: "string" == typeof (null == l ? void 0 : l.requestId) ? l.requestId : void 0,
                  response: l
                },
                meta: {
                  instanceId: i.instanceId,
                  commandId: i.commandId
                }
              })]);
          }
        }, e, null, [[2, 4]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }(),
    Zf = function () {
      var e = Hl(Ul().m(function e(t) {
        var n, r, o, a, i, u, c, l, f, s, d, p;
        return Ul().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              if (r = t.config, o = t._stream_cache, a = Date.now(), i = Number(null !== (n = o[sf.LAST_READ_AT]) && void 0 !== n ? n : 0), !(r.pollIntervalMs > 0 && a - i < r.pollIntervalMs)) {
                e.n = 1;
                break;
              }
              return e.a(2, []);
            case 1:
              return o[sf.LAST_READ_AT] = a, u = Hf({
                config: r,
                _stream_cache: o
              }), c = void 0, e.p = 2, e.n = 3, If(r.fetchImpl, u, {
                method: "GET",
                headers: Wl({
                  Accept: "application/json"
                }, r.requestHeaders),
                credentials: r.credentials
              }, r.timeoutMs);
            case 3:
              c = e.v, e.n = 5;
              break;
            case 4:
              return e.p = 4, p = e.v, e.a(2, [qf({
                mode: "read",
                error: {
                  code: "upstream_unavailable",
                  message: "Hermes read endpoint unavailable.",
                  status: 503,
                  details: {
                    reason: "AbortError" === (null == p ? void 0 : p.name) ? "timeout" : "network_error"
                  }
                },
                meta: {
                  instanceId: r.instanceId
                }
              })]);
            case 5:
              return e.n = 6, Ff(c);
            case 6:
              if (l = e.v, c.ok) {
                e.n = 7;
                break;
              }
              return e.a(2, [qf({
                mode: "read",
                error: Df({
                  statusCode: c.status,
                  payload: l,
                  fallbackMessage: "Hermes read request failed with status ".concat(c.status, ".")
                }),
                meta: {
                  instanceId: r.instanceId,
                  requestId: null == l ? void 0 : l.requestId
                }
              })]);
            case 7:
              if (yf(l)) {
                e.n = 8;
                break;
              }
              return e.a(2, [qf({
                mode: "read",
                error: {
                  code: "validation_failed",
                  message: "Hermes read response must be an object.",
                  status: 502,
                  details: {
                    field: "response"
                  }
                },
                meta: {
                  instanceId: r.instanceId
                }
              })]);
            case 8:
              if ((f = Of(l.nextCursor)) && (o[sf.CURSOR] = f), 0 !== (s = Mf(l)).length) {
                e.n = 9;
                break;
              }
              return e.a(2, []);
            case 9:
              return d = Of(l.cursor), e.a(2, s.map(function (e) {
                var t;
                return Rf({
                  mode: "read",
                  data: {
                    schemaVersion: "string" == typeof l.schemaVersion ? l.schemaVersion : "v1",
                    event: e,
                    cursor: null !== (t = null != f ? f : d) && void 0 !== t ? t : e.cursor,
                    hasMore: !0 === l.hasMore
                  },
                  meta: {
                    instanceId: r.instanceId,
                    requestId: "string" == typeof l.requestId ? l.requestId : void 0
                  }
                });
              }));
          }
        }, e, null, [[2, 4]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }(),
    Yf = function () {
      var e = Hl(Ul().m(function e(t) {
        var n, r, o, a;
        return Ul().w(function (e) {
          for (;;) switch (e.n) {
            case 0:
              if (n = t.config, r = t._stream_cache, "poll" !== n.readTransport) {
                e.n = 1;
                break;
              }
              return Uf(r), e.a(2, Zf({
                config: n,
                _stream_cache: r
              }));
            case 1:
              if (!((o = Kf({
                config: n,
                _stream_cache: r
              })).outputs.length > 0)) {
                e.n = 2;
                break;
              }
              return e.a(2, o.outputs);
            case 2:
              if (!((a = Bf(r)).length > 0)) {
                e.n = 3;
                break;
              }
              return e.a(2, a);
            case 3:
              if ("auto" !== n.readTransport || !o.usePollFallback) {
                e.n = 4;
                break;
              }
              return e.a(2, Zf({
                config: n,
                _stream_cache: r
              }));
            case 4:
              return e.a(2, []);
          }
        }, e);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }();
  function es(e) {
    return es = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, es(e);
  }
  function ts(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function ns(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != es(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != es(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == es(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  var rs = {
      LAMBDA_OBJ: "_lambda_obj",
      REFNODE: "_refnode",
      RTCONTEXT: "_rtcontext",
      CTRLIN: "_ctrl_in",
      DATAIN: "_data_in",
      DOMAIN: "_domain",
      APPID: "_appid",
      http: {
        URI: "_http_uri",
        HEADER: "_http_header",
        REQUEST_TTL_CACHE: "_http_request_ttl_cache"
      },
      href: {
        URI: "_href_uri"
      },
      gnav: {
        EDGES: "_edges",
        BACKDROP: "_backdrop"
      },
      prompt: {
        UIDEFS: "_uidefs"
      },
      mediaplayer: {
        URI: "_uri"
      },
      sound: {
        CONFIG: "_sound_config",
        SOUNDSTAGE: "_daw_object"
      },
      html: {
        TEMPLATE: "_html_template"
      },
      hermes: sf
    },
    os = function os(e) {
      return arguments.length > 2 && void 0 !== arguments[2] && !arguments[2] ? e : re(arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "defaultio", e);
    },
    as = {
      mediaplayer: function mediaplayer(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = "uri" in t && "_default" in t.uri ? t.uri._default : void 0,
          a = {
            codebase: "ghostos/api/parser/nodelogic/elements/library/mediaplayer.js",
            refnode: e[rs.REFNODE]
          };
        return {
          leaflogic: function leaflogic(t, i) {
            var u,
              c = jp(i, t, void 0, a, {
                leaflogic: o,
                datalogic: {
                  post: function post(t) {
                    return e[rs.mediaplayer.URI] = t, t;
                  }
                }
              })._control,
              l = new r.BehaviorSubject(Ru),
              f = c._stream.pipe(r.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return Mu(e);
              }(u = t.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(u) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return Mu(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Mu(e, t) : void 0;
                }
              }(u) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.map)(function (e) {
                var t = e[1];
                return console.log("testing element _leaflogic: ", t), l.next(t), e[0];
              }));
            return {
              _stream: l,
              _control: {
                _stream: f
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(t) {
              return os({
                element: {
                  nodeuuid: e[rs.REFNODE],
                  type: "mediaplayer",
                  componentdata: Gu({
                    uri: e[rs.mediaplayer.URI]
                  }, e[rs.RTCONTEXT])
                }
              }, "screenio");
            }
          }
        };
      },
      http: function http(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = "uri" in t && "_default" in t.uri ? t.uri._default : void 0,
          a = "header" in t && "_default" in t.header ? t.header._default : void 0,
          i = {
            codebase: "ghostos/api/parser/nodelogic/elements/library/http.js",
            refnode: e[rs.REFNODE]
          },
          u = function () {
            var n = pl(il().m(function n(o) {
              var a,
                i,
                u,
                c,
                l,
                f,
                s,
                d,
                p,
                b,
                m,
                y,
                g,
                v,
                w,
                O = arguments;
              return il().w(function (n) {
                for (;;) switch (n.n) {
                  case 0:
                    return a = O.length > 1 && void 0 !== O[1] ? O[1] : {}, i = e[rs.http.URI], u = e[rs.http.HEADER], c = 1 === (c = o).length ? c[0] : c, l = ["uri", "post", "put", "get", "header", "?graph"], f = Object.keys(t), s = l.filter(function (e) {
                      return f.includes(e);
                    }), d = s.includes("post") ? "post" : s.includes("put") ? "put" : "get", "{*}" === i && h(c) && "http-request" === c._bname && (i = c._content.uri ? c._content.uri : "https://www.leafgon.com", u = c._content.header ? c._content.header : u, d = c._content.mode ? c._content.mode : d, c = c._content.data ? c._content.data : ""), p = rs.DOMAIN ? e[rs.DOMAIN] : void 0, b = rs.APPID ? e[rs.APPID] : void 0, m = s.includes("?graph") ? i + "?graph=".concat(p, "/").concat(b) : i, console.log("leafelement: http: _ctrl_in: ".concat(JSON.stringify(a))), y = void 0, a.some(function (e) {
                      return Object.values(e).some(function (e) {
                        var t;
                        return "object" === sl(e) && "leaf-nodejs" === (null === (t = e._label) || void 0 === t ? void 0 : t.provenance) && (console.log("leafelement: http: _ctrl_in originated from leafgon-nodejs, extracting cookies..."), y = e._content, !0);
                      });
                    }), g = function () {
                      var e = pl(il().m(function e() {
                        var t,
                          n,
                          o,
                          a,
                          i,
                          l,
                          f,
                          s,
                          d,
                          p,
                          b,
                          m = arguments;
                        return il().w(function (e) {
                          for (;;) switch (e.p = e.n) {
                            case 0:
                              if (n = (t = m.length > 0 && void 0 !== m[0] ? m[0] : {}).http_mode, o = t.uri, !["post", "put"].includes(n)) {
                                e.n = 5;
                                break;
                              }
                              return e.p = 1, a = o ? fetch(o, {
                                method: n.toUpperCase(),
                                mode: "cors",
                                headers: y ? ll(ll({}, u), {}, {
                                  Cookie: y
                                }) : ll({}, u),
                                credentials: "include",
                                body: JSON.stringify(c)
                              }) : (0, r.of)([{
                                data: "LEAF element error: http get request submitted with undefined URI"
                              }]), e.n = 2, a;
                            case 2:
                              return i = e.v, e.n = 3, i.json();
                            case 3:
                              return l = e.v, console.log(i), e.a(2, l);
                            case 4:
                              return e.p = 4, p = e.v, console.log(p), p.response ? (console.log(p.response.data), console.log(p.response.status), console.log(p.response.headers)) : p.request ? console.log(p.request) : console.log("Error", p.message), console.log(p.config), e.a(2, p.response);
                            case 5:
                              return e.p = 5, console.log("executing http get"), f = o ? fetch(o, {
                                method: "GET",
                                headers: ll(ll({}, u), {}, y ? {
                                  Accept: "application/json",
                                  Cookie: y
                                } : {
                                  Accept: "application/json"
                                }),
                                credentials: "include"
                              }) : (0, r.of)([{
                                data: "LEAF element error: http get request submitted with undefined URI"
                              }]), e.n = 6, f;
                            case 6:
                              return s = e.v, e.n = 7, s.json();
                            case 7:
                              return d = e.v, console.log(s), e.a(2, d);
                            case 8:
                              return e.p = 8, (b = e.v).response ? (console.error(b.response.data), console.log(b.response.status), console.log(b.response.headers)) : b.request ? console.log(b) : console.log("Error", b.message), console.log(b.config), e.a(2, b);
                            case 9:
                              return e.a(2);
                          }
                        }, e, null, [[5, 8], [1, 4]]);
                      }));
                      return function () {
                        return e.apply(this, arguments);
                      };
                    }(), v = G.throttle(pl(il().m(function e() {
                      return il().w(function (e) {
                        for (;;) switch (e.n) {
                          case 0:
                            return e.n = 1, g({
                              http_mode: d,
                              uri: m
                            });
                          case 1:
                            return e.a(2, e.v);
                        }
                      }, e);
                    })), 1e3), n.n = 1, v();
                  case 1:
                    return w = n.v, n.a(2, w);
                }
              }, n);
            }));
            return function (e) {
              return n.apply(this, arguments);
            };
          }();
        return {
          leaflogic: function leaflogic(t, c) {
            var l,
              f = new r.Subject(),
              s = o ? jp(c, t, void 0, i, {
                leaflogic: o,
                datalogic: {
                  post: function post(t) {
                    return e[rs.http.URI] = t, t;
                  }
                }
              }) : (e[rs.http.URI] = "{*}", {
                _stream: new r.BehaviorSubject("{*}"),
                _control: {
                  _stream: c._stream
                }
              }),
              d = a ? jp(c, t, void 0, i, {
                leaflogic: a,
                datalogic: {
                  post: function post(t) {
                    return e[rs.http.HEADER] = t, t;
                  }
                }
              }) : (e[rs.http.HEADER] = "", {
                _stream: new r.BehaviorSubject(""),
                _control: {
                  _stream: c._stream
                }
              }),
              p = (0, r.combineLatest)([s._control._stream, d._control._stream]),
              b = (0, r.combineLatest)([s._stream, d._stream]),
              m = p.pipe((0, n.withLatestFrom)(b), (0, n.map)(function (e) {
                return console.log(e), console.log("leafelement: http: controlflow$obj: ".concat(JSON.stringify(c._config), ", ctrl_data: ").concat(JSON.stringify(e[0]))), e[0];
              })),
              y = !1,
              g = m.pipe(n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return al(e);
              }(l = t.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(l) || ol(l) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.switchMap)(function (e) {
                return u(e.slice(1), e[0]);
              }), (0, n.map)(function (t) {
                return console.log("testing element _leaflogic: ", t), y = !0, (null == t ? void 0 : t.length) > 1 || !Array.isArray(t) ? f.next(t) : 1 === (null == t ? void 0 : t.length) && f.next(t[0]), e[rs.CTRLIN];
              }), (0, n.share)());
            return {
              _stream: f.pipe((0, n.filter)(function (e) {
                return y;
              }), (0, n.map)(function (e) {
                return console.log(e), e;
              }), (0, n.share)()),
              _control: {
                _stream: g.pipe((0, n.map)(function (e) {
                  return console.log(e), e;
                }), (0, n.share)())
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              var t = e,
                _n5 = function n(e) {
                  var t,
                    r = sl(e);
                  return "object" === r ? Array.isArray(e) ? e.map(function (e) {
                    return _n5(e);
                  }) : e ? Object.fromEntries(Object.entries(e).map(function (e) {
                    var t,
                      r,
                      o = (r = 2, function (e) {
                        if (Array.isArray(e)) return e;
                      }(t = e) || function (e, t) {
                        var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                        if (null != n) {
                          var r,
                            o,
                            a,
                            i,
                            u = [],
                            c = !0,
                            l = !1;
                          try {
                            if (a = (n = n.call(e)).next, 0 === t) {
                              if (Object(n) !== n) return;
                              c = !1;
                            } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                          } catch (e) {
                            l = !0, o = e;
                          } finally {
                            try {
                              if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                            } finally {
                              if (l) throw o;
                            }
                          }
                          return u;
                        }
                      }(t, r) || ol(t, r) || function () {
                        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                      }()),
                      a = o[0],
                      i = o[1];
                    return [a, _n5(i)];
                  })) : e : "string" === r ? (t = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                  }, e.replace(/[&<>"']/g, function (e) {
                    return t[e];
                  })) : e;
                };
              return os(null != t && t.name && "AxiosError" === t.name ? {
                error: t.message,
                data: t.response.data
              } : _n5(t), "elementio");
            }
          }
        };
      },
      gnav: function gnav(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = "elementio" in t,
          a = "edges" in t && "_default" in t.edges ? t.edges._default : void 0,
          i = "backdrop" in t && "_default" in t.backdrop ? t.backdrop._default : void 0,
          u = {
            codebase: "ghostos/api/parser/nodelogic/elements/library/gnav.js",
            refnode: e[rs.REFNODE]
          },
          c = {};
        return {
          leaflogic: function leaflogic(t, o) {
            c = o._config;
            var l,
              f = new r.Subject(),
              s = a ? jp(o, t, void 0, u, {
                leaflogic: a,
                datalogic: {
                  post: function post(t) {
                    return e[rs.gnav.EDGES] = t, t;
                  }
                }
              }) : {
                _stream: (0, r.of)([]),
                _control: o._stream
              },
              d = (i ? jp(s._control, t, void 0, u, {
                leaflogic: i,
                datalogic: {
                  post: function post(t) {
                    return e[rs.gnav.BACKDROP] = t, t;
                  }
                }
              }) : {
                _stream: (0, r.of)("/assets/test/hubbleinfrared_dark2.jpg"),
                _control: s._control
              })._control._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return nl(e);
              }(l = t.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(l) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return nl(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? nl(e, t) : void 0;
                }
              }(l) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.map)(function (e) {
                var t = e[1];
                return console.log("testing element _leaflogic: ", t), void 0 !== t && f.next(t), e[0];
              }));
            return {
              _stream: f,
              _control: {
                _stream: d
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return Array.isArray(e) ? e.map(function (e) {
                return oe("screenio", e);
              }).filter(function (e) {
                return e;
              }) : oe("screenio", e);
            },
            post: function post(n) {
              var a,
                i,
                u,
                l = n,
                f = (oe(e[rs.gnav.EDGES]) || []).map(function (e) {
                  return el(el({}, e), {}, {
                    uuid: (0, j.v4)()
                  });
                }),
                s = e[rs.gnav.BACKDROP],
                d = new r.BehaviorSubject(rl),
                p = os({
                  element: {
                    nodeuuid: e[rs.REFNODE],
                    type: "gnav",
                    componentdata: el({
                      graph_data: {
                        nodes: Array.isArray(l) ? l : [l],
                        edges: f
                      },
                      backdrop_url: s,
                      bgtagvectors: (u = Zc(Qc().m(function e() {
                        var n, r, o;
                        return Qc().w(function (e) {
                          for (;;) switch (e.n) {
                            case 0:
                              if (!(n = "tagvectors" in t && "_default" in t.tagvectors ? t.tagvectors._default : void 0)) {
                                e.n = 2;
                                break;
                              }
                              return e.n = 1, gp(n, [], el({}, c));
                            case 1:
                              o = e.v, e.n = 3;
                              break;
                            case 2:
                              o = [];
                            case 3:
                              return r = o, e.a(2, r);
                          }
                        }, e);
                      })), function () {
                        return u.apply(this, arguments);
                      }),
                      tagaction: (i = Zc(Qc().m(function n(r) {
                        var a, i, u;
                        return Qc().w(function (n) {
                          for (;;) switch (n.n) {
                            case 0:
                              if (!(a = "tagaction" in t && "_default" in t.tagaction ? t.tagaction._default : void 0)) {
                                n.n = 2;
                                break;
                              }
                              return n.n = 1, gp(a, r, el({}, c));
                            case 1:
                              u = n.v, n.n = 3;
                              break;
                            case 2:
                              u = r;
                            case 3:
                              return i = u, o && d.next(re("elementio", {
                                element: "gnav",
                                nodeuuid: e[rs.REFNODE],
                                io: {
                                  tagaction: i
                                }
                              })), n.a(2, i);
                          }
                        }, n);
                      })), function (e) {
                        return i.apply(this, arguments);
                      }),
                      blankaction: (a = Zc(Qc().m(function e(n) {
                        var r, o, a;
                        return Qc().w(function (e) {
                          for (;;) switch (e.n) {
                            case 0:
                              if (!(r = "blankaction" in t && "_default" in t.blankaction ? t.blankaction._default : void 0)) {
                                e.n = 2;
                                break;
                              }
                              return e.n = 1, gp(r, n, el({}, c));
                            case 1:
                              a = e.v, e.n = 3;
                              break;
                            case 2:
                              a = n;
                            case 3:
                              return o = a, e.a(2, o);
                          }
                        }, e);
                      })), function (e) {
                        return a.apply(this, arguments);
                      }),
                      graph_options: {
                        layout: "3d"
                      }
                    }, e[rs.RTCONTEXT])
                  }
                }, "screenio");
              return p;
            }
          }
        };
      },
      popup: function popup(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = new r.Subject(),
          a = new r.Subject();
        return {
          elementio$: a,
          leaflogic: function leaflogic(i, u) {
            var c,
              l = u._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return Zu(e);
              }(c = i.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(c) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return Zu(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Zu(e, t) : void 0;
                }
              }(c) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.switchMap)(function (e) {
                var t = new r.BehaviorSubject(e[0]),
                  n = new r.BehaviorSubject(e[1]);
                return (0, r.combineLatest)(t, (0, r.merge)(n, a));
              }), (0, n.switchMap)(function (n) {
                console.log("testing element _leaflogic: ", n);
                var i = n[1],
                  u = Object.keys(t),
                  c = ["headless", "jester", "top", "tt", "bottom", "bb", "left", "ll", "right", "rr", "topleft", "ttll", "topright", "ttrr", "bottomleft", "bbll", "bottomright", "bbrr", "center", "centre"].filter(function (e) {
                    return u.includes(e);
                  }),
                  l = c.length > 0 ? c[0] : void 0,
                  f = [i].flat().map(function (n) {
                    if (h(n)) {
                      if ("screenio" === n._bname) {
                        var r = oe("screenio", n);
                        return os({
                          element: {
                            nodeuuid: e[rs.REFNODE],
                            type: "popup",
                            componentdata: Ku({
                              poprect: l,
                              headless: "headless" in t,
                              ismenu: "jester" in t,
                              unmountCallback: (o = Hu().m(function n() {
                                var r, o, i;
                                return Hu().w(function (n) {
                                  for (;;) switch (n.n) {
                                    case 0:
                                      if (!(r = "onclose" in t && "_default" in t.onclose ? t.onclose._default : void 0)) {
                                        n.n = 2;
                                        break;
                                      }
                                      return n.n = 1, gp(r, [], Ku({}, e[rs.RTCONTEXT]._config));
                                    case 1:
                                      i = n.v, n.n = 3;
                                      break;
                                    case 2:
                                      i = [];
                                    case 3:
                                      return o = i, a.next(re("elementio", {
                                        element: "popup",
                                        nodeuuid: e[rs.REFNODE],
                                        io: {
                                          onclose: o
                                        }
                                      })), n.a(2, o);
                                  }
                                }, n);
                              }), i = function i() {
                                var e = this,
                                  t = arguments;
                                return new Promise(function (n, r) {
                                  var a = o.apply(e, t);
                                  function i(e) {
                                    Wu(a, n, r, i, u, "next", e);
                                  }
                                  function u(e) {
                                    Wu(a, n, r, i, u, "throw", e);
                                  }
                                  i(void 0);
                                });
                              }, function () {
                                return i.apply(this, arguments);
                              }),
                              children: Array.isArray(r) ? r : [r]
                            }, e[rs.RTCONTEXT])
                          }
                        }, "screenio");
                      }
                      return "elementio" === n._bname ? n : void 0;
                      var o, i;
                    }
                  }).filter(function (e) {
                    return e;
                  });
                return f.length > 1 ? o.next(f) : 1 === f.length && o.next(f[0]), (0, r.of)(n[0]);
              }));
            return {
              _stream: o.pipe((0, n.filter)(function (e) {
                return JSON.stringify(e) !== JSON.stringify(Yu);
              }), (0, n.map)(function (e) {
                return e;
              })),
              _control: {
                _stream: l
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              return e;
            }
          }
        };
      },
      image: function image(e) {
        return {
          leaflogic: function leaflogic(t, o) {
            var a,
              i = new r.Subject(),
              u = o._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return mc(e);
              }(a = t.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(a) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return mc(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? mc(e, t) : void 0;
                }
              }(a) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.map)(function (t) {
                e[rs.CTRLIN] = t[0];
                var n = t[1];
                return console.log("testing element _leaflogic: ", n), i.next(n), t[0];
              }));
            return {
              _stream: i,
              _control: {
                _stream: u
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              var t = [e].flat().map(function (e) {
                if (h(e) && "image" === e._bname) return oe("image", e);
              }).filter(function (e) {
                return e;
              });
              return 1 === t.length ? t[0] : t.length > 1 ? t : void 0;
            },
            post: function post(t) {
              return os({
                element: {
                  nodeuuid: e[rs.REFNODE],
                  type: "image",
                  componentdata: pc({
                    imagelist: Array.isArray(t) ? t : [t]
                  }, e[rs.RTCONTEXT])
                }
              }, "screenio");
            }
          }
        };
      },
      editor: function editor(e) {
        return {
          leaflogic: function leaflogic(t, o) {
            var a = new r.BehaviorSubject(ac),
              i = o._stream.pipe((0, n.concatMap)(function (n) {
                return e[rs.CTRLIN] = n, (0, r.combineLatest)(function (e) {
                  if (Array.isArray(e)) return oc(e);
                }(o = t.map(function (e) {
                  return e._stream;
                })) || function (e) {
                  if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                }(o) || function (e, t) {
                  if (e) {
                    if ("string" == typeof e) return oc(e, t);
                    var n = {}.toString.call(e).slice(8, -1);
                    return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? oc(e, t) : void 0;
                  }
                }(o) || function () {
                  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                }());
                var o;
              }), (0, n.map)(function (t) {
                return console.log("testing element _leaflogic: ", t), t.length > 1 ? a.next(t) : 1 === t.length && a.next(t[0]), e[rs.CTRLIN];
              }));
            return {
              _stream: a,
              _control: {
                _stream: i
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(t) {
              return os({
                element: {
                  nodeuuid: e[rs.REFNODE],
                  type: "editor",
                  componentdata: nc({
                    domain: e[rs.DOMAIN],
                    appid: e[rs.APPID]
                  }, e[rs.RTCONTEXT])
                }
              }, "screenio");
            }
          }
        };
      },
      text: function text(e) {
        var t = e[rs.LAMBDA_OBJ];
        return {
          leaflogic: function leaflogic(e, t) {
            var o,
              a = new r.Subject(),
              i = t._stream.pipe(n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return fc(e);
              }(o = e.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(o) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return fc(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? fc(e, t) : void 0;
                }
              }(o) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.map)(function (e) {
                var t = e[1];
                return console.log("testing element _leaflogic: ", t), a.next(t), e[0];
              }));
            return {
              _stream: a,
              _control: {
                _stream: i
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(n) {
              var r,
                o,
                a,
                i = "lambda" in t ? "lambda" : "dataflow",
                u = void 0;
              return h(n) && null !== (r = n._content) && void 0 !== r && null !== (r = r._provenance) && void 0 !== r && r.refnodedata ? (e[rs.RTCONTEXT].lambdarefnodedata = null === (o = n._content) || void 0 === o || null === (o = o._provenance) || void 0 === o ? void 0 : o.refnodedata, e[rs.RTCONTEXT].lambdasourceuuid = null === (a = n._content) || void 0 === a ? void 0 : a._refnode, u = n) : u = n, os({
                element: {
                  nodeuuid: e[rs.REFNODE],
                  type: "text",
                  componentdata: cc({
                    refnode: e[rs.REFNODE],
                    textsource: i,
                    lambdarefnodedata: e[rs.RTCONTEXT].lambdarefnodedata,
                    lambdasourceuuid: e[rs.RTCONTEXT].lambdasourceuuid,
                    dataflowinput: u,
                    domain: e[rs.DOMAIN],
                    appid: e[rs.APPID]
                  }, e[rs.RTCONTEXT])
                }
              }, "screenio");
            }
          }
        };
      },
      prompt: function prompt(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = "uidefs" in t && "_default" in t.uidefs ? t.uidefs._default : void 0,
          a = new r.Subject(),
          i = {
            codebase: "ghostos/api/parser/nodelogic/elements/library/prompt.js",
            refnode: e[rs.REFNODE]
          };
        return {
          elementio$: a,
          leaflogic: function leaflogic(u, c) {
            var l = new r.Subject(),
              f = o ? jp(c, u, void 0, i, {
                leaflogic: o,
                datalogic: {
                  post: function post(t) {
                    return e[rs.prompt.UIDEFS] = t, t;
                  }
                }
              }) : {
                _stream: (0, r.of)('[ ; an open square bracket [ denotes the beginning of a list, followed by a matching \n        ; close square bracket ] appearing at the end of this page. you can bring your blinking cursor\n        ; to one of the brackets and type Shift-5 (or %) to jump the cursor in between a pair of matching brackets. \n        ; please give it a go, it is a fun way to read any text written in LEAFlisp. \n        ; other helpful command keys to help you navigate LEAFlisp include h j k l with which the blinking cursor\n        ; can be moved to the left, down, up and right respectively. Also useful are w b respectively used to command\n        ; the cursor to move forward and backward by one word along the line. Shift-v can be used to select one line,\n        ; v to select from where the cursor currently is and navigating away from the initial cursor point by using\n        ; any mix of the navigation command keys, namely h j k l w and b would allow you to select any range of text of interest.\n        ; at which point you could either copy, delete and/or paste the selected text by respectively pressing y, d and p\n        ; pressing u would undo the changes you have made going back in time one change by one change as you repeat u in a series. \n        ; Ctrl-r would redo what had been undone. \n        ; using the command keys would require the editor to be in the "command" mode. pressing the escape key would put the editor \n        ; in the "command" mode, while pressing i would put the editor in the "edit" mode in which none of the navigation keys\n        ; would work as navigation commands but as entering respective alphabets instead. \n        ; \n        {\n          :prompt "setting"\n          :backgroundColor "primary.light" \n          ; "primary.dark" | "secondary.light" "secondary.dark"\n          :margin "1" \n          ; please note that any positive number in between quotes is accepted here.  \n          ; the recommended value however would range from 0 to 20 in almost all general \n          ; usage scenarios where 0 to 5 whould perhaps comprise about 90% of the cases. \n          :fieldWidth "45ch" \n          ; ch is a unit length represented in terms of the width of the letter 0 (zero).\n          ; so "15ch" would result in the width as wide as 15 zeros for all the text inputs below. \n          ; please refer to the following site for units in html/css lingo, if you have all the time in the world.\n          ; https://www.w3schools.com/cssref/css_units.asp for units\n          :buttonWidth "20ch"\n          ; likewise, buttonWidth specifies the width of all the buttons declared below. \n        }\n        {\n          :prompt "text"\n          :key "maintext1" ; :key is a user-defined string value, that should be unique within the context of the UI definition.\n          :label "LEAF newsletter mailing list" ; a user-defined string label to be displayed on the text input.\n          :variant "outlined" ; a text :variant with a choice of "standard", "outlined", or "filled" as its style.\n          :multiline true\n          :rows "2"\n          :InputProps {:readOnly true}\n          :defaultValue "Please fill out the info and subscribe to the mailing list."\n        }\n        {\n          :prompt "text"\n          ;:key (get (get (get (get uinodes 1) :meta) :label) :id) ; :key is a user-defined string value, that should be unique within the context of the UI definition.\n          :key "name" ; :key is a user-defined string value, that should be unique within the context of the UI definition.\n          ;:id (get (get (get (get uinodes 1) :meta) :label) :id)\n          :fieldWidth "25ch" \n          :required true ;true\n          :group 1\n          :label "Your name" ;(get (get (get (get uinodes 1) :meta) :label) :text); a user-defined string label to be displayed on the text input.\n          :variant "standard" ; a text :variant with a choice of "standard", "outlined", or "filled" as its style.\n        }\n        {\n          :prompt "text"\n          :key "email"\n          :fieldWidth "25ch" \n          :required true\n          :label "Your email"\n          :type "email"\n          :variant "standard"\n        }\n        { \n          :prompt "button"\n          :color "secondary" \n          ; the value can be of "primary", "secondary", "error", "warning", "info", "success"\n          :variant "outlined"\n          ; the value can be of "text", "contained", "outlined"\n          :key "subscribebtn"\n          ; :href "/editor/breezyforest/main"\n          ; :href can support a relative path\n          :label "Subscribe"\n        }\n      ]'),
                _control: {
                  _stream: c._stream
                }
              },
              s = f._control._stream.pipe((0, n.withLatestFrom)(f._stream), (0, n.switchMap)(function (n) {
                var o = n[1];
                e[rs.CTRLIN] = n[0];
                var i = t.margin ? Object.keys(t.margin) : void 0,
                  u = t.fieldwidth ? Object.keys(t.fieldwidth) : void 0,
                  c = h(o) && "error" === o._bname ? void 0 : Array.isArray(o) ? os({
                    element: {
                      nodeuuid: e[rs.REFNODE],
                      type: "prompt",
                      componentdata: $u({
                        nodeuuid: e[rs.REFNODE],
                        uidefs: o,
                        margin: i ? i[0] : 1,
                        fieldwidth: u ? u[0] : "25ch"
                      }, e[rs.RTCONTEXT])
                    }
                  }, "screenio") : void 0;
                return c ? (0, r.merge)((0, r.of)(c), a) : a;
              }), (0, n.map)(function (t) {
                return console.log("testing element _leaflogic: ", t), l.next(t), e[rs.CTRLIN];
              }), (0, n.share)());
            return {
              _stream: l.pipe((0, n.filter)(function (e) {
                return JSON.stringify($u($u({}, e), {}, {
                  _label: {}
                })) !== JSON.stringify(Bu);
              }), (0, n.map)(function (e) {
                return console.log(e), e;
              }), (0, n.share)()),
              _control: {
                _stream: s.pipe((0, n.map)(function (e) {
                  return console.log(e), e;
                }), (0, n.share)())
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              return e;
            }
          }
        };
      },
      mediainput: function mediainput(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = new r.Subject();
        return {
          elementio$: o,
          leaflogic: function leaflogic(a, i) {
            var u,
              c = new r.Subject(),
              l = i._stream.pipe(r.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return hc(e);
              }(u = a.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(u) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return hc(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? hc(e, t) : void 0;
                }
              }(u) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.switchMap)(function (n) {
                e[rs.CTRLIN] = n[0];
                var a = n[1],
                  i = Object.keys(t),
                  u = ["image", "audio", "video"].filter(function (e) {
                    return i.includes(e);
                  }),
                  c = u.length > 0 ? u[0] : "image",
                  l = a;
                l = 1 === l.length ? l[0] : l;
                var f,
                  s,
                  d = Array.isArray(l) ? l : [l],
                  p = os({
                    element: {
                      nodeuuid: e[rs.REFNODE],
                      type: "mediainput",
                      componentdata: {
                        mediatype: c,
                        nodeinput: d,
                        callbacks: {
                          onDropAccepted: (f = yc().m(function n(r) {
                            var a, i, u;
                            return yc().w(function (n) {
                              for (;;) switch (n.n) {
                                case 0:
                                  if (null === (a = t.ondrop) || void 0 === a || !a._default) {
                                    n.n = 2;
                                    break;
                                  }
                                  return n.n = 1, gp(t.ondrop._default, [re("elementinput", r), re("nodeinput", d)], {}, e[rs.REFNODE]);
                                case 1:
                                  u = n.v, n.n = 3;
                                  break;
                                case 2:
                                  u = void 0;
                                case 3:
                                  i = re("elementio", u), o.next(i), console.log("start debugging");
                                case 4:
                                  return n.a(2);
                              }
                            }, n);
                          }), s = function s() {
                            var e = this,
                              t = arguments;
                            return new Promise(function (n, r) {
                              var o = f.apply(e, t);
                              function a(e) {
                                vc(o, n, r, a, i, "next", e);
                              }
                              function i(e) {
                                vc(o, n, r, a, i, "throw", e);
                              }
                              a(void 0);
                            });
                          }, function (e) {
                            return s.apply(this, arguments);
                          })
                        }
                      }
                    }
                  }, "screenio");
                return p ? (0, r.merge)(new r.BehaviorSubject(p), o) : o;
              }), (0, n.switchMap)(function (t) {
                return console.log("testing element _leaflogic: ", t), c.next(t), new r.BehaviorSubject(e[rs.CTRLIN]);
              }), (0, n.share)());
            return {
              _stream: c.pipe((0, n.map)(function (e) {
                return e;
              }), (0, n.finalize)(function () {
                console.log("mediainput element data stream ended");
              }), (0, n.share)()),
              _control: {
                _stream: l.pipe((0, n.map)(function (e) {
                  return e;
                }), (0, n.finalize)(function () {
                  console.log("mediainput element ctrl stream ended");
                }), (0, n.share)())
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              var t = e;
              return 1 === t.length ? t[0] : t;
            }
          }
        };
      },
      midi: function midi(e) {
        var t = new r.Subject(),
          o = -1,
          a = function a(e) {
            0 == (o = (o + 1) % 24) && console.log("beat", Date.now(), e), console.log("midiMessageReceived", Date.now(), e);
            var n,
              r,
              a = (r = 3, function (e) {
                if (Array.isArray(e)) return e;
              }(n = e) || function (e, t) {
                var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                if (null != n) {
                  var r,
                    o,
                    a,
                    i,
                    u = [],
                    c = !0,
                    l = !1;
                  try {
                    if (a = (n = n.call(e)).next, 0 === t) {
                      if (Object(n) !== n) return;
                      c = !1;
                    } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                  } catch (e) {
                    l = !0, o = e;
                  } finally {
                    try {
                      if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                    } finally {
                      if (l) throw o;
                    }
                  }
                  return u;
                }
              }(n, r) || wc(n, r) || function () {
                throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()),
              i = a[0],
              u = a[1],
              c = a[2];
            t.next(re("_midi_in", {
              cmd: i,
              noteNumber: u,
              velocity: c
            }, {
              timestamp: Date.now()
            }));
          },
          i = {};
        return {
          leaflogic: function leaflogic(o, u) {
            var c = new r.Subject(),
              l = u._stream.pipe((0, n.switchMap)(function (n) {
                return e[rs.CTRLIN] = n, "default" in i || (i["default"] = _c().openMidiIn().or("Error: Cannot open MIDI In port").and(function (e) {
                  console.log("MIDI-In: ", e);
                }).connect(a)), r.merge.apply(void 0, (u = o.map(function (e) {
                  return e._stream;
                }), function (e) {
                  if (Array.isArray(e)) return Oc(e);
                }(u) || function (e) {
                  if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
                }(u) || wc(u) || function () {
                  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                }()).concat([t]));
                var u;
              }), (0, n.map)(function (t) {
                Array.isArray(t) || "error" !== t._bname || console.log("start debugging");
                var n = (Array.isArray(t) ? t : [t]).map(function (e) {
                  return "_data_in" === e._bname ? O(e._content) ? void 0 : oe("*", e) : h(e) ? e : void 0;
                }).filter(function (e) {
                  return e;
                });
                return console.log("midi message to be registered in nodeflowinterface", t), n.length > 0 && c.next(n), e[rs.CTRLIN];
              }), (0, n.share)());
            return {
              _stream: c,
              _control: {
                _stream: l
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return re("_data_in", e);
            },
            post: function post(e) {
              var t = e;
              return 1 === t.length ? t[0] : t;
            }
          }
        };
      },
      sound: function sound(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = "_default" in t ? t._default : void 0,
          a = "instrument" in t || "inst" in t,
          i = "source" in t || "src" in t,
          u = "effect" in t || "fx" in t,
          c = "target" in t || "trg" in t,
          l = {
            codebase: "ghostos/api/parser/nodelogic/elements/library/sound.js",
            refnode: e[rs.REFNODE]
          },
          f = re("accio", "data_accio");
        (o ? gp(o, f, {}, l.refnode) : Promise.resolve({
          audionode: {
            type: "gain",
            value: .5
          },
          source: {
            type: "oscillator",
            options: {
              type: "sine"
            }
          },
          timing: {
            bpm: 150
          },
          instrument: {
            type: "polysynth",
            voice: "synth",
            options: {}
          }
        })).then(function (t) {
          e[rs.sound.CONFIG] = t;
        });
        var s = function s() {
          var t,
            n,
            r = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0;
          r ? (t = oe("soundconfig", r), e[rs.sound.CONFIG] = t) : t = e[rs.sound.CONFIG], n = a ? function (e, t) {
            var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
            try {
              var r;
              if (null != t && t.instrument) return n ? (globalThis.sound[e].set(t.instrument.options), globalThis.sound[e]) : null === (r = Dc[t.instrument.type]) || void 0 === r ? void 0 : r["new"](t.instrument.voice ? Gc[t.instrument.voice] : Sc.Synth, t.instrument.options);
              throw "instrument is not defined in the config";
            } catch (t) {
              return void console.error("LEAF Error: a leafsound element ".concat(e, " could not be configured, returning error:"), t);
            }
          }(e[rs.REFNODE], t) : i ? void 0 : u ? Mc(e[rs.REFNODE], t, void 0 !== e[rs.sound.SOUNDSTAGE]) : Mc(e[rs.REFNODE], t), e[rs.sound.SOUNDSTAGE] = n, function (e, t) {
            globalThis.sound[e] = t;
          }(e[rs.REFNODE], n);
        };
        return {
          leaflogic: function leaflogic(t, o) {
            var a,
              i = new r.BehaviorSubject(void 0),
              u = o._stream.pipe((0, n.map)(function (t) {
                return e[rs.CTRLIN] = t, t;
              }), n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return $c(e);
              }(a = t.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(a) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return $c(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? $c(e, t) : void 0;
                }
              }(a) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.map)(function (t) {
                var n = t.slice(1).flat().map(function (t) {
                  if ("_data_in" === t._bname) return oe("*", t);
                  if ("_midi_in" === t._bname) return t;
                  if ("soundconfig" === t._bname) s(t);else if ("soundinit" === t._bname) return function () {
                    var t,
                      n,
                      r,
                      o = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0;
                    if (o) {
                      console.log("_ibottle:", o, e[rs.REFNODE]);
                      var a = o._content.soundnode_trail.slice(-1)[0],
                        i = e[rs.REFNODE];
                      c ? (r = a, globalThis.sound[r].toDestination()) : a && i && (t = a, n = i, globalThis.sound[t].connect(globalThis.sound[n]));
                    }
                    return Bc(Bc({}, o), {}, {
                      _content: {
                        soundnode_trail: o._content.soundnode_trail.concat(e[rs.REFNODE])
                      }
                    });
                  }(t);
                }).filter(function (e) {
                  return e;
                });
                return n.length > 0 && i.next(n), e[rs.CTRLIN];
              }), (0, n.share)());
            return {
              _stream: i.pipe((0, n.filter)(function (e) {
                return e;
              })),
              _control: {
                _stream: u
              }
            };
          },
          datalogic: {
            pre: function pre(t) {
              var n = t;
              return e[rs.sound.SOUNDSTAGE] || c || s(), c && "started" !== jc.Transport.state && (jc.start(), jc.Transport.start()), n;
            },
            post: function post(t) {
              Array.isArray(t) || console.log("start debugging");
              var n = t.map(function (t) {
                if ("_midi_in" === t._bname) {
                  console.log(t._content);
                  var n = e[rs.sound.SOUNDSTAGE];
                  if (t._content.velocity > 0) {
                    var r = Vc(t._content.noteNumber),
                      o = t._content.duration;
                    o ? n.triggerAttackRelease(r, o) : n.triggerAttack(r);
                  } else {
                    var a = Vc(t._content.noteNumber);
                    console.log("daw stop() ", a), n.triggerRelease(a);
                  }
                  return ae;
                }
                return t;
              });
              return 1 === n.length ? n[0] : n;
            }
          }
        };
      },
      html: function html(e) {
        var t = new r.Subject(),
          o = new r.Subject(),
          a = new r.Subject(),
          i = e[rs.LAMBDA_OBJ],
          u = "_default" in i ? i._default : void 0,
          c = Tl({
            codebase: "ghostos/api/parser/nodelogic/elements/library/html.js"
          }, e),
          l = re("accio", "ctrl_accio"),
          f = re("accio", "data_accio"),
          s = u ? jp({
            _stream: (0, r.of)(l)
          }, [{
            _stream: (0, r.of)(f)
          }], void 0, c, {
            leaflogic: u,
            datalogic: {
              post: function post(e) {
                return e;
              }
            }
          }) : {
            _stream: (0, r.of)(""),
            _control: {
              _stream: (0, r.of)(l)
            }
          };
        return e[rs.html.TEMPLATE] = void 0, (0, r.firstValueFrom)(s._control._stream.pipe((0, n.withLatestFrom)(s._stream))).then(function (t) {
          var n = Sl(t[1]);
          if ("string" === n) e[rs.html.TEMPLATE] = {
            _default: hl.compile(t[1])
          };else if ("object" === n) {
            var r = {};
            Object.entries(t[1]).map(function (e) {
              var t = Ol(e, 2),
                n = t[0],
                o = [t[1]].flat().map(function (e) {
                  if ("string" == typeof e) return e;
                }).filter(function (e) {
                  return void 0 !== e;
                }).join("\n");
              "" !== o && (r[n] = hl.compile(o));
            }), Object.keys(r).length > 0 && (e[rs.html.TEMPLATE] = r);
          }
          hl.registerHelper("markdown", function (e) {
            e = (e = (e = (e = (e = (e = e.replace(/&gt;/gm, ">")).replace(/&lt;/gm, "<")).replace(/&amp;/gm, "&")).replace(/(\r\n|\n|\r)/gm, "\n")).replace(/\\&quot;/gm, '\\"')).replace(/&quot;/gm, '"');
            var t = _.Buffer.from(e).toString("base64");
            return "atob('".concat(t, "')");
          }), hl.registerHelper("json", function (e) {
            var t = _.Buffer.from(JSON.stringify(e, function e(t, n) {
              var r = Sl(n);
              if ("string" === r) {
                var o = n.match(/^\{((?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|))\}$/);
                return null !== o ? Number(o[1]) : n;
              }
              return "object" === r ? Array.isArray(n) ? n.map(function (t, n) {
                return e(0, t);
              }) : Object.assign.apply(Object, [{}].concat(wl(Object.entries(n).map(function (t) {
                var n = Ol(t, 2),
                  r = n[0];
                return El({}, r, e(0, n[1]));
              })))) : n;
            })).toString("base64");
            return "JSON.parse(atob('".concat(t, "'))");
          }), hl.registerHelper("tostring", function (e) {
            return String(e);
          }), a.next();
        }), {
          elementio$: o,
          leaflogic: function leaflogic(i, u) {
            var c = u._stream.pipe(n.withLatestFrom.apply(void 0, wl(i.map(function (e) {
              return e._stream;
            }))), (0, n.switchMap)(function (t) {
              var i = new r.BehaviorSubject(t[0]),
                u = new r.BehaviorSubject(t[1]);
              return e[rs.html.TEMPLATE] ? (0, r.combineLatest)(i, (0, r.merge)(u, o)) : a.pipe((0, n.withLatestFrom)(i, (0, r.merge)(u, o)), (0, n.map)(function (e) {
                return e[1];
              }));
            }), (0, n.map)(function (n) {
              var r = e[rs.html.TEMPLATE],
                a = n[1];
              if (console.log("testing element _leaflogic: ", a), h(a) && "elementio" === a._bname) return t.next(a), n[0];
              if (void 0 !== r) {
                var i = function (e, t) {
                    if (void 0 !== t) {
                      var n = Object.keys(t);
                      return (1 === n.length && n.includes("_default") ? [t._default(Object.assign.apply(Object, [{}].concat(wl([e].flat().map(function (e) {
                        return oe("*", e);
                      })))))] : [e].flat().sort(function (e, t) {
                        var n,
                          r,
                          o = null === (n = e._label) || void 0 === n || null === (n = n.tag) || void 0 === n ? void 0 : n.toLowerCase(),
                          a = null === (r = t._label) || void 0 === r || null === (r = r.tag) || void 0 === r ? void 0 : r.toLowerCase();
                        return o > a ? 1 : o < a ? -1 : 0;
                      }).map(function (e) {
                        if (h(e)) {
                          var n = oe("*", e),
                            r = e._bname;
                          return [n].flat().map(function (e) {
                            return e && r in t ? t[r](e) : e && "_default" in t ? t._default(e) : "string" == typeof e ? e : void 0;
                          }).filter(function (e) {
                            return void 0 !== e;
                          }).join("\n");
                        }
                      }).filter(function (e) {
                        return void 0 !== e;
                      })).join("\n").replace(/(\r\n|\n|\r)/gm, "");
                    }
                    return e;
                  }(a, r),
                  u = os({
                    element: {
                      nodeuuid: e[rs.REFNODE],
                      type: "html",
                      componentdata: Tl({
                        innerhtml: i,
                        callback: function callback(e) {
                          o.next(re("elementio", e));
                        }
                      }, e[rs.RTCONTEXT])
                    }
                  }, "screenio");
                return t.next(u), n[0];
              }
            }), (0, n.filter)(function (e) {
              return void 0 !== e;
            }));
            return {
              _stream: t,
              _control: {
                _stream: c
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              return e;
            }
          }
        };
      },
      href: function href(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = "uri" in t && "_default" in t.uri ? t.uri._default : void 0,
          a = {
            codebase: "ghostos/api/parser/nodelogic/elements/library/href.js",
            refnode: e[rs.REFNODE]
          },
          i = function () {
            var t = vl(ml().m(function t(n) {
              var r, o, a, i, u, c;
              return ml().w(function (t) {
                for (;;) switch (t.n) {
                  case 0:
                    return r = e[rs.href.URI], o = 1 === (o = n).length ? o[0] : o, "{*}" === r && h(o) && "href-request" === o._bname && (r = o._content.uri ? o._content.uri : "https://www.leafgon.com", o = o._content.data ? o._content.data : ""), a = r, i = function () {
                      var e = vl(ml().m(function e() {
                        var t,
                          n,
                          r = arguments;
                        return ml().w(function (e) {
                          for (;;) switch (e.p = e.n) {
                            case 0:
                              return t = (r.length > 0 && void 0 !== r[0] ? r[0] : {}).uri, e.p = 1, console.log("executing href request"), "undefined" != typeof window && window.location.href.slice(-t.length) !== t && (window.location.href = t), e.a(2, t);
                            case 2:
                              return e.p = 2, n = e.v, console.log(n), e.a(2, n);
                          }
                        }, e, null, [[1, 2]]);
                      }));
                      return function () {
                        return e.apply(this, arguments);
                      };
                    }(), u = G.throttle(vl(ml().m(function e() {
                      return ml().w(function (e) {
                        for (;;) switch (e.n) {
                          case 0:
                            return e.n = 1, i({
                              uri: a
                            });
                          case 1:
                            return e.a(2, e.v);
                        }
                      }, e);
                    })), 1e3), t.n = 1, u();
                  case 1:
                    return c = t.v, t.a(2, c);
                }
              }, t);
            }));
            return function (e) {
              return t.apply(this, arguments);
            };
          }();
        return {
          leaflogic: function leaflogic(t, u) {
            var c,
              l = new r.Subject(),
              f = o ? jp(u, t, void 0, a, {
                leaflogic: o,
                datalogic: {
                  post: function post(t) {
                    return e[rs.href.URI] = t, t;
                  }
                }
              }) : (e[rs.href.URI] = "{*}", {
                _stream: new r.BehaviorSubject("{*}"),
                _control: {
                  _stream: u._stream
                }
              }),
              s = f._control._stream,
              d = f._stream,
              p = s.pipe((0, n.withLatestFrom)(d), (0, n.map)(function (e) {
                return console.log(e), e[0];
              })),
              b = !1,
              m = p.pipe(n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return bl(e);
              }(c = t.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(c) || function (e, t) {
                if (e) {
                  if ("string" == typeof e) return bl(e, t);
                  var n = {}.toString.call(e).slice(8, -1);
                  return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? bl(e, t) : void 0;
                }
              }(c) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.switchMap)(function (e) {
                return i(e.slice(1));
              }), (0, n.map)(function (t) {
                return console.log("testing element _leaflogic: ", t), b = !0, (null == t ? void 0 : t.length) > 1 || !Array.isArray(t) ? l.next(t) : 1 === (null == t ? void 0 : t.length) && l.next(t[0]), e[rs.CTRLIN];
              }), (0, n.share)());
            return {
              _stream: l.pipe((0, n.filter)(function (e) {
                return b;
              }), (0, n.map)(function (e) {
                return console.log(e), e;
              }), (0, n.share)()),
              _control: {
                _stream: m.pipe((0, n.map)(function (e) {
                  return console.log(e), e;
                }), (0, n.share)())
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            }
          }
        };
      },
      form: function form(e) {
        var t = new r.Subject(),
          o = new r.Subject(),
          a = new r.Subject(),
          i = e[rs.LAMBDA_OBJ],
          u = "_default" in i ? i._default : void 0,
          c = "single" in i,
          l = function (e) {
            for (var t = 1; t < arguments.length; t++) {
              var n = null != arguments[t] ? arguments[t] : {};
              t % 2 ? Il(Object(n), !0).forEach(function (t) {
                Ll(e, t, n[t]);
              }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Il(Object(n)).forEach(function (t) {
                Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
              });
            }
            return e;
          }({
            codebase: "ghostos/api/parser/nodelogic/elements/library/form.js"
          }, e),
          f = re("accio", "ctrl_accio"),
          s = re("accio", "data_accio"),
          d = u ? jp({
            _stream: (0, r.of)(f)
          }, [{
            _stream: (0, r.of)(s)
          }], void 0, l, {
            leaflogic: u,
            datalogic: {
              post: function post(e) {
                return e;
              }
            }
          }) : {
            _stream: (0, r.of)(""),
            _control: {
              _stream: (0, r.of)(f)
            }
          };
        return e[rs.html.TEMPLATE] = void 0, (0, r.firstValueFrom)(d._control._stream.pipe((0, n.withLatestFrom)(d._stream))).then(function (t) {
          var n = Fl(t[1]);
          if ("string" === n) e[rs.html.TEMPLATE] = {
            _default: hl.compile(t[1])
          };else if ("object" === n) {
            var r = {};
            Object.entries(t[1]).map(function (e) {
              var t = Al(e, 2),
                n = t[0],
                o = [t[1]].flat().map(function (e) {
                  if ("string" == typeof e) return e;
                }).filter(function (e) {
                  return void 0 !== e;
                }).join("\n");
              "" !== o && (r[n] = hl.compile(o));
            }), Object.keys(r).length > 0 && (e[rs.html.TEMPLATE] = r);
          }
          hl.registerHelper("json", function (e) {
            return JSON.stringify(e, function e(t, n) {
              var r = Fl(n);
              if ("string" === r) {
                var o = n.match(/^\{((?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|))\}$/);
                return null !== o ? Number(o[1]) : n;
              }
              return "object" === r ? Array.isArray(n) ? n.map(function (t, n) {
                return e(0, t);
              }) : Object.assign.apply(Object, [{}].concat(Pl(Object.entries(n).map(function (t) {
                var n = Al(t, 2),
                  r = n[0];
                return Ll({}, r, e(0, n[1]));
              })))) : n;
            });
          }), a.next();
        }), {
          elementio$: o,
          leaflogic: function leaflogic(i, u) {
            var l = u._stream.pipe(n.withLatestFrom.apply(void 0, Pl(i.map(function (e) {
              return e._stream;
            }))), (0, n.switchMap)(function (t) {
              var i = new r.BehaviorSubject(t[0]),
                u = new r.BehaviorSubject(t[1]);
              return e[rs.html.TEMPLATE] ? (0, r.combineLatest)(i, (0, r.merge)(u, o)) : a.pipe((0, n.withLatestFrom)(i, (0, r.merge)(u, o)), (0, n.map)(function (e) {
                return e[1];
              }));
            }), (0, n.map)(function (n) {
              var r,
                o,
                a,
                i,
                u,
                l,
                f,
                s = e[rs.html.TEMPLATE],
                d = n[1];
              if (console.log("testing element _leaflogic: ", d), h(d) && "elementio" === d._bname) return t.next(d), n[0];
              if (void 0 !== s) {
                var p = (r = "\n        <script type='text/babel'>\n            const Form = JSONSchemaForm.default;\n            const schema = {\n                title: 'react-jsonschema-form demo',\n                type: 'object',\n                required: ['name', 'email'],\n                properties: {\n                    name: {type: 'string', minLength: 3},\n                    email: {type: 'string'},\n                    dob: {type: 'string'},\n                    age: {type: 'number'},\n                    thing: {type: 'string'},\n                    other: {type: 'string'},\n                }\n            };\n            const uiSchema = {\n                email: {\n                    'ui:options': {\n                        inputType: 'email'\n                    }\n                },\n                dob: {\n                    'ui:widget': 'alt-date',\n                    'ui:options': {\n                        yearsRange: [1980, 2030],\n                        hideNowButton: true,\n                        hideClearButton: true,\n                    },\n                },\n            };\n        \n            function Tpl(props) {\n                const {id, label, required, children} = props;\n                return (\n                <div className='myfield'>\n                    <label htmlFor={id}>{label}{required ? '*' : null}</label>\n                    {children}\n                </div>\n                );\n            };\n\n            function dosubmit({ formData }, e) {\n                doelementio({_bname: '".concat(e[rs.REFNODE].slice(0, 8), "', _content: formData, _label: {refnode: '").concat(e[rs.REFNODE], "'}});\n            };\n\n            function SubmitButton(props) {\n                const { uiSchema } = props;\n                return (\n                  <button type='submit'>\n                    Yadda\n                  </button>\n                );\n              }\n        \n            ReactDOM.render(\n                (<Form onSubmit={dosubmit} className='row' schema={schema} uiSchema={uiSchema} FieldTemplate={Tpl} liveValidate >\n                <div style={{marginBottom: '70px'}}>\n                  <button className='unicornbutton' type='submit'>\n                    Yadda\n                  </button>\n                </div>\n                </Form>\n                ),\n                document.getElementById('").concat(e[rs.REFNODE], "')\n            );\n        <\/script>\n        "), o = "\n        <div id='".concat(e[rs.REFNODE], "'></div>\n        "), a = function a(e) {
                  return e.replace(/(\r\n|\n|\r)/gm, "").replace(/(\s+)/gm, " ");
                }, i = e[rs.REFNODE].slice(0, 8), u = c ? "form-style" : "form-style-" + i, l = c ? "form-script" : "form-script-" + i, f = c ? "form-body" : "form-body-" + i, re(i, Ll(Ll(Ll({
                  "form-common": a("\n        \x3c!-- Bootstrap core CSS --\x3e\n        <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' rel='stylesheet' integrity='sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH' crossorigin='anonymous'>\n        <script crossorigin src='https://unpkg.com/react@17.0.2/umd/react.development.js'><\/script>\n        <script crossorigin src='https://unpkg.com/react-dom@17.0.2/umd/react-dom.development.js'><\/script>\n        <script src='https://unpkg.com/@babel/standalone@7.23.10/babel.min.js'><\/script>\n        <script src='https://unpkg.com/@rjsf/core@4.2.3/dist/react-jsonschema-form.js'><\/script>\n        ")
                }, u, a("\n        <style>\n            .unicornbutton {\n                background-image: url('https://leas3.ams3.cdn.digitaloceanspaces.com/static/lax/assets/button-bg.jpg');\n                width: 250px;\n                height: 70px;\n                background-size: 160px;\n                color: white;\n                font-weight: 800;\n                text-align: center;\n                line-height: 70px;\n                font-size: 30px;\n                text-decoration: none;\n                border-radius: 20px;\n                z-index: 100;\n                pointer-events: all;\n                cursor: pointer;\n            }\n        </style>\n        ")), l, a(r)), f, a(o)), {
                  uuid: e[rs.REFNODE]
                }));
                return t.next(p), n[0];
              }
            }), (0, n.filter)(function (e) {
              return void 0 !== e;
            }));
            return {
              _stream: t,
              _control: {
                _stream: l
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              return e;
            }
          }
        };
      },
      directus: function directus(e) {
        var t = e[rs.LAMBDA_OBJ],
          o = "uri" in t && "_default" in t.uri ? t.uri._default : void 0,
          a = "header" in t && "_default" in t.header ? t.header._default : void 0,
          i = function () {
            var n = Jl(Ml().m(function n(o) {
              var a, i, u, c, l, f, s, d, p;
              return Ml().w(function (n) {
                for (;;) switch (n.n) {
                  case 0:
                    return a = e[rs.http.HEADER], i = 1 === (i = o).length ? i[0] : i, u = ["uri", "post", "put", "get", "header", "?graph"], c = Object.keys(t), l = u.filter(function (e) {
                      return c.includes(e);
                    }), f = function () {
                      var e = Jl(Ml().m(function e() {
                        var t,
                          n,
                          o,
                          u,
                          c,
                          f,
                          s,
                          d,
                          p,
                          b = arguments;
                        return Ml().w(function (e) {
                          for (;;) switch (e.p = e.n) {
                            case 0:
                              if (n = (t = b.length > 0 && void 0 !== b[0] ? b[0] : {}).http_mode, o = t.uri, !["post", "put"].includes(n)) {
                                e.n = 4;
                                break;
                              }
                              return null != a && a.X_CSRF_Token && (Iu.defaults.headers.post["X-CSRF-Token"] = a.X_CSRF_Token), e.p = 1, console.log(i), u = l.includes("put") ? Iu.put(o, i) : Iu.post(o, i), e.n = 2, u;
                            case 2:
                              return c = e.v, console.log(c), e.a(2, c);
                            case 3:
                              return e.p = 3, d = e.v, console.log(d), d.response ? (console.log(d.response.data), console.log(d.response.status), console.log(d.response.headers)) : d.request ? console.log(d.request) : console.log("Error", d.message), console.log(d.config), e.a(2, d.response);
                            case 4:
                              return e.p = 4, console.log("executing http get"), f = o ? Iu.get(o) : (0, r.of)([{
                                data: "LEAF element error: http get request submitted with undefined URI"
                              }]), e.n = 5, f;
                            case 5:
                              return s = e.v, console.log(s), e.a(2, s.data);
                            case 6:
                              return e.p = 6, (p = e.v).response ? (console.error(p.response.data), console.log(p.response.status), console.log(p.response.headers)) : p.request ? console.log(p) : console.log("Error", p.message), console.log(p.config), e.a(2, p);
                            case 7:
                              return e.a(2);
                          }
                        }, e, null, [[4, 6], [1, 3]]);
                      }));
                      return function () {
                        return e.apply(this, arguments);
                      };
                    }(), s = l.includes("post") ? "post" : l.includes("put") ? "put" : "get", d = G.throttle(Jl(Ml().m(function e() {
                      return Ml().w(function (e) {
                        for (;;) switch (e.n) {
                          case 0:
                            return e.n = 1, f({
                              http_mode: s,
                              uri: "localhost:51054"
                            });
                          case 1:
                            return e.a(2, e.v);
                        }
                      }, e);
                    })), 1e3), n.n = 1, d();
                  case 1:
                    return p = n.v, n.a(2, p);
                }
              }, n);
            }));
            return function (e) {
              return n.apply(this, arguments);
            };
          }(),
          u = {
            codebase: "ghostos/api/parser/nodelogic/elements/library/http.js",
            refnode: e[rs.REFNODE]
          };
        return {
          leaflogic: function leaflogic(t, c) {
            var l,
              f = new r.Subject(),
              s = o ? jp(c, t, void 0, u, {
                leaflogic: o,
                datalogic: {
                  post: function post(t) {
                    return e[rs.http.URI] = t, t;
                  }
                }
              }) : {
                _stream: (0, r.of)("https://httpbin.org"),
                _control: {
                  _stream: c._stream
                }
              },
              d = a ? jp(c, t, void 0, u, {
                leaflogic: a,
                datalogic: {
                  post: function post(t) {
                    return e[rs.http.HEADER] = t, t;
                  }
                }
              }) : {
                _stream: (0, r.of)(""),
                _control: {
                  _stream: c._stream
                }
              },
              p = (0, r.combineLatest)([s._control._stream, d._control._stream]),
              b = (0, r.combineLatest)([s._stream, d._stream]),
              m = p.pipe((0, n.withLatestFrom)(b), (0, n.map)(function (e) {
                return console.log(e), e[0];
              })),
              y = !1,
              g = m.pipe(n.withLatestFrom.apply(void 0, function (e) {
                if (Array.isArray(e)) return Cl(e);
              }(l = t.map(function (e) {
                return e._stream;
              })) || function (e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(l) || Gl(l) || function () {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }()), (0, n.switchMap)(function (e) {
                return i(e.slice(1));
              }), (0, n.map)(function (t) {
                return console.log("testing element _leaflogic: ", t), y = !0, (null == t ? void 0 : t.length) > 1 || !Array.isArray(t) ? f.next(t) : 1 === (null == t ? void 0 : t.length) && f.next(t[0]), e[rs.CTRLIN];
              }), (0, n.share)());
            return {
              _stream: f.pipe((0, n.filter)(function (e) {
                return y;
              }), (0, n.map)(function (e) {
                return console.log(e), e;
              }), (0, n.share)()),
              _control: {
                _stream: g.pipe((0, n.map)(function (e) {
                  return console.log(e), e;
                }), (0, n.share)())
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              var _t2 = function t(e) {
                var n,
                  r = Dl(e);
                return "object" === r ? Array.isArray(e) ? e.map(function (e) {
                  return _t2(e);
                }) : e ? Object.fromEntries(Object.entries(e).map(function (e) {
                  var n,
                    r,
                    o = (r = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(n = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(n, r) || Gl(n, r) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    a = o[0],
                    i = o[1];
                  return [a, _t2(i)];
                })) : e : "string" === r ? (n = {
                  "&": "&amp;",
                  "<": "&lt;",
                  ">": "&gt;",
                  '"': "&quot;",
                  "'": "&#039;"
                }, e.replace(/[&<>"']/g, function (e) {
                  return n[e];
                })) : e;
              };
              return os(_t2(e), "elementio");
            }
          }
        };
      },
      hermes: function hermes(e) {
        var t,
          o = null !== (t = e[rs.LAMBDA_OBJ]) && void 0 !== t ? t : {},
          a = "function" == typeof (null == o ? void 0 : o._default) ? o._default : void 0,
          i = {
            codebase: df,
            refnode: e[rs.REFNODE]
          };
        return {
          leaflogic: function leaflogic(t, o) {
            var u,
              c,
              l = new r.Subject(),
              f = null !== (u = null == t || null === (c = t[0]) || void 0 === c ? void 0 : c._stream) && void 0 !== u ? u : (0, r.of)(void 0),
              s = a ? jp(o, t, void 0, i, {
                leaflogic: a,
                datalogic: {
                  post: function post(t) {
                    return e[sf.CONFIG] = t, t;
                  }
                }
              }) : {
                _stream: (0, r.of)({}),
                _control: {
                  _stream: o._stream
                }
              },
              d = s._control._stream.pipe((0, n.withLatestFrom)(s._stream, f), (0, n.concatMap)(function () {
                var t = Hl(Ul().m(function t(n) {
                  var r, o, a, i, u, c, l, f, s, d, p, b;
                  return Ul().w(function (t) {
                    for (;;) switch (t.p = t.n) {
                      case 0:
                        if (r = n[0], o = n[1], a = n[2], e[rs.CTRLIN] = r, t.p = 1, i = jf(o, e), e[sf.CONFIG] = i, ["read", "both"].includes(i.mode) || Uf(e), u = [], c = h(a) && "error" === a._bname ? a : void 0, l = Pf(a), c && u.push(c), !["write", "both"].includes(i.mode) || c || l) {
                          t.n = 3;
                          break;
                        }
                        return t.n = 2, Xf({
                          config: i,
                          _stream_cache: e,
                          data_in: a
                        });
                      case 2:
                        f = t.v, u.push.apply(u, $l(f));
                      case 3:
                        if (!["read", "both"].includes(i.mode)) {
                          t.n = 5;
                          break;
                        }
                        return t.n = 4, Yf({
                          config: i,
                          _stream_cache: e
                        });
                      case 4:
                        s = t.v, u.push.apply(u, $l(s));
                      case 5:
                        return t.a(2, {
                          ctrl: r,
                          outputs: u
                        });
                      case 6:
                        if (t.p = 6, !((b = t.v) instanceof vf)) {
                          t.n = 7;
                          break;
                        }
                        return t.a(2, {
                          ctrl: r,
                          outputs: [qf({
                            mode: "write",
                            error: {
                              code: b.code,
                              message: b.message,
                              status: b.status,
                              details: b.details
                            },
                            meta: {
                              instanceId: null !== (d = null === (p = e[sf.CONFIG]) || void 0 === p ? void 0 : p.instanceId) && void 0 !== d ? d : Of(null == a ? void 0 : a.instanceId)
                            }
                          })]
                        });
                      case 7:
                        return t.a(2, {
                          ctrl: r,
                          outputs: [Jf(b)]
                        });
                    }
                  }, t, null, [[1, 6]]);
                }));
                return function (e) {
                  return t.apply(this, arguments);
                };
              }()), (0, n.map)(function (e) {
                return e.outputs.filter(function (e) {
                  return void 0 !== e;
                }).forEach(function (e) {
                  return l.next(e);
                }), e.ctrl;
              }), (0, n.share)());
            return {
              _stream: l.pipe((0, n.share)()),
              _control: {
                _stream: d.pipe((0, n.share)())
              }
            };
          },
          datalogic: {
            pre: function pre(e) {
              return e;
            },
            post: function post(e) {
              return h(e) && "error" === e._bname ? e : os(e, "elementio");
            }
          }
        };
      }
    },
    is = function is(e, t) {
      return Object.keys(as).includes(t) && as[t] ? function (e) {
        for (var t = 1; t < arguments.length; t++) {
          var n = null != arguments[t] ? arguments[t] : {};
          t % 2 ? ts(Object(n), !0).forEach(function (t) {
            ns(e, t, n[t]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ts(Object(n)).forEach(function (t) {
            Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
          });
        }
        return e;
      }({}, as[t](e)) : void 0;
    };
  function us() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _cs(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d30 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d30.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d30.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d30.v = r, _d30.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d30.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d30.n = -1), p(u, c)) : _d30.n = c : _d30.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d30.n < 0) ? c : n.call(r, _d30)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_cs(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _cs(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _cs(s, "constructor", l), _cs(l, "constructor", c), c.displayName = "GeneratorFunction", _cs(l, o, "GeneratorFunction"), _cs(s), _cs(s, o, "Generator"), _cs(s, r, function () {
      return this;
    }), _cs(s, "toString", function () {
      return "[object Generator]";
    }), (us = function us() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _cs(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _cs = function cs(e, t, n, r) {
      function a(t, n) {
        _cs(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _cs(e, t, n, r);
  }
  function ls(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || ds(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function fs(e) {
    return fs = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, fs(e);
  }
  function ss(e) {
    return function (e) {
      if (Array.isArray(e)) return ps(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || ds(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function ds(e, t) {
    if (e) {
      if ("string" == typeof e) return ps(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ps(e, t) : void 0;
    }
  }
  function ps(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function bs(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function ms(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? bs(Object(n), !0).forEach(function (t) {
        ys(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : bs(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function ys(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != fs(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != fs(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == fs(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function gs(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function vs(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          gs(a, r, o, i, u, "next", e);
        }
        function u(e) {
          gs(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var hs = {
    dataflow: function dataflow(e) {
      return vs(us().m(function t() {
        var o,
          a,
          i,
          u,
          c,
          l,
          f,
          s,
          d,
          p,
          b,
          m,
          y,
          g,
          v,
          h,
          w,
          O,
          _ = arguments;
        return us().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (a = (o = _.length > 0 && void 0 !== _[0] ? _[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
            case 1:
              return t.n = 2, qs({
                refnode: a,
                nodelambda: u,
                contextuallambda: c,
                etaTree: e.gos.etaTree
              });
            case 2:
              return l = t.v, f = i.leaf.logic.args.elementname, s = e.gos.etaTree.domain, d = e.gos.etaTree.appid, p = "domain" in l && "_default" in l.domain ? l.domain._default : void 0, b = "appid" in l && "_default" in l.appid ? l.appid._default : void 0, m = "uidefs" in l && "_default" in l.uidefs ? l.uidefs._default : void 0, y = "edges" in l && "_default" in l.edges ? l.edges._default : void 0, g = "elementio" in l, v = function v(e) {
                return g ? re(arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "defaultio", e) : e;
              }, ["f30e", "7a65"].includes(a.slice(0, 4)) && console.log("start debugging"), h = {
                codebase: "leafelement.js",
                refnode: a,
                leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
              }, (w = {})[rs.LAMBDA_OBJ] = l, w[rs.REFNODE] = a, w[rs.RTCONTEXT] = {
                graphdomain: s,
                graphappid: d,
                refnodedata: i,
                nodelambda: u,
                contextuallambda: c
              }, O = is(w, f), t.a(2, function (t, o) {
                "d1d2" === (null == a ? void 0 : a.slice(0, 4)) && console.log("start debugging refnode:", a);
                var i = o._stream.pipe((0, n.map)(function (t) {
                  return w[rs.CTRLIN] = t, w[rs.DOMAIN] = e.gos.etaTree.domain, w[rs.APPID] = e.gos.etaTree.appid, t;
                }));
                return i.pipe((0, n.concatMap)(function (e) {
                  var a = (0, r.combineLatest)(t.map(function (e) {
                      return e._stream;
                    })),
                    i = (0, r.of)(e),
                    u = jp({
                      _stream: i
                    }, t, void 0, ms(ms({}, h), {}, {
                      step: "get the current domain"
                    }), {
                      leaflogic: p,
                      datalogic: {
                        pre: function pre(e) {
                          w._input_data = e;
                        },
                        post: function post(e) {
                          return w.domain = e, e;
                        }
                      }
                    }),
                    c = jp(u._control, t, void 0, ms(ms({}, h), {}, {
                      step: "get the current domain"
                    }), {
                      leaflogic: b,
                      datalogic: {
                        post: function post(e) {
                          return w.appid = e, e;
                        }
                      }
                    });
                  if (["http"].includes(f)) {
                    var s = "uri" in l && "_default" in l.uri ? l.uri._default : void 0,
                      d = "header" in l && "_default" in l.header ? l.header._default : void 0,
                      g = s ? wp(s, a, void 0, i, ms({}, o._config)) : {
                        _stream: (0, r.of)([]),
                        _control: {
                          _stream: i
                        }
                      },
                      O = d ? wp(d, a, void 0, i, ms({}, o._config)) : {
                        _stream: (0, r.of)([]),
                        _control: {
                          _stream: i
                        }
                      },
                      _ = (0, r.combineLatest)([u._control._stream, c._control._stream, g._control._stream, O._control._stream]).pipe((0, n.map)(function (e) {
                        return e[0];
                      })),
                      j = {};
                    return _.pipe((0, n.map)(function (e) {
                      return (0, r.combineLatest)([].concat(ss(t.map(function (e) {
                        return e._stream;
                      })), [u._stream, c._stream, g._stream, O]));
                    }), (0, n.concatMap)(function (e) {
                      j._metadata = e;
                      var t = Object.keys(l),
                        n = ["uri", "post", "put", "get", "header", "?graph"].filter(function (e) {
                          return t.includes(e);
                        }),
                        r = n.includes("?graph") ? e[3] + "?graph=".concat(e[1], "/").concat(e[2]) : e[3];
                      if (n.includes("post") || n.includes("put")) {
                        e[4].X_CSRF_Token && (Iu.defaults.headers.post["X-CSRF-Token"] = e[4].X_CSRF_Token);
                        try {
                          console.log(e[0]);
                          var o = n.includes("put") ? Iu.put(r, e[0]) : Iu.post(r, e[0]);
                          return console.log(o), o;
                        } catch (e) {
                          console.log(e), e.response ? (console.log(e.response.data), console.log(e.response.status), console.log(e.response.headers)) : e.request ? console.log(e.request) : console.log("Error", e.message), console.log(e.config);
                        }
                      } else try {
                        console.log("executing http get");
                        var a = Iu.get(r);
                        return console.log(a), a;
                      } catch (e) {
                        e.response ? (console.log(e.response.data), console.log(e.response.status), console.log(e.response.headers)) : e.request ? console.log(e) : console.log("Error", e.message), console.log(e.config);
                      }
                    }), (0, n.map)(function (e) {
                      var _t3 = function t(e) {
                        var n,
                          r = fs(e);
                        return "object" === r ? Array.isArray(e) ? e.map(function (e) {
                          return _t3(e);
                        }) : Object.fromEntries(Object.entries(e).map(function (e) {
                          var n = ls(e, 2),
                            r = n[0],
                            o = n[1];
                          return [r, _t3(o)];
                        })) : "string" === r ? (n = {
                          "&": "&amp;",
                          "<": "&lt;",
                          ">": "&gt;",
                          '"': "&quot;",
                          "'": "&#039;"
                        }, e.replace(/[&<>"']/g, function (e) {
                          return n[e];
                        })) : e;
                      };
                      return v(_t3(e.data), "elementio");
                    }));
                  }
                  if (["mediaplayer"].includes(f)) {
                    var S = "uri" in l && "_default" in l.uri ? l.uri._default : void 0,
                      k = S ? wp(S, a, void 0, i, ms({}, o._config)) : {
                        _stream: (0, r.of)([])
                      };
                    return (0, r.combineLatest)([u._control._stream, c._control._stream, k._control._stream]).pipe((0, n.map)(function (e) {
                      return e[0];
                    })).pipe((0, n.map)(function (e) {
                      return (0, r.combineLatest)([].concat(ss(t.map(function (e) {
                        return e._stream;
                      })), [u._stream, c._stream, k._stream]));
                    }));
                  }
                  if (["gnav", "popup", "image", "editor", "text", "prompt"].includes(f)) {
                    var T = m ? jp(c._control, t, void 0, h, {
                        leaflogic: m,
                        datalogic: {
                          post: function post(e) {
                            return w.uidefs = e, e;
                          }
                        }
                      }) : void 0,
                      E = jp(m ? T._control : c._control, t, void 0, h, {
                        leaflogic: y,
                        datalogic: {
                          post: function post(e) {
                            return w.edges = e, e;
                          }
                        }
                      }),
                      P = "backdrop" in l && "_default" in l.backdrop ? l.backdrop._default : void 0;
                    return ("gnav" == f ? P ? jp(E._control, t, void 0, h, {
                      leaflogic: P,
                      datalogic: {
                        post: function post(e) {
                          return w.backdrop = e, e;
                        }
                      }
                    }) : {
                      _stream: (0, r.of)("/assets/test/hubbleinfrared_dark2.jpg"),
                      _control: {
                        _stream: i
                      }
                    } : {
                      _stream: (0, r.of)([]),
                      _control: {
                        _stream: i
                      }
                    })._control._stream.pipe((0, n.map)(function (e) {
                      return [w._input_data, w.domain, w.appid, w.uidefs, w.edges, w.backdrop];
                    }));
                  }
                })), "elementio$" in O && (e.gos.etaTree.leafio.elementioLUT[a] = O.elementio$), jp({
                  _stream: i
                }, t, void 0, ms(ms({}, h), {}, {
                  metastep: "element " + f
                }), {
                  leaflogic: O ? O.leaflogic : void 0,
                  datalogic: {
                    pre: O ? O.datalogic.pre : void 0,
                    post: O ? O.datalogic.post : void 0
                  }
                });
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return vs(us().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return us().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t = ls(e, 2),
                  n = t[0],
                  r = t[1];
                u[n] = function (e, t) {
                  return ms(ms({}, r(e, t)), {}, {
                    _control: t
                  });
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    },
    methods: function methods(e) {
      return vs(us().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return us().w(function (t) {
          for (;;) if (0 === t.n) return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, u = {
            configtext: ""
          }, t.a(2, {
            texteditor: {
              setTextSource: function setTextSource(t) {
                u.configtext = t;
                var n = ms({}, o);
                n.leaf.logic.args.elementconfig = t, e.gos.etaTree.leaflakeio.qm_methods.updateNode({
                  variables: {
                    uuid: r,
                    data: ao(JSON.stringify(n))
                  }
                });
              },
              getTextSource: function getTextSource() {
                return o.leaf.logic.args.elementconfig;
              }
            },
            general: {
              getNodeData: function getNodeData() {
                return o;
              },
              getLambdaLUT: function () {
                var t = vs(us().m(function t() {
                  var n, o;
                  return us().w(function (t) {
                    for (;;) switch (t.n) {
                      case 0:
                        return t.n = 1, qs({
                          refnode: r,
                          nodelambda: a,
                          contextuallambda: i,
                          etaTree: e.gos.etaTree
                        });
                      case 1:
                        return n = t.v, o = {}, Object.entries(n).map(function (e) {
                          var t = ls(e, 2),
                            n = t[0],
                            r = t[1];
                          o[n] = function (e, t) {
                            return ms(ms({}, r(e, t)), {}, {
                              _control: t
                            });
                          };
                        }), t.a(2, o);
                    }
                  }, t);
                }));
                return function () {
                  return t.apply(this, arguments);
                };
              }(),
              setElementName: function setElementName(t) {
                var n = ms({}, o);
                n.leaf.logic.args.elementname = t, e.gos.etaTree.leaflakeio.qm_methods.updateNode({
                  variables: {
                    uuid: r,
                    data: ao(JSON.stringify(n))
                  }
                });
              }
            }
          });
        }, t);
      }));
    }
  };
  function ws(e, t, n) {
    var r = {
      leafoutflowport: ne,
      leafinflowport: H,
      leafscreenio: ye,
      leafmemoryio: He,
      leafdeckspade: Mi,
      leafdeckheart: Qi,
      leafdeckdiamond: uu,
      leafdeckclub: hu,
      leafgnav: ku,
      leafpopupview: Fu,
      leafelement: hs,
      leafgraph: Xd,
      leaflambdagraph: Xs,
      leafanchor: np,
      leafspell: fd,
      leafspelldef: hd,
      leafloopyspell: Ld,
      leafchronosflow: Vo,
      leafasyncflow: Vo,
      leafmixflow: aa,
      leafgateflow: ga,
      leaflisp: Go,
      leaflabel: Pa,
      leafdelabel: Ra,
      leafbottle: Qa,
      leafunbottle: ii,
      leafcrate: vi,
      leafconfig: Ei
    };
    return r[e][t] ? r[e][t](n) : void 0;
  }
  function Os(e) {
    return Os = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Os(e);
  }
  function _s() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _js(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d31 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d31.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d31.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d31.v = r, _d31.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d31.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d31.n = -1), p(u, c)) : _d31.n = c : _d31.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d31.n < 0) ? c : n.call(r, _d31)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_js(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _js(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _js(s, "constructor", l), _js(l, "constructor", c), c.displayName = "GeneratorFunction", _js(l, o, "GeneratorFunction"), _js(s), _js(s, o, "Generator"), _js(s, r, function () {
      return this;
    }), _js(s, "toString", function () {
      return "[object Generator]";
    }), (_s = function _s() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _js(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _js = function js(e, t, n, r) {
      function a(t, n) {
        _js(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _js(e, t, n, r);
  }
  function Ss(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function ks(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Ss(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Ss(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function Ts(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || Ns(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Es(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Ps(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Es(Object(n), !0).forEach(function (t) {
        As(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Es(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function As(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Os(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Os(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Os(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function xs(e) {
    return function (e) {
      if (Array.isArray(e)) return Fs(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || Ns(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Ns(e, t) {
    if (e) {
      if ("string" == typeof e) return Fs(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Fs(e, t) : void 0;
    }
  }
  function Fs(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var Is = G.memoize,
    Ls = {
      isdebug: "development" === process.env.LEAFGON_ENV_TYPE
    },
    Ds = re("error", {
      type: "critical",
      message: "LEAF core error: race condition detected in eta.js",
      codebase: "/src/ghostos/api/parser/eta.js"
    }, {}),
    Gs = function Gs(e, t) {
      return xs(Array(t).keys()).map(function (t) {
        e[t] = !1;
      }), e;
    },
    Cs = function Cs(e, t, o, a, i, u, c) {
      var l = {
          refnode: e,
          codebase: "eta.js weaveDataflowPlane",
          domain: i.domain,
          appid: i.appid
        },
        f = re("empty_bottle", "empty_data", {
          _provenance: {
            refnode: e,
            codebase: "eta.js weaveDataflowPlane"
          }
        }),
        s = {},
        _d32 = function d(e) {
          var p = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0;
          return e.map(function (e) {
            var b, m;
            if (null !== (b = s[e]) && void 0 !== b && b.data_out && null !== (m = s[e]) && void 0 !== m && m.ctrl_out) return {
              _stream: s[e].data_out._stream.pipe((0, n.map)(function (e) {
                return e;
              })),
              _control: {
                _stream: s[e].ctrl_out._stream.pipe((0, n.map)(function (e) {
                  return e;
                }))
              }
            };
            var y = a[e];
            if (null == y && console.log("start debugging"), !y || !("_default" in y)) throw "LEAF error: weaveDataflowPlane(): the ".concat(y ? "" : "undefined", " eta reduced function with the refnode ").concat(e, " ") + "has no _default defined.";
            var g = p || i.leafgraph.graph.dataflow.mapInEdges(e, function (e) {
                return i.leafgraph.graph.dataflow.source(e);
              }),
              v = 0 === g.length ? [{
                _stream: c._stream,
                _control: {
                  _stream: u._stream
                }
              }] : _d32(g).filter(function (e) {
                return e;
              });
            g.length > 1 && console.log("start debugging"), function (e, t, r) {
              var o = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3],
                a = e,
                u = i.leafgraph.graph.dataflow.mapInEdges(a, function (e) {
                  return i.leafgraph.graph.dataflow.source(e);
                });
              a in s || (s[a] = {
                inputnodes: u,
                "synchronized": !1,
                flowcache: {},
                initflowcache: function initflowcache() {
                  var e,
                    t = s[a].inputnodes.length;
                  s[a].flowcache = t > 1 ? null === (e = Object.keys(s[a].inputnodes)) || void 0 === e ? void 0 : e.reduce(function (e, t) {
                    return e[t] = !1, e;
                  }, {}) : {
                    0: !1
                  };
                },
                recordflow: function recordflow(e) {
                  s[a].flowcache[e] = !0;
                },
                checksync: function checksync() {
                  return Object.values(s[a].flowcache).reduce(function (e, t) {
                    return e && t;
                  }, !0);
                },
                data_in$Arr: r.map(function (e, t) {
                  return e._stream.pipe((0, n.filter)(function (e) {
                    return JSON.stringify(Ps(Ps({}, e), {}, {
                      _label: {}
                    })) !== JSON.stringify(Ds);
                  }), (0, n.map)(function (e) {
                    return ["c10cbbbb-14d5-4270-b17a-1965afcabc98"].includes(a) && console.log("_data_in fuse junction, start debugging", a, s[a]), console.log("midi message to be registered in nodeflowinterface", a, e), h(e) && "error" === e._bname && console.error("start debugging", e), ["c822ae2e-1be8-46be-b2cb-21a43cef0555", "e9e6e44b-792b-46d0-b1d3-58ce2f46c45b"].includes(a) && h(e) && "_midi_in" === e._bname && console.log("midi_in signal registered in nodeflowinterface", e, a), e;
                  }));
                }),
                data_out: void 0,
                ctrl_in$Arr: t.map(function (e, t) {
                  return e._stream.pipe((0, n.filter)(function (e) {
                    return JSON.stringify(Ps(Ps({}, e), {}, {
                      _label: {}
                    })) !== JSON.stringify(Ds);
                  }), (0, n.map)(function (e) {
                    return e || console.log("ctrl message to be registered in nodeflowinterface", a, e), s[a][t] && console.error("ctrl signal arrived congested", e), ["c822ae2e-1be8-46be-b2cb-21a43cef0555", "e9e6e44b-792b-46d0-b1d3-58ce2f46c45b"].includes(a) && console.log("ctrl_in signal registered in nodeflowinterface", e, a), s[a].recordflow(t), e;
                  }));
                }),
                ctrl_out: void 0,
                get_composite_in$objArr: function get_composite_in$objArr() {
                  return s[a].data_in$Arr.map(function (e, t) {
                    return {
                      _stream: e,
                      _control: {
                        _stream: s[a].ctrl_in$Arr[t]
                      }
                    };
                  });
                }
              }, s[a].initflowcache(), u.length > 1 && o && (s[a]["synchronized"] = !0));
            }(e, v.map(function (e) {
              return {
                _stream: e._control._stream
              };
            }), v.map(function (e) {
              return {
                _stream: e._stream
              };
            })), "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91" === e && console.log("start debugging");
            var w = i.leafgraph.graph.dataflow.getNodeAttributes(e).leafnode.data,
              O = "leafchronosflow" === w.leaf.logic.type,
              _ = O ? {
                ctrl: r.merge.apply(void 0, xs(s[e].get_composite_in$objArr().map(function (e) {
                  return e._control._stream;
                }))),
                data: void 0
              } : function (e) {
                var t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0,
                  o = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {},
                  a = new r.Subject();
                console.log("invoking doChronosSynchronize, ", o);
                var i = e.map(function (e) {
                    return e._control._stream;
                  }),
                  u = e.map(function (e) {
                    return e._stream;
                  }),
                  c = {},
                  l = {},
                  f = e.length;
                return Gs(c, f), {
                  ctrl: t && t["synchronized"] ? r.merge.apply(void 0, xs(e.map(function (e, t) {
                    return e._control._stream.pipe((0, n.withLatestFrom)(e._stream), (0, n.map)(function (e) {
                      return [t, e];
                    }));
                  }))).pipe((0, n.map)(function (e) {
                    if (c[e[0]] = !0, l[e[0]] = e[1], n = c, r = !0, xs(Array(f).keys()).map(function (e) {
                      r && (r = n[e]);
                    }), r) {
                      Gs(c, f);
                      var t = Object.values(l);
                      return l = {}, t;
                    }
                    var n, r;
                  }), (0, n.filter)(function (e) {
                    return void 0 !== e;
                  }), (0, n.map)(function (e) {
                    if (console.log("eta.js doChronosSynchronize _composite_in registered", o.nodeuuid, t.checksync(), e), "806e0a4b-badf-42a0-85af-5ad306385c58" === o.nodeuuid && console.log("start debugging"), t.checksync()) {
                      t.initflowcache(), "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91" === o.nodeuuid && console.log("start debugging");
                      var n = e.map(function (e) {
                        var t = e.slice(1).flat();
                        return 1 === t.length ? t[0] : t;
                      });
                      a.next(n);
                      var r = Ps({}, e[0][0]),
                        i = e.map(function (e) {
                          return e[0].traces;
                        });
                      return 1 === i.length && (i = i[0]), r.traces = [i], r;
                    }
                  }), (0, n.filter)(function (e) {
                    return void 0 !== e;
                  })) : i.length > 1 ? r.merge.apply(void 0, xs(i.map(function (e, t) {
                    return e.pipe((0, n.withLatestFrom)(u[t]), (0, n.map)(function (e) {
                      var t = e[0];
                      t.length > 1 && t.includes(void 0) && console.log("start debugging"), "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91" === o.nodeuuid && console.log("start debugging"), console.log("eta.js doChronosSynchronize _composite_in registered", o, e), h(e[1]) && "screenio" === e[1]._bname && console.log("start debugging");
                      var n = e.slice(1);
                      return a.next(n), t;
                    }));
                  }))) : i[0].pipe((0, n.withLatestFrom)(u[0]), (0, n.map)(function (e) {
                    var t = e[0];
                    console.log("eta.js doChronosSynchronize _composite_in registered", o, e), h(e[1]) && "screenio" === e[1]._bname && console.log("start debugging");
                    var n = e[1];
                    return a.next(n), t;
                  })),
                  data: a.pipe((0, n.filter)(function (e) {
                    return JSON.stringify(Ps(Ps({}, e), {}, {
                      _label: {}
                    })) !== JSON.stringify(Ds);
                  }))
                };
              }(s[e].get_composite_in$objArr(), {
                time: -1,
                count: -1
              }, s[e], Ps(Ps(Ps({}, l), w), {}, {
                at: "eta.js _weaveDataflowPlane",
                nodeuuid: e
              })),
              j = _.ctrl,
              S = _.data,
              k = {
                _stream: j.pipe((0, n.map)(function (t) {
                  return "fa175f13-a1fc-482c-9c2c-7f5a9d22a136" === e && console.log("start debugging"), t;
                }))
              },
              T = O ? s[e].get_composite_in$objArr().map(function (e, t) {
                return {
                  _stream: e._stream.pipe((0, n.map)(function (e) {
                    return e;
                  }))
                };
              }) : [{
                _stream: S.pipe((0, n.map)(function (t) {
                  return "fa175f13-a1fc-482c-9c2c-7f5a9d22a136" === e && console.log("start debugging"), t;
                }))
              }];
            if (g.length > 0) {
              if (o.includes(e)) {
                if ("leafoutflowport" === w.leaf.logic.type) {
                  var E = y._default(T, k);
                  return s[e].data_out = {
                    _stream: E._stream
                  }, s[e].ctrl_out = {
                    _stream: E._control._stream
                  }, {
                    _stream: E._stream.pipe((0, n.map)(function (e) {
                      return e;
                    })),
                    _control: {
                      _stream: E._control._stream.pipe((0, n.map)(function (e) {
                        return e;
                      }))
                    }
                  };
                }
                var P = y._default(T, k);
                return s[e].data_out = {
                  _stream: P._stream.pipe((0, n.map)(function (t) {
                    return Ps(Ps({}, f), {}, {
                      _label: Ps(Ps({}, f._label), {}, {
                        context: "a nudge data bottle returned by an exitless end node, " + e
                      })
                    });
                  }))
                }, s[e].ctrl_out = {
                  _stream: P._control._stream.pipe((0, n.map)(function (e) {
                    return e;
                  }))
                }, {
                  _stream: s[e].data_out._stream.pipe((0, n.map)(function (e) {
                    return e;
                  })),
                  _control: {
                    _stream: s[e].ctrl_out._stream.pipe((0, n.map)(function (e) {
                      return e;
                    }))
                  }
                };
              }
              var A = y._default(T, k);
              return s[e].data_out = {
                _stream: A._stream
              }, s[e].ctrl_out = {
                _stream: A._control._stream
              }, {
                _stream: A._stream.pipe((0, n.map)(function (t) {
                  return "0f35d8bc-36a6-4fe8-b185-f8ed5188b28f" === e && console.log("start debugging"), t;
                })),
                _control: {
                  _stream: A._control._stream.pipe((0, n.map)(function (t) {
                    return "0f35d8bc-36a6-4fe8-b185-f8ed5188b28f" === e && console.log("start debugging"), t;
                  }))
                }
              };
            }
            if (!t.includes(e)) throw "LEAF error: weaveDataflowPlane(): the eta reduced function with the refnode ".concat(e, " ") + "has matched against incomplete startnodes reference.";
            if ("leafinflowport" === i.leafgraph.graph.dataflow.getNodeAttributes(e).leafnode.data.leaf.logic.type) {
              var x = y._default(T, k);
              return s[e].data_out = {
                _stream: x._stream
              }, s[e].ctrl_out = {
                _stream: x._control._stream
              }, {
                _stream: x._stream.pipe((0, n.map)(function (e) {
                  return e;
                })),
                _control: {
                  _stream: x._control._stream.pipe((0, n.map)(function (e) {
                    return e;
                  }))
                }
              };
            }
            var N = T.map(function (e) {
                return {
                  _stream: e._stream.pipe((0, n.map)(function (e) {
                    return Ps(Ps({}, f), {}, {
                      _label: Ps(Ps({}, f._label), {}, {
                        context: "input-less node dataflow nudging message as per ctrl signal"
                      })
                    });
                  }))
                };
              }),
              F = y._default(N, k);
            return s[e].data_out = {
              _stream: F._stream
            }, s[e].ctrl_out = {
              _stream: F._control._stream
            }, {
              _stream: F._stream.pipe((0, n.map)(function (e) {
                return e;
              })),
              _control: {
                _stream: F._control._stream.pipe((0, n.map)(function (e) {
                  return e;
                }))
              }
            };
          });
        },
        p = _d32(o);
      0 === p.length && console.log("start debugging");
      var b = p.length > 1 ? function (e) {
          var t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
            o = e.length,
            a = new r.Subject(),
            i = e.map(function (e) {
              return e._control._stream.pipe((0, n.map)(function (e) {
                return globalThis.TRACEON ? Ps(Ps({}, e), {}, {
                  traces: _p(null == e ? void 0 : e.traces, Ps(Ps({}, t), {}, {
                    desc: "doChronosAsynchronize(), a ctrl signal came through out of inputcount of " + o
                  }), !0)
                }) : e;
              }), (0, n.withLatestFrom)(e._stream), (0, n.map)(function (e) {
                return a.next(2 === e.length ? e[1] : e.slice(1)), e[0];
              }), (0, n.share)());
            });
          return {
            ctrl: r.merge.apply(void 0, xs(i)).pipe((0, n.map)(function (e) {
              return e;
            })),
            data: a.pipe((0, n.filter)(function (e) {
              return JSON.stringify(Ps(Ps({}, e), {}, {
                _label: {}
              })) !== JSON.stringify(Ds);
            }))
          };
        }(p, {
          time: -1,
          count: -1
        }, Ps(Ps({}, l), {}, {
          at: "eta.js _weaveDataflowPlane",
          endnodes: o
        })) : {
          ctrl: p[0]._control._stream,
          data: p[0]._stream
        },
        m = {
          _stream: b.ctrl
        };
      return [Ps(Ps({}, {
        _stream: b.data
      }), {}, {
        _control: m
      }), s];
    },
    Ms = function Ms(e, t, o, a, i) {
      var u,
        c = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : {};
      "editor" !== e && void 0 !== e || console.log("start debugging");
      var l = {
          main: "nav main dataflow",
          leafgraph: "leafgraph main dataflow",
          editor: "editor main dataflow"
        },
        f = {
          codebase: "eta.js",
          refnode: e,
          leafnode: Object.keys(l).includes(e) ? l[e] : null === (u = i.leafgraph.graph.dataflow.getNodeAttributes(e)) || void 0 === u ? void 0 : u.leafnode.data,
          metadata: c,
          domain: i.domain,
          appid: i.appid
        };
      return function () {
        var u = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [],
          l = arguments.length > 1 ? arguments[1] : void 0,
          s = {
            data_in: new r.Subject(),
            ctrl_in: new r.Subject(),
            data_out: new r.Subject(),
            ctrl_out: new r.Subject()
          },
          d = {
            _stream: s.data_in
          },
          p = {
            _stream: s.ctrl_in,
            _config: {}
          };
        ["3980759d-7c59-4b9e-b799-87b5fd4cbcec", "62890d97-837a-463e-aac9-d7fca2293427"].includes(e) && console.log("start debugging"), ["633e5b3e-72b7-4536-8e68-40d0b4902cba"].includes(e) && console.log("start debugging");
        var b = Ts(Cs(e, t, o, a, i, p, d), 1)[0];
        return jp(l, u, void 0, Ps(Ps({}, f), {}, {
          metastep: "invoking parseDataflowFunc()"
        }), {
          leaflogic: function leaflogic(t, o) {
            var a,
              i = new r.Subject(),
              u = o._stream.pipe((0, n.map)(function (e) {
                return a = e, e;
              }), n.withLatestFrom.apply(void 0, xs(t.map(function (e) {
                return e._stream;
              }))), (0, n.switchMap)(function (n) {
                "19ec3d65-7361-4a37-95be-c0f30ecedd3f" === c.refnode && console.log("start debugging"), console.log("eta.js parseDataflowFunc() _etaflowfunc data_in registered in the flow:", n), t.length > 1 && console.log("start debugging");
                var r = 1 === t.length ? n[1] : n.slice(1);
                return "e2fd7358-27e5-4819-88f8-d8f25c81c9a0" === e && console.log("start debugging"), setTimeout(function () {
                  s.data_in.next(r), s.ctrl_in.next(a);
                }, 1), b._control._stream;
              }), (0, n.withLatestFrom)(b._stream), (0, n.map)(function (e) {
                if (h(e[1]) && "error" === e[1]._bname) console.log("start debugging"), console.error("rxTimeoutStream resolved with error: ", e), console.error("LEAR Error: an error occurred when rxTimeoutStream was invoked with ctrl_in from the etafunc invocation within parseDataflowFunc: ", a);else {
                  console.log("rxTimeoutStream resolved: ", e);
                  var t = e[1];
                  void 0 !== t ? i.next(t) : console.log("start debugging, this could potentially be the cause of the race condition error from leafmixflow.js");
                }
                return e[0];
              }), (0, n.share)());
            return {
              _stream: i.pipe((0, n.filter)(function (e) {
                return JSON.stringify(Ps(Ps({}, e), {}, {
                  _label: {}
                })) !== JSON.stringify(Ds);
              })),
              _control: Ps(Ps({}, o), {}, {
                _stream: u
              })
            };
          },
          datalogic: {}
        });
      };
    },
    Rs = Is(ks(_s().m(function e() {
      var t,
        n,
        r,
        o,
        a,
        i,
        u,
        c,
        l,
        f,
        s = arguments;
      return _s().w(function (e) {
        for (;;) switch (e.n) {
          case 0:
            return n = (t = s.length > 0 && void 0 !== s[0] ? s[0] : {}).refnode, r = t.component_members, o = t.contextuallambda, a = t.etaTree, i = [], u = [], c = {}, ["7b1f"].includes(null == n ? void 0 : n.slice(0, 4)) && console.log("start debugging"), ["633e5b3e-72b7-4536-8e68-40d0b4902cba"].includes(n) && console.log("start debugging"), l = r.map(function (e) {
              "5f7d8750-8ebd-46ee-9a21-029d4000f452" === e && console.log("start debugging");
              var t = a.etaReduceLEAFNode({
                nodeuuid: e,
                contextuallambda: o
              });
              return t.then(function (t) {
                null == t && console.log("start debugging"), c[e] = t;
                var n = a.leafgraph.edges.data.sources.has(e);
                a.leafgraph.edges.data.targets.has(e) || i.push(e), n || u.push(e);
              }), t;
            }), ["7b1f", "main"].includes(null == n ? void 0 : n.slice(0, 4)) && console.log("start debugging"), e.n = 1, Promise.all(l);
          case 1:
            return ["7b1f", "main"].includes(null == n ? void 0 : n.slice(0, 4)) && console.log("start debugging"), ["2ee89b44-16af-472f-97d4-47ae65f064c8"].includes(n) && console.log("start debugging"), f = Ms(n, i, u, c, a), e.a(2, f);
        }
      }, e);
    })), function () {
      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        t = (e.refnode, e.component_members),
        n = e.contextuallambda,
        r = e.etaTree;
      return JSON.stringify([].concat(xs(t), xs(n), [r.sessionid]));
    }),
    qs = function () {
      var e = ks(_s().m(function e() {
        var t,
          n,
          r,
          o,
          a,
          i,
          u,
          c,
          l,
          f,
          s = arguments;
        return _s().w(function (e) {
          for (;;) switch (e.n) {
            case 0:
              return n = (t = s.length > 0 && void 0 !== s[0] ? s[0] : {}).refnode, r = t.nodelambda, o = t.contextuallambda, a = t.etaTree, i = t.addnodelut, u = void 0 !== i && i, t.metadata, ["7b1f"].includes(null == n ? void 0 : n.slice(0, 4)) && console.log("start debugging"), ["530acdcf-067d-4868-ba0c-b7a83e6edfdf"].includes(n) && console.log("start debugging"), ["633e5b3e-72b7-4536-8e68-40d0b4902cba"].includes(n) && console.log("start debugging"), c = u ? {
                _nodelut: {}
              } : {}, (l = r.filter(function (e) {
                return !(e in a.graphcomponents.components.lut);
              })).length > 0 && console.warn("LEAF Warning: etaReduceLambdaGraphs() skipping unknown lambda nodes", l), f = r.filter(function (e) {
                return e in a.graphcomponents.components.lut;
              }).map(function (e) {
                var t = a.graphcomponents.components.lut[e],
                  r = t.idx,
                  i = t.scope,
                  l = a.graphcomponents.components.nodegroups.lambda[r];
                if ("dataflow" === i) {
                  var f = Rs({
                    refnode: n,
                    component_members: l,
                    contextuallambda: o,
                    etaTree: a
                  });
                  return ["7b1f"].includes(null == n ? void 0 : n.slice(0, 4)) && console.log("start debugging"), ["633e5b3e-72b7-4536-8e68-40d0b4902cba"].includes(n) && console.log("start debugging"), f.then(function (t) {
                    ["7b1f"].includes(null == n ? void 0 : n.slice(0, 4)) && console.log("start debugging"), ["633e5b3e-72b7-4536-8e68-40d0b4902cba"].includes(n) && console.log("start debugging"), c._default = t, u && (c._nodelut._default = e);
                  }), f;
                }
                if ("lambda" === i) {
                  if (!(l.length > 1)) {
                    var s = a.etaReduceLEAFNode({
                      nodeuuid: e,
                      contextuallambda: o
                    });
                    return s.then(function (t) {
                      t || console.log("start debugging"), Object.entries(t).map(function (t) {
                        var r = Ts(t, 2),
                          o = r[0],
                          i = r[1];
                        if (o in c) {
                          var l = a.leafgraph.graph.dataflow.getNodeAttributes(n).leafnode.data.leaf.logic;
                          console.error("LEAF error: the logical construct built using the ".concat(l.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(l.args), ") has multiple ") + "lambda definitions for ".concat(o, ". LEAF only allows uniquely labelled lambda constructs."));
                        } else c[o] = i, u && (c._nodelut[o] = e);
                      });
                    })["catch"](function (e) {
                      console.error(e);
                    }), s;
                  }
                  var d = a.leafgraph.graph.dataflow.getNodeAttributes(n).leafnode.data.leaf.logic;
                  console.error("LEAF error: the logical construct built using the ".concat(d.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(d.args), ") has an invalid ") + "lambda construct. LEAF does NOT allow lambda-scoped nodes to have dataflow edges.");
                } else {
                  var p = a.leafgraph.graph.dataflow.getNodeAttributes(n).leafnode.data.leaf.logic,
                    b = a.leafgraph.graph.dataflow.getNodeAttributes(e).leafnode.data.leaf.logic;
                  console.error("LEAF error: the lambda construct of type ".concat(b.type, " connected to the ").concat(p.type, " node (").concat(n, ") called with args (").concat(JSON.stringify(p.args), ") has an invalid scope: ").concat(i, "."));
                }
              }), e.n = 1, Promise.all(f);
            case 1:
              return ["e36a8dd4-c8df-4dfa-b60c-765eeb5b99fd"].includes(n) && console.log("start debugging"), e.a(2, c);
          }
        }, e);
      }));
      return function () {
        return e.apply(this, arguments);
      };
    }(),
    Js = function Js(e, t, n, r, o, a, i, u, c, l) {
      var f,
        s,
        d,
        p,
        b = arguments.length > 10 && void 0 !== arguments[10] ? arguments[10] : void 0,
        m = {
          sessionid: b ? b.sessionid : void 0,
          appmode: e,
          hostdomain: t,
          hostappid: n,
          domain: r,
          appid: o,
          leafgraph: void 0,
          graphcomponents: void 0,
          rootgraphstate: void 0,
          leafio: void 0,
          leaflakeio: void 0,
          mnemosyne: void 0,
          hostEtaTree: b,
          leafnodemethods: {},
          lookupRuntimeLambdaLUT: (p = ks(_s().m(function e(t, n, r, o, a) {
            var i,
              u,
              c,
              l,
              f = arguments;
            return _s().w(function (e) {
              for (;;) switch (e.n) {
                case 0:
                  if (i = f.length > 5 && void 0 !== f[5] && f[5], 0 !== o.length) {
                    e.n = 1;
                    break;
                  }
                  return e.a(2, {});
                case 1:
                  return e.n = 2, Le(m).getEtaTree(t, n);
                case 2:
                  if (u = e.v, !i) {
                    e.n = 4;
                    break;
                  }
                  return e.n = 3, m.etaReduceLEAFNode({
                    nodeuuid: r,
                    contextuallambda: a
                  });
                case 3:
                  l = e.v, e.n = 6;
                  break;
                case 4:
                  return e.n = 5, qs({
                    refnode: r,
                    nodelambda: o,
                    contextuallambda: a,
                    etaTree: u
                  });
                case 5:
                  l = e.v;
                case 6:
                  return c = l, e.a(2, c);
              }
            }, e);
          })), function (e, t, n, r, o) {
            return p.apply(this, arguments);
          }),
          lookupLEAFNodeMethods: (d = ks(_s().m(function e(t) {
            var n,
              r,
              o,
              a,
              i,
              u,
              c,
              l,
              f,
              s,
              d = arguments;
            return _s().w(function (e) {
              for (;;) switch (e.n) {
                case 0:
                  if (n = d.length > 1 && void 0 !== d[1] ? d[1] : void 0, !(t in m.leafnodemethods)) {
                    e.n = 1;
                    break;
                  }
                  return e.a(2, m.leafnodemethods[t]);
                case 1:
                  if (!m.leafgraph.graph.dataflow.nodes().includes(t)) {
                    e.n = 4;
                    break;
                  }
                  if (r = m.leafgraph.graph.dataflow.getNodeAttributes(t).leafnode.data, o = r.leaf.logic, a = {
                    gos: {
                      standardSpellbook: {},
                      curatedSpellbook: {},
                      stdlambdalut: {},
                      curatedlambdalut: {},
                      leafio: m.leafio,
                      etaTree: m
                    },
                    user: {
                      spellbook: m.graphcomponents.spelldefs,
                      lambdalut: m.leafgraph.edges.lambda.sourcelut
                    }
                  }, !(i = ws(o.type, "methods", a)) || t in m.leafnodemethods) {
                    e.n = 3;
                    break;
                  }
                  return u = m.leafgraph.edges.lambda.sourcelut[t] ? m.leafgraph.edges.lambda.sourcelut[t] : [], e.n = 2, i({
                    refnode: t,
                    refnodedata: r,
                    nodelambda: u,
                    contextuallambda: []
                  });
                case 2:
                case 6:
                  return m.leafnodemethods[t] = e.v, e.a(2, m.leafnodemethods[t]);
                case 3:
                case 7:
                  return e.a(2, void 0);
                case 4:
                  if (!m.hostEtaTree) {
                    e.n = 5;
                    break;
                  }
                  return e.a(2, m.hostEtaTree.lookupLEAFNodeMethods(t, n));
                case 5:
                  if (void 0 === n) {
                    e.n = 7;
                    break;
                  }
                  if (l = (c = n).leaf.logic, f = {
                    gos: {
                      standardSpellbook: {},
                      curatedSpellbook: {},
                      stdlambdalut: {},
                      curatedlambdalut: {},
                      leafio: m.leafio,
                      etaTree: m
                    },
                    user: {
                      spellbook: m.graphcomponents.spelldefs,
                      lambdalut: m.leafgraph.edges.lambda.sourcelut
                    }
                  }, !(s = ws(l.type, "methods", f)) || t in m.leafnodemethods) {
                    e.n = 7;
                    break;
                  }
                  return e.n = 6, s({
                    refnode: t,
                    refnodedata: c,
                    nodelambda: [],
                    contextuallambda: []
                  });
                case 8:
                  return e.a(2);
              }
            }, e);
          })), function (e) {
            return d.apply(this, arguments);
          }),
          etaReduceLEAFNode: (s = ks(_s().m(function e() {
            var t,
              n = arguments;
            return _s().w(function (e) {
              for (;;) if (0 === e.n) return (t = n.length > 0 && void 0 !== n[0] ? n[0] : {}).nodeuuid, t.contextuallambda, e.a(2, {
                _default: function _default(e) {
                  console.error("LEAF Error: runtimeEtaTree.etaReduceLEAFNode() called without first calling initTree().");
                }
              });
            }, e);
          })), function () {
            return s.apply(this, arguments);
          }),
          loadElementJsEsmModule: (f = ks(_s().m(function e(t) {
            var n;
            return _s().w(function (e) {
              for (;;) switch (e.n) {
                case 0:
                  if (t in m.esmcache) {
                    e.n = 2;
                    break;
                  }
                  return e.n = 1, Iu.get(t);
                case 1:
                  n = e.v, m.esmcache[t] = n.data;
                case 2:
                  return e.a(2, m.esmcache[t]);
              }
            }, e);
          })), function (e) {
            return f.apply(this, arguments);
          }),
          initTree: function initTree(e, t, n, r, o) {
            m.config = Ls, m.leafgraph = e, m.graphcomponents = t, m.rootgraphstate = "initialized", m.leafio = n, m.leaflakeio = r, m.mnemosyne = o, m.esmcache = {}, void 0 === m.hostEtaTree && Le(m).initEtaTreeForest();
            var a = function () {
              var e = ks(_s().m(function e() {
                var t,
                  n,
                  r,
                  o,
                  a,
                  i,
                  u,
                  c,
                  l,
                  f,
                  s,
                  d,
                  p,
                  b = arguments;
                return _s().w(function (e) {
                  for (;;) switch (e.p = e.n) {
                    case 0:
                      return n = (t = b.length > 0 && void 0 !== b[0] ? b[0] : {}).nodeuuid, r = t.contextuallambda, "undefined" !== (o = n) && void 0 !== o || console.log("start debugging"), ["633e5b3e-72b7-4536-8e68-40d0b4902cba"].includes(o) && console.log("start debugging"), ["0f35d8bc-36a6-4fe8-b185-f8ed5188b28f"].includes(o) && console.log("start debugging"), ["5f7d8750-8ebd-46ee-9a21-029d4000f452"].includes(o) && console.log("start debugging"), a = o ? m.leafgraph.graph.dataflow.getNodeAttributes(o).leafnode.data.leaf.logic : void 0, i = n in m.leafgraph.edges.lambda.sourcelut ? m.leafgraph.edges.lambda.sourcelut[n] : [], u = void 0, n in m.graphcomponents.components.lut && (c = m.graphcomponents.components.lut[n].scope, u = c), l = {
                        gos: {
                          standardSpellbook: {},
                          curatedSpellbook: {},
                          stdlambdalut: {},
                          curatedlambdalut: {},
                          leafio: m.leafio,
                          etaTree: m
                        },
                        user: {
                          spellbook: m.graphcomponents.spelldefs,
                          lambdalut: m.leafgraph.edges.lambda.sourcelut
                        }
                      }, e.p = 1, ["b490aada-daab-4322-9001-14aea8bcb3d3", "97fa68cf-bcc5-44cf-8311-ffa6a1422ac3", "abb18b4d-b8af-4349-949d-fae21bc142ef", "e9536f42-df6d-4086-a643-5f3c0b02aac9", "b5a20ce3-3e67-42cd-9f60-3f70c6acd269", "59fe3646-b338-4ab0-a8a6-d6ad401be4fa"].includes(n) && console.log("start debugging"), "leafasyncflow" == a.type && console.log("start debugging"), f = ws(a.type, u, l), "undefined" !== n && void 0 !== n || console.log("start debugging"), s = m.leafgraph.graph.dataflow.getNodeAttributes(n).leafnode.data, e.n = 2, f({
                        refnode: n,
                        refnodedata: s,
                        nodelambda: i,
                        contextuallambda: r
                      });
                    case 2:
                      if (d = e.v, ["633e5b3e-72b7-4536-8e68-40d0b4902cba"].includes(o) && console.log("start debugging"), ["e36a8dd4-c8df-4dfa-b60c-765eeb5b99fd"].includes(o) && console.log("start debugging"), "dataflow" !== u) {
                        e.n = 3;
                        break;
                      }
                      return e.a(2, {
                        _default: d
                      });
                    case 3:
                      if ("lambda" !== u) {
                        e.n = 4;
                        break;
                      }
                      return e.a(2, d);
                    case 4:
                      return console.error("LEAF error: the logical construct built using the ".concat(s.leaf.logic.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(s.leaf.logic.args), ") has an undefined scope ").concat(u, ".")), e.a(2, void 0);
                    case 5:
                      e.n = 7;
                      break;
                    case 6:
                      e.p = 6, p = e.v, console.error("LEAF Error: running _etaReduceLEAFNode() for node type ".concat(a.type, " with runtime scope of ").concat(u, ":"), p);
                    case 7:
                      return e.a(2);
                  }
                }, e, null, [[1, 6]]);
              }));
              return function () {
                return e.apply(this, arguments);
              };
            }();
            return m.etaReduceLEAFNode = Is(a, function () {
              var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
                t = e.nodeuuid,
                n = e.contextuallambda;
              return JSON.stringify([t].concat(xs(n)));
            }), m.etaReduceLEAFNode;
          }
        };
      return m.initTree(a, i, u, c, l), m.sessionid = (0, j.v4)(), m;
    };
  function $s(e) {
    return $s = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, $s(e);
  }
  function Us(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Bs() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _zs(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d33 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d33.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d33.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d33.v = r, _d33.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d33.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d33.n = -1), p(u, c)) : _d33.n = c : _d33.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d33.n < 0) ? c : n.call(r, _d33)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_zs(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _zs(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _zs(s, "constructor", l), _zs(l, "constructor", c), c.displayName = "GeneratorFunction", _zs(l, o, "GeneratorFunction"), _zs(s), _zs(s, o, "Generator"), _zs(s, r, function () {
      return this;
    }), _zs(s, "toString", function () {
      return "[object Generator]";
    }), (Bs = function Bs() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _zs(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _zs = function zs(e, t, n, r) {
      function a(t, n) {
        _zs(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _zs(e, t, n, r);
  }
  function Hs(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Vs(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Hs(Object(n), !0).forEach(function (t) {
        Ws(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Hs(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Ws(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != $s(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != $s(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == $s(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Qs(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Ks(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Qs(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Qs(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Xs = {
    dataflow: function dataflow(e) {
      return Ks(Bs().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return Bs().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              if (r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda) {
                t.n = 1;
                break;
              }
              throw "LEAF error: the logical construct built using the ".concat(o.leaf.logic.type, " node ") + "(".concat(r, ") called with args (").concat(JSON.stringify(o.leaf.logic.args), ") has ") + "a leaflambdagraph node (".concat(r, ") referencing an undefined lambda construct.");
            case 1:
              return t.n = 2, qs({
                refnode: r,
                nodelambda: i,
                contextuallambda: a,
                etaTree: e.gos.etaTree
              });
            case 2:
              return u = t.v, t.a(2, function (e, t) {
                return "_default" in u ? Vs(Vs({}, u._default(e, t)), {}, {
                  _control: t
                }) : e.length > 0 ? Vs(Vs({}, D(e)), {}, {
                  _control: t
                }) : void 0;
              });
          }
        }, t);
      }));
    },
    lambda: function lambda(e) {
      return Ks(Bs().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c = arguments;
        return Bs().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                refnode: r,
                nodelambda: a,
                contextuallambda: o,
                etaTree: e.gos.etaTree
              });
            case 1:
              return i = t.v, u = {}, Object.entries(i).map(function (e) {
                var t,
                  n,
                  r = (n = 2, function (e) {
                    if (Array.isArray(e)) return e;
                  }(t = e) || function (e, t) {
                    var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                    if (null != n) {
                      var r,
                        o,
                        a,
                        i,
                        u = [],
                        c = !0,
                        l = !1;
                      try {
                        if (a = (n = n.call(e)).next, 0 === t) {
                          if (Object(n) !== n) return;
                          c = !1;
                        } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                      } catch (e) {
                        l = !0, o = e;
                      } finally {
                        try {
                          if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                        } finally {
                          if (l) throw o;
                        }
                      }
                      return u;
                    }
                  }(t, n) || function (e, t) {
                    if (e) {
                      if ("string" == typeof e) return Us(e, t);
                      var n = {}.toString.call(e).slice(8, -1);
                      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Us(e, t) : void 0;
                    }
                  }(t, n) || function () {
                    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                  }()),
                  o = r[0],
                  a = r[1];
                u[o] = function (e, t) {
                  return Vs(Vs({}, a(e, t)), {}, {
                    _control: t
                  });
                };
              }), t.a(2, u);
          }
        }, t);
      }));
    }
  };
  function Zs(e) {
    return Zs = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Zs(e);
  }
  function Ys(e) {
    return function (e) {
      if (Array.isArray(e)) return ed(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || function (e, t) {
      if (e) {
        if ("string" == typeof e) return ed(e, t);
        var n = {}.toString.call(e).slice(8, -1);
        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ed(e, t) : void 0;
      }
    }(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function ed(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function td(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function nd(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? td(Object(n), !0).forEach(function (t) {
        rd(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : td(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function rd(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Zs(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Zs(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Zs(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function od() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _ad(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d34 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d34.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d34.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d34.v = r, _d34.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d34.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d34.n = -1), p(u, c)) : _d34.n = c : _d34.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d34.n < 0) ? c : n.call(r, _d34)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_ad(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _ad(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _ad(s, "constructor", l), _ad(l, "constructor", c), c.displayName = "GeneratorFunction", _ad(l, o, "GeneratorFunction"), _ad(s), _ad(s, o, "Generator"), _ad(s, r, function () {
      return this;
    }), _ad(s, "toString", function () {
      return "[object Generator]";
    }), (od = function od() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _ad(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _ad = function ad(e, t, n, r) {
      function a(t, n) {
        _ad(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _ad(e, t, n, r);
  }
  function id(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function ud(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          id(a, r, o, i, u, "next", e);
        }
        function u(e) {
          id(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var cd = function cd(e) {
      return Object.keys(e).map(function (t) {
        return 0 === Object.keys(e[t]).length ? t : void 0;
      }).filter(function (e) {
        return e;
      }).sort();
    },
    ld = function ld(e) {
      return ud(od().m(function e() {
        var t,
          n,
          r,
          o,
          a,
          i,
          u,
          c,
          l = arguments;
        return od().w(function (e) {
          for (;;) switch (e.n) {
            case 0:
              if (n = (t = l.length > 0 && void 0 !== l[0] ? l[0] : {}).refnode, r = t.spellbook, o = t.spellname, t.lambdalut, a = t.contextuallambda, i = t.etaTree, "530acdcf-067d-4868-ba0c-b7a83e6edfdf" === n && console.log("start debugging"), !(o in r)) {
                e.n = 2;
                break;
              }
              return u = r[o], "accio" === o && "39c9" === n.slice(0, 4) && console.log("debug time", u, r), e.n = 1, i.etaReduceLEAFNode({
                nodeuuid: u,
                contextuallambda: a
              });
            case 1:
              return c = e.v, "530acdcf-067d-4868-ba0c-b7a83e6edfdf" === n && console.log("start debugging"), "accio" === o && "39c9" === n.slice(0, 4) && console.log("debug time"), e.a(2, c);
            case 2:
              return console.log("lookupSpellBook couldn't find the spellname", o), e.a(2, void 0);
            case 3:
              return e.a(2);
          }
        }, e);
      }));
    },
    fd = {
      dataflow: function dataflow(e) {
        return ud(od().m(function t() {
          var o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y,
            g,
            v,
            w,
            O = arguments;
          return od().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return i = (a = O.length > 0 && void 0 !== O[0] ? O[0] : {}).refnode, u = a.refnodedata, c = a.nodelambda, l = a.contextuallambda, ["0b62c9db-f889-4bf8-9773-c7b93ba9bd3f"].includes(i) && console.log("start debugging"), f = u.leaf.logic.args.spellname, s = "{*}" === f, "menudata" === f && console.log("start debugging"), d = l, t.n = 1, qs({
                  refnode: i,
                  nodelambda: c,
                  contextuallambda: d,
                  etaTree: e.gos.etaTree
                });
              case 1:
                if (p = t.v, !((b = cd(p)).length > 0)) {
                  t.n = 3;
                  break;
                }
                return d = d.concat(b), t.n = 2, qs({
                  refnode: i,
                  nodelambda: c,
                  contextuallambda: d,
                  etaTree: e.gos.etaTree
                });
              case 2:
                p = t.v;
              case 3:
                return ["b490aada-daab-4322-9001-14aea8bcb3d3", "97fa68cf-bcc5-44cf-8311-ffa6a1422ac3", "abb18b4d-b8af-4349-949d-fae21bc142ef", "e9536f42-df6d-4086-a643-5f3c0b02aac9", "b5a20ce3-3e67-42cd-9f60-3f70c6acd269", "59fe3646-b338-4ab0-a8a6-d6ad401be4fa"].includes(i) && console.log("start debugging"), m = void 0, y = ld(), g = function () {
                  var t = ud(od().m(function t() {
                    var n, r, o, a, u, c, l, s, b;
                    return od().w(function (t) {
                      for (;;) switch (t.n) {
                        case 0:
                          if (console.log("parseSpellBook:", f, i, e.gos.etaTree.domain + "/" + e.gos.etaTree.appid, " parsing..."), f) {
                            t.n = 1;
                            break;
                          }
                          return console.error("LEAF Error: spellname undefined, refnode: ".concat(i, " at ").concat(e.gos.etaTree.domain, "/").concat(e.gos.etaTree.appid)), t.a(2, void 0);
                        case 1:
                          if (null !== globalThis && void 0 !== globalThis && globalThis.DEBUG && (n = e.gos.etaTree.domain + "/" + e.gos.etaTree.appid + "/" + f + "/" + i, globalThis.trace[n] ? globalThis.trace[n].push("parsing") : globalThis.trace[n] = ["parsing"]), ["2293da4a-b517-4b0b-b396-cb030dc05900"].includes(i) && console.log("start debugging"), ["e9536f42-df6d-4086-a643-5f3c0b02aac9"].includes(i) && console.log("start debugging"), "7435" === i.slice(0, 4) && console.log("debug time"), "c96a" === i.slice(0, 4) && console.log("start debugging"), (r = void 0) || p && f in p && (r = p[f]), r) {
                            t.n = 3;
                            break;
                          }
                          return o = e.user.spellbook, a = e.user.lambdalut, t.n = 2, y({
                            refnode: i,
                            spellbook: o,
                            spellname: f,
                            lambdalut: a,
                            contextuallambda: d,
                            etaTree: e.gos.etaTree
                          });
                        case 2:
                          r = t.v;
                        case 3:
                          if (r) {
                            t.n = 5;
                            break;
                          }
                          return u = e.gos.stdlambdalut, c = e.gos.standardSpellbook, t.n = 4, y({
                            refnode: i,
                            spellbook: c,
                            spellname: f,
                            lambdalut: u,
                            contextuallambda: d,
                            etaTree: e.gos.etaTree
                          });
                        case 4:
                          r = t.v;
                        case 5:
                          if (r) {
                            t.n = 7;
                            break;
                          }
                          return l = e.gos.curatedlambdalut, s = e.gos.curatedSpellbook, t.n = 6, y({
                            refnode: i,
                            spellbook: s,
                            spellname: f,
                            lambdalut: l,
                            contextuallambda: d,
                            etaTree: e.gos.etaTree
                          });
                        case 6:
                          r = t.v;
                        case 7:
                          if (["e9536f42-df6d-4086-a643-5f3c0b02aac9"].includes(i) && console.log("start debugging"), console.log("parseSpellBook:", f, i, e.gos.etaTree.domain + "/" + e.gos.etaTree.appid, " parsed", r), null !== globalThis && void 0 !== globalThis && globalThis.DEBUG && (b = e.gos.etaTree.domain + "/" + e.gos.etaTree.appid + "/" + f + "/" + i, globalThis.trace[b] ? globalThis.trace[b].push("parsed") : globalThis.trace[b] = ["parsed"]), "initialize" === f && console.log("start debugging"), (m = r) && "_default" in m) {
                            t.n = 8;
                            break;
                          }
                          return console.error("LEAF Error: _leafspell() called with spellname ".concat(f, " is missing a default dataflow component graph definition.")), t.a(2, void 0);
                        case 8:
                          return t.a(2, r);
                      }
                    }, t);
                  }));
                  return function () {
                    return t.apply(this, arguments);
                  };
                }(), v = {
                  codebase: "leafspell.js",
                  refnode: i,
                  leafnode: null === (o = e.gos.etaTree) || void 0 === o || null === (o = o.leafgraph) || void 0 === o ? void 0 : o.graph.dataflow.getNodeAttributes(i).leafnode.data
                }, w = s ? void 0 : Op(g(), 3e4, "leafspell.js", "LEAF Error: resolving transformation.leaflogic timed out", v), t.a(2, function (t, o) {
                  var a = function a(e) {
                      return "b5a20ce3-3e67-42cd-9f60-3f70c6acd269" === i && console.log("start debugging"), e;
                    },
                    u = function u(e) {
                      return "b5a20ce3-3e67-42cd-9f60-3f70c6acd269" === i && console.log("start debugging"), e;
                    },
                    c = function () {
                      var e = ud(od().m(function e(t, r, c) {
                        var l, s;
                        return od().w(function (e) {
                          for (;;) switch (e.n) {
                            case 0:
                              return e.n = 1, t;
                            case 1:
                              if (void 0 !== (l = e.v)) {
                                e.n = 2;
                                break;
                              }
                              return console.error("LEAF Error: dataflow triggered for an undefined spell"), e.a(2, void 0);
                            case 2:
                              if (void 0 === l || "function" == typeof (null == l ? void 0 : l._default)) {
                                e.n = 3;
                                break;
                              }
                              return console.error("spell def could not be resolved: ", l), e.a(2, void 0);
                            case 3:
                              return s = jp(nd(nd({}, o), {}, {
                                _stream: r.pipe((0, n.map)(function (e) {
                                  return void 0 === e.sid ? e.sid = [i] : e.sid.includes(i) || e.sid.push(i), e;
                                }))
                              }), [{
                                _stream: c
                              }], void 0, nd(nd({}, v), {}, {
                                metastep: "executing parsed spell in the flow: " + f
                              }), {
                                leaflogic: l._default,
                                datalogic: {
                                  pre: a,
                                  post: u
                                }
                              }), e.a(2, s._control._stream.pipe((0, n.withLatestFrom)(s._stream), (0, n.map)(function (e) {
                                var t;
                                return null === (t = e[0].sid) || void 0 === t || t.pop(), e;
                              }), (0, n.finalize)(function () {
                                console.log("spell stream _executeSpell: finalizing stream 4 spell, ", f);
                              })));
                          }
                        }, e);
                      }));
                      return function (t, n, r) {
                        return e.apply(this, arguments);
                      };
                    }(),
                    l = jp(o, t, void 0, nd(nd({}, v), {}, {
                      metastep: "executing spell " + f
                    }), {
                      leaflogic: s ? function (t, o) {
                        var a = new r.Subject(),
                          i = new r.Subject(),
                          u = new r.Subject(),
                          l = new r.Subject(),
                          s = new r.Subject(),
                          d = void 0,
                          p = t.length > 1 ? r.merge.apply(void 0, Ys(t.map(function (e) {
                            return e._stream;
                          }))) : t[0]._stream,
                          b = o._stream.pipe((0, n.withLatestFrom)(p), (0, n.switchMap)(function (t) {
                            var n = t[1];
                            if (h(n) && "cast-spell" === n._bname) {
                              var r,
                                o = n._content.nodeuuid,
                                a = n._content.input,
                                s = e.gos.etaTree.leafgraph.graph.dataflow.nodes().includes(o) ? e.gos.etaTree : e.gos.etaTree.hostEtaTree,
                                p = null == s ? void 0 : s.leafgraph.graph.dataflow.getNodeAttributes(o).leafnode.data;
                              if (console.log("spellleaf generic: ", p), ["leafspelldef", "leaflabel"].includes(null == p || null === (r = p.leaf) || void 0 === r || null === (r = r.logic) || void 0 === r ? void 0 : r.type)) {
                                var b = p.leaf.logic.args.spellname;
                                w = e.gos.etaTree.lookupLEAFNodeMethods(o), console.log("spell stream: subscribing runtime spell, ", b), c(w, i, u).then(function (e) {
                                  void 0 === e ? (u.next(t[1]), i.next(t[0])) : (d = e.subscribe({
                                    next: function next(e) {
                                      console.log("leafspell ".concat(f, " output: ").concat(e)), l.next(e);
                                    },
                                    error: function error(e) {
                                      console.error("leafspell ".concat(f, " had an error in the subscription stream: ").concat(e));
                                    },
                                    complete: function complete() {
                                      console.log("leafspell ".concat(f, " subscription completed."));
                                    }
                                  }), setTimeout(function () {
                                    u.next(a), i.next(t[0]);
                                  }, 1));
                                });
                              } else u.next(t[1]), i.next(t[0]);
                            } else u.next(t[1]), i.next(t[0]);
                            return l;
                          }), (0, n.withLatestFrom)(l), (0, n.map)(function (e) {
                            return a.next(e[1][1]), s.next(e[1][0]), e[1];
                          }), (0, n.withLatestFrom)(s), (0, n.map)(function (e) {
                            return e[1];
                          }), (0, n.finalize)(function () {
                            console.log("spell stream: finalizing spell, ", f), void 0 !== d && (console.log("spell stream: unsubscribing spell, ", f), d.unsubscribe(), d = void 0);
                          }), (0, n.share)());
                        return {
                          _stream: a,
                          _control: nd(nd({}, o), {}, {
                            _stream: b
                          })
                        };
                      } : function (e, t) {
                        console.log("start debugging");
                        var o = new r.Subject(),
                          a = new r.Subject(),
                          i = new r.Subject(),
                          u = new r.Subject(),
                          l = new r.Subject(),
                          s = void 0,
                          d = t._stream.pipe(n.withLatestFrom.apply(void 0, Ys(e.map(function (e) {
                            return e._stream;
                          }))), (0, n.switchMap)(function (e) {
                            return void 0 === s && w ? (console.log("spell stream: subscribing spell, ", f), f || console.error("undefined spellname: ", JSON.stringify(v)), c(w, a, i).then(function (t) {
                              void 0 === t ? (i.next(e[1]), a.next(e[0])) : (s = t.subscribe({
                                next: function next(e) {
                                  console.log("leafspell ".concat(f, " output: ").concat(e)), u.next(e);
                                },
                                error: function error(e) {
                                  console.error("leafspell ".concat(f, " had an error in the subscription stream: ").concat(e));
                                },
                                complete: function complete() {
                                  console.log("leafspell ".concat(f, " subscription completed."));
                                }
                              }), setTimeout(function () {
                                i.next(e[1]), a.next(e[0]);
                              }, 1));
                            })) : (i.next(e[1]), a.next(e[0])), u;
                          }), (0, n.withLatestFrom)(u), (0, n.map)(function (e) {
                            return o.next(e[1][1]), l.next(e[1][0]), e[1];
                          }), (0, n.withLatestFrom)(l), (0, n.map)(function (e) {
                            return e[1];
                          }), (0, n.finalize)(function () {
                            console.log("spell stream: finalizing spell, ", f), void 0 !== s && (console.log("spell stream: unsubscribing spell, ", f), s.unsubscribe(), s = void 0);
                          }), (0, n.share)());
                        return {
                          _stream: o,
                          _control: nd(nd({}, t), {}, {
                            _stream: d
                          })
                        };
                      },
                      datalogic: {
                        pre: a,
                        post: u
                      }
                    });
                  return {
                    _stream: l._stream.pipe((0, n.map)(function (e) {
                      return e;
                    }), (0, n.share)()),
                    _control: {
                      _stream: l._control._stream.pipe((0, n.map)(function (e) {
                        return e;
                      }), (0, n.share)())
                    }
                  };
                });
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return ud(od().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y,
            g,
            v,
            h = arguments;
          return od().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (r = (n = h.length > 0 && void 0 !== h[0] ? h[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, u = o.leaf.logic.args.spellname, l = {}, f = i, c = void 0) {
                  t.n = 4;
                  break;
                }
                return t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: i,
                  etaTree: e.gos.etaTree
                });
              case 1:
                if (l = t.v, !((s = cd(l)).length > 0)) {
                  t.n = 3;
                  break;
                }
                return f = f.concat(s), t.n = 2, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: f,
                  etaTree: e.gos.etaTree
                });
              case 2:
                l = t.v;
              case 3:
                l && u in l && (c = l[u]);
              case 4:
                if (d = ld(), c) {
                  t.n = 6;
                  break;
                }
                return p = e.user.spellbook, b = e.user.lambdalut, t.n = 5, d({
                  refnode: r,
                  spellbook: p,
                  spellname: u,
                  lambdalut: b,
                  contextuallambda: f,
                  etaTree: e.gos.etaTree
                });
              case 5:
                c = t.v;
              case 6:
                if (c) {
                  t.n = 8;
                  break;
                }
                return m = e.gos.stdlambdalut, y = e.gos.standardSpellbook, t.n = 7, d({
                  refnode: r,
                  spellbook: y,
                  spellname: u,
                  lambdalut: m,
                  contextuallambda: f,
                  etaTree: e.gos.etaTree
                });
              case 7:
                c = t.v;
              case 8:
                if (c) {
                  t.n = 10;
                  break;
                }
                return g = e.gos.curatedlambdalut, v = e.gos.curatedSpellbook, t.n = 9, d({
                  refnode: r,
                  spellbook: v,
                  spellname: u,
                  lambdalut: g,
                  contextuallambda: f,
                  etaTree: e.gos.etaTree
                });
              case 9:
                c = t.v;
              case 10:
                return t.a(2, c);
            }
          }, t);
        }));
      }
    };
  function sd(e) {
    return sd = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, sd(e);
  }
  function dd() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _pd(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d35 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d35.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d35.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d35.v = r, _d35.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d35.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d35.n = -1), p(u, c)) : _d35.n = c : _d35.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d35.n < 0) ? c : n.call(r, _d35)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_pd(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _pd(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _pd(s, "constructor", l), _pd(l, "constructor", c), c.displayName = "GeneratorFunction", _pd(l, o, "GeneratorFunction"), _pd(s), _pd(s, o, "Generator"), _pd(s, r, function () {
      return this;
    }), _pd(s, "toString", function () {
      return "[object Generator]";
    }), (dd = function dd() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _pd(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _pd = function pd(e, t, n, r) {
      function a(t, n) {
        _pd(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _pd(e, t, n, r);
  }
  function bd(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function md(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? bd(Object(n), !0).forEach(function (t) {
        yd(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : bd(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function yd(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != sd(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != sd(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == sd(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function gd(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function vd(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          gd(a, r, o, i, u, "next", e);
        }
        function u(e) {
          gd(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var hd = {
    dataflow: function dataflow(e) {
      return vd(dd().m(function e() {
        var t,
          n = arguments;
        return dd().w(function (e) {
          for (;;) if (0 === e.n) return (t = n.length > 0 && void 0 !== n[0] ? n[0] : {}).refnode, t.refnodedata, t.nodelambda, t.contextuallambda, console.error("LEAF Error: leafspelldef does not have any dataflow-plane-scoped functions."), e.a(2, function (e, t) {
            return md(md({}, D(e)), {}, {
              _control: t
            });
          });
        }, e);
      }));
    },
    lambda: function lambda(e) {
      return vd(dd().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c,
          l,
          f,
          _s2,
          d,
          p = arguments;
        return dd().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = p.length > 0 && void 0 !== p[0] ? p[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, u = a.filter(function (t) {
                return "lambda" === e.gos.etaTree.graphcomponents.components.lut[t].scope;
              }), c = a.filter(function (t) {
                return "dataflow" === e.gos.etaTree.graphcomponents.components.lut[t].scope;
              }), t.n = 1, qs({
                refnode: r,
                nodelambda: u,
                contextuallambda: i,
                etaTree: e.gos.etaTree,
                addnodelut: !0,
                metadata: {
                  codebase: "leafspelldef.js",
                  context: "reduced_lambdalambda_obj"
                }
              });
            case 1:
              return l = t.v, t.n = 2, qs({
                refnode: r,
                nodelambda: c,
                contextuallambda: i,
                etaTree: e.gos.etaTree,
                metadata: {
                  codebase: "leafspelldef.js",
                  context: "reduced_defaultlambda_obj",
                  spellname: o.leaf.logic.args.spellname
                }
              });
            case 2:
              return f = t.v, d = md(md({}, (_s2 = function s(e) {
                return e ? Object.keys(e).reduce(function (t, n) {
                  return "_nodelut" !== n && ("object" === sd(e[n]) ? t[n] = _s2(e[n]) : t[n] = e[n]), t;
                }, {}) : {};
              })(l)), _s2(f)), t.a(2, d);
          }
        }, t);
      }));
    },
    methods: function methods(e) {
      return vd(dd().m(function t() {
        var n,
          r,
          o,
          a,
          i,
          u,
          c,
          l,
          f,
          _s3,
          d,
          p = arguments;
        return dd().w(function (t) {
          for (;;) switch (t.n) {
            case 0:
              return r = (n = p.length > 0 && void 0 !== p[0] ? p[0] : {}).refnode, o = n.refnodedata, a = n.nodelambda, i = n.contextuallambda, u = a.filter(function (t) {
                return "lambda" === e.gos.etaTree.graphcomponents.components.lut[t].scope;
              }), c = a.filter(function (t) {
                return "dataflow" === e.gos.etaTree.graphcomponents.components.lut[t].scope;
              }), t.n = 1, qs({
                refnode: r,
                nodelambda: u,
                contextuallambda: i,
                etaTree: e.gos.etaTree,
                addnodelut: !0,
                metadata: {
                  codebase: "leafspelldef.js",
                  context: "reduced_lambdalambda_obj"
                }
              });
            case 1:
              return l = t.v, t.n = 2, qs({
                refnode: r,
                nodelambda: c,
                contextuallambda: i,
                etaTree: e.gos.etaTree,
                metadata: {
                  codebase: "leafspelldef.js",
                  context: "reduced_defaultlambda_obj",
                  spellname: o.leaf.logic.args.spellname
                }
              });
            case 2:
              return f = t.v, d = md(md({}, (_s3 = function s(e) {
                return e ? Object.keys(e).reduce(function (t, n) {
                  return "_nodelut" !== n && ("object" === sd(e[n]) ? t[n] = _s3(e[n]) : t[n] = e[n]), t;
                }, {}) : {};
              })(l)), _s3(f)), t.a(2, d);
          }
        }, t);
      }));
    }
  };
  function wd(e) {
    return wd = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, wd(e);
  }
  function Od() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _d37(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d36 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d36.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d36.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d36.v = r, _d36.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d36.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d36.n = -1), p(u, c)) : _d36.n = c : _d36.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d36.n < 0) ? c : n.call(r, _d36)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_d37(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _d37(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _d37(s, "constructor", l), _d37(l, "constructor", c), c.displayName = "GeneratorFunction", _d37(l, o, "GeneratorFunction"), _d37(s), _d37(s, o, "Generator"), _d37(s, r, function () {
      return this;
    }), _d37(s, "toString", function () {
      return "[object Generator]";
    }), (Od = function Od() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _d37(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _d37 = function _d(e, t, n, r) {
      function a(t, n) {
        _d37(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _d37(e, t, n, r);
  }
  function jd(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Sd(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? jd(Object(n), !0).forEach(function (t) {
        kd(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : jd(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function kd(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != wd(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != wd(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == wd(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Td(e) {
    return function (e) {
      if (Array.isArray(e)) return Pd(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || Ed(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Ed(e, t) {
    if (e) {
      if ("string" == typeof e) return Pd(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Pd(e, t) : void 0;
    }
  }
  function Pd(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Ad(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function xd(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Ad(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Ad(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var Nd = re("error", {
      type: "critical",
      message: "LEAF core error: race condition detected in leafloopyspell.js",
      codebase: "/src/ghostos/api/parser/nodelogic/abstraction/leafloopyspell.js"
    }, {}),
    Fd = function Fd() {
      var e = 0;
      return function (t) {
        var n = Date.now();
        return n - e >= t && (e = n, !0);
      };
    },
    Id = function Id(e) {
      if (!e) return 1;
      if (!(Object.keys(e).filter(function (e) {
        return "&" === e;
      }).length > 0)) {
        var t = Object.keys(e).filter(function (e) {
          return /^\d+$/.test(e);
        }).map(function (e) {
          return parseInt(e);
        }).sort();
        return t.length > 0 ? t[t.length - 1] : 1;
      }
    },
    Ld = {
      dataflow: function dataflow(e) {
        return xd(Od().m(function t() {
          var o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y = arguments;
          return Od().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (a = (o = y.length > 0 && void 0 !== y[0] ? y[0] : {}).refnode, i = o.refnodedata, u = o.nodelambda, c = o.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(i.leaf.logic.type, " node ") + "(".concat(a, ") called with args (").concat(JSON.stringify(i.leaf.logic.args), ").");
              case 1:
                return ["7b1f"].includes(a.slice(0, 4)) && console.log("start debugging"), t.n = 2, qs({
                  refnode: a,
                  nodelambda: u,
                  contextuallambda: c,
                  etaTree: e.gos.etaTree
                });
              case 2:
                if (l = t.v, ["7b1f"].includes(a.slice(0, 4)) && console.log("start debugging"), f = "bypass" in l, s = {
                  codebase: "leafloopyspell.js",
                  refnode: a,
                  leafnode: e.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(a).leafnode.data
                }, d = Id(l), p = "forever" in l, b = Fd(), m = Fd(), !l || !("_default" in l)) {
                  t.n = 3;
                  break;
                }
                return t.a(2, function (e, t) {
                  ["7b1f"].includes(null == a ? void 0 : a.slice(0, 4)) && console.log("start debugging");
                  var o = {
                    _stream: t._stream.pipe((0, n.map)(function (e) {
                      return b(200) ? (console.log("spell executed"), e) : void console.log("spell throttled");
                    }), (0, n.filter)(function (e) {
                      return void 0 !== e;
                    }), (0, n.concatMap)(function (e) {
                      return (0, r.from)(Td(Array(d).keys())).pipe((0, n.map)(function (t) {
                        return Sd(Sd({}, e), {}, {
                          _label: Sd(Sd({}, e._label), {}, {
                            loopyidx: t
                          })
                        });
                      }));
                    }))
                  };
                  if (!l || !("_default" in l)) return console.error("LEAF Error: _leafloopyspell() called without a default dataflow component graph definition."), jp(o, e, void 0, Sd(Sd({}, s), {}, {
                    metastep: "relaying input data as is due to error condition"
                  }));
                  var i = 0,
                    u = [],
                    c = new r.BehaviorSubject(Nd),
                    m = new r.ReplaySubject(1),
                    y = void 0,
                    g = o._stream.pipe((0, n.switchMap)(function (e) {
                      return y = e, c.next(e), c;
                    }), (0, n.takeUntil)(m));
                  return jp({
                    _stream: g
                  }, e, void 0, Sd(Sd({}, s), {}, {
                    metastep: "executing a loopy spell with idx " + i
                  }), {
                    leaflogic: l._default,
                    datalogic: {
                      pre: function pre(e) {
                        var t = e;
                        return f || u.push(e), t;
                      },
                      post: function post(e) {
                        if (i += 1, (p || i < d) && c.next(y), !f) return u[0];
                        if ("stream" in l) return e;
                        if (u.push(e), i === d) {
                          var t = Td(u);
                          return u = [], i = 0, t;
                        }
                      }
                    }
                  });
                });
              case 3:
                if (!l || !("await" in l)) {
                  t.n = 4;
                  break;
                }
                return t.a(2, function (e, t) {
                  var o = {
                    _stream: t._stream.pipe((0, n.map)(function (e) {
                      return m(10) ? (console.log("spell executed"), e) : void console.log("spell throttled");
                    }), (0, n.filter)(function (e) {
                      return void 0 !== e;
                    }), (0, n.map)(function (e) {
                      return Td(Array(d).keys()).map(function (t) {
                        return Sd(Sd({}, e), {}, {
                          _label: Sd(Sd({}, e._label), {}, {
                            loopyidx: t
                          })
                        });
                      });
                    }))
                  };
                  if (!l["await"] || !("_default" in l["await"])) return console.error("LEAF Error: _leafloopyspell() in await mode called without a default dataflow component graph definition."), jp(o, e, void 0, Sd(Sd({}, s), {}, {
                    metastep: "relaying input data as is due to error condition"
                  }));
                  var a = 0,
                    i = [],
                    u = function u(e) {
                      var t = e;
                      return f || i.push(e), t;
                    },
                    c = new r.Subject(),
                    p = new r.Subject(),
                    b = new r.Subject(),
                    y = new r.Subject(),
                    g = new r.Subject(),
                    v = void 0,
                    h = void 0,
                    w = new r.Subject(),
                    O = new r.Subject(),
                    _ = l["await"]._default([{
                      _stream: w
                    }], {
                      _stream: O
                    }),
                    j = o._stream.pipe(n.withLatestFrom.apply(void 0, Td(e.map(function (e) {
                      return e._stream;
                    }))), (0, n.switchMap)(function (e) {
                      var t = e[0],
                        r = e[1];
                      if (v = t, void 0 !== h && !h.closed) return p.next(r), c.next(t), g;
                      a = 0, i = [], b.next(), console.log("establishing a new loopyloop op subs");
                      var o,
                        m = jp({
                          _stream: c
                        }, [{
                          _stream: p
                        }], void 0, Sd(Sd({}, s), {}, {
                          metastep: "executing a loopy spell with idx " + a
                        }), {
                          datalogic: {
                            pre: u,
                            post: function post(e) {
                              if (a += 1, !f) return i[0];
                              if ("stream" in l) return e;
                              if (i.push(e), a === d) {
                                var t = Td(i);
                                return i = [], a = 0, 1 === d ? t[0] : t;
                              }
                            }
                          }
                        });
                      return h = m._control._stream.pipe((0, n.withLatestFrom)(m._stream), (0, n.switchMap)(function (e) {
                        return o = e, w.next(e[1]), O.next(e[0]), _._control._stream;
                      }), (0, n.withLatestFrom)(_._control._stream), (0, n.withLatestFrom)(_._stream), (0, n.map)(function (e) {
                        return e[1];
                      }), (0, n.map)(function (e) {
                        return console.log("_exit_cond"), e && (console.log("leafloopyspell exit condition met, stopping loopy spell subscription..."), y.next(o[1]), v = o[0], b.next()), e;
                      }), (0, n.takeUntil)(b)).subscribe({
                        next: function next(e) {
                          console.log("leafloopyspell in await mode had a leaf mesg _combined_in arrive: ", e);
                        },
                        error: function error(e) {
                          console.error("leafloopyspell in await mode had an error: ", e);
                        },
                        complete: function complete() {
                          console.log("leafloopyspell in await mode had completed");
                        }
                      }), p.next(r), c.next(t), g;
                    }), (0, n.map)(function (e) {
                      return e;
                    }), (0, n.finalize)(function () {
                      console.log("Finally"), void 0 !== h && (h.unsubscribe(), h = void 0);
                    }), (0, n.filter)(function (e) {
                      return void 0 !== e;
                    }), (0, n.share)());
                  return {
                    _stream: l["final"] && "_default" in l["final"] ? y.pipe((0, n.filter)(function (e) {
                      return JSON.stringify(Sd(Sd({}, e), {}, {
                        _label: {}
                      })) !== JSON.stringify(Nd);
                    }), (0, n.switchMap)(function (e) {
                      return gp(l["final"]._default, e);
                    }), (0, n.map)(function (e) {
                      return setTimeout(function () {
                        g.next(v);
                      }, 0), e;
                    }), (0, n.share)()) : y.pipe((0, n.filter)(function (e) {
                      return JSON.stringify(Sd(Sd({}, e), {}, {
                        _label: {}
                      })) !== JSON.stringify(Nd);
                    }), (0, n.map)(function (e) {
                      return setTimeout(function () {
                        g.next(v);
                      }, 0), e;
                    }), (0, n.share)()),
                    _control: {
                      _stream: j.pipe((0, n.map)(function (e) {
                        return e;
                      }), (0, n.share)())
                    }
                  };
                });
              case 4:
                return console.error("LEAF Error: _leafloopyspell() called (".concat(a, ") is missing a default dataflow component graph definition.")), t.a(2, function (e, t) {
                  return Sd(Sd({}, D(e)), {}, {
                    _control: t
                  });
                });
              case 5:
                return t.a(2);
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return xd(Od().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c = arguments;
          return Od().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                return r = (n = c.length > 0 && void 0 !== c[0] ? c[0] : {}).refnode, n.refnodedata, o = n.nodelambda, a = n.contextuallambda, t.n = 1, qs({
                  refnode: r,
                  nodelambda: a,
                  contextuallambda: o,
                  etaTree: e.gos.etaTree
                });
              case 1:
                return i = t.v, u = {}, Object.entries(i).map(function (e) {
                  var t,
                    n,
                    r = (n = 2, function (e) {
                      if (Array.isArray(e)) return e;
                    }(t = e) || function (e, t) {
                      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
                      if (null != n) {
                        var r,
                          o,
                          a,
                          i,
                          u = [],
                          c = !0,
                          l = !1;
                        try {
                          if (a = (n = n.call(e)).next, 0 === t) {
                            if (Object(n) !== n) return;
                            c = !1;
                          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
                        } catch (e) {
                          l = !0, o = e;
                        } finally {
                          try {
                            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
                          } finally {
                            if (l) throw o;
                          }
                        }
                        return u;
                      }
                    }(t, n) || Ed(t, n) || function () {
                      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }()),
                    o = r[0],
                    a = r[1];
                  u[o] = function (e, t) {
                    var n = D(e);
                    return Sd(Sd({}, a([n], t)), {}, {
                      _control: t
                    });
                  };
                }), t.a(2, u);
            }
          }, t);
        }));
      }
    };
  function Dd(e) {
    return Dd = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Dd(e);
  }
  function Gd(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Cd(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Gd(Object(n), !0).forEach(function (t) {
        Md(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Gd(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Md(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Dd(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Dd(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Dd(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  function Rd() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _qd(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d38 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d38.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d38.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d38.v = r, _d38.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d38.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d38.n = -1), p(u, c)) : _d38.n = c : _d38.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d38.n < 0) ? c : n.call(r, _d38)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_qd(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _qd(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _qd(s, "constructor", l), _qd(l, "constructor", c), c.displayName = "GeneratorFunction", _qd(l, o, "GeneratorFunction"), _qd(s), _qd(s, o, "Generator"), _qd(s, r, function () {
      return this;
    }), _qd(s, "toString", function () {
      return "[object Generator]";
    }), (Rd = function Rd() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _qd(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _qd = function qd(e, t, n, r) {
      function a(t, n) {
        _qd(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _qd(e, t, n, r);
  }
  function Jd(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function $d(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Jd(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Jd(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function Ud(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || function (e, t) {
      if (e) {
        if ("string" == typeof e) return Bd(e, t);
        var n = {}.toString.call(e).slice(8, -1);
        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Bd(e, t) : void 0;
      }
    }(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Bd(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  var zd = c("leafgraph"),
    Hd = function Hd(e) {
      return "string" == typeof e && e.toLowerCase().startsWith("github/");
    },
    Vd = function Vd(e) {
      if ("string" != typeof e) return e;
      var t = e.indexOf("?");
      if (-1 === t) return e;
      var n = e.slice(0, t),
        r = e.slice(t + 1);
      if (0 === r.length) return "".concat(n, "?");
      var o = r.split("&").map(function (e) {
        if (!e) return e;
        var t = Ud(e.split("="), 1)[0];
        return t ? "".concat(t, "=REDACTED") : "REDACTED";
      }).join("&");
      return "".concat(n, "?").concat(o);
    },
    Wd = function Wd(e) {
      var t = e.indexOf("/");
      return t <= 0 || t === e.length - 1 ? null : {
        graph_domain: e.slice(0, t).toLowerCase(),
        graph_appid: e.slice(t + 1)
      };
    },
    Qd = function Qd(e, t) {
      if (!e) return null;
      if (e.startsWith("/")) {
        var n = e.slice(1);
        return n ? {
          graph_domain: t,
          graph_appid: n
        } : null;
      }
      var r = e.indexOf("/");
      return -1 === r ? {
        graph_domain: e.toLowerCase(),
        graph_appid: "index"
      } : 0 === r || r === e.length - 1 ? null : {
        graph_domain: e.slice(0, r).toLowerCase(),
        graph_appid: e.slice(r + 1)
      };
    },
    Kd = function () {
      var e = $d(Rd().m(function e(t, n, r, o, a, i, u, c, l, f) {
        var s,
          d,
          p,
          b,
          m,
          y,
          g,
          v,
          h = arguments;
        return Rd().w(function (e) {
          for (;;) switch (e.n) {
            case 0:
              return d = h.length > 10 && void 0 !== h[10] && h[10], console.log("graphRefUpdateHandler(): ", a, Vd(i)), e.n = 1, null === (s = Le(l)) || void 0 === s ? void 0 : s.parseGraphEtaTree(a, i);
            case 1:
              return void 0 === (p = e.v) && console.log("start debugging"), b = p.leafgraph, m = p.graphcomponents, y = p.graphcomponents.components.nodegroups.runtime[0], g = function () {
                var e = $d(Rd().m(function e() {
                  var t, a, i, u;
                  return Rd().w(function (e) {
                    for (;;) switch (e.n) {
                      case 0:
                        if (t = {}, 0 !== b.graph.lambda.nodes().filter(function (e) {
                          "undefined" !== e && void 0 !== e || console.log("start debugging");
                          var t = b.graph.lambda.getNodeAttributes(e).leafnode.data.leaf.logic,
                            n = t.type,
                            a = t.args;
                          return "leafgraph" === n && _ge(zd.editorconfig.namedatakey, a).toLowerCase() === r + "/" + o;
                        }).length) {
                          e.n = 5;
                          break;
                        }
                        if (a = [], !y) {
                          e.n = 2;
                          break;
                        }
                        return ["2ee89b44-16af-472f-97d4-47ae65f064c8"].includes(n) && console.log("start debugging"), e.n = 1, Rs({
                          refnode: "leafgraph",
                          component_members: y,
                          contextuallambda: f,
                          etaTree: p
                        });
                      case 1:
                        t._default = e.v;
                      case 2:
                        if (!d || void 0 === m.leafconfig) {
                          e.n = 4;
                          break;
                        }
                        return i = p.etaReduceLEAFNode({
                          nodeuuid: m.leafconfig,
                          contextuallambda: f
                        }), e.n = 3, i;
                      case 3:
                        u = e.v, t._leafconfig = u.leafconfig;
                      case 4:
                        return Object.entries(m.spelldefs).map(function (e) {
                          var n = Ud(e, 2),
                            r = n[0],
                            o = n[1],
                            i = p.etaReduceLEAFNode({
                              nodeuuid: o,
                              contextuallambda: f
                            });
                          i.then(function (e) {
                            t[r] = e;
                          }), a.push(i);
                        }), e.n = 5, Promise.all(a);
                      case 5:
                        return e.a(2, t);
                    }
                  }, e);
                }));
                return function () {
                  return e.apply(this, arguments);
                };
              }(), v = g(), e.a(2, v);
          }
        }, e);
      }));
      return function (t, n, r, o, a, i, u, c, l, f) {
        return e.apply(this, arguments);
      };
    }(),
    Xd = {
      dataflow: function dataflow(e) {
        return $d(Rd().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y,
            g = arguments;
          return Rd().w(function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (r = (n = g.length > 0 && void 0 !== g[0] ? g[0] : {}).refnode, o = n.refnodedata, n.nodelambda, a = n.contextuallambda) {
                  t.n = 1;
                  break;
                }
                throw "LEAF error: the logical construct built using the ".concat(o.leaf.logic.type, " node ") + "(".concat(r, ") called with args (").concat(JSON.stringify(o.leaf.logic.args), ").");
              case 1:
                if (i = o.leaf.logic.args, u = _ge(zd.editorconfig.namedatakey, i), c = u.toLowerCase(), l = Hd(u) ? u : c, f = Wd(l)) {
                  t.n = 2;
                  break;
                }
                return console.error("LEAF Error: _leafgraph(): an invalid graph address (".concat(l, ") entered.")), t.a(2, {});
              case 2:
                if (s = f.graph_domain, d = f.graph_appid, p = e.gos.etaTree.domain, b = e.gos.etaTree.appid, s + "/" + d == p + "/" + b) {
                  t.n = 4;
                  break;
                }
                return m = Kd(e, r, p, b, s, d, e.gos.leafio, e.gos.etaTree.mnemosyne, e.gos.etaTree, a), t.n = 3, m;
              case 3:
                return y = t.v, t.a(2, function (e, t) {
                  if (y) return Cd(Cd({}, y._default(e, t)), {}, {
                    _control: t
                  });
                  console.error("LEAF Error: _leafgraph(): the leafnode was used before the graph retrieval from leaflake finished.");
                });
              case 4:
                return console.error("LEAF Error: _leafgraph(): a self-referring leafgraph (".concat(r, ") is not allowed.")), t.a(2, function (e) {
                  return Cd(Cd({}, D(e)), {}, {
                    _control: void 0
                  });
                });
              case 5:
                return t.a(2);
            }
          }, t);
        }));
      },
      lambda: function lambda(e) {
        return $d(Rd().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y,
            g,
            v = arguments;
          return Rd().w(function (t) {
            for (;;) switch (t.p = t.n) {
              case 0:
                if (r = (n = v.length > 0 && void 0 !== v[0] ? v[0] : {}).refnode, o = n.refnodedata, n.nodelambda, a = n.contextuallambda, i = o.leaf.logic.args, u = _ge(zd.editorconfig.namedatakey, i), c = u.toLowerCase(), l = Hd(u) ? u : c, f = e.gos.etaTree.domain, s = Qd(l, f)) {
                  t.n = 1;
                  break;
                }
                return console.error("LEAF Error: _leafgraph(): an invalid graph address (".concat(l, ") entered.")), t.a(2, {});
              case 1:
                if (d = e.gos.etaTree.appid, p = s.graph_domain, b = s.graph_appid, "breezyforest" !== p && p + "/" + b == f + "/" + d) {
                  t.n = 5;
                  break;
                }
                return t.p = 2, "editor" === b && console.log("start debugging"), ["3be30006-5b56-4b27-8eaa-249c6a46a557"].includes(r) && console.log("start debugging"), m = Kd(e, r, f, d, p, b, e.gos.leafio, e.gos.etaTree.mnemosyne, e.gos.etaTree, a), t.n = 3, m;
              case 3:
                return y = t.v, t.a(2, y);
              case 4:
                return t.p = 4, g = t.v, console.error("leafgraph.lambda:", g), t.a(2, void 0);
              case 5:
                return console.error("LEAF Error: _leafgraph(): a self-referring leafgraph (".concat(r, ") is not allowed.")), t.a(2, {});
              case 6:
                return t.a(2);
            }
          }, t, null, [[2, 4]]);
        }));
      },
      _lambda: function _lambda(e) {
        return $d(Rd().m(function t() {
          var n,
            r,
            o,
            a,
            i,
            u,
            c,
            l,
            f,
            s,
            d,
            p,
            b,
            m,
            y,
            g,
            v = arguments;
          return Rd().w(function (t) {
            for (;;) switch (t.p = t.n) {
              case 0:
                if (r = (n = v.length > 0 && void 0 !== v[0] ? v[0] : {}).refnode, o = n.refnodedata, n.nodelambda, a = n.contextuallambda, i = o.leaf.logic.args, u = _ge(zd.editorconfig.namedatakey, i), c = u.toLowerCase(), l = Hd(u) ? u : c, f = e.gos.etaTree.domain, s = Qd(l, f)) {
                  t.n = 1;
                  break;
                }
                return console.error("LEAF Error: _leafgraph(): an invalid graph address (".concat(l, ") entered.")), t.a(2, {});
              case 1:
                if (d = e.gos.etaTree.appid, p = s.graph_domain, b = s.graph_appid, "breezyforest" !== p && p + "/" + b == f + "/" + d) {
                  t.n = 5;
                  break;
                }
                return t.p = 2, "editor" === b && console.log("start debugging"), ["3be30006-5b56-4b27-8eaa-249c6a46a557"].includes(r) && console.log("start debugging"), m = Kd(e, r, f, d, p, b, e.gos.leafio, e.gos.etaTree.mnemosyne, e.gos.etaTree, a, !0), t.n = 3, m;
              case 3:
                return y = t.v, t.a(2, y);
              case 4:
                return t.p = 4, g = t.v, console.error("leafgraph.lambda:", g), t.a(2, void 0);
              case 5:
                return console.error("LEAF Error: _leafgraph(): a self-referring leafgraph (".concat(r, ") is not allowed.")), t.a(2, {});
              case 6:
                return t.a(2);
            }
          }, t, null, [[2, 4]]);
        }));
      },
      methods: function methods(e) {
        return $d(Rd().m(function e() {
          var t,
            n = arguments;
          return Rd().w(function (e) {
            for (;;) if (0 === e.n) return (t = n.length > 0 && void 0 !== n[0] ? n[0] : {}).refnode, t.refnodedata, t.nodelambda, t.contextuallambda, e.a(2, {});
          }, e);
        }));
      }
    };
  function Zd() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Yd(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d39 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d39.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d39.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d39.v = r, _d39.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d39.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d39.n = -1), p(u, c)) : _d39.n = c : _d39.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d39.n < 0) ? c : n.call(r, _d39)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Yd(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Yd(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Yd(s, "constructor", l), _Yd(l, "constructor", c), c.displayName = "GeneratorFunction", _Yd(l, o, "GeneratorFunction"), _Yd(s), _Yd(s, o, "Generator"), _Yd(s, r, function () {
      return this;
    }), _Yd(s, "toString", function () {
      return "[object Generator]";
    }), (Zd = function Zd() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Yd(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Yd = function Yd(e, t, n, r) {
      function a(t, n) {
        _Yd(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Yd(e, t, n, r);
  }
  function ep(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function tp(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ep(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ep(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var np = {
    dataflow: function dataflow(e) {
      return tp(Zd().m(function e() {
        var t,
          n,
          r,
          o = arguments;
        return Zd().w(function (e) {
          for (;;) if (0 === e.n) return n = (t = o.length > 0 && void 0 !== o[0] ? o[0] : {}).refnode, r = t.refnodedata, t.nodelambda, t.contextuallambda, console.error("LEAF error: the logical construct built using the ".concat(r.leaf.logic.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(r.leaf.logic.args), ") cannot ") + "be defined as a dataflow-scoped node."), e.a(2, void 0);
        }, e);
      }));
    },
    lambda: function lambda(e) {
      return tp(Zd().m(function e() {
        var t,
          n,
          r,
          o = arguments;
        return Zd().w(function (e) {
          for (;;) if (0 === e.n) return n = (t = o.length > 0 && void 0 !== o[0] ? o[0] : {}).refnode, r = t.refnodedata, t.nodelambda, t.contextuallambda, console.error("LEAF error: the logical construct built using the ".concat(r.leaf.logic.type, " node ") + "(".concat(n, ") called with args (").concat(JSON.stringify(r.leaf.logic.args), ") cannot ") + "be defined as a lambda-scoped node."), e.a(2, void 0);
        }, e);
      }));
    }
  };
  function rp(e) {
    return rp = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, rp(e);
  }
  function op(e) {
    return function (e) {
      if (Array.isArray(e)) return ap(e);
    }(e) || function (e) {
      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
    }(e) || function (e, t) {
      if (e) {
        if ("string" == typeof e) return ap(e, t);
        var n = {}.toString.call(e).slice(8, -1);
        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ap(e, t) : void 0;
      }
    }(e) || function () {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function ap(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function ip() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _up(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d40 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d40.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d40.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d40.v = r, _d40.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d40.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d40.n = -1), p(u, c)) : _d40.n = c : _d40.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d40.n < 0) ? c : n.call(r, _d40)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_up(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _up(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _up(s, "constructor", l), _up(l, "constructor", c), c.displayName = "GeneratorFunction", _up(l, o, "GeneratorFunction"), _up(s), _up(s, o, "Generator"), _up(s, r, function () {
      return this;
    }), _up(s, "toString", function () {
      return "[object Generator]";
    }), (ip = function ip() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _up(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _up = function up(e, t, n, r) {
      function a(t, n) {
        _up(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _up(e, t, n, r);
  }
  function cp(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function lp(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          cp(a, r, o, i, u, "next", e);
        }
        function u(e) {
          cp(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function fp(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function sp(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? fp(Object(n), !0).forEach(function (t) {
        dp(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : fp(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function dp(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != rp(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != rp(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == rp(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  u.breezyforest._version;
  var pp = function pp(e, t) {
      var n = new p(),
        r = new p(),
        o = new p(),
        a = void 0;
      e.forEach(function (e) {
        var i = JSON.parse(_.Buffer.from(e.data, "base64").toString("utf-8"));
        "leafdeckspade" === i.leaf.logic.type && (a = e.uuid), n.addNode(e.uuid, {
          leafnode: sp(sp({}, e), {}, {
            data: i
          }),
          lambdactrl: {
            gos: {
              standardSpellBook: {},
              curatedSpellBook: {},
              masterSubsDirectory: t
            },
            user: {
              spellbook: {},
              config: i
            }
          }
        }), r.addNode(e.uuid, {
          leafnode: sp(sp({}, e), {}, {
            data: i
          }),
          lambdactrl: {
            gos: t,
            user: i
          }
        }), o.addNode(e.uuid, {
          leafnode: sp(sp({}, e), {}, {
            data: i
          }),
          lambdactrl: {
            gos: t,
            user: i
          }
        });
      });
      var i = new Set(),
        u = new Set(),
        c = new Set(),
        l = new Set(),
        f = {},
        s = new Set();
      return e.forEach(function (e) {
        e.out_edges.forEach(function (e, t) {
          var a = JSON.parse(_.Buffer.from(e.data, "base64").toString("utf-8")).leaf;
          if ("leafdataedge" === a.logic.type) n.edge(e.source.uuid, e.target.uuid) ? console.error("duplicate edge data detected linking ".concat(e.source.uuid, " and ").concat(e.target.uuid)) : (n.addEdgeWithKey(e.uuid, e.source.uuid, e.target.uuid, a), o.addEdgeWithKey(e.uuid, e.source.uuid, e.target.uuid, a), i.add(e.source.uuid), u.add(e.target.uuid));else if ("leaflambdaedge" === a.logic.type) {
            if ("9935" === e.source.uuid.slice(0, 4)) {
              var d = JSON.parse(_.Buffer.from(e.data, "base64").toString("utf-8"));
              return void console.log("start debugging", d);
            }
            r.addEdgeWithKey(e.uuid, e.source.uuid, e.target.uuid, a), o.addEdgeWithKey(e.uuid, e.source.uuid, e.target.uuid, a), c.add(e.source.uuid), l.add(e.target.uuid), f[e.target.uuid] = e.target.uuid in f ? [e.source.uuid].concat(f[e.target.uuid]) : [e.source.uuid];
          } else "leafanchoredge" === a.logic.type && s.add(e.target.uuid);
        });
      }), {
        graph: {
          lambda: r,
          dataflow: n
        },
        thespade: {
          uuid: a
        },
        edges: {
          data: {
            sources: i,
            targets: u
          },
          lambda: {
            sources: c,
            targets: l,
            sourcelut: f
          },
          anchor: {
            targets: s
          }
        }
      };
    },
    bp = function bp(e) {
      console.time("analyzeLEAFGraph");
      var t = [],
        n = [],
        r = [],
        o = function (e) {
          if (null === (t = e) || "object" !== y(t) || "function" != typeof t.addUndirectedEdgeWithKey || "function" != typeof t.dropNode || "boolean" != typeof t.multi) throw new Error("connectedComponents: the given graph is not a valid graphology instance.");
          var t;
          if (!e.order) return [];
          var n = new g(e),
            r = n.push.bind(n),
            o = [];
          return n.forEachNodeYetUnseen(function (t) {
            var a,
              i = [];
            for (n.push(t); 0 !== n.size;) a = n.pop(), i.push(a), e.forEachNeighbor(a, r);
            o.push(i);
          }), o;
        }(e.graph.dataflow),
        a = function a(t, n, r, o, _a3) {
          var i = sp({}, _a3);
          return t.forEach(function (t) {
            i[t] = {
              idx: n,
              scope: r,
              category: o,
              metadata: e.graph.dataflow._nodes.get(t).attributes.leafnode.data.leaf.logic
            };
          }), i;
        },
        i = {},
        u = {},
        c = void 0;
      return o.forEach(function (o) {
        if (function (e, t) {
          return e.some(function (e) {
            return t.edges.anchor.targets.has(e) || "leafanchor" === t.graph.lambda.getNodeAttributes(e).leafnode.data.leaf.logic.type;
          });
        }(o, e)) r.push(o);else {
          var l = function (e, t) {
              return e.some(function (e) {
                return "36cd" === e.slice(0, 4) && console.log(e), t.edges.lambda.sources.has(e);
              });
            }(o, e),
            f = function (e, t) {
              return e.filter(function (e) {
                return "leafspelldef" === t.graph.lambda.getNodeAttributes(e).leafnode.data.leaf.logic.type;
              }).length > 0;
            }(o, e),
            s = function (e, t) {
              return e.filter(function (e) {
                return "leafconfig" === t.graph.lambda.getNodeAttributes(e).leafnode.data.leaf.logic.type;
              }).length > 0;
            }(o, e);
          if (l || f || s) {
            var d = n.push(o) - 1,
              p = void 0;
            if (!function (e) {
              return e.length > 1;
            }(o) ? function (e, t) {
              return 1 === e.length && e.every(function (e) {
                var n = t.graph.lambda.getNodeAttributes(e).leafnode;
                return !["leafinflowport", "leafoutflowport"].includes(n.data.leaf.logic.type);
              });
            }(o, e) ? p = "lambda" : console.error("LEAF Error: analyzeLEAFGraph(): the lambda dataflow component (idx: ".concat(d, ") is NOT defined with the scope of either the dataflow plane or the lambda plane.")) : p = "dataflow", i = a(o, d, p, "lambda", i), f) {
              var b = e.graph.dataflow.getNodeAttributes(o[0]).leafnode.data;
              u[b.leaf.logic.args.spellname] = o[0];
            } else s && (c = o[0]);
          } else if (function (e, t) {
            return e.every(function (e) {
              return !t.edges.lambda.sources.has(e);
            }) && e.every(function (e) {
              return t.edges.data.sources.has(e) || t.edges.data.targets.has(e);
            });
          }(o, e)) {
            var m = t.push(o);
            i = a(o, m - 1, "dataflow", "main", i);
          } else console.info("LEAF Error: analyzeLEAFGraph():", JSON.stringify(o), " is an unknown component.");
        }
      }), console.timeEnd("analyzeLEAFGraph"), {
        spelldefs: u,
        leafconfig: c,
        components: {
          nodegroups: {
            runtime: t,
            lambda: n,
            anchored: r
          },
          lut: i
        }
      };
    },
    mp = re("error", {
      type: "critical",
      message: "LEAF core error: race condition detected in leaf.js",
      codebase: "/src/ghostos/api/parser/leaf.js"
    }, {}),
    yp = re("accio", "ctrl_accio", {
      provenance: "executeLEAFLogic"
    }),
    gp = function () {
      var e = lp(ip().m(function e(t, o) {
        var a,
          i,
          u,
          c,
          l,
          f,
          s,
          d = arguments;
        return ip().w(function (e) {
          for (;;) switch (e.n) {
            case 0:
              if (a = d.length > 2 && void 0 !== d[2] ? d[2] : {}, i = d.length > 4 && void 0 !== d[4] ? d[4] : void 0, u = new r.Subject(), c = new r.Subject(), !(l = t([{
                _stream: u
              }], {
                _stream: c,
                _config: a
              }))) {
                e.n = 2;
                break;
              }
              return f = (0, r.firstValueFrom)(l._control._stream.pipe((0, n.withLatestFrom)(l._stream), (0, n.map)(function (e) {
                return e[1];
              }))), u.next(o), i ? c.next(i) : c.next(yp), e.n = 1, f;
            case 1:
              return s = e.v, e.a(2, s);
            case 2:
              return e.a(2, void 0);
          }
        }, e);
      }));
      return function (t, n) {
        return e.apply(this, arguments);
      };
    }(),
    vp = re("accio", "ctrl_accio", {
      provenance: "subscribeToLEAFLogic"
    }),
    hp = function () {
      var e = lp(ip().m(function e(t, o, a, i) {
        var u, c, l, f, s;
        return ip().w(function (e) {
          for (;;) switch (e.n) {
            case 0:
              u = new r.BehaviorSubject(sp(sp({}, mp), {}, {
                _label: {
                  at: "leaf.js subscribeToLEAFLogic data stream"
                }
              })), c = new r.BehaviorSubject(sp(sp({}, mp), {}, {
                _label: {
                  at: "leaf.js subscribeToLEAFLogic ctrl stream"
                }
              })), u.next(o), c.next(vp), l = t([{
                _stream: u
              }], {
                _stream: c,
                _config: a
              }), f = void 0, s = l ? l._control._stream.pipe((0, n.switchMap)(function (e) {
                return f = e, l._stream;
              }), (0, n.map)(function (e) {
                return [f, e];
              }), (0, n.takeUntil)(i)).subscribe({
                next: function next(e) {
                  console.log("inner next: ", e);
                },
                error: function error(e) {
                  console.error("Error: " + e);
                },
                complete: function complete() {
                  console.log("subs complete");
                }
              }) : void 0, console.log(s);
            case 1:
              return e.a(2);
          }
        }, e);
      }));
      return function (t, n, r, o) {
        return e.apply(this, arguments);
      };
    }(),
    wp = function wp(e, t, r, o, a) {
      var i = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : void 0,
        u = {
          _stream: o,
          _config: a
        };
      if (r) {
        if (!r.runtime) {
          var c = function () {
            var o = lp(ip().m(function o() {
              return ip().w(function (o) {
                for (;;) switch (o.n) {
                  case 0:
                    e([{
                      _stream: t
                    }], u)._stream.pipe((0, n.map)(function (e) {
                      var t,
                        n = i ? ((t = new Object())[i] = e, t) : e;
                      return console.log(n), r && r.subject$.next(n), n;
                    })).subscribe({
                      next: function next(e) {
                        console.log("leaf.js output$inst.runtime leaflogic subs: ", e);
                      },
                      complete: function complete() {
                        console.log("leaf.js output$inst.runtime leaflogic subs completed.");
                      }
                    });
                  case 1:
                    return o.a(2);
                }
              }, o);
            }));
            return function () {
              return o.apply(this, arguments);
            };
          }();
          r.runtime = c();
        }
        return {
          _stream: r.subject$
        };
      }
      return e([{
        _stream: t
      }], u);
    };
  globalThis.TRACEON = !0, globalThis.TRACESIZE = 30;
  var Op = function Op(e, t, n, r, o) {
      var a;
      return Promise.race([e, new Promise(function (e, i) {
        return a = setTimeout(function () {
          var t = re("error", {
            type: "timeout",
            message: r,
            codebase: n,
            metadata: o
          });
          console.error(r, t), e(t);
        }, t, r);
      })])["finally"](function () {
        return clearTimeout(a);
      });
    },
    _p = function _p(e, t) {
      var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
      return globalThis.TRACEON ? (n && console.log("leaf.js trace: ", JSON.stringify(t)), Array.isArray(e) ? [].concat(op(e), [{
        timestamp: Date.now(),
        trace: t
      }]) : void 0 === e ? [{
        timestamp: Date.now(),
        trace: t
      }] : void console.log("start debugging")) : e || [];
    },
    jp = function jp(e, t, o) {
      var a,
        i,
        u = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {},
        c = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : {
          leaflogic: void 0,
          datalogic: {
            pre: void 0,
            post: void 0
          }
        },
        l = new r.Subject(),
        f = new r.Subject(),
        s = new r.Subject(),
        d = void 0;
      ["e9e6e44b-792b-46d0-b1d3-58ce2f46c45b", "c822ae2e-1be8-46be-b2cb-21a43cef0555", "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91"].includes(u.refnode) && console.log("start debugging");
      var p = c.leaflogic;
      void 0 !== p && "function" != typeof p && console.log("start debugging");
      var b = void 0 !== p ? p([{
          _stream: s
        }], {
          _stream: void 0 !== o ? (0, r.merge)(f, o) : f,
          _config: sp({}, e._config)
        }) : {
          _stream: s,
          _control: {
            _stream: f,
            _config: sp(sp({}, e._config), {}, {
              traces: _p(null === (a = e._config) || void 0 === a ? void 0 : a.traces, u)
            })
          }
        },
        m = t.length > 1 ? r.merge.apply(void 0, op(t.map(function (e) {
          return e._stream;
        }))) : t[0]._stream,
        y = e._stream.pipe((0, n.withLatestFrom)(m), (0, n.switchMap)(function (e) {
          var n, r;
          ["806e0a4b-badf-42a0-85af-5ad306385c58"].includes(u.refnode) && console.log("start debugging"), t.length > 1 && console.error("start debugging");
          var o = e[0],
            a = void 0 !== (null === (n = c.datalogic) || void 0 === n ? void 0 : n.pre) ? c.datalogic.pre(e[1]) : e[1],
            i = sp(sp({}, d = 1 === (null == o ? void 0 : o.length) ? o[0] : o), {}, {
              traces: _p(null === (r = d) || void 0 === r ? void 0 : r.traces, sp(sp({}, u), {}, {
                at: "leaf.js driveDataflowByCtrlflow, initial switch-mapping of the ctrl signal to drive dataflow through a resolved leaflogic"
              }), !0)
            });
          return setTimeout(function () {
            s.next(a), f.next(i);
          }, 1), b._control._stream;
        }), (0, n.withLatestFrom)(b._control._stream), (0, n.withLatestFrom)(b._stream), (0, n.map)(function (e) {
          return [e[0][1], e[1]];
        }), (0, n.map)(function (e) {
          var t;
          "a9a46a08-110a-4c44-ac83-3caaf40623c5" === u.refnode && console.log("_combined_in to be registered in nodeflowinterface", u.refnode, e), ["38567c62-7513-4ec3-9011-2fcf6c51ec7b"].includes(u.refnode) && console.log("start debugging");
          var n = void 0 !== (null === (t = c.datalogic) || void 0 === t ? void 0 : t.post) ? c.datalogic.post(e[1]) : e[1],
            r = Array.isArray(n) ? n.filter(function (e) {
              return void 0 !== e;
            }) : void 0 !== n ? n : void 0;
          return void 0 !== r && (l.next(r), console.log("leaf.js driveDataflowByCtrlflow, _data signal emitted", u, e), console.log("leaf.js driveDataflowByCtrlflow, relaying ctrl signal")), e[0];
        }), (0, n.map)(function (e) {
          return e;
        }), (0, n.share)());
      return {
        _stream: l.pipe((0, n.filter)(function (e) {
          return JSON.stringify(sp(sp({}, e), {}, {
            _label: {}
          })) !== JSON.stringify(mp);
        }), (0, n.share)()),
        _control: {
          _stream: y.pipe((0, n.map)(function (e) {
            return ["e9e6e44b-792b-46d0-b1d3-58ce2f46c45b", "c822ae2e-1be8-46be-b2cb-21a43cef0555"].includes(u.refnode) && console.log("start debugging"), e;
          }), (0, n.share)()),
          _config: sp(sp({}, e._config), {}, {
            traces: _p(null === (i = e._config) || void 0 === i ? void 0 : i.traces, u)
          })
        }
      };
    },
    Sp = function () {
      var e = lp(ip().m(function e(t, n, r) {
        var o, a, i, u, c, l, f, s;
        return ip().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return o = {
                gos: {
                  standardSpellbook: {},
                  curatedSpellbook: {},
                  stdlambdalut: {},
                  curatedlambdalut: {},
                  leafio: n.leafio,
                  etaTree: n
                },
                user: {
                  spellbook: {},
                  lambdalut: {}
                }
              }, a = o.gos.etaTree, i = a.domain, u = a.appid, c = {
                graphuuid: "",
                domain: i,
                appid: u,
                graphaddrstr: t
              }, e.p = 1, l = Xd.lambda(o)({
                refnode: r,
                refnodedata: {
                  leaf: {
                    logic: {
                      args: c
                    }
                  }
                },
                nodelambda: [],
                contextuallambda: []
              }), e.n = 2, l;
            case 2:
              return f = e.v, console.log(f), e.a(2, f);
            case 3:
              return e.p = 3, s = e.v, console.error(s), e.a(2, {});
          }
        }, e, null, [[1, 3]]);
      }));
      return function (t, n, r) {
        return e.apply(this, arguments);
      };
    }();
  require("graphql/language/index.mjs");
  var kp = function kp(e) {
    return !e || e && "Object" !== e.constructor.name ? e : JSON.parse(JSON.stringify(e));
  };
  function Tp(e) {
    return Tp = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Tp(e);
  }
  function Ep() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Pp(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d41 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d41.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d41.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d41.v = r, _d41.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d41.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d41.n = -1), p(u, c)) : _d41.n = c : _d41.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d41.n < 0) ? c : n.call(r, _d41)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Pp(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Pp(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Pp(s, "constructor", l), _Pp(l, "constructor", c), c.displayName = "GeneratorFunction", _Pp(l, o, "GeneratorFunction"), _Pp(s), _Pp(s, o, "Generator"), _Pp(s, r, function () {
      return this;
    }), _Pp(s, "toString", function () {
      return "[object Generator]";
    }), (Ep = function Ep() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Pp(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Pp = function Pp(e, t, n, r) {
      function a(t, n) {
        _Pp(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Pp(e, t, n, r);
  }
  function Ap(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function xp(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          Ap(a, r, o, i, u, "next", e);
        }
        function u(e) {
          Ap(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  function Np(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Fp(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Np(Object(n), !0).forEach(function (t) {
        Ip(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Np(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Ip(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Tp(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Tp(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Tp(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  var Lp = function Lp(e) {
    var t,
      n,
      r = e.endpoint,
      o = e.websocket,
      a = e.headers,
      i = e.hook,
      u = {
        endpoint: r,
        headers: kp(a || {}),
        websocket: Fp(Fp({}, o), {}, {
          endpoint: o && o.endpoint || (t = r, n = t.split("://"), (n[0].includes("https") ? "wss" : "ws") + "://" + n[1]),
          parameters: o && o.parameters || {},
          client: null,
          open: !1,
          subscriptions: {}
        })
      },
      c = function () {
        var e = xp(Ep().m(function e(t, n, r) {
          var o, a, c, l, f, s;
          return Ep().w(function (e) {
            for (;;) switch (e.p = e.n) {
              case 0:
                return o = t.query, a = t.headers, c = Fp(Fp({}, u.headers), a || {}), e.p = 1, console.log("graphql/client.js executeQuery: ", o), e.n = 2, fetch(u.endpoint, {
                  method: "POST",
                  headers: c,
                  credentials: "include",
                  body: o
                });
              case 2:
                return l = e.v, e.n = 3, l.json();
              case 3:
                if (f = e.v, i && i(f), !f.errors) {
                  e.n = 4;
                  break;
                }
                throw r && r(f), f;
              case 4:
                return n && n(f), e.a(2, f);
              case 5:
                e.n = 7;
                break;
              case 6:
                throw e.p = 6, s = e.v, console.log(s), s;
              case 7:
                return e.a(2);
            }
          }, e, null, [[1, 6]]);
        }));
        return function (t, n, r) {
          return e.apply(this, arguments);
        };
      }(),
      l = function () {
        var e = xp(Ep().m(function e() {
          var t, n;
          return Ep().w(function (e) {
            for (;;) switch (e.p = e.n) {
              case 0:
                return e.p = 0, (t = new WebSocket(u.websocket.endpoint, "graphql-ws")).onerror = function (e) {
                  console.log("WebSocket connection error:", e);
                }, t.onclose = function (e) {
                  console.log("WebSocket connection closed:", e);
                }, e.a(2, t);
              case 1:
                throw e.p = 1, n = e.v, console.log(n), new Error("Failed to establish the WebSocket connection: ", n);
              case 2:
                return e.a(2);
            }
          }, e, null, [[0, 1]]);
        }));
        return function () {
          return e.apply(this, arguments);
        };
      }(),
      f = function f(e) {
        u.websocket.client.send(JSON.stringify(e));
      },
      _s4 = function s(e) {
        u.websocket.client = e, u.websocket.shouldRetry && (e.onclose = function () {
          l().then(_s4);
        }), e.addEventListener("open", function () {
          var e = Fp(Fp({}, u.websocket.parameters), {}, {
            headers: Fp(Fp({}, u.headers), u.websocket.parameters.headers)
          });
          f({
            type: "connection_init",
            payload: e
          });
        }), e.addEventListener("message", function (e) {
          !function (e, t) {
            var n,
              r = t.data;
            try {
              r = JSON.parse(r);
            } catch (e) {
              return void console.error("unable to parse event data; unexpected event from server");
            }
            switch (r.type) {
              case "connection_ack":
                return e.onConnectionSuccess && e.onConnectionSuccess(), void (e.open = !0);
              case "connection_error":
                return void (e.onConnectionError && e.onConnectionError(r));
              case "ka":
                return void (e.onConnectionKeepAlive && e.onConnectionKeepAlive());
              case "data":
                return void ((n = e.subscriptions[r.id]) && n.onGraphQLData && n.onGraphQLData(r.payload));
              case "error":
                return void ((n = e.subscriptions[r.id]) && n.onGraphQLError && n.onGraphQLError(r.payload));
              case "connection_terminate":
                return;
              case "complete":
                (n = e.subscriptions[r.id]) && n.onGraphQLComplete && n.onGraphQLComplete(r.payload), delete e.subscriptions[r.id];
                break;
              default:
                console.error("LEAF gql error: unrecognized gql data type ", r.type);
            }
          }(u.websocket, e);
        });
      },
      d = function d() {
        l().then(function (e) {
          console.log("setting websocket for LEAF graphql subscription"), _s4(e);
        })["catch"](function (e) {
          console.error(e);
        });
      };
    return o && d(), {
      query: c,
      subscribe: function subscribe(e, t, n) {
        if (u.websocket.client) {
          var r = e.operationId,
            o = e.subscription,
            a = e.variables,
            i = e.onGraphQLData,
            c = e.onGraphQLError,
            l = e.onGraphQLComplete;
          return u.websocket.subscriptions[r] = {
            onGraphQLData: function onGraphQLData(e) {
              i && i(e), t && t(e);
            },
            onGraphQLComplete: function onGraphQLComplete(e) {
              l && l(e);
            },
            onGraphQLError: function onGraphQLError(e) {
              c && c(e), n && n(e);
            }
          }, f({
            type: "start",
            id: r,
            payload: {
              query: o,
              variables: a || {}
            }
          }), {
            stop: function stop() {
              f({
                type: "stop",
                id: r
              });
            }
          };
        }
        console.log("WebSocket connection has not been established");
      },
      updateHeaders: function updateHeaders(e) {
        u.headers = kp(e), u.websocket.client && l().then(_s4)["catch"](function (e) {
          console.error(e);
        });
      },
      establishWS: d,
      clientContext: u
    };
  };
  function Dp(e) {
    return Dp = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Dp(e);
  }
  function Gp() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _Cp(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d42 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d42.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d42.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d42.v = r, _d42.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d42.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d42.n = -1), p(u, c)) : _d42.n = c : _d42.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d42.n < 0) ? c : n.call(r, _d42)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_Cp(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _Cp(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _Cp(s, "constructor", l), _Cp(l, "constructor", c), c.displayName = "GeneratorFunction", _Cp(l, o, "GeneratorFunction"), _Cp(s), _Cp(s, o, "Generator"), _Cp(s, r, function () {
      return this;
    }), _Cp(s, "toString", function () {
      return "[object Generator]";
    }), (Gp = function Gp() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _Cp(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _Cp = function Cp(e, t, n, r) {
      function a(t, n) {
        _Cp(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _Cp(e, t, n, r);
  }
  function Mp(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function Rp(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function qp(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Rp(Object(n), !0).forEach(function (t) {
        Jp(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Rp(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Jp(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Dp(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Dp(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Dp(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  var $p = G.memoize,
    Up = function Up() {
      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        t = e._domain,
        n = e._appid,
        r = e.filter,
        o = void 0 === r ? {} : r,
        a = e.query;
      return '\n  subscription {\n    graph: getGraph(domain: "'.concat(t, '", appid: "').concat(n, '", filter: ').concat(o, ") ").concat(a, "\n  }\n");
    },
    Bp = function Bp() {
      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        t = (e._appmode, e._hostdomain, e._hostappid, e._domain),
        n = e._appid,
        r = e.filter,
        o = void 0 === r ? {} : r,
        a = e.query;
      return '\n  query {\n    graph: getGraph(domain: "'.concat(t, '", appid: "').concat(n, '", filter: ').concat(o, ") ").concat(a, "\n  }\n");
    },
    zp = {
      dburi_subs: process.env.LEAFGON_ENDPOINT_SUBS || "https://www.leafgon.com/sgraphql",
      dburi_subs_ws: process.env.LEAFGON_WEBSOCKET_SUBS || "wss://www.leafgon.com/sgraphql",
      dburi_qm: process.env.LEAFGON_ENDPOINT_QM || "https://www.leafgon.com/qmgraphql"
    },
    Hp = function Hp() {
      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        t = e._clientConfig,
        n = void 0 === t ? zp : t,
        r = e._metamodel,
        o = void 0 === r ? u.breezyforest : r,
        a = e._sessionid,
        i = void 0 === a ? void 0 : a,
        c = qp(qp({}, zp), n || {}),
        l = c.dburi_subs ? c.dburi_subs : void 0,
        f = c.dburi_subs_ws ? c.dburi_subs_ws : void 0,
        s = c.dburi_qm ? c.dburi_qm : void 0,
        d = c.clientAuthKey ? c.clientAuthKey : void 0,
        p = o.GQLParameters.masterquery,
        b = {
          subscriptions: {},
          subs_methods: {},
          qm_methods: {}
        },
        m = function m() {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = e.gql_subs_client,
            n = e.force;
          (void 0 !== n && n || [WebSocket.CLOSED, WebSocket.CLOSING].includes(t.clientContext.websocket.client.readyState)) && (console.log("LEAF Log: gos.api.leafio.leaflake: WebSocket currently not open or opening. Re-establishing the connection..."), t.establishWS());
        };
      b.gql_qm_client = s && Lp({
        endpoint: s,
        headers: d ? {
          Accept: "application/json",
          "X-API-Key": d
        } : {
          Accept: "application/json"
        }
      });
      var y = new Promise(function (e, t) {
        b.gql_subs_client = l && f ? Lp({
          endpoint: l,
          headers: d ? {
            "Content-Type": "application/json",
            "X-API-Key": d
          } : {
            "Content-Type": "application/json"
          },
          websocket: {
            endpoint: f,
            onConnectionSuccess: function onConnectionSuccess() {
              e("gql_subs_client is connected and ready");
            },
            onConnectionError: function onConnectionError() {
              t("gql_subs_client: Connection Error");
            }
          }
        }) : void 0;
      });
      console.log("gqlsubsclientPromise is made.");
      var g = function () {
          var e,
            t = (e = Gp().m(function e() {
              var t,
                r,
                o,
                a,
                i,
                u,
                c,
                l,
                f = arguments;
              return Gp().w(function (e) {
                for (;;) switch (e.n) {
                  case 0:
                    (t = f.length > 0 && void 0 !== f[0] ? f[0] : {})._appmode, r = t._domain, o = t._appid, a = t.filter, i = void 0 === a ? "{}" : a, u = t.subsCallback, c = t.errorCallback, l = void 0 === c ? void 0 : c, t.variables, y.then(function (e) {
                      var t = function () {
                        for (var e = "", t = 0; t < 5; t++) e += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(62 * Math.random()));
                        return e + (Object.keys(b.subscriptions).length + 1);
                      }();
                      try {
                        console.log(e);
                        var a = b.gql_subs_client.subscribe({
                          operationId: t,
                          subscription: Up({
                            _domain: r,
                            _appid: o,
                            filter: i,
                            query: p
                          }),
                          onGraphQLData: function onGraphQLData(e) {
                            console.log("gql_subs_client: onGraphQLData()", e.data), u && u(e.data);
                          },
                          onGraphQLError: function onGraphQLError(e) {
                            console.log("gql_subs_client: onGraphQLError()", e), t in b.subscriptions && b.subscriptions[t].stop(), l && l(e);
                          },
                          onGraphQLComplete: function onGraphQLComplete(e) {
                            console.log("LEAF Log: gql_subs_client: onGraphQLComplete():", e), n.keepGQLConnected && m({
                              gql_subs_client: b.gql_subs_client,
                              force: !0
                            });
                          }
                        });
                        console.log(a), b.subscriptions[t] = a;
                      } catch (e) {
                        console.log("Error: getGraphSubscription():", e), t in b.subscriptions && b.subscriptions[t].stop();
                      }
                    });
                  case 1:
                    return e.a(2);
                }
              }, e);
            }), function () {
              var t = this,
                n = arguments;
              return new Promise(function (r, o) {
                var a = e.apply(t, n);
                function i(e) {
                  Mp(a, r, o, i, u, "next", e);
                }
                function u(e) {
                  Mp(a, r, o, i, u, "throw", e);
                }
                i(void 0);
              });
            });
          return function () {
            return t.apply(this, arguments);
          };
        }(),
        v = $p(function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = e._appmode,
            n = e._hostdomain,
            r = e._hostappid,
            o = e._domain,
            a = e._appid,
            i = e.filter,
            u = void 0 === i ? "{}" : i,
            c = e.variables;
          return new Promise(function (e, i) {
            var l = {
              endpoint: s,
              query: JSON.stringify({
                query: Bp({
                  _appmode: t,
                  _hostdomain: n,
                  _hostappid: r,
                  _domain: o,
                  _appid: a,
                  filter: u,
                  query: p
                }),
                variables: c || {}
              })
            };
            try {
              b.gql_qm_client.query(l, function (t) {
                "error" in t && console.error("LEAFgon error (critical logical error prevents this app from functioning): ", t.error, JSON.stringify({
                  _hostdomain: n,
                  _hostappid: r,
                  _domain: o,
                  _appid: a
                })), t.data && e({
                  graph: t.data.graph
                });
              });
            } catch (e) {
              console.log("Error getGraphQuery(): ", e), i({});
            }
          });
        }, function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = (e._appmode, e._hostdomain, e._hostappid, e._domain),
            n = e._appid,
            r = e.filter,
            o = void 0 === r ? "{}" : r;
          return e.variables, JSON.stringify([t, n, o, i]);
        });
      return b.gql_subs_client && (b.subs_methods = {
        queryGraph: g,
        clientState: function clientState() {
          return b.gql_subs_client.clientContext.websocket.client.readyState;
        },
        reconnect: function reconnect() {
          m({
            gql_subs_client: b.gql_subs_client
          });
        }
      }), b.gql_qm_client && (b.qm_methods = {
        queryGraph: v,
        addNode: function addNode(e) {
          var t = e.variables,
            n = {
              endpoint: s,
              query: JSON.stringify({
                query: "mutation AddNode($uuid: String!, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {\n  addNode(input: [{uuid: $uuid, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {node {uuid}}\n}",
                variables: t || {}
              })
            };
          try {
            b.gql_qm_client.query(n, function (e) {
              e.data && console.log("mutateAddNode() finished successfully: ", e.data);
            });
          } catch (e) {
            console.log("Error mutateAddNode(): ", e);
          }
        },
        updateNode: function updateNode(e) {
          var t = e.variables,
            n = {
              endpoint: s,
              query: JSON.stringify({
                query: "mutation UpdateNode($uuid: String!, $data: String!) {\n  updateNode(input: {filter: {uuid: {eq: $uuid}}, set: {data: $data}}) {node {uuid}}\n}",
                variables: t || {}
              })
            };
          try {
            b.gql_qm_client.query(n, function (e) {
              e.data && console.log("mutateUpdateNode() finished successfully: ", e.data);
            });
          } catch (e) {
            console.log("Error mutateUpdateNode(): ", e);
          }
        },
        delNode: function delNode(e) {
          var t = e.node_uuid,
            n = {
              endpoint: s,
              query: JSON.stringify({
                query: "mutation DeleteNode($uuid: String!) {\n  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {uuid}}\n}",
                variables: {
                  uuid: t
                }
              }).replace(/\\n/g, "")
            };
          try {
            b.gql_qm_client.query(n, function (e) {
              e.data && console.log("mutateDelNode() finished successfully: ", e.data);
            });
          } catch (e) {
            console.log("Error onElementsRemove(): ", e);
          }
        },
        addEdge: function addEdge(e) {
          var t = e.variables,
            n = {
              endpoint: s,
              query: JSON.stringify({
                query: "mutation AddEdge($uuid: String!, $sourceuuid: String!, $targetuuid: String!, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {\n  addEdge(input: [{uuid: $uuid, source: {uuid: $sourceuuid}, target: {uuid: $targetuuid}, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {edge {uuid}}\n}",
                variables: t || {}
              })
            };
          try {
            b.gql_qm_client.query(n, function (e) {
              e.data && console.log("mutateAddEdge() finished successfully: ", e.data);
            });
          } catch (e) {
            console.log("Error mutateAddEdge(): ", e);
          }
        },
        delEdge: function delEdge(e) {
          var t = e.edge_uuid,
            n = {
              endpoint: s,
              query: JSON.stringify({
                query: "mutation DeleteEdge($uuid: String!) {\n  deleteEdge(efilter: {uuid: {eq: $uuid}}) {edge {uuid}}\n}",
                variables: {
                  uuid: t
                }
              }).replace(/\\n/g, "")
            };
          try {
            b.gql_qm_client.query(n, function (e) {
              e.data && console.log("mutateDelEdge() finished successfully: ", e.data);
            });
          } catch (e) {
            console.log("Error onElementsRemove(): ", e);
          }
        }
      }), b;
    };
  function Vp(e) {
    return Vp = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
      return _typeof(e);
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : _typeof(e);
    }, Vp(e);
  }
  function Wp(e, t) {
    return function (e) {
      if (Array.isArray(e)) return e;
    }(e) || function (e, t) {
      var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
      if (null != n) {
        var r,
          o,
          a,
          i,
          u = [],
          c = !0,
          l = !1;
        try {
          if (a = (n = n.call(e)).next, 0 === t) {
            if (Object(n) !== n) return;
            c = !1;
          } else for (; !(c = (r = a.call(n)).done) && (u.push(r.value), u.length !== t); c = !0);
        } catch (e) {
          l = !0, o = e;
        } finally {
          try {
            if (!c && null != n["return"] && (i = n["return"](), Object(i) !== i)) return;
          } finally {
            if (l) throw o;
          }
        }
        return u;
      }
    }(e, t) || function (e, t) {
      if (e) {
        if ("string" == typeof e) return Qp(e, t);
        var n = {}.toString.call(e).slice(8, -1);
        return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Qp(e, t) : void 0;
      }
    }(e, t) || function () {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }();
  }
  function Qp(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function Kp(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      t && (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })), n.push.apply(n, r);
    }
    return n;
  }
  function Xp(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = null != arguments[t] ? arguments[t] : {};
      t % 2 ? Kp(Object(n), !0).forEach(function (t) {
        Zp(e, t, n[t]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Kp(Object(n)).forEach(function (t) {
        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
      });
    }
    return e;
  }
  function Zp(e, t, n) {
    return (t = function (e) {
      var t = function (e) {
        if ("object" != Vp(e) || !e) return e;
        var t = e[Symbol.toPrimitive];
        if (void 0 !== t) {
          var n = t.call(e, "string");
          if ("object" != Vp(n)) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(e);
      }(e);
      return "symbol" == Vp(t) ? t : t + "";
    }(t)) in e ? Object.defineProperty(e, t, {
      value: n,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = n, e;
  }
  require("react");
  var Yp = function Yp() {
      var e,
        t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        n = (t._LEAFappList, t.stateObjInstanceID),
        r = void 0 === n ? (0, j.v4)() : n,
        o = t.dirOfSubjects,
        a = void 0 === o ? {} : o,
        i = t.permissions,
        c = void 0 === i ? {} : i,
        l = t.metamodel,
        f = void 0 === l ? u : l,
        s = {
          current: JSON.parse(JSON.stringify(f.breezyforest.IOStateGroundZero))
        };
      return s.current.dirOfSubjects = (e = {}, Object.entries(f.breezyforest.subsDirectory).forEach(function (t) {
        var n = Wp(t, 2),
          r = n[0];
        n[1], r in a ? (e[r] = a[r], s.current.permissions[r] = r in c ? c[r] : f.breezyforest.IOAccessPermission.Observer) : (e[r] = {
          main: eb(),
          bridges: {}
        }, s.current.permissions[r] = r in c ? c[r] : f.breezyforest.IOAccessPermission.All), s.current.subscriptions[r] = e[r].main.doSubscribe(function (e) {
          var t = e.control,
            n = e.data;
          s.current.subsCache[r] = {
            control: t,
            data: n
          }, function (e, t, n) {
            e in s.current.callbacks && Object.entries(s.current.callbacks[e]).map(function (e) {
              var r = Wp(e, 2);
              r[0], (0, r[1])({
                control: t,
                data: n
              });
            });
          }(r, t, n);
        });
      }), e), {
        getCurLEAFIOState: function getCurLEAFIOState() {
          return s.current.subsCache;
        },
        getMasterSubsDir: function getMasterSubsDir() {
          return s.current.dirOfSubjects;
        },
        setNewLEAFIOState: function setNewLEAFIOState(e, t) {
          var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : u.breezyforest.originType.FRONTEND;
          try {
            if (s.current.permissions[e] & f.breezyforest.IOAccessPermission.Contributor) return console.log("setting new subs message: ", t, r), s.current.dirOfSubjects[e].main.doWrite({
              control: {
                provenance: {
                  stateObjInstanceID: r,
                  dataOrigin: n
                }
              },
              data: t
            }), !0;
            var o = "leafio: permission not granted for contributing to a subject: " + e;
            return console.error(o), s.current.permissions[e] & f.breezyforest.IOAccessPermission.Contributor;
          } catch (e) {
            return console.error(e), -1;
          }
        },
        setLEAFIOCallback: function setLEAFIOCallback(e, t) {
          var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null;
          e in s.current.subscriptions ? null === n && t in delete s.current.callbacks[e] ? (s.current.callbacks = Xp(Xp({}, s.current.callbacks), {}, Zp({}, e, Xp({}, s.current.callbacks[e]))), delete s.current.callbacks[e][t]) : n && (s.current.callbacks = Xp(Xp({}, s.current.callbacks), {}, Zp({}, e, Xp(Xp({}, s.current.callbacks[e]), {}, Zp({}, t, n))))) : console.error("leafio: an invalid key was used for storing a callback function: ", e);
        },
        destructLEAFIOobj: function destructLEAFIOobj() {
          Object.entries(s.current.subscriptions).forEach(function (e) {
            var t = Wp(e, 2),
              n = t[0],
              r = t[1];
            s.current.dirOfSubjects[n].main.doUnsubscribe(r);
          });
        }
      };
    },
    eb = function eb() {
      var e = {
        handle$: new r.BehaviorSubject(),
        doWrite: function doWrite(t) {
          return e.handle$.next(t);
        },
        doSubscribe: function doSubscribe(t) {
          return e.handle$.pipe((0, r.skip)(1)).subscribe(t);
        },
        doUnsubscribe: function doUnsubscribe(e) {
          return e.unsubscribe();
        },
        doAddAddressee: function doAddAddressee(e, t) {}
      };
      return e;
    },
    tb = function tb(e) {
      var t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : u,
        n = {};
      return Object.entries(t.breezyforest.subsDirectory).forEach(function (e) {
        var t = Wp(e, 2),
          r = t[0];
        t[1], n[r] = {
          main: eb(),
          bridges: {}
        };
      }), [e, n];
    };
  function nb() {
    var e,
      t,
      n = "function" == typeof Symbol ? Symbol : {},
      r = n.iterator || "@@iterator",
      o = n.toStringTag || "@@toStringTag";
    function a(n, r, o, a) {
      var c = r && r.prototype instanceof u ? r : u,
        l = Object.create(c.prototype);
      return _rb(l, "_invoke", function (n, r, o) {
        var a,
          u,
          c,
          l = 0,
          f = o || [],
          s = !1,
          _d43 = {
            p: 0,
            n: 0,
            v: e,
            a: p,
            f: p.bind(e, 4),
            d: function d(t, n) {
              return a = t, u = 0, c = e, _d43.n = n, i;
            }
          };
        function p(n, r) {
          for (u = n, c = r, t = 0; !s && l && !o && t < f.length; t++) {
            var o,
              a = f[t],
              p = _d43.p,
              b = a[2];
            n > 3 ? (o = b === r) && (c = a[(u = a[4]) ? 5 : (u = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((o = n < 2 && p < a[1]) ? (u = 0, _d43.v = r, _d43.n = a[1]) : p < b && (o = n < 3 || a[0] > r || r > b) && (a[4] = n, a[5] = r, _d43.n = b, u = 0));
          }
          if (o || n > 1) return i;
          throw s = !0, r;
        }
        return function (o, f, b) {
          if (l > 1) throw TypeError("Generator is already running");
          for (s && 1 === f && p(f, b), u = f, c = b; (t = u < 2 ? e : c) || !s;) {
            a || (u ? u < 3 ? (u > 1 && (_d43.n = -1), p(u, c)) : _d43.n = c : _d43.v = c);
            try {
              if (l = 2, a) {
                if (u || (o = "next"), t = a[o]) {
                  if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  c = t.value, u < 2 && (u = 0);
                } else 1 === u && (t = a["return"]) && t.call(a), u < 2 && (c = TypeError("The iterator does not provide a '" + o + "' method"), u = 1);
                a = e;
              } else if ((t = (s = _d43.n < 0) ? c : n.call(r, _d43)) !== i) break;
            } catch (t) {
              a = e, u = 1, c = t;
            } finally {
              l = 1;
            }
          }
          return {
            value: t,
            done: s
          };
        };
      }(n, o, a), !0), l;
    }
    var i = {};
    function u() {}
    function c() {}
    function l() {}
    t = Object.getPrototypeOf;
    var f = [][r] ? t(t([][r]())) : (_rb(t = {}, r, function () {
        return this;
      }), t),
      s = l.prototype = u.prototype = Object.create(f);
    function d(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, _rb(e, o, "GeneratorFunction")), e.prototype = Object.create(s), e;
    }
    return c.prototype = l, _rb(s, "constructor", l), _rb(l, "constructor", c), c.displayName = "GeneratorFunction", _rb(l, o, "GeneratorFunction"), _rb(s), _rb(s, o, "Generator"), _rb(s, r, function () {
      return this;
    }), _rb(s, "toString", function () {
      return "[object Generator]";
    }), (nb = function nb() {
      return {
        w: a,
        m: d
      };
    })();
  }
  function _rb(e, t, n, r) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (e) {
      o = 0;
    }
    _rb = function rb(e, t, n, r) {
      function a(t, n) {
        _rb(e, t, function (e) {
          return this._invoke(t, n, e);
        });
      }
      t ? o ? o(e, t, {
        value: n,
        enumerable: !r,
        configurable: !r,
        writable: !r
      }) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
    }, _rb(e, t, n, r);
  }
  function ob(e, t, n, r, o, a, i) {
    try {
      var u = e[a](i),
        c = u.value;
    } catch (e) {
      return void n(e);
    }
    u.done ? t(c) : Promise.resolve(c).then(r, o);
  }
  function ab(e) {
    return function () {
      var t = this,
        n = arguments;
      return new Promise(function (r, o) {
        var a = e.apply(t, n);
        function i(e) {
          ob(a, r, o, i, u, "next", e);
        }
        function u(e) {
          ob(a, r, o, i, u, "throw", e);
        }
        i(void 0);
      });
    };
  }
  var ib = Object.freeze({
      endpoint_subs: process.env.LEAFGON_ENDPOINT_SUBS || "https://www.leafgon.com/sgraphql",
      websocket_subs: process.env.LEAFGON_WEBSOCKET_SUBS || "wss://www.leafgon.com/sgraphql",
      endpoint_qm: process.env.LEAFGON_ENDPOINT_QM || "https://www.leafgon.com/qmgraphql"
    }),
    ub = ib.endpoint_subs,
    cb = ib.websocket_subs,
    lb = ib.endpoint_qm,
    fb = function fb() {
      return {
        endpoint_subs: ub,
        websocket_subs: cb,
        endpoint_qm: lb
      };
    },
    sb = function sb() {
      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        t = e.endpoint_subs,
        n = e.websocket_subs,
        r = e.endpoint_qm;
      return "string" == typeof t && (ub = t), "string" == typeof n && (cb = n), "string" == typeof r && (lb = r), fb();
    },
    db = function () {
      var e = ab(nb().m(function e(t) {
        var n, r, o, a, i, u, c;
        return nb().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return n = t.variables, r = t.endpoint, a = Lp({
                endpoint: o = void 0 === r ? lb : r,
                headers: {
                  Accept: "application/json"
                }
              }), i = {
                endpoint: o,
                query: JSON.stringify({
                  query: "mutation AddNode($uuid: String!, $leafnodetype: String, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {\n  addNode(input: [{uuid: $uuid, leafnodetype: $leafnodetype, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {node {uuid}}\n}",
                  variables: n || {}
                })
              }, e.p = 1, e.n = 2, a.query(i);
            case 2:
              (u = e.v).data && console.log("mutateAddNode(): ", u.data), e.n = 4;
              break;
            case 3:
              e.p = 3, c = e.v, console.log("Error mutateAddNode(): ", c);
            case 4:
              return e.a(2);
          }
        }, e, null, [[1, 3]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }(),
    pb = function () {
      var e = ab(nb().m(function e(t) {
        var n, r, o, a, i, u, c;
        return nb().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return n = t.node_uuid, r = t.endpoint, a = Lp({
                endpoint: o = void 0 === r ? lb : r,
                headers: {
                  Accept: "application/json"
                }
              }), i = {
                endpoint: o,
                query: JSON.stringify({
                  query: "mutation DeleteNode($uuid: String!) {\n  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {uuid}}\n}",
                  variables: {
                    uuid: n
                  }
                }).replace(/\\n/g, "")
              }, e.p = 1, e.n = 2, a.query(i);
            case 2:
              (u = e.v).data && console.log("onElementsRemove(): ", u.data), e.n = 4;
              break;
            case 3:
              e.p = 3, c = e.v, console.log("Error onElementsRemove(): ", c);
            case 4:
              return e.a(2);
          }
        }, e, null, [[1, 3]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }(),
    bb = function () {
      var e = ab(nb().m(function e(t) {
        var n, r, o, a, i, u, c;
        return nb().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return n = t.variables, r = t.endpoint, a = Lp({
                endpoint: o = void 0 === r ? lb : r,
                headers: {
                  Accept: "application/json"
                }
              }), i = {
                endpoint: o,
                query: JSON.stringify({
                  query: "mutation UpdateNode($uuid: String!, $data: String!) {\n  updateNode(input: {filter: {uuid: {eq: $uuid}}, set: {data: $data}}) {node {uuid}}\n}",
                  variables: n || {}
                })
              }, e.p = 1, e.n = 2, a.query(i);
            case 2:
              (u = e.v).data && console.log("mutateUpdateNode(): ", u.data), e.n = 4;
              break;
            case 3:
              e.p = 3, c = e.v, console.log("Error mutateUpdateNode(): ", c);
            case 4:
              return e.a(2);
          }
        }, e, null, [[1, 3]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }(),
    mb = function () {
      var e = ab(nb().m(function e(t) {
        var n, r, o, a, i, u, c;
        return nb().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return n = t.variables, r = t.endpoint, a = Lp({
                endpoint: o = void 0 === r ? lb : r,
                headers: {
                  Accept: "application/json"
                }
              }), i = {
                endpoint: o,
                query: JSON.stringify({
                  query: "mutation AddEdge($uuid: String!, $sourceuuid: String!, $targetuuid: String!, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {\n  addEdge(input: [{uuid: $uuid, source: {uuid: $sourceuuid}, target: {uuid: $targetuuid}, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {edge {uuid}}\n}",
                  variables: n || {}
                })
              }, e.p = 1, e.n = 2, a.query(i);
            case 2:
              (u = e.v).data && console.log("mutateAddEdge(): ", u.data), e.n = 4;
              break;
            case 3:
              e.p = 3, c = e.v, console.log("Error mutateAddEdge(): ", c);
            case 4:
              return e.a(2);
          }
        }, e, null, [[1, 3]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }(),
    yb = function () {
      var e = ab(nb().m(function e(t) {
        var n, r, o, a, i, u, c;
        return nb().w(function (e) {
          for (;;) switch (e.p = e.n) {
            case 0:
              return n = t.edge_uuid, r = t.endpoint, a = Lp({
                endpoint: o = void 0 === r ? lb : r,
                headers: {
                  Accept: "application/json"
                }
              }), i = {
                endpoint: o,
                query: JSON.stringify({
                  query: "mutation DeleteEdge($uuid: String!) {\n  deleteEdge(efilter: {uuid: {eq: $uuid}}) {edge {uuid}}\n}",
                  variables: {
                    uuid: n
                  }
                }).replace(/\\n/g, "")
              }, e.p = 1, e.n = 2, a.query(i);
            case 2:
              (u = e.v).data && console.log("onElementsRemove(): ", u.data), e.n = 4;
              break;
            case 3:
              e.p = 3, c = e.v, console.log("Error onElementsRemove(): ", c);
            case 4:
              return e.a(2);
          }
        }, e, null, [[1, 3]]);
      }));
      return function (t) {
        return e.apply(this, arguments);
      };
    }();
  module.exports = t;
})();
