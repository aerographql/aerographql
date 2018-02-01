import { getMetaObject } from 'aerographql-core';

import { ApolloServer, ApolloServerMetaObject, BaseApolloServer } from './apollo-server';

let dummySchema = function() {};

@ApolloServer( { 
    name: 'ServerA',
    schema: dummySchema
})
class ServerA extends BaseApolloServer {

}


describe( '@ApolloServer decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( ServerA ) ).not.toBeNull();
        expect( getMetaObject<ApolloServerMetaObject>( ServerA ).providers ).toHaveLength( 0 );
        expect( getMetaObject<ApolloServerMetaObject>( ServerA ).name ).toBe( 'ServerA' );
    } );
} );

