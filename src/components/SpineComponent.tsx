import { __x, __o, } from '../tools/defaults';

import { useRecoilState, useRecoilValue } from 'recoil';
import { view_atom, NEO_user_selector } from './RecoilComponent';

import Recoil from "./RecoilComponent";
import Canvas from "./CanvasComponent";
import Frame from "./FrameComponent";
import Sidebar from "./SidebarComponent";
import Report from "./ReportComponent";

import { Suspense, useEffect } from 'react';

export default function Spine(props:any){
	//console.log("spine component rendered")

	return(<>
		<div style={{
			position:'relative',
			width:'100vw', maxWidth:'100svw',
			height:'100vh', maxHeight:'100svh',
		}}>
			{ // this fallback will activate every time the hydra runs
				<Suspense fallback={<></>}>
					<Recoil/>
				</Suspense>
			}
			{
				__o
				||(
					__x
					&& !window.matchMedia("(pointer: fine)").matches
					&& <Delay content = "Not ready for mobile... yet!"/>
				)
				||(
					<Suspense fallback={
						<Delay content="Loading..."/>
					}>
						<Report/>
						<Canvas/>
						<Frame/>
						<Sidebar/>
					</Suspense>
				)
			}
		</div>
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