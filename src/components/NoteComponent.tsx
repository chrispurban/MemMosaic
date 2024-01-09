/* eslint-disable prefer-const */ // using const for state variables, refs, and functions only
/* eslint-disable react-hooks/exhaustive-deps */

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	recolor,
} from '../tools/functions';

import {
	useRecoilState,
	useRecoilValue,
	useSetRecoilState,
	useRecoilCallback,
} from "recoil";

import {
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react';

import {
	view_atom,
	NEO_canvasID_atom,
	selectedID_atom,
	NEO_note_atom,
	NEO_link_atom,
	NEO_write_selector,
	NEO_note_generation_selector,
	NEO_pocketID_atom,
} from "../store/index";

import Draggable from 'react-draggable';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Note({passedLink}:any){ // shell to remount the component if the user hits ESCAPE
	const [ resetKey, resetKeyΔ ] = useState(0)
	const resetComponent = useCallback(() => {
		resetKeyΔ((prevKey) => prevKey + 1);
	},[]);
	return(<>
		<NoteInternal key={resetKey} passedLink={passedLink} resetComponent={resetComponent}/>
	</>)
}

function NoteInternal({passedLink, resetComponent}:any){ // actual component

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// MAIN DATA vvv
	
	const canvasID = useRecoilValue(NEO_canvasID_atom);

	const linkID = passedLink?.uuid // may have an artificial UUID, either "CANVAS" or "POCKET"
	const link = useRecoilValue(NEO_link_atom(linkID))

	const noteID = link.notes.find((n:string)=>n!==canvasID) || canvasID  // tries to find the other side of the link, finds itself if there isn't one
	const note = useRecoilValue(NEO_note_atom(noteID))

	const pocketIDΔ = useSetRecoilState<any>(NEO_pocketID_atom);

	const writeSelectorΔ = useSetRecoilState(NEO_write_selector) // handles database edits
	const writeΔ = (changeBatch:any) => { // attaches boilerplate information about the information source
		writeSelectorΔ({canvasID, targetID:noteID, linkID, changeBatch} as any)
	}

	// MAIN DATA ^^^
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// BASIC INTERFACE vvv

	const view = useRecoilValue<any>(view_atom);
	const refText:any = useRef<HTMLInputElement>(null);
	const refComponent = useRef<HTMLDivElement>(null);
	const refDraggable = useRef<HTMLDivElement>(null);  

	const borderMargin = view.unit / 4

	// BASIC INTERFACE ^^^
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// FLAGS FOR EDITING TEXT AND REPOSITIONING vvv
	
	// TODO: investigate beta.reactjs.org/learn/you-might-not-need-an-effect

	const [ noteIsSelected, noteIsSelectedΔ ] = useState(false)
	const selectedGlobalIDΔ = useSetRecoilState(selectedID_atom) // for letting global listeners know the last note to be selected
	

	const [ textIsEditable, textIsEditableΔ ] = useState(0 == note.text.length); // kickstarts editing on a blank note; very important and what allows for the delay of a database write until we know the note should be saved
	const [ textIsChanged, textIsChangedΔ ] = useState(false);
	const [ textInputValue, textInputValueΔ ] = useState('');
	useEffect(()=>{if(!textIsEditable){textIsChangedΔ(false)}},[textIsEditable]);
	useEffect(()=>{textInputValueΔ(note.text)},[note]); // not just for editing but when travelling
	// TODO: how heavy should you go with implied or pair properties such as this?
	// consider the difference: permission to make changes, whether the user intends for changes, whether changes were actually made
	// textChange_Permitted
	// textChange_Happening
	// textChange_Finalized


	const [ positionIsChanged, positionIsChangedΔ ] = useState(false);
	const [ positionInputValue, positionInputValueΔ ] = useState({
		x:link.position.x,
		y:link.position.y,
	})
	const [ dragIsActive, dragIsActiveΔ ] = useState(false)
	//useEffect(()=>{if(!positionIsEditable){dragIsActiveΔ(false)}},[positionIsEditable]);
	

	// prevent losing text selection if the cursor went out of bounds
	const [ protectedClickOut, protectedClickOutΔ ] = useState(false);
	useEffect(()=>{
		const protectedClickOutHandler = (e:any)=>{
			if(refComponent.current && refComponent.current.contains(e.target)){
				if(!protectedClickOut){protectedClickOutΔ(true)}
			}
			else
				if(protectedClickOut){protectedClickOutΔ(false)}
		}
		document.addEventListener('mousedown',protectedClickOutHandler);
		return()=>{document.removeEventListener('mousedown',protectedClickOutHandler)};
	},[protectedClickOut]);


	// automatically focus the text cursor when editing
	useEffect(()=>{
		if(textIsEditable){
			noteIsSelectedΔ(true)
			if(!textIsChanged){ // only jump to the end when first opened
				let end = textInputValue.length
				refText.current.setSelectionRange(end, end) 
			}
			refText.current.focus()
		}
	},[
		textIsChanged,
		textIsEditable,
		textInputValue,
		dragIsActive,
	]);
	

	// resize the textbox automatically
	const [ spaceInput, spaceInputΔ ] = useState({size:link.size, offset:0});
	useEffect(()=>{
		let textArea = refText.current;
		if(textArea && !link.canTravel){
			textArea.style.height = "0px"; // make it shrink again when deleting content
			textArea.style.height = `${textArea.scrollHeight}px`;
			let newLengthY = Math.max( 1, Math.ceil( ((textArea.scrollHeight+4)/view.unit) *2)/2 )// + is to account for the margin, however much of that you want

			spaceInputΔ((v)=>{return{...v, size:{...v.size, y:newLengthY},
				//offset:(newLengthY-link.size.y)/2
			}})
			// remember this occurs only when an edit is made, not when trim() runs
			// in order for writeΔ to save the trimmed height you'd have to wait on trimming the text, then run the ref check again
		}
	},[
		textInputValue,
		textIsEditable,
		link,
		view,
		refText,
	]);

	// FLAGS FOR EDITING TEXT AND REPOSITIONING ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// MAIN INPUT EFFECTS FOR EDITING TEXT AND REPOSITIONING vvv

	// TODO: consider adding a separate effect for ENTER as "last selected" to reopen edit
	
	useEffect(()=>{
		const closeInputs = ({isKeptSelected = false})=>{
			textIsEditableΔ(false)
			noteIsSelectedΔ(false)
			if(!isKeptSelected){
				selectedGlobalIDΔ("")
			}
		}

		const inputSubmissionHandler = ( inputEvent:any )=>{
			if( noteIsSelected ){ // flag occurs within onStart
				let inputModifier = inputEvent.shiftKey || inputEvent.ctrlKey || inputEvent.altKey

				if(__x
					&&(inputEvent.key == "Delete") // DELETE is unconcerned with click events
					&&(__o
						||( inputModifier ) // explicit desire to get rid of it
						||( dragIsActive && !textIsEditable ) // implied from usage with the whole note rather than its content
					)
				){
					if(link.inPocket || link.inHeader){
						pocketIDΔ("") // temporary construct, clear instead of delete // TODO: consolidate this logic with that which prevents creating the construct on the server
					}
					else{
						writeΔ({} as any)
					}
					closeInputs({})
				}
				else{
					let inputCancel = inputEvent.key == "Escape";
					let inputConfirm = inputEvent.key == "Enter" && !inputModifier // not typing a linebreak
					if( !( inputCancel || inputConfirm ) && refComponent.current ){ // clicking out as a substitute for ENTER, with an added check to prevent errors grabbing the ref
						inputConfirm = !( refComponent.current.contains( inputEvent.target ) || protectedClickOut ) // not clicking inside the note nor highlighting from there
					}

					if( inputCancel || inputConfirm ){

						const newText = textInputValue.trim() // TODO: pick a different name than newText

						const changeBatch = {
							linkChanges:{
								...positionIsChanged?{ position:{ x:positionInputValue.x, y:positionInputValue.y, } }:{},
								...textIsChanged?{ size:spaceInput.size, }:{},
							},
							noteChanges:{
								...textIsChanged?{ text:newText, }:{}, // newText will still be checked later even if unchanged
							},
						}

						let changeRequested = Object
							.values( changeBatch )
							.some( obj=>Object.keys(obj).length>0 )

						if(__o
							||(!changeRequested && newText.length==0 ) // remained empty
							||(__x
								&& changeRequested && inputConfirm // user wanted to submit
								&& !(link.canTravel && newText.length==0) // empty links revert instead and must be explicitly deleted
							)
						){
							writeΔ( { ...changeBatch } as any ) // selector will determine what to do with the submission, its history // TODO: make sure that spaceInput is being passed, and that it's not being saved before the trim can happen
						}
						else
							if(__x
								&&(changeRequested)
								&&(__o
									|| inputCancel // user wanted to revert;
									||(inputConfirm && link.canTravel && newText.length==0) // revert is forced for an existing link that was emptied; user must delete explicitly
								)
							){
								resetComponent()
							}
							//	(!changeRequested && newText.length>0 ) // last cross-combination of "nothing happened, do nothing"
						
						closeInputs({isKeptSelected: inputEvent.type=="click" && ![...inputEvent.target.offsetParent.classList]?.includes("note")})
					}
				}
				/*
					// sidenote that when adding the cluster feature, the only way for a note to have multiple points of observation is through the cluster, through attachment of links
					// there would never be a case where you don't know what other side you're deleting it from, what context is lost
					// so text can still be deleted and does not need additional forms of protection
				*/
			}

		}
		window.addEventListener('keyup', inputSubmissionHandler) // TODO: small issue where it doesn't remember that a modifier was pressed if that's the first key your finger came off from
		document.addEventListener('click', inputSubmissionHandler)
		return ()=>{
			window.removeEventListener('keyup', inputSubmissionHandler)
			document.removeEventListener('click', inputSubmissionHandler)
		};
		// Draggable is blocking/absorbing the 'onmousedown' event
		// solving this would allow you to remove the protectedClickOut and to cease text editing immediately upon selecting another note
	},[
		textIsEditable,
		textIsChanged,
		textInputValue,
		dragIsActive,
		positionIsChanged,
		positionInputValue,
		noteIsSelected,
		spaceInput,
		note,
		link,
		protectedClickOut,
	]);

	// MAIN INPUT EFFECTS FOR EDITING TEXT AND REPOSITIONING ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DELAYED ACTIONS vvv

	const canvasIDΔ = useSetRecoilState(NEO_canvasID_atom)
	const [ navigate, navigateΔ ] = useState<{to:string, isSaving?:boolean}>({to:""}); // useState<any>({to:"", isSaving:false});
	// navigation by changing the canvasID during onStop caused an unmounting error; telling onStop to return null was ineffective

	useEffect(()=>{
		if(navigate.to){
			if(navigate.isSaving){pocketIDΔ(canvasID)} // exchange pocket with destination
			canvasIDΔ(navigate.to)
			noteIsSelectedΔ(false)
			selectedGlobalIDΔ("")
			navigateΔ({to:""}) // reset
		}
	},[
		navigate,
		canvasID,
		canvasIDΔ,
		pocketIDΔ,
		selectedGlobalIDΔ,
	]);

	const linkGeneration = useRecoilCallback(({ set }) => async ( position:{ x:number, y:number }, isLink:boolean, )=>{
		set<any>(NEO_note_generation_selector,{
			canvasID,
			position,
			isLink,
			targetID:noteID,
		});
	});

	// DELAYED ACTIONS ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DIRECT DRAG HANDLERS vvv

	function onStart(onStartEvent:any, onStartData:any){
		
		if(refText.current && refText.current.contains(onStartEvent.target)){return false} // don't drag if clicking the textbox while editing it
		else
			if(__x
			//	&& selectionID!==proxyNode.id // not coming from a duplicate
			//	&& !(inPocket && !onStartEvent.shiftKey) // not a pocket node unless trying to edit
			){
				noteIsSelectedΔ(true)
				selectedGlobalIDΔ(link.uuid as string) // for letting other components know // should this be the mechanism to get around not having access to onmousedown?
			}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function onDrag(onDragEvent:any ,onDragData:any){
		if(link.inHeader){return false}
		else{
			positionIsChangedΔ(true)
			dragIsActiveΔ(true)
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function onStop(onStopEvent:any, onStopData:any){// console.log(`stop detected`, note.uuid)
		if(dragIsActive){
			dragIsActiveΔ(false)
			let insideFrame = (view.height.absolute/2)-(view.frame+2)-(.5*view.unit*spaceInput.size.y) // + 2 is from the outline
			if(onStopData.y < -insideFrame){ // higher than top frame
				// if(link.canTravel){navigateΔ({to:note.uuid, isSaving:true})} // this ran sporadically during drag deletion while still well within insideFrame, seemingly correlated to how erratic the drag was
			}
			else 
				if(onStopData.y > insideFrame){ // lower than bottom frame
					if(link.canTravel){pocketIDΔ(note.uuid)}
				}
				else{ // dragged within the valid canvas space
					if(__o // cloning link
						|| link.inPocket
						|| link.inHeader
					){
						linkGeneration({x:onStopData.x/40, y:onStopData.y/40}, link.canTravel)
						noteIsSelectedΔ(false)
						if(!(onStopEvent.shiftKey || onStopEvent.ctrlKey)){pocketIDΔ("")} // wanting multiple clones
					}
					else{ // is an existing note, repositioning
						let newPosition = {
							x:(onStopData.x/view.unit),
							y:(onStopData.y/view.unit),
						}
						positionIsChangedΔ(true)
						positionInputValueΔ(newPosition)
						if(!textIsEditable){ // text is not being edited, and so can skip text-dependent condition on whether to save
							writeΔ({ linkChanges:{ position:newPosition } } as any)
						}
					}
				}
		}
		else{ // did not drag, just a regular click
			if(__o // trying to edit
				|| (onStopEvent.shiftKey || onStopEvent.ctrlKey) // confirming you want to edit and not navigate
				|| !link.canTravel // couldn't travel anyway
				|| link.inHeader // wasn't allowed to travel
			){
				textIsEditableΔ(true)
			}
			else
				if(!textIsEditable){ // trying to navigate
					navigateΔ({to:note.uuid, isSaving:link.inPocket}) // isSaving lets you swap a link in the pocket with where you are
				}
		}
		if(noteIsSelected && !textIsEditable){
			noteIsSelectedΔ(false) // deselect if not still editing // make an effect?
		}
	}

	// DIRECT DRAG HANDLERS ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// FINAL RENDER vvv

	let debugVariables = { // name and values will float beside the note
		/*
			L_initialized:link.initialized,
			L_retrieved:link.retrieved,
			L_uuid:link.uuid,
			noteIsSelected,
			textIsEditable,
			textIsChanged,
			dragIsActive,
		*/
	}

	return(<>
		{	__x
			&& note // TODO: can we remove this check entirely?
			&& (!(link.inPocket || link.inHeader) || view) // if it's in an offset position, don't render until you get the screen dimensions through view
			&& (
				<div
					// area within which the note can be dragged
					ref={refComponent}
					style={{
						overflow:`hidden`,							pointerEvents:`none`,
						textAlign:`center`,							userSelect:`none`,										
						
						left:`${50}%`,		width:`${100}%`,		position:`absolute`,
						top:`${50}%`,		height:`${100}%`,		transform:`translate(${-50}%, ${-50}%)`,

						zIndex:( (1+(noteIsSelected?1:0)) * (link.canTravel?3:1) ) + ((link.inPocket || link.inHeader)?2:0) + (textIsEditable?8:0),
						// being dragged goes from 1 to 2, then 3 to 6 keeping links on top, then inPocket 5 to 8 keeping it above all but an incoming replacement link
					}}
					className='centerflex'
				>
					<Draggable
						onStart={onStart} onDrag={onDrag} onStop={onStop}
						nodeRef={refDraggable}
						disabled={false}
						grid={[10, 10]}
						position={{
							x:Math.round(positionInputValue.x*view.unit),
							y:Math.round(positionInputValue.y*view.unit)
								*(
									(link.inPocket || link.inHeader)
										? ((view.height.divided-3)/4)
										: 1
								),
						}}
						{...( ((link.inPocket || link.inHeader) && !dragIsActive)
							?{positionOffset:{
								x:0,
								y:(view.height.remainder)*link.position.y,
							}}:{}
						)}
						>
						<div
							ref={refDraggable} // extra div and ref used under advisement of Draggable package developer to handle FindDOMNode deprecation
							style={{pointerEvents:`auto`,}}
						>
							<div
								className="centerflex note" // for clicks checking if(![...e.target.offsetParent.classList].includes("note")){}
								style={{
									position:`absolute`,
									transform:`translate(-50%,-50%)`,
									lineHeight:`${link.inHeader?150:100}%`,
									overflow:`hidden`,
									flexDirection:`row`,
									...(!link.inHeader
											?{
												outline:`${noteIsSelected?2:1}px solid	 ${recolor(note.color,{lum:(link.canTravel?-5:+5)-20})}`,
												background:										`${recolor(note.color,{lum:(link.canTravel?-5:+5)- 0})}`,
											}:{}
										),
								}}
							>
								{	__x // bounding box for the icon, if it has one
									&& note.icon
									&& (
										<div
											className='centerflex'
											style={{
												width:`${view.unit*spaceInput.size.y}px`, // using height to get square shape
												height:`${view.unit*spaceInput.size.y}px`,
												fontSize:`${link.inHeader?200:150}%`,
											}}
										>
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
								{	__x // bounding box for the text
									&& (
										<div
											className='centerflex'
											style={{
												width:`${
													+(view.unit * (link.size.x - (note.icon?1:0)) )
													-(borderMargin / (note.icon?2:1))
												}px`,
												height:`${
													+(view.unit * (link.canTravel?1:spaceInput.size.y) )
													-(link.inHeader?0:borderMargin)
												}px`,
												margin:`${borderMargin/2}px`,		
												...(link.inHeader
													?{ fontWeight:`bold`, 	fontSize:`140%`}
													:{ fontWeight:`normal`,	fontSize:`90%`}
												),
												...(note.icon?{ marginLeft:'0px', }:{}),
												...(textIsEditable?{outline:`2px solid black`, background:`${recolor(note.color,{lum:(link.canTravel?-0:+10)})}`,}:{}),
											}}
										>
											{	__o // editing or not
												||(__x
													&& textIsEditable
													&&(
														<textarea
															ref={refText}
															value={textInputValue}
															rows={link.canTravel?2:1}
															onKeyDown={(e)=>{
																if(__x
																	&& e.key == "Enter" // suppress new line...
																	&& !(e.shiftKey || e.ctrlKey || e.altKey) // ...unless holding modifier; ctrl and alt are currently being eaten somewhere
																){ e.preventDefault(); return true }
															}}
															onChange={(e)=>{
																textInputValueΔ(e.target.value);
																textIsChangedΔ(true)
															}}
															// TODO: now that style is controlled, could use textarea only; remaining problem is dealing with sizing on links
															// readOnly={!textIsEditable}
															// style={{pointerEvents:(textIsEditable?`all`:`none`)}}
														/>
													)
												)
												||(__x
													&&(
														<div
															style={{
																pointerEvents:`none`, // important or else the click gets eaten entirely
																maxWidth:`100%`,
																whiteSpace:`pre-wrap`,
																wordWrap:`break-word`,
																...(view.system.isWin?{ paddingBottom:'2px', }:{}),
															}}
														>
															{note.text}
														</div>
													)
												)
											}
										</div>
									)
								}
							</div>

							
							{ // debug layer
								<div style={{
									pointerEvents:`none`,
									position:`absolute`,
									transform:`translate(-50%,0%)`,
									whiteSpace:'pre-wrap',
									margin:`5px 0px`,
									fontSize:`80%`,
									width:`${4*view.unit}px`,
									...(0 < link.position.y
										?{bottom:`${spaceInput.size.y*view.unit*.5}px`,}
										:{top:`${spaceInput.size.y*view.unit*.5}px`,}
									),
								}}>
									{Object.keys(debugVariables).map((name)=>{
										return(<div key={name}>
											{`${name}: ${String((debugVariables as any)[name])}`}{`\n`}
										</div>)}
									)}
								</div>
							}


						</div>
					</Draggable>
				</div>
			)
		}
	</>)

	// FINAL RENDER ^^^
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}