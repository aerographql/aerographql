
import {
    META_KEY_ARGS_MAP,
    META_KEY_METAOBJECT_TYPE, getFunctionParametersName, META_KEY_DESIGN_PARAMSTYPES,
    isOfMetaObjectType, getMetaObject, convertTypeFromTsToGraphQL, safeGetMetadata, getMetadata
} from '../shared';

import { ObjectDefinitionMetaObject } from '../object';

/**
 * Arg defintion
 */
export function Arg( config: ArgConfig = { nullable: false, list: false } ) {

    return function ( target: any, fieldName: string, index: number ): void {
        let classArgMap = safeGetMetadata<ArgsMetaObjectMap>( META_KEY_ARGS_MAP, target.constructor, {} );

        let paramNames = getFunctionParametersName( target[ fieldName ] );
        let argName = paramNames[ index ];

        if ( !classArgMap[ fieldName ] )
            classArgMap[ fieldName ] = {};

        let meyhodArgMap = classArgMap[ fieldName ];

        let nullable = !!config.nullable;
        if ( config.nullable === undefined ) nullable = false;

        let paramTypes: any[] = getMetadata( META_KEY_DESIGN_PARAMSTYPES, target, fieldName );

        let list = !!config.list;
        let inferedType = paramTypes[ index ];
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

        meyhodArgMap[ argName ] = {
            index: index,
            nullable: nullable,
            type: type,
            list: list
        };
    }
}

export interface ArgConfig {
    nullable?: boolean;
    list?: boolean;
    type?: string | Function;
}

export interface ArgMetaObject {
    type: string;
    nullable: boolean;
    index: number;
    list: boolean;
}

export type ArgsMetaObject = { [ key: string ]: ArgMetaObject };
export type ArgsMetaObjectMap = { [ key: string ]: ArgsMetaObject };

export function getArgsMetaObject( target: any, fieldName: string ) {
    let fieldArgsMetadataMap: ArgsMetaObjectMap = getArgsMetaObjectMap( target );

    let fieldArgsMetadata: ArgsMetaObject = {};
    if ( fieldArgsMetadataMap && fieldArgsMetadataMap[ fieldName ] )
        fieldArgsMetadata = fieldArgsMetadataMap[ fieldName ];

    return fieldArgsMetadata;
}

/**
 * Return a map where each entry is a field on the passed target and where each of these field contain 
 * a map associating an arguments name to it's meta object
 * @param target 
 */
export function getArgsMetaObjectMap( target: Function ) {
    let classArgMap: ArgsMetaObjectMap = getMetadata( META_KEY_ARGS_MAP, target );
    return classArgMap;
}
