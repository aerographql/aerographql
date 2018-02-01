import { InputObject, InputObjectMetaObject } from './input-object';
import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES } from 'aerographql-core';

import { inputFactory } from './input-object-factory';
import { FactoryContext } from './factory-context';
import { Field } from './field';
import { GraphQLNonNull, GraphQLList, GraphQLScalarType } from 'graphql';

@InputObject( {
    name: 'Name',
    description: 'Desc',
} )
class InputA {
    @Field( { type: 'Float' } )
    fieldA: number[];
}

let factoryContext: FactoryContext;
beforeEach( () => {
    factoryContext = new FactoryContext();
} )

describe( '@InputDefinition decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( InputA ) ).not.toBeNull();
        expect( getMetaObject<InputObjectMetaObject>( InputA ).name ).toBe( 'Name' );
        expect( getMetaObject<InputObjectMetaObject>( InputA ).description ).toBe( 'Desc' );
        expect( getMetaObject<InputObjectMetaObject>( InputA ).fields ).toHaveProperty( 'fieldA' );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( InputA ) ).toBe( METAOBJECT_TYPES.inputObject );
    } );
} );


describe( 'inputFactory', () => {
    it( 'should create the correct graphql object', () => {
        let gql = inputFactory( InputA , factoryContext );
        expect( gql ).not.toBeFalsy();
        expect( gql.name ).toBe( 'Name' );
        expect( gql.description ).toBe( 'Desc' );
        let t = gql.getFields().fieldA.type as GraphQLNonNull<GraphQLList<GraphQLScalarType>>;
        expect( t ).toBeInstanceOf( GraphQLNonNull );
        expect( t.ofType ).toBeInstanceOf( GraphQLList );
        expect( t.ofType.ofType ).toBeInstanceOf( GraphQLScalarType );
        expect( t.ofType.ofType.name ).toBe( 'Float' );
    } );
} );

