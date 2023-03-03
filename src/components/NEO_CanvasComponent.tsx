import { useInterval, recolor } from '../tools/functions';
import { __x, __o } from '../tools/defaults';
import emoji from '../tools/emojis';
import {
	NEO_proto_atom,
	NEO_user_selector,
	NEO_link_atom,
	NEO_canvasID_atom,
	NEO_hydration_selector,
	NEO_note_atom,
	NEO_hydra_selector,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, useRecoilValueLoadable, useRecoilStateLoadable, } from "recoil";
import {
	memo,
	useState,
	useEffect,
	useRef,
} from 'react';
//import { useQuery, gql } from "@apollo/client";

import Link from "./LinkComponent";
import Note from "./NoteComponent";

//import './../App.scss';
//import Link from "./LinkComponent";

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

export default function NEO_Canvas(){

	const [ NEO_hydra , NEO_hydraΔ ] = useRecoilState(NEO_hydra_selector)
	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom)
	const noteCanvas = useRecoilValue(NEO_note_atom(canvasID))
	
	useEffect(()=> {
		if(!noteCanvas.links){NEO_hydraΔ(NEO_hydra)}
	},[noteCanvas, NEO_hydra])

////////////////////////////////////////////////////////////////////

	// canvas can still handle creation because the node simply doesn't exist yet to have a link in the first place

	return(<>
	
			<div
				style={{
					position:`relative`,
					width:`100%`,
					backgroundColor:`pink`,
				}}
			>
				canvas
				<br/>
				<pre style={{}}>
					{JSON.stringify(noteCanvas, null, 2)}
				</pre>
			</div>
			<br/>
			<div>
				link/notes<br/>
				{
					__x
					&& noteCanvas.links
					&& noteCanvas.links.map((linkID:any)=>{
						return(
							<Note key={linkID} linkID={linkID}/>
						)
					})
				}
			</div>

	</>)	

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////