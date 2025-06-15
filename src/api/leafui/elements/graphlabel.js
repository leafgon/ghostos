import React from 'react';
//import { connect } from 'react-redux';
import LEAFUISet from './set';

class GraphLabelComponent extends React.Component {

    constructor(props) {
      super(props);
      console.log(props);
      //this.textlabels = props.textlabels;
      //this.forceUpdateHandler = this.forceUpdateHandler.bind(this);
      this.state = {count: 0};

      this.props = props;
      //props.reduxstore.subscribe(this.render);

    }

    getTextlabelLUT() {
        //let state = this.props.reduxstore.getState();
        //return state.leat3dnavReducer.graphlabel_lut; //leat3dnavReducer.promptidx; // forget metadata for now
        return {}; // interim solution till redux use is completely purged in LEAFapp
    };
  
    //forceUpdateHandler(){
    //  this.forceUpdate();
    //}
    //shouldComponentUpdate(nextProps, nextState) {
    //  return true; //nextState.data.completed !== this.state.data.completed;
    //}
  
    render() {
      //this.update();
      // update text label positions
      //for(let i=0; i<this.textlabels.length; i++) {
      //  this.textlabels[i].updatePosition();
      //}
      //    Object.entries(this.getTextlabelLUT()).map(
        if (this) {

        let label_lut = this.getTextlabelLUT();

        return (
            Object.entries(this.props.graphlabel_lut).map(
            (tlabel, i) => {
                if (!tlabel[1].hidden) {
                let coords2d = tlabel[1].getLabelCoords();
                return (
                    <div key={i}>
                    <div id="leafui" style={{fontSize:"11px", color: "white", backgroundColor: "#999", transform: `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`}}>
                    <LEAFUISet></LEAFUISet>
                    </div>
                    </div>
                );
                }
                else {
                    return <div></div>;
                }
            }
          )
        );
        }
    }
  }

//export default connect()(GraphLabelComponent);
export default GraphLabelComponent;
