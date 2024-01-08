/* eslint-disable react-hooks/exhaustive-deps */

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	recolor,
} from '../tools/functions';

import {
	useRecoilState,
	useRecoilCallback,
} from "recoil";

import React, {
	useEffect,
} from 'react';

import {
	NEO_canvasID_atom,
	NEO_note_atom,
	NEO_link_atom,
	NEO_pocketID_atom,
} from "../store/index";

import
	Note
from "./NoteComponent";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Frame(){
	//console.log("frame component rendered")

	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom); // change which canvas is active
	const [ canvasNote, canvasNoteΔ ] = useRecoilState(NEO_note_atom(canvasID));

	const [ pocketID, pocketIDΔ ] = useRecoilState(NEO_pocketID_atom);

	const baseStyle:React.CSSProperties = { // experimenting with objects instead of normal CSS
		... canvasNote.color?{
			outline:`2px solid ${recolor(canvasNote.color, {lum:-30})}`,
			backgroundColor:recolor(canvasNote.color, {lum:-10}),
		}:{},
		position:`absolute`,
		left:`0px`, right:`0px`,
		height:`60px`,
		userSelect:`none`,
		zIndex:4,
	}

	const setAtomValue = useRecoilCallback(({ set }) => (atom:any, uuid:string, content:any) => {
		set(atom(uuid), (priorValues:any) => ({
			...priorValues,
			...content,
		}));
	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////

  
	useEffect(()=> {
		setAtomValue(NEO_link_atom, 'CANVAS', {
			position:{x:0,y:-1},
			size:{
				x:3+(3*3)/4,
				y:1+(1*1)/4,
			},
			notes:[canvasID],
			canTravel:true,
			inHeader:true,
		});
	},[
		canvasID,
	]);

	function FrameTop(){
		return(<>
			{
				__x
				&& canvasNote.text // don't expose before first hydra has run
				&&(
					<Note key={"CANVAS"} passedLink={{uuid:"CANVAS"}}/>
				)
			}
			<div
				style={{
					...baseStyle,
					top:`0px`,
					fontSize:`150%`,
				}}
				className='centerflex'
			/>
		</>)
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////

	useEffect(()=> {
		setAtomValue(NEO_link_atom, 'POCKET', {
			position:{x:0,y:+1},
			size:{
				x:3,
				y:1,
			},
			notes:[pocketID],
			canTravel:true,
			inPocket:true,
		});
	},[
		pocketID,
	]);

	function FrameBottom(){
		return(<>
			{
				__x
				&& canvasNote.links // hydra has run, meaning the pocket destination already exists
				&& pocketID
				&&(
					<Note key={"POCKET"} passedLink={{uuid:"POCKET"}}/>
				)
			}
			<div
				style={{
					...baseStyle,
					bottom:`0px`,
				}}
				className='centerflex'
			/>
		</>)
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////

	return(<>
		<FrameTop/>
		<FrameBottom/>
	</>)

}