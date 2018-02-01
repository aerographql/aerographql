import { GraphQLObjectTypeConfig, GraphQLObjectType } from 'graphql';
import { getMetaObject, METAOBJECT_TYPES } from 'aerographql-core';

import { ObjectDefinitionMetaObject } from './object-definition';
import { ObjectImplementationMetaObject } from './object-implementation';
import { FactoryContext } from './factory-context';
import { fieldConfigFactory } from './field-factory';
import { resolverConfigFactory } from './resolver-factory';


export let objectTypeFactory = function ( defsCtr: Function[], implsCtr: Function[], context: FactoryContext ) {

    let name = '';
    let impls: ObjectImplementationMetaObject[] = [];
    if ( implsCtr ) {
        impls = implsCtr.map( implCtr => getMetaObject<ObjectImplementationMetaObject>( implCtr, METAOBJECT_TYPES.objectImplementation ) );
        if ( impls.length )
            name = impls[ 0 ].name;
    }

    let defs: ObjectDefinitionMetaObject[] = [];
    if ( defsCtr ) {
        defs = defsCtr.map( defCtr => getMetaObject<ObjectDefinitionMetaObject>( defCtr, METAOBJECT_TYPES.objectDefinition ) );
        if ( defs.length )
            name = defs[ 0 ].name;
    }


    let conf: GraphQLObjectTypeConfig<any, any> = {
        name: name,
        fields: {}
    };

    // Populate GQL fields
    conf.fields = () => {
        let fields: any = {};

        // Add fields from the definitions
        defs.forEach( def => {
            for ( let key in def.fields ) {
                if ( fields[ key ] )
                    throw new Error( `Field "${key}" in definition of type "${name}" is defined more than one time` );
                fields[ key ] = fieldConfigFactory( def.fields[ key ], context );
            }
        } );

        // add fields for each implementations
        impls.forEach( impl => {
            for ( let key in impl.fields ) {
                if ( fields[ key ] )
                    throw new Error( `Field "${key}" in implementation of type "${name}" is defined more than one time` );
                fields[ key ] = resolverConfigFactory( impl.fields[ key ], key, context );
            }
        } );

        return fields;
    };

    // Populate GQL interface
    conf.interfaces = () => {
        // Create a map of every interface implemented by this type
        let interfaces = defs.reduce( ( acc: any[], def ) => {
            acc = acc.concat( def.implements.map( i => {
                if ( !context.isValidType( i ) ) {
                    throw new Error( `Type "${def.name}" implements an interface that does not exist "${i}"` );
                }
                return context.lookupType( i )
            } ) );
            return acc;
        }, [] );
        interfaces = impls.reduce( ( acc: any[], impl ) => {
            acc = acc.concat( impl.implements.map( i => {
                if ( !context.isValidType( i ) ) {
                    throw new Error( `Type "${impl.name}" implements an interface that does not exist "${i}"` );
                }
                return context.lookupType( i )
            } ) );
            return acc;
        }, interfaces );
        // Remove duplicate
        interfaces = interfaces.filter( ( e, p, a ) => {
            return a.indexOf( e ) === p;
        } );

        return interfaces;
    };

    let desc = '';
    desc = defs.reduce( ( acc, i ) => {
        if ( i.description ) acc = i.description + '\n' + acc;
        return acc;
    }, desc );


    desc = impls.reduce( ( acc, i ) => {
        if ( i.description ) acc = i.description + '\n' + acc;
        return acc;
    }, desc );

    conf.description = desc.trim();

    let o = new GraphQLObjectType( conf );
    context.objectMap.set( conf.name, o );
    return o;
}
