import { GraphQLUnionType, GraphQLUnionTypeConfig, GraphQLResolveInfo } from 'graphql';
import { METAOBJECT_TYPES, getMetaObject } from 'aerographql-core';

import { createdResolveType, FactoryContext } from '../shared';
import { UnionMetaObject } from './union';

export let unionFactory = function ( ctr: Function, context: FactoryContext ) {

    let def = getMetaObject<UnionMetaObject>( ctr, METAOBJECT_TYPES.union );

    let conf: GraphQLUnionTypeConfig<any, any> = {
        name: '',
        types: null
    }

    conf.name = def.name;

    if ( def.description )
        conf.description = def.description;

    conf.types = () => {
        return def.types.map( def => {
            let t = context.lookupType( def.name );
            if ( !t )
                throw new Error( 'Union "${conf.name}" reference an invalid type: "${def.name}"' )
            return t;
        }
        );
    }

    conf.resolveType = createdResolveType( def, context );

    let o = new GraphQLUnionType( conf );
    context.unionMap.set( conf.name, o );
    return o;
}
