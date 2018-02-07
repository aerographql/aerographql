import 'reflect-metadata';
import { EventEmitter } from 'events'
import * as httpMocks from 'node-mocks-http';
import { ExpressHandler, graphqlExpress } from 'apollo-server-express';

import { BaseSchema } from './schema/base-schema';


/** 
 * Tools to create fake graphql server that can be used to test graphql query from end to end
*/
export namespace ServerMock {

    export type Request = httpMocks.MockRequest;
    export type Response = httpMocks.MockResponse;
    export type Middleware = ExpressHandler;

    export let createRequest = ( query: string, vars: any = null, operationName: string = null ): Request => {
        return httpMocks.createRequest( {
            method: 'POST',
            body: {
                variables: vars,
                operationName: operationName,
                query: query
            }
        } );
    }

    export let createResponse = (): Response => {
        return httpMocks.createResponse( { eventEmitter: EventEmitter } );
    }

    export let createMiddleware = ( schema: BaseSchema, context: any = null ) => {
        return graphqlExpress( { schema: schema.graphQLSchema, context: context } );
    }
}

