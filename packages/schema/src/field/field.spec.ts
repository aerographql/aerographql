import {
    GraphQLSchema, GraphQLObjectType, GraphQLScalarType, GraphQLNonNull, GraphQLList
} from 'graphql';
import { getMetaObject, TestBed, inject, Injector } from 'aerographql-core';
import { FactoryContext } from '../shared';
import { schemaFactory, Schema } from '../schema';
import { InputObject, InputObjectMetaObject } from '../input-object';
import { ObjectDefinition, ObjectDefinitionMetaObject } from '../object';
import { Field } from './field';



describe( '@Field decorator', () => {

    @ObjectDefinition( { name: 'TypeA', description: 'Desc', } )
    class TypeA {
        @Field( { type: 'Int' } ) fieldA: number;
        @Field( { type: 'Float' } ) fieldB: number[];
        @Field( { type: TypeA, description: 'Desc' } ) fieldC: TypeA[];
    }


    it( 'should throw if using array for a field without explicit type', () => {
        expect( () => {
            @ObjectDefinition( { name: 'TypeB' } )
            class TypeB { @Field() fieldB: number[]; }

        } ).toThrowError();
    } )

    it( 'should set the correct fields metadata', () => {
        expect( getMetaObject( TypeA ) ).toBeDefined();
        let md = getMetaObject<ObjectDefinitionMetaObject>( TypeA );

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

        let mo = getMetaObject<ObjectDefinitionMetaObject>( TypeA )
        expect( mo ).toBeDefined();
        expect( mo.fields ).toHaveProperty( 'fieldC' );
        expect( mo.fields.fieldC.type ).toBe( 'TypeA' );
        expect( mo.fields ).toHaveProperty( 'fieldA' );
        expect( mo.fields.fieldA.type ).toBe( 'Int' );
        expect( mo.fields ).toHaveProperty( 'fieldB' );
        expect( mo.fields.fieldB.type ).toBe( 'Float' );
        expect( mo.fields.fieldB.list ).toBe( true );
        expect( mo.fields.fieldB.nullable ).toBe( false );

    } )
} );


describe( 'fieldConfigFactory function', () => {

    @ObjectDefinition( { name: 'TypeB' } )
    class TestTypeB { }

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
