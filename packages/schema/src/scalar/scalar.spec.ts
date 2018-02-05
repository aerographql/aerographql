import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES, Injector } from 'aerographql-core';

import { Scalar, ScalarMetaObject } from './scalar';
import { scalarFactory } from './scalar-factory';
import { FactoryContext } from '../shared';

let spy1 = jest.fn();
let spy2 = jest.fn();

let spy3 = jest.fn();
@Scalar( {
    name: 'Name',
    description: 'ScalarA Description'
} )
class ScalarA {
    serialize( value: any ) { spy1( value ) }
    parseValue( value: any ) { spy2( value ) }
    parseLiteral( value: any ) { spy3( value ) }
}


describe( '@Scalar decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( ScalarA ) ).not.toBeNull();
        let mo = getMetaObject<ScalarMetaObject>( ScalarA );
        expect( mo.name ).toBe( 'Name' );
        expect( mo.instanceToken ).toBe( 'ScalarA' );
        expect( mo.description ).toBe( 'ScalarA Description' );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( ScalarA ) ).toBe( METAOBJECT_TYPES.scalar );
    } );

} );

describe( 'scalarFactory', () => {

    @Scalar( { name: 'Name' } ) class InvalidScalarA { }

    let injector = Injector.resolveAndCreate( [ ScalarA, InvalidScalarA ] );
    let context: FactoryContext;
    beforeEach( () => {
        context = new FactoryContext( injector );
    } );

    it( 'should create the correct graphql scalar object', () => {
        let gql = scalarFactory( ScalarA, context );
        expect( gql.serialize ).toBeDefined();
    } );

    it( 'should throw if no serialize method where provided', () => {
        expect( () => scalarFactory( InvalidScalarA, context ) ).toThrowError();
    } );

    it( 'should correctly bind serialize method', () => {
        let gql = scalarFactory( ScalarA, context );
        gql.serialize( 'TestValue' )
        expect( spy1 ).toBeCalledWith( 'TestValue' );
    } );

    it( 'should correctly bind parseValue method', () => {
        let gql = scalarFactory( ScalarA, context );
        gql.parseValue( 'TestValue' )
        expect( spy2 ).toBeCalledWith( 'TestValue' );
    } );

    it( 'should correctly bind parseLiteral method', () => {
        let gql = scalarFactory( ScalarA, context );
        gql.parseLiteral( 'TestValue' as any )
        expect( spy3 ).toBeCalledWith( 'TestValue' );
    } );
} );


describe( 'scalarFactory', () => {

    let context: FactoryContext;
    beforeEach( () => {
        context = new FactoryContext();
    } );

    it( 'should throw no provider exist for a given scalar', () => {
        expect( () => scalarFactory( ScalarA, context ) ).toThrowError();
    } )

} );
