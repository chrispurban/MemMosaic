import {
	__x,
	__o,
} from '../../../tools/defaults';

import emoji from '../../../tools/emojis';

import {
	recolor,
} from '../../../tools/functions';

import {
	atom,
	selector,
} from "recoil";

import {
	selectedID_atom,
	NEO_note_atom,
	NEO_link_atom,
	NEO_user_selector,
	client,
	NEO_write_selector,
} from "../../index";

import {
	gql,
} from "@apollo/client";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// reservoir for the last set of newly created UUIDs, not fully to your liking; done because of asynchronous rules
export const NEO_UUID_spent_atom = atom({
	key: 'NEO_UUID_spent_atom',
	default:null,
});

// obtain new UUIDs every time one is spent on note creation, marked by presence in the reservoir
export const NEO_UUID_generation_selector = selector({
	key: 'NEO_UUID_generation_selector',
	get: async ({get})=>{
		const anchor = get(NEO_UUID_spent_atom)
		let newUUIDs = await client
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
		return newUUIDs
	},
	set:({set}, oldUUIDs)=>{
		set(NEO_UUID_spent_atom,oldUUIDs) // triggers regeneration of UUIDs after 
	}
})

	// get a bigger list and delete entries as they're used?
	// still wouldn't qualitatively fix the problem
	/*
	get: async ({get})=>{
		const anchor = get(NEO_UUID_spent_atom)
		let UUIDs = await client
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
		console.error("you just generated some uuids", UUIDs)
		return UUIDs
	},
	*/
	// get could handle UUID generation if initiated ahead of time


// creation of a note, and by extension a link
// this creates it in local state
export const NEO_note_generation_selector = selector({
	key: 'NEO_note_generation_selector',
	get: () => undefined,
	set:({get, set}, {
		canvasID,
		position,
		isLink,
		targetID,
	})=>{ // written to the database only when completed; user has the option to back out

		console.warn(`Recoil received a request for note ${targetID?"connection":"generation"}`, {
			position:{x:position.x, y:position.y},
			...targetID?{uuid:targetID}:{},
		});

		let canvas = get(NEO_note_atom(canvasID)) // only used to pull color information, how/whether to deviate
		let user = get(NEO_user_selector) // authentication
		const UU = get(NEO_UUID_generation_selector) // uuid generator

		set(selectedID_atom, UU) // otherwise global functions won't know you're editing something like they normally would from click handlers

		// if no targetID, generates a new note and a new link
		// if targetID is provided, then it will have content
		// if it has content, self-editing will not happen

		set(NEO_note_atom(targetID || UU.noteID),(priorValues)=>{return{ // prepare destination note
			...priorValues,
			...(!targetID
				?{ // new note, generate values
					color:recolor(canvas.color, { // shift color away from canvas if it's a link
						hue:isLink?-(Math.floor(Math.random()*(canvas.uuid == user.origin?360:91)) + 30):0, // would be more appropriate to look at whether the saturation was zero
						sat:isLink?`${Math.floor(Math.random() * 11) + 30}`:0,
						lum:isLink?`${Math.floor(Math.random() * 11) + 80}`:0, // should cap at 90, is presented 5 higher
					}),
					icon: isLink?emoji():"",
					text: "", // causes the note to enable editing on itself, and then delete itself if saved while still blank
				}
				:{}
			),
			links:[
				...priorValues.links,
				UU.linkID // new UUID is used but not marked as spent until the end
			],
			initialized:true,
		}})

		// always tie a new link from the note back to the canvas
		const linkValues = {
			position,
			size:isLink?{x:3,y:1}:{x:6,y:1},
			canTravel:isLink,
			notes:[
				canvasID, // point of origin
				targetID || UU.noteID // destination, provided or generated
			],
			initialized:true,
		}
		if(targetID){
			set(NEO_write_selector, {canvasID, linkID:UU.linkID, targetID, changeBatch:{linkChanges:linkValues}})
		}
		else{
			set(NEO_link_atom(UU.linkID),(prevData)=>({
				...prevData, // even if nothing else, inherits the uuid
				...linkValues
			}) );
		}


		// attach link to the current canvas; note will then render, sense it's empty, and enter edit mode
		// GraphQL is configured to take the link and note data in one operation from the save
		set(NEO_note_atom(canvasID),(prevData)=>({
			...prevData,
			links:[
				...prevData.links,
				UU.linkID
			]
		}) );
		
		set(NEO_UUID_generation_selector, UU) // triggers regeneration of UUIDs after spending them

	}
});