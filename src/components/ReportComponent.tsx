import { __x, __o } from '../tools/defaults';
import {
	scale_atom,
	view_atom,
} from "./RecoilComponent";
import { useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
	useEffect,
} from 'react';

////////////////////////////////////////////////////////////////////////////////////////////

export default function Report(){
	//console.log("report component rendered")

	const [ view, viewΔ ] = useRecoilState(view_atom);
	const [ scale, scaleΔ ] = useRecoilState(scale_atom);

	//////////////////////////////////////////////////////////////////////////////////////////////

	function getView(){

		// visualViewport appears to be the only measure which is a true float, but is affected by the mobile keyboard appearing
		// idea was to still use that but only update when another non-sensitive measure changed, though this hasn't been found yet
		// if(oldDimensions.height != window.innerHeight){ oldDimensions.height = window.innerHeight

			const pxGrid = 10

			const pxAbsolute = (
				//window.visualViewport?.height || // visualViewport is not immediately available upon render
				window.innerHeight
			)
	
			const offset = (
				((
					pxAbsolute
				)	/ 2 // half screen, from center
				)	/ pxGrid // pixel unit
			)
			
			const pxUnits = (
				Math.floor(
					offset
				)
			)
	
			const pxExtra = (
				((
					offset
				)	% 1 // give back what floor cut off
				)	* pxGrid // push back up to explicit pixels
			)

			const updatedView = {
				...view,
				pxAbsolute,
				pxUnits,
				pxExtra,
			}
			viewΔ(updatedView)

	}
	useEffect(()=>{getView()},[]);
	useEffect(()=>{
		window.addEventListener("resize", getView);
		return () => window.removeEventListener("resize", getView);
	});

 	 //////////////////////////////////////////////////////////////////////////////////////////////

	/*
	useEffect(()=>{
		const handleWheel = (event)=>{
			//console.log(event)
			scaleΔ(
				(s)=>{
					let scrollRate = 20
					console.log(Math.round(event.deltaY/scrollRate))
					return {...s,
						unit:s.unit-Math.round(event.deltaY/scrollRate)
					}
				}
			)
		}
		window.addEventListener('wheel', handleWheel);
		return ()=>{
			window.removeEventListener('wheel', handleWheel);
		}
	},[scale])
	*/

	useEffect(()=>{
		const handleKey = (e:any)=>{
			if(e.key == "Home"){
				console.clear()
			}
		}
		window.addEventListener('keyup', handleKey);
		return ()=>{window.removeEventListener('keyup', handleKey);};
	},[
		/*
		*/
	])

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
				width:'200px', height:`${view.pxAbsolute-10}px`,
			}}>

			</div>
			*/
		}</>
	)
}
