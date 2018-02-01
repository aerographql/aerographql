import 'reflect-metadata';
import { FieldMetaObjectMap } from './field';
import {
    META_KEY_FIELDS_MAP, META_KEY_METAOBJECT, META_KEY_METAOBJECT_TYPE,
    METAOBJECT_TYPES, ensureMetadata
} from 'aerographql-core';

/**
 * Input defintion decorator
 */
export function InputObject( config: InputObjectConfig = {} ) {
    return function ( ctr: Function ) {
        let fields = ensureMetadata<FieldMetaObjectMap>( META_KEY_FIELDS_MAP, ctr, {} );

        let name = ctr.name;
        if ( config.name ) name = config.name;

        let desc = null;
        if ( config.description ) desc = config.description;

        let md: InputObjectMetaObject = {
            name: name,
            description: desc,
            fields: fields
        };

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.inputObject, ctr );
    }
}


export interface InputObjectConfig {
    name?: string;
    description?: string;
}

export interface InputObjectMetaObject {
    name: string;
    description: string;
    fields: FieldMetaObjectMap;
}
