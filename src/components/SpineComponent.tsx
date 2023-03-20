import { __x, __o, } from '../tools/defaults';

import Recoil from "./RecoilComponent";
import Canvas from "./CanvasComponent";
import Frame from "./FrameComponent";
import Sidebar from "./SidebarComponent";
import Report from "./ReportComponent";

import { Suspense } from 'react';

/*
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
*/

export default function Spine(props:any){
	//console.log("spine component rendered")

	/*
	const sessionData = useSession(); // returned object's .data property is assigned and renamed to sessionData
	const [ NEO_session, NEO_sessionΔ ] = useRecoilState(NEO_session_atom)
	useEffect(()=>{NEO_sessionΔ(sessionData)},[sessionData]);
	// unclear how to otherwise pass authentication information to Recoil in as simple a manner
	*/

	/*
	useEffect(()=>{const hk=(e:any)=>{if(e.key=="Home"){console.error(
		"user session",
		sessionData
	)}};window.addEventListener('keyup',hk);return()=>{window.removeEventListener('keyup',hk);};},[
		sessionData
	])
	*/
		
	/*
	const panopticon = useRecoilSnapshot()
	useEffect(()=>{const hk=(e:any)=>{if(e.key=="End"){
		for (const node of panopticon.getNodes_UNSTABLE({isModified: true})) {
			console.warn(node.key, panopticon.getLoadable(node));
		}
	}};window.addEventListener('keyup',hk);return()=>{window.removeEventListener('keyup',hk);};},[
		panopticon
	])
	*/

	/*		
	const canvasID = useRecoilValue(canvasID_atom)
	const selectedNodeIDΔ = useSetRecoilState(selectedNodeID_atom)
	useEffect(()=>{selectedNodeIDΔ(null)},[canvasID]); // deselect because you've effectively refreshed the page
	*/

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