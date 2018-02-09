
import { GraphQLList, GraphQLNonNull } from 'graphql';

import { ObjectImplementation, ObjectImplementationMetaObject, ObjectDefinition, objectTypeFactory } from '../object';
import { Resolver, ResolverMetaObject } from './resolver';
import { resolverConfigFactory } from './resolver-config-factory'
import { Arg } from '../arg';
import { FactoryContext, getMetaObject } from '../shared';

describe( '@Resolver decorator', () => {

    @ObjectDefinition( { name: 'TypeA' } ) class TypeA { }

    @ObjectImplementation( { name: 'TypeA', description: 'Desc' } )
    class TypeImplA {
        @Resolver( { type: 'TypeA', description: 'Desc', nullable: true } )
        fieldA( src: any, @Arg() arg1: number, @Arg( { type: 'Int' } ) arg2: number[] ) { }
    }

    class UnanotatedType { }

    @ObjectImplementation( { name: 'TypeA' } )
    class TypeImplB {
        @Resolver( { type: TypeA, description: 'Desc' } ) fieldA( src: any, @Arg() arg1: number ) { }
        @Resolver( { type: TypeA, list: true } ) fieldB( src: any, @Arg() arg1: number ) { }
        @Resolver( { type: TypeA } ) fieldC( src: any, @Arg() arg1: number ): TypeA[] { return null }
    }

    it( 'should correctly set description', () => {
        expect( getMetaObject( TypeImplA ) ).toBeDefined();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( md.resolvers ).toHaveProperty( 'fieldA' );
        expect( md.resolvers.fieldA.description ).toBe( 'Desc' );

        md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( md.resolvers ).toHaveProperty( 'fieldA' );
        expect( md.resolvers.fieldA.description ).toBe( 'Desc' );
    } )

    it( 'should set the correct metadata', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( mo.name ).toBe( 'TypeA' );
        expect( mo.description ).toBe( 'Desc' );
        expect( mo.resolvers ).toHaveProperty( 'fieldA' );
        expect( mo.resolvers.fieldA.type ).toBe( 'TypeA' );
        expect( mo.resolvers.fieldA.list ).toBe( false );
        expect( mo.resolvers.fieldA.nullable ).toBe( true );
        expect( mo.resolvers.fieldA.instanceToken ).toBe( 'TypeImplA' );

    } );

    it( 'should correctly determine if returning list when sepcified explicitly', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( mo.name ).toBe( 'TypeA' );
        expect( mo.resolvers ).toHaveProperty( 'fieldB' );
        expect( mo.resolvers.fieldB.type ).toBe( 'TypeA' );
        expect( mo.resolvers.fieldB.list ).toBe( true );
        expect( mo.resolvers.fieldB.instanceToken ).toBe( 'TypeImplB' );
    } );

    it( 'should correctly determine if returning list when sepcified in return value signature', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( mo.name ).toBe( 'TypeA' );
        expect( mo.resolvers ).toHaveProperty( 'fieldC' );
        expect( mo.resolvers.fieldC.type ).toBe( 'TypeA' );
        expect( mo.resolvers.fieldC.list ).toBe( true );
        expect( mo.resolvers.fieldC.instanceToken ).toBe( 'TypeImplB' );
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


describe( 'resolverConfigFactory function', () => {

    @ObjectImplementation( { name: 'TypeA', description: 'Desc' } )
    class TypeImplA {
        @Resolver( { type: 'TypeA', description: 'Desc', nullable: true } )
        fieldA( src: any, @Arg() arg1: number, @Arg( { type: 'Int' } ) arg2: number[] ) { }


        @Resolver( { type: 'TypeA', description: 'Desc', list: true } )
        fieldB( src: any, @Arg() arg1: number, @Arg( { type: 'Int' } ) arg2: number[] ) { }

        @Resolver( { type: 'InvalidType', description: 'Desc', list: true } )
        fieldC( src: any, @Arg() arg1: number, @Arg( { type: 'Int' } ) arg2: number[] ) { }


        @Resolver( { type: 'Int', description: 'Desc', list: true } )
        fieldD( src: any, @Arg( { type: 'InvalidType' } ) arg1: number, @Arg( { type: 'Int' } ) arg2: number[] ) { }
    }

    let context: FactoryContext;
    beforeEach( () => {
        context = new FactoryContext();
        objectTypeFactory( [], [ TypeImplA ], context );
    } )

    it( 'should correctly create GrapgQL config', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        let gql = resolverConfigFactory( mo.resolvers.fieldA, 'fieldA', context );
        expect( gql.type ).toBe( context.lookupType( getMetaObject( TypeImplA ).name ) );
        expect( gql.description ).toBe( 'Desc' );
        expect( gql.args ).toHaveProperty( 'arg1' );
        expect( gql.args ).toHaveProperty( 'arg2' );
        expect( gql.args.arg2.type ).toBeInstanceOf( GraphQLNonNull );
        expect( ( gql.args.arg2.type as GraphQLNonNull<any> ).ofType ).toBeInstanceOf( GraphQLList );
    } );

    it( 'should correctly create GrapgQL config for list field', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        let gql = resolverConfigFactory( mo.resolvers.fieldB, 'fieldB', context );
        expect( gql.type ).toBeInstanceOf( GraphQLNonNull );
        expect( ( gql.type as GraphQLNonNull<any> ).ofType ).toBeInstanceOf( GraphQLList );
        expect( ( gql.type as GraphQLNonNull<any> ).ofType.ofType ).toBe( context.lookupType( getMetaObject( TypeImplA ).name ) );
        expect( gql.description ).toBe( 'Desc' );
        expect( gql.args ).toHaveProperty( 'arg1' );
        expect( gql.args ).toHaveProperty( 'arg2' );
        expect( gql.args.arg2.type ).toBeInstanceOf( GraphQLNonNull );
        expect( ( gql.args.arg2.type as GraphQLNonNull<any> ).ofType ).toBeInstanceOf( GraphQLList );
    } );

    it( 'should throw if type is not valid', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( () => resolverConfigFactory( mo.resolvers.fieldC, 'fieldC', context ) ).toThrow();
    } );

    it( 'should throw if arg type is not valid', () => {
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( () => resolverConfigFactory( mo.resolvers.fieldD, 'fieldD', context ) ).toThrow();
    } );
} );
