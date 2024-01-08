import { gql, ApolloServer, InMemoryCache } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";

// TODO: use "owner" property instead of "Owns" relationship
// this aims to reduce clutter in the Neo4j explorer and improve readability of GQL here
// implementation started, but unknown misbehavior upon converting Note query definition
	// short term: making sure the property is at least appended in addition to the relationship
	// hydra complains of the passed object having no LinksOut property, likely just any property
	// hydra selector and Recoil component won't log what's being passed before the error happens

// TODO: use "Current" relationship instead of "current" property
// this aims to prevent assignment of a reference when its target may not exist
// sidesteps the need for secondary checks or retrieval of a backup note

const typeDefs = gql`

	type Query{

		UUIDs:UUIDs! @cypher(statement:"""
			RETURN { linkID:randomUUID(), noteID:randomUUID() } as output
		""")

		Note( noteID:String, userID:String ):Note @cypher(statement:"""
      	MATCH (u:User{uuid:userID})-[:Owns]->(n:Note{uuid:noteID})
      	RETURN n
    	""")

		User( email:String ):User @cypher(statement:"""
			OPTIONAL MATCH ( u:User {email:$email} )
			WITH u
			WHERE u IS NOT NULL
			RETURN u AS User
			UNION
			MATCH (d:Default:User)
			WHERE $email IS NULL
			RETURN d AS User
		""")

	}


	type UUIDs{
		linkID:String
		noteID:String
	}
	

	type Note{
		uuid:String
		color:String
		icon:String
		text:String
		owner:String
		linksOut:[LinkOutbound!]! @cypher(statement:"""
			MATCH (this)-[l:Link]->()
			RETURN l
		""")
		linksIn:[LinkInbound!]! @cypher(statement:"""
			MATCH (this)<-[l:Link]-()
			RETURN l
		""")
	}


	type LinkOutbound implements Link{
		uuid:String
		position:Position
		size:Size
		canTravel:Boolean
		destination:Note @cypher(statement:"""
			MATCH (source)-[this]->(d)
			RETURN d
		""")
	}

	type LinkInbound implements Link{
		uuid:String
		position:Position
		size:Size
		canTravel:Boolean
		destination:Note @cypher(statement:"""
			MATCH (source)<-[this]-(d)
			RETURN d
		""")
	}


	interface Link{
		uuid:String
		position:Position
		size:Size
		canTravel:Boolean
		destination:Note
	}


	type Position{
		x:Float!
		y:Float!
	}


	type Size{
		x:Float!
		y:Float!
	}


	type User{
		uuid:String
		origin:String
		email:String
		current:String
		isAdmin:Boolean
	}


	type Mutation{

		createUser( userID:String! ):User @cypher(statement:"""
			CREATE (
				n:Note{
					uuid:randomUUID(),
					color:'hsl(0,0%,90%)',
					icon:'🧿',
					text:'Origin',
					origin:true,
					owner:$userID
				}
			)
			WITH n
			CREATE (
				u:User{
					email:$userID,
					uuid:randomUUID(),
					current:n.uuid,
					origin:n.uuid
				}
			)-[:Owns]->(n)
			RETURN u
		""")

		createNote( userID:String, sourceID:String, link:LinkInput!, note:NoteInput! ):Boolean @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->(s:Note{uuid:sourceID})
			CREATE (s)-[l:Link{
				uuid:$link.uuid,
				canTravel:$link.canTravel,
				position:point({
					x:$link.position.x,
					y:$link.position.y
				}),
				size:point({
					x:$link.size.x,
					y:$link.size.y
				})
			}]->(t:Note{
				uuid:$note.uuid,
				color:'' + $note.color,
				icon:$note.icon,
				text:$note.text,
				owner:$userID
			})<-[:Owns]-(u)

		""")

		createLink( userID:String, sourceID:String, link:LinkInput!, targetID:String ):Boolean @cypher(statement:"""
			MATCH (s:Note{uuid:sourceID})<-[:Owns]-(u:User{email:userID})-[:Owns]->(t:Note{uuid:targetID})
			CREATE (s)-[:Link{
				uuid:$link.uuid,
				canTravel:$link.canTravel,
				position:point({
					x:$link.position.x,
					y:$link.position.y
				}),
				size:point({
					x:$link.size.x,
					y:$link.size.y
				})
			}]->(t)
		""")



		editNote( userID:String, note:NoteInput! ):Boolean @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->(n:Note{uuid:$note.uuid})
			SET n += {
				color:coalesce( $note.color, n.color ),
				icon:coalesce( $note.icon, n.icon ),
				text:coalesce( $note.text, n.text )
			}
		""")

		editLink( userID:String, link:LinkInput! ):Boolean @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->()-[l:Link{uuid:$link.uuid}]->()
			SET l += {
				position:point({ x:coalesce( $link.position.x, l.position.x ), y:coalesce( $link.position.y, l.position.y ) }),
				size:point({ x:coalesce( $link.size.x, l.size.x ), y:coalesce( $link.size.y, l.size.y ) }),
				canTravel:coalesce( $link.canTravel, l.canTravel )
			}
		""")
 


		deleteLink( userID:String, noteID:String, linkID:String ):Boolean @cypher(statement: """
			MATCH (u:User{email:userID})-[:Owns]->(n:Note{uuid:noteID})-[l:Link{uuid:linkID}]-()
			DETACH DELETE l
			WITH n, ((n)-[:Link]-() OR n.uuid = u.origin OR n.uuid = u.current) AS stillConnected
			WHERE NOT stillConnected
			DETACH DELETE n
			RETURN stillConnected
		""")


		
		setCurrent( userID:String, noteID:String ):Boolean @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->(n:Note{uuid:noteID})
			SET u.current = n.uuid
		""")
	}


	input NoteInput{
		uuid:String
		color:String
		icon:String
		text:String
	}

	input LinkInput{
		uuid:String
		size:ReSize
		position:RePosition
		canTravel:Boolean
	}

	input RePosition{
		x:Float!
		y:Float!
	}

	input ReSize{
		x:Float!
		y:Float!
	}

`

// GQL appears not to like Position as interchangeable between use in a LinkInput input and Link interface, like it does with String which is treated differently as a scalar
// defining Position as a scalar seems to also require a custom resolver which you're not interested in right now

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

		type Note @exclude(operations:[DELETE])
*/
// links did not behave when the query did not care about direction
// possibly two problems with this at both the level of links query and destination query
// queryside union produced nothing


/*
	
		deleteNote( noteID:String, userID:String ):Note @cypher(statement:"""
			MATCH (u:User{email:userID})-[:Owns]->(n:Note{uuid:noteID})
			DETACH DELETE n
		""")
*/
// extra function not needed right now because deleteLink can identify orphans