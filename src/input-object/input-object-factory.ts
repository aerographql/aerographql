import { GraphQLInputObjectType, GraphQLInputObjectTypeConfig } from 'graphql';

import { InputObjectMetaObject } from './input-object';
import { FactoryContext, getMetaObject, METAOBJECT_TYPES } from '../shared';
import { fieldConfigFactory } from '../field';

export let inputFactory = function ( ctr: Function, context: FactoryContext ) {

    let def = getMetaObject<InputObjectMetaObject>( ctr, METAOBJECT_TYPES.inputObject );

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
