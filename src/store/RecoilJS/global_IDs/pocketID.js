import {
	__x,
	__o,
} from '../../../tools/defaults';

import {
	atom,
} from "recoil";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export const NEO_pocketID_atom = atom({
	key:"NEO_pocketID_atom",
	default:"",
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//if(changedValues){console.warn(`POCKET link set to note ${changedValues}`)}
		} ); }
	],
});