
import { Arg, getArgsMetaObjectMap, ArgsMetaObjectMap } from './arg';
import { ObjectDefinition } from '../object';
import { getMetaObject, ID } from 'aerographql-core';


describe( '@Arg decorator', () => {

    @ObjectDefinition()
    class TypeDef1 { };

    class TypeA {
        fieldA(
            src: any,
            @Arg() arg1: number,
            @Arg() arg2: boolean,
            @Arg() arg3: string,
            @Arg( { type: 'ID' } ) arg4: string,
            @Arg( { type: 'ID' } ) arg5: string[],
            @Arg( ) arg6: TypeDef1,
            @Arg( { type: TypeDef1 } ) arg7: TypeDef1[],
            @Arg( { type: ID }) arg8: ID
        ) { }
    }

    let md: ArgsMetaObjectMap;

    beforeEach( () => {
        md = getArgsMetaObjectMap( TypeA );
    } )
    it( 'should add args map metadata', () => {
        expect( md ).not.toBeNull();
        expect( md.fieldA ).not.toBeUndefined();
        expect( md ).toHaveProperty( 'fieldA' );
    } )

    it( 'should set the correct metadata for number', () => {
        expect( md.fieldA ).toHaveProperty( 'arg1' );
        expect( md.fieldA.arg1.index ).toBe( 1 );
        expect( md.fieldA.arg1.type ).toBe( 'Int' );
        expect( md.fieldA.arg1.nullable ).toBe( false );
    } );

    it( 'should set the correct metadata for boolean', () => {
        expect( md.fieldA ).toHaveProperty( 'arg2' );
        expect( md.fieldA.arg2.index ).toBe( 2 );
        expect( md.fieldA.arg2.type ).toBe( 'Boolean' );
        expect( md.fieldA.arg2.nullable ).toBe( false );
    } );

    it( 'should set the correct metadata for string', () => {
        expect( md.fieldA ).toHaveProperty( 'arg3' );
        expect( md.fieldA.arg3.index ).toBe( 3 );
        expect( md.fieldA.arg3.type ).toBe( 'String' );
        expect( md.fieldA.arg3.nullable ).toBe( false );
    } );

    it( 'should set set correct type if overloaded', () => {
        expect( md.fieldA ).toHaveProperty( 'arg4' );
        expect( md.fieldA.arg4.index ).toBe( 4 );
        expect( md.fieldA.arg4.type ).toBe( 'ID' );
        expect( md.fieldA.arg4.nullable ).toBe( false );
    } );

    it( 'should set set correct type for list', () => {
        expect( md.fieldA ).toHaveProperty( 'arg5' );
        expect( md.fieldA.arg5.index ).toBe( 5 );
        expect( md.fieldA.arg4.type ).toBe( 'ID' );
        expect( md.fieldA.arg5.nullable ).toBe( false );
        expect( md.fieldA.arg5.list ).toBe( true );
    } );

    it( 'should throw if arg is list and type was not explicitly specified', () => {
        expect( () => {
            class TypeB {
                fieldA(
                    src: any,
                    @Arg() arg1: number[]
                ) { }
            }
        } ).toThrowError();
    } );

    it( 'should correclty resolve type when using Class as an implicit type', () => {
        expect( md.fieldA ).toHaveProperty( 'arg6' );
        expect( md.fieldA.arg6.index ).toBe( 6 );
        expect( md.fieldA.arg6.type ).toBe( getMetaObject(TypeDef1).name );
        expect( md.fieldA.arg6.nullable ).toBe( false );
        expect( md.fieldA.arg6.list ).toBe( false );
    } );

    it( 'should correclty resolve type when using Class as an explicit type', () => {
        expect( md.fieldA ).toHaveProperty( 'arg7' );
        expect( md.fieldA.arg7.index ).toBe( 7 );
        expect( md.fieldA.arg7.type ).toBe( getMetaObject(TypeDef1).name );
        expect( md.fieldA.arg7.nullable ).toBe( false );
        expect( md.fieldA.arg7.list ).toBe( true );
    } );

    it( 'should correclty resolve type when using AeroGraphQL core Types as explicit type', () => {
        expect( md.fieldA ).toHaveProperty( 'arg8' );
        expect( md.fieldA.arg8.index ).toBe( 8 );
        expect( md.fieldA.arg8.type ).toBe( 'ID' );
        expect( md.fieldA.arg8.nullable ).toBe( false );
        expect( md.fieldA.arg8.list ).toBe( false );
    } );
} );
