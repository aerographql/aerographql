import { GraphQLScalarTypeConfig, GraphQLScalarType } from 'graphql';

import { ScalarMetaObject } from './scalar';
import { getMetaObject, METAOBJECT_TYPES, FactoryContext } from '../shared';

export let scalarFactory = function ( ctr: Function, context: FactoryContext ) {

    let def = getMetaObject<ScalarMetaObject>( ctr, METAOBJECT_TYPES.scalar );

    let conf: GraphQLScalarTypeConfig<any, any> = {
        name: '',
        serialize: null
    }

    conf.name = def.name;

    let instance = context.injector.get( def.instanceToken );
    if ( !instance ) {
        throw new Error( `Unable to find instance at token "${def.instanceToken}" for scalar implementation of "${def.name}" ` );
    }

    let serializeFunction = instance[ 'serialize' ];
    if ( !serializeFunction ) {
        throw new Error( `Unable to find "serialize" function in instance at token "${def.instanceToken}" for scalar implementation of "${def.name}" ` );
    }
    conf.serialize = ( value: any ) => {
        return Reflect.apply( serializeFunction, instance, [ value ] );
    };

    let parseValueFunction = instance[ 'parseValue' ];
    if ( parseValueFunction )
        conf.parseValue = function ( value: any ) {
            return Reflect.apply( parseValueFunction, instance, [ value ] );
        };

    let parseLiteralFunction = instance[ 'parseLiteral' ];
    if ( parseLiteralFunction )
        conf.parseLiteral = function ( value: any ) {
            return Reflect.apply( parseLiteralFunction, instance, [ value ] );
        };

    if ( def.description )
        conf.description = def.description;

    let o = new GraphQLScalarType( conf );
    context.scalarMap.set( conf.name, o );
    return o;
}
