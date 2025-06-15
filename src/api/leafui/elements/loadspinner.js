import React, {useEffect, useState} from 'react';

import styles from './iframe.module.css';
import { MutatingDots } from "react-loader-spinner";
import { Subject, firstValueFrom } from 'rxjs';

const LEAFDisplayLoadSpinner = (props) => {
    const [dispLoadState, setDispLoadState] = useState({
        nodeopacity: 0,
        loadingdisplay: 'flex'
    });

    const [coreInstance, setCoreInstance] = useState(undefined);

    const finishLoadingDisplay = () => {
        setDispLoadState({
            ...dispLoadState,
            nodeopacity: 1,
            loadingdisplay: 'none'
        });
    };

    const addCoreDisplayInstance = (_instance) => {
        setCoreInstance(_instance);
    };

    useEffect(() => {
        // element mounted upon reaching here
        setDispLoadState({
            nodeopacity: 0,
            loadingdisplay: 'flex'
        });

        if (props.loader_callback)
            props.loader_callback(); // this triggers a Dna loading spinner in App.js to disapear
        firstValueFrom(props._signal$).then(_loader_sig=> {
            console.log("loader signal registered:", _loader_sig);
            finishLoadingDisplay();
        });
        
        props.childprom?.then(_child_instance => {
            addCoreDisplayInstance(_child_instance);
        })

    }, [props.children, props.childprom]);

    // Beware of the dictionary object, instead of the usual React instance object being returned!!!
    // this was necessary for upstream gluing of this wrapper react instance to the loading status of
    // its children instances.
    return (
        <React.Fragment>
            <div className={styles.container}>
                <div id={props.elemkey} className={styles.loading} style={{display: dispLoadState.loadingdisplay}}>
                    <MutatingDots
                        visible={true}
                        height="80"
                        width="80"
                        color="#11fa39"
                        secondaryColor="#4fa94d"
                        radius='12.5'
                        ariaLabel="iframe-loading"
                        wrapperStyle={{}}
                        wrapperClass=""
                    />
                </div>
                <div className={styles.dispwrapper} style={{opacity: dispLoadState.nodeopacity}}>
                    {coreInstance && coreInstance}
                    {props.children}
                </div>
            </div>
        </React.Fragment>
    )
};
//const getLoadSpinnerWrapper = (_signal$, props) => {
//    // Beware of the dictionary object, instead of the usual React instance object being returned!!!
//    // this was necessary for upstream gluing of this wrapper react instance to the loading status of
//    // its children instances.
//    return {
//        _spinner_callback: {
//            core: addCoreDisplayInstance,
//            loader: finishLoadingDisplay
//        },
//        _spinner_wrapper: LEAFDisplayLoadSpinner(props)
//    }
//};

export {LEAFDisplayLoadSpinner};
