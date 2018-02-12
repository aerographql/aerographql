
import { getMetaObject } from '../shared';
import { executeMiddlewares, createInjectable } from '../test';
import { createMiddlewareSequence, MiddlewareDescriptor, Middleware, MiddlewareInterface, } from './middleware';

describe( 'createMiddlewareSequence function', () => {

    let cloneObject = ( obj: any ) => {
        return JSON.parse( JSON.stringify( obj ) );
    };
    it( 'should work with one middleware', async () => {

        @Middleware()
        class MA implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { return 'A'; }
        }
        let descs: MiddlewareDescriptor[] = [ { middleware: MA, options: 'Options', resultName: 'result' } ];
    
        let context:any = {};
        let p = executeMiddlewares( descs, { context } ).then( ( r ) => {
            expect( context ).toHaveProperty( 'result');
            expect( context.result ).toEqual( 'A' )
            return r;
        } );
        expect( p ).resolves.toBeTruthy();
    
    } );

    it( 'should throw if middleware does not have an execute function', () => {
        class MA { }
        let descs: MiddlewareDescriptor[] = [ { middleware: MA } ];
        expect( () => executeMiddlewares( descs ) ).toThrowError();
    } );

    it( 'should work with an empty middleware list', () => {
        let descs: MiddlewareDescriptor[] = [];
        expect( executeMiddlewares( descs ) ).resolves.toEqual( [] );
    } );

    it( 'should work with one middleware', async () => {

        let spy = jest.fn();
        @Middleware()
        class MA implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { spy( options ); return 'A'; }
        }
        let descs: MiddlewareDescriptor[] = [ { middleware: MA, options: 'Options' } ];

        let p = executeMiddlewares( descs ).then( ( r ) => {
            expect( r ).toEqual( [ "A" ] );
            expect( spy ).toHaveBeenCalledTimes( 1 );
            expect( spy ).toHaveBeenCalledWith( 'Options' );
            return r;
        } );
        expect( p ).resolves.toBeTruthy();

    } );

    it( 'should store middlewares results when returing a promise', () => {
        @Middleware()
        class MA implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { return Promise.resolve( 'A' ); }
        }

        let descs: MiddlewareDescriptor[] = [
            { middleware: MA,  resultName: 'A' }
        ];
        let context: any = {};
        let p = executeMiddlewares( descs, { context } ).then( ( result ) => {
            expect( context ).toEqual( { A: 'A' } );
            return result;
        } );
        return expect( p ).resolves.toBeTruthy();
    } );
    it( 'should store middlewares results with the same name in an array ', () => {
        @Middleware()
        class MA implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { return 'A'; }
        }
        @Middleware()
        class MB implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { return 'B'; }
        }
        @Middleware()
        class MC implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { return 'C'; }
        }
        let descs: MiddlewareDescriptor[] = [
            { middleware: MA, options: 'OptionsA', resultName: 'A' },
            { middleware: MB, options: 'OptionsB', resultName: 'A' },
            { middleware: MC, options: 'OptionsC', resultName: 'A' }
        ];
        let context: any = {};
        let p = executeMiddlewares( descs, { context } ).then( ( result ) => {
            expect( context ).toEqual( { A: [ 'A', 'B', 'C' ] } );
            return result;
        } );
        return expect( p ).resolves.toBeTruthy();
    } );

    it( 'should store middlewares results with the different name directly in the context ', () => {
        @Middleware()
        class MA implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { return 'A'; }
        }
        @Middleware()
        class MB implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { return 'B'; }
        }
        let descs: MiddlewareDescriptor[] = [
            { middleware: MA, options: 'OptionsA', resultName: 'A' },
            { middleware: MB, options: 'OptionsB', resultName: 'B' }
        ];
        let context: any = {};
        let p = executeMiddlewares( descs, { context } ).then( ( result ) => {
            expect( context ).toEqual( { A: 'A', B: 'B' } );
            return result;
        } );
        return expect( p ).resolves.toBeTruthy();
    } );

    it( 'should work with multiple middleware', () => {

        let spyA = jest.fn();
        let spyB = jest.fn();
        let spyC = jest.fn();
        @Middleware()
        class MA implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { spyA( [ cloneObject( context ), cloneObject( options ) ] ); return 'A'; }
        }

        @Middleware()
        class MB implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { spyB( [ cloneObject( context ), cloneObject( options ) ] ); return 'B'; }
        }

        @Middleware()
        class MC implements MiddlewareInterface<string> {
            execute( src: any, args: any, context: any, options: any ) { spyC( [ cloneObject( context ), cloneObject( options ) ] ); return 'C'; }
        }

        let descs: MiddlewareDescriptor[] = [
            { middleware: MA, options: 'OptionsA', resultName: 'A' },
            { middleware: MB, options: 'OptionsB', resultName: 'B' },
            { middleware: MC, options: 'OptionsC', resultName: 'C' }
        ];

        let p = executeMiddlewares( descs, { context: {} } ).then( ( result ) => {
            expect( spyA ).toHaveBeenCalledTimes( 1 );
            expect( spyA ).toHaveBeenCalledWith( [ {}, 'OptionsA' ] );
            expect( spyB ).toHaveBeenCalledTimes( 1 );
            expect( spyB ).toHaveBeenCalledWith( [ { A: "A" }, 'OptionsB' ] );
            expect( spyC ).toHaveBeenCalledTimes( 1 );
            expect( spyC ).toHaveBeenCalledWith( [ { A: "A", B: "B" }, 'OptionsC' ] );
            return result;
        } );

        return expect( p ).resolves.toBeTruthy();
    } );

    it( 'should handle sync error correctly', () => {

        let spyA = jest.fn();

        @Middleware()
        class MA implements MiddlewareInterface<boolean> {
            execute( src: any, args: any, context: any, options: any ) { spyA( [ cloneObject( context ), cloneObject( options ) ] ); return false; }
        }

        let descs: MiddlewareDescriptor[] = [
            { middleware: MA, options: 'OptionsA', resultName: 'A' }
        ];

        let p = executeMiddlewares( descs, { context: {} } ).then( () => {
            expect( spyA ).toHaveBeenCalledTimes( 1 );
            expect( spyA ).toHaveBeenCalledWith( [ {}, 'OptionsA' ] );
        } );

        expect( p ).rejects.toEqual( { middleware: "MA", reason: false } );

    } );

    it( 'should handle async error correctly', () => {

        let spyA = jest.fn();

        @Middleware()
        class MA implements MiddlewareInterface<boolean> {
            execute( src: any, args: any, context: any, options: any ) { spyA( [ cloneObject( context ), cloneObject( options ) ] ); return Promise.reject( 'rejectValue' ); }
        }

        let descs: MiddlewareDescriptor[] = [
            { middleware: MA, options: 'OptionsA', resultName: 'A' }
        ];

        let p = executeMiddlewares( descs, { context: {} } ).then( () => {
            expect( spyA ).toHaveBeenCalledTimes( 1 );
            expect( spyA ).toHaveBeenCalledWith( [ {}, 'OptionsA' ] );
        } );
        expect( p ).rejects.toEqual( { middleware: "MA", reason: 'rejectValue' } );

    } );

    it( 'should handle exception error correctly', () => {

        let spyA = jest.fn();

        @Middleware()
        class MA implements MiddlewareInterface<any> {
            execute( src: any, args: any, context: any, options: any ) { spyA( [ cloneObject( context ), cloneObject( options ) ] ); throw new Error( 'errorValue' ); }
        }

        let descs: MiddlewareDescriptor[] = [
            { middleware: MA, options: 'OptionsA', resultName: 'A' }
        ];

        let p = executeMiddlewares( descs, { context: {} } ).then( () => {
            expect( spyA ).toHaveBeenCalledTimes( 1 );
            expect( spyA ).toHaveBeenCalledWith( [ {}, 'OptionsA' ] );
        } );

        expect( p ).rejects.toEqual( { middleware: "MA", reason: 'errorValue' } );

    } );
} );
