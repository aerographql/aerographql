import { GraphQLSchema } from 'graphql';
import { getMetaObject, METAOBJECT_TYPES } from 'aerographql-core';

import { SchemaMetaObject, classifyComponents } from './schema';
import { ScalarMetaObject } from './scalar';
import { scalarFactory } from './scalar-factory';
import { FactoryContext } from './factory-context';
import { interfaceFactory } from './interface-factory';
import { inputFactory } from './input-object-factory';
import { objectTypeFactory } from './object-factory';
import { ObjectImplementationMetaObject } from './object-implementation';
import { ObjectDefinitionMetaObject } from './object-definition';



export let schemaFactory = function ( anyDef: SchemaMetaObject | Function, context: FactoryContext ) {

    let schemaMetaObject = anyDef as SchemaMetaObject;
    if ( typeof anyDef === 'function' )
        schemaMetaObject = getMetaObject<SchemaMetaObject>( anyDef, METAOBJECT_TYPES.schema );

    let components = classifyComponents( schemaMetaObject.components );

    components.interfaces.forEach( interfaceDef => {
        context.interfaceMap.set( interfaceDef.name, interfaceFactory( interfaceDef, context ) );
    } );

    components.inputObject.forEach( inputDef => {
        context.inputMap.set( inputDef.name, inputFactory( inputDef, context ) );
    } );

    components.scalar.forEach( scalarCtr => {
        context.scalarMap.set( scalarCtr.name, scalarFactory( scalarCtr, context ) );
    } );

    type FullTypeMetaObjects = { [ key: string ]: { def: Function[], impl: Function[] } };
    // Classify every definition by their type name
    let fullType = components.objectDefinitions.reduce<FullTypeMetaObjects>( ( acc: FullTypeMetaObjects, typeCtr: Function ) => {
        let metaObject = getMetaObject<ObjectDefinitionMetaObject>( typeCtr );
        if ( !acc[ metaObject.name ] ) acc[ metaObject.name ] = { def: [], impl: [] };

        acc[ metaObject.name ].def.push( typeCtr );
        return acc;
    }, {} );

    // Classify every implementation by their type name
    fullType = components.objectImplementations.reduce( ( acc: FullTypeMetaObjects, typeCtr: Function ) => {
        let metaObject = getMetaObject<ObjectImplementationMetaObject>( typeCtr );
        if ( !acc[ metaObject.name ] ) acc[ metaObject.name ] = { def: [], impl: [] };

        acc[ metaObject.name ].impl.push( typeCtr )
        return acc;
    }, fullType );

    // For each Object type, create it
    for ( let k in fullType ) {
        context.objectMap.set( k, objectTypeFactory( fullType[ k ].def, fullType[ k ].impl, context ) );
    }

    let rootQueryName = schemaMetaObject.rootQuery;
    let rootMutationName: any;
    if ( schemaMetaObject.rootMutation )
        rootMutationName = schemaMetaObject.rootMutation;

    let rootQuery = context.lookupType( rootQueryName );
    if ( !rootQuery )
        throw new Error( `Root Query must be defined` );
    if ( rootQuery && !context.isValidType( rootQueryName ) )
        throw new Error( `Invalid root query name: "${rootMutationName}"` );

    let rootMutation = context.lookupType( rootMutationName );
    if ( rootMutation && !context.isValidType( rootMutationName ) )
        throw new Error( `Invalid root mutation name: "${rootMutationName}"` );

    return new GraphQLSchema( {
        query: rootQuery,
        mutation: rootMutation
    } );

}
