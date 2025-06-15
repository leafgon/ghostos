import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import { ReactDOM } from 'react';
import Hammer from 'hammerjs';

//#reactflow #migration
//import { Handle, Position, NodeProps, Connection, Edge } from '../lib/react-flow-renderer';
import { Handle, Position, NodeProps, Connection, Edge } from '../lib/reactflow.11.10.4/core/dist/esm/index.js';
import { AnchorPort, DataPort, LambdaPort } from './porthandle'
  
import Draggable from 'react-draggable';

import { TextField, Input } from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { textAlign } from '@material-ui/system';
import { NoEncryption } from '@material-ui/icons';

import { useMutation } from 'graphql-hooks';
//import { Base64 } from 'crypto-js/enc-base64';
//import sjcl from 'sjcl';

import {useStyles} from './styles';

const LEAFUICircularTextInputNode = withStyles({
  root: {
    '& > *': {
    },
    fontSize: '6pt',
    //background: 'linear-gradient(45deg,  #FE6B8B 30%, #FF8E53 90%)',
    //border: 0,
    //borderRadius: 3,
    //boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    //color: 'black',
    //height: 18,
    //padding: '0 30px',
    width: '100%',
    // $labeled is a reference to the local "label" styling rules within the same style sheet
    // by using &, we increase the specificity ? # ref https://material-ui.com/customization/components/#overriding-styles-with-classes
    //'&$labeled': {
    //  fontSize: '6pt',
    //},
  },
  //label: {
  //  fontSize: '6pt',
  //},
})(TextField);

export default {LEAFUICircularTextInputNode};
