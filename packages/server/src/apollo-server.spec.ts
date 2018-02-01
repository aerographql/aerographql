import { EventEmitter } from 'events'
import { ExpressHandler } from 'apollo-server-express';
import { getMetaObject } from 'aerographql-core';
import * as httpMocks from 'node-mocks-http';
import { ApolloServer, ApolloServerMetaObject, BaseApolloServer } from './apollo-server';

import { ObjectImplementation, Schema, Resolver } from 'aerographql-schema';


@ObjectImplementation( { name: 'RootQuery' } )
class TestRootQuery {
    static spy: jest.Mock;
    @Resolver( { type: 'Int' } )
    query( parent: any, context: any ) {
        TestRootQuery.spy( context );
        return 28;
    }
}

@Schema( { rootQuery: 'RootQuery', components: [ TestRootQuery ] } )
class TestSchema {

}

@ApolloServer( {
    name: 'TestServer',
    schema: TestSchema
} )
class TestServer extends BaseApolloServer {

}

describe( '@ApolloServer decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TestServer ) ).not.toBeNull();
        expect( getMetaObject<ApolloServerMetaObject>( TestServer ).providers ).toHaveLength( 0 );
        expect( getMetaObject<ApolloServerMetaObject>( TestServer ).name ).toBe( 'TestServer' );
    } );
} );


describe( 'Express server', () => {

    let response: httpMocks.MockResponse;
    let server: TestServer;

    beforeEach( () => {
        server = new TestServer();
        response = httpMocks.createResponse( { eventEmitter: EventEmitter } );
        TestRootQuery.spy = jest.fn();
    } )

    it( 'should work with simple query', ( done ) => {

        let middleware = server.getGraphQLMiddleware();
        let request = httpMocks.createRequest( {
            method: 'POST',
            body: {
                variables: null,
                operationName: null,
                query: "{ query  }"
            }
        } );

        middleware( request, response, null );

        response.on( 'end', () => {
            var gqlResponse = JSON.parse( response._getData() );
            expect( gqlResponse.data ).toBeDefined();
            expect( gqlResponse.data.query ).toBe( 28 );
            expect( response.statusCode ).toBe( 200 );
            done();
        } );
    } )

    it( 'should work with simple query and custom options', ( done ) => {

        let middleware = server.getGraphQLMiddleware( { context: { value1: 'value1' } } );
        let request = httpMocks.createRequest( {
            method: 'POST',
            body: {
                variables: null,
                operationName: null,
                query: "{ query  }"
            }
        } );

        middleware( request, response, null );

        response.on( 'end', () => {
            var gqlResponse = JSON.parse( response._getData() );
            expect( gqlResponse.data ).toBeDefined();
            expect( gqlResponse.data.query ).toBe( 28 );
            expect( response.statusCode ).toBe( 200 );
            expect( TestRootQuery.spy ).toBeCalled();
            expect( TestRootQuery.spy ).toBeCalledWith( { "credentials": null, "middlewareOptions": null, "middlewareResults": [], "value1": "value1" } )
            done();
        } );
    } );
} );


