import { useSession, signIn, signOut, } from "next-auth/react";
import { __x, __o, } from '../tools/defaults';
import { useEffect, useState, useRef } from "react";
import { useInterval, recolor, } from '../tools/functions';
import { useRecoilState } from 'recoil';
import {
	canvasID_atom,
	node_atom,
} from "../tools/atoms";

import styles from "../pages/index.module.css";

import { Magic } from "magic-sdk";
// magic-sdk is only availabile in the browser
const magic = typeof window !== 'undefined' && new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'a');

export default function Login(){
	const {data: sessionData} = useSession(); // returned object's .data property is assigned and renamed to sessionData
	//console.log(`look at my cool OC`,sessionData)

	const [ canvasID, canvasIDΔ ] = useRecoilState(canvasID_atom)
	const [ node, nodeΔ ] = useRecoilState(node_atom(canvasID))
	const [ formEmail, formEmailΔ ] = useState("");

	const buttonRef = useRef<HTMLButtonElement>(null);
	const textRef = useRef<HTMLTextAreaElement>(null);



	useEffect(()=>{ if(!sessionData){const ref = textRef.current; if(ref != null){ref.focus()}} },[])
	

	async function handleSignIn(){
		if(!sessionData){
			console.log(`attempting to log in with ${formEmail}`)
			if(magic){
				try {
					const didToken = await magic.auth.loginWithMagicLink({ email:formEmail });
						// log in with Magic
					await signIn('credentials',{
						// log in with NextAuth
						didToken,
						redirect: false
					})	
					console.error(`login with ${formEmail} successful`)
				}
				catch (x){
					console.error(`login with ${formEmail} failed`)
					// is there a way to hit ESC on failure?
				}
			}
		}
		else{
			signOut()
			// prevent refresh
		}

	}
	
	return(
		<div
			style={{
				display:`flex`,
				flexDirection:`column`,
			}}
		>
			{
				__x
				&& sessionData
				&& <div
					style={{
						backgroundColor:`${recolor(node.color, {hue:0,sat:0,lum:5})}`,
						height:`60px`,
						padding:`10px`,
						textAlign:`center`,
						lineHeight:`120%`,
					}}
				>
					Logged in from {sessionData.user?.email}
				</div>
			}
			<form
				onSubmit={(e)=>{
					handleSignIn()
					e.preventDefault()
				}}
			>
				{
					__x
					&& !sessionData
					&& <textarea
					ref={textRef}
					style={{
						height:`60px`,
						width:`240px`,
						fontSize:`120%`,
						padding:`10px`,
						textAlign:`center`,
						resize:`none`,
						overflow:`hidden`,
					}}
					onKeyDown={(e)=>{
						if(
							__x
							&& e.key == "Enter"
							//&& !e.shiftKey
						){
							e.preventDefault(); 
							const ref = buttonRef.current; if(ref != null){ref.click()}
							return true
						}
					}}
					placeholder="email address"
					value={formEmail}
					onChange={(e) => formEmailΔ(e.target.value)}
				/>
				}

				<button
					ref={buttonRef}
					type="submit"
					style={{
						height:`40px`,
						width:`240px`,
						fontSize:`120%`,
						marginTop:`10px`,
					}}
				>
					{
						sessionData? "Sign out": "Sign in"
					}
				</button>
			</form>
		</div>
	)

}