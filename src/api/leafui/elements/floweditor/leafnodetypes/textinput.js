import React, { useState, memo, FC, CSSProperties, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client'; // NOTE: Correct for React 18+
import Hammer from 'hammerjs';

import { Handle, Position, NodeProps, Connection, Edge } from '../lib/reactflow.11.10.4/core/dist/esm/index.js';
import { AnchorPort, DataPort, LambdaPort } from './porthandle';

import Draggable from 'react-draggable';

import { TextField, Input, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NoEncryption } from '@mui/icons-material';

import { useMutation } from 'graphql-hooks';

import { useStyles } from './styles';

const LEAFUICircularTextInputNode = styled(TextField)(({ theme }) => ({
    '& > *': {
          // Add specific overrides here if needed
    },
    fontSize: '6pt',
    width: '100%',
}));

export default {LEAFUICircularTextInputNode};
