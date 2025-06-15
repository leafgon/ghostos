import React from 'react';
import ReactDOM from "react-dom";

export default class DynamicScriptLoaderService {

  scripts = {};

  constructor( callback ) {
    this.callback = callback;
  }

  
  //script_src_list is a list of 
  //  {
  //    name: string;
  //    src: string;
  //  }
  setScriptUrlList(script_src_list, is_append = false) {
    if (!is_append) {
      this.scripts = {};
    }
    script_src_list.forEach((script) => {
      this.scripts[script.name] = {
        loaded: false,
        src: script.src
      };
    });
  }

  load(...scripts) {
    const promises = [];
    scripts.forEach((script) => promises.push(this.loadScript(script)));
    return Promise.all(promises);
  }

  loadScript(name) {
    return new Promise((resolve, reject) => {
      if (!this.scripts[name].loaded) {
        //load script
        //let script = document.createElement('script');
        //let script = this.el_renderer.createElement('script');
        let script_el = document.createElement('script');
        script_el.type = 'text/javascript';
        script_el.src = this.scripts[name].src;
        if (script_el.readyState) {  //IE
            script_el.onreadystatechange = () => {
                if (script_el.readyState === "loaded" || script_el.readyState === "complete") {
                    script_el.onreadystatechange = null;
                    this.scripts[name].loaded = true;
                    resolve({script: name, loaded: true, status: 'Loaded'});
                    if (this.callback) this.callback();
                }
            };
        } else {  //Others
            script_el.onload = () => {
                console.log('ext script loaded', this.scripts[name]);
                this.scripts[name].loaded = true;
                resolve({script: name, loaded: true, status: 'Loaded'});
                if (this.callback) this.callback();
            };
        }
        script_el.onerror = (error) => resolve({script: name, loaded: false, status: 'Loaded'});
        //document.getElementsByTagName('head')[0].appendChild(script);
        //this.el_renderer.appendChild(this.el_parent.nativeElement, script);
        //ReactDOM.render({script_el}, document.getElementById('curLEAFapp'));
        document.getElementById('curLEAFapp').appendChild(script_el);
      } else {
        resolve({ script: name, loaded: true, status: 'Already Loaded' });
        if (this.callback) this.callback();
      }
    });
  }

}
