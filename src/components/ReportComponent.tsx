/* eslint-disable react-hooks/exhaustive-deps */

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	useRecoilState,
} from "recoil";

import {
	view_atom,
} from "../store/index";

import {
	useEffect,
} from 'react';

import {
	useDeviceSelectors,
} from 'react-device-detect';

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Report(){

	const [ view, viewΔ ] = useRecoilState(view_atom);
	const [ selectors, deviceData ] = useDeviceSelectors(window.navigator.userAgent)
	
	useEffect(()=>{
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

	///////////////////////////////////////////////////////////////////////////////////////////////////////

	return(
		<>
			{
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
			}
		</>
	)

	///////////////////////////////////////////////////////////////////////////////////////////////////////

}




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
	{
		__o
		&&(
			<div style={{position:`absolute`, top:`50%`, left:`50%`, translate:`-50% -50%`, outline:`1px solid black`, zIndex:40000, maxWidth:`300px`, color:`white`, textAlign:`left`, backgroundColor:`hsla(0, 0%, 20%, 1.0)`}}>
				<pre style={{
					overflowY:`auto`,
					overflowX:`hidden`,
				}}>
					{JSON.stringify(window.matchMedia("(pointer: fine)").matches, null, '\r')}
				</pre>
			</div>
		)
		{JSON.stringify(view.system, null, '\r')}
	}
*/