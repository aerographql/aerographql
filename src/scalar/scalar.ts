
import { ASTNode } from 'graphql';
import { META_KEY_METAOBJECT, META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES, setMetadata } from '../shared';

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

        setMetadata( META_KEY_METAOBJECT, md, ctr );
        setMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.scalar, ctr );
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

