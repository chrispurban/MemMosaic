import { __x, __o, } from '../tools/defaults';
import { useInterval, recolor, resetApp, } from '../tools/functions';
import {
  scale_atom,
  view_atom,
  link_atom,
  node_atom,
  canvasID_atom,
  pocketID_atom,
  atlas_selector,
  selectedNodeID_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import { memo, useState, useEffect, useRef, } from 'react';

//import './../App.scss';

import Draggable from 'react-draggable';

import localStorage from 'store2';

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

export default function Node({proxyNode, inPocket, onCanvas}:any){

	const atlas = useRecoilValue(atlas_selector);
	const scale = useRecoilValue(scale_atom);
	const view = useRecoilValue(view_atom);

	const [ selectedNodeID, selectedNodeIDΔ ] = useRecoilState(selectedNodeID_atom);
  	const [ canvasID, canvasIDΔ ] = useRecoilState(canvasID_atom);
  	const [ canvasNode, canvasNodeΔ ] = useRecoilState(node_atom(canvasID));

	const [ pocketID, pocketIDΔ ]:any = useRecoilState(pocketID_atom);
	const [ pocketNode, pocketNodeΔ ] = useRecoilState(node_atom(pocketID));

	const targetNodeΔ = useSetRecoilState(node_atom(proxyNode.id));
	const linkΔ = useSetRecoilState(link_atom(proxyNode.linkMaster));

	const textRef:any = useRef<HTMLInputElement>(null);
	const componentRef = useRef<HTMLDivElement>(null);
	const draggableRef = useRef<HTMLDivElement>(null);  

	const [ dragEnabled, dragEnabledΔ ] = useState(true)
	const [ dragActive, dragActiveΔ ] = useState(false)
		useEffect(()=>{if(!dragEnabled){dragActiveΔ(false)}},[dragEnabled]);
		// there may be a better way to do this
		// beta.reactjs.org/learn/you-might-not-need-an-effect

	const [ textEditable, textEditableΔ ] = useState(proxyNode.text.length == 0);
	const [ textChanged, textChangedΔ ] = useState(false)
		useEffect(()=>{if(!textEditable){textChangedΔ(false)}},[textEditable]);

	const [ textInputValue, textInputValueΔ ] = useState('');
	useEffect(()=>{
		if(!textEditable){textInputValueΔ(proxyNode.text)}
	},[
		proxyNode, textEditable
	]);

	
	const [ protectedClickOut, protectedClickOutΔ ] = useState(false);
	useEffect(()=>{ // for if you started highlighting while editing text and then dragged out
		const handleClick = (e:any)=>{
			if(componentRef.current && componentRef.current.contains(e.target))
				{if(!protectedClickOut){protectedClickOutΔ(true)}}
			else if(protectedClickOut){protectedClickOutΔ(false)}
		}
		document.addEventListener('mousedown',handleClick);
		return()=>{document.removeEventListener('mousedown',handleClick)};
   },[protectedClickOut]);

	///////////////////////////////////////////////////////////////////////////////////////

	function linkGeneration(position:any){
		console.log(`creating link at x:${position.x} y:${position.y}`)
		const linkIDs = localStorage(`links`).map((x:any)=>{return x.id}) // strip list of links to their IDs
		
		let linkNewID:any = null
		do{linkNewID = `L ${Math.random().toString().slice(2, 34)}`} // cut off "0."
		while(linkIDs.includes(linkNewID)); // repeat until new ID is obtained
		console.log(`unique link ID generated ${linkNewID}`)

		localStorage.transact('links', (content)=>{
		  content.push({
			 id:linkNewID,
			 nodes:[canvasID.toString(), pocketID.toString()],
			 position:{
				x:(position.x/(3*scale.unit)),
				y:(position.y/(3*scale.unit)),
			 },
			 length:{
				x:3,
				y:1,
			 },
			 hasCanvas:true,
		  })
		})
		canvasNodeΔ((n:any)=>{ return{...n,links:[...n.links, linkNewID]} })
		pocketNodeΔ((n:any)=>{ return{...n,links:[...n.links, linkNewID]} })
		pocketIDΔ(null)
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function linkDestruction(removedID:any){
		console.error(`deleting link ${removedID}`)

		const linkFilter = (n:any)=>{ return{...n, links:n.links.filter( (l:any)=>{return l!==removedID} )} }

		canvasNodeΔ(linkFilter); // strip link from original node record; atom saves on cold storage
		localStorage.transact('links', (content)=>{ // delete link record from cold storage
			content.splice(content.findIndex((i:any)=>i.id==removedID), 1);
		})

		targetNodeΔ(linkFilter); // strip link from targeted node record; atom saves on cold storage

		// linkFilter(proxyNode).links.length == 0 &&
		// if(pocketID == proxyNode.id){pocketIDΔ(null)} // prevent pocket from holding a ghost

		if(!proxyNode.hasCanvas){ // unlinked a text node
			console.error(`deleting node ${proxyNode.id}`)
			localStorage.transact('nodes', (content)=>{ // delete node record from cold storage
				content.splice(content.findIndex((i:any)=>i.id==proxyNode.id), 1);
			})
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////
	
	function onStart(event:any, data:any){ //console.log(`${proxyNode.id} start detected`)
		if(selectedNodeID!==proxyNode.id && !event.altKey){// not coming from a duplicate
			selectedNodeIDΔ(proxyNode.id)
			
		}
		if(textRef.current && textRef.current.contains(event.target)){ // don't drag if clicking textbox
			return(false)
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////
	
	function onDrag(event:any ,data:any){ //console.log(`${proxyNode.id} drag detected`)
		if(dragEnabled && !onCanvas){
			dragActiveΔ(true)
		}
		else{
			return false
			// this only triggers the next time you try to move it
			// figure out how you made it pull back even from stationary; not onStart
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////

	function onStop(event:any ,data:any){ //console.log(`${proxyNode.id} stop detected`)
		if(dragActive){
			dragActiveΔ(false)
			if(selectedNodeID==proxyNode.id && !textEditable){selectedNodeIDΔ(null)} // deselect if not still editing
			const insideFrame = (view.pxAbsolute/2)-(60+2)-(.5*scale.unit*proxyNode.length.y)
			// 60 is the frame section height, 2 is from their outlines
			if(data.y < -insideFrame){ // higher than top frame
				if(proxyNode.hasCanvas){
					pocketIDΔ(canvasID)
					canvasIDΔ(proxyNode.id) // also put the current canvas in the pocket
				}
			}
			else if(data.y > insideFrame){ // lower than bottom frame
				if(proxyNode.hasCanvas){pocketIDΔ(proxyNode.id)}
			}
			else{
				// was dragged somewhere else
				const overlapped = atlas // see if it overlapped another link
					.filter((plot:any)=>{return (
						__x
						&& proxyNode.hasCanvas // valid to pocket
						&& plot.hasCanvas // valid as a destination
						&& plot.id !== proxyNode.linkMaster // isn't just its original position
					)})
					.find((plot:any)=>{return !(
						__o // overlaps
						|| data.x >= Math.round(scale.unit*((plot.position.x*3)+     plot.length.x))
						|| data.y >= Math.round(scale.unit*((plot.position.y*3)+     plot.length.y))
						|| data.x <= Math.round(scale.unit*((plot.position.x*3)-proxyNode.length.x))
						|| data.y <= Math.round(scale.unit*((plot.position.y*3)-proxyNode.length.y))
					);})
				if(overlapped){
					// was dragged onto a link
					pocketIDΔ(proxyNode.id)
					canvasIDΔ(overlapped.nodes.target.id)
				}
				else{ // was dragged into empty space
					if(inPocket || onCanvas){ // new node to clone
						linkGeneration(data)
						selectedNodeIDΔ(null)
					}
					else{ // already existed
						linkΔ((l:any)=>{
							return {...l,position:{
								x:(data.x/(3*scale.unit)),
								y:(data.y/(3*scale.unit)),
							}}
						})
					}
				}
			}

		}
		else if(dragEnabled){ // did not drag
			if(event.ctrlKey || !proxyNode.hasCanvas || (onCanvas && !event.altKey)){ // trying to edit
				textEditableΔ(true)
			}
			else if(!textEditable){
				if(inPocket || (onCanvas && !event.altKey)){pocketIDΔ(canvasID)} // navigating from pocket exchanges with destination
				canvasIDΔ(proxyNode.id)
			}
		}
		
		dragEnabledΔ(true)
		
	}
	
	///////////////////////////////////////////////////////////////////////////////////////
	
	useEffect(()=>{
		if(textEditable){
			const end = textInputValue.length
			textRef.current.setSelectionRange(end, end)
			textRef.current.focus()
		}
	},[
		textEditable,
		//textInputValue, // relying on reloaded value from drag, otherwise interrupts midway edits
		dragActive,
	]);
	
	///////////////////////////////////////////////////////////////////////////////////////
	
	useEffect(()=>{
		const handleKey = (e:any)=>{
			if(textEditable){
				if(
					__o
					||(e.key == "Delete" && e.ctrlKey)
					||(e.key == "Escape")
					||(e.key == "Enter")
				){
					if(
						__o
						||(e.key == "Delete") // forcibly deleting
						||(e.key == "Escape" && proxyNode.text.length==0) // reverting when the original was empty to begin with
						||(e.key == "Enter"  && textInputValue.trim().length==0 && !proxyNode.hasCanvas) // saving an empty non-canvas
					){
						if(inPocket || onCanvas){pocketIDΔ(null)}
						else{linkDestruction(proxyNode.linkMaster)}
					}
					else if(textChanged){
						if(e.key == "Enter" && !(0 == textInputValue.trim().length && proxyNode.hasCanvas)){
							targetNodeΔ( (n:any)=>{return{...n, text:textInputValue.trim()}} )
							textInputValueΔ(v=>v.trim())
				  		}
				  		else if(e.key == "Escape"){ // isn't consistently firing but it might be from having dropped your keyboard
							textInputValueΔ(proxyNode.text)
						}
					}
					textEditableΔ(false)
					if(selectedNodeID==proxyNode.id){selectedNodeIDΔ(null)}
				}
		  	}
		  	if(dragActive){
				if(inPocket || onCanvas){
					switch(e.key){
						case "Delete":
						case "Escape":
							selectedNodeIDΔ(null)
							pocketIDΔ(null)
							dragActiveΔ(false)
						break;
					}
				}
			 	else{ // not inPocket
					switch(e.key){
					case "Delete":
						linkDestruction(proxyNode.linkMaster)
					case "Escape":
						dragEnabledΔ(false);
						selectedNodeIDΔ(null);
					break;
					}
				}
			}
		  	if(selectedNodeID == proxyNode.id && e.key == "Escape"){
				//selectedNodeIDΔ(null)
			}
		};
		  
		const handleClick = (e:any)=>{
			if(componentRef.current && !componentRef.current.contains(e.target)){ // clicked outside component
				// if(menuPop == linkMaster.id){menuPopΔ(null)}
				if(textEditable){
					if(!protectedClickOut){ // not simply highlihgting from inside the textbox
						if(![...e.target.offsetParent.classList].includes("node")){ // watch out for how the node html/css is structured
							selectedNodeIDΔ(null) // didn't pick another node
						}
						if(textInputValue.trim().length==0){ // is ending as a blank whatever
							if(
								__o
								|| (proxyNode.text.length==0 && proxyNode.hasCanvas) // started as a blank canvas
								|| !proxyNode.hasCanvas // isn't a canvas at all
							){linkDestruction(proxyNode.linkMaster)} // blank counts as final, get rid of it
							else{ // is currently blank but didn't start blank and is a canvas
								textInputValueΔ(proxyNode.text) // revert back, do nothing
							}
						}
						else if(textChanged){ // isn't ending as a blank whatever
							targetNodeΔ( (n:any)=>{return{...n, text:textInputValue}} )
							textInputValueΔ(v=>v.trim())
						}
						textEditableΔ(false);
					}
				}
			}
		};
  
		window.addEventListener('keyup', handleKey)
		document.addEventListener('click', handleClick)
		// Draggable is blocking/absorbing the mousedown event
		// solving this will let you remove protected ClickOut and deselect text editing immediately
		return ()=>{
			window.removeEventListener('keyup', handleKey)
			document.removeEventListener('click', handleClick)
		};
  
	},[
		selectedNodeID,
		dragActive,
		textEditable,
		inPocket,
		onCanvas,
		proxyNode,
		textChanged,
		textInputValue,
		protectedClickOut,
	]);
	
	///////////////////////////////////////////////////////////////////////////////////////

	return(<>
		{
			__x
			&& proxyNode.id
			&& (!inPocket || view)
			&& <div
				ref={componentRef}
				style={{
					position:'absolute',
					left:'50vw', top:'50vh',
					width:'0px', height:'0px',
					transform:"translate(-50%, -50%)",
					userSelect:`none`,
					textAlign:`center`,
					zIndex:((proxyNode.hasCanvas?3:1) * (1+(proxyNode.id==selectedNodeID?1:0))) + ((inPocket || onCanvas)?2:0),
					// text goes 1 to 2, link goes 3 to 6, inPocket link 5 to 8
					// still needs work; editing should come above all
				}}
				onDoubleClick={(e)=>{if(e.altKey && onCanvas){resetApp()}}}
			>
				<Draggable
					nodeRef={draggableRef}
					grid={[scale.unit/4, scale.unit/4]}
					position={(inPocket || onCanvas)?{
						x:0,
						y:10*(view.XpxUnits-3)*(inPocket?1:-1),
					}:{
						x:Math.round(proxyNode.position.x*3*scale.unit),
						y:Math.round(proxyNode.position.y*3*scale.unit),
					}}
					positionOffset={
						(dragActive || !(inPocket || onCanvas))?undefined:
						{
							x:0,
							y:(view.pxExtra-1)*(inPocket?1:-1),
						}
					}
					onStart={onStart} onDrag={onDrag} onStop={onStop}
					disabled={!dragEnabled || (inPocket && proxyNode.id == canvasID)}
				>
					<div
						ref={draggableRef} // used under advisement of Draggable package developer to handle FindDOMNode deprecation
						style={{
							//position:`relative`,
						}}
					>
						<div
							style={{
								position:`absolute`,
								transform:"translate(-50%, -50%)",
								outline:(selectedNodeID==proxyNode.id && !onCanvas)?`2px solid gold`:undefined,
							}}
							className="node"
						>
							<div
								style={{ // extra layer split out to deal with outline not switching fast enough
									lineHeight:`${proxyNode.hasCanvas?100:133}%`,
									display:`flex`, flexDirection:`row`,
									outline:onCanvas?undefined:`1px solid ${recolor(proxyNode.color,{lum:(proxyNode.hasCanvas?-5:+5)-15,sat:null,hue:null})}`,
									backgroundColor:onCanvas?undefined:recolor(proxyNode.color,{lum:(proxyNode.hasCanvas?-5:+5)-0,sat:null,hue:null}),
									// centering text must have been set somewhere else in the old CSS
								 }}
							>
								{
									__x
									&& proxyNode.icon
									&& <div style={{
										display:`flex`,
										alignItems:`center`, justifyContent:`center`,
										width:`${scale.unit*(onCanvas?(1+1**2/4):1)}px`,
										fontSize:`${onCanvas?200:140}%`,
									}}>
										<span style={{
											paddingBottom:`${onCanvas?6:3}px`,
											}}>
											{proxyNode.icon}
										</span>
									</div>
								}
								{
									__x
									// && proxyNode.text // this line would mess with initial creation from ''
									// should a different condition be placed for the icon above?
									// you were going to let people pick that instead of generating randomly
									&& <div style={{
										display:`flex`,
										alignItems:`center`, justifyContent:`center`,
										width:`${scale.unit*(proxyNode.length.x-(proxyNode.icon?1:0))}px`,
										height:`${scale.unit*(proxyNode.length.y)}px`,
									}}>
										<span style={{
											fontSize:`${onCanvas?140:proxyNode.hasCanvas?90:100}%`,
											paddingBottom:`${proxyNode?1:1}px`,
											paddingRight:`${((proxyNode.icon && proxyNode.hasCanvas)?scale.unit:0)/6}px`,
											margin:`${proxyNode.hasCanvas?0:(scale.unit/6)}px`,
										}}>
											{
												__o
												||(
													__x
													&& !textEditable
													//&& proxyNode // may not need
													&& <span style={{
														pointerEvents:`none`, // important; we want a click to pass through for when this unmounts
														fontWeight:onCanvas?`bold`:`normal`,
													}}>
														{proxyNode.text}
													</span>
													)
												||(
													__x
													&& <textarea
														style={{
															resize:`none`,
															overflow:proxyNode.hasCanvas?`hidden`:undefined,
															fontSize:onCanvas?`110%`:undefined,
														}}
														rows={proxyNode.hasCanvas?1:4}
														cols={proxyNode.hasCanvas?8:29}
														ref={textRef}
														value={textInputValue}
														onKeyDown={(e)=>{
															if(
																__x
																&& e.key == "Enter"
																//&& !e.shiftKey
															){
																e.preventDefault(); 
																return true
															}
														}}
														onChange={(e)=>{
															textInputValueΔ(e.target.value)
															textChangedΔ(true)
														}}
													/>
												)
											}
										</span>
									</div>
								}
							</div>
						</div>
					</div>
		  		</Draggable>
			</div>
		}
	</>)
}