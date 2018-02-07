
import 'reflect-metadata';
import {
    Provider,
    META_KEY_METAOBJECT, META_KEY_RESOLVERS_MAP, METAOBJECT_TYPES, MiddlewareDescriptor,
    META_KEY_METAOBJECT_TYPE, getFunctionParametersName, META_KEY_DESIGN_PARAMSTYPES, META_KEY_ARGS_MAP,
    META_KEY_DESIGN_TYPE, isOfMetaObjectType, getMetaObject, convertTypeFromTsToGraphQL, ensureMetadata, getMetaObjectType
} from 'aerographql-core';
import { ResolverMetaObjectMap } from '../resolver';
import { ArgsMetaObject, getArgsMetaObject } from '../arg';
import { InterfaceMetaObject } from '../interface';
import { ObjectDefinitionMetaObject } from './object-definition';

/**
 * Resolver decorator definition
 */
export function ObjectImplementation( config: ObjectImplementationConfig = {} ) {

    return function ( ctr: Function ) {

        let desc = null;
        if ( config.description ) desc = config.description;

        let name = ctr.name;
        if ( config.name ) name = config.name;

        let implementInterfaces: Function[] = [];
        if ( config.implements )
            implementInterfaces = config.implements;

        // Add this object to the list of implementers of each interfaces
        implementInterfaces.forEach( i => {
            if ( getMetaObjectType( i ) !== METAOBJECT_TYPES.interface )
                throw new Error( 'Object implementation "${config.name}" implement an invalid interface' );

            let mo = getMetaObject<InterfaceMetaObject>( i, METAOBJECT_TYPES.interface );
            mo.implementers.push( ctr );
        } );

        // Extract middleware defined at the type level 
        let typeMiddlewares: MiddlewareDescriptor[] = [];
        if ( config.middlewares ) {
            typeMiddlewares = config.middlewares;
        }

        let fieldsImpl = ensureMetadata<ResolverMetaObjectMap>( META_KEY_RESOLVERS_MAP, ctr, {} );

        // Override middleware at the field level if they are not provided
        for ( let key in fieldsImpl ) {
            let field = fieldsImpl[ key ];
            if ( field.middlewares.length === 0 ) {
                field.middlewares = typeMiddlewares
            }
        }

        let md: ObjectImplementationMetaObject = {
            name: name,
            resolvers: fieldsImpl,
            implements: implementInterfaces,
            description: desc
        };

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.objectImplementation, ctr );
    }
}


export interface ObjectImplementationConfig {
    name?: string;
    description?: string;
    implements?: Function[];
    middlewares?: MiddlewareDescriptor[];
}

export interface ObjectImplementationMetaObject {
    name: string;
    resolvers: ResolverMetaObjectMap;
    description: string;
    implements: Function[];
}
