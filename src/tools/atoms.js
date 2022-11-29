//const { atom, selector } = require("recoil")

import { __x, __o } from './defaults';
import {
	atom,
	selector,
	useRecoilState,
	useRecoilValue
} from "recoil";

import mem from 'mem';
import localStorage from "store2";

/////////////////////////////////////////////////////////////////////

export const view_atom = atom({
	key:"view_atom",
	default:{pxAbsolute:0, XpxUnits:0, pxExtra:0},
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
		//console.log(`measured`, changedValues)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const selectedNodeID_atom = atom({
	key:"selectedNodeID_atom",
	default:null,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//console.log(`grabbing`, changedValues)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const scale_atom = atom({
	key:"scale_atom",
	default:{
		unit:40,
	},
	effects:[
		/*
		({onSet})=>{ onSet( (changedValues)=>{
			console.error(`NAVIGATING to canvas for node `, changedValues);
		} ); }
		*/
	],
});

/////////////////////////////////////////////////////////////////////

export const canvasID_atom = atom({
	key:"canvasID_atom",
	default:localStorage("canvas")||'N 0',
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			localStorage("canvas", changedValues);
			//console.clear()
			console.warn(`NAVIGATING to canvas for node ${changedValues}`)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const menuPop_atom = atom({
	key:"menuPop_atom",
	default:null,
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//console.log(`EXAMINING menu for link ${changedValues}`)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const pocketID_atom = atom({
	key:"pocketID_atom",
	default:null, //localStorage("pocket"),
	effects:[
		({onSet})=>{ onSet( (changedValues)=>{
			//localStorage("pocket", changedValues);
			//console.warn(`POCKET link set to node ${changedValues}`)
		} ); }
	],
});

/////////////////////////////////////////////////////////////////////

export const node_atom = mem(
	(nodeID)=>atom({
		key: `node_atom${nodeID}`,
		//default: ()=>{return localStorage("nodes")[nodeID]}, // why was this set as a function?
		default: localStorage("nodes").find(o=>o.id==nodeID),
		effects: [
			({onSet}) => {
				onSet(
					(changedValues) => {
						console.log(`writing new values for node ${nodeID}`, changedValues);
						//console.warn(`existing values for node ${nodeID}` )
						localStorage.transact('nodes', (content)=>{
							let node = content.find((o)=>o.id==nodeID) // correlating the content to the ID
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

						})
					}
				);
			}
		],
	})
)

/////////////////////////////////////////////////////////////////////

export const link_atom = mem(
	(linkID)=>atom({
		key: `link_atom${linkID}`,
		default: localStorage("links").find(o=>o.id==linkID),
		effects: [
			({onSet}) => {
				onSet( // this is only triggered on release, so way fewer pings than what you imagine would be for resize or name change
					(changedValues) => {

						console.log(`writing new values for link ${linkID}`, changedValues);
						localStorage.transact('links', (content)=>{
							let link = content[localStorage('links').findIndex((i)=>i.id==linkID)]
							link.position = changedValues.position // can we just replace it wholesale?
						})

					}
				);
			}
		],
	})
)

/////////////////////////////////////////////////////////////////////

export const linkMaster_selector = mem(
	(linkID)=>selector({
		key: `linkMaster_selector${linkID}`,
		get: ({get}) => {
			const link = {...get(link_atom(linkID))}; // must repackage as the get produces a read-only object
			let originID = get(canvasID_atom);
			let origin = get(node_atom(originID));
			let targetID = link.nodes.find((n)=>n!=originID) || originID // second option prevens core from returning null
			let target = get(node_atom(targetID));
			//delete target.links // deletion doesn't work unless you make the node_atom default a function and add () to the get; probably hits initial null value; doing this conversion then will break trying to call up the current value in nodeΔ((n)=>[...n,{changed:value}])
	
			let isCenter = linkID == "L 0"
			link.nodes = {
				origin: isCenter?target:origin,
				target: isCenter?origin:target,
			}
			link.isCenter = isCenter
	
			return link;
		},
	})
)

/////////////////////////////////////////////////////////////////////

export const atlas_selector = selector({
	key:"atlas_selector",
	get: ({get}) => {
		let canvasID = get(canvasID_atom)
		let canvas = get(node_atom(canvasID))
		let atlas = canvas.links.map((x)=>{
			return get({...linkMaster_selector(x)})
		})
		return atlas
	}
});

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export const baseAtom = atom({
    key:'baseAtom',
    default:'titty blorp',
})

export const baseSelect = selector({
    key:'baseSelect',
    get:({get})=>{
        const base = get(baseAtom)
        return base.length;
    }
})

//export {baseAtom, baseSelect}



