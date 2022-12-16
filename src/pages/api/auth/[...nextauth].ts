import NextAuth, { type NextAuthOptions } from "next-auth";
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db/client";

import CredentialsProvider from "next-auth/providers/credentials";

import { Magic } from '@magic-sdk/admin'
const magic = new Magic(env.MAGIC_SECRET_KEY)

export const authOptions: NextAuthOptions = {
	session:{
		strategy: "jwt"
	},
	pages:{
		signIn:'/',
	},
  	adapter: PrismaAdapter(prisma),
  	providers: [
    	CredentialsProvider({
			name:'Magic Link',
			credentials:{
				didToken: {label: 'DID Token', type:'text'}
			},
			async authorize({didToken}:any, req):Promise<any>{
				// validate magic DID token
				magic.token.validate(didToken);

				// fetch user metadata
				const metadata = await magic.users.getMetadataByToken(didToken);

				// return user info
				return {...metadata}
			}
    	})
  	],
};

export default NextAuth(authOptions);
