
import 'reflect-metadata';
import { ASTNode } from 'graphql';
import { META_KEY_METAOBJECT, META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES } from '../shared';

/**
 * Scalar implementation definition
 */
export function Scalar( config: ScalarConfig ) {

    return function ( ctr: Function ) {

        let name: string = config.name;

        let desc = null;
        if ( config.description ) desc = config.description;

        let md: ScalarMetaObject = {
            name: name,
            instanceToken: ctr.name,
            description: desc
        };

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.scalar, ctr );
    }
}

/**
 * Interface each scalar implementation should implement
 */
export interface ScalarInterface {
    parseValue: ( value: any ) => any;
    serialize: ( value: any ) => any;
    parseLiteral: ( ast: ASTNode ) => any;
}

export interface ScalarConfig {
    name: string;
    description?: string;
}

export interface ScalarMetaObject {
    name: string;
    description: string;
    instanceToken: string;
}

