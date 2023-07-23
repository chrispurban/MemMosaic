import { __x, __o } from '../tools/defaults';
import emoji from '../tools/emojis';
import { recolor } from '../tools/functions';

import {
	atom,
	atomFamily,
	selector,
	useRecoilValue,
	useRecoilState,
} from "recoil";

import { useEffect, } from "react";
import { useSession, getSession, } from "next-auth/react";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

import { ApolloClient, HttpLink, InMemoryCache, gql, } from "@apollo/client";

export const client = new ApolloClient({
	link: new HttpLink({ uri: '/api/graphql' }),
	cache: new InMemoryCache(),
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

// general user interface
export const view_atom = atom({
	key:"view_atom",
	default:{
		grid:10,
		unit:40,
		frame:60,
		height:{
			absolute:0,
			divided:0,
			remainder:0,
		},
		// system:{} // excluded because of a check on Spine for it
	},
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

// load user account
export const NEO_user_selector = selector({ // associate username with saved content
	key: "NEO_user_selector",
	get: async ({get})=>{
		const userSession = await getSession()
		const email = userSession?.user?.email //console.log("user session obtained", userSession)
		const readResponse = await client.query({ // see if they have a user account yet
			query: gql`
			query($email:String){
				User(email:$email){
					uuid
					origin
					current
					email
					isAdmin
				}
			}`,
			variables:{ email } // GraphQL typeDef is set to return the default user if email is blank
		});
		if(readResponse.error){throw readResponse.error;}

		let user

		if(readResponse?.data?.User){ // they do have an account, or are signed out and using the default
			user = readResponse
		}
		else{
			console.log(`Generating new user account for ${email}`)
			const createResponse = await client.mutate({
				mutation: gql`
				mutation createUser($email: String!){
					User: createUser(email: $email){
						uuid
						origin
						current
						email
						isAdmin
					}
				}`,
				variables: { email }
			});
			if(createResponse.error){throw createResponse.error;}
			user = createResponse
		}

		return user.data.User
	}
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

// track which note you're viewing the internal world of
export const NEO_canvasID_atom = atom({
	key: 'NEO_canvasID_atom',
	default: selector({
		key: 'UserInfo/Default',
		get: ({get}) => {
			const user = get(NEO_user_selector) // load the last canvas you were looking at
			if(user.current){
				return user.current
				// to even try and delete the current would require a severe delay in updating this property, as there's no mechanism for deleting the one you're looking at
				// even still, protection has been added to the deleteLink mutation
			}
			else{
				return user.origin
			}
		},
	}),
	effects:[
		({ onSet, getPromise }) => {
			getPromise(NEO_user_selector).then(user => {
				onSet(async (newCanvasID)=>{
					console.warn(`NAVIGATING to canvas for note ${newCanvasID}`)
					const setResponse = await client.mutate({ mutation:gql`
						mutation setCurrent( $userID: String, $noteID: String ){
							setCurrent( userID: $userID, noteID: $noteID )
						}`,
						variables:{ noteID:newCanvasID , userID:user.email }
					});
				});
			});
		},
	]
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

// track whether a note is currently being edited; 
export const selectedID_atom = atom({
	key: 'selectedID_atom',
	default: "",
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

// use the currently selected canvas and load the first ring of related notes
// this process repeats the first time you navigate to each note, to get the next ring
// there are three redundant checks to prevent an infinite loop: the GET, the SET, and the const NEO_hydra within the Recoil component
export const NEO_hydra_selector = selector({
	key:'NEO_hydra_selector',
	get: async ({ get }) => {

		const canvasID = get(NEO_canvasID_atom) // your current canvas
		const canvas = get(NEO_note_atom(canvasID)) // its content

		if(!canvas.queried){ // loop check
			const userID = get(NEO_user_selector).uuid
			const response = await client.query({
				query: gql`
				query($userID: String, $noteID: String){
					Note(userID: $userID, noteID: $noteID){
						uuid
						color
						icon
						text
						linksIn{
							uuid
							position{x,y}
							length{x,y}
							canTravel
							destination{
								uuid
								color
								icon
								text
							}
						}
						linksOut{
							uuid
							position{x,y}
							length{x,y}
							canTravel
							destination{
								uuid
								color
								icon
								text
							}
						}
					}
				}`,
				variables:{ noteID:canvasID , userID }
			});
			if(response.error){ throw response.error; }
			return response;
		}
		else{
			return null;
		}
	},
	// data manipulated here within SET is simply what came from GET but has been routed through the component, as Recoil requires all SETs to begin in this fashion
	// Recoil SET is not allowed to be asynchronous but can apparently still rely on an asynchronous selector so long as that selector has been initialized at least once
	// otherwise there's an error about pending state
	set:({set, get}, strip)=>{
		const acquiredNote = strip.data.Note
		if(acquiredNote){
			const 			canvas =					get(NEO_note_atom(acquiredNote.uuid))
			if(			  !canvas.queried){		set(NEO_note_atom(acquiredNote.uuid),{ // loop check
				queried:		true,
				uuid:			canvas.uuid				||						acquiredNote.uuid, // copy everything* into canvas state
				color:		canvas.color			||						acquiredNote.color,
				text:			canvas.text				||						acquiredNote.text,
				icon:			canvas.icon				||						acquiredNote.icon,
				links:[	
					...new Set([ // object type removes duplicate client links if the network was too fast
						...canvas.links, // any newly created links in client state which may not have fully saved yet, but also don't need to be loaded further
						...[
							...acquiredNote.linksOut, // preexisting links, OUT + IN until you can get it to properly ignore directionality
							...acquiredNote.linksIn
						]
							.map((queriedLink)=>{
								set(NEO_link_atom(		queriedLink.uuid),(priorLink)=>{return{ // instantiating the connection between notes
									...priorLink,		...queriedLink,
									position:{			...queriedLink.position,		__typename:undefined}, //position:({__typename, ...rest} = queriedLink.position, rest),
									length:{				...queriedLink.length,			__typename:undefined},
									notes:[
																queriedLink.destination.uuid,
																acquiredNote.uuid, // aka point of origin
									],
									destination:			undefined,
									__typename:				undefined,
								}})	
								set(NEO_note_atom(		queriedLink.destination.uuid),(priorNote)=>{return{ // instantiating only surface-level information about the note
									...priorNote,		...queriedLink.destination,
									__typename:				undefined,
								}})
								return queriedLink.uuid
							})
					])		
				]
			})}
		}
	}
})

/////////////////////////////////////////////////////////////////////////////////////////////////////

// core note state, empty until populated by the hydra
export const NEO_note_atom = atomFamily({
	key: 'NEO_note_atom',
	default: uuid => {
		return {
			uuid:			`${uuid}`,
			color:		``,
			text:			``,
			icon:			``,
			links:		[],
			queried:		false,
		}
	},
	effects:[
		({onSet})=>{onSet((newValue, oldValue)=>{
			//if(oldValue.uuid){console.log("note atom was updated",newValue)}
		})}
	],
})

// core link state, empty until populated by the hydra
export const NEO_link_atom = atomFamily({
	key: 'NEO_link_atom',
	default: uuid => {
	 	return {
			 uuid:			uuid,
			 canTravel:		true,
			 position:{
				x:				0,
				y:				0,
			},
			length:{
				x:				0,
				y:				0,
			},
			notes:			[],
		}
	},
	effects:[
		({onSet})=>{onSet((newValue, oldValue)=>{
			//if(oldValue.uuid){console.log("link atom was updated",newValue)}
		})}
	]
});

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
		//console.log("you triggered the UUID selector")
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
export const NEO_create_selector = selector({
	key: 'NEO_create_selector',
	get: () => undefined,
	set:({get, set}, {
		position, isLink, reLink,
		//linkID, noteID,
	})=>{
		let canvasID = get(NEO_canvasID_atom) // location to begin the link
		let canvas = get(NEO_note_atom(canvasID)) // only used to pull color information, how/whether to deviate
		let user = get(NEO_user_selector) // authentication

		const UU = get(NEO_UUID_generation_selector) // uuid generator

		set(selectedID_atom, UU) // otherwise global functions won't know you're editing something like they normally would from click handlers

		// prepare destination
		set(NEO_note_atom(UU.noteID),(priorValues)=>{return{
			...priorValues,
			color:recolor(canvas.color, { // shift color away from canvas if it's a link
				hue:isLink?-(Math.floor(Math.random()*(canvas.uuid == user.origin?360:91)) + 30):0, // would be more appropriate to look at whether the saturation was zero
				sat:isLink?`${Math.floor(Math.random() * 11) + 30}`:0,
				lum:isLink?`${Math.floor(Math.random() * 11) + 80}`:0, // should cap at 90, is presented 5 higher
			}),
			icon: isLink?emoji():null,
			text: "", // causes the note to enable editing on itself, and then delete itself if saved while still blank
			links:[
				UU.linkID // new UUID is used but not marked as spent until the end
			],
		}})
		// we're setting this in state first because it will be written to the database only when completed; they may back out

		// pull a new link out of the new note
		set(NEO_link_atom(UU.linkID),(priorValues)=>{return{
			...priorValues,
			position,
			length:isLink?{x:3,y:1}:{x:6,y:1},
			canTravel:isLink,
			notes:[
				canvasID, // point of origin
				UU.noteID // new destination
			]
		}})

		// attach link to the current canvas
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


/////////////////////////////////
//////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

// deliberate code duplicate for the purpose of working out how to properly copy links out of the pocket

export const NEO_create2_selector = selector({
	key: 'NEO_create2_selector',
	get: () => undefined,
	set:({get, set}, {position, isLink, reLink, linkID, noteID,})=>{

		let canvasID = get(NEO_canvasID_atom)

		if(noteID && linkID){ // instantiating the link with the pregenerated uuid
			set(NEO_link_atom(linkID),{
				uuid: linkID,
				position,
				length:isLink?{x:3,y:1}:{x:6,y:2},
				canTravel:isLink,
				notes:[
					canvasID,
					noteID
				]
			})
		}

		if(reLink){
			set(NEO_note_atom(noteID),(prevData)=>({ // adding the new link to the list had by the destination
				...prevData,
				links: [
					...prevData.links,
					linkID
				]
			}) );
		}
		else{
			set(NEO_note_atom(noteID),{
				uuid: noteID,
				color: "hsl(20,40%,90%)",
				icon: isLink?emoji():null,
				text: "",
			})
		}

		set(NEO_note_atom(canvasID),(prevData)=>({
			...prevData,
			links: [
				...prevData.links,
				linkID
			]
		}) );

	}
});

///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
/////////////////////////////////


export const NEO_pocketID_atom = atom({
	key:"NEO_pocketID_atom",
	default:"",
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			if(changedValues){console.warn(`POCKET link set to node ${changedValues}`)}
		} ); }
	],
});


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export default function RecoilComponent(){ //console.log("Recoil component rendered")

	// a component was used (instead of a side JS file) for self-setting and access to React hooks for things like authorization

	// passing async GET directly to SET; other options internal to Recoil were not available
	const [ NEO_hydra, NEO_hydraΔ ] = useRecoilState(NEO_hydra_selector)
	const canvas = useRecoilValue(NEO_note_atom(useRecoilValue(NEO_canvasID_atom)))
	useEffect(()=> {
		if(!canvas.queried){NEO_hydraΔ(NEO_hydra)} // loop check
	},[
		canvas, NEO_hydra
	])

	// anchor needed to kickstart a selector; placed here to avoid creating a dependency with rerenders elsewhere
	const anchors = [
		useRecoilValue(NEO_UUID_generation_selector)
	]

	return null
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////




/////////////////////////////////////////////////////////////////////////////////////////////////////

/*
// handled directly with getSession right now
export const NEO_session_atom = atom({
	key:"NEO_session_atom",
	default:undefined,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{ // getSession hook value passed by Spine component
			let email = changedValues?.data?.user?.email
			if(email){
				console.warn(`Signed in as ${
					email.split('@')[0]
				} for ${
					Math.ceil((Date.parse(changedValues.data.expires) - Date.now())/(1000 * 3600 * 24))
				} more days`)
			}
			else{
				console.warn(`Register to make changes`)
			}
		} ); }
	],
})
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////