/* eslint-disable react-hooks/exhaustive-deps */

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	useRecoilState,
	useRecoilCallback,
	useRecoilValue,
} from "recoil";

import {
	NEO_canvasID_atom,
	NEO_note_atom,
	NEO_note_generation_selector,
	NEO_user_selector,
} from "../store/index";

import
	Note
from "./NoteComponent";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function NEO_Canvas(){

	const canvasID = useRecoilValue(NEO_canvasID_atom)
	const canvas = useRecoilValue(NEO_note_atom(canvasID))

	const noteGeneration = useRecoilCallback(({ set }) => async ( position:{ x:number, y:number }, isLink:boolean )=>{
		set<any>(NEO_note_generation_selector,{
			canvasID,
			position,
			isLink,
		});
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	return(<>
		{
			__x
			&& canvas.color // TODO: switch to property "initialized" or something
			&& <div
				style={{
					position:`relative`,
					height:`100%`, width:`100%`,
					backgroundColor:canvas.color,
				}}
				className="canvas"
				onDoubleClick={(e:any)=>{
					if([...e.target.classList].includes("canvas")){
						noteGeneration({
							x:Math.round((e.pageX-(window.innerWidth /2))/(10))/4,
							y:Math.round((e.pageY-(window.innerHeight/2))/(10))/4,
						}, (e.shiftKey || e.ctrlKey))
					}
				}}
			>{
				__x
				&& canvas.links // implies the hydra has finished expanding it
				&& canvas.links.map((link:any)=>{
					return(<Note key={link} passedLink={{uuid:link}}/>)
				})
			}</div>
		}
	</>)

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}

	/*
	useEffect(()=>{
		if(!canvas.color){
			canvasIDΔ(user.origin)
		}
	},[
		canvas,
		user,
	]);
	*/
