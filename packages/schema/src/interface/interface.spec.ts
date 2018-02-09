import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES } from 'aerographql-core';

import { Interface, InterfaceMetaObject } from './interface';
import { interfaceFactory } from './interface-factory';
import { ObjectDefinition, ObjectImplementation } from '../object';
import { Resolver } from '../resolver';
import { Schema, BaseSchema } from '../schema';
import { FactoryContext } from '../shared';
import { TestServer } from '../test';
import { Field } from '../field';


describe( '@InterfaceDefinition decorator', () => {

    @Interface( {
        name: 'InterfaceA',
        description: 'Desc',
    } )
    class InterfaceA {
        @Field( { type: 'Int' } ) fieldA: number;
        @Field( { type: 'String' } ) fieldB: string;
    }

    let mo: InterfaceMetaObject;
    beforeEach( () => {
        mo = getMetaObject<InterfaceMetaObject>( InterfaceA );
    } );

    it( 'should set the correct metadata', () => {
        expect( mo ).not.toBeNull();
        expect( mo.name ).toBe( 'InterfaceA' );
        expect( mo.description ).toBe( 'Desc' );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( InterfaceA ) ).toBe( METAOBJECT_TYPES.interface );
    } );
    it( 'should set the correct fields', () => {
        expect( mo.fields ).toHaveProperty( 'fieldA' );
        expect( mo.fields ).toHaveProperty( 'fieldB' );
    } );

} );

describe( 'interfaceFactory function', () => {

    @Interface( {
        name: 'InterfaceA',
        description: 'Desc',
    } )
    class InterfaceA {
        @Field( { type: 'Int' } ) fieldA: number;
        @Field( { type: 'String' } ) fieldB: string;
    }

    let factoryContext: FactoryContext;
    beforeEach( () => {
        factoryContext = new FactoryContext();
    } )

    it( 'should create the correct graphql object', () => {
        let gql = interfaceFactory( InterfaceA, factoryContext );
        expect( gql ).not.toBeFalsy();
        expect( gql.name ).toBe( 'InterfaceA' );
        expect( gql.description ).toBe( 'Desc' );
    } );
    it( 'should create the correct graphql object fields', () => {
        let gql = interfaceFactory( InterfaceA, factoryContext );
        expect( gql ).not.toBeFalsy();
        expect( gql.getFields().fieldA ).toBeTruthy();
    } );
} );

describe( 'When used from an express middleware, Interface', () => {

    @Interface( { name: 'InterfaceA', description: 'Desc', } )
    class InterfaceA {
        @Field( { type: 'Int' } ) fieldA: number;
        @Field( { type: 'String' } ) fieldB: string;
    }

    @ObjectDefinition( { name: 'TestType1', implements: [ InterfaceA ] } )
    class TypeA {
        @Field( { type: 'Int' } ) fieldA: number = 0;
        @Field() fieldB: string = "String";
        @Field() fieldC: string = "String";
    }

    @ObjectDefinition( { name: 'TestType2', implements: [ InterfaceA ] } )
    class TypeB {
        @Field( { type: 'Int' } ) fieldA: number = 0;
        @Field() fieldB: string = "String";
        @Field() fieldD: number = 1;
    }


    @Interface()
    class InterfaceB {
        @Field() fieldA: number;
        @Field() fieldB: string;
    }

    @ObjectDefinition( { implements: [ InterfaceB ] } )
    class TypeC {
        @Field() fieldA: number = 0;
        @Field() fieldB: string = '';
    }

    @ObjectDefinition( { implements: [ InterfaceB ] } )
    class TypeD {
        @Field() fieldA: number = 0;
        @Field() fieldB: string = '';
    }

    @ObjectImplementation( { name: 'RootQuery' } )
    class RootQuery {
        static spy: jest.Mock;
        @Resolver( { type: InterfaceA } )
        query1( parent: any, context: any ) {
            RootQuery.spy( context );
            return {
                fieldA: 0,
                fieldB: 'String',
                fieldC: 'String'
            };
        }

        @Resolver( { type: InterfaceA } )
        query2( parent: any, context: any ) {
            RootQuery.spy( context );
            return new TypeB();
        }

        @Resolver( { type: InterfaceB } )
        query3( parent: any, context: any ) {
            RootQuery.spy( context );
            return {
                fieldA: 0,
                fieldB: ''
            };
        }
    }
    @Schema( { rootQuery: 'RootQuery', components: [ RootQuery, InterfaceA, TypeA, TypeB, InterfaceB, TypeC, TypeD ] } )
    class TestSchema extends BaseSchema {
    }

    let schema: TestSchema;

    beforeEach( () => {
        schema = new TestSchema();
        RootQuery.spy = jest.fn();
    } )

    it( 'should work with polymorphic types1', () => {
        let s = new TestServer( schema );
        let q = `{ query1 { fieldA fieldB ... on TestType1 { fieldC } } }`
        return expect( s.execute( q ) ).resolves.toEqual( { data: { query1: { fieldA: 0, fieldB: "String", fieldC: "String" } } } );
    } )

    it( 'should work with polymorphic types2', () => {
        let s = new TestServer( schema );
        let q = `{ query2 { fieldA fieldB ... on TestType2 { fieldD } } }`
        return expect( s.execute( q ) ).resolves.toEqual( { data: { query2: { fieldA: 0, fieldB: "String", fieldD: 1 } } } );
    } )

    it( 'should error when type resolution is not possible', () => {
        let s = new TestServer( schema );
        let q = `{ query3 { fieldA fieldB } }`
        return expect( s.execute( q ) ).resolves.toHaveProperty( 'errors' );

    } )
} );

