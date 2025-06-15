
const onConnect = (params) => console.debug('handle onConnect', params); // params: Connection | Edge

const onHandleTouch = (event) => { //event: React.MouseEvent
  console.debug("touch down on handle!")
}

const onTouchStart = (event) => { //(event: React.MouseEvent): void
  console.debug("handle dragging!")
}

export {onConnect, onHandleTouch, onTouchStart};
