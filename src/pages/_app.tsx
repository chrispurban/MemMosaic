import "../styles/globals.css";


import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from "recoil";
import { Analytics } from "@vercel/analytics/react";

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps:{ session, ...pageProps },
})=>{
	return(
		<SessionProvider session={session}>
			<RecoilRoot>
				<Component {...pageProps} />
				<Analytics/>
			</RecoilRoot>
		</SessionProvider>
  	);
};

export default MyApp;


////////////////////////////////////////////////////////////////////////

//import { trpc } from "../utils/trpc";

/*
import { ApolloClient, HttpLink, InMemoryCache, ApolloProvider } from "@apollo/client";
function createApolloClient(){
  	return new ApolloClient({
   	link: new HttpLink({ uri: '/api/graphql' }),
   	cache: new InMemoryCache(),
  	});
}
	<ApolloProvider client={createApolloClient()}>
	</ApolloProvider>
*/

//export default trpc.withTRPC(MyApp);