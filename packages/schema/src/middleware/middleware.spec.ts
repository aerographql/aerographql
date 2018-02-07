
import { getMetaObject, executeAsyncFunctionSequentialy, Injector } from 'aerographql-core';

import { FactoryContext } from '../shared';
import { createMiddlewareSequence, MiddlewareDescriptor, Middleware, BaseMiddleware } from './middleware';

describe( 'createMiddlewareSequence function', () => {

    let createInjector = ( providers: Function[] ) => {
        return Injector.resolveAndCreate( providers );
    };

    let cloneObject = ( obj: any ) => {
        return JSON.parse( JSON.stringify( obj ) );
    };

    it( 'should work with an empty middleware list', () => {

        let descs: MiddlewareDescriptor[] = [];

        let s = createMiddlewareSequence( descs, createInjector( [] ) );
        let p = executeAsyncFunctionSequentialy( s );

        expect( p ).resolves.toEqual( [] );
    } );

    it( 'should work with one middleware', async () => {

        let spy = jest.fn();
        @Middleware()
        class MA implements BaseMiddleware<string> {
            execute( src: any, args: any, context: any, options: any ) { spy( options ); return 'A'; }
        }
        let descs: MiddlewareDescriptor[] = [ { provider: MA, options: 'Options' } ];

        let s = createMiddlewareSequence( descs, createInjector( [ MA ] ) );
        let p = await executeAsyncFunctionSequentialy( s );

        expect( p ).toEqual( [ "A" ] );
        expect( spy ).toHaveBeenCalledTimes( 1 );
        expect( spy ).toHaveBeenCalledWith( 'Options' );
    } );

    it( 'should work with multiple middleware', () => {

        let spyA = jest.fn();
        let spyB = jest.fn();
        let spyC = jest.fn();
        @Middleware()
        class MA implements BaseMiddleware<string> {
            execute( src: any, args: any, context: any, options: any ) { spyA( [ cloneObject( context ), cloneObject( options ) ] ); return 'A'; }
        }

        @Middleware()
        class MB implements BaseMiddleware<string> {
            execute( src: any, args: any, context: any, options: any ) { spyB( [ cloneObject( context ), cloneObject( options ) ] ); return 'B'; }
        }

        @Middleware()
        class MC implements BaseMiddleware<string> {
            execute( src: any, args: any, context: any, options: any ) { spyC( [ cloneObject( context ), cloneObject( options ) ] ); return 'C'; }
        }

        let descs: MiddlewareDescriptor[] = [
            { provider: MA, options: 'OptionsA', resultName: 'A' },
            { provider: MB, options: 'OptionsB', resultName: 'B' },
            { provider: MC, options: 'OptionsC', resultName: 'C' }
        ];

        let s = createMiddlewareSequence( descs, createInjector( [ MA, MB, MC ] ) );
        let result = executeAsyncFunctionSequentialy( s, [ null, null, {} ] ).then( (result ) => {
            expect( spyA ).toHaveBeenCalledTimes( 1 );
            expect( spyA ).toHaveBeenCalledWith( [ {} , 'OptionsA' ] );
            expect( spyB ).toHaveBeenCalledTimes( 1 );
            expect( spyB ).toHaveBeenCalledWith( [{ A: [ "A" ] }, 'OptionsB' ] );
            expect( spyC ).toHaveBeenCalledTimes( 1 );
            expect( spyC ).toHaveBeenCalledWith( [{ A: [ "A" ], B: [ "B" ] }, 'OptionsC' ] );
            return result;
        });

        return expect( result ).resolves.toEqual( [ "A", "B", "C" ] );
    } );

    it( 'should handle sync error correctly', () => {

        let spyA = jest.fn();

        @Middleware()
        class MA implements BaseMiddleware<boolean> {
            execute( src: any, args: any, context: any, options: any ) { spyA( [ cloneObject( context ), cloneObject( options ) ] ); return false; }
        }

        let descs: MiddlewareDescriptor[] = [
            { provider: MA, options: 'OptionsA', resultName: 'A' }
        ];

        let s = createMiddlewareSequence( descs, createInjector( [ MA ] ) );
        let result = executeAsyncFunctionSequentialy( s, [ null, null, {} ] ).then( () => {
            expect( spyA ).toHaveBeenCalledTimes( 1 );
            expect( spyA ).toHaveBeenCalledWith( [  {} , 'OptionsA' ] );
        } );

        expect( result ).rejects.toEqual( { middleware: "MA", reason: false } );

    } );

    it( 'should handle async error correctly', () => {

        let spyA = jest.fn();

        @Middleware()
        class MA implements BaseMiddleware<boolean> {
            execute( src: any, args: any, context: any, options: any ) { spyA( [ cloneObject( context ), cloneObject( options ) ] ); return Promise.reject( 'rejectValue' ); }
        }

        let descs: MiddlewareDescriptor[] = [
            { provider: MA, options: 'OptionsA', resultName: 'A' }
        ];

        let s = createMiddlewareSequence( descs, createInjector( [ MA ] ) );
        let result = executeAsyncFunctionSequentialy( s, [ null, null, {} ] ).then( () => {
            expect( spyA ).toHaveBeenCalledTimes( 1 );
            expect( spyA ).toHaveBeenCalledWith( [ {}, 'OptionsA' ] );
        } );

        expect( result ).rejects.toEqual( { middleware: "MA", reason: 'rejectValue' } );

    } );
} );
