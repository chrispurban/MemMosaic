import { __x, __o } from '../tools/defaults';
import {
	NEO_canvasID_atom,
	NEO_note_atom,
	NEO_create_selector,
} from "./RecoilComponent";
import { useRecoilState, useRecoilValue, useSetRecoilState, useRecoilValueLoadable, useRecoilStateLoadable, useRecoilCallback, } from "recoil";
import {
	useEffect,
} from 'react';

import Note from "./NoteComponent";

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

export default function NEO_Canvas(){
	//console.log("canvas component rendered")

	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom)
	const [ canvas, canvasΔ ] = useRecoilState(NEO_note_atom(canvasID))

	const noteGeneration = useRecoilCallback(({ set }) => async ( isLink:any, position:any )=>{
		console.log(`doubleclick detected in empty canvas at x:${position.x} y:${position.y}`);
		set<any>(NEO_create_selector,{
		  isLink,
		  position,
		});
	 });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	return(<>
		{
			__x
			&& canvas.color
			&& <div
				style={{
					position:`relative`,
					height:`100%`, width:`100%`,
					backgroundColor:canvas.color,
				}}
				className="canvas"
				onDoubleClick={(e:any)=>{
					if([...e.target.classList].includes("canvas")){
						noteGeneration((e.shiftKey || e.ctrlKey),{
							x:Math.round((e.pageX-(window.innerWidth /2))/(10))/4,
							y:Math.round((e.pageY-(window.innerHeight/2))/(10))/4,
						})
					}
				}}
			>{
				__x
				&& canvas.links // implies hydra has finished
				&& canvas.links.map((linkID:any)=>{
					return(<Note key={linkID} passedLink={{uuid:linkID}}/>)
				})
			}</div>
		}
	</>)

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}