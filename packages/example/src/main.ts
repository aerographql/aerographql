import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Field, ObjectDefinition, ObjectImplementation, Resolver, Arg, Schema, BaseSchema } from 'aerographql-schema';

/** 
 * Fake Database objects
*/
let users: User[] = [
    { admin: false, age: 25, description: 'Description of Bob', name: 'Bob', id: '0' },
    { admin: true, age: 36, description: 'Description of Alice', name: 'Alice', id: '1' },
    { admin: false, age: 28, description: 'Decription of Steeve', name: 'Steeve', id: '3' }
];

let todos: { [ key: string ]: Todo[] } =
    {
        Bob: [
            { id: '0', title: 'Todo1', content: 'Bob Todo1 content' },
            { id: '1', title: 'Todo2', content: 'Bob Todo2 content' },
            { id: '2', title: 'Todo3', content: 'Bob Todo3 content' }
        ],
        Alice: [
            { id: '3', title: 'Todo1', content: 'Alice Todo1 content' },
            { id: '4', title: 'Todo2', content: 'Alice Todo2 content' },
            { id: '5', title: 'Todo3', content: 'Alice Todo3 content' } ],
        Steeve: [
            { id: '6', title: 'Todo1', content: 'Steeve Todo1 content' },
            { id: '7', title: 'Todo2', content: 'Steeve Todo2 content' },
            { id: '8', title: 'Todo3', content: 'Steeve Todo3 content' } ]
    };

/** 
 * Schema definitions
*/
@ObjectDefinition( {
    name: 'User'
} )
export class User {
    @Field( { type: 'ID' } ) id: string;
    @Field() name: string = "";
    @Field() description: string = "Empty description";
    @Field() age: number = 0;
    @Field() admin: boolean = false;
}

@ObjectDefinition( {
    name: 'Todo'
} )
export class Todo {
    @Field( { type: 'ID' } ) id: string;
    @Field() title: string = "";
    @Field() content: string = "Empty todo";
}

@ObjectImplementation( {
    name: 'User'
} )
export class UserImpl {

    @Resolver( { type: Todo, list: true} )
    todos( user: User, @Arg( { nullable: true } ) search: string ) {
        return todos[user.name];
    }
}

@ObjectImplementation( {
    name: 'RootQuery'
} )
export class RootQuery {

    @Resolver( { type: User } )
    user( @Arg() name: string ): User | Promise<User> {
        return users.find( u => u.name === name );
    }
}

@Schema( {
    rootQuery: 'RootQuery',
    components: [ RootQuery, User, UserImpl, Todo ]
} )
export class MySchema extends BaseSchema {
}

/** 
 * Actual server code 
*/
let mySchema = new MySchema();
this.app = express();
this.app.use( '/graphql', bodyParser.json(), graphqlExpress( { schema: mySchema.graphQLSchema } ) );
this.app.use( '/graphiql', graphiqlExpress( { endpointURL: '/graphql' } ) );
this.app.listen( 3000, () => {
    console.log( 'Up and running !' );
} );
