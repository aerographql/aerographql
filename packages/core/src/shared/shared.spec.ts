import 'reflect-metadata';
import { getFunctionParametersName } from './utilities';
import { getMetaObject, METAOBJECT_TYPES, getMetaObjectType } from './metaobject';

let f1 = function ( p1: any, p2: any, p3: any ) { };
let f2 = function () { };

describe( 'getFunctionParametersName', () => {
    it( 'should extract correct parameter name', () => {
        expect( getFunctionParametersName( f1 ) ).toEqual( [ 'p1', 'p2', 'p3' ] )
        expect( getFunctionParametersName( f2 ) ).toEqual( [] )
    } );
} );

describe( 'getMetaObject', () => {

    class ClassA {};

    it( 'should throw if object is not annotated', () => {
        expect( () => getMetaObject( ClassA, METAOBJECT_TYPES.interface) ).toThrowError();
    } );

    it( 'should work with not annotated types', () => {
        expect( getMetaObjectType( ClassA) ).toBe( METAOBJECT_TYPES.notAnnotated );
    } );

})
