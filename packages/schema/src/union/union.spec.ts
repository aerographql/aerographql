import { EventEmitter } from 'events'
import { ExpressHandler, graphqlExpress } from 'apollo-server-express';
import * as httpMocks from 'node-mocks-http';
import { getMetaObject, getMetaObjectType, METAOBJECT_TYPES } from 'aerographql-core';

import { Union, UnionMetaObject } from './union';
import { unionFactory } from './union-factory';
import { ObjectDefinition, ObjectImplementation, objectTypeFactory } from '../object';
import { Resolver } from '../resolver';
import { Schema, BaseSchema } from '../schema';
import { FactoryContext } from '../shared';
import { Field } from '../field';

@ObjectDefinition( {
    name: 'ObjectA',
} )
class ObjectA { }

@ObjectDefinition( {
    name: 'ObjectB',
} )
class ObjectB { }

@Union( {
    name: 'UnionA',
    description: 'UnionA Desc',
    types: [ ObjectA, ObjectB ]
} )
class UnionA { }

describe( '@Union decorator', () => {

    let mo: UnionMetaObject;
    beforeEach( () => {
        mo = getMetaObject<UnionMetaObject>( UnionA );
    } );

    it( 'should set the correct metadata', () => {
        expect( mo ).not.toBeNull();
        expect( mo.name ).toBe( 'UnionA' );
        expect( mo.description ).toBe( 'UnionA Desc' );
        expect( mo.types ).toContain( ObjectA );
        expect( mo.types ).toContain( ObjectB );
    } );

} );

describe( 'unionFactory function', () => {

    it( 'should create the correct GraphQL object', () => {

        let context = new FactoryContext();
        objectTypeFactory( [ ObjectA ], [], context );
        objectTypeFactory( [ ObjectB ], [], context );
        let gql = unionFactory( UnionA, context );

        expect( gql.name ).toBe( 'UnionA' );
        expect( gql.description ).toBe( 'UnionA Desc' );
        expect( gql.getTypes() ).toHaveLength( 2 );
        expect( gql.getTypes() ).toContain( context.lookupType( 'ObjectA' ) );
        expect( gql.getTypes() ).toContain( context.lookupType( 'ObjectB' ) );
    } );

    it( 'should throw if union reference an invalid type', () => {

        let context = new FactoryContext();
        let gql = unionFactory( UnionA, context );
        expect( () => gql.getTypes() ).toThrowError();
    } );

} )
