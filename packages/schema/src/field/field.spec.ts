import {
    GraphQLSchema, GraphQLObjectType, GraphQLScalarType, GraphQLNonNull, GraphQLList
} from 'graphql';
import { getMetaObject, TestBed, inject, Injector } from 'aerographql-core';
import { FactoryContext } from '../shared';
import { schemaFactory, Schema } from '../schema';
import { InputObject, InputObjectMetaObject } from '../input-object';
import { ObjectDefinition, ObjectDefinitionMetaObject } from '../object';
import { Field } from './field';

@ObjectDefinition( {
    name: 'TypeB',
    description: 'Desc',
} )
class TestTypeB {
    @Field( { type: 'Int' } ) fieldA: number;
    @Field( { type: 'Float' } ) fieldB: number[];
}

@ObjectDefinition( {
    name: 'TypeA',
    description: 'Desc',
} )
class TestTypeA {
    @Field( { type: 'Int', description: 'Desc' } ) fieldA: number;
    @Field( { type: 'String', description: 'Desc', nullable: true } ) fieldB: number;
    @Field( { type: 'Float', description: 'Desc' } ) fieldC: number[];
    @Field( { type: TestTypeB, description: 'Desc' } ) fieldD: TestTypeB[];
}

@Schema( {
    rootQuery: 'TypeA',
    components: [ TestTypeA, TestTypeB ]
} )
class TestSchemaA { }


describe( '@Field decorator', () => {
    it( 'should set the correct fields metadata', () => {
        expect( getMetaObject( TestTypeB ) ).not.toBeNull();
        let md = getMetaObject<ObjectDefinitionMetaObject>( TestTypeB );

        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.nullable ).toBe( false );
        expect( md.fields.fieldA.list ).toBe( false );
        expect( md.fields.fieldA.type ).toBe( 'Int' );
        expect( md.fields.fieldA.description ).toBeNull();

        expect( md.fields ).toHaveProperty( 'fieldB' );
        expect( md.fields.fieldB.nullable ).toBe( false );
        expect( md.fields.fieldB.list ).toBe( true );
        expect( md.fields.fieldB.type ).toBe( 'Float' );
        expect( md.fields.fieldB.description ).toBeNull();
    } );

    it( 'should extract the right field type', () => {

        let md = getMetaObject<ObjectDefinitionMetaObject>( TestTypeA )
        expect( md ).not.toBeNull();
        expect( md.fields ).toHaveProperty( 'fieldD' );
        expect( md.fields.fieldD.type ).toBe( 'TypeB' );

        md = getMetaObject<ObjectDefinitionMetaObject>( TestTypeB )
        expect( md ).not.toBeNull();
        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.type ).toBe( 'Int' );

    } )
} );


describe( 'fieldConfigFactory function', () => {

    let factoryContext: FactoryContext;
    let graphqlSchema: GraphQLSchema;
    let injector: Injector;
    let typeA: GraphQLObjectType;

    beforeEach( () => {
        injector = TestBed.configure( {
            providers: []
        } );
        factoryContext = new FactoryContext( injector );
        graphqlSchema = schemaFactory( getMetaObject( TestSchemaA ), factoryContext );
        typeA = graphqlSchema.getType( 'TypeA' ) as GraphQLObjectType;
    } );

    it( 'should create the correct type', () => {
        expect( typeA ).not.toBeUndefined();
        expect( typeA.description ).toEqual( 'Desc' );
        expect( typeA ).toBeInstanceOf( GraphQLObjectType );
    } );

    it( 'should create the correct fields ', () => {
        let fieldA = typeA.getFields().fieldA;
        expect( fieldA ).not.toBeUndefined();
        expect( fieldA.name ).toBe( 'fieldA' );
        expect( fieldA.description ).toBe( 'Desc' );

        let fieldAType = fieldA.type as GraphQLNonNull<GraphQLScalarType>;
        expect( fieldAType ).toBeInstanceOf( GraphQLNonNull );
        expect( fieldAType.ofType ).toBeInstanceOf( GraphQLScalarType );
        expect( fieldAType.ofType.name ).toBe( 'Int' );

        let fieldB = typeA.getFields().fieldB;
        let fieldBType = fieldB.type as GraphQLScalarType;
        expect( fieldBType ).toBeInstanceOf( GraphQLScalarType );
        expect( fieldBType.name ).toBe( 'String' );

        let fieldC = typeA.getFields().fieldC;
        let fieldCType = fieldC.type as GraphQLNonNull<GraphQLList<GraphQLScalarType>>;
        expect( fieldCType ).toBeInstanceOf( GraphQLNonNull );
        expect( fieldCType.ofType ).toBeInstanceOf( GraphQLList );
        expect( fieldCType.ofType.ofType ).toBeInstanceOf( GraphQLScalarType );

        let fieldD = typeA.getFields().fieldD;
        let fieldDType = fieldD.type as GraphQLNonNull<GraphQLList<GraphQLObjectType>>;
        expect( fieldDType ).toBeInstanceOf( GraphQLNonNull );
        expect( fieldDType.ofType ).toBeInstanceOf( GraphQLList );
        expect( fieldDType.ofType.ofType ).toBeInstanceOf( GraphQLObjectType );
    } );

} );
