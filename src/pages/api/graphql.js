import { gql, ApolloServer, InMemoryCache } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";

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


			type Note @exclude(operations:[DELETE]) {
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
		UUIDs: UUIDs! @cypher(statement: """
			RETURN {linkID: randomUUID(), noteID: randomUUID()} as output
		""")
	}
	type UUIDs {
		linkID: String
		noteID: String
	}

	type Note {
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
		position: Position
		length: Length
		canTravel: Boolean
		destination: Note @cypher(statement: """
			MATCH (source)-[this]->(d)
			RETURN d
		""")
	}
	type LinkInbound implements Link {
		uuid: String
		position: Position
		length: Length
		canTravel: Boolean
		destination: Note @cypher(statement: """
			MATCH (source)<-[this]-(d)
			RETURN d
		""")
	}
	interface Link {
		uuid: String
		position: Position
		length: Length
		canTravel: Boolean
		destination: Note
	}

	type Position {
		x: Float!
		y: Float!
	}
	type Length {
		x: Int!
		y: Int!
	}
	type User {
		uuid: String
		origin: String
		email: String
		current: String
	}

	type Mutation {
		createUser(email: String!): User @cypher(statement: """
			CREATE (
				n:Note{
					uuid:randomUUID(),
					color: 'hsl(0,0%,90%)',
					icon: '🧿',
					text: 'Origin',
					origin:true
				}
			)<-[:Begins_At]-(
				u:User{
					email:$email,
					uuid:randomUUID()
				}
			)-[:Owns]->(n)
			SET u.current = n.uuid
			RETURN u
		""")

		editLink(uuid: String, data: LinkInput!, userID: String): ReLink @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->()<-[l:Link{uuid: $uuid}]-()
			SET l += {
				position: point({x: coalesce($data.position.x, l.position.x), y: coalesce($data.position.y, l.position.y)}),
  				length: point({x: coalesce($data.length.x, l.length.x), y: coalesce($data.length.y, l.length.y)}),
  				canTravel: coalesce($data.canTravel, l.canTravel)
			}
			RETURN l
		""")

		createLink(sourceID:String, data:LinkInput!, targetID:String, userID:String): Boolean @cypher(statement:"""
			MATCH (s:Note{uuid:sourceID})<-[:Owns]-(u:User{email:userID})-[:Owns]->(t:Note{uuid:targetID})
			CREATE (s)-[:Link{
				uuid:$data.uuid,
				canTravel:$data.canTravel,
				position:point({
					x:$data.position.x,
					y:$data.position.y
				}),
				length:point({
					x:$data.length.x,
					y:$data.length.y
				})
			}]->(t)
		""")

		editNote(uuid: String, data: NoteInput!, userID: String): ReNote @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->(n:Note{uuid: $uuid})
			SET n += {
				color: coalesce($data.color, n.color),
				icon: coalesce($data.icon, n.icon),
				text: coalesce($data.text, n.text)
			}
			RETURN n
		""")

		createNote(note:NoteInput!, link:LinkInput!, user:String, canvasID:String): ReNote @cypher(statement:"""
			MATCH (u:User{email:user})-[:Owns]->(c:Note{uuid:canvasID})
			CREATE (u)-[:Owns]->(n:Note{
				uuid:$note.uuid,
				color:'' + $note.color,
				icon:$note.icon,
				text:$note.text
			})<-[l:Link{
				uuid:$link.uuid,
				canTravel:$link.canTravel,
				position:point({
					x:$link.position.x,
					y:$link.position.y
				}),
				length:point({
					x:$link.length.x,
					y:$link.length.y
				})
			}]-(c)
			RETURN n
		""")

		deleteNote(noteID:String, userID:String): Note @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->(n:Note{uuid:noteID})
			DETACH DELETE n
		""")

		deleteLink(linkID: String, noteID: String, userID: String): Boolean @cypher(statement: """
			MATCH (u:User {email: $userID})-[:Owns]->(n:Note{uuid: $noteID})-[l:Link {uuid: $linkID}]-()
			DETACH DELETE l
			WITH n, ((n)-[:Link]-() OR u.origin = n.uuid) AS stillConnected
			WHERE NOT stillConnected
			DETACH DELETE n
			RETURN stillConnected
		""")
	}

	type ReNote {
		uuid: String
		color: String
		icon: String
		text: String
	}
	input NoteInput {
		uuid: String
		color: String
		icon: String
		text: String
	}

	type ReLink {
		uuid: String
		position: Position
		length: Length
		canTravel: Boolean
	}
	input LinkInput {
		uuid: String
		position: RePosition
		length: ReLength
		canTravel: Boolean
	}
	input RePosition {
		x: Float!
		y: Float!
	}
	input ReLength {
		x: Int!
		y: Int!
	}
`

const driver = neo4j.driver(
	process.env.NEO4J_URI,
	neo4j.auth.basic(
		process.env.NEO4J_USERNAME,
		process.env.NEO4J_PASSWORD
	)
)

let apolloServer;
let startServer;

export default async function handler(req, res){
	console.log("Apollo handler has begun")
	if(!apolloServer){ // cold start
		//console.log("Apollo cold start")
		const neoSchema = new Neo4jGraphQL({typeDefs, driver});
		const schema = await neoSchema.getSchema();
		//console.log("Apollo acquired schema")
		apolloServer = new ApolloServer({
			schema,
			playground:true,
			introspection:true,
			plugins:[
				ApolloServerPluginLandingPageGraphQLPlayground
			],
			cache:'bounded',
			//cache: new InMemoryCache()
		})
		startServer = apolloServer.start();
	}
//	else{
	//console.log("Apollo warm start")
	await startServer;
	//console.log("Apollo started")
	await apolloServer.createHandler({
		path:'/api/graphql'
	})(req, res)
	//console.log("Apollo set up API path")
//	}

}

export const config = {
	api: {
		bodyParser: false
	}
}
