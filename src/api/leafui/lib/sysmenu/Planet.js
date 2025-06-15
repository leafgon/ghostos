// prettier-ignore
//import { ClickAwayListener, makeStyles } from '@material-ui/core';
import { useRef, useState, useEffect, Children } from 'react';
import { ClickAwayListener } from "@mui/base";
//import { CreateCSSProperties, CSSProperties } from "@material-ui/styles";
import { styled } from '@mui/system';
import { ReactElement } from "react";
import useResizeObserver from "use-resize-observer";
import { DragableContainer } from "./DragableContainer";
import { Orbit } from "./Orbit";
import { Satellite } from "./Satellite";

import { v4 as uuid4 } from 'uuid';

//import "../../styles/sysmenu.css";

const DEFAULT_MASS = 1;
const DEFAULT_TENSTION = 500;
const DEFAULT_FRICTION = 17;
const DEFAULT_ROTATION = 0;
const DEFAULT_RADIUS = 100;

//interface Props {
//  centerContent?: React.ReactNode;
//  children?: React.ReactNode;
//  open?: boolean;
//  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
//  mass?: number;
//  tension?: number;
//  friction?: number;
//  orbitStyle?: (
//    defaultStyle: CSSProperties | CreateCSSProperties<{}>
//  ) => CSSProperties | CreateCSSProperties<{}>;
//  orbitRadius?: number;
//  rotation?: number;
//  hideOrbit?: boolean;
//  autoClose?: boolean;
//  onClose?: (
//    e: React.MouseEvent<Document | HTMLDivElement, MouseEvent>
//  ) => void;
//  dragablePlanet?: boolean;
//  dragRadiusPlanet?: number;
//  dragableSatellites?: boolean;
//  dragRadiusSatellites?: number;
//  bounceRadius?: number;
//  bounce?: boolean;
//  bounceOnOpen?: boolean;
//  bounceOnClose?: boolean;
//  bounceDirection?: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
//  satelliteOrientation?: "DEFAULT" | "INSIDE" | "OUTSIDE" | "READABLE";
//}

export function Planet(props) {
  const {
    centerContent,
    children,
    open,
    onClick,
    mass,
    tension,
    friction,
    orbitRadius,
    rotation,
    orbitStyle,
    planetStyle,
    satStyle,
    curSatChosen,
    orbitId,
    hideOrbit,
    onClose,
    autoClose,
    dragablePlanet,
    dragRadiusPlanet,
    dragableSatellites,
    dragRadiusSatellites,
    bounceRadius,
    bounce,
    bounceOnOpen,
    bounceOnClose,
    bounceDirection,
    satelliteOrientation,
  } = props;

  //const useStyles = makeStyles({
  //  root: {
  //    position: "relative",
  //  },

  //  planetContent: {
  //    position: "relative",
  //    //zIndex: 1,
  //    //zIndex: props.open ? (satStyle ? satStyle.zIndex : 2) : 1,
  //    //zIndex: props.open ? 20 : 1,
  //  },
  //});
  //const classes = useStyles(props);
  const styles = {
    root: {
        position: "relative",
//        role: "presentation",
//        PointerEvent: "none",
    },

    planetContent: {
        position: "relative",
        //zIndex: 1,
        //zIndex: props.open ? (satStyle ? satStyle.zIndex : 2) : 1,
        //zIndex: props.open ? 20 : 1,
    },
  };
  const StyledDivRoot = styled('div')(styles.root);
  const StyledDivPlanetContent = styled('div')(styles.planetContent); //className={classes.planetContent} 

  const { ref, height = 0, width = 0 } = useResizeObserver();
  //const centerContentRef = useRef({ref: 'centercontent-'+uuid4(), height: 100, width: 100});
  const [_open, setOpen] = useState(!!open);

  useEffect(() => {
    setOpen(!!open);
  }, [open]);

  //const satellites = useRef([]);

  const satelliteCount = Children.count(children);
  //useEffect(() => {
  const satellites = [];
  Children.forEach(children, (c, i) => {
        //console.log(ref, height, width);
        satellites[i] = (
        <Satellite
            key={i}
            index={i}
            open={_open}
            satelliteCount={satelliteCount}
            planetHeight={height}
            planetWidth={width}
            mass={mass ? mass : DEFAULT_MASS}
            friction={friction ? friction : DEFAULT_FRICTION}
            tension={tension ? tension : DEFAULT_TENSTION}
            orbitRadius={orbitRadius ? orbitRadius : DEFAULT_RADIUS}
            rotation={rotation ? rotation : DEFAULT_ROTATION}
            dragable={!!dragableSatellites}
            dragRadius={dragRadiusSatellites}
            orientation={satelliteOrientation}
            satStyle={satStyle}
            isChosen={curSatChosen === i}
        >
            {c}
        </Satellite>
        );
    });
  //});


  const onPlanet = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      if (_open && autoClose) {
        setOpen(false);
        if (onClose) {
          onClose(e);
        }
      } else {
        setOpen(true);
      }
    }
  };

  const onClickAway = (e) => { //: React.MouseEvent<Document, MouseEvent>) => {}
    if (autoClose) {
      setOpen(false);
    }

    if (onClose && _open) {
      onClose(e);
    }
  };

//      <div className={classes.root} style={planetStyle} >
//        <>{satellites}</>
//  console.log('HHHHHHHHHHHHHHHHHHHHHHHHH Planet component: orbitId: ', orbitId);
  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <StyledDivRoot >
        {!hideOrbit && (
          <Orbit
            orbitId={orbitId}
            open={_open}
            orbitStyle={orbitStyle}
            planetHeight={height}
            planetWidth={width}
            mass={mass ? mass : DEFAULT_MASS}
            friction={friction ? friction : DEFAULT_FRICTION}
            tension={tension ? tension : DEFAULT_TENSTION}
            orbitRadius={orbitRadius ? orbitRadius : DEFAULT_RADIUS}
          />
        )}
        <div style={{...satStyle}}>
        {
            satellites
            //satellites.current
            //children.map((c, i) => {
            //    //console.log(ref, height, width);
            //    <Satellite
            //        key={i}
            //        index={i}
            //        open={_open}
            //        satelliteCount={satelliteCount}
            //        planetHeight={height}
            //        planetWidth={width}
            //        mass={mass ? mass : DEFAULT_MASS}
            //        friction={friction ? friction : DEFAULT_FRICTION}
            //        tension={tension ? tension : DEFAULT_TENSTION}
            //        orbitRadius={orbitRadius ? orbitRadius : DEFAULT_RADIUS}
            //        rotation={rotation ? rotation : DEFAULT_ROTATION}
            //        dragable={!!dragableSatellites}
            //        dragRadius={dragRadiusSatellites}
            //        orientation={satelliteOrientation}
            //        satStyle={satStyle}
            //        isChosen={curSatChosen === i}
            //    >
            //        {c.props.children}
            //    </Satellite>
            //})
            //Children.forEach(children, (c, i) => {
            //    console.log(ref, height, width);
            //    satellites.current[i] = (
            //    <Satellite
            //        key={i}
            //        index={i}
            //        open={_open}
            //        satelliteCount={satelliteCount}
            //        planetHeight={height}
            //        planetWidth={width}
            //        mass={mass ? mass : DEFAULT_MASS}
            //        friction={friction ? friction : DEFAULT_FRICTION}
            //        tension={tension ? tension : DEFAULT_TENSTION}
            //        orbitRadius={orbitRadius ? orbitRadius : DEFAULT_RADIUS}
            //        rotation={rotation ? rotation : DEFAULT_ROTATION}
            //        dragable={!!dragableSatellites}
            //        dragRadius={dragRadiusSatellites}
            //        orientation={satelliteOrientation}
            //        satStyle={satStyle}
            //        isChosen={curSatChosen === i}
            //    >
            //        {c}
            //    </Satellite>
            //    );
            //})
        }
        </div>
        <StyledDivPlanetContent id={props.hammerid} style={{...planetStyle}} onClick={onPlanet}>
          <DragableContainer
            on={
              !!dragablePlanet || !!bounce || !!bounceOnOpen || !!bounceOnClose
            }
            dragable={!!dragablePlanet}
            dragRadius={dragRadiusPlanet}
            open={_open}
            bounceRadius={bounceRadius}
            bounceOnOpen={(bounce && !!!bounceOnClose) || bounceOnOpen}
            bounceOnClose={(bounce && !!!bounceOnOpen) || bounceOnClose}
            bounceDirection={bounceDirection}
          >
            <div ref={ref}>{centerContent}</div>
          </DragableContainer>
        </StyledDivPlanetContent>
      </StyledDivRoot>
    </ClickAwayListener>
  );
}
//            <div ref={centerContentRef.current.ref}>{centerContent}</div>
//                    planetHeight={centerContentRef.current.height}
//                    planetWidth={centerContentRef.current.width}


