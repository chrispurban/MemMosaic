import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from "recoil";

import "../styles/globals.css";

import { trpc } from "../utils/trpc";


import { ApolloClient, HttpLink, InMemoryCache, ApolloProvider } from "@apollo/client";
function createApolloClient(){
  	return new ApolloClient({
   	link: new HttpLink({ uri: '/api/graphql' }),
   	cache: new InMemoryCache(),
  	});
}


const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps:{ session, ...pageProps },
})=>{
	return(
   	<ApolloProvider client={createApolloClient()}>
      	<SessionProvider session={session}>
        		<RecoilRoot>
         		<Component {...pageProps} />
        		</RecoilRoot>
      	</SessionProvider>
    	</ApolloProvider>
  	);
};

//export default trpc.withTRPC(MyApp);
export default MyApp;