
import 'date-fns';
import React from 'react';
import Grid from '@mui/material/Grid';
import DateFnsUtils from '@date-io/date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// hooked up Redux store as per https://redux.js.org/tutorials/fundamentals/part-5-ui-react
import { useSelector, useDispatch } from 'react-redux';

export default function LEAFDatePicker(props) 
{
    const [selectedDate, setSelectedDate] = React.useState(new Date('2014-08-18T21:11:54'));
    const [inputData, setInputData] = React.useState(props);

    const promptData = useSelector((state) => {
        return state.promptdata; // forget metadata for now
    });

    const reduxDispatch = useDispatch(); // Redux store dispatch ref 

    const handleDateChange = (date) => {
        setSelectedDate(date);
        //storeData(selectedDate); // store data via context
    //    reduxDispatch({ type: 'leafui/storePromptInput', payload: {"{inputData.id}": selectedDate}}); // store the date in Redux store
    };

    const getUserData = () => {
        return ({"{inputData.id}": selectedDate});
    }

    /*
    const genHTML = () => { 
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Grid container justify="space-around">
            <KeyboardDatePicker 
            margin="normal"
            id={inputData.id}
            label="Date picker dialog"
            format="MM/dd/yyyy"
            value={selectedDate}
            onChange={handleDateChange}
            KeyboardButtonProps={{
                'aria-label': 'change date',
            }}
            />
        </Grid>
        </MuiPickersUtilsProvider>
    )
    } 

    return genHTML();
    */
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container justify="space-around">
            <DatePicker 
            margin="normal"
            id={inputData.id}
            key={inputData.id}
            label="Date picker dialog"
            format="MM/dd/yyyy"
            value={selectedDate}
            onChange={(date) => {handleDateChange(date)}}
            slotProps={{
                textField: {
                    helperText: 'change date',
                }
            }}
            />
        </Grid>
        </LocalizationProvider>
    );
}
