import { TextField, Input } from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      width: '100%',
    },
    //fontSize: '6pt',
    //background: 'linear-gradient(45deg,  #FE6B8B 30%, #FF8E53 90%)',
    //border: 0,
    //borderRadius: 3,
    //boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    //color: 'black',
    padding: '2px 0px',
    style: {alignItems: 'center'},
    width: '100%',
    height: '5',
    // $labeled is a reference to the local "label" styling rules within the same style sheet
    // by using &, we increase the specificity ? # ref https://material-ui.com/customization/components/#overriding-styles-with-classes
    //'&$labeled': {
    //  fontSize: '6pt',
    //},
  },
  //label: {
  //  fontSize: '6pt',
  //},
}));


const targetHandleStyle = { background: '#fff' , top: '50%', left: '-22px'}; //: CSSProperties
const targetAuxHandleStyle = { background: '#fff', left: '0%' }; //: CSSProperties
const sourceAuxHandleStyle = { background: '#fff',  left: '100%'}; //: CSSProperties
//const targetAuxHandleStyle = { background: '#fff', left: '20%' }; //: CSSProperties
//const sourceAuxHandleStyle = { background: '#fff',  left: '80%'}; //: CSSProperties

const targetAuxDataHandleStyle = { background: '#fff', top: '-22px', left: '50%' }; //: CSSProperties
const sourceAuxDataHandleStyle = { background: '#fff', top: '100%', left: '50%'}; //: CSSProperties

const targetAnchorHandleStyle = { background: '#fff', top: '-20px', left: '-11px', zIndex: 1 }; //: CSSProperties
const sourceAnchorHandleStyle = { background: '#fff',  top: '100%', left: '115%', zIndex: 1 }; //: CSSProperties

const debugHandleStyle = { borderColor: '#fff0', background: '#fff0', top: '-20px', left: '115%', zIndex: 1 }; //: CSSProperties

const sourceHandleStyle = { ...targetHandleStyle, top: '50%', left: '100%'}; //: CSSProperties
//const sourceHandleStyleA = { ...targetHandleStyle, top: 10, left:'100%' }; //: CSSProperties
//const sourceHandleStyleB = { ...targetHandleStyle, bottom: 10, top: 'auto' }; //: CSSProperties
const sourceHandleStyleA = { ...targetHandleStyle, top: '0%', left:'120%' }; //: CSSProperties
const sourceHandleStyleB = { ...targetHandleStyle, bottom: '0%', top: 'auto', left:'120%' }; //: CSSProperties

export {debugHandleStyle, targetHandleStyle, targetAuxHandleStyle, sourceAuxHandleStyle, targetAuxDataHandleStyle, sourceAuxDataHandleStyle, targetAnchorHandleStyle, sourceAnchorHandleStyle, sourceHandleStyle, sourceHandleStyleA, sourceHandleStyleB, useStyles }
