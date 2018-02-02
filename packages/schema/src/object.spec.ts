import {
    GraphQLSchema, GraphQLObjectType, GraphQLScalarType, GraphQLNonNull, GraphQLList,
    GraphQLInputObjectType, GraphQLResolveInfo
} from 'graphql';
import { EventEmitter } from 'events'
import { ExpressHandler, graphqlExpress } from 'apollo-server-express';
import * as httpMocks from 'node-mocks-http';
import {
    getMetaObject, getMetaObjectType,
    METAOBJECT_TYPES, TestBed, Injector
} from 'aerographql-core';
import { ObjectDefinition, ObjectDefinitionMetaObject } from './object-definition';
import { ObjectImplementation, ObjectImplementationMetaObject } from './object-implementation';
import { InputObject, InputObjectMetaObject } from './input-object';
import { inputFactory } from './input-object-factory';
import { Field } from './field';
import { Resolver } from './resolver';
import { Arg } from './arg';
import { Middleware } from './middleware';
import { objectTypeFactory } from './object-factory';
import { FactoryContext } from './factory-context';
import { Schema } from './schema';
import { BaseSchema } from './base-schema';


let callIndex = 0;

@Middleware()
class MiddlewareA {
    execute() {
        ( this as any )[ 'execute' ].callIndex = callIndex++;
        return 'MiddlewareAReturn';
    }
}

@Middleware()
class MiddlewareB {
    execute() {
        ( this as any )[ 'execute' ].callIndex = callIndex++;
        return Promise.resolve( 'MiddlewareBReturn' );
    }
}

@Middleware()
class MiddlewareC {
    execute( source: any, args: any ) {
        ( this as any )[ 'execute' ].callIndex = callIndex++;

        if ( args.input.errored )
            return false;

        return true;
    }
}

@InputObject( { name: 'InputA', description: 'Desc', } )
class InputA {
    @Field( { type: 'Boolean', description: 'Desc' } )
    errored: boolean;
}

@ObjectDefinition( { name: 'TypeA', description: 'Desc' } )
class TypeA {

}

@ObjectDefinition()
class TypeB {
    @Field( { type: 'Int' } )
    fieldA: number;

    @Field( { type: 'Float' } )
    fieldB: number[];
}


@ObjectImplementation( { name: 'TypeA', middlewares: [ MiddlewareA, MiddlewareB ] } )
class TypeImplA {

    @Resolver( {
        type: 'Int',
        middlewares: [ MiddlewareC, { provider: MiddlewareB, options: 'MwOptions' } ]
    } )
    resolverA( @Arg() input: InputA ) {
        return 'ResolverAReturn';
    }

    @Resolver( {
        type: 'Int'
    } )
    resolverB( @Arg() input: InputA ) {
        return 'ResolverBReturn';
    }

    @Resolver( {
        type: 'Int'
    } )
    resolverC( source: any, @Arg() input: InputA, context: any ) {
        return 'ResolverCReturn';
    }
}

@ObjectImplementation( {
    name: 'TypeB'
} )
class TypeImplB1 {

    @Resolver( { type: 'TypeA' } )
    resolverA( src: any, @Arg() arg1: number ) {
    }
}

@ObjectImplementation( {
    name: 'TypeB'
} )
class TypeImplB2 {

    @Resolver( { type: 'TypeA' } )
    resolverB( src: any, @Arg() arg1: number ) {
    }
}

describe( '@TypeDefinition decorator', () => {

    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TypeA ) ).not.toBeNull();

        let md = getMetaObject<ObjectDefinitionMetaObject>( TypeA );
        expect( md.name ).toBe( 'TypeA' );
        expect( md.fields ).toEqual( {} );
        expect( md.implements ).toHaveLength( 0 );
    } );
    it( 'should set the correct default name when not specified', () => {
        expect( getMetaObject( TypeB ) ).not.toBeNull();

        let md = getMetaObject<ObjectDefinitionMetaObject>( TypeB );
        expect( md.name ).toBe( 'TypeB' );
        expect( md.description ).toBeNull();
        expect( md.implements ).toHaveLength( 0 );
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

describe( '@TypeImplementation decorator', () => {
    it( 'should set the correct metadata when using weakly typed type info', () => {
        expect( getMetaObject( TypeImplA ) ).not.toBeNull();
        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplA );
        expect( md.name ).toBe( 'TypeA' );
    } );
    it( 'should set the correct metadata when using strongly typed type info', () => {
        expect( getMetaObject( TypeImplB1 ) ).not.toBeNull();
        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB1 );
        expect( md.name ).toBe( 'TypeB' );
    } );
    it( 'should set the correct type', () => {
        expect( getMetaObjectType( TypeImplA ) ).toBe( METAOBJECT_TYPES.objectImplementation );
    } );
} );

describe( '@Arg decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TypeImplB1 ) ).not.toBeNull();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB1 );
        expect( md.fields.resolverA.args ).toHaveProperty( 'arg1' );
        expect( md.fields.resolverA.args.arg1.index ).toBe( 1 );
        expect( md.fields.resolverA.args.arg1.nullable ).toBe( false );
        expect( md.fields.resolverA.args.arg1.type ).toBe( 'Int' );
    } );
} );

describe( 'typeFactory', () => {
    let factoryContext: FactoryContext;
    let typeA: GraphQLObjectType;
    let typeB: GraphQLObjectType;
    let inputA: GraphQLInputObjectType;
    let injector: Injector;

    beforeEach( () => {
        injector = TestBed.configure( {
            providers: [ TypeImplA, MiddlewareA, MiddlewareB, MiddlewareC ]
        } );
        factoryContext = new FactoryContext( injector );

        inputA = inputFactory( InputA, factoryContext );
        typeA = objectTypeFactory( [ TypeA ], [ TypeImplA ], factoryContext );
        typeB = objectTypeFactory( [ TypeB ], [ TypeImplB1 ], factoryContext );
    } );

    describe( 'with a type definition', () => {

        it( 'should create the correct type', () => {
            expect( typeA ).not.toBeUndefined();
            expect( typeA.description ).toEqual( 'Desc' );
            expect( typeA ).toBeInstanceOf( GraphQLObjectType );
        } );

        it( 'should create the correct fields ', () => {

            let fieldA = typeB.getFields().fieldA;
            expect( fieldA ).not.toBeUndefined();
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
            expect( typeA ).not.toBeUndefined();
            expect( typeA.description ).toEqual( 'Desc' );
            expect( typeA ).toBeInstanceOf( GraphQLObjectType );

            let resovlerA = typeA.getFields().resolverA;
            expect( resovlerA ).not.toBeUndefined();
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
            expect( typeB ).not.toBeUndefined();
            let resovlerA = typeA.getFields().resolverA;
            expect( resovlerA ).not.toBeUndefined();
            expect( resovlerA.name ).toBe( 'resolverA' );
            expect( resovlerA.args ).toHaveLength( 1 );
            let resovlerB = typeA.getFields().resolverB;
            expect( resovlerB ).not.toBeUndefined();
            expect( resovlerB.name ).toBe( 'resolverB' );
            expect( resovlerB.args ).toHaveLength( 1 );
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

        it( 'should call the middlwares with the correct parameters and in the correct order', () => {
            let spy1 = jest.spyOn( injector.get( MiddlewareC ), 'execute' );
            let spy2 = jest.spyOn( injector.get( MiddlewareB ), 'execute' );

            // Fake call on the resolver (this is done by the graphql runtime)
            let source = {}
            let args = { input: { errored: false } };
            let context = {};
            resovlerA.resolve( source, args, context, null ).then( ( result: any ) => {
                expect( spy1 ).toHaveBeenCalledTimes( 1 );
                expect( spy1 ).toHaveBeenCalledWith( source, args, context );
                expect( spy2 ).toHaveBeenCalledTimes( 1 );
                expect( spy2 ).toHaveBeenCalledWith( source, args, context );
                expect( ( spy1 as any ).callIndex ).toBeLessThan( ( spy2 as any ).callIndex );
            } );
        } );

        it( 'should stop on middleware error', () => {
            let spy1 = jest.spyOn( injector.get( MiddlewareC ), 'execute' );
            let spy2 = jest.spyOn( injector.get( MiddlewareB ), 'execute' );
            let spy3 = jest.spyOn( injector.get( TypeImplA ), 'resolverA' );

            // Fake call on the resolver (this is done by the graphql runtime)
            let source = {}
            let args = { input: { errored: true } };
            let context = {};
            resovlerA.resolve( source, args, context, null ).then( ( result: any ) => {
                expect( spy1 ).toHaveBeenCalledTimes( 1 );
                expect( spy1 ).toHaveBeenCalledWith( source, args, context );
                expect( spy2 ).toHaveBeenCalledTimes( 0 );
                expect( spy3 ).toHaveBeenCalledTimes( 0 );
            } );
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
                    expect( spy ).toHaveBeenCalledWith( source, args.input, { middlewareResults: [ 'MiddlewareAReturn', 'MiddlewareBReturn' ] } )
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
                    expect( spy ).toHaveBeenCalledWith( args.input, { middlewareResults: [ true, 'MiddlewareBReturn' ] } )
                } );
            } );
        } );
    } );
} )

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


describe( 'Object', () => {
    let response: httpMocks.MockResponse;
    let schema: TestSchema;
    let middleware: ExpressHandler;

    beforeEach( () => {
        schema = new TestSchema();
        response = httpMocks.createResponse( { eventEmitter: EventEmitter } );
        TestRootQuery.spy = jest.fn();
        middleware = graphqlExpress( { schema: schema.graphQLSchema } );
    } )

    it( 'should work with simple query', ( done ) => {
        let request = httpMocks.createRequest( {
            method: 'POST',
            body: {
                query: `{ query1 { fieldA fieldB  } }`
            }
        } );

        middleware( request, response, null );
        response.on( 'end', () => {
            var gqlResponse = JSON.parse( response._getData() );
            expect( gqlResponse.data.query1 ).toEqual( { fieldA: 0, fieldB: "String" } );
            expect( response.statusCode ).toBe( 200 );
            done();
        } );
    } )

} )
