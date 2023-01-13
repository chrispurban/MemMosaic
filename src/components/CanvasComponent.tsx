import { useInterval, recolor } from '../tools/functions';
import { __x, __o } from '../tools/defaults';
import emoji from '../tools/emojis';
import {
	canvasID_atom,
	node_atom,
	link_atom,
	scale_atom,
	selectedNodeID_atom,
	pocketID_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
	memo,
	useState,
	useEffect,
	useRef,
} from 'react';

import Link from "./LinkComponent";

//import './../App.scss';

//import Link from "./LinkComponent";

import localStorage from 'store2';

////////////////////////////////////////////////////////////////////////////////////////////

export default function Canvas(){
	
	const [ pocketID, pocketIDΔ ] = useRecoilState(pocketID_atom)
	const [ canvasID, canvasIDΔ ] = useRecoilState(canvasID_atom)
	const [ node, nodeΔ ] = useRecoilState(node_atom(canvasID))
	// probably memoization somewhere to leave other links alone when node.links is updated
	const selectedNodeIDΔ = useSetRecoilState(selectedNodeID_atom)

	const scale = useRecoilValue(scale_atom)

	const [ editingText, editingTextΔ ] = useState(false);
	const [ editingIcon, editingIconΔ ] = useState(false);
	const [ textInputValue, textInputValueΔ ] = useState('')
	const [ iconInputValue, iconInputValueΔ ] = useState('')

	const [ sustainedInput, sustainedInputΔ ] = useState(null)
	useInterval(
		sustainedInput, ()=>{
			sustainedInputΔ(null)
			console.log("creating new link")
			/*
			nodeGeneration(
				e.ctrlKey,
				(Math.round((e.pageX-(window.innerWidth/2))/(scale.unit/2)))/6,
				(Math.round((e.pageY-(window.innerHeight/2))/(scale.unit/2)))/6
			);
			*/
		}
	);
	// future version to be passed what happens after delay
	// overcomplicated? useInterval is meant to support repetition and you've disabled it
	// begins with just sustainedInputΔ(800)

	//const [canvasRef, measured] = useMeasure();
	//const canvasRef = useRef();

	////////////////////////////////////////////////////////////////////////////////////////////

	function nodeGeneration(giveCanvas:any, placeX:any, placeY:any){

		const linkIDs = localStorage(`links`).map((x:any)=>{return x.id}) // flatten list of links to their IDs
		let linkNewID:any = null
		do{linkNewID = `L ${Math.random().toString().slice(2, 34)}`}
		while(linkIDs.includes(linkNewID));
		console.log(`unique link ID generated ${linkNewID}`)

		const nodeIDs = localStorage(`nodes`).map((x:any)=>{return x.id}) // flatten list of nodes to their IDs
		let nodeNewID:any = null
		do{nodeNewID = `N ${Math.random().toString().slice(2, 34)}`}
		while(nodeIDs.includes(nodeNewID));
		console.log(`unique node ID generated ${nodeNewID}`)

		console.log(`placing at x:${placeX} y:${placeY}`)

		localStorage.transact('links', (content)=>{
			content.push({
				id:linkNewID,
				nodes:[canvasID.toString(), nodeNewID],
				position:{x:placeX,y:placeY,},
				length:giveCanvas?{x:3,y:1,}:{x:6,y:2,},
				canTravel:giveCanvas,
			})
		})

		localStorage.transact('nodes', (nodeList)=>{
			nodeList.push({
				id:nodeNewID,
				text:``,
				icon:giveCanvas?emoji():null,
				links:[linkNewID],
				color:recolor(node.color,{
					hue:giveCanvas?-(Math.floor(Math.random()*(canvasID=="N 0"?360:76)) + 15):0,
					sat:giveCanvas?`${Math.floor(Math.random() * 11) + 30}`:0,
					lum:giveCanvas?`${Math.floor(Math.random() * 11) + 80}`:0, // should cap at 90
				}),
			})
		})

		//if(canvasID != "N 0"){
			nodeΔ((n:any)=>{ return{...n,links:[...n.links, linkNewID]} })
		//}
		// this just updates the main node here, updates its list of links
		// does not put a new node or link into the pool

		selectedNodeIDΔ(nodeNewID)
	}


	////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////

	return(
		<>
		
			<div
				style={{
					position:'relative',
					height:'100%', width:'100%',
					backgroundColor:node.color,
				}}
				className="canvas"
				onTouchStart={(e)=>{
					console.log("touch begin")
					//if([...e.target.classList].includes("canvas")){sustainedInputΔ(800)}
					// you do want this constrained to mobile, as on tablet this opens right-click menu
				}}
				onTouchEnd={(e)=>{
					sustainedInputΔ(null)
				}}
				onDoubleClick={(e:any)=>{
					if([...e.target.classList].includes("canvas")){
						console.log(`doubleclick detected in empty canvas at x:${e.pageX} y:${e.pageY}`)
						nodeGeneration(
							e.ctrlKey,
							(Math.round((e.pageX-(window.innerWidth/2))/(scale.unit/2)))/6,
							(Math.round((e.pageY-(window.innerHeight/2))/(scale.unit/2)))/6
						);
							/*
						*/
					}
				}}
			>
				{
					node.links.map(
						(linkID:any)=>{
							return(
								<Link key={linkID} linkID={linkID}/>
							)
						}
					)
				}
				
			</div>

		</>
	)

}