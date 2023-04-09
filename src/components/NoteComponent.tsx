import { __x, __o, } from '../tools/defaults';
import { recolor, } from '../tools/functions';
import {
  	view_atom,
  	NEO_pocketID_atom,
  	NEO_canvasID_atom,
  	NEO_link_atom,
  	NEO_note_atom,
	NEO_create2_selector,
	client,
} from "./RecoilComponent";
import { useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import { useState, useEffect, useRef, } from 'react';

import { useSession, } from "next-auth/react";
import { gql, } from "@apollo/client";

import Draggable from 'react-draggable';

export default function Note({passedLink}:any){
	//console.log("note component rendered")

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// MAIN DATA vvv

	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom);
	const [ pocketID, pocketIDΔ ] = useRecoilState<any>(NEO_pocketID_atom);

	//console.log("note component recieved a link from the canvas", passedLink)
	const linkID = passedLink?.uuid; 			
	const recoilLink = useRecoilState(NEO_link_atom(linkID))
	const [ link , linkΔ ] = linkID? recoilLink: [passedLink, ()=>{console.log("no link ID")}]

	//console.log("link identified", link)
	const [ note, noteΔ ] = useRecoilState(NEO_note_atom(
		link.notes.find((n:any)=>n!==canvasID) || canvasID
	))
	//console.log("note identified", note)
		
	// MAIN DATA ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// BASIC INTERFACE vvv

	const view = useRecoilValue<any>(view_atom);
	const refText:any = useRef<HTMLInputElement>(null);
	const refComponent = useRef<HTMLDivElement>(null);
	const refDraggable = useRef<HTMLDivElement>(null);  

	const styleFlex = {
		display:`flex`,
		alignItems:`center`,
		justifyContent:`center`,
	}
	const borderMargin = view.unit / 4

	// BASIC INTERFACE ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DATABASE INTERACTION vvv

	// try to move as much of this as possible into Recoil later

	const canvasΔ = useSetRecoilState(NEO_note_atom(canvasID)) // only used to update when a deletion occurs
	const userID = useSession()?.data?.user?.email // only used for queries

	async function noteΔΔ(uuid:any, data:any){
		//console.log("noteΔΔ triggered")
		if(note.text){ // started out with text, i.e. not newly generated
			//console.log("noteΔΔ edit")
			const editResponse = await client.mutate({ mutation:gql`
				mutation editNote( $uuid:String, $data:NoteInput!, $userID:String ){
					ReNote: editNote( uuid:$uuid, data:$data, userID:$userID ){
						uuid
						color
						icon
						text
					}
				}`,
				variables:{
					uuid, data, userID
				}
			});
			if(editResponse.errors){throw editResponse.errors;}
			return editResponse
		}
		else{
			//console.log("noteΔΔ create")
			const creationResponse = await client.mutate({ mutation:gql`
				mutation createNote(
					$note:NoteInput!, $user:String,
					$link:LinkInput!, $canvasID:String
				){
					createNote( note:$note, link:$link, user:$user, canvasID:$canvasID ){
						uuid
						color
						icon
						text
					}
				}`,
				variables:{
					user:userID,	note:{...note, links:undefined, queried:undefined, ...data},
					canvasID,		link:{...link, notes:undefined},
				}
			});
			if(creationResponse.errors){throw creationResponse.errors;}
			console.warn("created", data)
			return creationResponse
		}
	}
	
	async function linkΔΔ(uuid:any, data:any){
		//console.log("linkΔΔ triggered with data:", data)
		if(data){
			const editResponse = await client.mutate({ mutation:gql`
				mutation editLink( $uuid:String, $data:LinkInput!, $userID:String ){
					ReLink: editLink( uuid:$uuid, data:$data, userID:$userID ){
						uuid
						position{
							x
							y
						}
						length{
							x
							y
						}
						canTravel
					}
				}`,
				variables:{
					uuid, data, userID
				}
			});
			if(editResponse.errors){throw editResponse.errors;}
			return editResponse
		}
		else{
			//console.log("linkΔΔ delete")
			const deletionResponse = await client.mutate({ mutation:gql`
				mutation deleteLink( $linkID:String, $noteID:String, $userID:String ){
					deleteLink( linkID:$linkID, noteID:$noteID, userID:$userID )
				}`,
				variables: { linkID:link.uuid, noteID:note.uuid, userID }
			});
			if(deletionResponse.errors){throw deletionResponse.errors;}
			else{
				if(note.links){
					noteΔ((prevData)=>({ // remove deleted link from the destination note
						...prevData,
						links:prevData.links.filter((xL:any)=>xL!==link.uuid),
					})); 
				}
				canvasΔ((prevData)=>({ // remove deleted link from the current note
					...prevData,
					links:prevData.links.filter((xL:any)=>xL!==link.uuid),
				}));
			}
			return deletionResponse
		}
	}
	
	async function linkΔΔ2(sourceID:string, data:any, targetID:string){
		// for dragging links out of pocket; to be integrated with normal creation when moved to Recoil
		//console.log("linkΔΔ2 triggered")
		const createResponse = await client.mutate(
			{ mutation: gql`
				mutation createLink( $sourceID:String, $data:LinkInput!, $targetID:String, $userID:String ){
					createLink( sourceID:$sourceID, data:$data, targetID:$targetID, userID:$userID )
				}`,
				variables:{
					sourceID, data,
					targetID, userID,
				}
			}
		);
		if(createResponse.errors){throw createResponse.errors;}
		return createResponse
	}





	const [ creator, creatorΔ ] = useRecoilState<any>(NEO_create2_selector)
	async function linkGeneration(isLink:boolean, reLink:boolean, position:any){
		// for dragging links out of pocket; to be integrated with normal creation when moved to Recoil
		console.log(`pocket drag detected in empty canvas at x:${position.x} y:${position.y}`)
		const { linkID, noteID } = await generateUUIDs();

		creatorΔ({
			isLink,
			reLink,
			position,
			linkID:linkID,
			noteID:pocketID,
		})

		const linkData = {
			uuid:linkID,
			position,
			length:spaceInput.length,
			canTravel:isLink,
		}
		linkΔΔ2(canvasID, linkData, pocketID)
	}

	async function generateUUIDs(){ // isn't needed with the new scheme
		return await client
			.query({
				query: gql`
					query {
						UUIDs {
							linkID
							noteID
						}
					}
				`,
				fetchPolicy: "no-cache",
			})
			.then(({data})=>(data.UUIDs));
	}

	// DATABASE INTERACTION ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// FLAGS FOR EDITING TEXT AND REPOSITIONING vvv
	
	// there may be a better way to do this; beta.reactjs.org/learn/you-might-not-need-an-effect

	const [ selected, selectedΔ ] = useState(false)

	const [ dragEnabled, dragEnabledΔ ] = useState(true)
	const [ dragActive, dragActiveΔ ] = useState(false)
	useEffect(()=>{if(!dragEnabled){dragActiveΔ(false)}},[dragEnabled]);


	const [ protectedClickOut, protectedClickOutΔ ] = useState(false);
	useEffect(()=>{ // for if you started highlighting while editing text and then dragged out
		const handleClick = (e:any)=>{
			if(refComponent.current && refComponent.current.contains(e.target))
				{if(!protectedClickOut){protectedClickOutΔ(true)}}
			else if(protectedClickOut){protectedClickOutΔ(false)}
		}
		document.addEventListener('mousedown',handleClick);
		return()=>{document.removeEventListener('mousedown',handleClick)};
   },[protectedClickOut]);
	

	const [ textIsEditable, textIsEditableΔ ] = useState(0 == note.text.length); // kickstarts edit on a blank note
	const [ textIsChanged, textIsChangedΔ ] = useState(false)
	const [ textInputValue, textInputValueΔ ] = useState('');
	useEffect(()=>{if(!textIsEditable){textIsChangedΔ(false)}},[textIsEditable]); // reevaluate whether this can be combined with the next effect
	useEffect(()=>{
		//if(!textIsEditable){ // reevaluate why this check is necessary
			textInputValueΔ(note.text)
		//}
	},[
		note, // update on note for initial load and when travelling
		//textIsEditable,
	]);
	useEffect(()=>{
		if(textIsEditable && !textIsChanged){
			const end = textInputValue.length
			refText.current.setSelectionRange(end, end)
			refText.current.focus()
			selectedΔ(true)
		}
	},[
		textIsChanged, // added to only jump to the end at start
		textIsEditable,
		textInputValue, // relying on reloaded value from drag, otherwise interrupts midway edits
		dragActive, // refocus if dragged while editing; should change to specifically when drag stops
	]);
	
	const [ spaceInput, spaceInputΔ ] = useState({length:link.length});
	useEffect(()=>{
		const textArea = refText.current;
		if(textArea && !link.canTravel){
			textArea.style.height = "0px"; // make it shrink again when deleting content
			textArea.style.height = `${textArea.scrollHeight}px`;
			const newLengthY = Math.ceil( ((textArea.scrollHeight+4)/view.unit) *2)/2 // + is to account for the margin, however much of that you want

			spaceInputΔ((v)=>{return{...v, length:{...v.length, y:Math.max(1, newLengthY), }}})
			// remember this occurs only when an edit is made, not when trim() runs
			// in order for linkΔ to save the trimmed height you'd have to wait on trimming the text, then run the ref check again
		}
	},[textInputValue, textIsEditable, link, view, refText]);

	const [ isHidden, isHiddenΔ ] = useState(false)

	// FLAGS FOR EDITING TEXT AND REPOSITIONING ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// MAIN EFFECTS FOR EDITING TEXT AND REPOSITIONING vvv
	
	useEffect(()=>{
		const handleKey = (e:any)=>{
			if(textIsEditable){
				if(
					__o
					||(e.key == "Delete" && (e.shiftKey || e.ctrlKey)) // confirms user means to delete the note itself and not its text
					||(e.key == "Escape")
					||(e.key == "Enter" && !(e.shiftKey || e.ctrlKey || e.altKey))
				){
					const newText = textInputValue.trim()
					if(
						__o
						||(e.key == "Delete")
						||(e.key == "Escape" && (0==note.text.length)) // reverting when the original was empty to begin with
						||(e.key == "Enter"  && (0==newText.length && !link.canTravel)) // saving an empty non-link // need new terminology
					){
						if(link.inPocket || link.inHeader){pocketIDΔ("")}
						else{
							isHiddenΔ(true)
							linkΔΔ(link.uuid, null) // delete the link, which will delete the note as well if it's isolated
						}
					}
					else if(textIsChanged){
						if(__x
							&& e.key == "Enter"
							&& !(0==newText.length && link.canTravel)
						){
							noteΔ( (n:any)=>{return{...n,text:newText}} ) // change what was in state
							noteΔΔ( note.uuid, {text:newText} ) // modify it on the server // if a new note, doesn't exist on the database until here
							// textInputValueΔ(newText) // no longer necessary when you have an effect that sets this when the note updates
							linkΔ( (l:any)=>{return{...l,length:spaceInput.length}} )
							linkΔΔ( link.uuid, {length:spaceInput.length} )
				  		}
				  		else if(e.key == "Escape"){
							textInputValueΔ(note.text)
						}
					}
					textIsEditableΔ(false)
					if(selected){selectedΔ(false)}
				}
		  	}
		  	if(dragActive){
				if(link.inPocket){
					switch(e.key){
						case "Delete":
							pocketIDΔ("")
						case "Escape":
							selectedΔ(false)
							dragEnabledΔ(false)
						break;
					}
				}
			 	else{
					switch(e.key){
					case "Delete":
						isHiddenΔ(true)
						//needs more investigation; error "can't find relationship" if deleting too many too quickly
						linkΔΔ(link.uuid, null)
					case "Escape":
						dragEnabledΔ(false);
						selectedΔ(false);
					break;
					}
				}
			}
		  	if(selected && e.key == "Escape"){
				selectedΔ(false)
			}
		};
		window.addEventListener('keyup', handleKey)
		return ()=>{
			window.removeEventListener('keyup', handleKey)
		};
  
	},[
		textIsEditable,
		textInputValue,
		textIsChanged,
		dragActive,
		selected,
		spaceInput,
//		pocketIDΔ,
		link,
//		linkΔΔ,
		note,
//		noteΔ,
//		noteΔΔ,
	]);


	useEffect(()=>{
		const handleClick = (e:any)=>{
			if(refComponent.current && !refComponent.current.contains(e.target)){ // clicked outside component
				// if(menuPop == linkMaster.id){menuPopΔ(null)}
				if(textIsEditable){
					if(!protectedClickOut){ // not simply highlighting from inside the textbox
						const newText = textInputValue.trim()
						if(0==newText.length){ // was left blank
							if(
								__o
								|| (link.canTravel && 0==note.text.length) // started as a blank canvas
								|| !link.canTravel // isn't a canvas at all
							){
								isHiddenΔ(true)
								linkΔΔ(link.uuid, null)
							} // blank counts as final, get rid of it
							else{
								textInputValueΔ(note.text)
							} // revert back, do nothing
						}
						else if(textIsChanged){
							noteΔ( (n:any)=>{return{...n, text:newText}} )
							noteΔΔ( note.uuid, {text:newText} ) // if a new note, doesn't exist on the database until here
							// textInputValueΔ(newText) // no longer necessary when you have an effect that sets this when the note updates
							linkΔ( (l:any)=>{return{...l,length:spaceInput.length}} )
							linkΔΔ( link.uuid, {length:spaceInput.length} )
						}
						textIsEditableΔ(false);
						selectedΔ(false);
					}
				}
			}
		};
		document.addEventListener('click', handleClick)
		// Draggable is blocking/absorbing the mousedown event
		// solving this will let you remove protected ClickOut and deselect text editing immediately
		return ()=>{
			document.removeEventListener('click', handleClick)
		};
	},[
		textIsEditable,
		protectedClickOut,
		textIsChanged,
		textInputValue,
		selected,
		spaceInput,
		link,
//		linkΔΔ,
		note,
//		noteΔ,
//		noteΔΔ,
	]);

	// MAIN EFFECTS FOR EDITING TEXT AND REPOSITIONING ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DELAYED ACTIONS vvv

	const [ navigate, navigateΔ ] = useState<any>({to:"", save:false}); // useState<{to:string, save?:boolean}>({to:""});
	useEffect(()=>{ // changing canvasID during onStop caused an unmounting error; onStop returning null was ineffective
		if(navigate.to){
			if(navigate.save){pocketIDΔ(canvasID)} // travelling through the pocket exchanges it with the destination
			canvasIDΔ(navigate.to)
			selectedΔ(false)
			navigateΔ({to:"", save:false})
		}
	},[
		canvasID,
		canvasIDΔ,
		navigate,
		pocketIDΔ
	]);

	// DELAYED ACTIONS ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DIRECT DRAG HANDLERS vvv

	function onStart(event:any, data:any){ //console.log(`${proxyNode.id} start detected`)
		if(
			__x
	//		&& selectionID!==proxyNode.id // not coming from a duplicate
	//		&& !event.altKey // not trying to reset the app
	//		&& !(inPocket && !event.shiftKey) // not a pocket node unless trying to edit
		){
			selectedΔ(true)
		}
		if(refText.current && refText.current.contains(event.target)){ // don't drag if clicking textbox
			return(false)
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function onDrag(event:any ,data:any){ //console.log(`${proxyNode.id} drag detected`)
		if(
			__x
			&& dragEnabled
			&& !link.inHeader
	//		&& !(inPocket && note.uuid == canvasID)
		){
			dragActiveΔ(true)
		}
		else{
			return false
			// this only triggers the next time you try to move it
			// figure out how you made it pull back even from stationary; not onStart
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function onStop(event:any ,data:any){ //console.log(`${proxyNode.id} stop detected`)
		if(dragActive){
			dragActiveΔ(false)
			if(selected && !textIsEditable){selectedΔ(false)} // deselect if not still editing // make an effect?

			const insideFrame = (view.height.absolute/2)-(view.frame+2)-(.5*view.unit*spaceInput.length.y) // + 2 is from the outline
			if(data.y < -insideFrame){ // higher than top frame
				// this is running sporadically during drag deletion, seemingly correlated to how errattic the drag was but still well within insideFrame
				// if(link.canTravel){navigateΔ({to:note.uuid, save:true})}
			}
			else if(data.y > insideFrame){ // lower than bottom frame
				if(link.canTravel){pocketIDΔ(note.uuid)}
			}
			else{
				if(__o
					|| link.inPocket
					|| link.inHeader
				){ // new node to clone
					linkGeneration(true, true, {x:data.x/40, y:data.y/40})
					selectedΔ(false)
					if(!(event.shiftKey || event.ctrlKey)){pocketIDΔ("")} // hold CTRL to not empty pocket, if intending to drop the link in many places
				}
				else{ // existing node, reposition
					linkΔ((l:any)=>{
						return {...l,position:{
							x:(data.x/view.unit),
							y:(data.y/view.unit),
						}}
					})
					linkΔΔ(link.uuid,{
						position:{
							x:(data.x/view.unit),
							y:(data.y/view.unit)
						}
					})
				}
			}

		}
		else if(dragEnabled){ // did not drag // why not a normal else?
			if(__o
				|| (event.shiftKey || event.ctrlKey)
				|| !link.canTravel
				|| link.inHeader
			){ // trying to edit
				textIsEditableΔ(true)
			}
			else if(!textIsEditable){
				navigateΔ({to:note.uuid, save:link.inPocket})
			}
		}
//		if(!textIsEditable){
//			selectedΔ(false)
//		}
		dragEnabledΔ(true)
	}

	// DIRECT DRAG HANDLERS ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// FINAL RENDER vvv

	const debugVariables = { // name and values will float next to the note
	}

	return(<>
		{
			__x
			&& note//.color // can remove check entirely?
			&& (!(link.inPocket || link.inHeader) || view) // if it's an offset position, don't render until you get the view dimensions
			&& !isHidden // don't render if you're in the middle of deleting it
			&& (
				<div
					ref={refComponent}
					style={{												overflow:`hidden`,									
						...styleFlex,									pointerEvents:`none`,									
						textAlign:`center`,							userSelect:`none`,										
						
						left:`${50}%`,		width:`${100}%`,		position:`absolute`,
						top:`${50}%`,		height:`${100}%`,		transform:`translate(${-50}%, ${-50}%)`,

						zIndex:((link.canTravel?3:1) * (1+(selected?1:0))) + ((link.inPocket || link.inHeader)?2:0) + (textIsEditable?8:0),
						// text goes 1 to 2, link goes 3 to 6, inPocket link 5 to 8
					}}
				>
					<Draggable
						onStart={onStart} onDrag={onDrag} onStop={onStop}
						nodeRef={refDraggable}
						disabled={false}
						grid={[10, 10]}
						position={{
							x:Math.round(link.position.x*view.unit),
							y:Math.round(link.position.y*view.unit)
								*(
									(link.inPocket || link.inHeader)
										? ((view.height.divided-3)/4)
										: 1
								),
						}}
						positionOffset={
							((link.inPocket || link.inHeader) && !dragActive)
								? {
									x:0,
									y:(view.height.remainder)*link.position.y,
								}
								: undefined
						}
					>
						<div
							ref={refDraggable} // used under advisement of Draggable package developer to handle FindDOMNode deprecation
							style={{pointerEvents:`auto`,}}
						>
							<div
								// className="note" // if(![...e.target.offsetParent.classList].includes("note")){}
								style={{
									position:`absolute`,
									transform:`translate(-50%,-50%)`,
									lineHeight:`${link.inHeader?150:100}%`,
									overflow:`hidden`,
									...styleFlex, flexDirection:`row`,
									...(!link.inHeader
											?{
												outline:`${selected?2:1}px solid	 ${recolor(note.color,{lum:(link.canTravel?-5:+5)-20})}`,
												background:								`${recolor(note.color,{lum:(link.canTravel?-5:+5)- 0})}`,
											}:{}
										),

								}}
							>
								{
									__x // bounding box for the icon, if it has one
									&& note.icon
									&& (
										<div style={{
											...styleFlex,
											width:`${view.unit*spaceInput.length.y}px`, // to get square shape
											height:`${view.unit*spaceInput.length.y}px`,
											fontSize:`${link.inHeader?200:150}%`,
										}}>
											<span style={{
												...(view.system.isWin
													?{ paddingBottom:	`${(link.inHeader?3:3)}px`, }
													:{ paddingTop:		`${(link.inHeader?3:0)}px`, }
												),
											}}>
												{note.icon}
											</span>
										</div>
									)
								}
								{
									__x // bounding box for the text
									&& (
										<div style={{
											...styleFlex,
											width:`${
												+ (view.unit * (link.length.x - (note.icon?1:0)) )
												- (borderMargin / (note.icon?2:1))
											}px`,
											height:`${
												+(view.unit * (link.canTravel?1:spaceInput.length.y) )
												-(link.inHeader?0:borderMargin)
											}px`,
											margin:`${borderMargin/2}px`,		
											fontWeight:link.inHeader?`bold`:`normal`,
											fontSize:`${link.inHeader?140:90}%`,

											...(note.icon?{ marginLeft:'0px', }:{}),
											...(textIsEditable?{ outline:`2px solid black`, background:`${recolor(note.color,{lum:(link.canTravel?-0:+10)})}`, }:{}),
										}}>
											{
												__o
												||( 
													__x // normal text
													&& !textIsEditable
													&&(
														<div
															style={{
																pointerEvents:`none`, // important or else the click gets eaten entirely
																maxWidth:`100%`,
																paddingBottom:`${view.system.isWin?(2):0}px`,
																whiteSpace:`pre-wrap`,
																wordWrap:`break-word`,
															}}
														>
															{note.text}
														</div>
													)
												)
												||(
													__x // editing text
													&&(
														<textarea
														ref={refText}
														value={textInputValue}
														rows={link.canTravel?2:1}
														onKeyDown={(e)=>{
															if(
																__x
																&& e.key == "Enter" // suppress new line
																&& !(e.shiftKey || e.ctrlKey || e.altKey) // unless holding modifier; ctrl and alt are currently being eaten somewhere
															){ e.preventDefault(); return true }
														}}
														onChange={(e)=>{
															textInputValueΔ(e.target.value);
															textIsChangedΔ(true)
														}}
													/>
													)
												)
											}
										</div>
									)
								}

								<div style={{position:`absolute`, bottom:0<link.position.y?`${view.unit*spaceInput.length.y}px`:undefined, width:`100%`, margin:`5px 0px`, fontSize:`80%`, whiteSpace:'pre-wrap',}}>
									{Object.keys(debugVariables).map((name)=>{return (<div key={name}>
										{`${name}: ${String((debugVariables as any)[name])}`}{`\n`}
									</div>)})}
								</div>
								
							</div>
						</div>
					</Draggable>
				</div>
			)
		}
	</>)

	// FINAL RENDER ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}