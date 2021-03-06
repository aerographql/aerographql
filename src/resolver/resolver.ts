
import { Provider } from '../di';
import { MiddlewareDescriptor } from '../middleware';
import {
    META_KEY_RESOLVERS_MAP, METAOBJECT_TYPES, getMetadata,
    META_KEY_DESIGN_RETURNTYPE, isOfMetaObjectType, getMetaObject, convertTypeFromTsToGraphQL, safeGetMetadata
} from '../shared';
import { ArgsMetaObject, getArgsMetaObject } from '../arg';
import { ObjectDefinitionMetaObject } from '../object';

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
            let t = getMetadata( META_KEY_DESIGN_RETURNTYPE, target, resolverName );
            if ( t && t.name === 'Array' ) list = true;
        }

        // Extract instance token
        let instanceToken = target.constructor.name;

        // Extract resolver type
        let type = config.type as string;
        if ( typeof config.type === "function" ) {
            if ( isOfMetaObjectType( config.type, METAOBJECT_TYPES.scalar ) ||
                isOfMetaObjectType( config.type, METAOBJECT_TYPES.interface ) ||
                isOfMetaObjectType( config.type, METAOBJECT_TYPES.objectDefinition ) ||
                isOfMetaObjectType( config.type, METAOBJECT_TYPES.union ) ) {

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

        let resolvers = safeGetMetadata<ResolverMetaObjectMap>( META_KEY_RESOLVERS_MAP, target.constructor, {} );
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
