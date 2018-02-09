import { GraphQLSchema } from 'graphql';

import { SchemaMetaObject, ClassifiedComponents } from './schema';
import { ScalarMetaObject, scalarFactory } from '../scalar';
import { FactoryContext, getMetaObject, METAOBJECT_TYPES } from '../shared';
import { unionFactory } from '../union';
import { interfaceFactory } from '../interface';
import { inputFactory } from '../input-object';
import { objectTypeFactory, ObjectImplementationMetaObject, ObjectDefinitionMetaObject } from '../object';


export let schemaFactory = function ( ctr: Function, context: FactoryContext ) {

    let metaObject = getMetaObject<SchemaMetaObject>( ctr, METAOBJECT_TYPES.schema );

    // Take the linear list of component and classify iy by types
    let components = new ClassifiedComponents( metaObject.components );

    // Create interfaces
    components.interfaces.forEach( interf => interfaceFactory( interf, context ) );

    // Create unions
    components.unions.forEach( union => unionFactory( union, context ) );

    // Then Input objects
    components.inputObject.forEach( input => inputFactory( input, context ) );

    // Then scalar
    components.scalar.forEach( scalar => scalarFactory( scalar, context ) );

    // Finaly objects:
    components.objects.forEach( object => objectTypeFactory( object.def, object.impl, context ) );

    let rootQueryName = metaObject.rootQuery;
    let rootMutationName: any;
    if ( metaObject.rootMutation )
        rootMutationName = metaObject.rootMutation;

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
