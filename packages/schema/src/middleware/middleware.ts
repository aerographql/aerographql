import 'reflect-metadata';
import {
    META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES,
    deduplicateArray, getMetaObjectType, isPromise, executeAsyncFunctionSequentialy
} from 'aerographql-core';
import { Context, FactoryContext } from '../shared';

/**
 * Middleware decorator
 */
export function Middleware() {
    return function ( ctr: Function ) {
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.middleware, ctr );
    }
}

export interface BaseMiddleware<T=any> {
    execute( src: any, args: any, context: Context ): T | Promise<T>;
}

export class MiddlewareError {
    constructor( public middleware: string, public reason: string ) {
    }
    toString() {
        return `Middleware "${this.middleware}" error with reason "${this.reason}"`;
    }
}

export interface MiddlewareDescriptor {
    provider: Function;
    options?: any;
    resultName?: string;
}

export type MiddlewareResolver = ( src: any, args: any, context: Context ) => Promise<any>;

export let createMiddlewareSequence = ( middlewares: MiddlewareDescriptor[], factoryContext: FactoryContext ) => {

    // Wrap each middleware call in a closure that always return a promise
    let mwSequence: MiddlewareResolver[] = [];

    middlewares.forEach( mwDesc => {

        let mwInstance: BaseMiddleware = factoryContext.injector.get( mwDesc.provider, null );
        if ( !mwInstance ) {
            throw new Error( `Unable to find instance at token "${mwDesc.provider}" for middleware` );
        }

        let executeFunction = mwInstance.execute;
        if ( !executeFunction ) {
            throw new Error( `No execute function found in middleware  "${mwDesc.provider}"` );
        }

        let closure = ( source: any, args: any, context: Context ) => {

            // Normalize context
            if ( !context ) context = {};
            if ( !context.middlewareResults ) context.middlewareResults = {};

            // Assign current middleware options
            context.middlewareOptions = mwDesc.options;

            // Call the middleware
            let rv = Reflect.apply( executeFunction, mwInstance, [ source, args, context ] );

            let providerName = mwDesc.provider.name;

            // Normalize middleware return value to always return a promise
            if ( isPromise( rv ) ) {
                // If return is a promise
                return rv.then( result => {
                    // Reset mw option
                    delete context.middlewareOptions;

                    // If result must be stored
                    if ( mwDesc.resultName ) {
                        if ( !context.middlewareResults[ mwDesc.resultName ] ) context.middlewareResults[ mwDesc.resultName ] = [];
                        context.middlewareResults[ mwDesc.resultName ].push( result );
                    }

                    return result;
                }, reason => {
                    // Reset mw option
                    delete context.middlewareOptions;
                    // Wrap the rejected value in a Middleware error that will be later on throw.
                    return Promise.reject( new MiddlewareError( providerName, reason ) );
                } );
            } else {
                // Reset mw option
                delete context.middlewareOptions;

                // If result must be stored
                if ( rv && mwDesc.resultName ) {
                    if ( !context.middlewareResults[ mwDesc.resultName ] ) context.middlewareResults[ mwDesc.resultName ] = [];
                    context.middlewareResults[ mwDesc.resultName ].push( rv );
                }
                // If it's not a promise, wrap it into a promise
                return rv ? Promise.resolve( rv ) : Promise.reject( new MiddlewareError( providerName, rv ) );
            }
        };

        // Store the closure
        mwSequence.push( closure );

    } );

    return mwSequence;

}
