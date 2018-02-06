
import { getMetaObject, executeAsyncFunctionSequentialy, Injector } from 'aerographql-core';

import { FactoryContext, Context } from '../shared';
import { createMiddlewareSequence, MiddlewareDescriptor, Middleware, BaseMiddleware } from './middleware';

describe( 'createMiddlewareSequence function', () => {
    let createFactoryContext = ( providers: Function[] ) => {
        return new FactoryContext( Injector.resolveAndCreate( providers ) );
    };

    let cloneObject = ( obj: any ) => {
        return JSON.parse( JSON.stringify( obj ) );
    };

    it( 'should work with an empty middleware list', () => {

        let descs: MiddlewareDescriptor[] = [];

        let s = createMiddlewareSequence( descs, createFactoryContext( [] ) );
        let p = executeAsyncFunctionSequentialy( s );

        expect( p ).resolves.toEqual( [] );
    } );

    it( 'should work with one middleware', async () => {

        let spy = jest.fn();
        @Middleware()
        class MA implements BaseMiddleware<string> {
            execute( src: any, args: any, context: Context ) { spy( context.middlewareOptions ); return 'A'; }
        }
        let descs: MiddlewareDescriptor[] = [ { provider: MA, options: 'Options' } ];

        let s = createMiddlewareSequence( descs, createFactoryContext( [ MA ] ) );
        let p = await executeAsyncFunctionSequentialy( s );

        expect( p ).toEqual( [ "A" ] );
        expect( spy ).toHaveBeenCalledTimes( 1 );
        expect( spy ).toHaveBeenCalledWith( 'Options' );
    } );

    it( 'should work with multiple middleware', async () => {

        let spyA = jest.fn();
        let spyB = jest.fn();
        let spyC = jest.fn();
        @Middleware()
        class MA implements BaseMiddleware<string> {

            execute( src: any, args: any, context: Context ) { spyA( cloneObject( context ) ); return 'A'; }
        }

        @Middleware()
        class MB implements BaseMiddleware<string> {
            execute( src: any, args: any, context: Context ) { spyB( cloneObject( context ) ); return 'B'; }
        }

        @Middleware()
        class MC implements BaseMiddleware<string> {
            execute( src: any, args: any, context: Context ) { spyC( cloneObject( context ) ); return 'C'; }
        }

        let descs: MiddlewareDescriptor[] = [
            { provider: MA, options: 'OptionsA', resultName: 'A' },
            { provider: MB, options: 'OptionsB', resultName: 'B' },
            { provider: MC, options: 'OptionsC', resultName: 'C' }
        ];

        let s = createMiddlewareSequence( descs, createFactoryContext( [ MA, MB, MC ] ) );
        let result = await executeAsyncFunctionSequentialy( s, [ null, null, {} ] );

        expect( result ).toEqual( [ "A", "B", "C" ] );
        expect( spyA ).toHaveBeenCalledTimes( 1 );
        expect( spyA ).toHaveBeenCalledWith( { middlewareResults: {}, middlewareOptions: 'OptionsA' } );
        expect( spyB ).toHaveBeenCalledTimes( 1 );
        expect( spyB ).toHaveBeenCalledWith( { middlewareResults: { A: [ "A" ] }, middlewareOptions: 'OptionsB' } );
        expect( spyC ).toHaveBeenCalledTimes( 1 );
        expect( spyC ).toHaveBeenCalledWith( { middlewareResults: { A: [ "A" ], B: [ "B" ] }, middlewareOptions: 'OptionsC' } );
    } );

} );