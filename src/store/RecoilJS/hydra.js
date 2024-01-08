import {
	__x,
	__o,
} from '../../tools/defaults';

import {
	selector,
} from "recoil";

import {
	NEO_canvasID_atom,
	NEO_note_atom,
	NEO_user_selector,
	NEO_link_atom,
	client,
} from "../index";

import {
	gql
} from "@apollo/client";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// use the currently selected canvas and load the first ring of related notes
// this repeats the first time each link-capable note is navigated towards, to get the next set of its relationships
// there are three redundant checks to prevent an infinite loop: the GET, the SET, and the const NEO_hydra within the Recoil component
export const NEO_hydra_selector = selector({
	key:'NEO_hydra_selector',
	get: async ({ get }) => {

		const canvasID = get(NEO_canvasID_atom) // your current canvas
		const canvas = get(NEO_note_atom(canvasID)) // its content

		if(__x
			//&& canvas.retrieved
			&& !canvas.queried
		){ // loop check
			const userID = get(NEO_user_selector).uuid
			const naiveResponse = await client.query({
				query: gql`
				query($userID: String, $noteID: String){
					Note(userID: $userID, noteID: $noteID){
						uuid
						color
						icon
						text
						owner
						linksIn{
							uuid
							position{x,y}
							size{x,y}
							canTravel
							destination{
								uuid
								color
								icon
								text
								owner
							}
						}
						linksOut{
							uuid
							position{x,y}
							size{x,y}
							canTravel
							destination{
								uuid
								color
								icon
								text
								owner
							}
						}
					}
				}`,
				variables:{ noteID:canvasID , userID }
			});
			if(naiveResponse.error){ throw naiveResponse.error; }

			function untype(typedTarget){
				let untypedTarget = {...typedTarget};
				delete untypedTarget.__typename
				return untypedTarget
			}

			let note = naiveResponse.data.Note
			let cleanResponse = untype({
				...note,
				links:[ // see GQL notes about issues with directionality; at least there are no duplicates
					...note.linksOut,
					...note.linksIn
				].map(link => ({	...untype(link),
					position:			untype(link.position),
					size:					untype(link.size),
					destination:		untype(link.destination),
				}))
			})
			delete cleanResponse.linksIn
			delete cleanResponse.linksOut
			return cleanResponse;
		}
		else{
			return null;
		}
	},
	// data manipulated within SET is simply what came from GET but has been routed through the component, as Recoil requires all SETs to begin in this fashion
	// Recoil SET is not allowed to be asynchronous but can apparently still rely on an asynchronous selector so long as that selector has been initialized at least once
	// otherwise there's an error about pending state
	set:({set, get}, got)=>{
		const queriedNote = got
		if(queriedNote){ // current state
			const canvas =										get(NEO_note_atom(queriedNote.uuid))
			if(	canvas.queried == false){
																	set(NEO_note_atom(queriedNote.uuid),{ 
				...canvas,									...queriedNote,
					initialized:								true,
					retrieved:									true,
					queried:										true,
					links:[	
						...new Set([ // remove duplicates of any newly-created link saved to the server in time for reload
							...canvas.links, // any newly created links in client state which may not have fully saved yet, but also don't need to be loaded further
							...queriedNote.links
								.map((strip)=>{
									const { destination, ...queriedLink } = strip;
									set(NEO_link_atom(		queriedLink.uuid),(priorLink)=>{return {
										...priorLink,		...queriedLink,
										initialized:			true,
										retrieved:				true,
										notes:[
																	destination.uuid,
																	queriedNote.uuid, // aka point of origin
										],
									}})
									set(NEO_note_atom(		destination.uuid),(priorNote)=>{return {
										...priorNote,		...destination,
										initialized:			true,
										retrieved:				true,
									}})
									return queriedLink.uuid // we just want the pointer after separating the note
								})
						])		
					]
			})}
		}
	}
})