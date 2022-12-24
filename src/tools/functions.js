import { useState, useEffect, useRef } from "react";
import { __x, __o, defaultNodes, defaultLinks } from './defaults';
import localStorage from "store2";
import { useSession, signIn, signOut, } from "next-auth/react";

///////////////////////////////////////////////////////////////////////////////////////////

export function useInterval(delayInterval, delayedFunction) {
	const preservedFunction = useRef();

	// Remember the latest function.
	useEffect(() => {
		preservedFunction.current = delayedFunction;
	}, [delayedFunction]);

	// Set up the interval.
	useEffect(() => {
		function tick(){
			preservedFunction.current();
		}
		if (delayInterval !== null){
			let id = setInterval(tick, delayInterval);
			return () => clearInterval(id);
		}
	}, [delayInterval]);
}
  
/*
adapted from:
https://overreacted.io/making-setinterval-declarative-with-react-hooks/
*/

///////////////////////////////////////////////////////////////////////////////////////////

export function recolor( hslString, {hue,sat,lum}={} ){
	// passing in quotes sets a value that is explicit instead of relative
	let newHue = typeof hue == 'string' ? hue*1 : hslString.split(",")[0].replace(/\D/g,'')*1+(hue?hue:0);
	let newSat = typeof sat == 'string' ? sat*1 : hslString.split(",")[1].replace(/\D/g,'')*1+(sat?sat:0);
	let newLum = typeof lum == 'string' ? lum*1 : hslString.split(",")[2].replace(/\D/g,'')*1+(lum?lum:0);
	return [
		`hsl(`,
			`${(newHue +360) %360},`, // wrap color wheel
			`${newSat >100? 100:(newSat <0? 0: newSat)}%,`, // cap at 0 and 100
			`${newLum >100? 100:(newLum <0? 0: newLum)}%`, // cap at 0 and 100
		`)`,
	].join("")
}

///////////////////////////////////////////////////////////////////////////////////////////

export function resetApp(){
	const now = new Date
	localStorage("nodes", defaultNodes)
	localStorage("links", defaultLinks)
	localStorage("canvas", "N 0");
	localStorage("lastDownload", now)
	//localStorage("pocket", null);
	console.error("resetting...")
	signOut()
	setTimeout(()=>{
		if (typeof window !== "undefined"){
			window.location.reload()// "true" not wanted by TypeScript
		}
	}, 1000);
}

///////////////////////////////////////////////////////////////////////////////////////////

/*
export function cleanupNodes(){
    // find all nodes which have no links  and delete them from localstorage
}
*/