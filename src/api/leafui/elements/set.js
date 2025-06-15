import 'date-fns';
import React from 'react';
//import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';
//import {
//  MuiPickersUtilsProvider,
//  KeyboardTimePicker,
//  KeyboardDatePicker,
//} from '@material-ui/pickers';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

//import Button from "@material-ui/core/Button";

//import LEAFUIPrompt from './textfield';
import LEAFDatePicker from '../misc/datepicker';

//import { createStore } from 'redux';
import { useSelector } from 'react-redux';
import { assertWrappingType } from 'graphql';

import { connect } from 'react-redux';


const uidef1 = [[LEAFDatePicker, {'id':'abc123'}],[LEAFDatePicker, {'id':'abc124'}]];
const uidef2 = [[LEAFDatePicker, {'id':'abc234'}]];

//const prompt2 = React.createElement(LEAFUIPrompt, {"data":{"btn1text": "hi five"}, "leafuidef":uidef2, "nextuiref":null, "serverref":null});
//const prompt1 = React.createElement(LEAFUIPrompt, {"data":{"btn1text": "hello 1"}, "leafuidef":uidef1, "nextuiref":null, "serverref":null});
const promptList = []; //[prompt1, prompt2];

function LEAFUISet() {
  //const [userData, setUserData] = React.useState({});
  //const LEAFUIUserDataStore = createStore(uiReduxReducerPromptInput);
  const promptIdx = useSelector((state) => {
    return state.leat3dnavReducer.promptidx; // forget metadata for now
  });
  //{
  //  "storeData": (appendageData) => { setUserData(Object.assign(userData, appendageData)); },
  //  "getData": () => { return (userData); }
  //});

  /*
  const uidef1 = [
    () => { 
      return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Grid container justify="space-around">
            <KeyboardDatePicker 
              margin="normal"
              id="date-picker-dialog"
              label="Date picker dialog"
              format="MM/dd/yyyy"
              value={selectedDate1}
              onChange={handleDateChange1}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
            <Button onClick={handleClick}> hello </Button>
          </Grid>
        </MuiPickersUtilsProvider>
      )
    },
    () => {
      return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Grid container justify="space-around">
            <Button onClick={handleClick2}> good job! </Button>
          </Grid>
        </MuiPickersUtilsProvider>
      )
    }
      
  ]
  const uidef2 = [
    () => { 
      return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Grid container justify="space-around">
            <KeyboardDatePicker 
              margin="normal"
              id="date-picker-dialog"
              label="Date picker dialog"
              format="MM/dd/yyyy"
              value={selectedDate1}
              onChange={handleDateChange1}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
            <Button onClick={handleClick}> hello </Button>
          </Grid>
        </MuiPickersUtilsProvider>
      )
    },
    () => {
      return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Grid container justify="space-around">
            <Button onClick={handleClick2}> good job! </Button>
          </Grid>
        </MuiPickersUtilsProvider>
      )
    }
      
  ]
  */
  const render = () => {
    //const curidx = LEAFUIUserDataStore.getState().promptidx;

    const curprompt = promptList[promptIdx];
    if (curprompt) {
    return (
          curprompt
    );
    }
    else {
      return null;
    }
  };

  try {
    return render();
  }
  catch (err) {
    console.log(err);
    return null;
  }
}

export default connect()(LEAFUISet);
/*
    <ClickAwayListener
      mouseEvent="onMouseDown"
      touchEvent="onTouchStart"
      onClickAway={handleClickAway}
      onClick={handleClick}
    >
    </ClickAwayListener>
        <KeyboardDatePicker
          margin="normal"
          id="date-picker-dialog"
          label="Date picker dialog"
          format="MM/dd/yyyy"
          value={selectedDate}
          onChange={handleDateChange}
          KeyboardButtonProps={{
            'aria-label': 'change date',
          }}
        />
*/

