// prettier-ignore
//import { makeStyles } from '@material-ui/core';
import { useRef } from 'react';
import { animated, useSpring } from "react-spring";
import useResizeObserver from "use-resize-observer";
import { DragableContainer } from "./DragableContainer";
import { styled } from '@mui/system';

import { v4 as uuid4 } from 'uuid';

//import "../../styles/sysmenu.css";

const DEFAULT_MASS = 1;
const DEFAULT_TENSTION = 500;
const DEFAULT_FRICTION = 17;
const DEFAULT_ROTATION = 0;
const DEFAULT_RADIUS = 100;

//interface Props {
//  index: number;
//  open: boolean;
//  satelliteCount: number;
//  children?: React.ReactNode;
//  planetWidth: number;
//  planetHeight: number;
//  mass: number;
//  tension: number;
//  friction: number;
//  orbitRadius: number;
//  rotation: number;
//  dragable: boolean;
//  dragRadius?: number;
//  orientation?: "DEFAULT" | "INSIDE" | "OUTSIDE" | "READABLE";
//}

export function Satellite(props) {
  const {
    children,
    index,
    satelliteCount,
    open,
    planetWidth,
    planetHeight,
    mass=DEFAULT_MASS,
    friction=DEFAULT_FRICTION,
    tension=DEFAULT_TENSTION,
    orbitRadius=DEFAULT_RADIUS,
    rotation=DEFAULT_ROTATION,
    dragable,
    dragRadius,
    orientation,
    satStyle,
    isChosen,
  } = props;

  //const useStyles = makeStyles({
  //  root: (props) => ({
  //    position: "absolute",
  //    //zIndex: props.open ? 1 : 0,
  //  }),
  //  sat: (props) => ({
  //    position: "absolute",
  //    //zIndex: props.open ? (satStyle ? satStyle.zIndex : 1) : 0,
  //    zIndex: isChosen ? 1 : 0,
  //  }),
  //});

  const styles = {
    sat: {
        position: "absolute",
        zIndex: isChosen ? 1 : 0
    }
  };

  const StyledAnimDiv = styled(animated.div)(styles.sat);

  //const classes = useStyles(props);
  const { ref, height = 0, width = 0 } = useResizeObserver();
  //const centerContentRef = useRef({ref: 'centercontent-'+uuid4(), height: 0, width: 0});
  const position = useSpring({
    reverse: !open,
    from: getInitalSatellitePosition(width, height, planetWidth, planetHeight),
    to: getFinalSatellitePosition(
      index,
      satelliteCount,
      width,
      height,
      planetWidth,
      planetHeight,
      orbitRadius,
      rotation,
      orientation
    ),
    config: { mass, tension, friction },
  });

  return (
    <StyledAnimDiv style={position}>
      <DragableContainer
        on={dragable}
        dragRadius={dragRadius}
        dragable={dragable}
      >
        <div ref={ref}>{children}</div>
      </DragableContainer>
    </StyledAnimDiv>
  );
}
//        <div ref={ref}>{children}</div>

function getFinalSatellitePosition(
  index, //: number,
  satelliteCount, //: number,
  width, //: number,
  height, //: number,
  planetWidth, //: number,
  planetHeight, //: number,
  orbitRadius, //: number,
  rotation, //: number,
  orientation //: "DEFAULT" | "INSIDE" | "OUTSIDE" | "READABLE" | undefined
) {
  let { deltaX, deltaY, angle } = getFinalDeltaPositions(
    index,
    satelliteCount,
    width,
    height,
    orbitRadius,
    rotation
  );

  let transform = {};
  switch (orientation) {
    case "OUTSIDE":
      transform = { transform: "rotate(" + angle + "deg)" };
      break;
    case "INSIDE":
      transform = { transform: "rotate(" + (angle + 180) + "deg)" };
      break;
    case "READABLE":
      transform =
        angle > 90 && angle < 270
          ? { transform: "rotate(" + (angle + 180) + "deg)" }
          : { transform: "rotate(" + angle + "deg)" };
      break;
    default:
      transform = { transform: "rotate(" + 0 + "deg)" };
  }

  return {
    top: planetHeight / 2 + deltaX,
    left: planetWidth / 2 - deltaY,
    opacity: 1,
    ...transform,
  };
}

function getInitalSatellitePosition(
  width, //: number,
  height, //: number,
  planetWidth, //: number,
  planetHeight //: number
) {
  return {
    top: planetHeight / 2 - height / 2,
    left: planetWidth / 2 - width / 2,
    opacity: 0,
  };
}

function getFinalDeltaPositions(
  index, //: number,
  satelliteCount, //: number,
  width, //: number,
  height, //: number,
  orbitRadius, //: number,
  rotation //: number
) {
  const SEPARATION_ANGLE = 360 / satelliteCount;
  const FAN_ANGLE = (satelliteCount - 1) * SEPARATION_ANGLE;
  const BASE_ANGLE = (180 - FAN_ANGLE) / 2 + 90 + rotation;

  let TARGET_ANGLE = BASE_ANGLE + index * SEPARATION_ANGLE;
  return {
    deltaX: orbitRadius * Math.cos(toRadians(TARGET_ANGLE)) - height / 2,
    deltaY: orbitRadius * Math.sin(toRadians(TARGET_ANGLE)) + width / 2,
    angle: TARGET_ANGLE,
  };
}

// UTILITY FUNCTIONS
const DEG_TO_RAD = 0.0174533;
function toRadians(degrees) {
  return degrees * DEG_TO_RAD;
}
