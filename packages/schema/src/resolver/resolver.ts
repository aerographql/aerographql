
import 'reflect-metadata';
import {
    Provider,
    META_KEY_RESOLVERS_MAP, METAOBJECT_TYPES,
    META_KEY_DESIGN_TYPE, isOfMetaObjectType, getMetaObject, convertTypeFromTsToGraphQL, ensureMetadata
} from 'aerographql-core';
import { ArgsMetaObject, getArgsMetaObject } from '../arg';
import { ObjectDefinitionMetaObject } from '../object';
import { MiddlewareDescriptor } from '../middleware';

/**
 * Field Implementation decorator
 */
export function Resolver( config: ResolverConfig ): MethodDecorator {

    return function ( target: Object, resolverName: string ) {

        // Prepare desc
        let desc = null;
        if ( config.description ) desc = config.description;

        // Check if type is an array
        let list = false;
        if ( config.list !== undefined ) {
            list = config.list;
        } else {
            let t = Reflect.getMetadata( META_KEY_DESIGN_TYPE, target, resolverName );
            if ( t.name === 'Array' ) list = true;
        }

        // Extract instance token
        let instanceToken = target.constructor.name;

        // Extract resolver type
        let type = config.type as string;
        if ( typeof config.type === "function" ) {
            if ( isOfMetaObjectType( config.type, METAOBJECT_TYPES.scalar ) ||
                isOfMetaObjectType( config.type, METAOBJECT_TYPES.interface ) ||
                isOfMetaObjectType( config.type, METAOBJECT_TYPES.objectDefinition )  ||
                isOfMetaObjectType( config.type, METAOBJECT_TYPES.union )) {
                    
                let m = getMetaObject( config.type ) as any;
                type = m.name;
            } else {
                throw new Error( `Field "${resolverName}" is neither a scalar, an interface, an object or an union type` )
            }
        }

        // Prepare middleware
        // If middleware is null this indicated that they can be ovverided by middleware specified at a higher level (e.g: type level)
        let middlewares: MiddlewareDescriptor[] = [];
        if ( config.middlewares ) {
            middlewares = config.middlewares;
        }

        // Extract any args metadata for this field
        let args = getArgsMetaObject( target.constructor, resolverName );

        let resolvers = ensureMetadata<ResolverMetaObjectMap>( META_KEY_RESOLVERS_MAP, target.constructor, {} );
        if ( resolvers[ resolverName ] )
            throw new Error( `Field "${resolverName}" already has an implementation` );

        resolvers[ resolverName ] = {
            instanceToken: instanceToken,
            description: desc,
            type: type,
            list: list,
            nullable: !!config.nullable,
            args: args,
            middlewares: middlewares
        };

    }
}

export interface ResolverConfig {
    name?: string,
    type?: string | Function,
    nullable?: boolean,
    list?: boolean,
    description?: string,
    middlewares?: MiddlewareDescriptor[];
}

export interface ResolverMetaObject {
    type: string,
    list: boolean,
    nullable: boolean,
    description: string,
    args: ArgsMetaObject,
    instanceToken: string,
    middlewares: MiddlewareDescriptor[];
}

export type ResolverMetaObjectMap = { [ key: string ]: ResolverMetaObject };
