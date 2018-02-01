import { Interface, InterfaceMetaObject } from './interface';
import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES } from 'aerographql-core';

import { interfaceFactory } from './interface-factory';
import { FactoryContext } from './factory-context';
import { Field } from './field';

@Interface( {
    name: 'Name',
    description: 'Desc',
} )
class InterfaceA {

    @Field( { type: 'Int' } )
    fieldA: number;

    @Field( { type: 'String' } )
    fieldB: string;

}

let factoryContext: FactoryContext;
beforeEach( () => {
    factoryContext = new FactoryContext();
} )


describe( '@InterfaceDefinition decorator', () => {

    let interfaceAMetadata: InterfaceMetaObject;
    beforeEach( () => {
        interfaceAMetadata = getMetaObject<InterfaceMetaObject>( InterfaceA );
    } );

    it( 'should set the correct metadata', () => {
        expect( interfaceAMetadata ).not.toBeNull();
        expect( interfaceAMetadata.name ).toBe( 'Name' );
        expect( interfaceAMetadata.description ).toBe( 'Desc' );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( InterfaceA ) ).toBe( METAOBJECT_TYPES.interface );
    } );
    it( 'should set the correct fields', () => {
        expect( interfaceAMetadata.fields ).toHaveProperty('fieldA');
        expect( interfaceAMetadata.fields ).toHaveProperty('fieldB');
    } );

} );

describe( 'interfaceFactory', () => {
    it( 'should create the correct graphql object', () => {
        let gql = interfaceFactory( InterfaceA, factoryContext );
        expect( gql ).not.toBeFalsy();
        expect( gql.name ).toBe( 'Name' );
        expect( gql.description ).toBe( 'Desc' );
    } );
    it( 'should create the correct graphql object fields', () => {
        let gql = interfaceFactory( getMetaObject<InterfaceMetaObject>( InterfaceA ), factoryContext );
        expect( gql ).not.toBeFalsy();
        expect( gql.getFields().fieldA ).toBeTruthy();
    } );
} );

