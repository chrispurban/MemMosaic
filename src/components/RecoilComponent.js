/* eslint-disable react-hooks/exhaustive-deps */

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	gql,
} from "@apollo/client";

import {
	useRecoilValue,
	useRecoilState,
} from "recoil";

import {
	useEffect
} from "react";

import {
	client,
	NEO_canvasID_atom,
	NEO_hydra_selector,
	NEO_note_atom,
	NEO_UUID_generation_selector,
	transaction_queue_atom,
} from "../store/index";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// component implementation was chosen for self-setting and access to React hooks for things like authorization (latter no longer true)
export default function RecoilComponent(){ //console.log("Recoil component rendered")


	// passing a selector's async retrieved data to itself so it may set other atoms; other options internal to Recoil were not available
	const [ NEO_hydra, NEO_hydraΔ ] = useRecoilState(NEO_hydra_selector)
	const canvas = useRecoilValue(NEO_note_atom(useRecoilValue(NEO_canvasID_atom)))
	useEffect(()=> {
		if(!canvas.queried){NEO_hydraΔ(NEO_hydra)} // hard loop check, deliberately not using "canvas.links.length == 0"
	},[
		canvas, NEO_hydra
	])


	// this is used instead of an atom's onSet effect so that we have the option to write followup values
	const [queue, queueΔ] = useRecoilState(transaction_queue_atom);
	const isWriteEnabled = true
	useEffect(()=>{
		(async ()=>{
			if(queue.length > 0){
				const [ transaction, ...remaining ] = queue;
				const { literal, variables } = transaction
				if(isWriteEnabled){
					const response = await client.mutate({
						mutation:gql`${literal}`,
						variables,
					});
					if(response.errors){throw response.errors;}
					//console.error("mutation result", response)
				}
				else{
					console.log("queue would hypothetically execute a client.mutate of ", transaction)
				}
				queueΔ(remaining)
			}
		})();
	},[
		queue
	]);


	// anchor needed kickstart the following selectors without rerendering
	const anchors = [
		useRecoilValue(NEO_UUID_generation_selector)
	]


	return null
}