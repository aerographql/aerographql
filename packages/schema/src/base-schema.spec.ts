import { Injector, getMetaObject, Injectable } from 'aerographql-core';
import { EventEmitter } from 'events'
import { ExpressHandler, graphqlExpress } from 'apollo-server-express';
import * as httpMocks from 'node-mocks-http';

import { Schema, SchemaMetaObject, getSchemaProviders } from './schema';
import { ObjectDefinition } from './object-definition';
import { ObjectImplementation } from './object-implementation';
import { Scalar } from './scalar';
import { Interface } from './interface';
import { schemaFactory } from './schema-factory';
import { objectTypeFactory } from './object-factory';
import { FactoryContext } from './factory-context';
import { Middleware } from './middleware';
import { Resolver } from './resolver';
import { BaseSchema } from './base-schema';


@ObjectDefinition( { name: 'RootQuery' } )
class RootQuery { }

@ObjectImplementation( { name: 'RootQuery' } )
class RootQueryImpl {
    @Resolver( { type: 'Float' } )
    resolverA() { }
}

@Injectable()
class Deps1 { }

@Injectable()
class Deps2 { }

@Schema( {
    rootQuery: 'RootQuery',
    components: [ RootQueryImpl ],
    providers: [ Deps1, Deps2 ]
} )
class SchemaA extends BaseSchema { }

describe( 'Schema inheriting BaseSchema', () => {
    let schema: SchemaA;
    beforeEach( () => {
        schema = new SchemaA();
    } )
    it( 'should provide an injector correctly configured', () => {
        expect( schema.rootInjector.get( RootQueryImpl ) ).toBeDefined();
        expect( schema.rootInjector.get( Deps1 ) ).toBeDefined();
        expect( schema.rootInjector.get( Deps2 ) ).toBeDefined();
        expect( schema.graphQLSchema ).toBeDefined();
    } );
} );


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
class TestSchema extends BaseSchema {
}

describe( 'Express server', () => {

    let response: httpMocks.MockResponse;
    let schema: TestSchema;

    beforeEach( () => {
        schema = new TestSchema();
        response = httpMocks.createResponse( { eventEmitter: EventEmitter } );
        TestRootQuery.spy = jest.fn();
    } )

    it( 'should work with simple query', ( done ) => {

        let middleware = graphqlExpress( { schema: schema.graphQLSchema } )
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

        let middleware = graphqlExpress( { schema: schema.graphQLSchema, context: { value1: 'value1'} } );
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
            expect( TestRootQuery.spy ).toBeCalledWith( { "middlewareOptions": null, "middlewareResults": [], "value1": "value1" } )
            done();
        } );
    } );
} );


