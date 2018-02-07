import {
    GraphQLSchema, GraphQLObjectType, GraphQLScalarType, GraphQLNonNull, GraphQLList,
    GraphQLInputObjectType, GraphQLResolveInfo
} from 'graphql';
import {
    getMetaObject, getMetaObjectType,
    METAOBJECT_TYPES, TestBed, Injector
} from 'aerographql-core';
import { ObjectDefinition, ObjectDefinitionMetaObject } from './object-definition';
import { ObjectImplementation, ObjectImplementationMetaObject } from './object-implementation';
import { InputObject, InputObjectMetaObject, inputFactory } from '../input-object';
import { Field } from '../field';
import { Resolver } from '../resolver';
import { Arg } from '../arg';
import { Middleware } from '../middleware';
import { FactoryContext } from '../shared';
import { ServerMock } from '../test-utils';
import { objectTypeFactory } from './object-factory';
import { Schema, BaseSchema } from '../schema';
import { Interface, interfaceFactory } from '../interface';


describe( '@ObjectDefinition decorator', () => {

    @ObjectDefinition( { name: 'TypeA', description: 'Desc' } ) class TypeA { }

    @ObjectDefinition()
    class TypeB {
        @Field( { type: 'Int' } ) fieldA: number;
        @Field( { type: 'Float' } ) fieldB: number[];
    }

    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TypeA ) ).not.toBeNull();

        let mo = getMetaObject<ObjectDefinitionMetaObject>( TypeA );
        expect( mo.name ).toBe( 'TypeA' );
        expect( mo.fields ).toEqual( {} );
        expect( mo.implements ).toHaveLength( 0 );
    } );
    it( 'should set the correct default name when not specified', () => {
        expect( getMetaObject( TypeB ) ).not.toBeNull();

        let mo = getMetaObject<ObjectDefinitionMetaObject>( TypeB );
        expect( mo.name ).toBe( 'TypeB' );
        expect( mo.description ).toBeNull();
        expect( mo.implements ).toHaveLength( 0 );
    } );
    it( 'should set the correct fields metadata', () => {
        expect( getMetaObject( TypeB ) ).not.toBeNull();
        let md = getMetaObject<ObjectDefinitionMetaObject>( TypeB );

        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields[ 'fieldA' ].nullable ).toBe( false );
        expect( md.fields[ 'fieldA' ].list ).toBe( false );
        expect( md.fields[ 'fieldA' ].type ).toBe( 'Int' );
        expect( md.fields[ 'fieldA' ].description ).toBeNull();

        expect( md.fields ).toHaveProperty( 'fieldB' );
        expect( md.fields[ 'fieldB' ].nullable ).toBe( false );
        expect( md.fields[ 'fieldB' ].list ).toBe( true );
        expect( md.fields[ 'fieldB' ].type ).toBe( 'Float' );
        expect( md.fields[ 'fieldB' ].description ).toBeNull();
    } );
} );

describe( '@ObjectImplementation decorator', () => {

    @Interface( { name: 'IA' } ) class IA { }
    @Interface( { name: 'IB' } ) class IB { }
    @ObjectImplementation( { name: 'TypeA', description: 'Desc', implements: [ IA, IB ] } )
    class TypeImplA { }
    @ObjectImplementation( { name: 'TypeB' } )
    class TypeImplB { }

    it( 'should set the correct metadata ', () => {
        expect( getMetaObject( TypeImplA ) ).toBeDefined();
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( mo.name ).toBe( 'TypeA' );
        expect( mo.description ).toBe( 'Desc' );
        expect( mo.implements ).toHaveLength( 2 );
    } );
    it( 'should correctly handle empty implements array', () => {
        expect( getMetaObject( TypeImplB ) ).toBeDefined();
        let mo = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( mo.name ).toBe( 'TypeB' );
        expect( mo.implements ).toHaveLength( 0 );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( TypeImplA ) ).toBe( METAOBJECT_TYPES.objectImplementation );
    } );
} );

describe( '@Arg decorator', () => {
    @ObjectImplementation( {
        name: 'TypeB'
    } )
    class TypeImplB1 {
        @Resolver( { type: 'TypeA' } )
        resolverA( src: any, @Arg() arg1: number ) { }
    }

    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TypeImplB1 ) ).not.toBeNull();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB1 );
        expect( md.resolvers.resolverA.args ).toHaveProperty( 'arg1' );
        expect( md.resolvers.resolverA.args.arg1.index ).toBe( 1 );
        expect( md.resolvers.resolverA.args.arg1.nullable ).toBe( false );
        expect( md.resolvers.resolverA.args.arg1.type ).toBe( 'Int' );
    } );
} );

describe( 'objectTypeFactory function', () => {

    let callIndex = 0;

    @Interface() class IA { }
    @Interface() class IB { }

    @Middleware()
    class MA {
        execute() {
            ( this as any )[ 'execute' ].callIndex = callIndex++;
            return 'MiddlewareAReturn';
        }
    }

    @Middleware()
    class MB {
        execute() {
            ( this as any )[ 'execute' ].callIndex = callIndex++;
            return Promise.resolve( 'MiddlewareBReturn' );
        }
    }

    @Middleware()
    class MC {
        execute( source: any, args: any, context: any ) {
            ( this as any )[ 'execute' ].callIndex = callIndex++;
            return !args.input.errored;
        }
    }

    @InputObject( { name: 'InputA', description: 'Desc', } )
    class InputA {
        @Field( { type: 'Boolean', description: 'Desc' } ) errored: boolean;
    }

    @ObjectDefinition( { name: 'TypeA', description: 'Desc', implements: [ IA ] } )
    class TypeA { }

    @ObjectDefinition()
    class TypeB {
        @Field( { type: 'Int' } ) fieldA: number;
        @Field( { type: 'Float' } ) fieldB: number[];
    }

    @ObjectImplementation( {
        name: 'TypeA',
        middlewares: [ { provider: MA, resultName: 'A' }, { provider: MB, resultName: 'B' } ],
        implements: [ IB ]
    } )
    class TypeImplA {

        @Resolver( {
            type: 'Int',
            middlewares: [ { provider: MC, resultName: 'C' }, { provider: MB, options: 'MwOptions', resultName: 'B' } ]
        } )
        resolverA( @Arg() input: InputA ) { return 'ResolverAReturn'; }

        @Resolver( { type: 'Int' } )
        resolverB( @Arg() input: InputA ) { return 'ResolverBReturn'; }

        @Resolver( { type: 'Int' } )
        resolverC( source: any, @Arg() input: InputA, context: any ) {
            return 'ResolverCReturn';
        }
    }

    let context: FactoryContext;
    let typeA: GraphQLObjectType;
    let typeB: GraphQLObjectType;
    let inputA: GraphQLInputObjectType;
    let injector: Injector;

    beforeEach( () => {
        injector = TestBed.configure( {
            providers: [ TypeImplA, MA, MB, MC ]
        } );
        context = new FactoryContext( injector );

        interfaceFactory( IA, context );
        interfaceFactory( IB, context );
        inputA = inputFactory( InputA, context );
        typeA = objectTypeFactory( [ TypeA ], [ TypeImplA ], context );
        typeB = objectTypeFactory( [ TypeB ], [], context );
    } );

    describe( 'with a type definition', () => {

        it( 'should create the correct type', () => {
            expect( typeA ).toBeDefined();
            expect( typeA.description ).toEqual( 'Desc' );
            expect( typeA ).toBeInstanceOf( GraphQLObjectType );
        } );

        it( 'should create the correct fields ', () => {

            let fieldA = typeB.getFields().fieldA;
            expect( fieldA ).toBeDefined();
            expect( fieldA.name ).toBe( 'fieldA' );
            expect( fieldA.description ).toBeUndefined();

            let fieldAType = fieldA.type as GraphQLNonNull<GraphQLScalarType>;
            expect( fieldAType ).toBeInstanceOf( GraphQLNonNull );
            expect( fieldAType.ofType ).toBeInstanceOf( GraphQLScalarType );
            expect( fieldAType.ofType.name ).toBe( 'Int' );

            let fieldB = typeB.getFields().fieldB;
            let fieldBType = fieldB.type as GraphQLNonNull<GraphQLList<GraphQLScalarType>>;
            expect( fieldBType ).toBeInstanceOf( GraphQLNonNull );
            expect( fieldBType.ofType ).toBeInstanceOf( GraphQLList );
            expect( fieldBType.ofType.ofType ).toBeInstanceOf( GraphQLScalarType );
        } );
    } );

    describe( 'with a type implementation', () => {
        it( 'should create the correct resolvers and arguments type', () => {
            expect( typeA ).toBeDefined();
            expect( typeA.description ).toEqual( 'Desc' );
            expect( typeA ).toBeInstanceOf( GraphQLObjectType );

            let resovlerA = typeA.getFields().resolverA;
            expect( resovlerA ).toBeDefined();
            expect( resovlerA.name ).toBe( 'resolverA' );
            expect( resovlerA.args ).toHaveLength( 1 );
            let argA = resovlerA.args[ 0 ];
            expect( argA.name ).toBe( 'input' );
            expect( argA.type ).toBeInstanceOf( GraphQLNonNull );
            let argAType = argA.type as GraphQLNonNull<GraphQLScalarType>;
            expect( argAType ).toBeInstanceOf( GraphQLNonNull );
            expect( argAType.ofType ).toBeInstanceOf( GraphQLInputObjectType );
            expect( argAType.ofType.name ).toBe( 'InputA' );
        } );
    } );


    describe( 'with multiple type implementations', () => {
        it( 'should create the correct resolvers and arguments type', () => {
            expect( typeB ).toBeDefined();
            let resovlerA = typeA.getFields().resolverA;
            expect( resovlerA ).toBeDefined();
            expect( resovlerA.name ).toBe( 'resolverA' );
            expect( resovlerA.args ).toHaveLength( 1 );
            let resovlerB = typeA.getFields().resolverB;
            expect( resovlerB ).toBeDefined();
            expect( resovlerB.name ).toBe( 'resolverB' );
            expect( resovlerB.args ).toHaveLength( 1 );
        } )
    } );

    describe( 'with both definition and implementation', () => {
        it( 'should create the correct interfaces array', () => {
            let interfaces = typeA.getInterfaces();
            expect( interfaces ).toContain( context.lookupType( getMetaObject( IA ).name ) );
            expect( interfaces ).toContain( context.lookupType( getMetaObject( IB ).name ) );
        } )
    } );

    describe( 'with middleware for resolvers defined at the field implementation level', () => {
        let resovlerA: any;
        let resovlerB: any;
        let resovlerC: any;

        beforeEach( () => {
            resovlerA = typeA.getFields().resolverA;
            resovlerB = typeA.getFields().resolverB;
            resovlerC = typeA.getFields().resolverC;
        } );

        it( 'should call the middlwares with the correct parameters and in the correct order', async () => {
            let spy1 = jest.spyOn( injector.get( MC ), 'execute' );
            let spy2 = jest.spyOn( injector.get( MB ), 'execute' );

            // Fake call on the resolver (this is done by the graphql runtime)
            let source = {}
            let args = { input: { errored: false } };
            let context = {};
            let options: any = undefined;
            let p = resovlerA.resolve( source, args, context, null ).then( ( result: any ) => {
                expect( spy1 ).toHaveBeenCalledTimes( 1 );
                expect( spy1 ).toHaveBeenCalledWith( source, args, context, options );
                expect( spy2 ).toHaveBeenCalledTimes( 1 );
                expect( spy2 ).toHaveBeenCalledWith( source, args, context, "MwOptions" );
                expect( ( spy1 as any ).callIndex ).toBeLessThan( ( spy2 as any ).callIndex );
                return result;
            } );
            expect( p ).resolves.toBe( 'ResolverAReturn');
        } );

        it( 'should stop on middleware error', () => {
            let spy1 = jest.spyOn( injector.get( MC ), 'execute' );
            let spy2 = jest.spyOn( injector.get( MB ), 'execute' );
            let spy3 = jest.spyOn( injector.get( TypeImplA ), 'resolverA' );

            // Fake call on the resolver (this is done by the graphql runtime)
            let source = {}
            let args = { input: { errored: true } };
            let context = { middlewareResults: {} };
            let options: any = undefined;
            let p = resovlerA.resolve( source, args, context, null ).then( () => {
                expect( spy1 ).toHaveBeenCalledTimes( 1 );
                expect( spy1 ).toHaveBeenCalledWith( source, args, context, options );
                expect( spy2 ).toHaveBeenCalledTimes( 0 );
                expect( spy3 ).toHaveBeenCalledTimes( 0 );
            } );
            expect( p ).rejects.toEqual( { "middleware": "MC", "reason": false } );

        } );

        describe( 'should call the resolver with the correct parameters', () => {

            it( 'if source param is not used', () => {
                let spy3 = jest.spyOn( injector.get( TypeImplA ), 'resolverB' );

                // Fake call on the resolver (this is done by the graphql runtime)
                let source = {}
                let args = { input: { fieldA: 23 } };
                let context = {};
                resovlerB.resolve( source, args, context, null ).then( ( result: any ) => {
                    expect( result ).toBe( 'ResolverBReturn' );
                    expect( spy3 ).toHaveBeenCalledTimes( 1 );
                    expect( spy3 ).toHaveBeenCalledWith( args.input, context )
                } );
            } );

            it( 'if source param is used', () => {
                let spy3 = jest.spyOn( injector.get( TypeImplA ), 'resolverC' );

                // Fake call on the resolver (this is done by the graphql runtime)
                let source = {}
                let args = { input: { fieldA: 23 } };
                let context = {};
                resovlerC.resolve( source, args, context, null ).then( ( result: any ) => {
                    expect( result ).toBe( 'ResolverCReturn' );
                    expect( spy3 ).toHaveBeenCalledTimes( 1 );
                    expect( spy3 ).toHaveBeenCalledWith( source, args.input, context )
                } );
            } );
        } );

        describe( 'should store the middleware results in context', () => {
            test( 'with middleware defined at the type level', () => {

                let spy = jest.spyOn( injector.get( TypeImplA ), 'resolverC' );

                // Fake call on the resolver (this is done by the graphql runtime)
                let source = {}
                let args = { input: { fieldA: 23 } };
                let context = {};
                resovlerC.resolve( source, args, context, null ).then( ( result: any ) => {
                    expect( result ).toBe( 'ResolverCReturn' );
                    expect( spy ).toHaveBeenCalledTimes( 1 );
                    expect( spy ).toHaveBeenCalledWith( source, args.input, { middlewareResults: { A: [ 'MiddlewareAReturn' ], B: [ 'MiddlewareBReturn' ] } } )
                } );
            } );

            test( 'with middleware defined at the resolver level', () => {

                let spy = jest.spyOn( injector.get( TypeImplA ), 'resolverA' );

                // Fake call on the resolver (this is done by the graphql runtime)
                let source = {}
                let args = { input: { fieldA: 23 } };
                let context = {};
                resovlerA.resolve( source, args, context, null ).then( ( result: any ) => {
                    expect( result ).toBe( 'ResolverAReturn' );
                    expect( spy ).toHaveBeenCalledTimes( 1 );
                    expect( spy ).toHaveBeenCalledWith( args.input, { middlewareResults: { C: [ true ], B: [ 'MiddlewareBReturn' ] } } )
                } );
            } );
        } );
    } );
} )



describe( 'When used from an express middleware, Object', () => {

    @ObjectDefinition( {
        name: 'TestType1'
    } )
    class TestType1 {
        @Field( { type: 'Int' } ) fieldA: number = 0;
        @Field() fieldB: string = "String";
    }

    @ObjectImplementation( { name: 'TestRootQuery' } )
    class TestRootQuery {
        static spy: jest.Mock;
        @Resolver( { type: TestType1 } )
        query1( parent: any, context: any ) {
            TestRootQuery.spy( context );
            return new TestType1();
        }
    }
    @Schema( { rootQuery: 'TestRootQuery', components: [ TestRootQuery, TestType1 ] } )
    class TestSchema extends BaseSchema {
    }

    let response: ServerMock.Response;
    let schema: TestSchema;
    let middleware: ServerMock.Middleware;

    beforeEach( () => {
        schema = new TestSchema();
        response = ServerMock.createResponse();
        middleware = ServerMock.createMiddleware( schema );
        TestRootQuery.spy = jest.fn();
    } )

    it( 'should work with simple query', ( done ) => {
        let request = ServerMock.createRequest( `{ query1 { fieldA fieldB  } }` );

        middleware( request, response, null );
        response.on( 'end', () => {
            var gqlResponse = JSON.parse( response._getData() );
            expect( gqlResponse.data.query1 ).toEqual( { fieldA: 0, fieldB: "String" } );
            expect( response.statusCode ).toBe( 200 );
            done();
        } );
    } )

} )
