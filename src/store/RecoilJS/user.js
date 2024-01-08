import {
	__x,
	__o,
} from '../../tools/defaults';

import {
	gql,
} from "@apollo/client";

import {
	client,
} from "../index";

import {
	selector,
} from "recoil";

import {
	useSession,
	getSession,
} from "next-auth/react";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// load user account
export const NEO_user_selector = selector({ // associate username with saved content
	key: "NEO_user_selector",
	get: async ({get})=>{
		const userSession = await getSession()
		const email = userSession?.user?.email //console.log("user session obtained", userSession)
		const readResponse = await client.query({ // see if they have a user account yet
			query: gql`
				query($email:String){
					User(email:$email){
						uuid
						origin
						current
						email
						isAdmin
					}
				}
			`,
			variables:{ email } // GraphQL typeDef is set to return the default user if email is blank
		});
		if(readResponse.error){throw readResponse.error;}

		let user

		if(readResponse?.data?.User){ // they do have an account, or are signed out and using the default
			user = readResponse
		}
		else{
			console.log(`Generating new user account for ${email}`)
			const createResponse = await client.mutate({
				mutation: gql`
					mutation createUser($email: String!){
						User: createUser(email: $email){
							uuid
							origin
							current
							email
							isAdmin
						}
					}
				`,
				variables: { email }
			});
			if(createResponse.error){throw createResponse.error;}
			user = createResponse
		}

		return user.data.User
	}
});