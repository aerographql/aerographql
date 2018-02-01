import { Injector, getMetaObject } from 'aerographql-core';
import { GraphQLString, GraphQLFloat, GraphQLInt, GraphQLID, GraphQLBoolean } from 'graphql';

export class FactoryContext {

    readonly injector: Injector;

    readonly objectMap = new Map();
    readonly interfaceMap = new Map();
    readonly inputMap = new Map();
    readonly scalarMap = new Map();

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
