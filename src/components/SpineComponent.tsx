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
			<Canvas/>
			<Frame/>
			<Sidebar/>
		</div>
		<Suspense fallback={<></>}>
			<Recoil/>
			<Report/>
		</Suspense>
	</>)
}