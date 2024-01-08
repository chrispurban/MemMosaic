/* eslint-disable react-hooks/exhaustive-deps */

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	recolor,
} from '../tools/functions';

import {
	useState,
	useEffect,
	useRef,
	useCallback,									
} from 'react';

import {
	useDeviceSelectors,
} from 'react-device-detect';

import {
	useRecoilState,
	useRecoilValue,
} from 'recoil';

import {
	selectedID_atom,
	NEO_user_selector,
	NEO_canvasID_atom,
	NEO_note_atom,
	NEO_pocketID_atom,
} from "../store/index";

import
	Login
from "./LoginComponent";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Sidebar(){
	//console.log("sidebar component rendered")

	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom)
	const [ pocketID, pocketIDΔ ] = useRecoilState(NEO_pocketID_atom)
	const [ note, noteΔ ] = useRecoilState(NEO_note_atom(canvasID))

	const [ selectors, data ] = useDeviceSelectors(window.navigator.userAgent)
	const { isWindows } = selectors

	const user = useRecoilValue(NEO_user_selector)

	const seekOrigin = useCallback(() => {
		if(canvasID == user.origin){ // you're on the origin
			pocketIDΔ("")
		}
		else{
			if(!pocketID || pocketID == user.origin){ // nothing in pocket, save current location as the return point
				pocketIDΔ(canvasID)
			}
			canvasIDΔ(user.origin) // go to origin
		}
	},[
		canvasID,
		pocketID,
		user,
	]);

	const selectedGlobalID = useRecoilValue(selectedID_atom)
	useEffect(()=>{
		const handleKey = (e:any)=>{
			if(!selectedGlobalID && e.key == "Home"){ seekOrigin() }
		};				window.addEventListener(	'keyup', handleKey);
		return ()=>{window.removeEventListener('keyup', handleKey);};
	},[seekOrigin, selectedGlobalID])



	/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	// left sidebar contains travel history, origin at top
	// origin will later be removed in favor of expanded view of the entire map

	function SidebarContent({left, content}:any){
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
					if(componentRef.current && !componentRef.current.contains(e.target)){
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
		


		return(<>
			{
				__x
				&& note.color
				&& <div
					ref={componentRef}
					style={{
						display:`flex`,
						position:'absolute',
						flexDirection:`column`,
						gap:`12px`,
						zIndex:'1000',
						outline:`2px solid ${recolor(note.color, {lum:(-40)})}`,
						background:				recolor(note.color, {lum:(-30)}),
						...(left
							?{
								left:`${expanded?0:10}px`,
								marginRight:`auto`,
							}
							:{
								right:`${expanded?0:10}px`,
								marginLeft:`auto`,
							}
						),
						...(expanded
							?{top:`0px`, width:'260px', height:`100%`, padding:`10px`,}
							:{top:`10px`,}
						),
					}}
				>
					<button
						className='centerflex'
						style={{
							width:'40px', height:'40px',
							textAlign:`center`,
							border:`0px`,
							userSelect:`none`,
							outline:`1px solid ${recolor(note.color, {lum:(expanded?-50:-40)})}`,
							background:				recolor(note.color, {lum:(-20)}),
							...(left
								?{marginRight:`auto`}
								:{marginLeft:`auto`}
							),
						}}
						onClick={(e)=>{
							if(left){ // temporary behavior; once history is added, this will become the first option within it
								seekOrigin()
							}
							else{
								expandedΔ((v:boolean)=>!v)
							}
							e.stopPropagation()
						}}
					>
						<span
							style={{
								...(isWindows
									?{paddingBottom:`3px`,}
									:{paddingTop:`2px`,}
								),
								fontSize:`175%`,
							}}
						>
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
		<SidebarContent left={true} content={
			<>

			</>
		}/>
		<SidebarContent left={false} content={
			<>
				<Login/>
				<div>
					User accounts are authenticated purely by email confirmation link. Changes will only persist with an account.
				</div>
				{
					__o
					&&(
						<pre style={{
							overflowY:`auto`,
							overflowX:`hidden`,
						}}>
							{JSON.stringify(selectors, null, '\r')}
						</pre>
					)
				}
			</>
		}/>
	</>)
}