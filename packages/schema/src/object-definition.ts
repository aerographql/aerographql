import 'reflect-metadata';
import {
    META_KEY_METAOBJECT, META_KEY_FIELDS_MAP, META_KEY_METAOBJECT_TYPE,
    METAOBJECT_TYPES, ensureMetadata
} from 'aerographql-core';

import { InterfaceMetaObject } from './interface';
import { FieldMetaObjectMap } from './field';


/**
 * Type definition
 */
export function ObjectDefinition( config: ObjectDefinitionConfig = {} ) {

    return function ( ctr: Function ) {

        let fields = ensureMetadata<FieldMetaObjectMap>( META_KEY_FIELDS_MAP, ctr, {} );
        let implementInterfaces: string[] = [];

        let desc = null;
        if ( config.description ) desc = config.description;

        let name = ctr.name;
        if ( config.name ) name = config.name;

        if ( config.implements )
            implementInterfaces = config.implements.map( interfaceCtr => {
                let interfaceMd: InterfaceMetaObject = Reflect.getMetadata( META_KEY_METAOBJECT, interfaceCtr );
                return interfaceMd.name;
            } );

        if ( !fields ) fields = {};

        let md: ObjectDefinitionMetaObject = {
            name: name,
            description: desc,
            implements: implementInterfaces,
            fields: fields
        };

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.objectDefinition, ctr );
    }
}

export interface ObjectDefinitionConfig {
    name?: string;
    description?: string;
    implements?: Function[];
}

export interface ObjectDefinitionMetaObject {
    name: string;
    description: string;
    fields: FieldMetaObjectMap;
    implements: string[];
}

