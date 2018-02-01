import { Injector } from './injector';
import { TestBed, inject } from './test-bed';
import { Injectable } from './decorators';

@Injectable()
class InjectableA { }

@Injectable()
class InjectableB { }

describe( 'Test bed', () => {

    it( 'should return a valid injector', () => {
        let i = TestBed.configure( {} );
        expect( i ).toBeTruthy();
    } );

} );

describe( 'inject method', () => {

    it( 'should return a valid injector', () => {
        let injector = TestBed.configure( { providers: [ InjectableA, InjectableB ] } );

        let m = jest.fn();
        let testCallback = inject( [ InjectableA, 'InjectableB' ], m );
        testCallback( () => { return; } );
        expect( m ).toHaveBeenCalledTimes( 1 );
        expect( m ).toHaveBeenCalledWith( injector.get( InjectableA ), injector.get( InjectableB ) );
    } );

} );
