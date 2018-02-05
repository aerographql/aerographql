import 'reflect-metadata';
import {
    META_KEY_METAOBJECT, META_KEY_FIELDS_MAP, META_KEY_METAOBJECT_TYPE,
    METAOBJECT_TYPES, ensureMetadata
} from 'aerographql-core';
import { FieldMetaObjectMap } from '../field';
import { ResolveTypeFunction } from '../shared';

/**
 * Interface definition decorator
 */
export function Interface( config: InterfaceConfig = {} ) {
    return function ( ctr: Function ) {

        let fields: FieldMetaObjectMap = ensureMetadata<FieldMetaObjectMap>( META_KEY_FIELDS_MAP, ctr, {} );

        let name = ctr.name;
        if ( config.name ) name = config.name;
        let desc = null;
        if ( config.description ) desc = config.description;

        let md: InterfaceMetaObject = {
            name: name,
            description: desc,
            fields: fields,
            resolveType: config.resolveType
        };

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.interface, ctr );
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
}
