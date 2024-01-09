import {
	__x,
	__o,
} from '../../tools/defaults';

import {
	atomFamily,
} from "recoil";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// core note state, empty until populated by the hydra
export const NEO_note_atom = atomFamily({
	key: 'NEO_note_atom',
	default: uuid => {
		return {
			uuid:				`${uuid}`,
			initialized:	false, // to ignore instantiation
			retrieved:		false, // has not been made real in the database
			queried:			false, // part of a loop check
			
			owner:			``,
			color:			``,
			text:				``,
			icon:				``,
			links:			[],
		}
	},
})