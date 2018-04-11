import {
    META_KEY_FIELDS_MAP, META_KEY_METAOBJECT, META_KEY_METAOBJECT_TYPE,
    METAOBJECT_TYPES, safeGetMetadata, setMetadata
} from '../shared';
import { FieldMetaObjectMap } from '../field';

/**
 * Input defintion decorator
 */
export function InputObject( config: InputObjectConfig = {} ) {
    return function ( ctr: Function ) {
        let fields = safeGetMetadata<FieldMetaObjectMap>( META_KEY_FIELDS_MAP, ctr, {} );

        let name = ctr.name;
        if ( config.name ) name = config.name;

        let desc = null;
        if ( config.description ) desc = config.description;

        let md: InputObjectMetaObject = {
            name: name,
            description: desc,
            fields: fields
        };

        setMetadata( META_KEY_METAOBJECT, md, ctr );
        setMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.inputObject, ctr );
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
