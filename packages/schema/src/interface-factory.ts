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

    conf.resolveType = ( value: any, context: any, info: any ) => {

        // If Object was builded using new operator on an annotated constructor, it fairly easy to find out it's type
        let p = getMetaObject( value.constructor );
        if ( p ) {
            return p.name;
        }

        if ( def.resolveType )
            return def.resolveType( value, context, info )

        return null;
    }

    let o = new GraphQLInterfaceType( conf );
    context.interfaceMap.set( conf.name, o );
    return o;
}
