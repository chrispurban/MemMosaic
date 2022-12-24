import { __x, __o } from '../tools/defaults';
import { useInterval, recolor, resetApp } from '../tools/functions';
import {
	scale_atom,
	atlas_selector,
	selectedNodeID_atom,
	canvasID_atom,
	node_atom,
	link_atom,
	pocketID_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
	memo,
	useState,
	useEffect,
	useRef,
} from 'react';
import React from 'react';

//import './../App.scss';

import Link from "./LinkComponent";
import Node from "./NodeComponent";
import Login from "./LoginComponent";

import Draggable from 'react-draggable';
import * as localStorage from 'store2';

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Frame(){

	const scale = useRecoilValue(scale_atom);
	

	const [ canvasID, canvasIDΔ ] = useRecoilState(canvasID_atom); // change which canvas is active
	const [ canvasNode, canvasNodeΔ ] = useRecoilState(node_atom(canvasID));

	const [ pocketID, pocketIDΔ ] = useRecoilState(pocketID_atom);
	const [ pocketNode, pocketNodeΔ ] = useRecoilState(node_atom(pocketID));

	const textRef = useRef(null);
	const componentRef = useRef(null);

	function proxyNode(passedNode:any, x:any, y:any ){
		return({
			...passedNode,
			length:{x:x,y:y,},
			canTravel:true,
		})
	}

	//console.log(`proxy`,proxyNode(canvasNode))

	const baseStyle:React.CSSProperties = {
		display:`flex`,
		position:`absolute`,
		left:`0px`, right:`0px`,
		height:`60px`,
		outline:`2px solid ${recolor(canvasNode.color, {lum:-30,sat:0,hue:0,})}`,
		backgroundColor:recolor(canvasNode.color, {lum:-10,sat:0,hue:0,}),
		alignItems:`center`, justifyContent:`center`,
		userSelect:`none`,
		zIndex:4,
	}



  	////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function FrameTop(){
		
		return(<>
			{
				__x
				&& canvasNode
				&& <Node proxyNode={proxyNode( canvasNode, 3+(3*3)/4, 1+(1*1)/4 )} inHeader={true}/>
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

	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	function FrameBottom(){
		
		// if this gets moved up into the main frame function, drag effect will get stuck, requiring two clicks
		// apparently this mixing with pocketID doesn't cause a problem though
		// possibly a mounting issue where any property in here would ensure it's updated
		const selectedNodeID = useRecoilValue(selectedNodeID_atom);
		//const [ expanded, expandedΔ ] = useRecoilState(sidebarExpand_atom)
		useEffect(()=>{
			const handleKey = (e:any)=>{
				if(pocketID && !selectedNodeID /*&& !expanded*/){
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
		
		return(<>
			{
				__x
				&& pocketNode
				&& <Node proxyNode={proxyNode( pocketNode, 3, 1 )} inPocket={true}/>
			}
			<div
				style={{
					...baseStyle,
					bottom:`0px`,
					//paddingTop:`4px`,
				}}
			/>
		</>)
	}

	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	return(<>
		<FrameTop/>
		<FrameBottom/>
	</>)

}
