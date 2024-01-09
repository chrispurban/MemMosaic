import {
	__x,
	__o,
} from '../../tools/defaults';

import {
	atom,
} from "recoil";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// general user interface
export const view_atom = atom({
	key:"view_atom",
	default:{
		grid:10,
		unit:40,
		frame:60,
		height:{
			absolute:0,
			divided:0,
			remainder:0,
		},
		// system:{} // excluded because of a check on Spine for it
	},
});