import { gql, ApolloServer } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";

let startServer;
let apolloServer;

const typeDefs = gql`
	type Query {
		Note(uuid: String): Note @cypher(statement: """
			MATCH (n{uuid:$uuid})
			RETURN n
		""")
		User(email: String): User @cypher(statement: """
			MATCH (u{email:$email})
			RETURN u
		""")
	}
	type Note @exclude(operations:[CREATE, DELETE]) {
		uuid: String
		color: String
		icon: String
		text: String
		links(uuid: String): [LinkRelationship!]! @cypher(statement: """
			MATCH (n{uuid: $uuid})-[r:Link]-(m)
			RETURN r
		""")
	}
	type LinkRelationship implements Link {
		uuid: String
		positionX: Float
		positionY: Float
		lengthX: Float
		lengthY: Float
		canTravel: Boolean
	 }
	 interface Link{
		uuid: String
		positionX: Float
		positionY: Float
		lengthX: Float
		lengthY: Float
		canTravel: Boolean
	}
	type User{
		uuid: String
		email: String
		current: String
	}
`

/*
		notes: (Note) @cypher(statement: """
			MATCH (n)-[this]-(m)
			RETURN n, m
		""")
*/


const driver = neo4j.driver(
	process.env.NEO4J_URI,
	neo4j.auth.basic(
		process.env.NEO4J_USERNAME,
		process.env.NEO4J_PASSWORD
	)
)

export default async function handler(req, res){
	if(!apolloServer){ // cold start
		const neoSchema = new Neo4jGraphQL({typeDefs, driver});
		const schema = await neoSchema.getSchema();
		apolloServer = new ApolloServer({
			schema,
			playground:true,
			introspection:true,
			plugins:[
				ApolloServerPluginLandingPageGraphQLPlayground
			]
		})
		startServer = apolloServer.start();
	}
	else{
		await startServer;
		await apolloServer.createHandler({
			path:'/api/graphql'
		})(req, res)
	}

}

export const config = {
	api: {
		bodyParser: false
	}
}
