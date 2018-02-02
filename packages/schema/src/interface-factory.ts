import { GraphQLInterfaceType, GraphQLInterfaceTypeConfig, GraphQLResolveInfo } from 'graphql';
import { METAOBJECT_TYPES, getMetaObject } from 'aerographql-core';

import { InterfaceMetaObject } from './interface';
import { FactoryContext } from './factory-context';
import { fieldConfigFactory } from './field-factory';

export let interfaceFactory = function ( anyDef: InterfaceMetaObject | Function, context: FactoryContext ) {

    let def = anyDef as InterfaceMetaObject;
    if ( typeof anyDef === 'function' )
        def = getMetaObject<InterfaceMetaObject>( anyDef, METAOBJECT_TYPES.interface );

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

    conf.resolveType = ( value: any, info: GraphQLResolveInfo ) => {
        let typeName = value.constructor.name;
        let type = context.lookupType( typeName );
        return type;
    }

    let o = new GraphQLInterfaceType( conf );
    context.interfaceMap.set( conf.name, o );
    return o;
}
