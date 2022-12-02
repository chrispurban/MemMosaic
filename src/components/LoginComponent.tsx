import { signIn, signOut, useSession } from "next-auth/react";
import { __x, __o } from '../tools/defaults';
import { trpc } from "../utils/trpc";

import styles from "../pages/index.module.css";

export default function Login(){
	const { data: sessionData } = useSession();
	const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
		undefined, // no input
		{ enabled: sessionData?.user !== undefined },
	);
	const hello = trpc.example.hello.useQuery({ text: "from tRPC" });

	return (
		<div
			style={{
				backgroundColor:`black`,
				display:`flex`,
				gap:`30px`,
			}}
		>
			<button
				onClick={sessionData ? () => signOut() : () => signIn()}
			>
				{
					sessionData ? "Sign out" : "Sign in"
				}
			</button>
			{
				__x
				&& sessionData
				&& <span>Logged in as {sessionData.user?.name}</span>
			}
			{
				__x 
				&& secretMessage
				&& <span> - {secretMessage}</span>
			}
			{hello.data ? hello.data.greeting : "Loading tRPC query..."}
		</div>
	)
}
