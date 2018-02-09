import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES } from 'aerographql-core';

import { Union, UnionMetaObject } from './union';
import { unionFactory } from './union-factory';
import { ObjectDefinition, ObjectImplementation, objectTypeFactory } from '../object';
import { Resolver } from '../resolver';
import { Schema, BaseSchema } from '../schema';
import { FactoryContext } from '../shared';
import { TestServer } from '../test';
import { Field } from '../field';

describe( '@Union decorator', () => {

    @ObjectDefinition( { name: 'ObjectA', } )
    class ObjectA { }

    @ObjectDefinition( { name: 'ObjectB', } )
    class ObjectB { }

    @Union( { name: 'UnionA', description: 'UnionA Desc', types: [ ObjectA, ObjectB ] } )
    class UnionA { }

    let mo: UnionMetaObject;
    beforeEach( () => {
        mo = getMetaObject<UnionMetaObject>( UnionA );
    } );

    it( 'should set the correct metadata', () => {
        expect( mo ).not.toBeNull();
        expect( mo.name ).toBe( 'UnionA' );
        expect( mo.description ).toBe( 'UnionA Desc' );
        expect( mo.types ).toContain( ObjectA );
        expect( mo.types ).toContain( ObjectB );
    } );

} );

describe( 'unionFactory function', () => {
    @ObjectDefinition( { name: 'ObjectA', } )
    class ObjectA { }

    @ObjectDefinition( { name: 'ObjectB', } )
    class ObjectB { }

    @Union( { name: 'UnionA', description: 'UnionA Desc', types: [ ObjectA, ObjectB ] } )
    class UnionA { }

    it( 'should create the correct GraphQL object', () => {

        let context = new FactoryContext();
        objectTypeFactory( [ ObjectA ], [], context );
        objectTypeFactory( [ ObjectB ], [], context );
        let gql = unionFactory( UnionA, context );

        expect( gql.name ).toBe( 'UnionA' );
        expect( gql.description ).toBe( 'UnionA Desc' );
        expect( gql.getTypes() ).toHaveLength( 2 );
        expect( gql.getTypes() ).toContain( context.lookupType( 'ObjectA' ) );
        expect( gql.getTypes() ).toContain( context.lookupType( 'ObjectB' ) );
    } );

    it( 'should throw if union reference an invalid type', () => {

        let context = new FactoryContext();
        let gql = unionFactory( UnionA, context );
        expect( () => gql.getTypes() ).toThrowError();
    } );
} );


describe( 'When used from an express middleware, Union', () => {
    @ObjectDefinition( { name: 'ObjectA', } )
    class ObjectA {
        @Field() fieldA: number;
        @Field() fieldB: number;
    }

    @ObjectDefinition( { name: 'ObjectB', } )
    class ObjectB {
        @Field() fieldC: number;
        @Field() fieldD: number;
    }

    @Union( { name: 'UnionA', description: 'UnionA Desc', types: [ ObjectA, ObjectB ] } )
    class UnionA { }

    @ObjectImplementation( { name: 'RootQuery' } )
    class RootQueryA {
        static spy: jest.Mock;
        @Resolver( { type: UnionA } )
        query1( parent: any, context: any ) {
            RootQueryA.spy( context );
            return {
                fieldA: 0,
                fieldB: 1
            };
        }
    }
    @Schema( { rootQuery: 'RootQuery', components: [ RootQueryA, UnionA, ObjectA, ObjectB ] } )
    class SchemaA extends BaseSchema { }

    let schema: SchemaA;

    beforeEach( () => {
        schema = new SchemaA();
        RootQueryA.spy = jest.fn();
    } )

    it( 'should work with polymorphic types1', () => {
        let s = new TestServer( schema );
        let p = s.execute( `{ query1 { ... on ObjectA { fieldA fieldB } } }` ).then( (r) => {
            return r;
        });
        return expect( p ).resolves.toEqual( { data: { query1: { fieldA: 0, fieldB: 1 } } } )
    } )

} )
