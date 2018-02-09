import 'reflect-metadata';
import { Injector } from '../di';

import {
    META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES,
    deduplicateArray, getMetaObjectType, isPromise
} from '../shared';

/**
 * Middleware decorator
 */
export function Middleware() {
    return function ( ctr: Function ) {
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.middleware, ctr );
    }
}

/**
 * Interface that need to be implemented be every Middleware
 */
export interface BaseMiddleware<T=any> {
    execute( src: any, args: any, context: any, options: any ): T | Promise<T>;
}

class MiddlewareError {
    constructor( public middleware: string, public reason: string ) {
    }
    toString() {
        return `Middleware "${this.middleware}" error with reason "${this.reason}"`;
    }
}

/** 
 * Structure describing how a mw should be called and how to store it's results.
*/
export interface MiddlewareDescriptor {
    provider: Function;
    options?: any;
    resultName?: string;
}

type MiddlewareResolver = ( src: any, args: any, context: any ) => Promise<any>;


let storeResultInContext = ( result: any, context: any, field: string ) => {
    if ( !context[ field ] ) {
        context[ field ] = result;
    }
    else {
        if ( Array.isArray( context[ field ] ) ) {
            context[ field ].push( result );
        } else {
            let firstResult = context[ field ];
            context[ field ] = [ firstResult, result ];
        }
    }
};


/**
 * Convert a list of Mw descriptor into a list of Function wrapping the AeroGraphQL behavior for middleware.
 * Those functions will take care of setting the options for the each MW and store MW results appropriatly in the Context
 * @param middlewares 
 * @param factoryContext 
 */
export let createMiddlewareSequence = ( middlewares: MiddlewareDescriptor[], injector: Injector ) => {

    // Wrap each middleware call in a closure that always return a promise
    let mwSequence: MiddlewareResolver[] = [];

    middlewares.forEach( mwDesc => {

        let mwInstance: BaseMiddleware = injector.get( mwDesc.provider, null );
        if ( !mwInstance ) {
            throw new Error( `Unable to find instance at token "${mwDesc.provider}" for middleware` );
        }

        let executeFunction = mwInstance.execute;
        if ( !executeFunction ) {
            throw new Error( `No execute function found in middleware  "${mwDesc.provider}"` );
        }

        let closure = ( source: any, args: any, context: any ) => {

            let providerName = mwDesc.provider.name;

            // Normalize context
            if ( !context ) context = {};

            // Call the middleware
            let rv: any;
            try {
                rv = Reflect.apply( executeFunction, mwInstance, [ source, args, context, mwDesc.options ] );
            } catch ( reason ) {
                let o = reason;
                if ( reason.message ) o = reason.message;

                return Promise.reject( new MiddlewareError( providerName, o ) );
            }

            // Normalize middleware return value to always return a promise
            if ( isPromise( rv ) ) {
                // If return is a promise
                return rv.then( result => {
                    // If result must be stored
                    if ( mwDesc.resultName ) {
                        storeResultInContext( result, context, mwDesc.resultName );
                    }

                    return result;
                }, reason => {
                    // Wrap the rejected value in a Middleware error that will be later on throw.
                    return Promise.reject( new MiddlewareError( providerName, reason ) );
                } );
            } else {
                // If result must be stored
                if ( rv ) {
                    if ( mwDesc.resultName ) {
                        storeResultInContext( rv, context, mwDesc.resultName );
                    }

                    return Promise.resolve( rv );
                } else {
                    return Promise.reject( new MiddlewareError( providerName, rv ) );
                }
            }
        };

        // Store the closure
        mwSequence.push( closure );

    } );

    return mwSequence;

}
