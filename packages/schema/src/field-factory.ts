import { GraphQLFieldConfig, GraphQLNonNull, GraphQLList, GraphQLInputObjectType, GraphQLInterfaceType } from 'graphql';
import { isOfMetaObjectType } from 'aerographql-core';

import { ObjectDefinitionMetaObject } from './object-definition';
import { FieldMetaObject } from './field';
import { FactoryContext } from './factory-context';

export let fieldConfigFactory = function ( def: FieldMetaObject, context: FactoryContext ) {
    let fieldConfig: GraphQLFieldConfig<any, any> = {
        type: null
    };

    if ( def.description )
        fieldConfig.description = def.description;

    if ( !context.isValidType( def.type ) ) {
        throw new Error( `Type "${def.type}" is not valid` )
    }

    let type = context.lookupType( def.type );
    if ( ( type instanceof GraphQLInputObjectType ) || ( type instanceof GraphQLInterfaceType ) )
        throw new Error( `Type "${def.type}" is not a valid type` )


    if ( def.list )
        type = new GraphQLList<any>( type );

    if ( !def.nullable )
        type = new GraphQLNonNull<any>( type );

    fieldConfig.type = type;

    return fieldConfig;
}
