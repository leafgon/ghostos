// prettier-ignore
//import { makeStyles } from '@material-ui/core';

import * as React from "react";
import { animated, useSpring } from "react-spring";
import { useDrag } from "react-use-gesture";
import { styled } from '@mui/system';
//interface Props {
//  children: React.ReactNode;
//  on: boolean;
//  dragable?: boolean;
//  dragRadius?: number;
//  bounceRadius?: number;
//  open?: boolean;
//  bounceOnOpen?: boolean;
//  bounceOnClose?: boolean;
//  bounceDirection?: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
//}

//import "../../styles/sysmenu.css";

const DEFAULT_DRAG_RADIUS = 12;
const DEFAULT_BOUNCE_RADIUS = 3;

export function DragableContainer(props) {
    const {
        children,
        on,
        dragable,
        dragRadius,
        bounceRadius,
        open,
        bounceOnOpen,
        bounceOnClose,
        bounceDirection,
    } = props;

    const styles = {
        root: {
            top: 0,
            left: 0,
        },
        dragable: {
            position: "absolute",
        },
    };

    const StyledDivRoot = styled("div")(styles.root);
    const StyledAnimDiv = styled(animated.div)(styles.dragable);

    const [{ x, y, cursor }, set] = useSpring(() => ({
      x: 0,
      y: 0,
      config: { tension: 400, friction: 7, precision: 0.1 },
      cursor: "pointer",
    }));

    //const classes = useStyles(props);

    React.useEffect(() => {
      if ((open && bounceOnOpen) || (!open && bounceOnClose)) {
        const bRadius = bounceRadius ? bounceRadius : DEFAULT_BOUNCE_RADIUS;
        let x = bRadius;
        let y = bRadius;
        switch (bounceDirection) {
          case "LEFT":
            x = -bRadius;
            y = 0;
            break;
          case "RIGHT":
            x = bRadius;
            y = 0;
            break;
          case "TOP":
            x = 0;
            y = -bRadius;
            break;
          case "BOTTOM":
            x = 0;
            y = bRadius;
            break;
        }
        set({ x, y });
        setTimeout(() => set({ x: 0, y: 0 }), 100);
      }
    }, [open]);

    // Creates a drag gesture
    const bind = useDrag(({ down, movement: [dX, dY] }) => {
      if (dragable) {
        const rMax = dragRadius ? dragRadius : DEFAULT_DRAG_RADIUS;
        const r = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
        // Find point along radius with rMax length
        // See: https://math.stackexchange.com/q/1630886
        if (r > rMax) {
          dX *= rMax / r;
          dY *= rMax / r;
        }
        set({
          x: down ? dX : 0,
          y: down ? dY : 0,
          immediate: down,
          cursor: down ? "grabbing" : "pointer",
        });
      }
    });

    return (
        on &&
        <StyledDivRoot>
        <StyledAnimDiv
            {...bind()}
            style={{ cursor: cursor, left: x, top: y }}
        >
            {children}
        </StyledAnimDiv>
        </StyledDivRoot>
        ||
        <>{children}</>
    );
}

//const useStyles = makeStyles({
//  root: {
//    top: 0,
//    left: 0,
//  },
//
//  dragable: {
//    position: "absolute",
//  },
//});
