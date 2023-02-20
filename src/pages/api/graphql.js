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
	type Note @exclude(operations:[DELETE]) {
		uuid: String
		color: String
		icon: String
		text: String
		links(uuid: String): [LinkRelationship!]! @cypher(statement: """
			MATCH (n{uuid: $uuid})-[l:Link]-(m)
			RETURN l
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

	type Mutation {
		createUser(email: String!): User @cypher(statement: """
			CREATE (
				n:Note{
					uuid:apoc.create.uuid(),
					color: 'hsl(0,0%,90%)',
					icon: '🧿',
					text: 'Origin',
					origin:true
				}
			)<-[:Begins_At]-(
				u:User{
					email:$email,
					uuid:apoc.create.uuid()
				}
			)-[:Owns]->(n)
			RETURN u
		""")
	}

`
//RETURN u{.*, favorite:n}, n{.*, uuid: n.uuid, color: n.color, icon: n.icon, text: n.text, links: n.links
//RETURN u{.*, origin:n}
//RETURN u, n AS origin
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
