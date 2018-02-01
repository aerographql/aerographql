import { Scalar, ScalarMetaObject } from './scalar';
import { scalarFactory } from './scalar-factory';
import { FactoryContext } from './factory-context';
import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES, Injector } from 'aerographql-core';

@Scalar( {
    name: 'Name'
} )
class ScalarA {

    serialize() {
        
    }

    parseValue() {

    }

    parseLiteral() {
        
    }
}

@Scalar( {
    name: 'Name'
} )
class InvalidScalarA {
}


describe( '@Scalar decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( ScalarA ) ).not.toBeNull();
        expect( getMetaObject<ScalarMetaObject>( ScalarA ).name ).toBe( 'Name' );
        expect( getMetaObject<ScalarMetaObject>( ScalarA ).instanceToken ).toBe( 'ScalarA' );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( ScalarA ) ).toBe( METAOBJECT_TYPES.scalar );
    } );

} );

describe( 'scalarFactory', () => {

    let injector = Injector.resolveAndCreate( [ ScalarA, InvalidScalarA ] );
    let context: FactoryContext;
    beforeEach( () => {
        context = new FactoryContext(injector);
    } );

    it( 'should create the correct graphql scalar object', () => {
        let o = scalarFactory( ScalarA, context );
        expect( o.serialize ).toBeDefined();
    } );


    it( 'should throw if no serialize method where provided', () => {
        expect( () => scalarFactory( InvalidScalarA, context ) ).toThrowError();
    }) 

} );
