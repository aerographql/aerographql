import { GraphQLFieldConfig, GraphQLNonNull, GraphQLList } from 'graphql';

import { MiddlewareInterface, createMiddlewareSequence } from '../middleware';
import { ObjectDefinitionMetaObject } from '../object';
import { ResolverMetaObject } from './resolver';
import { isPromise, executeAsyncFunctionSequentialy, FactoryContext } from '../shared';

export let resolverConfigFactory = function ( metaObject: ResolverMetaObject, fieldName: string, factoryContext: FactoryContext, createResolver = true ) {
    let fieldConfig: GraphQLFieldConfig<any, any> = {
        type: null
    };

    if ( metaObject.description )
        fieldConfig.description = metaObject.description;

    // Setup the type of the field
    // Assert the type of this field exist
    if ( !factoryContext.isValidType( metaObject.type ) ) {
        throw new Error( `Type "${metaObject.type}" for field "${fieldName}" is not valid` )
    }
    // Build the type
    let type = factoryContext.lookupType( metaObject.type );
    if ( metaObject.list )
        type = new GraphQLList<any>( type );
    if ( !metaObject.nullable )
        type = new GraphQLNonNull<any>( type );

    fieldConfig.type = type;

    // Setup the arguments for this fields if any
    fieldConfig.args = {};
    for ( let key in metaObject.args ) {

        // Assert that the argument type exist
        if ( !factoryContext.isValidType( metaObject.args[ key ].type ) ) {
            throw new Error( `Type "${metaObject.args[ key ].type}" used by parameter "${key}" in field "${fieldName}" is not valid` );
        }
        // Build the type
        let argType = factoryContext.lookupType( metaObject.args[ key ].type );

        if ( metaObject.args[ key ].list )
            argType = new GraphQLList<any>( argType );

        if ( !metaObject.args[ key ].nullable )
            argType = new GraphQLNonNull<any>( argType );

        fieldConfig.args[ key ] = {
            type: argType
        }
    }

    // Create a closure that wrap the call to middleware and the resolver.
    // provide the argument in the correct way
    if( createResolver ) {

        fieldConfig.resolve = ( source: any, args: any, context: any ) => {
    
            // Build the middleware chain
            let middlewareSequence = createMiddlewareSequence( metaObject.middlewares, factoryContext.injector );
    
            // Grab the instance of the implementation from the dependecy injection system
            let instance = factoryContext.injector.get( metaObject.instanceToken, null );
            if ( !instance ) {
                throw new Error( `Unable to find instance at token "${metaObject.instanceToken}" for resolver` );
            }
    
            // For each graphql arguments, insert them in an array with the same order 
            // as they appear in the implemention field's reseolver
            let expandedArgs: any[] = [ undefined ];
            for ( let key in metaObject.args ) {
                let arg = metaObject.args[ key ];
                expandedArgs[ arg.index ] = args[ key ];
            }
    
            // If the graphql source argument was used, provide it
            if ( expandedArgs[ 0 ] === undefined )
                expandedArgs[ 0 ] = source;
    
            // And provide the graphql context
            expandedArgs.push( context );
    
            // Grab the resolve function itself
            let resolveFunction = instance[ fieldName ];
            if ( !resolveFunction ) {
                throw new Error( `No resolver function found for field  "${fieldName}" of on resolver` );
            }
    
            // 
            if ( !context ) context = {};
    
            // Execute each middleware sequentialy
            let p = executeAsyncFunctionSequentialy( middlewareSequence, [ source, args, context ] );
    
            return p.then( results => {
                let p = Reflect.apply( resolveFunction, instance, expandedArgs );
                return p;
            }, ( error ) => {
                // Throw error, so it will be catched by the graphql layer
                throw error;
            } );
        };
    }

    return fieldConfig;
}
