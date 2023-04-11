import { __x, __o } from '../tools/defaults';

import { view_atom, } from "./RecoilComponent";
import { useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";

import { useEffect, useState } from 'react';
import { useDeviceSelectors } from 'react-device-detect';

////////////////////////////////////////////////////////////////////////////////////////////

export default function Report(){
	//console.log("report component rendered")

	const [ view, viewΔ ] = useRecoilState(view_atom);
	const [ selectors, deviceData ] = useDeviceSelectors(window.navigator.userAgent)

	
	useEffect(()=>{
	//	console.log(selectors)
		viewΔ((v:any)=>{return{
			...v,
			system:{
				...selectors,
				isMac:(selectors.isIOS || selectors.isIOS13 || selectors.isMacOs),
				isWin:(selectors.isWindows || selectors.isWinPhone),
				isTouch:(selectors.isMobile || selectors.isTablet),
			}
		}})
	},[]);
	

	//////////////////////////////////////////////////////////////////////////////////////////////

	function getView(){

		// visualViewport appears to be the only measure which is a true float, but is affected by the mobile keyboard appearing
		// idea was to still use that but only update when another non-sensitive measure changed, though this hasn't been found yet
		// if(oldDimensions.height != window.innerHeight){ oldDimensions.height = window.innerHeight

			const absolute = (
				window.visualViewport?.height || // visualViewport is not immediately available upon render
				window.innerHeight
			)
	
			const offset = (
				((
					absolute
				)	/ 2 // half screen, from center
				)	/ view.grid // pixel unit
			)
			
			const divided = (
				Math.floor(
					offset
				)
			)
	
			const remainder = (
				((
					offset
				)	% 1 // give back what floor cut off
				)	* view.grid // push back up to explicit pixels
			)

			viewΔ((v:any)=>{return{
				...v,
				height:{
					...v.height,
					absolute,
					divided,
					remainder,
				}
			}})

	}
	
	useEffect(()=>{
		getView()
		window.addEventListener("resize", getView);
		return () => window.removeEventListener("resize", getView);
	},[]);

 	 //////////////////////////////////////////////////////////////////////////////////////////////

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

  //////////////////////////////////////////////////////////////////////////////////////////////

	return(
		<>{
			/*
			<div style={{
				position:`absolute`,
				zIndex:5000,
				backgroundColor:`green`,
				left:'0', top:'0',
				width:'200px', height:`${view.absolute-10}px`,
			}}>

			</div>
			*/
		}</>
	)
}