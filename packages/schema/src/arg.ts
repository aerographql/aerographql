
import 'reflect-metadata';
import {
    META_KEY_ARGS_MAP,
    META_KEY_METAOBJECT_TYPE, getFunctionParametersName, META_KEY_DESIGN_PARAMSTYPES,
    isOfMetaObjectType, getMetaObject, convertTypeFromTsToGraphQL, ensureMetadata
} from 'aerographql-core';

import { ObjectDefinitionMetaObject } from './object-definition';

/**
 * Arg defintion
 */
export function Arg( config: ArgConfig = { nullable: false } ) {

    return function ( target: any, fieldName: string, index: number ): void {
        let classArgMap = ensureMetadata<ArgsMetaObjectMap>( META_KEY_ARGS_MAP, target.constructor, {} );

        let paramNames = getFunctionParametersName( target[ fieldName ] );
        let argName = paramNames[ index ];
        
        if ( !classArgMap[ fieldName ] )
        classArgMap[ fieldName ] = {};
        
        let meyhodArgMap = classArgMap[ fieldName ];
        
        if ( meyhodArgMap[ argName ] )
        throw new Error( `Duplicated argument "${argName}" in "${fieldName}"` );
        
        let nullable = !!config.nullable;
        if ( config.nullable === undefined ) nullable = false;
        
        let paramTypes: any[] = Reflect.getMetadata( META_KEY_DESIGN_PARAMSTYPES, target, fieldName );
 
        let list = false;
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
    nullable?: Boolean
    type?: string | Function
}

export interface ArgMetaObject {
    type: string;
    nullable: Boolean;
    index: number;
    list: boolean;
}

export type ArgsMetaObject = { [ key: string ]: ArgMetaObject };
export type ArgsMetaObjectMap = { [ key: string ]: ArgsMetaObject };

export function getArgsMetaObject( target: any, fieldName: string ) {
    let fieldArgsMetadataMap: ArgsMetaObjectMap = Reflect.getMetadata( META_KEY_ARGS_MAP, target );

    let fieldArgsMetadata: ArgsMetaObject = {}
    if ( fieldArgsMetadataMap && fieldArgsMetadataMap[ fieldName ] )
        fieldArgsMetadata = fieldArgsMetadataMap[ fieldName ];

    return fieldArgsMetadata;
}

export function getArgsMetaObjectMap( target: any ) {
    let classArgMap: ArgsMetaObjectMap = Reflect.getMetadata( META_KEY_ARGS_MAP, target );

    return classArgMap;
}
