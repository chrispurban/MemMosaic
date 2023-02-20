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
} from "../tools/atoms";
import {
	atom,
	selector,
	useRecoilState,
	useRecoilValue,
	useSetRecoilState,
} from "recoil";
import {
	memo,
	useState,
	useEffect,
	useRef,
} from 'react';
import localStorage from "store2";

import Frame from "./FrameComponent";
import Canvas from "./CanvasComponent";
import NEO_Canvas from "./NEO_CanvasComponent";
import Report from "./ReportComponent";
import Sidebar from './SidebarComponent';

const now = new Date
console.log(`The time is now`, now.toISOString())


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
	console.log("time of last download:", lastDownload)
	if(lastDownload <= currentRelease){ 
		console.log("in possession of an outdated version")
		resetApp()
	}
}

console.error(`Secret tip: to reset local storage, hold ALT and double-click the top bar.`)

export default function Spine(props:any){

	const {data: sessionData} = useSession(); // returned object's .data property is assigned and renamed to sessionData
	const NEO_sessionΔ = useSetRecoilState(NEO_session_atom)
	useEffect(()=>{NEO_sessionΔ(sessionData)},[sessionData]);

	const canvasID = useRecoilValue(canvasID_atom)
	const selectedNodeIDΔ = useSetRecoilState(selectedNodeID_atom)
	useEffect(()=>{selectedNodeIDΔ(null)},[canvasID]); // deselect because you've effectively refreshed the page


	useEffect(()=>{const hk=(e:any)=>{if(e.key=="Home"){console.error(
			"user session",
			sessionData
		)}};window.addEventListener('keyup',hk);return()=>{window.removeEventListener('keyup',hk);};},[
			sessionData
	])

	return(<>
	{/*//////////////////////////////////////////////////////////////*/}
		<div style={{
			position:'relative',
			width:'100vw', maxWidth:'100svw',
			height:'50vh', maxHeight:'50svh',
		}}>
			<NEO_Canvas/>
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