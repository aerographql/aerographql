import { GraphQLInterfaceType, GraphQLInterfaceTypeConfig, GraphQLResolveInfo } from 'graphql';

import { InterfaceMetaObject } from './interface';
import { METAOBJECT_TYPES, getMetaObject, createdResolveType, FactoryContext } from '../shared';
import { fieldConfigFactory } from '../field';

export let interfaceFactory = function ( ctr: Function, context: FactoryContext ) {

    let metaObject = getMetaObject<InterfaceMetaObject>( ctr, METAOBJECT_TYPES.interface );

    let conf: GraphQLInterfaceTypeConfig<any, any> = {
        name: '',
        fields: {}
    }

    conf.name = metaObject.name;

    if ( metaObject.description )
        conf.description = metaObject.description;

    conf.fields = () => {
        let fields: any = {};
        for ( let key in metaObject.fields )
            fields[ key ] = fieldConfigFactory( metaObject.fields[ key ], context );
        return fields;
    };

    conf.resolveType = createdResolveType( conf.name, metaObject.resolveType, metaObject.implementers );

    let o = new GraphQLInterfaceType( conf );
    context.interfaceMap.set( conf.name, o );
    return o;
}
