import { __x, __o, } from '../tools/defaults';
import { recolor, } from '../tools/functions';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useDeviceSelectors } from 'react-device-detect';

import { useRecoilState, useRecoilValue } from 'recoil';

import {
	NEO_canvasID_atom,
	NEO_user_selector,
	NEO_note_atom,
	NEO_pocketID_atom,
} from "./RecoilComponent";
import Login from "./LoginComponent";

/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

export default function Sidebar(){
	//console.log("sidebar component rendered")

	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom)
	const [ pocketID, pocketIDΔ ] = useRecoilState(NEO_pocketID_atom)
	const [ note, noteΔ ] = useRecoilState(NEO_note_atom(canvasID))

	const [ selectors, data ] = useDeviceSelectors(window.navigator.userAgent)
	const { isWindows } = selectors

	const currentID = useRecoilValue(NEO_user_selector).current

	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	// left sidebar contains travel history, origin at top
	// origin will later be removed in favor of expanded view of the entire map

	function Sidebar({left, content}:any){
		const [ expanded, expandedΔ ] = useState(false)
		const componentRef = useRef<HTMLDivElement>(null)

		/////////////////////////////////////////////////////////////////////////////////////
		// HANDLE CLICKING OUTSIDE COMPONENT vvv
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
		// HANDLE CLICKING OUTSIDE COMPONENT ^^^
		/////////////////////////////////////////////////////////////////////////////////////
		
		const user = useRecoilValue(NEO_user_selector)

		return(<>
			{
				__x
				&& note.color
				&& <div
					ref={componentRef}
					style={{
						position:'absolute',
						right:!left?`${expanded?0:10}px`:undefined,
						left:left?`${expanded?0:10}px`:undefined,
						top:`${expanded?0:10}px`,
						...(expanded?{width:'260px', height:`100%`, }:{}),
						zIndex:'1000',
						padding:`${expanded?10:0}px`,
						display:`flex`,
						flexDirection:`column`,
						gap:`12px`,
						backgroundColor:recolor(note.color, {hue:0, lum:(-30), sat:0}),
						outline:`2px solid ${recolor(note.color, {hue:0, lum:(-40), sat:0})}`,
					}}
				>
					<button
						style={{
							marginLeft:left?undefined:`auto`,
							marginRight:!left?undefined:`auto`,
							width:'40px', height:'40px',
							display: `flex`,
							alignItems:`center`, justifyContent:`center`,
							textAlign:`center`,
							border:`0px`,
							backgroundColor:recolor(note.color, {hue:0, lum:(-20), sat:0}),
							outline:`1px solid ${recolor(note.color, {lum:(expanded?-50:-40),hue:0,sat:0})}`,
							userSelect:`none`,
						}}
						onClick={(e)=>{
							if(left){ // temporary behavior; once history is added, this will become the first option within it
								canvasIDΔ(currentID)
								if(canvasID == user.origin){ // you're on the origin
									pocketIDΔ("")
								}
								else{
									if(!pocketID || pocketID == user.origin){ // nothing in pocket, save current location as the return point
										pocketIDΔ(canvasID)
									}
									canvasIDΔ(user.origin) // go to origin
								}
							}
							else{
								expandedΔ((v:boolean)=>!v)
							}
							e.stopPropagation()
						}}
					>
						<span style={{
							paddingTop:`${isWindows?0:2}px`,
							paddingBottom:`${isWindows?3:0}px`,
							fontSize:`175%`,
						}}>
							{left?"🧿":"👤"}
						</span>
					</button>
					{
						__x
						&& expanded
						&&	<div
							style={{
								display:`flex`,
								flexDirection:`column`,
								gap:`20px`,
								height:`calc(100% - 60px)`,
							}}
						>
							{content}
						</div>
					}
				</div>
			}
		</>)
	}

	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	return(<>
		<Sidebar left={true} content={
			<>

			</>
		}/>
		<Sidebar left={false} content={
			<>
				<Login/>
				<div>
					User accounts are authenticated purely by email confirmation link. Changes will only persist with an account.
				</div>
				{
					__o
					&& <pre style={{
					overflowY:`auto`,
					overflowX:`hidden`,
					}}>
						{JSON.stringify(selectors, null, '\r')}
					</pre>
				}
			</>
		}/>
	</>)
}