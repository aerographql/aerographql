import { GraphQLSchema } from 'graphql';
import { getMetaObject, METAOBJECT_TYPES } from 'aerographql-core';

import { SchemaMetaObject, classifyComponents } from './schema';
import { ScalarMetaObject, scalarFactory } from '../scalar';
import { FactoryContext } from '../shared';
import { unionFactory } from '../union';
import { interfaceFactory } from '../interface';
import { inputFactory } from '../input-object';
import { objectTypeFactory, ObjectImplementationMetaObject, ObjectDefinitionMetaObject} from '../object';


export let schemaFactory = function ( anyDef: SchemaMetaObject | Function, context: FactoryContext ) {

    let schemaMetaObject = anyDef as SchemaMetaObject;
    if ( typeof anyDef === 'function' )
        schemaMetaObject = getMetaObject<SchemaMetaObject>( anyDef, METAOBJECT_TYPES.schema );

    // Take the linear list of component and classify iy by types
    let components = classifyComponents( schemaMetaObject.components );

    // Create interfaces
    components.interfaces.forEach( interf => {
        interfaceFactory( interf, context );
    } );

    // Create unions
    components.unions.forEach( union => {
        unionFactory( union, context );
    } );

    // Then Input objects
    components.inputObject.forEach( input => {
        inputFactory( input, context );
    } );

    // Then scalar
    components.scalar.forEach( scalar => {
        scalarFactory( scalar, context );
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
        objectTypeFactory( fullType[ k ].def, fullType[ k ].impl, context );
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

    let typeList = Array.from( context.objectMap ).map( i => i[ 1 ] );
    return new GraphQLSchema( {
        query: rootQuery,
        mutation: rootMutation,
        types: typeList
    } );

}
