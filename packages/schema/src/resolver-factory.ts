import { GraphQLFieldConfig, GraphQLNonNull, GraphQLList } from 'graphql';
import { isPromise, executePromiseSequenticaly } from 'aerographql-core';

import { ObjectDefinitionMetaObject } from './object-definition';
import { ResolverMetaObject } from './resolver';
import { FactoryContext } from './factory-context';
import { Context } from './shared';
import { MiddlewareError, MiddlewareSignature, BaseMiddleware } from './middleware';

export let resolverConfigFactory = function ( impl: ResolverMetaObject, fieldName: string, factoryContext: FactoryContext ) {
    let fieldConfig: GraphQLFieldConfig<any, any> = {
        type: null
    };

    if ( impl.description )
        fieldConfig.description = impl.description;

    // Setup the type of the field
    // Assert the type of this field exist
    if ( !factoryContext.isValidType( impl.type ) ) {
        throw new Error( `Type "${impl.type}" for field "${fieldName}" is not valid` )
    }
    // Build the type
    let type = factoryContext.lookupType( impl.type );
    if ( impl.list )
        type = new GraphQLList<any>( type );
    if ( !impl.nullable )
        type = new GraphQLNonNull<any>( type );

    fieldConfig.type = type;

    // Setup the arguments for this fields if any
    fieldConfig.args = {};
    for ( let key in impl.args ) {

        // Assert that the argument type exist
        if ( !factoryContext.isValidType( impl.args[ key ].type ) ) {
            throw new Error( `Type "${impl.args[ key ].type}" used by parameter "${key}" in field "${fieldName}" is not valid` );
        }
        // Build the type
        let argType = factoryContext.lookupType( impl.args[ key ].type );

        if ( impl.args[ key ].list )
            argType = new GraphQLList<any>( argType );
            
        if ( !impl.args[ key ].nullable )
            argType = new GraphQLNonNull<any>( argType );

        fieldConfig.args[ key ] = {
            type: argType
        }
    }

    // Create a closure that wrap the call to middleware and the resolver.
    // provide the argument in the correct way
    fieldConfig.resolve = ( source: any, args: any, context: Context ) => {

        // Wrap each middleware call in a closure that always return a promise
        let wrappedMwCalls: MiddlewareSignature[] = [];

        impl.middlewares.forEach( mwInfo => {
            let mwInstance: BaseMiddleware = factoryContext.injector.get( mwInfo.provider, null );
            if ( !mwInstance ) {
                throw new Error( `Unable to find instance at token "${mwInfo.provider}" for middleware` );
            }

            let executeFunction = mwInstance.execute;
            if ( !executeFunction ) {
                throw new Error( `No execute function found in middleware  "${mwInfo.provider}"` );
            }

            let providerName = mwInfo.provider.name;

            let closure = () => {
                // Assign current middleware options
                context.middlewareOptions = mwInfo.options;

                // Call the middleware
                let rv = Reflect.apply( executeFunction, mwInstance, [ source, args, context ] );

                // Normalize middleware return value to always return a promise
                if ( isPromise( rv ) ) {
                    // If return is a promise
                    return rv.then( value => {
                        // Reset mw option
                        context.middlewareOptions = undefined;
                        return value;
                    }, reason => {
                        // Reset mw option
                        context.middlewareOptions = undefined;
                        // Wrap the rejected value in a Middleware error that will be later on throw.
                        return Promise.reject( new MiddlewareError( providerName, reason ) );
                    } );
                } else {
                    // Reset mw option
                    context.middlewareOptions = undefined;
                    // If it's not a promise, wrap it into a promise
                    return rv ? Promise.resolve( rv ) : Promise.reject( new MiddlewareError( providerName, rv ) );
                }
            };

            // Store the closure
            wrappedMwCalls.push( closure );

        } );


        // Grab the instane of the implementation from the dependecy injection system
        let instance = factoryContext.injector.get( impl.instanceToken, null );
        if ( !instance ) {
            throw new Error( `Unable to find instance at token "${impl.instanceToken}" for resolver` );
        }

        // Grab the resolve function itself
        let resolveFunction = instance[ fieldName ];
        if ( !resolveFunction ) {
            throw new Error( `No resolver function found for field  "${fieldName}" of on resolver` );
        }

        // For each graphql arguments, insert them in an array with the same order 
        // as they appear in the implemention field's reseolver
        let expandedArgs: any[] = [ undefined ];
        for ( let key in impl.args ) {
            let arg = impl.args[ key ];
            expandedArgs[ arg.index ] = args[ key ];
        }

        // If the graphql source argument was used, provide it
        if ( expandedArgs[ 0 ] === undefined )
            expandedArgs[ 0 ] = source;

        // And provide the graphql context
        expandedArgs.push( context );

        // Execute each wrapped middleware call sequentialy
        return executePromiseSequenticaly( wrappedMwCalls ).then( results => {
            // Attach middleware results
            if ( !context ) context = {
                credentials: null,
                middlewareResults: []
            };
            context.middlewareResults = results;
            return Reflect.apply( resolveFunction, instance, expandedArgs );
        }, ( middlewareError: MiddlewareError ) => {
            // Throw error, so it will be catched by the graphql layer
            throw middlewareError;
        } );

    };

    return fieldConfig;
}
