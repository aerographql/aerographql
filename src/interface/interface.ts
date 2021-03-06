import { FieldMetaObjectMap } from '../field';
import {
    META_KEY_METAOBJECT, META_KEY_FIELDS_MAP, META_KEY_METAOBJECT_TYPE,
    METAOBJECT_TYPES, safeGetMetadata, ResolveTypeFunction, META_KEY_RESOLVERS_MAP, setMetadata
} from '../shared';

import { ResolverMetaObjectMap } from '../resolver';
/**
 * Interface definition decorator
 */
export function Interface( config: InterfaceConfig = {} ) {
    return function ( ctr: Function ) {

        let fields: FieldMetaObjectMap = safeGetMetadata<FieldMetaObjectMap>( META_KEY_FIELDS_MAP, ctr, {} );

        let name = ctr.name;
        if ( config.name ) name = config.name;
        let desc = null;
        if ( config.description ) desc = config.description;

        let fieldsImpl = safeGetMetadata<ResolverMetaObjectMap>( META_KEY_RESOLVERS_MAP, ctr, {} );

        let md: InterfaceMetaObject = {
            name: name,
            description: desc,
            fields: fields,
            resolvers: fieldsImpl,
            resolveType: config.resolveType,
            implementers: []
        };

        setMetadata( META_KEY_METAOBJECT, md, ctr );
        setMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.interface, ctr );
    }
}
export interface InterfaceConfig {
    name?: string;
    description?: string;
    resolveType?: ResolveTypeFunction;
}
export interface InterfaceMetaObject {
    name: string;
    description: string;
    fields: FieldMetaObjectMap;
    resolveType: ResolveTypeFunction;
    implementers: Function[];
    resolvers: ResolverMetaObjectMap;
}
