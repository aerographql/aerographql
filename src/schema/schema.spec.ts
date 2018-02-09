import { GraphQLSchema } from 'graphql';

import { Middleware } from '../middleware';
import { Injector, Injectable } from '../di';
import { Schema, SchemaMetaObject, getSchemaProviders } from './schema';
import { BaseSchema } from './base-schema';
import { ObjectDefinition, ObjectImplementation, objectTypeFactory } from '../object';
import { Scalar } from '../scalar';
import { Interface } from '../interface';
import { schemaFactory } from './schema-factory';
import { FactoryContext, getMetaObject } from '../shared';
import { TestServer } from '../test';
import { Resolver } from '../resolver';


describe( '@Schema decorator', () => {

    @Schema( {
        rootQuery: 'RootQuery',
        rootMutation: 'RootMutation',
        components: []
    } )
    class SchemaA extends BaseSchema { }

    it( 'should set the correct metadata', () => {
        let mo = getMetaObject<SchemaMetaObject>( SchemaA );
        expect( mo ).toBeDefined();
        expect( mo.rootQuery ).toBe( 'RootQuery' );
        expect( mo.rootMutation ).toBe( 'RootMutation' );
    } );
} );

describe( 'schemaFactory function', () => {

    @ObjectImplementation( { name: 'RootQuery' } )
    class RootQueryA {
        @Resolver( { type: 'Float' } )
        resolverA() { }
    }

    @ObjectDefinition( { name: 'RootMutation' } )
    class RootMutationA { }

    @Schema( {
        rootQuery: 'RootQuery',
        rootMutation: 'RootMutation',
        components: [ RootQueryA, RootMutationA ]
    } )
    class SchemaA extends BaseSchema { }


    let schema: GraphQLSchema;
    beforeEach( () => {
        let context = new FactoryContext();
        schema = schemaFactory( SchemaA, context );
    } )

    it( 'should create the correct graphql object', () => {

        expect( schema ).toBeDefined();
        expect( schema.getQueryType() ).toBeDefined();
        expect( schema.getMutationType() ).toBeDefined();
    } );
} );

describe( 'getSchemaResolvers function', () => {

    @Middleware()
    class MiddlewareA { }

    @Scalar( { name: 'ScalarA' } )
    class ScalarA { serialize() { } }

    @Interface()
    class InterfaceA { }

    @ObjectDefinition( { name: 'RootQuery' } )
    class RootQueryDefA { }

    @ObjectImplementation( { name: 'RootQuery', middlewares: [ { provider: MiddlewareA } ] } )
    class RootQueryImplA {
        @Resolver( { type: 'Float' } )
        resolverA() { }
    }

    @Schema( {
        rootQuery: 'RootQuery',
        rootMutation: 'RootMutation',
        components: [ RootQueryImplA, InterfaceA, ScalarA ]
    } )
    class SchemaA extends BaseSchema { }

    @ObjectDefinition( { name: 'RootMutation' } )
    class RootMutation { }

    it( 'should return valid providers', () => {
        let ex = expect( getSchemaProviders( SchemaA ) );
        ex.toHaveLength( 3 );
        ex.toContain( RootQueryImplA );
        ex.toContain( ScalarA );
        ex.toContain( MiddlewareA );
    } );

    it( 'should return empty providers list', () => {

        @Schema( {
            rootQuery: 'RootQuery',
            components: [ RootQueryDefA ]
        } )
        class SchemaB { }

        let ex = expect( getSchemaProviders( SchemaB ) );
        ex.toHaveLength( 0 );
    } );

} );


describe( 'Schema inheriting BaseSchema', () => {

    @Injectable()
    class DepsA { }

    @Injectable()
    class DepsB { }

    @ObjectImplementation( { name: 'RootQuery' } )
    class RootQueryImplA { }

    @Schema( {
        rootQuery: 'RootQuery',
        rootMutation: 'RootMutation',
        components: [ RootQueryImplA ],
        providers: [ DepsA, DepsB ]
    } )
    class SchemaA extends BaseSchema { }

    let schema: SchemaA;
    beforeEach( () => {
        schema = new SchemaA();
    } )
    it( 'should provide an injector correctly configured', () => {
        expect( schema.rootInjector.get( RootQueryImplA ) ).toBeDefined();
        expect( schema.rootInjector.get( DepsA ) ).toBeDefined();
        expect( schema.rootInjector.get( DepsB ) ).toBeDefined();
        expect( schema.graphQLSchema ).toBeDefined();
    } );
} );


describe( 'When used from an express middleware, Schema', () => {

    @ObjectImplementation( { name: 'RootQuery' } )
    class RootQueryImplA {
        static spy: jest.Mock;
        @Resolver( { type: 'Int' } )
        query( parent: any, context: any ) {
            RootQueryImplA.spy( context );
            return 28;
        }
    }

    @Schema( { rootQuery: 'RootQuery', components: [ RootQueryImplA ] } )
    class SchemaA extends BaseSchema { }

    let schema: SchemaA;

    beforeEach( () => {
        schema = new SchemaA();
        RootQueryImplA.spy = jest.fn();
    } )

    it( 'should work with simple query', () => {
        let s = new TestServer( schema );
        let p = s.execute( "{ query  }" ).then( (r) => {
            expect( RootQueryImplA.spy ).toBeCalledWith( {} );
            return r;
        } );
        return expect( p ).resolves.toEqual( { data: { query: 28 } } )
    } )

    it( 'should work with simple query and additional context values', () => {

        let s = new TestServer( schema, { value1: 'value1' } );
        let p = s.execute( "{ query  }" ).then( (r) => {
            expect( RootQueryImplA.spy ).toBeCalledWith( { value1: 'value1' } );
            return r;
        } );
        return expect( p ).resolves.toEqual( { data: { query: 28 } } )

    } );
} );

