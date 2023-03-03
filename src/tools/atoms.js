import { __x, __o } from './defaults';
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
} from "recoil";
//import getSession from "next-auth/next";

import mem from 'mem';
import localStorage from "store2";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

import { ApolloClient, HttpLink, InMemoryCache, gql, } from "@apollo/client";
import { any } from 'zod';

const client = new ApolloClient({
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
		const email = get(NEO_session_atom)?.data?.user?.email; // waitForAll() doesn't work on atoms with static defaults

		let user
		const readResponse = await client.query({ // see if they have a user account yet
			query: gql`
			query($email:String){
				User(email:$email){
					uuid
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
		({onSet, getPromise, getLoadable, setSelf, set})=>{
			onSet( async (newCanvasID)=>{
				console.warn(`NAVIGATING to canvas for note ${newCanvasID}`)
			} );
		}
	]
 });

// its list of links should be comprehensive, and creation would add links to the other note
// if you come in via hyperlink it should query with that node

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const NEO_hydra_selector = selector({
	key:'NEO_hydra_selector',
	get: async ({ get }) => {

		const noteID = get(NEO_canvasID_atom)
		const noteCanvas = get(NEO_note_atom(noteID))

		if(!noteCanvas.links){ // having no properties at all implies no links
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
							positionX
							positionY
							lengthX
							lengthY
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
							positionX
							positionY
							lengthX
							lengthY
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
	set:({set, get}, strip)=>{ const queried = strip.data.Note

		const 			noteInner =				get(NEO_note_atom(queried.uuid))
		if(			  !noteInner.links){		set(NEO_note_atom(queried.uuid),
			{
				uuid:		noteInner.uuid			||						queried.uuid,
				color:	noteInner.color		||						queried.color,
				text:		noteInner.text			||						queried.text,
				icon:		noteInner.icon			||						queried.icon,
				links:												  [...queried.linksOut,
																			...queried.linksIn].map((xQL)=>{

					const	link = 					get(NEO_link_atom(xQL.uuid))
					if(  !link.uuid){				set(NEO_link_atom(xQL.uuid),
						{
							uuid:												xQL.uuid,
							positionX:										xQL.positionX,
							positionY:										xQL.positionY,
							lengthX:											xQL.lengthX,
							lengthY:											xQL.lengthY,
							canTravel:										xQL.canTravel,
							notes:[
																				queried.uuid,
																				xQL.destination.uuid,
							],
						})
						const	noteOuter =			get(NEO_note_atom(xQL.destination.uuid))
						if(  !noteOuter.uuid){	set(NEO_note_atom(xQL.destination.uuid),
							{
								uuid:											xQL.destination.uuid,
								color:										xQL.destination.color,
								text:											xQL.destination.text,
								icon:											xQL.destination.icon,
							})
						}
					}
					return xQL.uuid
				}),
			})
		}
	}
})

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const NEO_note_atom = atomFamily({
	key: 'NEO_note_atom',
	default: uuid => {
		return {
			/*
			uuid,
			color:		"",
			icon:			"",
			text:			"",
			links:		[],
			*/
		}
	},
	effects:[
		({onSet})=>{onSet((newValue)=>{
			console.log("note atom was updated",newValue)
		})}
	],
})

export const NEO_link_atom = atomFamily({
	key: 'NEO_link_atom',
	default: uuid => {
	 	return {
			/*
			uuid,
			positionX:	0,
			positionY:	0,
			lengthX:		0,
			lengthY:		0,
			canTravel:	true,
			source:		"",
			target:		"",
			*/
	  	}
	},
	effects:[
		({onSet})=>{onSet((newValue)=>{
			console.log("link atom was updated",newValue)
		})}
	]
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export const view_atom = atom({
	key:"view_atom",
	default:{pxAbsolute:0, XpxUnits:0, pxExtra:0},
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
		//console.log(`measured`, changedValues)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const pocketBlocker_atom = atom({
	key:"pocketBlocker_atom",
	default:false,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//console.log(`toggling sidebar`)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const selectedNodeID_atom = atom({
	key:"selectedNodeID_atom",
	default:null,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//console.log(`grabbing`, changedValues)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const scale_atom = atom({
	key:"scale_atom",
	default:{
		unit:40,
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

// if canvas is empty, it looks at storage
// set it to alternate if 
export const canvasID_atom = atom({
	key:"canvasID_atom",
	default:localStorage("canvas")||'N 0',
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			localStorage("canvas", changedValues);
			//console.clear()
			console.warn(`NAVIGATING to canvas for node ${changedValues}`)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const menuPop_atom = atom({
	key:"menuPop_atom",
	default:null,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//console.log(`EXAMINING menu for link ${changedValues}`)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const pocketID_atom = atom({
	key:"pocketID_atom",
	default:null,
	//default:localStorage("pocket")||null,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//localStorage("pocket", changedValues);
			//console.warn(`POCKET link set to node ${changedValues}`)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const node_atom = mem(
	(nodeID)=>atom({
		key: `node_atom${nodeID}`,
		//default: ()=>{return localStorage("nodes")[nodeID]}, // why was this set as a function?
		default: localStorage("nodes").find(o=>o.id==nodeID),
		effects: [
			({onSet}) => {
				onSet(
					(changedValues) => {
						console.log(`writing new values for node ${nodeID}`, changedValues);
						//console.warn(`existing values for node ${nodeID}` )
						localStorage.transact('nodes', (content)=>{
							let node = content.find((o)=>o.id==nodeID) // correlating the content to the ID
							if(node){
								node.text = changedValues.text // can we just replace it wholesale?
								node.links = changedValues.links // can we just replace it wholesale?
								node.icon = changedValues.icon // can we just replace it wholesale?
	
								//repair color formatting
								node.color = [
									`hsl(`,
									`${node.color.split(",")[0].replace(/\D/g,'')*1},`,
									`${node.color.split(",")[1].replace(/\D/g,'')*1}%,`,
									`${node.color.split(",")[2].replace(/\D/g,'')*1}%`,
									`)`,
								].join("")
	
							}
						})
					}
				);
			}
		],
	})
)

/////////////////////////////////////////////////////////////////////

export const link_atom = mem(
	(linkID)=>atom({
		key: `link_atom${linkID}`,
		default: localStorage("links").find(o=>o.id==linkID),
		effects: [
			({onSet}) => {
				onSet( // this is only triggered on release, so way fewer pings than what you imagine would be for resize or name change
					(changedValues) => {

						console.log(`writing new values for link ${linkID}`, changedValues);
						localStorage.transact('links', (content)=>{
							let link = content[localStorage('links').findIndex((i)=>i.id==linkID)]
							link.position = changedValues.position // can we just replace it wholesale?
						})

					}
				);
			}
		],
	})
)

/////////////////////////////////////////////////////////////////////

export const linkMaster_selector = mem(
	(linkID)=>selector({
		key: `linkMaster_selector${linkID}`,
		get: ({get}) => {
			const link = {...get(link_atom(linkID))}; // must repackage as the get produces a read-only object
			let originID = get(canvasID_atom); // what you're already looking at
			let origin = get(node_atom(originID));
			let targetID = link.nodes.find((n)=>n!=originID) || originID // second option prevents core from returning null
			let target = get(node_atom(targetID));
			//delete target.links // deletion doesn't work unless you make the node_atom default a function and add () to the get; probably hits initial null value; doing this conversion then will break trying to call up the current value in nodeΔ((n)=>[...n,{changed:value}])
	
			let isCenter = linkID == "L 0"
			link.nodes = {
				origin: isCenter?target:origin,
				target: isCenter?origin:target,
			}
			link.isCenter = isCenter
	
			return link;
		},
	})
)

/////////////////////////////////////////////////////////////////////

export const atlas_selector = selector({
	key:"atlas_selector",
	get: ({get}) => {
		let canvasID = get(canvasID_atom)
		let canvas = get(node_atom(canvasID))
		let atlas = canvas.links.map((x)=>{
			return get({...linkMaster_selector(x)})
		})
		return atlas
	}
});

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export const baseAtom = atom({
    key:'baseAtom',
    default:'hello',
})

export const baseSelect = selector({
    key:'baseSelect',
    get:({get})=>{
        const base = get(baseAtom)
        return base.length;
    }
})

//export {baseAtom, baseSelect}



