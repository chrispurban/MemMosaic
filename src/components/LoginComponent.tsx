import { useSession, signIn, signOut, } from "next-auth/react";
import { __x, __o, } from '../tools/defaults';
import { useEffect, useState, useRef } from "react";

import { Magic } from "magic-sdk";
// magic-sdk is only availabile in the browser
const magic = typeof window !== 'undefined' && new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'a');

export default function Login(){
	//console.log("login component rendered")
	const {data: sessionData} = useSession(); // returned object's .data property is assigned and renamed to sessionData

	const [ formEmail, formEmailΔ ] = useState("");

	const buttonRef = useRef<HTMLButtonElement>(null);
	const textRef = useRef<HTMLTextAreaElement>(null);

	const styleBox:React.CSSProperties = {
		padding:`10px`,
		background:`white`,
		fontSize:`120%`,
		lineHeight:`120%`,
		width:`240px`,
		textAlign:`center`,
	}

	useEffect(()=>{ if(!sessionData){const ref = textRef.current; if(ref != null){ref.focus()}} },[])

	async function handleSignIn(){
		if(!sessionData){
			console.log(`attempting to log in with ${formEmail}`)
			if(magic){
				try{
					const didToken = await magic.auth.loginWithMagicLink({ email:formEmail }); // log in with Magic
					await signIn('credentials',{ // log in with NextAuth
						didToken,
						redirect: false
					})	
					if(typeof window !== "undefined"){
						window.location.reload() // force reload to clear away default data
					}

				}
				catch(x){console.error(`login with ${formEmail} failed`)} // is there a way to hit ESC on failure?
			}
		}
		else{signOut()}
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
						...styleBox,
					}}
				>
					Logged in from {sessionData.user?.email}
				</div>
			}
			<form
				onSubmit={(e)=>{
					handleSignIn()
					e.preventDefault() // stop refresh so that the popup can appear
				}}
			>
				{
					__x
					&& !sessionData
					&& <textarea
					ref={textRef}
					style={{
						...styleBox,
						height:`60px`,
						resize:`none`,
						overflow:`hidden`,
						outline:`2px solid black`,
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