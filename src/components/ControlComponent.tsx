/* eslint-disable react-hooks/exhaustive-deps */

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	selectedID_atom,
	NEO_canvasID_atom,
	NEO_pocketID_atom,
} from "../store/index";

import {
	useRecoilState,
	useRecoilValue,
} from "recoil";

import {
	useEffect,
} from 'react';

import {
	useDeviceSelectors,
} from 'react-device-detect';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Control(){ // master navigation shortcuts
	
	const [ canvasID, canvasIDΔ ] = useRecoilState(NEO_canvasID_atom);
	const [ pocketID, pocketIDΔ ] = useRecoilState(NEO_pocketID_atom);
	const selectedGlobalID = useRecoilValue(selectedID_atom)

	useEffect(()=>{
		const handleKey = (e:any)=>{
			if(pocketID && !selectedGlobalID){
				if(e.key == "End"){
					const swapID = canvasID
					canvasIDΔ(pocketID)
					pocketIDΔ(swapID)
				}
				else if(e.key == "Escape" || e.key == "Delete"){
					pocketIDΔ("")
				}
			}
		};				window	.addEventListener('keyup', handleKey);
		return ()=>{window.removeEventListener('keyup', handleKey);};
	},[
		pocketID,
		canvasID,
		selectedGlobalID,
	])

	return null

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
		useEffect(()=>{
			const handleKey = (e:any)=>{
				if(e.key == "Home"){
					console.clear()
				}
			}
			window.addEventListener('keyup', handleKey);
			return ()=>{window.removeEventListener('keyup', handleKey);};
		},[
		])
	*/

	/*
		const panopticon = useRecoilSnapshot()
		useEffect(()=>{const hk=(e:any)=>{if(e.key=="End"){
			for (const node of panopticon.getNodes_UNSTABLE({isModified: true})) {
				console.warn(node.key, panopticon.getLoadable(node));
			}
		}};window.addEventListener('keyup',hk);return()=>{window.removeEventListener('keyup',hk);};},[
			panopticon
		])
	*/
