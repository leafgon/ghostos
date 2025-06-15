import 'date-fns';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Grid, TextField, Button, Link } from '@mui/material';
import { TimePicker, MobileDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';


//import { useFormControl } from '@mui/material/FormControl';

import { v5 as uuid5 } from 'uuid';
import { executeLEAFLogic } from '../../parser/leaf';
import Hammer from '@egjs/hammerjs';
import propagating from 'propagating-hammerjs';
import { v4 as uuid4 } from 'uuid';

import safeStringify from 'fast-safe-stringify';
import { doBottle } from '../../parser/nodelogic/datautils/bottling';
//import DateFnsUtils from '@date-io/date-fns';
//import {
//  MuiPickersUtilsProvider,
//  KeyboardTimePicker,
//  KeyboardDatePicker,
//} from '@material-ui/pickers';
//import ClickAwayListener from '@material-ui/core/ClickAwayListener';

//import { useSelector, useDispatch } from 'react-redux';

const leafgon_prod_url = process.env.LEAFGON_PROD_URL;


export default function LEAFUITextPrompt(props) //={"data":{}, "leafuidef":null, "nextuiref":null, "serverref":null}) 
{
    const [selectedDate, setSelectedDate] = useState(new Date('2014-08-18T21:11:54'));
    //const [promptentries, setPromptEntries] = useState({text:[], btn:[]});
    const [textPromptEntries, setTextPromptEntries] = useState([]);
    const [btnPromptEntries, setBtnPromptEntries] = useState([]);
    const disabledBtnPromptIndexedEntries = useRef([]);
    const activeBtnPromptIndexedEntries = useRef([]);

    const [inputerrors, setInputErrors] = useState({});
    const [renderid, setRenderid] = useState(undefined);
    //const [isMounted, setIsMounted] = useState(true); // element lifecycle flag
    const formErrorCount = useRef(-1);
    const inputTouched = useRef({});
    const userdatakeyLUT = useRef({});
    const userinput = useRef({});
    const str_userinput = useRef({});
    const lambdaLUT = useRef(undefined);
    const actionLUT = useRef({});
    const textfieldsettings = useRef(undefined);
    const hammerRef = useRef([]);
    const defaultmargin = 20;
    const defaultfieldwidth = '25ch';

    const {etaTree, uidefs, graphdomain, graphappid, nodeuuid, nodelambda, contextuallambda, margin, fieldwidth} = props;

    // a call to this function updates the state with a random value in useState sense 
    // so a re-render is registered by react.
    const need_rerender = () => {
        //if (stateRef.current.isMounted) 
            setRenderid(uuid4());
            //setState((otherstate) => {
            //    return {...otherstate, render_id: uuid4()};
            //});
    };

    //const {
    //    handleInputValue,
    //    handleFormSubmit,
    //    formIsValid,
    //    errors
    //} = useFormControl();
    
    const checkIfExternalURL = (href) => {

        if (href) {
            const re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
            const re_match = href.match(re);
            if (re_match)
                return true;
            else
                return false;
        }
    }
    const checkIfInputIsValid = (uidef, value, userdatakey) => {
        if (value) {
            if (uidef.type === "email") {
                // do regex validation
                const re = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
                const re_match = value.match(re);
                if (re_match)
                    return [true, ''];
                else
                    return [false, 'invalid email addr'];
            }
            else {
                return [true, ''];
            }
        }
        else { // empty value
            if (uidef.required) {
                //if (uidef.prompt === "date") {
                //    return [false, 'touch to confirm date']
                //}
                //else if (uidef.prompt === "time") {
                //    return [false, 'touch to confirm time']
                //}
                //else
                return [false, 'field cannot be empty'];
            }
            else
                return [true, ''];
        }
    };
    
    const validateUserInput = (isseterror=true) => {
        //inputData.leafuidef.map((ui) => appendPromptData(ui.getUserData())); // append current prompt's user data 
        //console.log("Prompt data: " + promptData );
        const errorsurvey = {};
        let errorcount = 0;
        Object.entries(userdatakeyLUT.current).map(([datauuid, userdatakey]) => {
            const uidef = uidefs.filter(_ => _.key === userdatakey)[0];
            //const dataelement = document.getElementById(datauuid);
            //console.log(dataelement.value); // access text element's value. 
            if (!uidef)
                return false;
            const [isvalid, errormsg] = checkIfInputIsValid(uidef, userinput.current[userdatakey], userdatakey);
            if (isvalid)
                errorsurvey[userdatakey] = {error: false, helperText: ''};
            else {
                if (inputTouched.current[userdatakey]) { // || ["date", "time"].includes(uidef.prompt))
                    errorsurvey[userdatakey] = {error: true, helperText: errormsg};
                }
                errorcount += 1;
            }

            //_userinput[userdatakey] = dataelement.value; // TBD
        });
        formErrorCount.current = errorcount;
        if (isseterror)
            setInputErrors(errorsurvey);
        need_rerender();

        if (errorcount === 0)
            return true;
        else
            return false;
    }
    //const getpromptdataref = () => {return promptdata};
    const registerHammer = (elemkey, actionobj) => {
        //console.log('registering hammer func: ', satid, satid, actionFunc)
        //const sysMenuSatElement = document.getElementById("sysmenu-satcenter-"+i); // find the element <div> id from the JSX def
        const {uidef, action: actionFunc} = actionobj;
        const element = document.getElementById(elemkey); // find the element <div> id from the JSX def
        if (element) {
            const hammer = propagating(new Hammer.Manager(element, {} )); //, {preventDefault: true}; // initialize hammer 
            //const hammer = new Hammer.Manager(sysMenuSatElement, {} ); //, {preventDefault: true}; // initialize hammer 
            hammerRef.current.push(hammer);
            //console.log('element to register hammer: ', sysMenuSatElement);
            //const hammer = new Hammer.Manager(sysMenuSatElement, {} ); //, {preventDefault: true}; // initialize hammer 
            hammer.add(new Hammer.Tap({event: 'singletap'}));
            hammer.on("singletap", e => {
                console.log('hammer event target: ', e.target.id);
                switch (e.target.id) {
                case elemkey:
                    e.preventDefault();
                    //getpromptdataref().current

                    const isvalid = validateUserInput(false);
                    if (isvalid) {
                        if (actionFunc) {
                            actionFunc(str_userinput.current);
                        }
                        if (uidef.href) {
                            const isexternalurl = checkIfExternalURL(uidef.href);
                            console.log('href button with external url? ', isexternalurl);
                            if (isexternalurl) {
                                window.open(uidef.href, uidef.sametab ? '_self' : '_blank', "noreferrer" ); // "noreferrer" is necessary to open a new tab in a separate process, in order not to freeze the parent tab
                            }
                            else {
                                window.location.href = uidef.href;
                            }
                        }
                    }
                    e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                    break;
                default: // when you don't know what to make out of error handling... ;p
                    e.preventDefault();
                    e.stopPropagation(); // when you don't want the hammer event propagating to the upstream events
                    console.error("ERROR: leaf sysmenu: unknown tab target: ", e); 
                }
            });
        }
    };

    useEffect(() => {
        lambdaLUT.current = etaTree.lookupRuntimeLambdaLUT(graphdomain, graphappid, nodeuuid, nodelambda, contextuallambda);
        const margin_num = Number(margin);
        textfieldsettings.current = {
            margin: margin_num ? margin_num : defaultmargin, 
            fieldWidth: fieldwidth ? fieldwidth : defaultfieldwidth,
            buttonWidth: defaultfieldwidth,
            backgroundColor: 'primary.light'
        };
    }, []);

    useEffect(() => {
        Promise.resolve(lambdaLUT.current).then((lut) => {
            lambdaLUT.current = lut;
            let uitextlist = [];
            let uidisabledbtnlist = [];
            let uiactivebtnlist = [];
            // spark_dev_note: TBD: uidefs is a user-definable chunk of free-form text coming from
            // either a texteditor instance or a LEAFlisp instance, so some level of filtering
            // is required to ensure the sanity of the data. it is done on a rudimentary way here
            // but it started getting a bit bulky for being a single arrow function. refector it 
            // down to a function call. 
            // also refactor it to be an inclusionlist instead of the exclusionlist.
            uidefs.map((uidef, uiidx) => {
                if (!uidef.idx)
                    uidef.idx = uiidx; // uiidx for dictating the displaying order of precedence.
                const exclusionlist = uidef.prompt === 'text' ? ['prompt', 'idx'] : (
                    uidef.prompt === 'button' ? ['prompt', 'idx', 'label', 'href', 'sametab'] : ( // sametab for dictating the href target options
                        []
                    )
                );
                const filtered_uidef = Object.keys(uidef)
                .filter(key => !exclusionlist.includes(key))
                .reduce((obj, key) => {
                    obj[key] = uidef[key];
                    if (key === 'key') {
                        const uidef_uri = `${leafgon_prod_url}/${uidef.key}`;
                        const uidefuuid = uuid5(uidef_uri, uuid5.URL);
                        obj[key] = uidefuuid;
                        if (uidef.prompt === 'button') // attach user-defined button actions
                        {
                            if (lambdaLUT.current && uidef.key in lambdaLUT.current && lambdaLUT.current[uidef.key]) {
                                const uidefaction = async (data) => { 
                                    //return await executeLEAFLogic(lambdaLUT.current[uidef.key]._default, [safeStringify(data)], {}); 
                                    console.log("textprompt button action triggered")
                                    const _logic_output = await executeLEAFLogic(lambdaLUT.current[uidef.key]._default, data, {}); 

                                    // emit an elementio message
                                    const _elementio_mesg = doBottle("elementio", _logic_output);
                                    etaTree.leafio.elementioLUT[nodeuuid].next(_elementio_mesg);
                                    //etaTree.leafio.elementioLUT[nodeuuid].data_out._stream.next(_elementio_mesg);
                                    //etaTree.leafio.elementioLUT[nodeuuid].ctrl_out._stream.next(doBottle('accio', 'ctrl_accio', {context: `textprompt button (${uidef.key}) action triggered`}));

                                    return _logic_output;
                                };
                                actionLUT.current[uidefuuid] = {uidef: uidef, action: uidefaction};
                            }
                            else { // in case a uidef.key has a matching lambda label without an associated lambda LEAF logic
                                actionLUT.current[uidefuuid] = {uidef: uidef, action: async (_) => _}; // identity function
                            }
                        }
                    }
                    return obj;
                }, {});

                if (uidef.prompt === 'setting') {
                    const newsettings = {...textfieldsettings.current}; 
                    if ('margin' in uidef)
                        newsettings['margin'] = Number(uidef.margin); 
                    if ('fieldWidth' in uidef)
                        newsettings['fieldWidth'] = uidef.fieldWidth;
                    if ('buttonWidth' in uidef)
                        newsettings['buttonWidth'] = uidef.buttonWidth;
                    if ('backgroundColor' in uidef)
                        newsettings['backgroundColor'] = uidef.backgroundColor;
                    textfieldsettings.current = newsettings;
                }
                else if (uidef.prompt === 'text') {
                    userdatakeyLUT.current[filtered_uidef.key] = uidef.key;
                    const initvalue = uidef.defaultValue?.trim();
                    if (!["", undefined].includes(initvalue) && uidef.required) {
                        userinput.current[uidef.key] = initvalue;
                        str_userinput.current[uidef.key] = initvalue;
                        validateUserInput();
                    }
                    uitextlist.push(
                        <TextField 
                            id={filtered_uidef.key}
                            error={inputerrors[uidef.key]?.error}
                            required={filtered_uidef.required}
                            onChange={(ev) => {
                                const newvalue = ev.target.value.trim();
                                if (newvalue === "") {
                                    delete userinput.current[uidef.key];
                                    delete str_userinput.current[uidef.key]
                                }
                                else {
                                    userinput.current[uidef.key] = ev.target.value;
                                    str_userinput.current[uidef.key] = ev.target.value;
                                }
                                validateUserInput();
                            }}
                            onClick={(ev) => {
                                inputTouched.current[uidef.key] = true;
                            }}
                            onKeyDown={(ev) => {
                                if (ev.key === "Backspace") {
                                    //validateUserInput();
                                }
                            }}
                            onKeyUp={(ev) => { // spark_dev_note: onKeyPress doesn't detect backspace/delete key as per https://stackoverflow.com/questions/4843472/javascript-listener-keypress-doesnt-detect-backspace
                                if (ev.key === "Enter") {
                                    ev.preventDefault();
                                    console.log(ev.target.value);
                                }
                                else {
                                    //validateUserInput();
                                }
                            }}
                            {...filtered_uidef} 
                        />
                    );
                }
                else if (uidef.prompt === 'date') {
                    userdatakeyLUT.current[filtered_uidef.key] = uidef.key;
                    uitextlist.push(
                        <MobileDatePicker
                            id={filtered_uidef.key}
                            {...filtered_uidef}
                            onClick={(val) => {
                                console.log(val);
                            }}
                            onChange={(val)=> {
                                inputTouched.current[uidef.key] = true;
                                userinput.current = {...userinput.current, [uidef.key]: val};
                                str_userinput.current = {...str_userinput.current, [uidef.key]: val.toDateString()};
                                validateUserInput();
                                //need_rerender();
                            }}
                            value={inputTouched.current[uidef.key] ? userinput.current[uidef.key] : ""}
                            inputFormat={filtered_uidef.inputFormat}
                            renderInput={(params) => <TextField 
                                {...params} 
                                required={filtered_uidef.required}
                                error={inputerrors[uidef.key]?.error}
                                helperText={inputerrors[uidef.key]?.helperText}
                                onClick={(ev) => {
                                    userinput.current = {...userinput.current, [uidef.key]: ev.target.value};
                                    inputTouched.current[uidef.key] = true;
                                    validateUserInput();
                                    //if (ev.target.value) {
                                    //    str_userinput.current = {...userinput.current, [uidef.key]: ev.target.value.toDateString()};
                                    //}
                                }}
                            />}
                        />
                    );
                }
                else if (uidef.prompt === 'time') {
                    userdatakeyLUT.current[filtered_uidef.key] = uidef.key;
                    uitextlist.push(
                        <TimePicker
                            id={filtered_uidef.key}
                            {...filtered_uidef}
                            onChange={(val)=> {
                                userinput.current = {...userinput.current, [uidef.key]: val};
                                str_userinput.current = {...str_userinput.current, [uidef.key]: val.toTimeString()};
                                validateUserInput();
                                //need_rerender();
                            }}
                            value={inputTouched.current[uidef.key] ? userinput.current[uidef.key] : ""}
                            renderInput={(params) => <TextField 
                                {...params} 
                                required={filtered_uidef.required}
                                error={inputerrors[uidef.key]?.error}
                                helperText={inputerrors[uidef.key]?.helperText}
                                onClick={(ev) => {
                                    inputTouched.current[uidef.key] = true;
                                    userinput.current = {...userinput.current, [uidef.key]: ev.target.value};
                                    str_userinput.current = {...str_userinput.current, [uidef.key]: ev.target.value.toTimeString()};
                                    validateUserInput();
                                    //userinput.current = {...userinput.current, [uidef.key]: ev.target.value.toTimeString()};
                                }}
                            />}
                        />
                    );
                }
                else if (uidef.prompt === 'button') {
                    const btn_instance =
                        <Button 
                                id={filtered_uidef.key} 
                                disabled={!validateUserInput(false)}
                                {...filtered_uidef}
                        >
                            {uidef.label}
                        </Button>
                    if (validateUserInput(false)) //formErrorCount.current === 0
                        uiactivebtnlist.push({idx: uidef.idx, btn: btn_instance});
                    else
                        uidisabledbtnlist.push({idx: uidef.idx, btn: btn_instance});
                }
                //<Button onClick={handleFormSubmission}> {props.btnlabel} </Button>
            });
            //if (uitextlist.length !== textPromptEntries.length)
            setTextPromptEntries(uitextlist);
            if (uiactivebtnlist.length !== activeBtnPromptIndexedEntries.current.length)
                activeBtnPromptIndexedEntries.current = uiactivebtnlist;
            if (uidisabledbtnlist.length !== disabledBtnPromptIndexedEntries.current.length)
                disabledBtnPromptIndexedEntries.current = uidisabledbtnlist;
            //setPromptEntries((prev) => {return {text: uitextlist, btn: uibtnlist}});
        })
    }, [props.uidefs, formErrorCount.current, userinput.current]);

    useEffect(() => {
        // now work on combining active and disabled buttons and sort them in place. 
        const combinedBtnIndexedEntries = [].concat(activeBtnPromptIndexedEntries.current).concat(disabledBtnPromptIndexedEntries.current);
        const sortedBtnEntries = combinedBtnIndexedEntries.sort((a,b)=> a.idx > b.idx).map(_=>_.btn);
        setBtnPromptEntries(sortedBtnEntries);

    }, [activeBtnPromptIndexedEntries.current, disabledBtnPromptIndexedEntries.current]);

    // run this block only if activeBtnPromptEntries change
    useEffect(() => {
        // now work on attaching hammer actions
        Object.entries(actionLUT.current).map(([key, actionobj]) => {
            registerHammer(key, actionobj);
        });

        // return cleanup code to the hook
        return () => { 
            hammerRef.current.map(hammer => {
                hammer.destroy();
            })
            hammerRef.current = [];
        };
    }, [btnPromptEntries]); //activeBtnPromptIndexedEntries.current


//            noValidate
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box
            id='textpromptbox'
            component="form"
            alignItems="center"
            justifyContent="center"
            sx={{
                position: "relative",
                display: "block",
                margin: "auto",
                width: "auto", //props.dimensions.width,
                //height: "auto",//props.dimensions.height-30, // -30 is to account for the close tab header in a popup window
                //overflow: "auto", // overflow doesn't seem to work
                backgroundColor: textfieldsettings.current ? textfieldsettings.current.backgroundColor : 'primary.light',
                '& .MuiTextField-root': {
                    m: textfieldsettings.current ? textfieldsettings.current.margin : defaultmargin,
                    width: textfieldsettings.current ? textfieldsettings.current.fieldWidth : defaultfieldwidth, // please refer to https://www.w3schools.com/cssref/css_units.asp for units, default to use 'ch'
                },
            }}
            autoComplete='off'
            onClick={(e) => {
                console.log('form submit triggered'); 
                e.preventDefault(); 
            }}
        >
            <div>
            {
               textPromptEntries 
            }
            <br /><br />
            <Box 
                display="flex"
                alignItems="flex-end"
                justifyContent="flex-end" 
                sx={{
                    '& .MuiButton-root': {
                        m: textfieldsettings.current ? textfieldsettings.current.margin : defaultmargin,
                        width: textfieldsettings.current ? textfieldsettings.current.buttonWidth : defaultfieldwidth, // please refer to https://www.w3schools.com/cssref/css_units.asp for units, default to use 'ch'
                    },
                }}
            >
                {
                   btnPromptEntries 
                }
            </Box>
            </div>
        </Box>
        </LocalizationProvider>
    );
}
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

