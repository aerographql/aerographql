import 'reflect-metadata';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import {
    SchemaMetaObject, FactoryContext, Context,
    SchemaConfig, getSchemaProviders, schemaFactory, MiddlewareError
} from 'aerographql-schema';
import { getMetaObject, META_KEY_METAOBJECT,  Injector, Provider } from 'aerographql-core';


/**
 * ApolloServer decorator
 */
export function ApolloServer( config: ApolloServerConfig ) {
    return function ( ctr: Function ) {
        let name = ctr.name;
        if ( config.name ) name = config.name;

        let desc = null;
        if ( config.description ) desc = config.description;

        let providers: ( Function | Provider )[] = [];
        if ( config.providers ) providers = config.providers;

        let md: ApolloServerMetaObject = {
            name: name,
            description: desc,
            schema: config.schema,
            providers: providers
        };

        Reflect.defineMetadata( META_KEY_METAOBJECT, md, ctr );
    }
}


export interface ApolloServerConfig {
    name?: string;
    description?: string;
    schema: Function;
    providers?: ( Function | Provider )[];
}

export interface ApolloServerMetaObject {
    name: string;
    description: string;
    schema: Function;
    providers: ( Function | Provider )[];
}

/**
 * Base class from which any server must inherit
 */
export class BaseApolloServer {

    rootInjector: Injector;
    metadata: ApolloServerMetaObject;

    constructor() {

        this.metadata = getMetaObject<ApolloServerMetaObject>( this[ 'constructor' ] );

        this.rootInjector = Injector.resolveAndCreate( [
            ...this.metadata.providers,
            ...getSchemaProviders( this.metadata.schema )
        ] );

    }

    getGraphiQLMiddleware(): any {
        return graphiqlExpress( { endpointURL: '/graphql' } );
    }

    getGraphQLMiddleware(): any {
        let factoryContext = new FactoryContext( this.rootInjector );
        let graphqlSchema = schemaFactory( this.metadata.schema, factoryContext );

        // The GraphQL endpoint
        return graphqlExpress( ( req: any ) => {

            let context: Context = {
                credentials: null,
                middlewareResults: [],
                middlewareOptions: null
            };

            if ( req.credentials )
                context.credentials = req.credentials;

            return {
                schema: graphqlSchema,
                context: context
            };
        } );
    }
}
