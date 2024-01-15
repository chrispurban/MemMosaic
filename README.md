# MemMosaic

Freeform notes inspired by the "memory palace" concept: navigate and rearrange topics as you would rooms and furniture, relying on position and color rather than the tangled lines of traditional mind maps.

https://mem-mosaic-chrispurban.vercel.app/

Most action and annotation is contained within src/components/NoteComponent.tsx. Each instance is generated within CanvasComponent, and is what changes when a traversable note is clicked.

State logic is contained within store/RecoilJS. The store/RecoilJS/hydra.js selector is responsible for progressively loading new sets of notes, doing the most processing of the read query. Writes happen through store/RecoilJS/editors/server_transaction.js, adding them to a queue to be enacted via src/components/RecoilComponent.js.

Recoil has built-in features for interacting with GraphQL to where this queue would not be required, but implementation details differ from the specific GraphQL library provided by Neo4j which also constructs resolvers automatically. It won't be fully known which direction to take until rollout of feature phase 2 allowing notes to be clustered, adding a new layer beyond canvas >> link >> note.

## Technologies

- React
- Recoil
- GraphQL
- Neo4j
- Next
- Vercel
- Magic Link

Additional packages were included as part of setup with the "[T3 Stack](https://create.t3.gg/)", but are on hold because of library conflicts that haven't been understood or reconciled yet. They are:

- NextAuth
- Prisma
- tRPC

## About the Author

https://www.chrispurban.com/

