import { useRouter } from "next/router"
import { signIn } from "next-auth/react"
import { Magic } from "magic-sdk"
import { useForm } from 'react-hook-form';

import Router from 'next/router'

// magic-sdk is only availabile in the browser
const magic = typeof window !== 'undefined' && new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'a');


export default function SignIn(){
	const router = useRouter();
	const { register, handleSubmit } = useForm();

	const onSubmit = async ({ email }:any) => {
		if (!magic) throw new Error(`magic not defined`);
  
		// login with Magic
		const didToken = await magic.auth.loginWithMagicLink({ email });
  
		// sign in with NextAuth
		await signIn('credentials', {
		  didToken,
		  callbackUrl: router.query['callbackUrl'] as string,
		});

		Router.push('/')
	 };

	return(
		<form onSubmit={handleSubmit(onSubmit)}>
			<input {...register('email', { required: true })} placeholder="nick@example.com" />
			<button type="submit">Sign in</button>
		</form>
	)

}