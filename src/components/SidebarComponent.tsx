import { __x, __o } from '../tools/defaults';
import { useInterval, recolor, } from '../tools/functions';
import Login from "./LoginComponent";
import { useSession, signIn, signOut, } from "next-auth/react";
import { useState } from 'react';
import { trpc, } from "../utils/trpc";
import { useEffect } from 'react';
import { useRef } from 'react';
import { useRecoilState } from 'recoil';
import {
	canvasID_atom,
	node_atom,
	sidebarExpand_atom,
} from "../tools/atoms";

/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

export default function Sidebar(){

	const [ canvasID, canvasIDΔ ] = useRecoilState(canvasID_atom)
	const [ node, nodeΔ ] = useRecoilState(node_atom(canvasID))
	const [ expanded, expandedΔ ] = useRecoilState(sidebarExpand_atom)

	const componentRef = useRef<HTMLDivElement>(null)

	
	/*
	const {data: sessionData} = useSession()

	const {data: secretMessage} = trpc.auth.getSecretMessage
		.useQuery(
			undefined, // no input
			{enabled: sessionData?.user !== undefined},
		);

	const hello = trpc.example.hello
		.useQuery(
			{ text: "from tRPC" }
		);
	*/


	/// HANDLE CLICKING OUTSIDE COMPONENT ///
	useEffect(()=>{
		const handleKey = (e:any)=>{
			if(e.key == "Escape"){expandedΔ(false)}
		};
		const handleClick = (e:any)=>{
			if(expanded){
				if(componentRef.current && !componentRef.current.contains(e.target)){ // clicked outside component
					expandedΔ(false)
				}
			}
		};				window.addEventListener(	'keyup', handleKey);	document.addEventListener(		'click', handleClick)
		return ()=>{window.removeEventListener('keyup', handleKey);	document.removeEventListener(	'click', handleClick)};
	},[
		expanded,
	]);

	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	function SidebarLeft(){return(<>
		<div
			ref={componentRef}
			style={{
				position:'absolute',
				left:`${expanded?0:10}px`, top:`${expanded?0:10}px`,
				...(expanded?{width:'260px', height:`100vh`, }:{}),
				zIndex:'1000',
				padding:`${expanded?10:0}px`,
				display:`flex`,
				flexDirection:`column`,
				gap:`12px`,
				backgroundColor:recolor(node.color, {hue:0, lum:(-30), sat:0}),
				outline:`2px solid ${recolor(node.color, {hue:0, lum:(-40), sat:0})}`,
			}}
		>
			<button
				style={{
					width:'40px', height:'40px',
					display: `flex`,
					alignItems:`center`, justifyContent:`center`,
					textAlign:`center`,
					border:`0px`,
					paddingBottom:`2px`,
					fontSize:`150%`,
					backgroundColor:recolor(node.color, {hue:0, lum:(-20), sat:0}),
					outline:`1px solid ${recolor(node.color, {lum:(expanded?-50:-40),hue:0,sat:0})}`,
					userSelect:`none`,
				}}
				onClick={(e)=>{
					expandedΔ((v:boolean)=>!v)
					e.stopPropagation()
				}}
			>
				👤
			</button>
			{
				__x
				&& expanded
				&&	<div
					style={{
						display:`flex`,
						flexDirection:`column`,
						gap:`20px`,
					}}
				>
					<Login/>
					<div>
						User accounts are authenticated purely by email confirmation link
					</div>
					<div>
						They are not currently connected to anything
					</div>
				</div>
			}
		</div>
	</>)}

	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	function SidebarRight(){
	
		// convert top bar to toggle for a menu for editing the canvas properties
		// right sidebar contains travel history, origin at top
		// origin will later be removed in favor of expanded view of the entire network that's not tied to anything
		return(<>
			{
				__o
				&&	<div
					style={{
						position:'absolute',
						right:'10px', top:'10px',
						height:'40px',
						//width:'120px',
						textAlign:`center`,
						zIndex:'900',
						backgroundColor:'black',
					}}
				>
					{/*
						__o 
						&& secretMessage
						&& <span> - {secretMessage}</span>
					}
					{
						hello.data ? hello.data.greeting : "Loading tRPC query..."
					*/}
				</div>
			}
		</>)
	}

	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	return(<>
		<SidebarLeft/>
		<SidebarRight/>
	</>)

}