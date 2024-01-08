/* eslint-disable react-hooks/exhaustive-deps */

import { __x, __o 									} from '../../../tools/defaults';

import {
			atom,
			selector,
															} from "recoil";

import { gql											} from "@apollo/client";
import { client										} from "../../index";
import { NEO_user_selector							} from "../../index";

/////////////////////////////////////////////////////////////////////////////////////////////////////
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
	effects: [
		({ onSet, getPromise }) => {
			onSet((newCanvasID) => {
				console.warn(`NAVIGATING to canvas for note ${newCanvasID}`);
				getPromise(NEO_user_selector)
					.then((user) => {
						return client.mutate({ // TODO: change "current" to a relationship
							mutation: gql`
								mutation setCurrent( $userID:String, $noteID:String ){
									setCurrent( userID:$userID, noteID:$noteID )
								}
							`,
							variables: { noteID:newCanvasID, userID:user.email },
						});
					})
					.catch((error) => { console.log("could not register refresh location with profile", error)});
			});
		},
	]
});