import { GraphQLSchema, printSchema } from 'graphql';
import { SchemaMetaObject, FactoryContext, getSchemaProviders, schemaFactory } from 'aerographql-schema';
import { getMetaObject, Injector } from 'aerographql-core';

/**
 * Base class from which any AeroGraphQL Schema must derive
 */
export class BaseSchema {

    rootInjector: Injector;
    graphQLSchema: GraphQLSchema;

    constructor() {

        let ctr = this[ 'constructor' ];
        let metadata = getMetaObject<SchemaMetaObject>( ctr );

        this.rootInjector = Injector.resolveAndCreate( [
            ...getSchemaProviders( ctr )
        ] );

        let factoryContext = new FactoryContext( this.rootInjector );
        this.graphQLSchema = schemaFactory( metadata, factoryContext );
    }

    toString() {
        return printSchema( this.graphQLSchema );
    }

}
