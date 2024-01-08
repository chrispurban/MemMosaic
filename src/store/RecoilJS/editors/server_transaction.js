import {
	__x,
	__o,
} from '../../../tools/defaults';
import {
	subset
} from '../../../tools/functions';

import {
	selector,
	atom,
} from "recoil";

import {
	NEO_user_selector,
	NEO_note_atom,
	NEO_link_atom,
} from "../../index";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export const transaction_queue_atom = atom({
	key: 'transaction_queue_atom',
	default: [],
});

export const NEO_write_selector = selector({
	key: 'NEO_write_selector',
	get: () => {return null},
	set: ({ get, set }, payload) => {

		const userID = get(NEO_user_selector)?.email // authentication
		const { canvasID, targetID, linkID, changeBatch, } = payload // investigate unlinking the name "change" from noteside
		const { linkChanges = {}, noteChanges = {}, } = changeBatch
		const linkPayload = {
			...get(NEO_link_atom(linkID)),
			...linkChanges,
		}
		const targetPayload = {
			...get(NEO_note_atom(targetID)),
			...noteChanges,
		}

		let transactions = []

		if(__o // provided a blank submission, deliberately
			|| Object.keys({...linkChanges, ...noteChanges}).length == 0
			|| ("text" in noteChanges && noteChanges.text.length == 0)
		){
			([ // remove reference to the link from both sides, both notes
				canvasID,
				targetID,
			])
				.forEach((λ_noteID)=>
					set(NEO_note_atom(λ_noteID),(λ_notePrior)=>({
						...λ_notePrior,
						links:λ_notePrior.links.filter((λ_link)=> λ_link !== linkID),
					})
				)
			);
			if(linkPayload.retrieved){ // link existed in database before and needs deeper removal
				transactions.push({
					literal:`
						mutation deleteLink( $userID:String, $linkID:String, $noteID:String ){
							deleteLink( userID:$userID, linkID:$linkID, noteID:$noteID )
						}
					`, // GraphQL deleteLink does its own orphan check to remove the note
					variables:{
						userID:userID,
						linkID:linkID,
						noteID:targetID,
					}
				});
			}
		}
		else{
			///////////////////////////////////////////////////////////////////////////////////////////////////////////////
			
			if(Object.keys(noteChanges).length>0){
				transactions.push({
					literal:!targetPayload.retrieved?`
						mutation createNote( $userID:String, $note:NoteInput!, $link:LinkInput!, $sourceID:String ){
							createNote( userID:$userID, note:$note, link:$link, sourceID:$sourceID )
						}
					`:`
						mutation editNote( $userID:String, $note:NoteInput! ){
							editNote( userID:$userID, note:$note )
						}
					`,
					variables:{
						userID:userID,
						note:subset({...targetPayload},[
							`uuid`,
							`color`,
							`icon`,
							`text`,
						]),
						...!targetPayload.retrieved?{
							sourceID:canvasID,
							link:subset({...linkPayload},[
								`uuid`,
								`position`,
								`size`,
								`canTravel`,
							]),
						}:{},
					},
				})
				set(NEO_note_atom(targetID),{
						...targetPayload,
						initialized:true,
						retrieved:true, // TODO: remove once we have true synchronization
				});
			}

			///////////////////////////////////////////////////////////////////////////////////////////////////////////////
			
			if(__x
				&& targetPayload.retrieved // createNote would've already included link information
				&& Object.keys(linkChanges).length>0
				&&(__x // not a temporary construct // TODO: make this more robust
					&& linkID !== "CANVAS"
					&& linkID !== "POCKET"
				)
			){
				transactions.push({
					literal:!linkPayload.retrieved?`
						mutation createLink( $userID:String, $link:LinkInput!, $sourceID:String, $targetID:String ){
							createLink( userID:$userID, link:$link, sourceID:$sourceID, targetID:$targetID )
						}
					`:`
						mutation editLink( $userID:String, $link:LinkInput! ){
							editLink( userID:$userID, link:$link )
						}
					`,
					variables:{
						userID:userID,
						link:subset({...linkPayload},[
							`uuid`,
							`size`,
							`position`,
							`canTravel`,
						]),
						...!linkPayload.retrieved?{
							sourceID:canvasID,
							targetID:targetID,
						}:{},
					}
				});
				set(NEO_link_atom(linkID),{
					...linkPayload,
					initialized:true,
					retrieved:true, // TODO: remove once we have true synchronization
				});
			}

			///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		}


		if(transactions.length>0){
			set(transaction_queue_atom,(prevQueue)=>[
				...prevQueue, ...transactions
			]);
		}

	},
})
