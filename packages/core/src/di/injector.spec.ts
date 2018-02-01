import { Injector } from './injector';
import { Injectable } from './decorators';

describe( 'Injecting', () => {

    it( 'an invalid token should throw', () => {
        let testValue = 'testValue';
        let injector = Injector.resolveAndCreate( [ { token: 'test', value: testValue }] );
        expect( () => injector.get( 'test2' ) ).toThrowError();
    } );

    it( 'an invalid token with a not found value should return this value', () => {
        let testValue = 'testValue';
        let notFoundValue = 'notFoundValue';
        let injector = Injector.resolveAndCreate( [ { token: 'test', value: testValue }] );
        expect( injector.get( 'test2', notFoundValue ) ).toBe( notFoundValue );
    } );

} );

describe( 'Injecting a values', () => {

    it( 'should provide this value', () => {
        let testValue = 'testValue';
        let injector = Injector.resolveAndCreate( [ { token: 'test', value: testValue }] );
        expect( injector.get( 'test' ) ).toBe( testValue );
    } );

} );

describe( 'Injecting a factory as a function', () => {

    it( 'using a constructable function should create an object from this factory', () => {
        let objectValue = 'CreatedValue';
        let testFactory = function () {
            this.objectValue = objectValue;
        };
        let injector = Injector.resolveAndCreate( [ { token: 'test', factory: testFactory }] );
        expect( injector.get( 'test' ).objectValue ).toBe( objectValue );
    } );

    it( 'using a callable function should throw', () => {
        let testFactory = () => {
        };
        let injector = Injector.resolveAndCreate( [ { token: 'test', factory: testFactory }] );
        expect( () => injector.get( 'test' ) ).toThrowError();
    } );

    it( 'and retrieving it multiple time should return the same instance', () => {
        let objectValue = 'CreatedValue';
        let testFactory = function () {
            this.objectValue = objectValue;
        };
        let injector = Injector.resolveAndCreate( [ { token: 'test', factory: testFactory }] );
        let a = injector.get( 'test' );
        expect( injector.get( 'test' ) ).toBe( a );
    } );

} );


describe( 'Injecting a factory as a class', () => {

    @Injectable()
    class DepA {
        constructor() { }
    }

    @Injectable()
    class Factory {
        constructor( private depA: DepA ) { }
    }

    it( 'should correctly resolve it\'s dependencies', () => {
        let injector = Injector.resolveAndCreate( [ Factory, { token: 'DepA', factory: DepA }] );
        expect( injector.get( 'Factory' ).depA ).toBe( injector.get( 'DepA' ) );
    } );


    it( 'should throw if no provider was given for a dependency', () => {
        let injector = Injector.resolveAndCreate( [ Factory ] );
        expect( () => injector.get( 'Factory' ) ).toThrowError();
    } );




} );

describe( 'Creating an injector with', () => {
    it( 'an invalid provider should throw', () => {
        expect( () => Injector.resolveAndCreate( [ { token: 'test' }] ) ).toThrow();
    } );

    it( 'two similar token should throw', () => {
        expect( () => Injector.resolveAndCreate( [ { token: 'test', value: 1 }, { token: 'test', value: 2 }] ) ).toThrow();
    } );
} )
