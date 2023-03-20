import { __x, __o } from '../tools/defaults';
import {
	scale_atom,
	view_atom,
} from "./RecoilComponent";
import { useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
	useEffect,
} from 'react';

//import './../App.scss';

////////////////////////////////////////////////////////////////////////////////////////////

export default function Report(){
	console.log("report component rendered")

	const [ view, viewΔ ] = useRecoilState(view_atom);
	const [ scale, scaleΔ ] = useRecoilState(scale_atom);

	//////////////////////////////////////////////////////////////////////////////////////////////

	function getView(){
		const pxGrid = 10
		const pxAbsolute = (
			window.visualViewport?.height || window.innerHeight // window.innerHeight did not include decimals, visualViewport not immediately available
		)
		//console.log("pxAbsolute", pxAbsolute)

		const offset = ((
			pxAbsolute
		)	/ 2 // half screen, from center
		)	/ pxGrid // pixel unit
		
		const pxUnits = Math.floor(
			offset
		)
		//console.log("pxUnits", pxUnits)

		const pxExtra = ((
			offset
		)	% 1 // give back what floor cut off
		)	* pxGrid // push back up to explicit pixels
		//console.log("pxExtra", pxExtra)

		const foundView = {
			...view,
			pxAbsolute,
			pxUnits,
			pxExtra,
		}
		viewΔ(foundView)
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
				/*
				console.clear()
				console.log(`pocketID`,pocketID)
				console.log(`selected`,selectedNodeID)
				console.log(`view`,view)
				console.log(`width`,window.outerWidth)
				*/
			}
		}
		window.addEventListener('keyup', handleKey);
		return ()=>{window.removeEventListener('keyup', handleKey);};
	},[
		/*
		atlas,
		selectedNodeID,
		view,
		pocketID_atom
		*/
	])

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
