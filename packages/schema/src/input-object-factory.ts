import { GraphQLInputObjectType, GraphQLInputObjectTypeConfig } from 'graphql';
import { getMetaObject, METAOBJECT_TYPES } from 'aerographql-core';

import { InputObjectMetaObject } from './input-object';
import { FactoryContext } from './factory-context';
import { fieldConfigFactory } from './field-factory';

export let inputFactory = function ( anyDef: Function, context: FactoryContext ) {

    let def = getMetaObject<InputObjectMetaObject>( anyDef, METAOBJECT_TYPES.inputObject );

    let conf: GraphQLInputObjectTypeConfig = {
        name: '',
        fields: {}
    }

    conf.name = def.name;

    conf.fields = () => {
        let fields: any = {};
        for ( let key in def.fields ) {
            fields[ key ] = fieldConfigFactory( def.fields[ key ], context );
        }
        return fields;
    };

    if ( def.description )
        conf.description = def.description;

    let o = new GraphQLInputObjectType( conf );
    context.inputMap.set( conf.name, o );
    return o;
}
