import { __x, __o, defaultNodes, defaultLinks } from '../tools/defaults';
import { resetApp } from '../tools/functions';
import {
	canvasID_atom,
	selectedNodeID_atom,
	node_atom,
 } from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
	memo,
	useState,
	useEffect,
	useRef,
} from 'react';
import localStorage from "store2";

import Frame from "./FrameComponent";
import Canvas from "./CanvasComponent";
import Report from "./ReportComponent";
import Sidebar from './SidebarComponent';


if(
	__o // protection against having nothing to read
	||(!localStorage("canvas"))
	||(!localStorage("links"))
	||(!localStorage("nodes"))
){
	resetApp()
}


const now = new Date
console.log(`The time is now`, now.toISOString())
console.error(`Secret tip: to reset local storage, hold ALT and double-click the top bar.`)


const currentRelease = new Date(`2022-12-24T02:20:00.000Z`)
if(!localStorage("lastDownload")){
	localStorage("lastDownload", now)
}
else{
	let lastDownload = new Date(localStorage("lastDownload"))
	if(lastDownload <= currentRelease){ // in possession of an outdated version		
		resetApp()
	}
}


export default function Spine(props:any){

	const canvasID = useRecoilValue(canvasID_atom)
	const selectedNodeIDΔ = useSetRecoilState(selectedNodeID_atom)
	useEffect(()=>{selectedNodeIDΔ(null)},[canvasID]);

	return(
		<>
			<Sidebar/>
			<Frame/>
			<Canvas/>
			<Report/>
		</>
	)
}