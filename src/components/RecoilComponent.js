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

export const NEO_user_selector = selector({
	key: "NEO_user_selector",
	get: async ({get})=>{
		const userSession = await getSession()
		const email = userSession?.user?.email
		//console.log("user session obtained", userSession)
		
		let user
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
		if(readResponse?.data?.User){ // has an account or is using the default
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

export const NEO_canvasID_atom = atom({
	key: 'NEO_canvasID_atom',
	default: selector({
		key: 'UserInfo/Default',
		get: ({get}) => {
			const user = get(NEO_user_selector)
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

// if you come in via hyperlink it should query with that note

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const selectedID_atom = atom({
	key: 'selectedID_atom',
	default: "",
});
// purpose to allow you to track whether a note is currently being edited; 

/////////////////////////////////////////////////////////////////////////////////////////////////////

// uses the currently selected canvas note and sets up state for all its related notes
// this process repeats every time the user navigates, but only the first time for each note
// there are three redundant checks to prevent an infinite loop: the GET, the SET, and the bottom of this component
export const NEO_hydra_selector = selector({
	key:'NEO_hydra_selector',
	get: async ({ get }) => {

		const canvasID = get(NEO_canvasID_atom)
		const canvas = get(NEO_note_atom(canvasID))

		if(!canvas.queried){
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
	// SET is not allowed to be asynchronous but can apparently still rely on an asynchronous selector so long as that selector has been initialized at least once; otherwise there's an error about pending state
	// acquired data is simply what came from GET but routed through the component, as Recoil requires all SETs to begin in this fashion
	set:({set, get}, strip)=>{ const acquired = strip.data.Note
		if(acquired){
			const 			canvas =					get(NEO_note_atom(acquired.uuid))
			if(			  !canvas.queried){		set(NEO_note_atom(acquired.uuid),{ // look into eliminating the blink on the first travel of a link
				queried:		true,
				uuid:			canvas.uuid				||						acquired.uuid,
				color:		canvas.color			||						acquired.color,
				text:			canvas.text				||						acquired.text,
				icon:			canvas.icon				||						acquired.icon,
				links:[	
					...new Set([ // remove duplicate client links if the network was fast enough
						...	canvas.links,
						...[
							...acquired.linksOut,
							...acquired.linksIn
						].map((xQL)=>{
							set(NEO_link_atom(		xQL.uuid),(priorLink)=>{return{
								...priorLink,		...xQL,
								position:{			...xQL.position,		__typename:undefined}, //position:({__typename, ...rest} = xQL.position, rest),
								length:{				...xQL.length,			__typename:undefined},
								notes:[
															xQL.destination.uuid,
															acquired.uuid,
								],
								destination:			undefined,
								__typename:				undefined,
							}})	
							set(NEO_note_atom(		xQL.destination.uuid),(priorNote)=>{return{
								...priorNote,		...xQL.destination,
								__typename:				undefined,
							}})
							return xQL.uuid
						})
					])		
				]
			})}
		}
	}
})

/////////////////////////////////////////////////////////////////////////////////////////////////////

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

export const NEO_UUID_atom = atom({
	key: 'NEO_UUID_atom',
	default:null,
 });

export const NEO_UUID_selector = selector({
	key: 'NEO_UUID_selector',
	get: async ({get})=>{
		const anchor = get(NEO_UUID_atom)
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
		return UUIDs
	},
	set:({set}, oldUUIDs)=>{
		//console.log("you triggered the UUID selector")
		set(NEO_UUID_atom,oldUUIDs) // triggers regeneration of UUIDs after 
	}
})

// get a big list and delete entries as they're used?

/////////////////////////
/////////////////////////

export const NEO_create_selector = selector({
	key: 'NEO_create_selector',
	get: () => undefined,
	/*
	get: async ({get})=>{
		const anchor = get(NEO_UUID_atom)
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

	set:({get, set}, {
		position, isLink, reLink,
		//linkID, noteID,
	})=>{
		let canvasID = get(NEO_canvasID_atom)
		let canvas = get(NEO_note_atom(canvasID))
		let user = get(NEO_user_selector)

		const UU = get(NEO_UUID_selector)

		set(selectedID_atom, UU) // otherwise functions won't know you're editing something like they normally would from click handlers

		set(NEO_note_atom(UU.noteID),(priorValues)=>{return{
			...priorValues,
			color:recolor(canvas.color, { // deviates from canvas if it's a link
				hue:isLink?-(Math.floor(Math.random()*(canvas.uuid == user.origin?360:91)) + 30):0, // would be more appropriate to look at whether the saturation was zero
				sat:isLink?`${Math.floor(Math.random() * 11) + 30}`:0,
				lum:isLink?`${Math.floor(Math.random() * 11) + 80}`:0, // should cap at 90, is presented 5 higher
			}),
			icon: isLink?emoji():null,
			text: "", // causes the note to enable editing on itself, and then delete itself if saved while still blank
			links:[
				UU.linkID
			],
		}})

		set(NEO_link_atom(UU.linkID),(priorValues)=>{return{
			...priorValues,
			position,
			length:isLink?{x:3,y:1}:{x:6,y:1},
			canTravel:isLink,
			notes:[
				canvasID,
				UU.noteID
			]
		}})

		set(NEO_note_atom(canvasID),(prevData)=>({
			...prevData,
			links: [
				...prevData.links,
				UU.linkID
			]
		}) );
		
		set(NEO_UUID_selector, UU) // triggers regeneration of UUIDs after spending them
	}
});


/////////////////////////////////
//////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

// duplicate for the purpose of working out how to copy links out of the pocket

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
	//default:localStorage("pocket")||null,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			if(changedValues){console.warn(`POCKET link set to node ${changedValues}`)}
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

// only place here either:
// - anchors which kickstart a selector
// - effects which pass a selector's GET data to trigger another's SET

export default function RecoilComponent(){
	//console.log("recoil component rendered")

	const [ NEO_hydra , NEO_hydraΔ ] = useRecoilState(NEO_hydra_selector)
	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom)
	const [ canvas, canvasΔ ] = useRecoilState(NEO_note_atom(canvasID))
	useEffect(()=> { // pass async GET to SET; other options internal to Recoil not available
		if(!canvas.queried){NEO_hydraΔ(NEO_hydra)}
	},[
		canvas, NEO_hydra
	])

	const anchorUUID = useRecoilValue(NEO_UUID_selector)

	return null
}