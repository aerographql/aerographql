import { Injector, getMetaObject } from 'aerographql-core';

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

@Middleware()
class MiddlewareA { }

@Scalar( { name: 'ScalarA' } )
class ScalarA {
    serialize() { }
}

@Interface()
class InterfaceA { }

@ObjectDefinition( { name: 'RootQuery' } )
class RootQuery { }

@ObjectImplementation( { name: 'RootQuery', middlewares: [ MiddlewareA ] } )
class RootQueryImpl {
    @Resolver( { type: 'Float' } )
    resolverA() { }
}

@ObjectDefinition( { name: 'RootMutation' } )
class RootMutation { }

@Schema( {
    rootQuery: 'RootQuery',
    rootMutation: 'RootMutation',
    components: [ RootQueryImpl, InterfaceA, ScalarA ],
} )
class SchemaA { }

@Schema( {
    rootQuery: 'RootQuery',
    rootMutation: 'RootMutation',
    components: [ RootQuery, RootMutation ]
} )
class SchemaB { }

@Schema( {
    rootQuery: 'RootQuery',
    rootMutation: 'RootMutation',
    components: [ RootQueryImpl ]
} )
class SchemaC { }

describe( '@Schema decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( SchemaA ) ).not.toBeNull();
        expect( getMetaObject<SchemaMetaObject>( SchemaA ).rootQuery ).toBe( 'RootQuery' );
        expect( getMetaObject<SchemaMetaObject>( SchemaA ).rootMutation ).toBe( 'RootMutation' );
    } );
} );

describe( 'schemaFactory', () => {
    let injector = Injector.resolveAndCreate( getSchemaProviders( SchemaA ) )
    let context = new FactoryContext( injector );
    objectTypeFactory( [ RootMutation ], [], context );
    objectTypeFactory( [ RootQuery ], [ RootQueryImpl ], context );
    let schema = schemaFactory( SchemaA, context );

    it( 'should create the correct graphql object', () => {

        expect( schema ).toBeDefined();
        expect( schema.getQueryType() ).toBeDefined();
        expect( schema.getMutationType() ).toBeDefined();
    } );
} );

describe( 'getSchemaResolvers', () => {
    it( 'should return valid providers', () => {
        let ex = expect( getSchemaProviders( SchemaA ) );
        ex.toHaveLength( 3 );
        ex.toContain( RootQueryImpl );
        ex.toContain( ScalarA );
        ex.toContain( MiddlewareA );
    } );

    it( 'should return empty providers list', () => {
        let ex = expect( getSchemaProviders( SchemaB ) );
        ex.toHaveLength( 0 );
    } );

    it( 'should return providers from SchemaModules', () => {
        let ex = expect( getSchemaProviders( SchemaC ) );
        ex.toHaveLength( 2 );
        ex.toContain( RootQueryImpl );
        ex.toContain( MiddlewareA );
    } );
} );
