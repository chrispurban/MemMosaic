import { useInterval, recolor } from '../tools/functions';
import { __x, __o } from '../tools/defaults';
import emoji from '../tools/emojis';
import {
	NEO_proto_atom,
	NEO_user_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, useRecoilValueLoadable, } from "recoil";
import {
	memo,
	useState,
	useEffect,
	useRef,
} from 'react';
//import { useQuery, gql } from "@apollo/client";

import Link from "./LinkComponent";
import Note from "./NoteComponent";

//import './../App.scss';
//import Link from "./LinkComponent";

import localStorage from 'store2';

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

const uuid = "53cabf50-7e7f-4a45-94b8-19559d914e36"
/*
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
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function NEO_Canvas(){

	const NEO_proto = useRecoilValueLoadable(NEO_proto_atom(uuid))
	const NEO_user = useRecoilValueLoadable(NEO_user_atom)

	//const { loading, error, data } = useQuery(NOTE_QUERY, {variables:{uuid}});
	//console.log("canvas", data?.Note)

	// const [ NEO_canvasID, NEO_canvasIDΔ ] = useRecoilState(NEO_canvasID_atom)
	// const [ NEO_canvasNode, NEO_canvasNodeΔ ] = useRecoilState(NEO_note_atom(NEO_canvasID))

////////////////////////////////////////////////////////////////////

	useEffect(()=>{
		const handleKey = (e:any)=>{
			if(e.key == "Home"){
				console.log("graphql retrieved data", NEO_proto)
				console.warn("user session", NEO_user?.contents?.data?.User)
				//console.warn("user session", NEO_user)
			}
		}
			window.addEventListener('keyup', handleKey);
		return ()=>{
			window.removeEventListener('keyup', handleKey);
		};
	},[
		NEO_proto,
		NEO_user,
	])

////////////////////////////////////////////////////////////////////

	return(<>
	
			<div>
				{
					//data?.Note.uuid
				}
				<br/>
				{
					/*
					data?.Note.links.map((v:any)=>{
						return(
							<div key={v.uuid}>{
								v.uuid}
							</div>
						)
					})
					*/
				}
			</div>

	</>)	

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////