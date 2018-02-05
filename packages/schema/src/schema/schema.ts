import 'reflect-metadata';
import {
    META_KEY_METAOBJECT, META_KEY_METAOBJECT_TYPE, getMetaObjectType,
    getMetaObject, METAOBJECT_TYPES, isOfMetaObjectType, deduplicateArray
} from 'aerographql-core';
import { ObjectDefinitionMetaObject, ObjectImplementationMetaObject } from '../object';
import { InterfaceMetaObject } from '../interface';
import { ScalarMetaObject } from '../scalar';
import { InputObjectMetaObject } from '../input-object';

export class ClassifiedComponents {
    unions: Function[] = [];
    interfaces: Function[] = [];
    objectDefinitions: Function[] = [];
    objectImplementations: Function[] = [];
    inputObject: Function[] = [];
    scalar: Function[] = [];
}

/**
 * Convert an unordered flat list of components to a structure mapping each components type to a list of components
 * @param components Flat list of components
 */
export function classifyComponents( components: Function[] ): ClassifiedComponents {

    let classifiedComponents = new ClassifiedComponents();

    classifiedComponents = components.reduce<ClassifiedComponents>( ( acc, component ) => {

        let t = getMetaObjectType( component );
        if ( t === METAOBJECT_TYPES.inputObject )
            acc.inputObject.push( component );
        else if ( t === METAOBJECT_TYPES.interface )
            acc.interfaces.push( component );
        else if ( t === METAOBJECT_TYPES.union )
            acc.unions.push( component );
        else if ( t === METAOBJECT_TYPES.scalar )
            acc.scalar.push( component );
        else if ( t === METAOBJECT_TYPES.objectDefinition )
            acc.objectDefinitions.push( component );
        else if ( t === METAOBJECT_TYPES.objectImplementation )
            acc.objectImplementations.push( component );

        return acc;
    }, classifiedComponents )

    return classifiedComponents;
}

/**
 * Return a list of providers to inject in an injector in order for this schema to be correctly wired.
 * 
 * @param schema The input Constructor of the Schema class
 */
export function getSchemaProviders( schema: Function ) {
    let schemaMetaObject = getMetaObject<SchemaMetaObject>( schema, METAOBJECT_TYPES.schema );
    if ( !schemaMetaObject )
        throw new Error( 'Invalid schema provided' );

    let components = classifyComponents( schemaMetaObject.components );

    let providers: Set<Function> = new Set();

    // Add each implementation as a provider
    if ( components.objectImplementations )
        components.objectImplementations.forEach( p => providers.add( p ) );

    if ( components.scalar )
        components.scalar.forEach( p => providers.add( p ) );

    // Also add each middleware as a provider
    providers.forEach( provider => {
        if ( isOfMetaObjectType( provider, METAOBJECT_TYPES.objectImplementation ) ) {
            let m = getMetaObject<ObjectImplementationMetaObject>( provider, METAOBJECT_TYPES.objectImplementation );
            for ( let k in m.fields ) {
                m.fields[ k ].middlewares.forEach( middleware => providers.add( middleware.provider ) );
            }
        }
    } );

    // And finaly add explict providers
    schemaMetaObject.providers.forEach( p => providers.add( p ) );

    return Array.from( providers );
}

/**
 * Schema defintion
 */
export function Schema( config: SchemaConfig ) {

    return function ( ctr: Function ) {
        let md: SchemaMetaObject = {
            rootMutation: null,
            rootQuery: null,
            components: [],
            providers: []
        };

        md.rootQuery = config.rootQuery;

        if ( config.rootMutation ) {
            md.rootMutation = config.rootMutation;
        }

        if ( config.providers ) {
            md.providers = deduplicateArray( config.providers );
        }

        md.components = deduplicateArray(  config.components );

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.schema, ctr );
    }
}
export interface SchemaConfig {
    rootQuery: string,
    rootMutation?: string,
    providers?: Function[],
    components: Function[]
}

export interface SchemaMetaObject {
    rootQuery: string,
    rootMutation: string,
    components: Function[],
    providers: Function[]
}
