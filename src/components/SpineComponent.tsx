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

console.error(`Secret tip: to reset local storage, hold ALT and double-click the top bar.`)

export default function Spine(props:any){

	if(
		__o // protection against having nothing to read
		||(!localStorage("canvas"))
		||(!localStorage("links"))
		||(!localStorage("nodes"))
	){
		resetApp()
	}

	const canvasID = useRecoilValue(canvasID_atom)
	const selectedNodeIDΔ = useSetRecoilState(selectedNodeID_atom)
	useEffect(()=>{selectedNodeIDΔ(null)},[canvasID]);


	return(
		<>
			<Frame/>
			<Canvas/>
			<Report/>
		</>
	)
}