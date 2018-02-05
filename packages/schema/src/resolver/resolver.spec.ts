
import { getMetaObject } from 'aerographql-core';

import { ObjectImplementation, ObjectImplementationMetaObject, ObjectDefinition, objectTypeFactory } from '../object';
import { Resolver, ResolverMetaObject } from './resolver';
import { resolverConfigFactory } from './resolver-config-factory'
import { Arg } from '../arg';
import { FactoryContext } from '../shared';
import { GraphQLList, GraphQLNonNull } from 'graphql';

@ObjectDefinition( { name: 'TypeA' } ) class TypeC { }

@ObjectImplementation( { name: 'TypeA', description: 'Desc' } )
class TypeImplA {
    @Resolver( { type: 'TypeA', description: 'Desc', nullable: true } )
    fieldA( src: any, @Arg() arg1: number, @Arg( { type: 'Int' } ) arg2: number[] ) { }
}

class UnanotatedType { }

@ObjectImplementation( { name: 'TypeA' } )
class TypeImplB {
    @Resolver( { type: TypeC, description: 'Desc' } ) fieldA( src: any, @Arg() arg1: number ) { }
    @Resolver( { type: TypeC, list: true } ) fieldB( src: any, @Arg() arg1: number ) { }
}

describe( '@Resolver decorator', () => {
    it( 'should correctly set description', () => {
        expect( getMetaObject( TypeImplA ) ).toBeDefined();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.description ).toBe( 'Desc' );

        md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.description ).toBe( 'Desc' );
    } )

    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TypeImplA ) ).toBeDefined();

        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( mo.name ).toBe( 'TypeA' );
        expect( mo.description ).toBe( 'Desc' );
        expect( mo.fields ).toHaveProperty( 'fieldA' );
        expect( mo.fields.fieldA.type ).toBe( 'TypeA' );
        expect( mo.fields.fieldA.list ).toBe( false );
        expect( mo.fields.fieldA.nullable ).toBe( true );
        expect( mo.fields.fieldA.instanceToken ).toBe( 'TypeImplA' );

    } );

    it( 'should correctly determine if returning list', () => {
        expect( getMetaObject( TypeImplB ) ).toBeDefined();

        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( mo.name ).toBe( 'TypeA' );
        expect( mo.fields ).toHaveProperty( 'fieldB' );
        expect( mo.fields.fieldB.type ).toBe( 'TypeA' );
        expect( mo.fields.fieldB.list ).toBe( true );
        expect( mo.fields.fieldB.instanceToken ).toBe( 'TypeImplB' );
    } );

    it( 'should throw in invalid configuration', () => {
        expect( () => {
            @ObjectImplementation( { name: 'TypeA' } )
            class Type {

                @Resolver( { type: UnanotatedType } )
                field() { }
            }
        } ).toThrowError();
    } )
} );

describe( '@Arg decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TypeImplA ) ).toBeDefined();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( md.fields.fieldA.args ).toHaveProperty( 'arg1' );
        expect( md.fields.fieldA.args.arg1.index ).toBe( 1 );
        expect( md.fields.fieldA.args.arg1.nullable ).toBe( false );
        expect( md.fields.fieldA.args.arg1.type ).toBe( 'Int' );
    } );
} );

describe( 'resolverConfigFactory function', () => {

    let context: FactoryContext;
    beforeEach( () => {
        context = new FactoryContext();
        objectTypeFactory( [], [ TypeImplA ], context );
    } )

    it( 'should correclt create GrapgQL config', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        let fmo = mo.fields.fieldA;

        let gql = resolverConfigFactory( fmo, 'fieldA', context );
        expect( gql.type ).toBe( context.lookupType( getMetaObject( TypeImplA ).name ) );
        expect( gql.description ).toBe( 'Desc' );
        expect( gql.args ).toHaveProperty( 'arg1' );
        expect( gql.args ).toHaveProperty( 'arg2' );
        expect( gql.args.arg2.type ).toBeInstanceOf( GraphQLNonNull );
        expect( (gql.args.arg2.type as GraphQLNonNull<any>).ofType ).toBeInstanceOf( GraphQLList );
    } );
} );
