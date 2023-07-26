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
				<Suspense fallback={
					<Delay content="Loading..."/>
				}>
					<Report/>
					<Canvas/>
					<Frame/>
					<Sidebar/>
				</Suspense>
			}
			{
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