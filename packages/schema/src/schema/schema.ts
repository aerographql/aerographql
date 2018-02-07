import 'reflect-metadata';
import {
    META_KEY_METAOBJECT, META_KEY_METAOBJECT_TYPE, getMetaObjectType,
    getMetaObject, METAOBJECT_TYPES, isOfMetaObjectType, deduplicateArray, Provider
} from 'aerographql-core';
import { ObjectDefinitionMetaObject, ObjectImplementationMetaObject } from '../object';
import { InterfaceMetaObject } from '../interface';
import { ScalarMetaObject } from '../scalar';
import { InputObjectMetaObject } from '../input-object';


/**
 * Convert an unordered flat list of components into a structure mapping each components type to a list of components
 */
export class ClassifiedComponents {

    unions: Function[] = [];
    interfaces: Function[] = [];
    objectDefinitions: Function[] = [];
    objectImplementations: Function[] = [];
    inputObject: Function[] = [];
    scalar: Function[] = [];

    objects: { def: Function[], impl: Function[] }[];

    constructor( components: Function[] ) {

        // First classify each component according to it's meta type
        components.forEach( ( component ) => {
            let t = getMetaObjectType( component );
            if ( t === METAOBJECT_TYPES.inputObject )
                this.inputObject.push( component );
            else if ( t === METAOBJECT_TYPES.interface )
                this.interfaces.push( component );
            else if ( t === METAOBJECT_TYPES.union )
                this.unions.push( component );
            else if ( t === METAOBJECT_TYPES.scalar )
                this.scalar.push( component );
            else if ( t === METAOBJECT_TYPES.objectDefinition )
                this.objectDefinitions.push( component );
            else if ( t === METAOBJECT_TYPES.objectImplementation )
                this.objectImplementations.push( component );
        } );

        // Then create an extra array where each entry contain the full informations for a given object
        // i.e: if an object named 'Test' have 2 definition and 3 implementation, the resulting array willbe:
        // [ { def: [ Def1, Def2 ], impl: [ Impl1, Impl2, Impl3 ]}]
        type ObjectsMap = { [ key: string ]: { def: Function[], impl: Function[] } };
        let objects = this.objectDefinitions.reduce<ObjectsMap>( ( acc, typeCtr ) => {
            let metaObject = getMetaObject<ObjectDefinitionMetaObject>( typeCtr );
            if ( !acc[ metaObject.name ] ) acc[ metaObject.name ] = { def: [], impl: [] };

            acc[ metaObject.name ].def.push( typeCtr );
            return acc;
        }, {} );

        // Classify every implementation by their type name
        objects = this.objectImplementations.reduce( ( acc, typeCtr ) => {
            let metaObject = getMetaObject<ObjectImplementationMetaObject>( typeCtr );
            if ( !acc[ metaObject.name ] ) acc[ metaObject.name ] = { def: [], impl: [] };

            acc[ metaObject.name ].impl.push( typeCtr )
            return acc;
        }, objects );

        this.objects = [];
        for ( let k in objects )
            this.objects.push( objects[ k ] );
    }
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

    let components = new ClassifiedComponents( schemaMetaObject.components );

    let providers: Set<Function | Provider> = new Set();

    // Add each implementation as a provider
    if ( components.objectImplementations )
        components.objectImplementations.forEach( p => providers.add( p ) );

    if ( components.scalar )
        components.scalar.forEach( p => providers.add( p ) );

    // Also add each middleware as a provider
    providers.forEach( provider => {
        if ( isOfMetaObjectType( provider, METAOBJECT_TYPES.objectImplementation ) ) {
            let m = getMetaObject<ObjectImplementationMetaObject>( provider, METAOBJECT_TYPES.objectImplementation );
            for ( let k in m.resolvers ) {
                m.resolvers[ k ].middlewares.forEach( middleware => providers.add( middleware.provider ) );
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

        md.components = deduplicateArray( config.components );

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.schema, ctr );
    }
}
export interface SchemaConfig {
    rootQuery: string,
    rootMutation?: string,
    providers?: ( Function | Provider )[],
    components: Function[]
}

export interface SchemaMetaObject {
    rootQuery: string,
    rootMutation: string,
    components: Function[],
    providers: ( Function | Provider )[]
}
