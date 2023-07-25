import { __x, __o, } from '../tools/defaults';

import { useRecoilState, useRecoilValue } from 'recoil';
import { view_atom, NEO_user_selector } from './RecoilComponent';

import Recoil from "./RecoilComponent";
import Canvas from "./CanvasComponent";
import Frame from "./FrameComponent";
import Sidebar from "./SidebarComponent";
import Report from "./ReportComponent";

import { Suspense, useEffect, useState } from 'react';

export default function Spine(props:any){
	//console.log("spine component rendered")

	const [ isMobile, isMobileΔ ] = useState(!window.matchMedia("(pointer: fine)").matches)

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
					&& isMobile
					&& <Delay content = "Not ready for mobile... yet!">
						<button onClick={() => isMobileΔ(false)}>
							Proceed anyway?
						</button>
					</Delay>
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

function Delay({content, children}:any){
	return(<>
		<div
			className='centerflex'
			style={{
				textAlign:`center`,
				overflow:`hidden`,
				width:`${100}%`,
				height:`${100}%`,
			}}
		>
			<h1 style={{
				transform:`translate(${0}%, ${-50}%)`,
			}}>
				<div
					style={{
						pointerEvents:`none`,
						userSelect:`none`,
					}}
				>
					{content}
				</div>
				<div>
					{children}
				</div>
			</h1>
		</div>
	</>)
}