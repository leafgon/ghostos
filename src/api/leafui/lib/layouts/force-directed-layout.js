/**
  @author Sunny Park

  Implementation based on the work by David Piegza (@davidpiegza) and Timofey Rechkalov (@TRechkalov)
  Implements a force-directed layout, the algorithm is an threshold-eveloped version of Fruchterman and Reingold and
  the JUNG algorithm, ported to javascript from the original typescript implementation by David Piegza (@davidpiegza) 
  and Timofey Rechkalov (@TRechkalov).

  Needs the graph data structure Graph.js and the Vector3 object:
  https://github.com/davidpiegza/Graph-Visualization/blob/master/Graph.js
  https://github.com/davidpiegza/Graph-Visualization/blob/master/utils/Vector3.js

  Parameters:
  graph - data structure
  options = {
    layout: "2d" or "3d"
    attraction: <float>, attraction value for force-directed layout
    repulsion: <float>, repulsion value for force-directed layout
    iterations: <int>, maximum number of iterations
    width: <int>, width of the viewport
    height: <int>, height of the viewport

    positionUpdated: <function>, called when the position of the node has been updated
  }

  Examples:

  create:
  layout = new Layout.ForceDirected(graph, {width: 2000, height: 2000, iterations: 1000, layout: "3d"});

  call init when graph is loaded (and for reset or when new nodes has been added to the graph):
  layout.init();

  call generate in a render method, returns true if it's still calculating and false if it's finished
  layout.generate();

 */

import Vector3 from './Vector3.js';
//import "./lib/layouts/Vector3.js";
//declare var require;
//Vector3:any = require('./Vector3.js');
//import { Vector3 } from './Vector3';
//declare const Vector3: any;

export class ForceDirectedLayout { 

  constructor(graph_arg, options_arg, cogCallback, doneCallback) {
    this.layout_options = null;
    this.graph = null;
    this.layout = null;
    this.attraction_multiplier = null;
    this.repulsion_multiplier = null;
    this.max_iterations = 0;
    this.width = 0;
    this.height = 0;
    this.finished = true;
    this.EPSILON = 0.0000000001; 
    this.attraction_constant = 0;
    this.repulsion_constant = 0;
    this.forceConstant = 0;
    this.layout_iterations = 0;
    this.temperature = 0;
    this.nodes_length = 0;
    this.edges_length = 0;
    this.callback_positionUpdated = false;
    this.center_of_gravity = null;

      // performance test
    let mean_time = 0;
    this.layout_options = options_arg || {};
    this.graph = graph_arg;

    //console.log('%%%%%%%%%%%%%%%%%%%%% ForceDirectedLayout constructor(): ', options_arg);
    this.layout = this.layout_options.layout || "2d";
    this.attraction_multiplier = this.layout_options.attraction || 5;
    this.repulsion_multiplier = this.layout_options.repulsion || 0.75;
    this.max_iterations = this.layout_options.iterations || 100;
    this.width = this.layout_options.width || 200;
    this.height = this.layout_options.height || 200;
    this.finished = false;
    this.cogCallback = cogCallback;
    this.doneCallback = doneCallback;

    console.log('force-directed-layout: ', this.width, ' ', this.height);

    this.callback_positionUpdated = this.layout_options.positionUpdated;
    this.center_of_gravity = new Vector3(0,0,0);
  }


  /**
   * Initialize parameters used by the algorithm.
   */
  init() {
    this.finished = false;
    this.temperature = this.width / 10.0;
    this.nodes_length = this.graph.nodes.length;
    this.edges_length = this.graph.edges.length;
    //this.forceConstant = Math.sqrt(this.height * this.width / this.nodes_length);
    this.forceConstant = Math.sqrt(this.height * this.width / 1000); // to make forceConstant independent of nodes_length
    this.attraction_constant = this.attraction_multiplier * this.forceConstant;
    this.repulsion_constant = this.repulsion_multiplier * this.forceConstant;

    console.log('sim constants:', this.graph.nodes.length, this.graph.edges.length, this.width, this.height);
    //console.log(this.attraction_constant);
    //console.log(this.repulsion_constant);

  }

  /**
   * Generates the force-directed layout.
   *
   * It finishes when the number of max_iterations has been reached or when
   * the temperature is nearly zero.
   */
  generate() {
    if(this.layout_iterations < this.max_iterations && this.temperature > 0.3) {
      var start = new Date().getTime();
      var i, j, delta, delta_length, force, change;

      // calculate repulsion
      //console.log('%%%%%%%%%%%%%%%% calcing repulsion ', this.nodes_length);
      for(i=0; i < this.nodes_length; i++) {
        var node_v = this.graph.nodes[i];
        node_v.layout = node_v.layout || {};
        if(i === 0) {
          node_v.layout.offset = new Vector3();
        }

        //console.log('%%%%%%%%%%%%%%%% calcing repulsion for node ', node_v);

        node_v.layout.force = 0;
        node_v.layout.tmp_pos = node_v.layout.tmp_pos || new Vector3().setVector(node_v.position);

        for(j=i+1; j < this.nodes_length; j++) {
          var node_u = this.graph.nodes[j];
          if(i != j) {
            node_u.layout = node_u.layout || {};

            node_u.layout.tmp_pos = node_u.layout.tmp_pos || new Vector3().setVector(node_u.position);

            delta = node_v.layout.tmp_pos.clone().sub(node_u.layout.tmp_pos);
            delta_length = Math.max(this.EPSILON, Math.sqrt(delta.clone().multiply(delta).sum()));

            //force = (this.repulsion_constant * this.repulsion_constant) / delta_length;
            //let nucforce = this.repulsion_constant/100*Math.exp(-0.001*delta_length);
            force = Math.log((this.repulsion_constant * this.repulsion_constant) / delta_length); // + nucforce; // took the logarithm of force to allow close quarters among nodes

            node_v.layout.force += force;
            node_u.layout.force += force;

            if(i === 0) {
              node_u.layout.offset = new Vector3();
            }

            change = delta.clone().multiply(new Vector3().setScalar(force/delta_length));
            node_v.layout.offset.add(change);
            node_u.layout.offset.sub(change);
          }
        }
      }

      // calculate attraction
      //console.log('%%%%%%%%%%%%%%%% calcing attraction, ', this.edges_length);
      for(i=0; i < this.edges_length; i++) {
        var edge = this.graph.edges[i];
        //console.log('%%%%%%%%%%%%%%%% calcing attraction for edge ', edge);
        // the 'layout' being in both source and target means nodes data loaded, and it is ready to calculate attraction force
        //if ('layout' in edge.source && 'layout' in edge.target) {}
        if (edge.source.uuid in this.graph.node_lut && edge.target.uuid in this.graph.node_lut) {
          let node_u = this.graph.node_lut[edge.source.uuid];
          let node_v = this.graph.node_lut[edge.target.uuid];
          delta = node_u.layout.tmp_pos.clone().sub(node_v.layout.tmp_pos);
          delta_length = Math.max(this.EPSILON, Math.sqrt(delta.clone().multiply(delta).sum()));

          if (delta_length < 50) {
            force = 0;
          }
          else {
            //force = (delta_length * delta_length) / this.attraction_constant;
            force = Math.log((delta_length * delta_length) * this.attraction_constant + Math.E) - 1; // took the logarithm of force to allow close quarters among nodes
          }

          node_u.layout.force -= force;
          node_v.layout.force += force;

          change = delta.clone().multiply(new Vector3().setScalar(force/delta_length));
          node_v.layout.offset.add(change);
          node_u.layout.offset.sub(change);
        }
      }

      /*
      // calculate repulsion
      for(i=0; i < this.nodes_length; i++) {
        var node_v = this.graph.nodes[i];
        node_v.layout = node_v.layout || {};

        node_v.layout.force = 0;
        node_v.layout.tmp_pos = node_v.layout.tmp_pos || new Vector3().setVector(node_v.position);

        for(j=i+1; j < this.nodes_length; j++) {
          var node_u = this.graph.nodes[j];
          if(i != j) {
            node_u.layout = node_u.layout || {};

            node_u.layout.tmp_pos = node_u.layout.tmp_pos || new Vector3().setVector(node_u.position);

            delta = node_v.layout.tmp_pos.clone().sub(node_u.layout.tmp_pos);
            delta_length = Math.max(this.EPSILON, Math.sqrt(delta.clone().multiply(delta).sum()));

            if (delta_length < 50) {
              //force = (this.repulsion_constant * this.repulsion_constant) / delta_length;
              let nucforce = this.repulsion_constant/100*Math.exp(-0.01*delta_length);
              //force = Math.log((this.repulsion_constant * this.repulsion_constant) / delta_length) + nucforce; // took the logarithm of force to allow close quarters among nodes
              force = nucforce;

              node_v.layout.force += force;
              node_u.layout.force += force;

              change = delta.clone().multiply(new Vector3().setScalar(force/delta_length));
              node_v.layout.offset.add(change);
              node_u.layout.offset.sub(change);
            }
          }
        }
      }
      */

      // calculate positions
      this.center_of_gravity.setScalar(0);
      for(i=0; i < this.nodes_length; i++) {
        var node = this.graph.nodes[i];

        delta_length = Math.max(this.EPSILON, Math.sqrt(node.layout.offset.clone().multiply(node.layout.offset).sum()));

        node.layout.tmp_pos.add(node.layout.offset.clone().multiply(new Vector3().setScalar(Math.min(delta_length, this.temperature) / delta_length)));

        var updated = true;

        var tmpPosition = new Vector3(node.position.x, node.position.y, node.position.z);
        tmpPosition.sub(node.layout.tmp_pos).divide(new Vector3().setScalar(10));

        node.position.x -= tmpPosition.x;
        node.position.y -= tmpPosition.y;

        if(this.layout === '3d') {
          node.position.z -= tmpPosition.z;
        }

        this.center_of_gravity.add(node.position);

        // execute callback function if position has been updated
        if(updated && typeof this.callback_positionUpdated === 'function') {
          this.callback_positionUpdated(node);
        }
      }
      this.temperature *= (1 - (this.layout_iterations / this.max_iterations));
      this.layout_iterations++;

      var end = new Date().getTime();
      this.mean_time += end - start;

      this.center_of_gravity.divideScalar(this.nodes_length+1);
      if (this.cogCallback)
        this.cogCallback(this.center_of_gravity);
    } else {
      if(!this.finished) {
        //console.log("Average time: " + (this.mean_time/this.layout_iterations) + " ms");
        //console.log("Center of gravity: " + (this.center_of_gravity.x) + ',' + (this.center_of_gravity.x) + ',' + (this.center_of_gravity.z)  );
        this.doneCallback();
      }
      this.finished = true;
      return false;
    }
    return true;
  }

  /**
   * Stops the calculation by setting the current_iterations to max_iterations.
   */
  stop_calculating() {
    this.layout_iterations = this.max_iterations;
  }
}

