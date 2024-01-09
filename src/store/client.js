// TODO: split atoms and selectors into their own files, Apollo in its own file

import {
	__x,
	__o,
} from '../tools/defaults';

import {
	ApolloClient,
	HttpLink,
	InMemoryCache,
} from "@apollo/client";

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

export const client = new ApolloClient({
	link: new HttpLink({ uri: '/api/graphql' }),
	cache: new InMemoryCache(),
});