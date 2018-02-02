import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Field, ObjectDefinition, ObjectImplementation, Interface, Resolver, Arg, Schema, BaseSchema } from 'aerographql-schema';


/** 
 * Schema definitions
*/
@ObjectDefinition( {
    name: 'User'
} )
export class User {
    constructor( obj: any ) {
        this.id = obj.id;
        this.name = obj.name;
        this.description = obj.description;
        this.age = obj.age;
        this.admin = obj.admin;
    }
    @Field( { type: 'ID' } ) id: string;
    @Field() name: string = "";
    @Field() description: string = "Empty description";
    @Field() age: number = 0;
    @Field() admin: boolean = false;
}

@Interface( {
    name: 'TodoInterface'
} )
export class TodoInterface {
    @Field( { type: 'ID' } ) id: string;
    @Field() title: string = "";
    @Field() content: string = "Empty todo";
}
@ObjectDefinition( {
    name: 'PonctualTodo',
    implements: [ TodoInterface ]
} )
export class PonctualTodo {
    constructor( obj: PonctualTodo ) {
        this.id = obj.id;
        this.title = obj.title;
        this.content = obj.content;
        this.date = obj.date;
    }
    @Field( { type: 'ID' } ) id: string;
    @Field() title: string = "";
    @Field() content: string = "Empty todo";
    @Field() date: string = "Date";
}
@ObjectDefinition( {
    name: 'RecurentTodo',
    implements: [ TodoInterface ]
} )
export class RecurentTodo {
    constructor( obj: RecurentTodo ) {
        this.id = obj.id;
        this.title = obj.title;
        this.content = obj.content;
        this.date = obj.date;
    }
    @Field( { type: 'ID' } ) id: string;
    @Field() title: string = "";
    @Field() content: string = "Empty todo";
    @Field() date: string = "Every week";

}



/** 
 * Fake Database objects
*/
let users: User[] = [
    new User( { admin: false, age: 25, description: 'Description of Bob', name: 'Bob', id: '0' } ),
    new User( { admin: true, age: 36, description: 'Description of Alice', name: 'Alice', id: '1' } ),
    new User( { admin: false, age: 28, description: 'Decription of Steeve', name: 'Steeve', id: '3' } )
];

let todos: { [ key: string ]: ( RecurentTodo | PonctualTodo )[] } =
    {
        Bob: [
            new RecurentTodo( { id: '0', title: 'Todo1', content: 'Bob Todo1 recurent content', date: 'Every week' } ),
            new PonctualTodo( { id: '1', title: 'Todo2', content: 'Bob Todo2 ponctual content', date: 'February' } ),
            new RecurentTodo( { id: '2', title: 'Todo3', content: 'Bob Todo3 content', date: 'Every day' } )
        ],
        Alice: [
            new RecurentTodo( { id: '3', title: 'Todo1', content: 'Alice Todo1 content', date: 'Every week' } ),
            new RecurentTodo( { id: '4', title: 'Todo2', content: 'Alice Todo2 content', date: 'Every month' } ),
            new PonctualTodo( { id: '5', title: 'Todo3', content: 'Alice Todo3 content', date: 'January' } ) ],
        Steeve: [
            new PonctualTodo( { id: '6', title: 'Todo1', content: 'Steeve Todo1 content', date: 'February' } ),
            new PonctualTodo( { id: '7', title: 'Todo2', content: 'Steeve Todo2 content', date: 'September' } ),
            new RecurentTodo( { id: '8', title: 'Todo3', content: 'Steeve Todo3 content', date: 'Every year' } ) ]
    };


@ObjectImplementation( {
    name: 'User'
} )
export class UserImpl {

    @Resolver( { type: TodoInterface, list: true } )
    todos( user: User, @Arg( { nullable: true } ) search: string ) {
        return todos[ user.name ];
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
    components: [ RootQuery, User, UserImpl, PonctualTodo, RecurentTodo, TodoInterface ]
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
