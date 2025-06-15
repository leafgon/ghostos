// prettier-ignore
//import { makeStyles } from '@material-ui/core';
//import { CreateCSSProperties, CSSProperties } from '@material-ui/styles';
import * as React from 'react';
import { animated, useSpring } from 'react-spring';
import { styled } from '@mui/system';

//import "../../styles/sysmenu.css";

//interface Props {
//	orbitStyle?: (defaultStyle: CSSProperties | CreateCSSProperties<{}>) => CSSProperties | CreateCSSProperties<{}>;
//	orbitRadius: number;
//	planetWidth: number;
//	planetHeight: number;
//	open: boolean;
//	mass: number;
//	tension: number;
//	friction: number;
//}

const orbitDefaultStyle = {
    position: 'absolute',
    borderRadius: '100%',
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: 'lightgrey',
    zIndex: 0,
};

function getInitalOrbitPosition(planetWidth, planetHeight) {
    console.log("start debugging");
	return {
		width: 0,
		height: 0,
		top: planetWidth / 2,
		left: planetHeight / 2,
		opacity: 0,
	};
}

function getFinalOrbitPosition(planetWidth, planetHeight, orbitRadius) {
	return {
		width: orbitRadius * 2,
		height: orbitRadius * 2,
		top: 0 - orbitRadius + planetHeight / 2,
		left: 0 - orbitRadius + planetWidth / 2,
		opacity: 1,
	};
}

//const useStyles = makeStyles({
//	orbit: (props) =>
//		props.orbitStyle ? (props.orbitStyle(orbitDefaultStyle)) : (orbitDefaultStyle),
//});

export function Orbit(props) {
	const { orbitId, orbitRadius, planetWidth, planetHeight, open, tension, friction, mass } = props;

    const styles = {
        orbit: props.orbitStyle ? props.orbitStyle(orbitDefaultStyle) : orbitDefaultStyle
    };

    const StyledAnimDiv = styled(animated.div)(styles.orbit);

	//const classes = useStyles(props);
	const position = useSpring({
		reverse: !open,
		from: getInitalOrbitPosition(planetWidth, planetHeight),
		to: getFinalOrbitPosition(planetWidth, planetHeight, orbitRadius),
		config: { mass, tension, friction },
	});

	return <StyledAnimDiv id={orbitId} style={position} />;
}
