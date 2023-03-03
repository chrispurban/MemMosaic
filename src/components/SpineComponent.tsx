import { __x, __o, defaultNodes, defaultLinks } from '../tools/defaults';
import { resetApp } from '../tools/functions';
import { useSession, } from "next-auth/react";
import {
	canvasID_atom,
	node_atom,
	link_atom,
	scale_atom,
	selectedNodeID_atom,
	pocketID_atom,
	NEO_session_atom,
	NEO_canvasID_atom,
	NEO_hydra_selector,
	NEO_link_atom,
} from "../tools/atoms";
import {
	atom,
	selector,
	useRecoilState,
	useRecoilValue,
	useSetRecoilState,
	useRecoilSnapshot,
} from "recoil";
import {
	memo,
	useState,
	useEffect,
	useRef,
	Suspense,
} from 'react';
import localStorage from "store2";

import Frame from "./FrameComponent";
import Canvas from "./CanvasComponent";
import NEO_Canvas from "./NEO_CanvasComponent";
import Report from "./ReportComponent";
import Sidebar from './SidebarComponent';

if(
	__o // protection against an outdated app version or having nothing to read
	||(!localStorage("canvas"))
	||(!localStorage("links"))
	||(!localStorage("nodes"))
	||(!localStorage("lastDownload"))
){
	resetApp()
}
else{
	const currentRelease = new Date(`${process.env.NEXT_PUBLIC_LATEST_RELEASE}`)
	const lastDownload = new Date(localStorage("lastDownload"))
	console.log("Last version saved:", lastDownload)
	if(lastDownload <= currentRelease){ 
		console.log("in possession of an outdated version")
		resetApp()
	}
}

console.error(`Secret tip: to reset local storage, hold ALT and double-click the top bar.`)

export default function Spine(props:any){

	const sessionData = useSession(); // returned object's .data property is assigned and renamed to sessionData
	const [ NEO_session, NEO_sessionΔ ] = useRecoilState(NEO_session_atom)
	useEffect(()=>{NEO_sessionΔ(sessionData)},[sessionData]);
	// unclear how to otherwise pass authentication information to Recoil in as simply a manner

	
	useEffect(()=>{const hk=(e:any)=>{if(e.key=="Home"){console.error(
		"user session",
		sessionData
	)}};window.addEventListener('keyup',hk);return()=>{window.removeEventListener('keyup',hk);};},[
		sessionData
	])
		
	const panopticon = useRecoilSnapshot()
	useEffect(()=>{const hk=(e:any)=>{if(e.key=="End"){
		for (const node of panopticon.getNodes_UNSTABLE({isModified: true})) {
			console.warn(node.key, panopticon.getLoadable(node));
		}
	}};window.addEventListener('keyup',hk);return()=>{window.removeEventListener('keyup',hk);};},[
		panopticon
	])
 
		
		
	const canvasID = useRecoilValue(canvasID_atom)
	const selectedNodeIDΔ = useSetRecoilState(selectedNodeID_atom)
	useEffect(()=>{selectedNodeIDΔ(null)},[canvasID]); // deselect because you've effectively refreshed the page

	
	return(<>
	{/*//////////////////////////////////////////////////////////////*/}
		<div style={{
			position:'relative',
			width:'100vw', maxWidth:'100svw',
			height:'200vh', maxHeight:'200svh',
		}}>
			<Suspense fallback={<div></div>}>
				{
					__x
					&& NEO_session
					&& <NEO_Canvas/>
				}
			</Suspense>
		</div>
	{/*//////////////////////////////////////////////////////////////*/}
		<div style={{
			position:'relative',
			width:'100vw', maxWidth:'100svw',
			height:'100vh', maxHeight:'100svh',
		}}>
			<Sidebar/>
			<Frame/>
			<Canvas/>
			<Report/>
		</div>
	{/*//////////////////////////////////////////////////////////////*/}
	</>)
}