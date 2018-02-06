import { GraphQLFieldConfig, GraphQLNonNull, GraphQLList, GraphQLInputObjectType, GraphQLInterfaceType } from 'graphql';
import { isOfMetaObjectType } from 'aerographql-core';

import { FieldMetaObject } from './field';
import { ObjectDefinitionMetaObject } from '../object';
import { FactoryContext } from '../shared';

export let fieldConfigFactory = function ( metaObject: FieldMetaObject, context: FactoryContext ) {
    let fieldConfig: GraphQLFieldConfig<any, any> = {
        type: null
    };

    if ( metaObject.description )
        fieldConfig.description = metaObject.description;

    if ( !context.isValidType( metaObject.type ) ) {
        throw new Error( `Type "${metaObject.type}" is not valid` )
    }

    let type = context.lookupType( metaObject.type );
    if ( ( type instanceof GraphQLInputObjectType ) || ( type instanceof GraphQLInterfaceType ) )
        throw new Error( `Type "${metaObject.type}" is not a valid type` )


    if ( metaObject.list )
        type = new GraphQLList<any>( type );

    if ( !metaObject.nullable )
        type = new GraphQLNonNull<any>( type );

    fieldConfig.type = type;

    return fieldConfig;
}
