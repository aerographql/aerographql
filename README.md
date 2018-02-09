[![Build Status](https://travis-ci.org/aerographql/aerographql.svg?branch=master)](https://travis-ci.org/aerographql/aerographql)
[![Coverage Status](https://coveralls.io/repos/github/aerographql/aerographql/badge.svg?branch=master)](https://coveralls.io/github/aerographql/aerographql?branch=master)
[![npm version](https://badge.fury.io/js/aerographql.svg)](https://badge.fury.io/js/aerographql)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


<p align="center">
  <img src="https://aerographql.github.io/documentation/images/logo-full.png">
</p>

**[AeroGraphQL](https://aerographql.github.io/documentation/)** is a small and opinionated [Typescript](https://www.typescriptlang.org/index.html) toolkit to create [GraphQL](http://graphql.org/learn/) server using a declarative approach.

# Overview 

## Install AeroGraphQL

`yarn add aerographql`

> Note that *graphql* is a needed peer dependency, you must install it beforehand

## Define your schema

```typescript
@ObjectDefinition( { name: 'User' } )
export class User {
    @Field( { type: 'ID' } ) id: string;
    @Field( ) name: String;
    @Field( { nullable: true }) description: String;
}

@ObjectImplementation( { name: 'RootQuery' } )
export class RootQuery {
    constructor( private userService: UserService ) { }

    @Resolver( { type: User } )
    user( @Arg() name: string ): User | Promise<User> {
        return this.userService.find( name );
    }
}

@Schema( {
    rootQuery: 'RootQuery',
    components: [ RootQuery ]
} )
export class MySchema extends BaseSchema {
}
```

## Inject the schema within a GraphQL server

[Apollo Server](https://www.apollographql.com/docs/apollo-server/) with [Express](http://expressjs.com/fr/) in this case:

```typescript
let mySchema = new MySchema();
this.app = express();
this.app.use( '/graphql', bodyParser.json(), graphqlExpress( { schema: mySchema.graphQLSchema } );
this.app.listen( config.get( 'server.port' ), () => {
    console.log( 'Up and running !' );
} );
```

# Documentation

Checkout the **[AeroGraphQL documentation](https://aerographql.github.io/documentation/)** and explore **[basic examples](https://github.com/aerographql/examples)**.

# License
AeroGraphQL is freely distributable under the terms of the MIT license.
