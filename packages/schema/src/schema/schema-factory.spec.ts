import {
    GraphQLSchema, GraphQLObjectType, GraphQLScalarType, GraphQLNonNull, GraphQLList,
    GraphQLInputObjectType, GraphQLResolveInfo
} from 'graphql';
import { TestBed, inject, Injector, getMetaObject } from 'aerographql-core';
import { FactoryContext } from '../shared';
import { Middleware } from '../middleware';
import { schemaFactory } from './schema-factory';
import { InputObject, InputObjectMetaObject } from '../input-object';
import { ObjectDefinition, ObjectDefinitionMetaObject, ObjectImplementation } from '../object';
import { Resolver } from '../resolver';
import { Field } from '../field';
import { Arg } from '../arg';
import { Schema } from './schema';

let callIndex = 0;

@Middleware()
class MiddlewareA {
    execute() {
        ( this as any ).execute.callIndex = callIndex++;
        return 'A';
    }
}

@Middleware()
class MiddlewareB {
    execute() {
        ( this as any ).execute.callIndex = callIndex++;
        return 'B';
    }
}

@Middleware()
class MiddlewareC {
    execute( source: any, args: any ) {
        ( this as any ).execute.callIndex = callIndex++;
        return !args.input.errored;
    }
}

@InputObject( {
    name: 'InputA',
    description: 'Desc',
} )
class InputA {
    @Field( { type: 'Boolean', description: 'Desc' } ) errored: boolean;
}

@ObjectImplementation( {
    name: 'TypeA',
    description: 'Desc',
    middlewares: [ { provider: MiddlewareA }, { provider: MiddlewareB } ]
} )
class TypeImplA {

    @Resolver( { type: 'Int', middlewares: [ { provider: MiddlewareC }, { provider: MiddlewareB, options: 'MwOptions' } ] } )
    resolverA( @Arg() input: InputA ) {
        return 'ResolverAReturn';
    }

    @Resolver( { type: 'Int' } )
    resolverB( @Arg() input: InputA ) {
        return 'ResolverBReturn';
    }

    @Resolver( { type: 'Int' } )
    resolverC( source: any, @Arg() input: InputA ) {
        return 'ResolverCReturn';
    }
}

@Schema( {
    rootQuery: 'TypeA',
    components: [ InputA, TypeImplA ],
} )
class SchemaA { }

let factoryContext: FactoryContext;
let graphqlSchema: GraphQLSchema;
let injector: Injector;

beforeEach( () => {
    injector = TestBed.configure( {
        providers: [ TypeImplA, MiddlewareA, MiddlewareB, MiddlewareC ]
    } );
    factoryContext = new FactoryContext( injector );
    graphqlSchema = schemaFactory( SchemaA, factoryContext );
} );

describe( 'For a type definition, Graphql factory', () => {

    it( 'should create the correct type', () => {
        let typeA = graphqlSchema.getType( 'TypeA' ) as GraphQLObjectType;
        expect( typeA ).toBeDefined();
        expect( typeA.description ).toEqual( 'Desc' );
        expect( typeA ).toBeInstanceOf( GraphQLObjectType );
    } );

} );

describe( 'For a type implementation, Graphql factory', () => {
    it( 'should create the resolvers and arguments type', () => {
        let typeA = graphqlSchema.getType( 'TypeA' ) as GraphQLObjectType;
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
} )


describe( 'Resolvers with middleware defined at the field implementation level', () => {
    let typeA: GraphQLObjectType;
    let typeB: GraphQLObjectType;
    let resovlerA: any;
    let resovlerB: any;
    let resovlerC: any;

    beforeEach( () => {
        typeA = graphqlSchema.getType( 'TypeA' ) as GraphQLObjectType;
        typeB = graphqlSchema.getType( 'TypeB' ) as GraphQLObjectType;
        resovlerA = typeA.getFields().resolverA;
        resovlerB = typeA.getFields().resolverB;
        resovlerC = typeA.getFields().resolverC;
    } )
    it( 'should call the middlwares with the correct parameters and in the correct order', () => {
        let spy1 = jest.spyOn( injector.get( MiddlewareC ), 'execute' );
        let spy2 = jest.spyOn( injector.get( MiddlewareB ), 'execute' );

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
        expect( p ).resolves.toBe( 'ResolverAReturn' );
    } )

    it( 'should stop on middleware error', () => {
        let spy1 = jest.spyOn( injector.get( MiddlewareC ), 'execute' );
        let spy2 = jest.spyOn( injector.get( MiddlewareB ), 'execute' );
        let spy3 = jest.spyOn( injector.get( TypeImplA ), 'resolverA' );

        // Fake call on the resolver (this is done by the graphql runtime)
        let source = {}
        let args = { input: { errored: true } };
        let context = {};
        let p = resovlerA.resolve( source, args, context, null ).then( ( result: any ) => {
            expect( spy1 ).toHaveBeenCalledTimes( 1 );
            expect( spy1 ).toHaveBeenCalledWith( source, args, context );
            expect( spy2 ).toHaveBeenCalledTimes( 0 );
            expect( spy3 ).toHaveBeenCalledTimes( 0 );
        } );

        expect( p ).rejects.toEqual( { "middleware": "MiddlewareC", "reason": false } );
    } )

    it( 'should call the resolver with the correct parameters, if source param is not used', () => {
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
    } )

    it( 'should call the resolver with the correct parameters, if source param is used', () => {
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
    } )
} )
