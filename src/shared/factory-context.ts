import 'reflect-metadata';
import { GraphQLString, GraphQLFloat, GraphQLInt, GraphQLID, GraphQLBoolean } from 'graphql';

import { deduplicateArray } from './utilities';
import { getMetaObject, META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES, getMetaObjectType } from './metaobject';
import { Injector } from '../di/injector';
import { FieldMetaObject } from '../field/field';
import { ObjectDefinitionMetaObject } from '../object/object-definition';
import { ObjectImplementationMetaObject } from '../object/object-implementation';
import { BaseSchema } from '../schema/base-schema';

/** 
 * Context structure passed along factory methods.
 * It's mainly two things:
 * - a map associating each GraphQL type with a name and a type.
 * - a place to store the dependencies injection injector used by factories
 * Used in factory method to lookup GraphQL type using their names.
*/
export class FactoryContext {

    readonly injector: Injector;

    readonly objectMap = new Map();
    readonly interfaceMap = new Map();
    readonly inputMap = new Map();
    readonly scalarMap = new Map();
    readonly unionMap = new Map();

    constructor( injector: Injector = null ) {
        if ( injector )
            this.injector = injector;
        else
            this.injector = Injector.resolveAndCreate( [] );
        this.registerBuiltinTypes();
    }

    lookupType( name: string ) {
        if ( !name )
            return null;

        if ( this.objectMap.has( name ) )
            return this.objectMap.get( name );

        if ( this.scalarMap.has( name ) )
            return this.scalarMap.get( name );

        if ( this.interfaceMap.has( name ) )
            return this.interfaceMap.get( name );

        if ( this.inputMap.has( name ) )
            return this.inputMap.get( name );

        if ( this.unionMap.has( name ) )
            return this.unionMap.get( name );

        return null;
    }

    isValidType( name: string ) {
        return this.lookupType( name ) !== null;
    }

    private registerBuiltinTypes() {
        this.scalarMap.set( 'String', GraphQLString );
        this.scalarMap.set( 'Float', GraphQLFloat );
        this.scalarMap.set( 'Int', GraphQLInt );
        this.scalarMap.set( 'ID', GraphQLID );
        this.scalarMap.set( 'Boolean', GraphQLBoolean );
    }

}
