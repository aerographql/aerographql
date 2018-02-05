import { GraphQLInterfaceType, GraphQLInterfaceTypeConfig, GraphQLResolveInfo } from 'graphql';
import { METAOBJECT_TYPES, getMetaObject } from 'aerographql-core';

import { InterfaceMetaObject } from './interface';
import { createdResolveType, FactoryContext } from '../shared';
import { fieldConfigFactory } from '../field';

export let interfaceFactory = function ( ctr: Function, context: FactoryContext ) {

    let def = getMetaObject<InterfaceMetaObject>( ctr, METAOBJECT_TYPES.interface );

    let conf: GraphQLInterfaceTypeConfig<any, any> = {
        name: '',
        fields: {}
    }

    conf.name = def.name;

    if ( def.description )
        conf.description = def.description;

    conf.fields = () => {
        let fields: any = {};
        for ( let key in def.fields )
            fields[ key ] = fieldConfigFactory( def.fields[ key ], context );
        return fields;
    };

    conf.resolveType = createdResolveType( def, context );

    let o = new GraphQLInterfaceType( conf );
    context.interfaceMap.set( conf.name, o );
    return o;
}
