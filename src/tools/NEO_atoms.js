import { __x, __o } from './defaults';
import {
	atom,
	selector,
	selectorFamily,
	useRecoilState,
	useRecoilValue,
	useSetRecoilState,
} from "recoil";

import mem from 'mem';
import localStorage from "store2";

import { useInterval, recolor } from '../tools/functions';
import emoji from '../tools/emojis';

//import { getServerSession } from "next-auth/next"

import { ApolloClient, HttpLink, InMemoryCache, gql, } from "@apollo/client";

const client = new ApolloClient({
	link: new HttpLink({ uri: '/api/graphql' }),
	cache: new InMemoryCache(),
});

const NOTE_QUERY = gql`
	query($uuid: String){
		Note(uuid: $uuid){
			uuid
			color
			icon
			text
			links(uuid: $uuid){
				uuid
				positionX
				positionY
				lengthX
				lengthY
				canTravel
			}
		}
	}
`

export const NEO_proto_atom = selectorFamily({
	key: "NEO_proto_atom",
	get: uuid => async ()=>{
		const response = await client.query({
			query: NOTE_QUERY,
			variables:{ uuid }
		});
		if(response.error){ throw response.error; }
		return response;
	}
});

/////////////////////////////////////////////////////////////////////

export const NEO_session_atom = atom({
	key:"NEO_session_atom",
	default:null,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			console.log("received new session", changedValues)
		} ); }
	],
})

const USER_QUERY = gql`
	query($email: String){
		User(email: $email) {
			uuid
			current
			email
		}
	}
`

export const NEO_user_atom = selector({
	key: "NEO_user_atom",
	get: async ({get})=>{
		const response = await client.query({
			query: USER_QUERY,
			variables:{ email: get(NEO_session_atom)?.user?.email }
		});
		if(response.error){ throw response.error; }
		return response;
	}
});


/*
export const NEO_user_atom = graphQLSelector({
	key:"NEO_user_atom",
	environment: myEnvironmentKey,
	query: graphql`
		Query($email:String!){
			User(email:$email) {
				uuid
				current
				email
			}
		}
	`,
	variables: ({get})=> ({email: get(NEO_email_atom)}),
	mapResponse: data=>data,
});
*/


/////////////////////////////////////////////////////////////////////


export const NEO_canvasID_atom = atom({
	key:"NEO_canvasID_atom",
	default:localStorage("canvas")||'N 0',
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			/*
			localStorage("canvas", changedValues);
			//console.clear()
			console.warn(`NAVIGATING to canvas for node ${changedValues}`)
			*/
		} ); }
	],
});


/////////////////////////////////////////////////////////////////////

export const NEO_note_atom = mem(
	(NEO_noteID)=>atom({
		key: `NEO_note_atom${NEO_noteID}`,
		//default: ()=>{return localStorage("nodes")[nodeID]}, // why was this set as a function?
		default: null, // localStorage("NEO_notes").find(o=>o.id==NEO_noteID),
		effects: [
			({onSet}) => {
				onSet(
					/*
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
					*/
				);
			}
		],
	})
)

/////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////