import React, {useEffect} from 'react';
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
import { Paper, ImageList, ImageListItem, ImageListItemBar, IconButton, ListSubheader, InfoIcon } from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
//import { makeStyles } from '@mui/styles';
//import itemData from './itemData';

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

//const useStyles = makeStyles((theme) => ({
//  root: {
//    display: 'flex',
//    flexWrap: 'wrap',
//    justifyContent: 'space-around',
//    overflow: 'auto',
//    backgroundColor: theme.palette.background.paper,
//  },
//  imageList: {
//    width: 500,
////    height: "100%",
////    height: 450,
////    overflow: 'visible',
//  },
//  titleBar: {
//    background:
//      'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, ' +
//      'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
//  },
//  icon: {
//    color: 'rgba(255, 255, 255, 0.54)',
//  }
//}));

/**
 * The example data is structured as follows:
 *
 * import image from 'path/to/image.jpg';
 * [etc...]
 *
 * const itemData = [
 *   {
 *     img: image,
 *     title: 'Image',
 *     author: 'author',
 *     cols: 2,
 *   },
 *   {
 *     [etc...]
 *   },
 * ];
 */
export default function BasicImageList(props) {
  //const classes = useStyles();
  //const {_leafjs, appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
  // define global context in its own world
  //const tagrectcoord = _leafjs.render.tagrectcoord;
  //const tagrectsize = _leafjs.render.tagrectsize;
  
  useEffect(() => {

    const initHammer = (bgTagElement) => {
      //const hammer = propagating(new Hammer.Manager(bgTagElement, {} )); // initialize hammer 
      const hammer = new Hammer.Manager(bgTagElement, {} ); // initialize hammer 
      //const hammer = new Hammer.Manager(bgTagElement, {} ); // initialize hammer 
      //hammer.options.domEvents = true; // enable dom events (propagation as such)
      let gestures = {};
      gestures['singletap'] = new Hammer.Tap({event: 'singletap'}); // add a singletap gesture 
      //gestures['doubletap'] = new Hammer.Tap({event: 'doubletap', 'taps': 2}); // add a doubletap gesture 
      //gestures['longpress'] = new Hammer.Tap({event: 'longpress', time:500}); // add a 500ms longpress gesture
      //const spgesture = {...gestures, swipe: new Hammer.Tap({event: 'swipe'})};
      //gestures['swipe'] = new Hammer.Tap({event: 'swipe'}); // add a swipe gesture 
      //let doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
      //gestures.doubletap.recognizeWith([gestures.singletap]); // doubletap needs this condition to coexist with singletap
      //let longPress = new Hammer.Press({event: 'longpress', time:500});
      //gestures.singletap.requireFailure([gestures.doubletap, gestures.longpress]); // singletap needs this condition to coexist with doubletap and longpress
      //let swipe = new Hammer.Swipe({event: 'swipe'});

      hammer.add(Object.values(gestures)); // register the gestures list to hammer state
      // gesture definitions
      hammer.on("singletap", e => { // singletap event
        if (e.target.id) {
          console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.id); // for debugging only
          // track down the tap location based on the app JSX def specific <div> id
          // and handle the event as appropriate. 
	  //e.preventDefault();
          switch (e.target.id) {
          case "bg-tag-center-imglist": 
            console.log("bg-tag-center-imglist");
            break;
          default: // when you don't know what to make out of error handling... ;p
            console.error("BackgroundTagComponent: unknown tab target: ", e); 
          }
        }
        else { // taps from elements without ids
          console.log("HAMMERTIME on BackgroundTag: SINGLE TAP", e.target.parentElement.id); // just to see how it works, play around with logs
        }
      });
      // work on 'pinch pan and pinchmove' later as per this codepend 
      // https://codepen.io/bakho/pen/GBzvbB

    };

    // element mounted upon reaching here
    /*
    let testdata = {};
    const setTestdata = (data) => {
      testdata = data;
    };
    setTestdata({t203: 0});
    */
    const bgTagElement = document.getElementById("bg-tag-center-imglist"); // find the element <div> id from the JSX def
    //const bgTagElement = document.getElementById("myElement"); // find the element <div> id from the JSX def
    initHammer(bgTagElement);
  }, []);


  function srcset(image, width, height, rows = 1, cols = 1) {
    return {
      src: `${image}?w=${width * cols}&h=${height * rows}&fit=crop&auto=format`,
      srcSet: `${image}?w=${width * cols}&h=${
        height * rows
      }&fit=crop&auto=format&dpr=2 2x`,
    };
  }

  // re constructed as per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
  const base64re = /^data:image\/([A-Za-z0-9]{3}|[A-Za-z0-9]{4}|\*)\s*;\s*base64\s*$/;
  function checkForBase64Preamble(imgdata) {
    const [imgpreamble, base64imgdata] = imgdata ? imgdata.split(',') : [undefined, undefined];

    if (imgpreamble) {
        const re_matches = imgpreamble.match(base64re);
        if (re_matches && base64imgdata) { // re_matches is null or an array of matched elements, 0 index containing the whole matched string
            // spark_dev_note: 26/May/2023
            // #base64 #image #format
            // this is where to screen for allowed image formats
            return true;
        }
    }
    return false;
  }
//    <div className={classes.root} style={{ backgroundColor: '#11101180', width: tagrectsize.width-4, height: tagrectsize.height-35, zIndex:0, position: "absolute", top: 25, left: 2}}>
//    <div id="bg-tag-center-imglist" style={{zIndex:2, position: "absolute", top: tagrectcoord.y, left: tagrectcoord.x}}>
  return (
    <React.Fragment>
    <div id="bg-tag-center-imglist" style={{margin: 'auto', zIndex:2, }}>
    <ImageList sx={{width:"100%"}} rowHeight={props.data.dimensions.height} gap={1} >
        {props.data.image_data.map((item, i) => {
            const isbase64 = checkForBase64Preamble(item.img);

            const cols = item.featured ? 2 : 1;
            const rows = item.featured ? 1 : 1;

            return (
                <ImageListItem key={"imglist-item"+i} cols={cols} rows={rows}>
                    isbase64 ?
                    <img src={item.img} width={props.data.dimensions.width} height={props.data.dimensions.height} /> :
                    <img 
                        {...srcset(item.img, props.data.dimensions.width, props.data.dimensions.height, rows, cols)} 
                        alt={item.title} 
                        loading="lazy"
                    /> 
                    <ImageListItemBar
                        sx={{
                            background:
                              'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, ' +
                              'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                        }}
                        title={item.title}
                        position="top"
                        actionIcon={
                            <IconButton aria-label={`star ${item.title}`}>
                            <StarBorderIcon />
                            </IconButton>
                        }
                        actionPosition="left"
                    />
                </ImageListItem>
            );
        })}
    </ImageList>
    </div>
    </React.Fragment>
  );
}

const leafElementImageListLambda = () => {

  return (props) => <BasicImageList {...props} />;
};

/*
    <Paper style={{maxHeight: 300, overflow: 'visible'}}>
        hello
    </Paper>
<ImageList rowHeight={180} className={classes.imageList}>
        <ImageListItem key="Subheader" cols={2} style={{ height: 'auto' }}>
          <ListSubheader component="div">December</ListSubheader>
        </ImageListItem>
        {itemData.map((item, i) => (
          <ImageListItem key={item.img+i}>
            <img src={item.img} alt={item.title} />
            <ImageListItemBar
              title={item.title}
              subtitle={<span>by: {item.author}</span>}
              actionIcon={
                <IconButton aria-label={`info about ${item.title}`} className={classes.icon}>
                  <InfoIcon />
                </IconButton>
              }
            />
          </ImageListItem>
        ))}
    </ImageList>
<ImageList rowHeight={160} className={classes.imageList} cols={3}>
        {itemData.map((item, i) => (
          <ImageListItem key={item.img+i} cols={item.cols || 1}>
            <img height={160} src={item.img} alt={item.title} />
          </ImageListItem>
        ))}
      </ImageList>
*/

