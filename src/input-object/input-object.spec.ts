import { GraphQLNonNull, GraphQLList, GraphQLScalarType, GraphQLInputObjectType } from 'graphql';

import { InputObject, InputObjectMetaObject } from './input-object';
import { inputFactory } from './input-object-factory';
import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES, FactoryContext } from '../shared';
import { Field } from '../field';

@InputObject( {
    name: 'Name',
    description: 'Desc',
} )
class InputA {
    @Field( { type: 'Float' } )
    fieldA: number[];
}

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


describe( 'inputFactory function', () => {
    let factoryContext: FactoryContext;
    let gql: GraphQLInputObjectType;
    beforeEach( () => {
        factoryContext = new FactoryContext();
        gql = inputFactory( InputA, factoryContext );
    } )

    it( 'should create the correct graphql object', () => {
        expect( gql ).not.toBeFalsy();
        expect( gql.name ).toBe( 'Name' );
        expect( gql.description ).toBe( 'Desc' );
    } )

    it( 'should create field with NonNull and list attributes', () => {
        let t = gql.getFields().fieldA.type as GraphQLNonNull<GraphQLList<GraphQLScalarType>>;
        expect( t ).toBeInstanceOf( GraphQLNonNull );
        expect( t.ofType ).toBeInstanceOf( GraphQLList );
        expect( t.ofType.ofType ).toBeInstanceOf( GraphQLScalarType );
        expect( t.ofType.ofType.name ).toBe( 'Float' );
    } );
} );

