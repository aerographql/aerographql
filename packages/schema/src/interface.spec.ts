import { EventEmitter } from 'events'
import { ExpressHandler, graphqlExpress } from 'apollo-server-express';
import * as httpMocks from 'node-mocks-http';
import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES } from 'aerographql-core';

import { Interface, InterfaceMetaObject } from './interface';
import { ObjectDefinition } from './object-definition';
import { ObjectImplementation } from './object-implementation';
import { Resolver } from './resolver';
import { Schema } from './schema';
import { BaseSchema } from './base-schema';
import { interfaceFactory } from './interface-factory';
import { FactoryContext } from './factory-context';
import { Field } from './field';

@Interface( {
    name: 'TestInterface',
    description: 'Desc',
} )
class TestInterface {
    @Field( { type: 'Int' } ) fieldA: number;
    @Field( { type: 'String' } ) fieldB: string;
}

@ObjectDefinition( {
    name: 'TestType1',
    implements: [ TestInterface ]
} )
class TestType1 {
    @Field( { type: 'Int' } ) fieldA: number = 0;
    @Field() fieldB: string = "String";
    @Field() fieldC: string = "String";
}

@ObjectDefinition( {
    name: 'TestType2',
    implements: [ TestInterface ]
} )
class TestType2 {
    @Field( { type: 'Int' } ) fieldA: number = 0;
    @Field() fieldB: string = "String";
    @Field() fieldD: number = 1;
}

@ObjectImplementation( { name: 'TestRootQuery' } )
class TestRootQuery {
    static spy: jest.Mock;
    @Resolver( { type: TestInterface } )
    query1( parent: any, context: any ) {
        TestRootQuery.spy( context );
        return new TestType1();
    }

    @Resolver( { type: TestInterface } )
    query2( parent: any, context: any ) {
        TestRootQuery.spy( context );
        return new TestType2();
    }
}
@Schema( { rootQuery: 'TestRootQuery', components: [ TestRootQuery, TestInterface, TestType1, TestType2] } )
class TestSchema extends BaseSchema {
}


describe( '@InterfaceDefinition decorator', () => {

    let interfaceAMetadata: InterfaceMetaObject;
    beforeEach( () => {
        interfaceAMetadata = getMetaObject<InterfaceMetaObject>( TestInterface );
    } );

    it( 'should set the correct metadata', () => {
        expect( interfaceAMetadata ).not.toBeNull();
        expect( interfaceAMetadata.name ).toBe( 'TestInterface' );
        expect( interfaceAMetadata.description ).toBe( 'Desc' );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( TestInterface ) ).toBe( METAOBJECT_TYPES.interface );
    } );
    it( 'should set the correct fields', () => {
        expect( interfaceAMetadata.fields ).toHaveProperty( 'fieldA' );
        expect( interfaceAMetadata.fields ).toHaveProperty( 'fieldB' );
    } );

} );

describe( 'interfaceFactory', () => {

    let factoryContext: FactoryContext;
    beforeEach( () => {
        factoryContext = new FactoryContext();
    } )

    it( 'should create the correct graphql object', () => {
        let gql = interfaceFactory( TestInterface, factoryContext );
        expect( gql ).not.toBeFalsy();
        expect( gql.name ).toBe( 'TestInterface' );
        expect( gql.description ).toBe( 'Desc' );
    } );
    it( 'should create the correct graphql object fields', () => {
        let gql = interfaceFactory( getMetaObject<InterfaceMetaObject>( TestInterface ), factoryContext );
        expect( gql ).not.toBeFalsy();
        expect( gql.getFields().fieldA ).toBeTruthy();
    } );
} );

describe( 'Interface', () => {
    let response: httpMocks.MockResponse;
    let schema: TestSchema;
    let middleware: ExpressHandler;

    beforeEach( () => {
        schema = new TestSchema();
        response = httpMocks.createResponse( { eventEmitter: EventEmitter } );
        TestRootQuery.spy = jest.fn();
        middleware = graphqlExpress( { schema: schema.graphQLSchema } );
    } )

    it( 'should work with polymorphic types1', ( done ) => {
        let request = httpMocks.createRequest( {
            method: 'POST',
            body: { query: `{ 
                    query1 { fieldA fieldB ... on TestType1 { fieldC } } }` }
        } );

        middleware( request, response, null );
        response.on( 'end', () => {
            var gqlResponse = JSON.parse( response._getData() ); 
            expect( gqlResponse.data.query1 ).toEqual( { fieldA: 0, fieldB: "String", fieldC: "String" } );
            expect( response.statusCode ).toBe( 200 );
            done();
        } );
    } )

    it( 'should work with polymorphic types2', ( done ) => {
        let request = httpMocks.createRequest( {
            method: 'POST',
            body: { query: `{ 
                    query2 { fieldA fieldB ... on TestType2 { fieldD } } }` }
        } );

        middleware( request, response, null );
        response.on( 'end', () => {
            var gqlResponse = JSON.parse( response._getData() ); 
            expect( gqlResponse.data.query2 ).toEqual( { fieldA: 0, fieldB: "String", fieldD: 1 } );
            expect( response.statusCode ).toBe( 200 );
            done();
        } );
    } )
} )

