import { __x, __o, } from '../tools/defaults';

import { useRecoilState } from 'recoil';
import { useDeviceSelectors } from 'react-device-detect';

import { view_atom } from './RecoilComponent';

import Recoil from "./RecoilComponent";
import Canvas from "./CanvasComponent";
import Frame from "./FrameComponent";
import Sidebar from "./SidebarComponent";
import Report from "./ReportComponent";

import { Suspense, useEffect } from 'react';

export default function Spine(props:any){
	//console.log("spine component rendered")

	const [ view, viewΔ ] = useRecoilState<any>(view_atom);

	return(<>
		<Report/>

		<Suspense fallback={<></>}>
			<Recoil/>
		</Suspense>

		<div style={{
			position:'relative',
			width:'100vw', maxWidth:'100svw',
			height:'100vh', maxHeight:'100svh',
		}}>{
			__x
			&& view.system
			&& (
				__o
				|| (view.system.isTouch && <Delay content = "Not ready for mobile... yet!"/>)
				|| <Suspense fallback={<Delay content="Loading..."/>}>
					<Canvas/>
					<Frame/>
					<Sidebar/>
				</Suspense>
			)
		}</div>
	</>)
}

function Delay({content}:any){
	return(<>
		<div style={{						display:`flex`,

			overflow:`hidden`,			justifyContent:`center`,		
			pointerEvents:`none`,		alignItems:`center`,				
			userSelect:`none`,			textAlign:`center`,				

			width:`${100}%`,
			height:`${100}%`,

		}}>
			<h1 style={{
				transform:`translate(${0}%, ${-50}%)`,
			}}>
				{content}
			</h1>
		</div>
	</>)
}