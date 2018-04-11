import { FieldMetaObjectMap } from '../field';
import {
    ResolveTypeFunction, META_KEY_METAOBJECT, META_KEY_FIELDS_MAP, META_KEY_METAOBJECT_TYPE,
    METAOBJECT_TYPES, setMetadata
} from '../shared';


/**
 * Union definition decorator
 */
export function Union( config: UnionConfig ) {
    return function ( ctr: Function ) {

        let name = ctr.name;
        if ( config.name ) name = config.name;
        let desc = null;
        if ( config.description ) desc = config.description;

        let md: UnionMetaObject = {
            name: name,
            description: desc,
            types: config.types,
            resolveType: config.resolveType
        };

        setMetadata( META_KEY_METAOBJECT, md, ctr );
        setMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.union, ctr );
    }
}
export interface UnionConfig {
    name?: string;
    types: Function[];
    description?: string;
    resolveType?: ResolveTypeFunction;
}
export interface UnionMetaObject {
    name: string;
    types: Function[];
    description: string;
    resolveType: ResolveTypeFunction;
}
