import { gql, ApolloServer, InMemoryCache } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";

let startServer;
let apolloServer;

// need to make sure we're getting things which are owned by the user

/*
		User(email: String): User @cypher(statement: """
			MATCH (u{email:$email})
			RETURN u
		""")
*/

/*
		destination: Note @cypher(statement: """
			MATCH (source)-[this]-(d)
			RETURN d
		""")

		destination: Note @cypher(statement: """
			MATCH (source)-[this]->(d:Note)
			RETURN d
			UNION
			MATCH (d:Note)-[this]->(source)
			RETURN d
		""")
*/

// links did not behave when the query did not care about direction
// possibly two problems with this at both the level of links query and destination query
// queryside union produced nothing

const typeDefs = gql`

	type Query {
		Note(noteID: String, userID: String): Note @cypher(statement: """
      	MATCH (u:User{uuid:$userID})-[:Owns]->(n:Note{uuid:$noteID})
      	RETURN n
    	""")
		User(email: String): User @cypher(statement: """
			OPTIONAL MATCH (u:User {email: $email})
			WITH u
			WHERE u IS NOT NULL
			RETURN u AS User
			UNION
			MATCH (d:Default:User)
			WHERE $email IS NULL
			RETURN d AS User
		""")
	}
	type Note @exclude(operations:[DELETE]) {
		uuid: String
		color: String
		icon: String
		text: String
		linksOut: [LinkOutbound!]! @cypher(statement: """
			MATCH (this)-[l:Link]->()
			RETURN l
		""")
		linksIn: [LinkInbound!]! @cypher(statement: """
			MATCH (this)<-[l:Link]-()
			RETURN l
		""")
	}

	type LinkOutbound implements Link {
		uuid: String
		positionX: Float
		positionY: Float
		lengthX: Float
		lengthY: Float
		canTravel: Boolean
		destination: Note @cypher(statement: """
			MATCH (source)-[this]->(d)
			RETURN d
		""")
	}
	type LinkInbound implements Link {
		uuid: String
		positionX: Float
		positionY: Float
		lengthX: Float
		lengthY: Float
		canTravel: Boolean
		destination: Note @cypher(statement: """
			MATCH (source)<-[this]-(d)
			RETURN d
		""")
	}
	interface Link {
		uuid: String
		positionX: Float
		positionY: Float
		lengthX: Float
		lengthY: Float
		canTravel: Boolean
		destination: Note
	}
	type User {
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
			SET u.current = n.uuid
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
			],
			//cache: new InMemoryCache()
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
