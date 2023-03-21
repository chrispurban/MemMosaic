import { __x, __o, } from '../tools/defaults';

import Recoil from "./RecoilComponent";
import Canvas from "./CanvasComponent";
import Frame from "./FrameComponent";
import Sidebar from "./SidebarComponent";
import Report from "./ReportComponent";

import { Suspense } from 'react';

export default function Spine(props:any){
	//console.log("spine component rendered")

	return(<>
			<div style={{
				position:'relative',
				width:'100vw', maxWidth:'100svw',
				height:'100vh', maxHeight:'100svh',
			}}>
				<Suspense fallback={<Loading/>}>
					<Canvas/>
					<Frame/>
					<Sidebar/>
				</Suspense>
			</div>

			<Suspense fallback={<></>}>
				<Recoil/>
				<Report/>
			</Suspense>
	</>)
}

function Loading(){
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
				Loading...
			</h1>
		</div>
	</>)
}