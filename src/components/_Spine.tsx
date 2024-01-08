import {
	__x,
	__o,
} from '../tools/defaults';

import {
	Suspense,
	useState,
} from 'react';

import Recoil from "./RecoilComponent";
import Canvas from "./CanvasComponent";
import Frame from "./FrameComponent";
import Sidebar from "./SidebarComponent";
import Report from "./ReportComponent";
import Control from "./ControlComponent";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Spine(props:any){

	const [ isMobile, isMobileΔ ] = useState(!window.matchMedia("(pointer: fine)").matches)
	// run separately from the rest of Report to block view of the app faster, and because TODO: the block will eventually be removed

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	return(<>
		<div style={{
			position:'relative',
			width:'100vw', maxWidth:'100svw',
			height:'100vh', maxHeight:'100svh',
		}}>

			<Suspense fallback = {<></>}>
				<Recoil/> {/* refreshes often, keep isolated */}
			</Suspense>

			<Suspense fallback = {
				<Delay content = "Loading..."/>
			}>
				<Report/>	{/* observes what browser and system the user is on */}
				<Control/>	{/* responds to keyboard shortcuts beyond the scope of a single note */}
				<Canvas/>	{/* contains notes and draws the background */}
				<Frame/>		{/* top and bottom global interface */}
				<Sidebar/>	{/* left and right global interface */}
			</Suspense>

			{
				/* TODO: remove this block entirely once mobile controls are active */
				__x
				&& isMobile
				&& <Delay content = "Not ready for mobile... yet!">
					<button onClick={() => isMobileΔ(false)}>
						Proceed anyway?
					</button>
				</Delay>
			}

		</div>
	</>)

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}

function Delay({content, children}:any){
	return(<>
		<div
			className='centerflex'
			style={{
				position:`absolute`,
				zIndex:`6000`,
				top:`0`,
				left:`0`,
				height:`${100}%`,
				width:`${100}%`,
				textAlign:`center`,
				overflow:`hidden`,
				backgroundColor:`white`,
			}}
		>
			<h1 style={{
				transform:`translate(${0}%, ${-50}%)`,
			}}>
				<div style={{
					pointerEvents:`none`,
					userSelect:`none`,
				}}>
					{content}
				</div>
				<div>
					{children}
				</div>
			</h1>
		</div>
	</>)
}