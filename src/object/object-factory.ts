import { GraphQLObjectTypeConfig, GraphQLObjectType } from 'graphql';

import { ObjectImplementationMetaObject } from './object-implementation';
import { FieldMetaObject } from '../field';
import { ResolverMetaObject, resolverConfigFactory } from '../resolver';
import { ObjectDefinitionMetaObject } from './object-definition';
import {  getMetaObject, METAOBJECT_TYPES, FactoryContext } from '../shared';
import { InterfaceMetaObject } from '../interface';
import { fieldConfigFactory } from '../field';


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

    let availableFields: { [ key: string ]: FieldMetaObject } = {};
    defs.forEach( def => {
        for ( let key in def.fields ) {
            if ( availableFields[ key ] )
                throw new Error( `Field "${key}" in definition of type "${name}" is defined more than one time` );
            availableFields[ key ] = def.fields[ key ];
        }
    } );

    let availableResolvers: { [ key: string ]: ResolverMetaObject } = {};
    impls.forEach( impl => {
        for ( let key in impl.resolvers ) {
            if ( availableResolvers[ key ] )
                throw new Error( `Field "${key}" in implementation of type "${name}" is defined more than one time` );
            availableResolvers[ key ] = impl.resolvers[ key ];
        }
    } );

    // Populate GQL fields
    conf.fields = () => {
        let fields: any = {};

        // Add fields from the definitions
        for ( let key in availableFields ) {
            fields[ key ] = fieldConfigFactory( availableFields[ key ], context );
        }

        // add fields for each implementations
        for ( let key in availableResolvers ) {
            fields[ key ] = resolverConfigFactory( availableResolvers[ key ], key, context );
        }

        return fields;
    };

    // Count total number of interface this object is implementing
    let implementedInterfaceCount = 0;
    implementedInterfaceCount += defs.reduce( ( acc, def ) => { return acc + def.implements.length }, 0 );
    implementedInterfaceCount += impls.reduce( ( acc, impl ) => { return acc + impl.implements.length }, 0 );

    // Populate GQL interface
    conf.interfaces = () => {
        // Create a map of every interface implemented by this type
        let interfaces = defs.reduce( ( acc: any[], def ) => {
            acc = acc.concat( def.implements.map( i => {
                let interfaceName = getMetaObject<InterfaceMetaObject>( i, METAOBJECT_TYPES.interface ).name;
                if ( !context.isValidType(interfaceName ) ) {
                    throw new Error( `Type "${def.name}" implements an interface that does not exist "${interfaceName}"` );
                }
                return context.lookupType( interfaceName )
            } ) );
            return acc;
        }, [] );
        interfaces = impls.reduce( ( acc: any[], impl ) => {
            acc = acc.concat( impl.implements.map( i => {
                let interfaceName = getMetaObject<InterfaceMetaObject>( i, METAOBJECT_TYPES.interface ).name;
                if ( !context.isValidType( interfaceName ) ) {
                    throw new Error( `Type "${impl.name}" implements an interface that does not exist "${interfaceName}"` );
                }
                return context.lookupType( interfaceName )
            } ) );
            return acc;
        }, interfaces );
        // Remove duplicate
        interfaces = interfaces.filter( ( e, p, a ) => {
            return a.indexOf( e ) === p;
        } );

        return interfaces;
    };

    // Concatenate description
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
