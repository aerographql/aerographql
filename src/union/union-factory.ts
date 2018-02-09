import { GraphQLUnionType, GraphQLUnionTypeConfig, GraphQLResolveInfo } from 'graphql';

import {  METAOBJECT_TYPES, getMetaObject , createdResolveType, FactoryContext } from '../shared';
import { UnionMetaObject } from './union';

export let unionFactory = function ( ctr: Function, context: FactoryContext ) {

    let metaObject = getMetaObject<UnionMetaObject>( ctr, METAOBJECT_TYPES.union );

    let conf: GraphQLUnionTypeConfig<any, any> = {
        name: '',
        types: null
    }

    conf.name = metaObject.name;

    if ( metaObject.description )
        conf.description = metaObject.description;

    conf.types = () => {
        return metaObject.types.map( def => {
            let t = context.lookupType( def.name );
            if ( !t )
                throw new Error( 'Union "${conf.name}" reference an invalid type: "${def.name}"' )
            return t;
        }
        );
    }

    conf.resolveType = createdResolveType( conf.name, metaObject.resolveType, metaObject.types );

    let o = new GraphQLUnionType( conf );
    context.unionMap.set( conf.name, o );
    return o;
}
