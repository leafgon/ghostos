import React from 'react';
import Icon from '@material-ui/core/Icon';
import {v4 as uuidv4} from 'uuid';

const Sidebar = (props) => {
  const onDragStart = (event, nodeType, leaduuid, {spellname="", datakey=""}={}) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('leaduuid', leaduuid);
    event.dataTransfer.setData('datakey', datakey);
    event.dataTransfer.setData('leafnodetype', nodeType);
    spellname && event.dataTransfer.setData('spellname', spellname);
    //event.dataTransfer.setData('onChange', )
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
      <div style={{background:"rgb(255,255,255)"}}>
    <aside>
      <div className="description" >You can drag these nodes into the LEAF editor:</div>
      {
        Object.entries(props.nodeTypes).map(([nodename, nodecomp]) => {
          const editorelemuuid = uuidv4();
          return <div key={nodename} className={nodename} onDragStart={(event) => onDragStart(event, nodename, editorelemuuid)} draggable>
            {nodename}
          </div>;
          /*
          const node_icon =   (nodedef.svgicon.unicode ? nodedef.svgicon.unicode :
            (nodedef.svgicon.url ? <svg width="24" height="24"><image href={'/'+nodedef.svgicon.url} src="yourfallback.png" width="24" height="24"/></svg> :
            (nodedef.svgicon.jsx ? nodedef.svgicon.jsx :
            undefined)));

          <div className={nodename} onDragStart={(event) => onDragStart(event, {nodename}, {nodename})} draggable>
            nodename
            <Icon>
              {node_icon}
            </Icon>
          </div>
          */
        })
      }
    </aside>
      </div>
  );
};
/*
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'input', 'uuid1')} draggable>
        Input Node
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'uuid2')} draggable>
        Default Node
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'output', 'uuid3')} draggable>
        Output Node
      </div>
      <div className="LEAF utility node" onDragStart={(event) => onDragStart(event, 'leafutilitynode', 'uuid4')} draggable>
        LEAF utility: change_bg_color
      </div>
      <div className="LEAFspell" onDragStart={(event) => onDragStart(event, 'leafdatafilternode', 'uuid5')} draggable>
        LEAF data filter 
      </div>
      <div className="LEAFspell" onDragStart={(event) => onDragStart(event, 'leafdatacombinenode', 'uuid5')} draggable>
        LEAF data combine 
      </div>
      <div className="LEAFspell" onDragStart={(event) => onDragStart(event, 'leafnodecontextnode', 'uuidowl5')} draggable>
        LEAF node context 
      </div>
      <div className="LEAFspell" onDragStart={(event) => onDragStart(event, 'leafedgecontextnode', 'uuidowl5')} draggable>
        LEAF edge context 
      </div>
      <div className="LEAF anchor point" onDragStart={(event) => onDragStart(event, 'leafanchorpointnode', 'uuid5')} draggable>
        LEAF anchor point Node
      </div>
      <div className="LEAF deck suit" onDragStart={(event) => onDragStart(event, 'leafdeckspade', 'uuid6')} draggable>
        LEAF deck spade
      </div>
      <div className="LEAF deck suit" onDragStart={(event) => onDragStart(event, 'leafdeckdiamond', 'uuid7')} draggable>
        LEAF deck diamond
      </div>
      <div className="LEAF deck suit" onDragStart={(event) => onDragStart(event, 'leafdeckheart', 'uuid8')} draggable>
        LEAF deck heart
      </div>
      <div className="LEAF deck suit" onDragStart={(event) => onDragStart(event, 'leafdeckclub', 'uuid9')} draggable>
        LEAF deck club
      </div>
      <div className="LEAF deck tracker" onDragStart={(event) => onDragStart(event, 'leafdecktracker', 'uuid10')} draggable>
        LEAF deck tracker 
      </div>
      <div className="LEAFspell" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid11', {spellname:'map', datakey:'hello'})} draggable>
        LEAF spell: map
        <Icon>
          <img src='http://localhost:3000/icons/hardware/laptop_mac/materialicons/24px.svg' />
        </Icon>
      </div>
      <div className="LEAFspell" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid14', {spellname:'evaluate', datakey:'hello'})} draggable>
        LEAF spell: evaluate
      </div>
      <div className="LEAFspell" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid17', {spellname:'generate', datakey:'hello'})} draggable>
        LEAF spell: generate 
      </div>
      <div className="LEAF spell" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid16', {spellname:'synchronize', datakey:'hello'})} draggable>
        LEAF spell: synchronize 
      </div>
      <div className="LEAF ui" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid15', {spellname:'ask', datakey:'hello'})} draggable>
        LEAF ui: ask
      </div>
      <div className="LEAF ui" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid18', {spellname:'show', datakey:'hello'})} draggable>
        LEAF ui: show
      </div>
      <div className="LEAF deck i/o" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid12', {spellname:'read', datakey:'hello'})} draggable>
        LEAF deck i/o read
      </div>
      <div className="LEAF deck i/o" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid13', {spellname:'write', datakey:'hello'})} draggable>
        LEAF deck i/o write
      </div>
      <div className="LEAF ontology" onDragStart={(event) => onDragStart(event, 'leafspellnode', 'uuid19', {spellname:'define ontology', datakey:'hello'})} draggable>
        LEAF ontology define
      </div>
*/

export default Sidebar;