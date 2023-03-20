import { __x, __o } from '../tools/defaults';
import { recolor } from '../tools/functions';
import {
	NEO_canvasID_atom,
	NEO_note_atom,
	NEO_pocketID_atom,
} from "./RecoilComponent";
import { useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
	useRef,
} from 'react';
import React from 'react';

import Note from "./NoteComponent";

////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Frame(){
	console.log("frame component rendered")

	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom); // change which canvas is active
	const [ canvasNote, canvasNoteΔ ] = useRecoilState(NEO_note_atom(canvasID));

	const [ pocketID, pocketIDΔ ] = useRecoilState(NEO_pocketID_atom);

	const textRef = useRef(null);
	const componentRef = useRef(null);

	const baseStyle:React.CSSProperties = {
		... canvasNote.color?{
			outline:`2px solid ${recolor(canvasNote.color, {lum:-30,sat:0,hue:0,})}`,
			backgroundColor:recolor(canvasNote.color, {lum:-10,sat:0,hue:0,}),
		}:{},
		display:`flex`,
		position:`absolute`,
		left:`0px`, right:`0px`,
		height:`60px`,
		alignItems:`center`, justifyContent:`center`,
		userSelect:`none`,
		zIndex:4,
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function FrameTop(){

		return(<>
			{
				__x
				//&& canvasNote.queried // hydra has run, populating an otherwise empty atom
				//&& canvasNote.uuid
				/*
				&& <div>hello top</div>
				*/
				&& <Note {...{passedLink:{
					uuid:null,
					position:{x:0,y:-1},
					length:{
						x:3+(3*3)/4,
						y:1+(1*1)/4,
					},
					notes:[canvasID],
					canTravel:true,
					inHeader:true,
				}}}/>
			}
			<div
				style={{
					...baseStyle,
					top:`0px`,
					fontSize:`150%`,
					display:`flex`,
				}}
			/>
		</>)
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function FrameBottom(){
		
		// if this gets moved up into the main frame function, drag effect will get stuck, requiring two clicks
		// apparently this mixing with pocketID doesn't cause a problem though
		// possibly a mounting issue where any property in here would ensure it's updated
		//const selectedNodeID = useRecoilValue(selectedNodeID_atom);
		//const [ expanded, expandedΔ ] = useRecoilState(sidebarExpand_atom)
		/*
		useEffect(()=>{
			const handleKey = (e:any)=>{
				if(pocketID && !selectedNodeID
					//&& !expanded
				){
					switch(e.key){
						case "Delete":
						case "Escape":
							pocketIDΔ(null)
						break;
						case "Enter":
							//textEditableΔ(true)
						break;
					}
				}
			}
			window.addEventListener('keyup', handleKey);
			return ()=>{
				window.removeEventListener('keyup', handleKey);
			};
		},[
			pocketID,
			selectedNodeID,
			//expanded,
		]);
		*/

		return(<>
			{
				__x
				&& canvasNote.links // hydra has run, meaning the pocket destination already exists
				&& pocketID
				&& <Note {...{passedLink:{
					uuid:null,
					position:{x:0,y:+1},
					length:{x:3,y:1},
					notes:[pocketID],
					canTravel:true,
					inPocket:true,
				}}}/>
			}
			<div
				style={{
					...baseStyle,
					bottom:`0px`,
				}}
			/>
		</>)
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////

	return(<>
		<FrameTop/>
		<FrameBottom/>
	</>)

}