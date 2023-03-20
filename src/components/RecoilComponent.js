import { __x, __o } from '../tools/defaults';
import {
	atom,
	atomFamily,
	selector,
	useRecoilState,
	useRecoilValue,
	selectorFamily,
	get,
	set,
	waitForAll,
	waitForAllSettled,
	recoilValueReadOnly,
} from "recoil";
//import getSession from "next-auth/next";

import emoji from '../tools/emojis';
import { recolor } from 'tools/functions';

import { useSession, getSession, } from "next-auth/react";

import mem from 'mem';
import localStorage from "store2";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

import { ApolloClient, HttpLink, InMemoryCache, gql, } from "@apollo/client";
import { any } from 'zod';

export const client = new ApolloClient({
	link: new HttpLink({ uri: '/api/graphql' }),
	cache: new InMemoryCache(),
});


/////////////////////////////////////////////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const NEO_user_selector = selector({
	key: "NEO_user_selector",
	get: async ({get})=>{
		const userSession = await getSession()
		const email = userSession?.user?.email
		console.log("user session obtained", userSession)
		
		let user
		const readResponse = await client.query({ // see if they have a user account yet
			query: gql`
			query($email:String){
				User(email:$email){
					uuid
					origin
					current
					email
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
			return get(NEO_user_selector).current;
		},
	}),
	effects:[
		({onSet})=>{
			onSet( (newCanvasID)=>{
				console.warn(`NAVIGATING to canvas for note ${newCanvasID}`)
				// additional effect to write to user.current
			} );
		}
	]
 });

// if you come in via hyperlink it should query with that note

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const NEO_hydra_selector = selector({
	key:'NEO_hydra_selector',
	get: async ({ get }) => {

		const noteID = get(NEO_canvasID_atom)
		const noteCanvas = get(NEO_note_atom(noteID))

		if(!noteCanvas.queried){
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
							position{
								x
								y
							}
							length{
								x
								y
							}
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
							position{
								x
								y
							}
							length{
								x
								y
							}
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
				variables:{ noteID, userID }
			});
			if(response.error){ throw response.error; }
			return response;
		}
		else{
			return null;
		}
	},
	// SET is not allowed to be asynchronous but can apparently still rely on an asynchronous selector so long as that selector has been initialized at least once; otherwise there's an error about pending state
	set:({set, get}, strip)=>{ const acquired = strip.data.Note
		if(acquired){
		const 				noteInner =				get(NEO_note_atom(acquired.uuid))
		if(				  !noteInner.queried){	set(NEO_note_atom(acquired.uuid),{
				queried:		true,
				uuid:			noteInner.uuid			||						acquired.uuid,
				color:		noteInner.color		||						acquired.color,
				text:			noteInner.text			||						acquired.text,
				icon:			noteInner.icon			||						acquired.icon,
				links:[	
					...new Set([ // remove duplicate client links if the network was fast enough
						...	noteInner.links,
						...[
							...acquired.linksOut,
							...acquired.linksIn
						].map((xQL)=>{
							set(NEO_link_atom(		xQL.uuid),(priorLink)=>{return{
								...priorLink,		...xQL,
								position:{			...xQL.position,		__typename:undefined},
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
			uuid:			uuid,
			color:		"",
			text:			"",
			icon:			"",
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
			notes:[
			],
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
		console.log("you triggered the UUID selector")
		set(NEO_UUID_atom,oldUUIDs) // triggers regeneration of UUIDs after 
	}
})

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

		set(NEO_note_atom(UU.noteID),(priorValues)=>{return{
			...priorValues,
			color:recolor(canvas.color, { // deviates from canvas if it's a link
				hue:isLink?-(Math.floor(Math.random()*(canvas.uuid == user.origin?360:76)) + 15):0, // would be more appropriate to look at whether the saturation was zero
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
			length:isLink?{x:3,y:1}:{x:6,y:2},
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
	default:{pxAbsolute:0, pxUnits:0, pxExtra:0, frame:60},
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
		//console.log(`measured`, changedValues)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const scale_atom = atom({
	key:"scale_atom",
	default:{
		unit:40,
		position:40,
		length:40,
	},
	effects:[
		/*
		({onSet})=>{ onSet( (changedValues)=>{
			console.error(`NAVIGATING to canvas for node `, changedValues);
		} ); }
		*/
	],
});


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export default function RecoilComponent(){
	//console.log("recoil component rendered")







	const anchorUUID = useRecoilValue(NEO_UUID_selector)
	return null
}