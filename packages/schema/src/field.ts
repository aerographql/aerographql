import 'reflect-metadata';
import {
    META_KEY_DESIGN_TYPE, META_KEY_FIELDS_MAP, ensureMetadata, getMetaObject,
    isOfMetaObjectType, METAOBJECT_TYPES, convertTypeFromTsToGraphQL, getMetaObjectType
} from 'aerographql-core';

/**
 * Field.
 * This add metadata on the object constructor, containing a map where keys are fields of this type and values ara
 * associated metadata for each field
 */
export function Field( config: FieldConfig = {} ) {
    return function ( target: Object, property: string ): void {

        let desc = null;
        if ( config.description ) desc = config.description;

        let name = property;
        if ( config.name ) name = config.name;

        let nullable = !!config.nullable;
        if ( config.nullable === undefined ) {
            nullable = false;
        }

        let list = false;
        let inferedType = Reflect.getMetadata( META_KEY_DESIGN_TYPE, target, property );
        if ( inferedType && inferedType.name === 'Array' ) {
            list = true;
        }

        let type = '';
        if ( !config.type ) {
            if ( list )
                throw new Error( 'Field type must be explicilty provided when field is a list' );

            let metaObject = getMetaObject( inferedType );
            if ( metaObject ) {
                type = metaObject.name;
            } else {
                type = convertTypeFromTsToGraphQL( inferedType.name );
            }
        }
        else if ( typeof config.type === 'function' ) {
            let metaObject = getMetaObject( config.type );
            if ( metaObject ) {
                type = metaObject.name;
            } else {
                type = convertTypeFromTsToGraphQL( config.type.name );
            }
        } else {
            type = config.type;
        }

        let fields = ensureMetadata<FieldMetaObjectMap>( META_KEY_FIELDS_MAP, target.constructor, {} );
        if ( fields[ name ] )
            throw new Error( `Field "${name}" already has a definition` );

        fields[ name ] = {
            list: list,
            description: desc,
            type: type,
            nullable: nullable
        };
    }
}

export type FieldMetaObjectMap = { [ key: string ]: FieldMetaObject };

export interface FieldConfig {
    type?: string | Function;
    nullable?: Boolean;
    description?: string;
    name?: string;
}

export interface FieldMetaObject {
    type: string;
    nullable: Boolean;
    list: Boolean;
    description: string;
}
