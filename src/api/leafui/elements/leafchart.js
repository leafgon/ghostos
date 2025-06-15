import React, {useEffect} from 'react';
import Hammer from 'hammerjs';
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
import { makeStyles } from '@mui/styles';
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

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'auto',
    backgroundColor: theme.palette.background.paper,
  },
  imageList: {
    width: 500,
//    height: "100%",
//    height: 450,
//    overflow: 'visible',
  },
  titleBar: {
    background:
      'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, ' +
      'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
  },
  icon: {
    color: 'rgba(255, 255, 255, 0.54)',
  }
}));

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
export default function LEAFChart(props) {
  const classes = useStyles();
  //const {_leafjs, appprops} = props; // rid of the annoyance of adding 'props.' in every prop access
  // define global context in its own world
  //const tagrectcoord = _leafjs.render.tagrectcoord;
  //const tagrectsize = _leafjs.render.tagrectsize;
  
  useEffect(() => {
    const ctx = document.getElementById('leafChart'+props.leaduuid);

    const chart_instance = new Chart(ctx, {
        type: props.type,
        data: props.data,
        options: props.options
    });
  }, []);


//    <div className={classes.root} style={{ backgroundColor: '#11101180', width: tagrectsize.width-4, height: tagrectsize.height-35, zIndex:0, position: "absolute", top: 25, left: 2}}>
//    <div id="bg-tag-center-imglist" style={{zIndex:2, position: "absolute", top: tagrectcoord.y, left: tagrectcoord.x}}>
  return (
    <React.Fragment>
    <div id="bg-tag-center-chart" style={{margin: 'auto', zIndex:2, }}>
        <canvas id={"leafChart"+props.leaduuid} width={props.dimensions.width} height={props.dimensions.height}></canvas>
    </div>
    </React.Fragment>
  );
}

const leafElementChartLambda = () => {

  return (props) => <LEAFChart {...props} />;
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

