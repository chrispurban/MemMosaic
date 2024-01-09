import {
	__x,
	__o,
} from '../../tools/defaults';

import {
	atomFamily,
} from "recoil";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// core link state, empty until populated by the hydra
export const NEO_link_atom = atomFamily({
	key: 'NEO_link_atom',
	default: uuid => {
	 	return {
			uuid:				`${uuid}`,
			initialized:	false,
			retrieved:		false,
			queried:			false,

			position:{
				x:				0,
				y:				0,
			},
			size:{
				x:				0,
				y:				0,
			},
			notes:			[],
			canTravel:		false,
			inHeader:		false,
			inPocket:		false,
		}
	},
});