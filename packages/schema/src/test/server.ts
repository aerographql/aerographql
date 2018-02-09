import 'reflect-metadata';
import { EventEmitter } from 'events'
import * as httpMocks from 'node-mocks-http';
import { ExpressHandler, graphqlExpress } from 'apollo-server-express';

import { BaseSchema } from '../schema/base-schema';

export class TestServer {

    private handler: any;

    constructor( schema: BaseSchema, context: any = null ) {
        this.handler = graphqlExpress( { schema: schema.graphQLSchema, context: context } );
    }

    execute( query: string, vars: any = null, operationName: string = null ) {

        return new Promise( ( resolve, reject ) => {

            let req = httpMocks.createRequest( {
                method: 'POST',
                body: {
                    variables: vars,
                    operationName: operationName,
                    query: query
                }
            } );

            let res = httpMocks.createResponse( { eventEmitter: EventEmitter } );

            this.handler( req, res, null );

            res.on( 'end', () => {
                let gqlResponse: any;
                try {
                    gqlResponse = JSON.parse( res._getData() );
                } catch ( e ) {
                    reject( e );
                }
                resolve( gqlResponse );
            } );
        } );
    }
}
