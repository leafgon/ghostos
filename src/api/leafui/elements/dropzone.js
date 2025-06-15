import React, {useEffect, useState, useRef} from 'react';
import Hammer from '@egjs/hammerjs';
import propagating from 'propagating-hammerjs';
//import { makeStyles } from '@material-ui/core/styles';

//import Paper from '@material-ui/core/Paper';
//import ImageList from '@material-ui/core/ImageList';
//import ImageListItem from '@material-ui/core/ImageListItem';
//import ImageListItemBar from '@material-ui/core/ImageListItemBar';
//import IconButton from '@material-ui/core/IconButton';
//import StarBorderIcon from '@material-ui/icons/StarBorder';
//import ListSubheader from '@material-ui/core/ListSubheader';
//import InfoIcon from '@material-ui/icons/Info';
//import { Paper, ImageList, ImageListItem, ImageListItemBar, IconButton, ListSubheader, InfoIcon } from '@mui/material';
//import StarBorderIcon from '@mui/icons-material/StarBorder';
//import { makeStyles } from '@mui/styles';
//import itemData from './itemData';
import AddPhotoAlternateTwoToneIcon from '@mui/icons-material/AddPhotoAlternateTwoTone';
import Tooltip from '@mui/material/Tooltip';
import { useDropzone } from 'react-dropzone';

const testitemdata = [
  {
    img: 'https://media.cntraveler.com/photos/554a497929d479ab28bfb03b/master/pass/spring_flowers_2015_longwood_cr_Longwood%20Gardens%20L%20Albee.jpg',
    title: 'flower field',
    author: 'unknown',
    featured: true,
  },
  {
    img: 'https://www.publicdomainpictures.net/pictures/10000/nahled/spring-flower-garden-11281366664wzK0.jpg',
    title: 'flower field2',
    author: 'unknown',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Straberry_field_sign.jpg',
    title: 'strawberry field',
    author: 'unknown',
  },
  {
    img: 'https://mathesia.com/wp-content/uploads/2018/05/NC-Strawberry-Grower.jpg',
    title: 'strawberry field2',
    author: 'unknown',
  },
  {
    img: 'https://assets.londonist.com/uploads/2019/05/i875/12806039_468549163338013_3505119429741196684_n.jpg',
    title: 'strawberry field2',
    author: 'unknown',
  },
  {
    img: 'https://mathesia.com/wp-content/uploads/2018/05/NC-Strawberry-Grower.jpg',
    title: 'strawberry field2',
    author: 'unknown',
    featured: false,
  },
];

const thumbsContainer = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16
};

const thumb = {
    display: 'inline-flex',
    borderRadius: 2,
    border: '1px solid #eaeaea',
    marginBottom: 8,
    marginRight: 8,
    width: 100,
    height: 100,
    padding: 4,
    boxSizing: 'border-box'
};

const thumbInner = {
    display: 'flex',
    minWidth: 0,
    overflow: 'hidden'
};

const img = {
    display: 'block',
    width: 'auto',
    height: '100%'
};

export default function LEAFImageDropzone(props) {
    //const classes = useStyles();
    //const {_leafjs, appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
    // define global context in its own world
    //const tagrectcoord = _leafjs.render.tagrectcoord;
    //const tagrectsize = _leafjs.render.tagrectsize;
    const [files, setFiles] = useState([]);
    const [isThumbExpanded, setThumbExpanded] = useState(false);
    const inputelem = useRef(undefined);
    const {getRootProps, getInputProps, open} = useDropzone({
        accept: {
        'image/*': []
        },
        onDrop: acceptedFiles => {
        setFiles(acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        })));
        },
        onDropAccepted: async (files) => {
            console.log("start debugging");
            const data = await fetch(files[0].preview);
            const blob = await data.blob();
            new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = resolve(reader.result);
                    console.log("start debugging");
                    // Data-URL declaration stripped from result as per https://stackoverflow.com/questions/24289182/how-to-strip-type-from-javascript-filereader-base64-string
                    //props.callbacks.onDropAccepted(reader.result.split(',')[1]); 
                    props.callbacks.onDropAccepted(reader.result); // refactored to have, in the message payload, the b64 image 'preamble' (eg "data:image/*;base64") 
                    return base64data;
                };
                reader.readAsDataURL(blob);
            });
        }
    });

    const expandedthumb = {
        display: 'inline-flex',
        borderRadius: 2,
        border: '1px solid #eaeaea',
        marginBottom: 8,
        marginRight: 8,
        width: props.data.dimensions.width,
        height: props.data.dimensions.height,
        padding: 4,
        boxSizing: 'border-box'
    };

    
    const thumbs = files.map(file => (
        <div style={isThumbExpanded ? expandedthumb : thumb} key={file.name}>
        <div style={thumbInner}>
            <img
            src={file.preview}
            style={img}
            // Revoke data uri after image is loaded
            onLoad={() => { URL.revokeObjectURL(file.preview) }}
            onMouseDown={() => {
                if (isThumbExpanded) 
                    setThumbExpanded(false);
                else
                    setThumbExpanded(true);
            }}
            />
        </div>
        </div>
    ));

    useEffect(() => {
        // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
        open();
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, []);

    useEffect(() => {
        if (!inputelem.current) {
            inputelem.current = document.getElementById("inputicon-"+props.data.nodeuuid);
            console.log("start debugging"); 
        }
    }, [inputelem.current]);

    return (
        <React.Fragment>
        <section className="container">
            <div id={"inputicon-"+props.data.nodeuuid} {...getRootProps({className: 'dropzone'})} style={{backgroundColor: 'white', opacity:0.3, width: 100, height: 100, borderRadius: 25}}>
                <input {...getInputProps()} />
                <Tooltip title="Add an image/photo"><AddPhotoAlternateTwoToneIcon style={{width: 100,
    height: 100}} /></Tooltip>
            </div>
            <aside style={thumbsContainer}>
                {thumbs}
            </aside>
        </section>
        </React.Fragment>
    );
};
