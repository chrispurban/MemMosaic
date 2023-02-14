import { __x, __o } from './defaults';
import {
	atom,
	selector,
	useRecoilState,
	useRecoilValue,
	useSetRecoilState,
} from "recoil";

import mem from 'mem';
import localStorage from "store2";

import { useInterval, recolor } from '../tools/functions';
import emoji from '../tools/emojis';

import { useQuery, gql } from "@apollo/client";

//import './../App.scss';
//import Link from "./LinkComponent";

/////////////////////////////////////////////////////////////////////


const NEO_email_atom = atom({
	key:"NEO_email_atom",
	default:"chrispurban@gmail.com",
})
	
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



export const NEO_proto_atom = atom({
	key:"NEO_proto_atom",
	default:null,
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