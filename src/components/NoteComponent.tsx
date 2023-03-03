import { __x, __o, } from '../tools/defaults';
import { useInterval, recolor, resetApp, } from '../tools/functions';
import {
  scale_atom,
  view_atom,
  link_atom,
  node_atom,
  canvasID_atom,
  pocketID_atom,
  atlas_selector,
  selectedNodeID_atom,
  NEO_canvasID_atom,
  NEO_link_atom,
  NEO_note_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import { memo, useState, useEffect, useRef, } from 'react';
import { useDeviceSelectors } from 'react-device-detect';

//import './../App.scss';

import Draggable from 'react-draggable';

import localStorage from 'store2';

/*

you have apollo, graphql, and neo4j
these work in tandem, work with nextjs, and conceivably also work with your auth setup
the only portion that's not cooperative is recoil
so instead you could just set the recoil state externally, or do your own sort of manual setting of values within it like you already did with local storage

*/

export default function Note({linkID}:any){

  const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom)
  const link = useRecoilValue(NEO_link_atom(linkID))

  let destination = link.notes.find( (n:any)=>{return n!=canvasID} )
  const note = useRecoilValue(NEO_note_atom(destination))

  /*
  const note = useRecoilValue(NEO_note_atom(
    link.notes.find((n:any)=>{return n!=canvasID})
  ))
  */

  // we load three things
  // the source note's ID (the canvas)
  // the target note's ID
  // the link ID
  
  // you're getting the link object now
  // have the link 

  // the link ID is used to identify a link object
  // the link object has two note IDs
  // we pull this, and then set the target note to the one with
  // an ID not matching the canvas
  

	return(<>
    <pre style={{outline:`1px solid black`}}>
      {JSON.stringify(link, null, 2)}
      <button onClick={(e:any)=>{canvasIDΔ(destination)}}>
        Go Beyond
      </button>
      {JSON.stringify(note, null, 2)}
    </pre>
	</>)

}