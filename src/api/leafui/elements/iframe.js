// iframe.js as per https://stackoverflow.com/questions/34743264/how-to-set-iframe-content-of-a-react-component

import React, { Component } from 'react'
import { createPortal } from 'react-dom'
import styles from './iframe.module.css';
import { MutatingDots } from "react-loader-spinner";
import { ErrorBoundary } from "react-error-boundary";

class IFrame extends Component {
  constructor(props) {
    super(props)
    this.state = {
      mountNode: null,
      nodeopacity: 0,
      loadingdisplay: 'flex'
    }
    this.msgcallback = props.msgcallback;
    this.iframeid = props.id;
    this.anchorpoint = props.anchorpoint;

    let srcdoc_base;
    const _leafmsgscript = `<script type='text/javascript'>doiframeio = (message) => window.parent.postMessage({type: 'iframeio', id:'${this.iframeid}', message}, '*'); doelementio = (message) => window.parent.postMessage({type: 'elementio', id: '${this.iframeid}', message}, '*');</script>`;
    const _iframeloadedscript = `<script type='text/javascript'>doiframeio('loaded');</script>`;
    //const html_re = /^(.*)(<\/body>.*)$/;
    const html_re = /^(.*<body>)(.*)(<\/body>.*)$/;
    const srcdoc_re_match = props?.srcDoc?.match(html_re);
    if (srcdoc_re_match) 
        srcdoc_base = srcdoc_re_match[1] + _leafmsgscript + srcdoc_re_match[2] + _iframeloadedscript + srcdoc_re_match[3];
    else
        srcdoc_base = props?.srcDoc;

    if (this.anchorpoint) {
        const _anchorscript = `<script type='text/javascript'>const _offset=window.document.getElementById("${this.anchorpoint}")?.offsetTop;_offset&&window.scrollTo(0,_offset);</script>`;
        const html_re = /^(.*)(<\/body>.*)$/;
        const srcdoc_re_match = srcdoc_base.match(html_re);
        if (srcdoc_re_match) 
            this.anchoredSrcDoc = srcdoc_re_match[1] + _anchorscript + srcdoc_re_match[2];
        else
            this.anchoredSrcDoc = srcdoc_base;
    }
    else {
        this.anchoredSrcDoc = srcdoc_base;
    }

    this.setContentRef = (iframenode) => {
        if (iframenode?.contentWindow && !this.state.mountNode) {
            console.log("adding iframe loading event listener", iframenode?.contentWindow?.addEventListener);
            //iframenode.contentWindow.addEventListener("load", (ev) => {
            //    //console.log(node.contentWindow.document.getElementById("some").value);
            //    console.log("iframe loading finished");

            //    //send message to iframe
            //    iframenode.contentWindow.postMessage({ message: "load" }, "*");

            //    // load spinner as per https://phuoc.ng/collection/html-dom/show-a-loading-indicator-when-an-iframe-is-being-loaded/
            //    //let loadingEle = globalThis.document.getElementById(this.iframeid+'-loading');
            //    //loadingEle.style.display = 'none';
            //    this.setState({
            //        ...this.state,
            //        nodeopacity: 1,
            //        loadingdisplay: 'none'
            //    });
            //});

            //// as per https://stackoverflow.com/questions/34677628/load-event-not-fired-on-safari-when-reloading-page
            //// reset the data attribte so the load event fires again if it was cached
            //iframenode.contentWindow.data = iframenode.contentWindow.data;

            this.setState({
                ...this.state,
                mountNode: iframenode
            });
        }
    }

    const do_mesg_handle = (ev) => {
        // ev sanity check
        if (typeof ev.data !== "object") return;
        if (!ev.data.type) return;
        if (ev.data.id !== this.iframeid) return;
        //if (ev.data.type === "addevent") {
        //    console.log("request to add iframe event");
        //    //const {type: _eventtype, listener: _handleevent} = ev.data.message;
        //    //iframenode.contentWindow.addEventListener(_eventtype, () => {
        //    //    //console.log(node.contentWindow.document.getElementById("some").value);
        //    //    console.log("iframe message event");
        
        //    //    //send message to iframe
        //    //    //iframenode.contentWindow.postMessage({ message: "load" }, "*");
        //    //    _handleevent();

        //    //});
        //}
        if (ev.data.type === "elementio") {this.msgcallback(ev.data.message); return;}
        if (ev.data.type === "iframeio" ) {
          console.log("iframe loading message from client to parent: ", ev.data.id, ev.data.message);
          console.log("iframe loading 2 finished");

          //send message to iframe
          if (this.state.mountNode?.contentWindow) {
            console.log("iframe loading posting load message from parent to child");
            this.state.mountNode?.contentWindow.postMessage({ message: "load" }, "*");
          }
          else {
            console.log("iframe loading could not post load message from parent to child");
          }

          // load spinner as per https://phuoc.ng/collection/html-dom/show-a-loading-indicator-when-an-iframe-is-being-loaded/
          //let loadingEle = globalThis.document.getElementById(this.iframeid+'-loading');
          //loadingEle.style.display = 'none';
          this.setState({
              ...this.state,
              nodeopacity: 1,
              loadingdisplay: 'none'
          });
          return;
        }
        if (ev.data.type !== "button-click") return;
        if (!ev.data.message) return;

        console.log(ev.data);
        this.msgcallback(ev.data.message);
        // now do something about ev on the parent side
        //this.setState({
        //  message: ev.data.message
        //});
    };

    globalThis._iframe_mesg_handlers  = {...globalThis._iframe_mesg_handlers, [this.iframeid]: do_mesg_handle};
    globalThis.addEventListener(
      "message",
      (ev) => {
        console.log("iframe loading: message event: ", ev.data, globalThis._iframe_mesg_handlers);
        if (ev.data.id in globalThis._iframe_mesg_handlers) {
          globalThis._iframe_mesg_handlers[ev.data.id](ev);
        }
      },
      false
    );

  }

  componentDidMount() {
    //globalThis.testfunc = (msg) => {
    //    console.log(msg);
    //  //this.setState({
    //  //  message: msg
    //  //})
    //};
    // spark_dev_note: 16/Nov/2023
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    // to send a message from a script inside iframe, invoke the following postMessage func call
    // globalThis.parent.postMessage(
    // {
    //     type: 'button-click',
    //     message: 'hello world'
    //   },
    //   '*'
    // );
    // as per https://stackoverflow.com/questions/13893256/jumping-to-anchor-in-iframe
    if (this.anchorpoint !== undefined) {
        //const iframewindow = document.getElementById(this.iframeid).contentWindow;
        //iframewindow.scrollTo(0,iframewindow.document.getElementById(this.anchorpoint).offsetTop);
    }
        //document.getElementById(this.iframeid).contentWindow.location.hash = "about:srcdoc#"+this.anchorpoint;
    
  }

  // as per https://www.viget.com/articles/using-javascript-postmessage-to-talk-to-iframes/
  // as per https://stackoverflow.com/questions/61542709/react-accessing-inline-created-iframe-elements
  // and per https://codesandbox.io/p/sandbox/funny-turing-25wn9?file=%2Fsrc%2FApp.js%3A5%2C3-14%2C5
  //onIframeRef = iframenode => {
  //  if (!iframenode) {
  //    return;
  //  }
  //  iframenode.contentWindow.addEventListener("load", (ev) => {
  //      //console.log(node.contentWindow.document.getElementById("some").value);
  //      console.log("iframe loading finished");
  //      //send message to iframe
  //      iframenode.contentWindow.postMessage({ message: "load" }, "*");

  //      // load spinner as per https://phuoc.ng/collection/html-dom/show-a-loading-indicator-when-an-iframe-is-being-loaded/
  //      //let loadingEle = globalThis.document.getElementById(this.iframeid+'-loading');
  //      //loadingEle.style.display = 'none';
  //      this.setState({
  //          ...this.state,
  //          nodeopacity: 1,
  //          loadingdisplay: 'none'
  //      });

  //  });

  //  this.Iframe = iframenode;
  //};

  render() {
    const { children, ...props } = this.props
    const { mountNode } = this.state
    const _anchoredSrcDoc = this.anchoredSrcDoc;
    const logError = (error , info) => {
        // Do something with the error, e.g. log to an external API
        console.error('Error occurred within the ErrorBoundary of IFrame: ', error.message);
        console.error(info.componentStack);
        // otherwise do nothibng
    };
    return(
      <ErrorBoundary onError={logError}>
        <div className={styles.container} >
            <div id={props.id+'-loading'} className={styles.loading} style={{display: this.state.loadingdisplay}}>
                <MutatingDots
                    visible={true}
                    height="80"
                    width="80"
                    color="#11fa39"
                    secondaryColor="#4fa94d"
                    radius='12.5'
                    ariaLabel="iframe-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                />
            </div>
            <iframe
                ref={this.setContentRef}
                {...{props, srcDoc: _anchoredSrcDoc}}
                className={styles.responsiveiframe}
                sandbox="allow-scripts allow-same-origin allow-forms" // iframe runs as a sandbox, limiting the communication btw iframe and the parent only via postMessage
                style={{opacity: this.state.nodeopacity}}
            >
            </iframe>
        </div>
      </ErrorBoundary>
    )
//        allowFullScreen="true"
//        sandbox="allow-scripts allow-same-origin" // iframe runs as a sandbox, limiting the communication btw iframe and the parent only via postMessage
//        {mountNode && createPortal(children, mountNode?.contentWindow?.document?.body)}
  }
}

export { IFrame };
