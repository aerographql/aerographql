import {
    META_KEY_METAOBJECT, META_KEY_FIELDS_MAP, META_KEY_METAOBJECT_TYPE,
    METAOBJECT_TYPES, safeGetMetadata, getMetaObject, getMetaObjectType, setMetadata
} from '../shared';

import { InterfaceMetaObject } from '../interface';
import { FieldMetaObjectMap } from '../field';


/**
 * Type definition
 */
export function ObjectDefinition( config: ObjectDefinitionConfig = {} ) {

    return function ( ctr: Function ) {

        let fields = safeGetMetadata<FieldMetaObjectMap>( META_KEY_FIELDS_MAP, ctr, {} );

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
                throw new Error( 'Object definition "${config.name}" implement an invalid interface' );

            let mo = getMetaObject<InterfaceMetaObject>( i, METAOBJECT_TYPES.interface );
            mo.implementers.push( ctr );
        } );

        let md: ObjectDefinitionMetaObject = {
            name: name,
            description: desc,
            implements: implementInterfaces,
            fields: fields
        };

        setMetadata( META_KEY_METAOBJECT, md, ctr );
        setMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.objectDefinition, ctr );
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
    implements: Function[];
}

