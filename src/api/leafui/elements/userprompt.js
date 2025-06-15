import React from 'react';
//import { connect } from 'react-redux';
//import LEAFUISet from '../leafui/set';

class UserPromptComponent extends React.Component {

    constructor(props) {
      super(props);
      console.log(props);
      //this.textlabels = props.textlabels;
      //this.forceUpdateHandler = this.forceUpdateHandler.bind(this);
      this.state = {count: 0};

      //this.props = props;
      //this.setState({ curLEAFapp: props.curLEAFapp});

      //props.reduxstore.subscribe(this.render);

    }

    getTextlabelLUT() {
        //let state = this.props.reduxstore.getState();
        //return state.leat3dnavReducer.graphlabel_lut; //leat3dnavReducer.promptidx; // forget metadata for now
        return {};
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

          if (this.props.curNodeUUID) {
          let coords2d = this.props.graphlabel_lut[this.props.curNodeUUID].getLabelCoords();
          return (
              <div id="leafui" style={{fontSize:"11px", color: "white", backgroundColor: "#999", transform: `translate(-50%, -50%) translate(${coords2d.x}px,${coords2d.y}px)`}}>
              {
                this.props.curLEAFapp
                //this.state.rootprops.curLEAFapp
              }
              </div>
          );
          }
          else {
              return <div></div>;
          }
        }
    }
}

//export default connect()(UserPromptComponent);
export default UserPromptComponent;
